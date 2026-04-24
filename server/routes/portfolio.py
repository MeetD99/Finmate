from flask import Blueprint, request, jsonify, session
import calendar
from sqlalchemy import extract

portfolio_bp = Blueprint('portfolio', __name__, url_prefix='/api/portfolio')

from models import db, Portfolio, Summary, Transaction


@portfolio_bp.route('', methods=['POST'])
def create_portfolio():
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'detail': 'Not authenticated'}), 401

        data = request.get_json()
        required_fields = ['surplus', 'luxury', 'total', 'non_mandatory', 'high', 'mid', 'low', 'l_trim', 'n_trim']

        if not data or not all(k in data for k in required_fields):
            return jsonify({'detail': 'Missing required fields'}), 400

        new_portfolio = Portfolio(
            user_id=user_id,
            surplus=data['surplus'],
            luxury=data['luxury'],
            total=data['total'],
            non_mandatory=data['non_mandatory'],
            high=data['high'],
            mid=data['mid'],
            low=data['low'],
            l_trim=data['l_trim'],
            n_trim=data['n_trim']
        )

        db.session.add(new_portfolio)
        db.session.commit()

        return jsonify(new_portfolio.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'detail': 'Failed to create portfolio'}), 500


@portfolio_bp.route('', methods=['GET'])
def get_portfolio():
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'detail': 'Not authenticated'}), 401

        portfolio = Portfolio.query.filter_by(user_id=user_id).first()
        if not portfolio:
            return jsonify({'message': 'No portfolio found', 'portfolio': None}), 200

        return jsonify(portfolio.to_dict()), 200

    except Exception as e:
        return jsonify({'detail': 'Failed to get portfolio'}), 500


@portfolio_bp.route('', methods=['PUT'])
def update_portfolio():
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'detail': 'Not authenticated'}), 401

        data = request.get_json()
        if not data:
            return jsonify({'detail': 'No data provided'}), 400

        portfolio = Portfolio.query.filter_by(user_id=user_id).first()
        if not portfolio:
            return jsonify({'detail': 'Portfolio not found'}), 404

        if 'category' in data:
            portfolio.category = data['category']
        if 'surplus' in data:
            portfolio.surplus = int(data['surplus'])
        if 'high' in data:
            portfolio.high = int(data['high'])
        if 'mid' in data:
            portfolio.mid = int(data['mid'])
        if 'low' in data:
            portfolio.low = int(data['low'])
        if 'chosen_assets' in data:
            portfolio.chosen_assets = data['chosen_assets']

        db.session.commit()

        return jsonify(portfolio.to_dict()), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'detail': 'Failed to update portfolio'}), 500


@portfolio_bp.route('/trim', methods=['PUT'])
def update_portfolio_trim():
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'detail': 'Not authenticated'}), 401

        data = request.get_json()
        if not data or 'luxury_pct' not in data or 'nonmand_pct' not in data:
            return jsonify({'detail': 'Missing trim percentages'}), 400

        portfolio = Portfolio.query.filter_by(user_id=user_id).first()
        if not portfolio:
            return jsonify({'detail': 'Portfolio not found'}), 404

        luxury_pct = float(data['luxury_pct'])
        nonmand_pct = float(data['nonmand_pct'])

        from controllers import compute_trim

        original_luxury = portfolio.l_trim / (portfolio.luxury_pct / 100) if portfolio.luxury_pct and portfolio.luxury_pct > 0 else 0
        original_nonmand = portfolio.n_trim / (portfolio.nonmand_pct / 100) if portfolio.nonmand_pct and portfolio.nonmand_pct > 0 else 0

        new_l_trim = int(original_luxury * (luxury_pct / 100))
        new_n_trim = int(original_nonmand * (nonmand_pct / 100))
        new_total = new_l_trim + new_n_trim

        portfolio.luxury_pct = luxury_pct
        portfolio.nonmand_pct = nonmand_pct
        portfolio.l_trim = new_l_trim
        portfolio.n_trim = new_n_trim
        portfolio.surplus = new_total
        portfolio.total = new_total

        db.session.commit()
        return jsonify(portfolio.to_dict()), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'detail': 'Failed to update trim settings'}), 500


@portfolio_bp.route('/history', methods=['GET'])
def get_portfolio_history():
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'detail': 'Not authenticated'}), 401

        summaries = Summary.query.filter_by(user_id=user_id).order_by(Summary.year.desc(), Summary.month.desc()).all()
        return jsonify([s.to_dict() for s in summaries]), 200

    except Exception as e:
        return jsonify({'detail': 'Failed to fetch history'}), 500


@portfolio_bp.route('/history/<month>/<year>', methods=['GET'])
def get_monthly_details(month, year):
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'detail': 'Not authenticated'}), 401

        try:
            month_num = list(calendar.month_name).index(month)
        except ValueError:
            try:
                month_num = list(calendar.month_abbr).index(month)
            except ValueError:
                return jsonify({'detail': 'Invalid month name'}), 400

        transactions = Transaction.query.filter(
            Transaction.user_id == user_id,
            extract('month', Transaction.date) == month_num,
            extract('year', Transaction.date) == int(year)
        ).all()

        summary = Summary.query.filter_by(
            user_id=user_id,
            month=month,
            year=year
        ).first()

        if not summary and not transactions:
            return jsonify({'detail': 'Data not found for this period'}), 404

        return jsonify({
            'statistics': {
                'month': month,
                'year': year,
                'total_spending': summary.spending if summary else 0,
                'total_savings': summary.savings if summary else 0,
                'total_transactions': len(transactions)
            },
            'transactions': [t.to_dict() for t in transactions]
        }), 200

    except Exception as e:
        return jsonify({'detail': 'Failed to fetch monthly details'}), 500