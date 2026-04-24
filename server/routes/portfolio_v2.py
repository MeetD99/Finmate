"""
Portfolio API Routes
Handles sample portfolios, personalized portfolios, and growth calculations
"""

from flask import Blueprint, request, jsonify, session
import os
from groq import Groq

from services.portfolio_templates import (
    get_sample_portfolios,
    get_sample_portfolio,
    get_portfolio_for_surplus,
    calculate_portfolio_return,
    get_growth_data
)
from services.portfolio_agent import (
    generate_personalized_portfolio,
    get_investment_tip,
    explain_asset,
    get_yearly_projections
)
from models import db, User, RiskProfile, Portfolio, Summary

portfolio_bp = Blueprint('portfolio_v2', __name__, url_prefix='/api/portfolio')

# Live stock price imports
from services.asset_agent import get_stock_price


def get_user_profile(user_id):
    """Get user's financial profile"""
    risk_profile = RiskProfile.query.filter_by(user_id=user_id).order_by(
        RiskProfile.created_at.desc()
    ).first()
    
    portfolio = Portfolio.query.filter_by(user_id=user_id).order_by(
        Portfolio.created_at.desc()
    ).first()
    
    summary = Summary.query.filter_by(user_id=user_id).order_by(
        Summary.year.desc(), Summary.month.desc()
    ).first()
    
    income = (summary.spending + summary.savings) if summary and summary.spending else 50000
    
    monthly_surplus = 0
    if portfolio and portfolio.surplus:
        monthly_surplus = portfolio.surplus
    elif summary and summary.savings:
        monthly_surplus = int(summary.savings * 0.2)
    
    risk_categories = {1: "Conservative", 2: "Moderate", 3: "Aggressive"}
    
    return {
        "age": risk_profile.age if risk_profile else 25,
        "monthly_income": income,
        "monthly_surplus": monthly_surplus,
        "risk_score": risk_profile.risk_score if risk_profile else 50,
        "risk_category": risk_categories.get(risk_profile.risk_category, "Moderate") if risk_profile else "Moderate",
        "investment_goal": "growth",
        "time_horizon": "3-5 saal"
    }


@portfolio_bp.route('/samples', methods=['GET'])
def get_all_samples():
    """Get all sample portfolios"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'detail': 'Not authenticated'}), 401
    
    try:
        user_profile = get_user_profile(user_id)
        surplus = user_profile.get('monthly_surplus', 5000)
        
        samples = get_sample_portfolios()
        result = []
        
        for slug, portfolio in samples.items():
            portfolio_return = calculate_portfolio_return(portfolio)
            
            result.append({
                "slug": slug,
                "name": portfolio["name"],
                "tagline": portfolio["tagline"],
                "description": portfolio["description"],
                "min_surplus": portfolio["min_surplus"],
                "max_surplus": portfolio["max_surplus"],
                "risk_level": portfolio["risk_level"],
                "time_horizon": portfolio["time_horizon"],
                "ideal_for": portfolio["ideal_for"],
                "allocation": portfolio["allocation"],
                "assets": portfolio["assets"],
                "expected_return": portfolio_return,
                "is_recommended": portfolio["min_surplus"] <= surplus <= portfolio["max_surplus"]
            })
        
        return jsonify({
            "samples": result,
            "user_surplus": surplus
        }), 200
        
    except Exception as e:
        print(f"Error fetching samples: {e}")
        return jsonify({'detail': 'Failed to fetch portfolios'}), 500


@portfolio_bp.route('/sample/<slug>', methods=['GET'])
def get_sample(slug):
    """Get a specific sample portfolio"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'detail': 'Not authenticated'}), 401
    
    try:
        portfolio = get_sample_portfolio(slug)
        if not portfolio:
            return jsonify({'detail': 'Portfolio not found'}), 404
        
        user_profile = get_user_profile(user_id)
        surplus = user_profile.get('monthly_surplus', 5000)
        portfolio_return = calculate_portfolio_return(portfolio)
        
        growth_data = get_growth_data(surplus, portfolio)
        
        return jsonify({
            "type": "sample",
            "slug": slug,
            "name": portfolio["name"],
            "tagline": portfolio["tagline"],
            "description": portfolio["description"],
            "allocation": portfolio["allocation"],
            "assets": portfolio["assets"],
            "expected_return": portfolio_return,
            "risk_level": portfolio["risk_level"],
            "time_horizon": portfolio["time_horizon"],
            "growth_data": growth_data,
            "tip": get_investment_tip(
                user_profile.get('risk_category', 'Moderate'),
                surplus
            )
        }), 200
        
    except Exception as e:
        print(f"Error fetching sample: {e}")
        return jsonify({'detail': 'Failed to fetch portfolio'}), 500


@portfolio_bp.route('/personalize', methods=['POST'])
def get_personalized():
    """Generate personalized portfolio for user"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'detail': 'Not authenticated'}), 401
    
    try:
        user_profile = get_user_profile(user_id)
        
        data = request.get_json() or {}
        
        # Override with user preferences if provided
        if 'monthly_investment' in data:
            user_profile['monthly_surplus'] = data['monthly_investment']
        if 'risk_category' in data:
            user_profile['risk_category'] = data['risk_category']
        if 'goal' in data:
            user_profile['investment_goal'] = data['goal']
        if 'horizon' in data:
            user_profile['time_horizon'] = data['horizon']
        
        # Generate personalized portfolio
        personalized = generate_personalized_portfolio(user_profile)
        
        return jsonify(personalized), 200
        
    except Exception as e:
        print(f"Error generating portfolio: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'detail': 'Failed to generate portfolio'}), 500


@portfolio_bp.route('/growth', methods=['GET'])
def get_growth():
    """Calculate growth trajectory"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'detail': 'Not authenticated'}), 401
    
    try:
        monthly = request.args.get('monthly', type=int, default=5000)
        return_rate = request.args.get('rate', type=float, default=10.0)
        years = request.args.get('years', default='1,3,5,10,15')
        
        years_list = [int(y.strip()) for y in years.split(',')]
        
        projections = get_yearly_projections(monthly, return_rate, years_list)
        
        return jsonify({
            "monthly_investment": monthly,
            "expected_return": return_rate,
            "projections": projections
        }), 200
        
    except Exception as e:
        return jsonify({'detail': 'Failed to calculate growth'}), 500


@portfolio_bp.route('/prices', methods=['GET'])
def get_live_prices():
    """Get live prices for common Indian stocks"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'detail': 'Not authenticated'}), 401
    
    try:
        symbols = request.args.get('symbols', 'RELIANCE,HDFCBANK,TCS,INFY,SBIN')
        symbol_list = [s.strip() for s in symbols.split(',')]
        
        prices = {}
        for symbol in symbol_list:
            price_data = get_stock_price(symbol)
            if price_data:
                prices[symbol] = {
                    "price": f"₹{price_data['price']:.2f}",
                    "change": price_data['change'],
                    "change_pct": price_data['change_pct']
                }
        
        return jsonify({"prices": prices}), 200
        
    except Exception as e:
        return jsonify({'detail': 'Failed to fetch prices'}), 500


@portfolio_bp.route('/explain/<asset_name>', methods=['GET'])
def explain(asset_name):
    """Explain an asset in simple terms"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'detail': 'Not authenticated'}), 401
    
    try:
        explanation = explain_asset(asset_name, request.args.get('type', 'mutual_fund'))
        return jsonify({"explanation": explanation}), 200
        
    except Exception as e:
        return jsonify({'explanation': f"{asset_name} is a great investment option!"}), 200


@portfolio_bp.route('/save', methods=['POST'])
def save_portfolio():
    """Save selected portfolio for user"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'detail': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        
        portfolio_type = data.get('type')  # 'sample' or 'personalized'
        slug = data.get('slug')
        assets = data.get('assets', [])
        allocation = data.get('allocation', {})
        expected_return = data.get('expected_return', 10)
        
        total = sum(a.get('allocation', 0) for a in assets)
        
        portfolio = Portfolio.query.filter_by(user_id=user_id).first()
        
        if portfolio:
            portfolio.category = slug or 'custom'
            portfolio.surplus = data.get('monthly_investment', 5000)
            portfolio.luxury = allocation.get('low', 50)
            portfolio.non_mandatory = allocation.get('mid', 30)
            portfolio.high = allocation.get('high', 20)
            portfolio.luxury_pct = allocation.get('low', 50)
            portfolio.nonmand_pct = allocation.get('mid', 30)
            portfolio.chosen_assets = assets
        else:
            portfolio = Portfolio(
                user_id=user_id,
                category=slug or 'custom',
                surplus=data.get('monthly_investment', 5000),
                luxury=allocation.get('low', 50),
                non_mandatory=allocation.get('mid', 30),
                high=allocation.get('high', 20),
                luxury_pct=allocation.get('low', 50),
                nonmand_pct=allocation.get('mid', 30),
                chosen_assets=assets
            )
            db.session.add(portfolio)
        
        db.session.commit()
        
        return jsonify({
            "message": "Portfolio saved successfully!",
            "portfolio_id": portfolio.id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error saving portfolio: {e}")
        return jsonify({'detail': 'Failed to save portfolio'}), 500


@portfolio_bp.route('/current', methods=['GET'])
def get_current():
    """Get user's saved portfolio"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'detail': 'Not authenticated'}), 401
    
    try:
        portfolio = Portfolio.query.filter_by(user_id=user_id).order_by(
            Portfolio.created_at.desc()
        ).first()
        
        if not portfolio:
            # Return recommended based on profile
            user_profile = get_user_profile(user_id)
            recommended = get_portfolio_for_surplus(user_profile['monthly_surplus'])
            return jsonify({
                "has_saved": False,
                "recommended": recommended
            }), 200
        
        return jsonify({
            "has_saved": True,
            "portfolio": {
                "id": portfolio.id,
                "category": portfolio.category,
                "surplus": portfolio.surplus,
                "allocation": {
                    "low": portfolio.luxury or 50,
                    "mid": portfolio.non_mandatory or 30,
                    "high": portfolio.high or 20
                },
                "assets": portfolio.chosen_assets,
                "created_at": portfolio.created_at.isoformat()
            }
        }), 200
        
    except Exception as e:
        return jsonify({'detail': 'Failed to fetch portfolio'}), 500