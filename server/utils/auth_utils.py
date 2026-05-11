import jwt
import datetime
from functools import wraps
from flask import request, jsonify, current_app
from models import User

def generate_token(user_id):
    """Generate JWT token for user"""
    payload = {
        'user_id': user_id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(seconds=current_app.config['JWT_ACCESS_TOKEN_EXPIRES'])
    }
    return jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')

def verify_token(token):
    """Verify JWT token and return user_id if valid"""
    try:
        payload = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None  # Token expired
    except jwt.InvalidTokenError:
        return None  # Invalid token

def token_required(f):
    """Decorator to require valid JWT token for route access"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'detail': 'Token is missing'}), 401
        
        if token.startswith('Bearer '):
            token = token[7:]
        
        user_id = verify_token(token)
        if not user_id:
            return jsonify({'detail': 'Token is invalid or expired'}), 401
        
        current_user = User.query.get(user_id)
        if not current_user:
            return jsonify({'detail': 'User not found'}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated