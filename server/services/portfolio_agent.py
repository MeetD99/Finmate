"""
AI-Powered Portfolio Generation Agent
Generates personalized portfolios based on user profile
"""

import os
from groq import Groq
from services.portfolio_templates import (
    get_sample_portfolios, 
    calculate_portfolio_return,
    calculate_growth_trajectory,
    SAMPLE_PORTFOLIOS
)


def get_groq_client():
    return Groq(api_key=os.getenv("GROQ_API_KEY"))


def generate_personalized_portfolio(user_profile):
    """
    Generate a personalized portfolio based on user profile
    
    user_profile = {
        "monthly_surplus": int,
        "monthly_income": int,
        "age": int,
        "risk_score": int (1-100),
        "risk_category": str ("Conservative", "Moderate", "Aggressive"),
        "investment_goal": str,
        "time_horizon": str,
        "employment_type": str
    }
    """
    groq = get_groq_client()
    
    monthly_surplus = user_profile.get("monthly_surplus", 5000)
    risk_score = user_profile.get("risk_score", 50)
    risk_category = user_profile.get("risk_category", "Moderate")
    investment_goal = user_profile.get("investment_goal", "growth")
    time_horizon = user_profile.get("time_horizon", "3-5 years")
    age = user_profile.get("age", 25)
    
    # Base allocation on risk category
    risk_allocations = {
        "Conservative": {"low": 60, "mid": 30, "high": 10},
        "Moderate": {"low": 40, "mid": 35, "high": 25},
        "Aggressive": {"low": 20, "mid": 30, "high": 50}
    }
    
    allocation = risk_allocations.get(risk_category, risk_allocations["Moderate"])
    
    # Select assets based on risk and amount
    suggested_assets = select_assets_for_portfolio(
        risk_category=risk_category,
        monthly_amount=monthly_surplus,
        time_horizon=time_horizon,
        age=age
    )
    
    # Calculate expected return
    portfolio_return = calculate_weighted_return(suggested_assets)
    
    # Generate reasoning
    reasoning = generate_portfolio_reasoning(
        user_profile=user_profile,
        allocation=allocation,
        assets=suggested_assets,
        expected_return=portfolio_return
    )
    
    return {
        "type": "personalized",
        "name": f"Apna Portfolio",
        "tagline": "Aapke hisaab se banaaya",
        "monthly_investment": monthly_surplus,
        "allocation": allocation,
        "assets": suggested_assets,
        "expected_return": portfolio_return,
        "reasoning": reasoning,
        "risk_category": risk_category,
        "time_horizon": time_horizon,
        "growth_data": {
            "monthly_investment": monthly_surplus,
            "expected_return": portfolio_return,
            "yearly_projections": get_yearly_projections(monthly_surplus, portfolio_return)
        }
    }


def select_assets_for_portfolio(risk_category, monthly_amount, time_horizon, age):
    """Select appropriate assets based on profile"""
    
    # Indian asset database
    available_assets = {
        "low": [
            {"name": "PPF (Public Provident Fund)", "type": "govt", "return_rate": 7.1, "symbol": "PPF", "description": "Tax-free, 15 saal lock-in"},
            {"name": "HDFC Liquid Fund", "type": "mutual_fund", "return_rate": 6.5, "symbol": "HDFCLiq", "description": "Emergency fund best"},
            {"name": "SBI Liquid Fund", "type": "mutual_fund", "return_rate": 6.4, "symbol": "SBILiq", "description": "Low risk, quick withdrawal"},
            {"name": "Fixed Deposit", "type": "bank", "return_rate": 6.8, "symbol": "FD", "description": "Bank guaranteed"},
            {"name": "NPS (National Pension System)", "type": "govt", "return_rate": 9, "symbol": "NPS", "description": "Retirement planning"},
            {"name": "Sukanya Samriddhi", "type": "govt", "return_rate": 8.2, "symbol": "SSY", "description": "For daughters/children"},
        ],
        "mid": [
            {"name": "SBI Balanced Advantage Fund", "type": "mutual_fund", "return_rate": 11, "symbol": "SBIBal", "description": "Smart equity-debt mix"},
            {"name": "ICICI Prudential Balanced Advantage", "type": "mutual_fund", "return_rate": 11, "symbol": "ICICIBal", "description": "Market adaptive"},
            {"name": "HDFC Balanced Advantage Fund", "type": "mutual_fund", "return_rate": 12, "symbol": "HDFCBal", "description": "Large AUM, proven track"},
            {"name": "Mirae Asset Dynamic Bond Fund", "type": "mutual_fund", "return_rate": 8, "symbol": "MiraeBond", "description": "Debt fund, lower risk"},
            {"name": "Short Duration Fund", "type": "mutual_fund", "return_rate": 7.5, "symbol": "ShortDur", "description": "1-3 year debt"},
        ],
        "high": [
            {"name": "UTI Nifty 50 Index Fund", "type": "mutual_fund", "return_rate": 12, "symbol": "UTINifty", "description": "Nifty seedi, low cost"},
            {"name": "HDFC Nifty 50 Index Fund", "type": "mutual_fund", "return_rate": 12, "symbol": "HDFCNifty", "description": "Large cap index"},
            {"name": "Mirae Asset Large Cap Fund", "type": "mutual_fund", "return_rate": 14, "symbol": "MiraeLarge", "description": "Top 100 companies"},
            {"name": "Nippon India Mid Cap Fund", "type": "mutual_fund", "return_rate": 16, "symbol": "NipponMid", "description": "Mid-cap growth"},
            {"name": "Kotak Emerging Equity", "type": "mutual_fund", "return_rate": 16, "symbol": "KotakEmer", "description": "Emerging companies"},
            {"name": "HDFC Mid Cap Fund", "type": "mutual_fund", "return_rate": 15, "symbol": "HDFCMid", "description": "Quality mid-caps"},
            {"name": "Reliance Industries", "type": "stock", "return_rate": 12, "symbol": "RELIANCE", "description": "Diversified conglomerate"},
            {"name": "HDFC Bank", "type": "stock", "return_rate": 14, "symbol": "HDFCBANK", "description": "India ka largest bank"},
        ]
    }
    
    selected_assets = []
    
    # For beginners/students, always include some basics
    is_beginner = monthly_amount < 5000 or age < 25
    
    if risk_category == "Conservative":
        # 60-30-10 split
        low_assets = available_assets["low"][:3]
        mid_assets = available_assets["mid"][:2]
        high_assets = available_assets["high"][:1] if not is_beginner else []
        
        for i, asset in enumerate(low_assets):
            alloc = 40 if i == 0 else 30 if i == 1 else 20
            if i < len(low_assets):
                selected_assets.append({**asset, "allocation": alloc, "category": "low", "risk": "Kam"})
        
        for asset in mid_assets:
            selected_assets.append({**asset, "allocation": 20, "category": "mid", "risk": "Kam-zyaada"})
        
        if high_assets:
            selected_assets.append({**high_assets[0], "allocation": 10, "category": "high", "risk": "Jyaada"})
            
    elif risk_category == "Moderate":
        # 40-35-25 split
        low_assets = available_assets["low"][:2]
        mid_assets = available_assets["mid"][:3]
        high_assets = available_assets["high"][:2]
        
        for asset in low_assets:
            selected_assets.append({**asset, "allocation": 25, "category": "low", "risk": "Kam"})
        
        for asset in mid_assets:
            selected_assets.append({**asset, "allocation": 20, "category": "mid", "risk": "Kam-zyaada"})
        
        for asset in high_assets:
            selected_assets.append({**asset, "allocation": 15, "category": "high", "risk": "Jyaada"})
            
    else:  # Aggressive
        # 20-30-50 split
        low_assets = available_assets["low"][:1]
        mid_assets = available_assets["mid"][:2]
        high_assets = available_assets["high"][:4]
        
        for asset in low_assets:
            selected_assets.append({**asset, "allocation": 20, "category": "low", "risk": "Kam"})
        
        for asset in mid_assets:
            selected_assets.append({**asset, "allocation": 20, "category": "mid", "risk": "Kam-zyaada"})
        
        for i, asset in enumerate(high_assets):
            alloc = 20 if i == 0 else 15
            selected_assets.append({**asset, "allocation": alloc, "category": "high", "risk": "Jyaada"})
    
    return selected_assets


def calculate_weighted_return(assets):
    """Calculate portfolio's weighted average return"""
    total_alloc = sum(a["allocation"] for a in assets)
    weighted = sum((a["allocation"] / total_alloc) * a["return_rate"] for a in assets)
    return round(weighted, 1)


def generate_portfolio_reasoning(user_profile, allocation, assets, expected_return):
    """Generate AI explanation for the portfolio"""
    groq = get_groq_client()
    
    monthly = user_profile.get("monthly_surplus", 5000)
    risk = user_profile.get("risk_category", "Moderate")
    goal = user_profile.get("investment_goal", "growth")
    horizon = user_profile.get("time_horizon", "3-5 saal")
    
    prompt = f"""Generate a short, friendly explanation for why this portfolio was chosen.

User Profile:
- Monthly investable amount: ₹{monthly:,}
- Risk appetite: {risk}
- Goal: {goal}
- Time horizon: {horizon}
- Expected return: {expected_return}%

Portfolio Allocation:
- Low risk (secure): {allocation['low']}%
- Mid risk (balanced): {allocation['mid']}%
- High risk (growth): {allocation['high']}%

Write 2-3 sentences in Hinglish explaining:
1. Why this risk mix suits them
2. What makes this portfolio special for their goal
3. One encouraging sentence about starting

Keep it conversational and motivating. Max 50 words."""

    try:
        response = groq.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.8,
            max_tokens=150
        )
        return response.choices[0].message.content
    except:
        return f"Aapki profile ke hisaab se ye balanced portfolio banaya hai. ₹{monthly:,}/month ke saath aapka target achieve hoga!"


def get_yearly_projections(monthly_investment, return_rate, years_list=[1, 3, 5, 10, 15]):
    """Generate yearly growth projections"""
    projections = []
    
    for years in years_list:
        fv = calculate_growth_trajectory(monthly_investment, return_rate, years)
        invested = monthly_investment * 12 * years
        
        projections.append({
            "years": years,
            "label": f"{years} saal",
            "invested": invested,
            "value": fv,
            "gains": fv - invested,
            "multiplier": round(fv / invested, 1)
        })
    
    return projections


def explain_asset(asset_name, asset_type):
    """Get simple explanation for an asset"""
    groq = get_groq_client()
    
    explanations = {
        "PPF": "PPF (Public Provident Fund) - Government backed savings scheme with tax benefits. 15 saal ka lock-in hai but returns tax-free hote hain. Best for risk-free long-term saving!",
        "NPS": "NPS (National Pension System) - Retirement planning ka ek affordable option. Market mein invest hota hai but GoI regulated hai. 60% tax-free on maturity!",
        "Index Fund": "Index Fund ek mutual fund hai jo kisi index (jaise Nifty 50) ko follow karta hai. Aap stocks nahi, poore market mein invest karte ho. Low cost, hassle-free!",
        "SIP": "SIP (Systematic Investment Plan) - Monthly fixed amount invest karne ka tarika. Market ke highs aur lows smooth ho jaate hain. Compounding ka magic!",
        "Liquid Fund": "Liquid Fund ek debt mutual fund hai jo short-term mein invest karta hai. 1 din mein payout, bank FD se better returns. Emergency fund ke liye perfect!",
        "Balanced Fund": "Balanced Fund = Equity + Debt ka mix. Market girne par protect, chadne par participate. Moderate risk walo ke liye best!",
    }
    
    return explanations.get(asset_name, f"{asset_name} ek smart investment option hai. Aapke goals ke hisaab se choose karo!")


def get_investment_tip(risk_category, monthly_amount):
    """Get personalized investment tips"""
    groq = get_groq_client()
    
    tips_by_risk = {
        "Conservative": "Secure raho! PPF mein ₹2000 + SIP mein ₹1000 monthly shuru karo. Emergency fund pehle build karo.",
        "Moderate": "Balanced approach lo! Index fund mein SIP + some debt for stability. Monthly discipline key hai!",
        "Aggressive": "Growth mode on! Equity mein majority + some liquid for opportunities. Long-term thinking rakho!"
    }
    
    tips_by_amount = {
        "low": "₹500-1000/month se bhi shuru kar sakte ho. Mutual funds mein SIP minimum ₹500 se hoti hai!",
        "medium": "₹5000-10000/month solid foundation banata hai. Split across 2-3 funds for diversification.",
        "high": "₹15000+/month se proper portfolio bana sakte ho. Different asset classes explore karo!"
    }
    
    if monthly_amount < 5000:
        amount_tip = tips_by_amount["low"]
    elif monthly_amount < 15000:
        amount_tip = tips_by_amount["medium"]
    else:
        amount_tip = tips_by_amount["high"]
    
    return f"{tips_by_risk.get(risk_category, '')} {amount_tip}"