from flask import Blueprint, request, jsonify, session
from datetime import datetime
from collections import defaultdict

expenses_bp = Blueprint('expenses', __name__, url_prefix='/api/expenses')

from models import db, Expense


def get_user_id():
    user_id = session.get('user_id')
    if not user_id:
        user_id = request.args.get('user_id', type=int)
    return user_id


@expenses_bp.route('', methods=['POST'])
def create_expense():
    try:
        user_id = get_user_id()
        data = request.get_json()
        required_fields = ['amount', 'description', 'type', 'date']

        if not data or not all(k in data for k in required_fields):
            return jsonify({'detail': 'Missing required fields'}), 400

        if data['type'] not in ['credit', 'debit']:
            return jsonify({'detail': 'Invalid expense type. Must be credit or debit'}), 400

        try:
            expense_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'detail': 'Invalid date format. Use YYYY-MM-DD'}), 400

        new_expense = Expense(
            user_id=user_id or 0,
            amount=data['amount'],
            description=data['description'],
            type=data['type'],
            date=expense_date
        )

        db.session.add(new_expense)
        db.session.commit()

        return jsonify(new_expense.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'detail': 'Failed to create expense'}), 500


@expenses_bp.route('', methods=['GET'])
def get_expenses():
    try:
        user_id = get_user_id()
        if not user_id:
            return jsonify({'detail': 'User ID required. Provide user_id parameter or login.'}), 400

        expenses = Expense.query.filter_by(user_id=user_id).order_by(Expense.date.desc()).all()
        return jsonify([e.to_dict() for e in expenses]), 200

    except Exception as e:
        return jsonify({'detail': 'Failed to get expenses'}), 500


@expenses_bp.route('/grouped', methods=['GET'])
def get_expenses_grouped():
    try:
        user_id = get_user_id()
        if not user_id:
            return jsonify({'detail': 'User ID required. Provide user_id parameter or login.'}), 400

        expenses = Expense.query.filter_by(user_id=user_id).order_by(Expense.date.desc()).all()

        grouped = defaultdict(list)
        for expense in expenses:
            date_str = expense.date.isoformat()
            year_month = date_str[:7]
            month_name = expense.date.strftime('%B %Y')
            grouped[month_name].append(expense.to_dict())

        result = []
        for month_name in sorted(grouped.keys(), key=lambda x: datetime.strptime(x, '%B %Y'), reverse=True):
            result.append({
                'month': month_name,
                'transactions': grouped[month_name]
            })

        return jsonify(result), 200

    except Exception as e:
        return jsonify({'detail': 'Failed to get grouped expenses'}), 500


@expenses_bp.route('/<int:expense_id>', methods=['PUT'])
def update_expense(expense_id):
    try:
        user_id = get_user_id()
        if not user_id:
            return jsonify({'detail': 'User ID required'}), 400

        expense = Expense.query.filter_by(id=expense_id, user_id=user_id).first()
        if not expense:
            return jsonify({'detail': 'Expense not found'}), 404

        data = request.get_json()

        if 'amount' in data:
            expense.amount = data['amount']
        if 'description' in data:
            expense.description = data['description']
        if 'type' in data:
            if data['type'] not in ['credit', 'debit']:
                return jsonify({'detail': 'Invalid expense type'}), 400
            expense.type = data['type']
        if 'date' in data:
            try:
                expense.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'detail': 'Invalid date format. Use YYYY-MM-DD'}), 400

        db.session.commit()
        return jsonify(expense.to_dict()), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'detail': 'Failed to update expense'}), 500


@expenses_bp.route('/<int:expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    try:
        user_id = get_user_id()
        if not user_id:
            return jsonify({'detail': 'User ID required'}), 400

        expense = Expense.query.filter_by(id=expense_id, user_id=user_id).first()
        if not expense:
            return jsonify({'detail': 'Expense not found'}), 404

        db.session.delete(expense)
        db.session.commit()
        return jsonify({'message': 'Expense deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'detail': 'Failed to delete expense'}), 500


@expenses_bp.route('/import-to-transactions', methods=['POST'])
def import_to_transactions():
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'detail': 'Not authenticated. Login required to import.'}), 401

        from models import Transaction, TransactionType, TransactionCategory, Summary
        from services.transaction_service import categorize_transaction

        data = request.get_json()
        if not data or 'expense_ids' not in data:
            return jsonify({'detail': 'Missing expense_ids'}), 400

        expenses = Expense.query.filter(
            Expense.id.in_(data['expense_ids']),
            Expense.user_id == user_id
        ).all()

        if not expenses:
            return jsonify({'detail': 'No valid expenses found'}), 404

        imported = []
        total_spending = 0
        total_income = 0
        
        for expense in expenses:
            transaction_type_str = 'Deposit' if expense.type == 'credit' else 'Withdraw'
            transaction_type = TransactionType.DEPOSIT if expense.type == 'credit' else TransactionType.WITHDRAW
            
            if transaction_type_str == 'Withdraw':
                total_spending += expense.amount
            else:
                total_income += expense.amount
            
            try:
                cat_result = categorize_transaction(expense.description)
                if cat_result and 'category' in cat_result:
                    category_name = cat_result['category']
                    category_value = cat_result['category']
                    confidence = cat_result.get('confidence', 0.8)
                    justification = cat_result.get('justification', '')
                    try:
                        category = TransactionCategory(category_name)
                    except ValueError:
                        category = TransactionCategory.ADJUSTMENT
                else:
                    category = TransactionCategory.ADJUSTMENT
                    category_value = 'Adjustment'
                    confidence = 0.0
                    justification = ''
            except Exception:
                category = TransactionCategory.ADJUSTMENT
                category_value = 'Adjustment'
                confidence = 0.0
                justification = ''
            
            transaction = Transaction(
                user_id=user_id,
                desc=expense.description,
                amount=expense.amount,
                type=transaction_type,
                date=expense.date,
                category=category
            )
            db.session.add(transaction)
            
            imported.append({
                'description': expense.description,
                'amount': expense.amount,
                'type': transaction_type_str,
                'date': expense.date.isoformat(),
                'category': category_value,
                'confidence': confidence,
                'justification': justification
            })

        db.session.commit()
        
        total_savings = total_income - total_spending
        import_month = expenses[0].date.strftime('%B')
        import_year = str(expenses[0].date.year)
        
        summary_data = None
        try:
            existing_summary = Summary.query.filter_by(
                user_id=user_id,
                month=import_month,
                year=import_year
            ).first()

            if existing_summary:
                existing_summary.spending = int(total_spending)
                existing_summary.savings = int(total_savings)
                summary_data = existing_summary.to_dict()
            else:
                new_summary = Summary(
                    user_id=user_id,
                    month=import_month,
                    year=import_year,
                    spending=int(total_spending),
                    savings=int(total_savings)
                )
                db.session.add(new_summary)
                db.session.flush()
                summary_data = new_summary.to_dict()

        except Exception as e:
            summary_data = {
                'error': 'Failed to create summary',
                'spending': int(total_spending),
                'savings': int(total_savings),
                'month': import_month,
                'year': import_year
            }

        db.session.commit()
        
        trim_result = None
        try:
            from services.risk_service import recalculate_portfolio_trim
            trim_result = recalculate_portfolio_trim(user_id)
        except Exception as e:
            print(f"[Import Warning] Failed to recalculate trim: {str(e)}")
        
        return jsonify({
            'message': f'Successfully imported {len(imported)} transactions',
            'imported': imported,
            'summary': summary_data,
            'trim': trim_result,
            'statistics': {
                'month': import_month,
                'year': import_year,
                'total_spending': total_spending,
                'total_savings': total_savings,
                'total_transactions': len(imported)
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'detail': f'Failed to import transactions: {str(e)}'}), 500