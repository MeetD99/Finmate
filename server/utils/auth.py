import os
import secrets
from datetime import datetime, timedelta
from functools import wraps

import jwt
from flask import request, jsonify, g, current_app


def get_jwt_secret():
    return current_app.config.get('JWT_SECRET_KEY') or current_app.config.get('SECRET_KEY')


def create_access_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(seconds=current_app.config.get('JWT_ACCESS_TOKEN_EXPIRES', 900)),
        'iat': datetime.utcnow(),
        'type': 'access'
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm='HS256')


def create_refresh_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(seconds=current_app.config.get('JWT_REFRESH_TOKEN_EXPIRES', 604800)),
        'iat': datetime.utcnow(),
        'type': 'refresh'
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm='HS256')


def decode_token(token):
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        raise Exception('Token has expired')
    except jwt.InvalidTokenError:
        raise Exception('Invalid token')


def get_token_from_header():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    return auth_header.split(' ')[1]


def jwt_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_header()
        if not token:
            return jsonify({'detail': 'Missing authorization token'}), 401
        
        try:
            payload = decode_token(token)
            if payload.get('type') != 'access':
                return jsonify({'detail': 'Invalid token type'}), 401
            g.user_id = payload['user_id']
        except Exception as e:
            return jsonify({'detail': str(e)}), 401
        
        return f(*args, **kwargs)
    return decorated


def get_googleOAuth():
    from authlib.integrations.requests_client import OAuth2Session
    client_id = current_app.config.get('GOOGLE_CLIENT_ID')
    client_secret = current_app.config.get('GOOGLE_CLIENT_SECRET')
    redirect_uri = current_app.config.get('GOOGLE_REDIRECT_URI')
    
    if not client_id or not client_secret:
        raise Exception('Google OAuth not configured')
    
    session = OAuth2Session(client_id, client_secret, redirect_uri=redirect_uri)
    return session, client_id, client_secret, redirect_uri


def get_githubOAuth():
    client_id = current_app.config.get('GITHUB_CLIENT_ID')
    client_secret = current_app.config.get('GITHUB_CLIENT_SECRET')
    redirect_uri = current_app.config.get('GITHUB_REDIRECT_URI')
    
    if not client_id or not client_secret:
        raise Exception('GitHub OAuth not configured')
    
    return client_id, client_secret, redirect_uri