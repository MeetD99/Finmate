from flask import Blueprint, request, jsonify, session, redirect, g, current_app, url_for
from werkzeug.security import generate_password_hash, check_password_hash
import re
# import httpx  # Used by OAuth - enabled when OAuth is configured

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

from models import db, User
from decorators import jwt_required
from utils.auth import create_access_token, create_refresh_token, decode_token


def is_valid_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_registration(data):
    if not data or not all(k in data for k in ('name', 'email', 'password')):
        return False, 'Missing required fields'
    return True, None


def create_token_response(user):
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    
    user.refresh_token = refresh_token
    db.session.commit()
    
    response = jsonify(user.to_dict(include_risk_profile_status=True))
    response.set_cookie(
        'finmate_refresh',
        refresh_token,
        httponly=True,
        secure=True,
        samesite='Lax',
        max_age=604800
    )
    response.headers['Authorization'] = f'Bearer {access_token}'
    return response


@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        valid, error = validate_registration(data)
        if not valid:
            return jsonify({'detail': error}), 400

        name = data['name'].strip()
        email = data['email'].strip().lower()
        password = data['password']

        if not name or not email or not password:
            return jsonify({'detail': 'All fields are required'}), 400

        if len(name) < 2:
            return jsonify({'detail': 'Name must be at least 2 characters long'}), 400

        if not is_valid_email(email):
            return jsonify({'detail': 'Please enter a valid email address'}), 400

        if len(password) < 6:
            return jsonify({'detail': 'Password must be at least 6 characters long'}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({'detail': 'User with this email already exists'}), 400

        password_hash = generate_password_hash(password)
        new_user = User(
            name=name,
            email=email,
            password_hash=password_hash
        )

        db.session.add(new_user)
        db.session.commit()

        return create_token_response(new_user), 201

    except Exception as e:
        db.session.rollback()
        print(f"Registration error: {e}")
        return jsonify({'detail': 'Registration failed'}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()

        if not data or not all(k in data for k in ('email', 'password')):
            return jsonify({'detail': 'Email and password are required'}), 400

        email = data['email'].strip().lower()
        password = data['password']

        if not is_valid_email(email):
            return jsonify({'detail': 'Please enter a valid email address'}), 400

        user = User.query.filter_by(email=email).first()

        if not user or not user.password_hash or not check_password_hash(user.password_hash, password):
            return jsonify({'detail': 'Invalid email or password'}), 401

        return create_token_response(user), 200

    except Exception as e:
        print(f"Login error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'detail': 'Login failed'}), 500


@auth_bp.route('/logout', methods=['POST'])
def logout():
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if token:
            try:
                payload = decode_token(token)
                user = User.query.get(payload.get('user_id'))
                if user:
                    user.refresh_token = None
                    db.session.commit()
            except:
                pass
        
        response = jsonify({'message': 'Logged out successfully'})
        response.set_cookie('finmate_refresh', '', expires=0, path='/', samesite='Lax', secure=True)
        return response, 200
    except Exception as e:
        return jsonify({'detail': 'Logout failed'}), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required
def get_current_user():
    try:
        user = User.query.get(g.user_id)
        if not user:
            return jsonify({'detail': 'User not found'}), 404

        return jsonify(user.to_dict(include_risk_profile_status=True)), 200
    except Exception as e:
        return jsonify({'detail': 'Failed to get user info'}), 500


@auth_bp.route('/refresh', methods=['POST'])
def refresh_token():
    try:
        refresh_token = request.cookies.get('finmate_refresh')
        if not refresh_token:
            return jsonify({'detail': 'No refresh token'}), 401
        
        payload = decode_token(refresh_token)
        if payload.get('type') != 'refresh':
            return jsonify({'detail': 'Invalid token type'}), 401
        
        user = User.query.get(payload.get('user_id'))
        if not user or user.refresh_token != refresh_token:
            return jsonify({'detail': 'Invalid refresh token'}), 401
        
        access_token = create_access_token(user.id)
        
        response = jsonify({'access_token': access_token})
        response.headers['Authorization'] = f'Bearer {access_token}'
        return response, 200
    except Exception as e:
        return jsonify({'detail': 'Token refresh failed'}), 401


@auth_bp.route('/profile', methods=['PUT'])
@jwt_required
def update_profile():
    try:
        user = User.query.get(g.user_id)
        if not user:
            return jsonify({'detail': 'User not found'}), 404

        data = request.get_json()
        if not data:
            return jsonify({'detail': 'No data provided'}), 400

        if 'name' in data:
            name = data['name'].strip()
            if len(name) < 2:
                return jsonify({'detail': 'Name must be at least 2 characters'}), 400
            user.name = name

        if 'email' in data:
            email = data['email'].strip().lower()
            if not is_valid_email(email):
                return jsonify({'detail': 'Invalid email format'}), 400
            existing = User.query.filter_by(email=email).first()
            if existing and existing.id != g.user_id:
                return jsonify({'detail': 'Email already in use'}), 400
            user.email = email

        db.session.commit()
        return jsonify(user.to_dict(include_risk_profile_status=True)), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'detail': 'Failed to update profile'}), 500


@auth_bp.route('/password', methods=['PUT'])
@jwt_required
def update_password():
    try:
        user = User.query.get(g.user_id)
        if not user:
            return jsonify({'detail': 'User not found'}), 404

        data = request.get_json()
        if not data or not data.get('new_password'):
            return jsonify({'detail': 'New password required'}), 400

        new_password = data['new_password']
        if len(new_password) < 6:
            return jsonify({'detail': 'Password must be at least 6 characters'}), 400

        user.password_hash = generate_password_hash(new_password)
        db.session.commit()

        return jsonify({'message': 'Password updated successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'detail': 'Failed to update password'}), 500


# OAuth endpoints disabled - will be enabled later
# @auth_bp.route('/google', methods=['GET'])
# def google_oauth():
#     try:
#         from authlib.integrations.requests_client import OAuth2Session
#         client_id = current_app.config.get('GOOGLE_CLIENT_ID')
#         client_secret = current_app.config.get('GOOGLE_CLIENT_SECRET')
#         redirect_uri = current_app.config.get('GOOGLE_REDIRECT_URI')
        
#         if not client_id or not client_secret:
#             return jsonify({'detail': 'Google OAuth not configured'}), 500
        
#         oauth = OAuth2Session(client_id, client_secret, redirect_uri=redirect_uri)
#         authorization_url, state = oauth.authorize_url(
#             'https://accounts.google.com/o/oauth2/v2/auth',
#             scope='openid email profile',
#             prompt='select_account'
#         )
        
#         session['oauth_state'] = state
#         return redirect(authorization_url)
#     except Exception as e:
#         print(f"Google OAuth error: {e}")
#         return jsonify({'detail': 'Google OAuth failed'}), 500


# @auth_bp.route('/google/callback', methods=['GET'])
# def google_callback():
#     try:
#         from authlib.integrations.requests_client import OAuth2Session
#         from urllib.parse import parse_qs
        
#         client_id = current_app.config.get('GOOGLE_CLIENT_ID')
#         client_secret = current_app.config.get('GOOGLE_CLIENT_SECRET')
#         redirect_uri = current_app.config.get('GOOGLE_REDIRECT_URI')
        
#         code = request.args.get('code')
#         state = request.args.get('state')
        
#         if not code:
#             return jsonify({'detail': 'No code provided'}), 400
        
#         oauth = OAuth2Session(client_id, client_secret, redirect_uri=redirect_uri, state=state)
#         token = oauth.fetch_token(
#             'https://oauth2.googleapis.com/token',
#             code=code,
#             grants=['authorization_code']
#         )
        
#         resp = oauth.get('https://www.googleapis.com/oauth2/v2/userinfo')
#         user_info = resp.json()
        
#         email = user_info.get('email')
#         name = user_info.get('name', email.split('@')[0])
#         google_id = user_info.get('id')
        
#         user = User.query.filter_by(oauth_provider='google', oauth_provider_id=google_id).first()
        
#         if not user:
#             user = User.query.filter_by(email=email).first()
#             if user:
#                 if user.oauth_provider:
#                     return jsonify({'detail': 'Account already linked to another provider'}), 400
#                 user.oauth_provider = 'google'
#                 user.oauth_provider_id = google_id
#             else:
#                 user = User(
#                     name=name,
#                     email=email,
#                     oauth_provider='google',
#                     oauth_provider_id=google_id
#                 )
#                 db.session.add(user)
        
#         db.session.commit()
        
#         response = jsonify(user.to_dict(include_risk_profile_status=True))
#         access_token = create_access_token(user.id)
#         refresh_token = create_refresh_token(user.id)
        
#         user.refresh_token = refresh_token
#         db.session.commit()
        
#         response.set_cookie(
#             'finmate_refresh',
#             refresh_token,
#             httponly=True,
#             secure=True,
#             samesite='Lax',
#             max_age=604800
#         )
#         response.headers['Authorization'] = f'Bearer {access_token}'
        
#         frontend_url = current_app.config.get('FRONTEND_URL', 'https://finmate-sable.vercel.app')
#         return redirect(f'{frontend_url}?auth=success')
#     except Exception as e:
#         print(f"Google callback error: {e}")
#         import traceback
#         traceback.print_exc()
#         return jsonify({'detail': 'Google OAuth callback failed'}), 500


# @auth_bp.route('/github', methods=['GET'])
# def github_oauth():
#     try:
#         client_id = current_app.config.get('GITHUB_CLIENT_ID')
#         redirect_uri = current_app.config.get('GITHUB_REDIRECT_URI')
        
#         if not client_id:
#             return jsonify({'detail': 'GitHub OAuth not configured'}), 500
        
#         state = session.get('oauth_state') or 'randomstate'
        
#         authorization_url = (
#             f"https://github.com/login/oauth/authorize"
#             f"?client_id={client_id}"
#             f"&redirect_uri={redirect_uri}"
#             f"&scope=read:user user:email"
#             f"&state={state}"
#         )
        
#         return redirect(authorization_url)
#     except Exception as e:
#         print(f"GitHub OAuth error: {e}")
#         return jsonify({'detail': 'GitHub OAuth failed'}), 500


# @auth_bp.route('/github/callback', methods=['GET'])
# def github_callback():
#     try:
#         client_id = current_app.config.get('GITHUB_CLIENT_ID')
#         client_secret = current_app.config.get('GITHUB_CLIENT_SECRET')
#         redirect_uri = current_app.config.get('GITHUB_REDIRECT_URI')
        
#         code = request.args.get('code')
        
#         if not code:
#             return jsonify({'detail': 'No code provided'}), 400
        
#         token_response = httpx.post(
#             'https://github.com/login/oauth/access_token',
#             data={
#                 'client_id': client_id,
#                 'client_secret': client_secret,
#                 'code': code
#             },
#             headers={'Accept': 'application/json'}
#         )
#         token_data = token_response.json()
#         access_token = token_data.get('access_token')
        
#         if not access_token:
#             return jsonify({'detail': 'Failed to get access token'}), 400
        
#         user_response = httpx.get(
#             'https://api.github.com/user',
#             headers={'Authorization': f'token {access_token}'}
#         )
#         user_info = user_response.json()
        
#         email_response = httpx.get(
#             'https://api.github.com/user/emails',
#             headers={'Authorization': f'token {access_token}'}
#         )
#         emails = email_response.json()
#         primary_email = next((e['email'] for e in emails if e.get('primary')), emails[0]['email'] if emails else None)
        
#         github_id = str(user_info.get('id'))
#         name = user_info.get('name') or user_info.get('login')
#         email = primary_email
        
#         if not email:
#             return jsonify({'detail': 'Email not available from GitHub'}), 400
        
#         user = User.query.filter_by(oauth_provider='github', oauth_provider_id=github_id).first()
        
#         if not user:
#             user = User.query.filter_by(email=email).first()
#             if user:
#                 if user.oauth_provider:
#                     return jsonify({'detail': 'Account already linked to another provider'}), 400
#                 user.oauth_provider = 'github'
#                 user.oauth_provider_id = github_id
#             else:
#                 user = User(
#                     name=name,
#                     email=email,
#                     oauth_provider='github',
#                     oauth_provider_id=github_id
#                 )
#                 db.session.add(user)
        
#         db.session.commit()
        
#         access_token_jwt = create_access_token(user.id)
#         refresh_token_jwt = create_refresh_token(user.id)
        
#         user.refresh_token = refresh_token_jwt
#         db.session.commit()
        
#         response = jsonify(user.to_dict(include_risk_profile_status=True))
#         response.set_cookie(
#             'finmate_refresh',
#             refresh_token_jwt,
#             httponly=True,
#             secure=True,
#             samesite='Lax',
#             max_age=604800
#         )
#         response.headers['Authorization'] = f'Bearer {access_token_jwt}'
        
#         frontend_url = current_app.config.get('FRONTEND_URL', 'https://finmate-sable.vercel.app')
#         return redirect(f'{frontend_url}?auth=success')
#     except Exception as e:
#         print(f"GitHub callback error: {e}")
#         import traceback
#         traceback.print_exc()
#         return jsonify({'detail': 'GitHub OAuth callback failed'}), 500