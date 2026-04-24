from controllers import calculate_risk_score, generate_risk_prompt, get_llm_advice as _get_llm_advice, get_factor_adjustment
from controllers.llm.asset_recommendation import generate_assets
from models import db, RiskProfile, Transaction


def calculate_risk(profile):
    """Compute risk score and category."""
    return calculate_risk_score(profile)


def submit_risk_appetite(user_id, data):
    """Process risk appetite submission - stores profile and adjustment, NOT trim."""
    income = int(data['income'])

    age = int(data['age'])
    dependents = int(data['dependents'])
    emp_type = data['employment']
    ef_months = int(data['emergencyFund'])
    horizon = data['horizon']
    volatility = data['volatility']
    growth = data['growth']

    adjustments = get_factor_adjustment(
        age=age,
        income=income,
        emi_burden=0,
        dependents=dependents,
        emp_type=emp_type,
        ef_months=ef_months,
        horizon=horizon,
        volatility=volatility,
        growth=growth
    )

    profile = {
        'age': age,
        'income': income,
        'dependents': dependents,
        'emp_type': emp_type,
        'emergency_fund': int(data['emergencyFund']),
        'ef_months': ef_months,
        'horizon': horizon,
        'volatility': volatility,
        'growth': growth,
        'emi_burden': 0,
        'luxury': 0,
        'nonmandatory': 0
    }

    risk_result = calculate_risk_score(profile)
    risk_prompt = generate_risk_prompt(profile, risk_result)
    llm_advice = _get_llm_advice(risk_prompt)

    assets_prompt = generate_assets(profile, risk_result)
    assets_response = _get_llm_advice(assets_prompt)

    import re
    import json
    assets_data = None
    try:
        match = re.search(r'"chosen_assets":\s*\{.*?\}', assets_response, re.DOTALL)
        if match:
            json_str = '{' + match.group(0) + '}'
            assets_data = json.loads(json_str)
    except Exception:
        assets_data = None

    existing_profile = RiskProfile.query.filter_by(user_id=user_id).first()

    if existing_profile:
        existing_profile.age = age
        existing_profile.monthly_income = income
        existing_profile.emi_burden = 0
        existing_profile.dependants = dependents
        existing_profile.employment_type = 1 if emp_type == 'Salaried' else 2 if emp_type == 'Self-Employed' else 3
        existing_profile.risk_score = risk_result['score']
        existing_profile.risk_category = 1 if risk_result['category'] == 'Conservative' else 2 if risk_result['category'] == 'Moderate' else 3
        existing_profile.trim_adjustment = float(adjustments)
        risk_profile = existing_profile
    else:
        risk_profile = RiskProfile(
            user_id=user_id,
            age=age,
            monthly_income=income,
            emi_burden=0,
            dependants=dependents,
            employment_type=1 if emp_type == 'Salaried' else 2 if emp_type == 'Self-Employed' else 3,
            risk_score=risk_result['score'],
            risk_category=1 if risk_result['category'] == 'Conservative' else 2 if risk_result['category'] == 'Moderate' else 3,
            trim_adjustment=float(adjustments)
        )
        db.session.add(risk_profile)

    db.session.commit()

    return {
        'risk_result': risk_result,
        'llm_advice': llm_advice,
        'trim_adjustment': adjustments,
        'assets_data': assets_data,
        'risk_profile_id': risk_profile.risk_id
    }


def recalculate_portfolio_trim(user_id):
    """Recalculate and update portfolio trim based on user's transactions and stored adjustment."""
    from models import Portfolio
    from controllers import compute_trim as _compute_trim

    user_transactions = Transaction.query.filter_by(user_id=user_id).all()

    luxury_spending = 0
    nonmandatory_spending = 0

    for transaction in user_transactions:
        if transaction.type.value == "Withdraw":
            if transaction.category.value == "Luxury/Discretionary":
                luxury_spending += transaction.amount
            elif transaction.category.value == "Non-Mandatory":
                nonmandatory_spending += transaction.amount

    risk_profile = RiskProfile.query.filter_by(user_id=user_id).order_by(
        RiskProfile.created_at.desc()
    ).first()

    adjustments = risk_profile.trim_adjustment if risk_profile and risk_profile.trim_adjustment else 0

    income = risk_profile.monthly_income if risk_profile else 50000

    actual_trim_data = _compute_trim(luxury_spending, nonmandatory_spending, income, adjustments)

    existing_portfolio = Portfolio.query.filter_by(user_id=user_id).first()

    if existing_portfolio:
        existing_portfolio.surplus = int(actual_trim_data['total_trim'])
        existing_portfolio.luxury = int(actual_trim_data['luxury_trim_value'])
        existing_portfolio.non_mandatory = int(actual_trim_data['nonmand_trim_value'])
        existing_portfolio.l_trim = int(actual_trim_data['luxury_trim_value'])
        existing_portfolio.n_trim = int(actual_trim_data['nonmand_trim_value'])
        existing_portfolio.total = int(actual_trim_data['total_trim'])
        existing_portfolio.luxury_pct = float(actual_trim_data['luxury_trim_pct'])
        existing_portfolio.nonmand_pct = float(actual_trim_data['nonmand_trim_pct'])
        portfolio = existing_portfolio
    else:
        portfolio = Portfolio(
            user_id=user_id,
            category="Moderate",
            surplus=int(actual_trim_data['total_trim']),
            luxury=int(actual_trim_data['luxury_trim_value']),
            non_mandatory=int(actual_trim_data['nonmand_trim_value']),
            high=20,
            mid=30,
            low=50,
            l_trim=int(actual_trim_data['luxury_trim_value']),
            n_trim=int(actual_trim_data['nonmand_trim_value']),
            total=int(actual_trim_data['total_trim']),
            luxury_pct=float(actual_trim_data['luxury_trim_pct']),
            nonmand_pct=float(actual_trim_data['nonmand_trim_pct'])
        )
        db.session.add(portfolio)

    db.session.commit()

    return {
        'trim_data': actual_trim_data,
        'luxury_spending': luxury_spending,
        'nonmandatory_spending': nonmandatory_spending,
        'trim_adjustment': adjustments
    }