from flask import Blueprint, request, jsonify, session

risk_bp = Blueprint('risk', __name__, url_prefix='/api')

from models import db, RiskProfile, Transaction, TransactionType, TransactionCategory
from services.risk_service import calculate_risk, submit_risk_appetite
from services.trim_service import run_pipeline, get_factor_adjustment, compute_trim


@risk_bp.route('/risk-profile', methods=['POST'])
def create_risk_profile():
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'detail': 'Not authenticated'}), 401

        data = request.get_json()
        required_fields = ['age', 'monthly_income', 'emi_burden', 'dependants', 'employment_type', 'risk_score', 'risk_category']

        if not data or not all(k in data for k in required_fields):
            return jsonify({'detail': 'Missing required fields'}), 400

        existing_profile = RiskProfile.query.filter_by(user_id=user_id).first()
        if existing_profile:
            return jsonify({'detail': 'Risk profile already exists for this user'}), 400

        new_profile = RiskProfile(
            user_id=user_id,
            age=data['age'],
            monthly_income=data['monthly_income'],
            emi_burden=data['emi_burden'],
            dependants=data['dependants'],
            employment_type=data['employment_type'],
            risk_score=data['risk_score'],
            risk_category=data['risk_category']
        )

        db.session.add(new_profile)
        db.session.commit()

        return jsonify(new_profile.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'detail': 'Failed to create risk profile'}), 500


@risk_bp.route('/risk-profile', methods=['GET'])
def get_risk_profile():
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'detail': 'Not authenticated'}), 401

        profile = RiskProfile.query.filter_by(user_id=user_id).first()
        if not profile:
            return jsonify({'detail': 'Risk profile not found'}), 404

        return jsonify(profile.to_dict()), 200

    except Exception as e:
        return jsonify({'detail': 'Failed to get risk profile'}), 500


@risk_bp.route('/risk-appetite/submit', methods=['POST'])
def submit_risk_appetite_route():
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'detail': 'Not authenticated'}), 401

        data = request.get_json()
        required_fields = ['age', 'income', 'dependents', 'employment', 'emergencyFund', 'horizon', 'volatility', 'growth']

        if not data or not all(k in data for k in required_fields):
            return jsonify({'detail': 'Missing required fields'}), 400

        result = submit_risk_appetite(user_id, data)
        return jsonify(result), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'detail': f'Failed to process risk appetite: {str(e)}'}), 500