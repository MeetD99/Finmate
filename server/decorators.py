from functools import wraps
from flask import jsonify, g
from utils.auth import decode_token, get_token_from_header


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