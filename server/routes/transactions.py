from flask import Blueprint, request, jsonify, session
from datetime import datetime

transactions_bp = Blueprint('transactions', __name__, url_prefix='/api/transactions')

from models import db, Transaction, TransactionType, TransactionCategory


@transactions_bp.route('', methods=['POST'])
def create_transaction():
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'detail': 'Not authenticated'}), 401

        data = request.get_json()
        required_fields = ['desc', 'amount', 'type', 'date', 'category']

        if not data or not all(k in data for k in required_fields):
            return jsonify({'detail': 'Missing required fields'}), 400

        if data['type'] not in [t.value for t in TransactionType]:
            return jsonify({'detail': 'Invalid transaction type'}), 400

        if data['category'] not in [c.value for c in TransactionCategory]:
            return jsonify({'detail': 'Invalid transaction category'}), 400

        new_transaction = Transaction(
            user_id=user_id,
            desc=data['desc'],
            amount=data['amount'],
            type=TransactionType(data['type']),
            date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
            category=TransactionCategory(data['category'])
        )

        db.session.add(new_transaction)
        db.session.commit()

        return jsonify(new_transaction.to_dict()), 201

    except ValueError:
        return jsonify({'detail': 'Invalid date format. Use YYYY-MM-DD'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'detail': 'Failed to create transaction'}), 500


@transactions_bp.route('', methods=['GET'])
def get_transactions():
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'detail': 'Not authenticated'}), 401

        transactions = Transaction.query.filter_by(user_id=user_id).order_by(Transaction.date.desc()).all()
        return jsonify([t.to_dict() for t in transactions]), 200

    except Exception as e:
        return jsonify({'detail': 'Failed to get transactions'}), 500