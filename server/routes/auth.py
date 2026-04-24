from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
import re

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

from models import db, User


def is_valid_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_registration(data):
    if not data or not all(k in data for k in ('name', 'email', 'password')):
        return False, 'Missing required fields'
    return True, None


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

        return jsonify(new_user.to_dict(include_risk_profile_status=True)), 201

    except Exception as e:
        db.session.rollback()
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

        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({'detail': 'Invalid email or password'}), 401

        session['user_id'] = user.id
        session['user_email'] = user.email

        return jsonify(user.to_dict(include_risk_profile_status=True)), 200

    except Exception as e:
        print(f"Login error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'detail': 'Login failed'}), 500


@auth_bp.route('/logout', methods=['POST'])
def logout():
    try:
        session.clear()
        response = jsonify({'message': 'Logged out successfully'})
        response.set_cookie('session', '', expires=0, path='/', samesite='Lax', secure=False)
        return response, 200
    except Exception as e:
        return jsonify({'detail': 'Logout failed'}), 500


@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'detail': 'Not authenticated'}), 401

        user = User.query.get(user_id)
        if not user:
            return jsonify({'detail': 'User not found'}), 404

        return jsonify(user.to_dict(include_risk_profile_status=True)), 200
    except Exception as e:
        return jsonify({'detail': 'Failed to get user info'}), 500


@auth_bp.route('/profile', methods=['PUT'])
def update_profile():
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'detail': 'Not authenticated'}), 401

        user = User.query.get(user_id)
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
            if existing and existing.id != user_id:
                return jsonify({'detail': 'Email already in use'}), 400
            user.email = email
            session['user_email'] = email

        db.session.commit()
        return jsonify(user.to_dict(include_risk_profile_status=True)), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'detail': 'Failed to update profile'}), 500


@auth_bp.route('/password', methods=['PUT'])
def update_password():
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'detail': 'Not authenticated'}), 401

        user = User.query.get(user_id)
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