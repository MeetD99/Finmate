from flask import Blueprint, request, jsonify, session
from sqlalchemy import extract
import calendar

summary_bp = Blueprint('summary', __name__, url_prefix='/api/summary')

from models import db, Summary


@summary_bp.route('', methods=['POST'])
def create_summary():
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'detail': 'Not authenticated'}), 401

        data = request.get_json()
        required_fields = ['month', 'year', 'spending', 'savings']

        if not data or not all(k in data for k in required_fields):
            return jsonify({'detail': 'Missing required fields'}), 400

        existing_summary = Summary.query.filter_by(
            user_id=user_id,
            month=data['month'],
            year=data['year']
        ).first()

        if existing_summary:
            return jsonify({'detail': 'Summary already exists for this month and year'}), 400

        new_summary = Summary(
            user_id=user_id,
            month=data['month'],
            year=data['year'],
            spending=data['spending'],
            savings=data['savings']
        )

        db.session.add(new_summary)
        db.session.commit()

        return jsonify(new_summary.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'detail': 'Failed to create summary'}), 500


@summary_bp.route('', methods=['GET'])
def get_summaries():
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'detail': 'Not authenticated'}), 401

        summaries = Summary.query.filter_by(user_id=user_id).order_by(Summary.year.desc(), Summary.month.desc()).all()
        return jsonify([s.to_dict() for s in summaries]), 200

    except Exception as e:
        return jsonify({'detail': 'Failed to get summaries'}), 500


@summary_bp.route('/chart-data', methods=['GET'])
def get_chart_data():
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'detail': 'Not authenticated'}), 401

        summaries = Summary.query.filter_by(user_id=user_id).order_by(Summary.year.asc(), Summary.month.asc()).all()

        month_order = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December']

        def get_month_number(month_name):
            try:
                return month_order.index(month_name)
            except ValueError:
                return 0

        summaries_sorted = sorted(summaries, key=lambda s: (int(s.year), get_month_number(s.month)))

        chart_data = []
        for summary in summaries_sorted:
            month_abbr = summary.month[:3] if len(summary.month) > 3 else summary.month

            chart_data.append({
                'month': month_abbr,
                'savings': summary.savings,
                'spendings': summary.spending
            })

        return jsonify(chart_data), 200

    except Exception as e:
        return jsonify({'detail': 'Failed to get chart data'}), 500