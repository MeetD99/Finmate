from flask import Blueprint, request, jsonify, session
from datetime import datetime
import pandas as pd

upload_bp = Blueprint('upload', __name__, url_prefix='/api')

from models import db, Transaction, TransactionType, TransactionCategory, Summary
from services.transaction_service import categorize_transaction


@upload_bp.route('/upload-excel', methods=['POST'])
def upload_excel():
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'detail': 'Not authenticated'}), 401

        if 'file' not in request.files:
            return jsonify({'detail': 'No file uploaded'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'detail': 'No file selected'}), 400

        if not (file.filename.endswith('.xlsx') or file.filename.endswith('.xls')):
            return jsonify({'detail': 'Only Excel files (.xlsx, .xls) are allowed'}), 400

        try:
            df = pd.read_excel(file)
        except Exception as e:
            return jsonify({'detail': f'Error reading Excel file: {str(e)}'}), 400

        required_columns = ['Date', 'Description', 'Withdrawal', 'Deposit', 'Balance']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return jsonify({
                'detail': f'Missing required columns: {", ".join(missing_columns)}. Required columns: {", ".join(required_columns)}'
            }), 400

        categorized_transactions = []
        total_spending = 0
        total_income = 0
        opening_balance = 0
        current_month = None
        current_year = None

        df_sorted = df.sort_values('Date')

        for index, row in df_sorted.iterrows():
            try:
                description = str(row['Description']).strip()
                transaction_date = pd.to_datetime(row['Date']).date()

                withdrawal = float(row['Withdrawal']) if pd.notna(row['Withdrawal']) else 0.0
                deposit = float(row['Deposit']) if pd.notna(row['Deposit']) else 0.0
                balance = float(row['Balance']) if pd.notna(row['Balance']) else 0.0

                if index == df_sorted.index[0]:
                    opening_balance = balance - deposit + withdrawal

                if withdrawal > 0:
                    transaction_type = "Withdraw"
                    amount = withdrawal
                elif deposit > 0:
                    transaction_type = "Deposit"
                    amount = deposit
                else:
                    continue

                categorization = categorize_transaction(description)
                category = categorization['category']
                confidence = categorization['confidence']
                justification = categorization['justification']

                if transaction_type == "Withdraw":
                    total_spending += amount
                else:
                    total_income += amount

                if current_month is None:
                    current_month = transaction_date.strftime('%B')
                    current_year = str(transaction_date.year)

                transaction_data = {
                    'description': description,
                    'amount': amount,
                    'type': transaction_type,
                    'date': transaction_date.isoformat(),
                    'category': category,
                    'confidence': confidence,
                    'justification': justification,
                    'withdrawal': withdrawal,
                    'deposit': deposit,
                    'balance': balance
                }

                categorized_transactions.append(transaction_data)

            except Exception as e:
                print(f"[Upload Warning] Skipping row {index}: {str(e)}")
                continue

        if not categorized_transactions:
            return jsonify({'detail': 'No valid transactions found in the file'}), 400

        total_savings = (opening_balance + total_income) - total_spending

        saved_transactions = []
        for trans_data in categorized_transactions:
            try:
                new_transaction = Transaction(
                    user_id=user_id,
                    desc=trans_data['description'],
                    amount=int(trans_data['amount']),
                    type=TransactionType(trans_data['type']),
                    date=datetime.strptime(trans_data['date'], '%Y-%m-%d').date(),
                    category=TransactionCategory(trans_data['category'])
                )

                db.session.add(new_transaction)
                db.session.flush()

                saved_transactions.append({
                    'transaction_id': new_transaction.transaction_id,
                    'description': trans_data['description'],
                    'amount': trans_data['amount'],
                    'type': trans_data['type'],
                    'date': trans_data['date'],
                    'category': trans_data['category'],
                    'confidence': trans_data['confidence'],
                    'justification': trans_data['justification'],
                    'withdrawal': trans_data['withdrawal'],
                    'deposit': trans_data['deposit'],
                    'balance': trans_data['balance']
                })

            except Exception as e:
                print(f"[Upload Warning] Failed to save transaction: {str(e)}")
                continue

        summary_data = None
        try:
            existing_summary = Summary.query.filter_by(
                user_id=user_id,
                month=current_month,
                year=current_year
            ).first()

            if existing_summary:
                existing_summary.spending = int(total_spending)
                existing_summary.savings = int(total_savings)
                summary_data = existing_summary.to_dict()
            else:
                new_summary = Summary(
                    user_id=user_id,
                    month=current_month,
                    year=current_year,
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
                'month': current_month,
                'year': current_year
            }

        db.session.commit()

        try:
            from services.risk_service import recalculate_portfolio_trim
            trim_result = recalculate_portfolio_trim(user_id)
        except Exception as e:
            print(f"[Upload Warning] Failed to recalculate trim: {str(e)}")
            trim_result = None

        return jsonify({
            'message': 'File processed successfully',
            'transactions': saved_transactions,
            'summary': summary_data,
            'trim': trim_result,
            'statistics': {
                'total_transactions': len(saved_transactions),
                'total_spending': int(total_spending),
                'total_income': int(total_income),
                'opening_balance': int(opening_balance),
                'total_savings': int(total_savings),
                'savings_calculation': f'({int(opening_balance)} + {int(total_income)}) - {int(total_spending)} = {int(total_savings)}',
                'month': current_month,
                'year': current_year
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'detail': f'Error processing file: {str(e)}'}), 500