from flask import Blueprint, request, jsonify, session
from services.asset_agent import get_asset_suggestions, get_fallback_suggestions, generate_asset_explanation

assets_bp = Blueprint('assets', __name__, url_prefix='/api/assets')


@assets_bp.route('/suggestions', methods=['GET'])
def get_suggestions():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'detail': 'Not authenticated'}), 401
    
    try:
        category = request.args.get('category', 'Moderate')
        surplus = request.args.get('surplus', 5000)
        
        try:
            surplus = int(surplus)
        except ValueError:
            surplus = 5000
        
        suggestions = get_asset_suggestions(category, surplus)
        
        return jsonify(suggestions), 200
    
    except Exception as e:
        fallback = get_fallback_suggestions()
        return jsonify(fallback), 200


@assets_bp.route('/explanation', methods=['GET'])
def get_explanation():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'detail': 'Not authenticated'}), 401
    
    try:
        category = request.args.get('category', 'Moderate')
        surplus = request.args.get('surplus', 5000)
        
        try:
            surplus = int(surplus)
        except ValueError:
            surplus = 5000
        
        explanation = generate_asset_explanation(category, surplus)
        
        return jsonify({'explanation': explanation}), 200
    
    except Exception as e:
        return jsonify({'explanation': 'Consistency is key to building wealth!'}), 200