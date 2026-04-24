from flask import Blueprint, request, jsonify, session
from services.chat_service import (
    process_chat_message,
    get_chat_history,
    clear_chat_history
)

chat_bp = Blueprint('chat', __name__, url_prefix='/api/chat')


@chat_bp.route('/history', methods=['GET'])
def get_chat_history_route():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'detail': 'Not authenticated'}), 401
    
    try:
        limit = request.args.get('limit', 20, type=int)
        chats = get_chat_history(user_id, limit=limit)
        return jsonify(chats), 200
    except Exception as e:
        return jsonify({'detail': 'Failed to fetch history'}), 500


@chat_bp.route('/query', methods=['POST'])
def send_query():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'detail': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        user_query = data.get('query', '').strip()
        
        if not user_query:
            return jsonify({'detail': 'Query is required'}), 400
        
        result = process_chat_message(user_id, user_query)
        
        return jsonify({
            'query': user_query,
            'response': result['response'],
            'context_used': result.get('context_used', False)
        }), 200
    
    except Exception as e:
        print(f"Chat error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'query': data.get('query', ''),
            'response': "I apologize, but I encountered an error. Please try again."
        }), 200


@chat_bp.route('/clear', methods=['POST'])
def clear_history():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'detail': 'Not authenticated'}), 401
    
    try:
        success = clear_chat_history(user_id)
        if success:
            return jsonify({'message': 'Chat history cleared'}), 200
        else:
            return jsonify({'detail': 'Failed to clear history'}), 500
    except Exception as e:
        return jsonify({'detail': str(e)}), 500


@chat_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'service': 'chat'}), 200