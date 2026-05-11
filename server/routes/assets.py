from flask import Blueprint, request, jsonify
from services.asset_agent import get_asset_suggestions, get_fallback_suggestions, generate_asset_explanation
from utils.auth_utils import token_required

assets_bp = Blueprint('assets', __name__, url_prefix='/api/assets')


@assets_bp.route('/suggestions', methods=['GET'])
@token_required
def get_suggestions(current_user):
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
@token_required
def get_explanation(current_user):
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