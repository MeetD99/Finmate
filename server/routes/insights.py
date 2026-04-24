from flask import Blueprint, jsonify, session
import json
from groq import Groq
import os

insights_bp = Blueprint('insights', __name__, url_prefix='/api')


@insights_bp.route('/dashboard/insights', methods=['GET'])
def get_dashboard_insights():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'detail': 'Authentication required'}), 401

    try:
        from models import Summary, Portfolio

        latest_summary = Summary.query.filter_by(user_id=user_id).order_by(Summary.year.desc(), Summary.month.desc()).first()
        portfolio = Portfolio.query.filter_by(user_id=user_id).order_by(Portfolio.created_at.desc()).first()

        spending = latest_summary.spending if latest_summary else 0
        savings = latest_summary.savings if latest_summary else 0
        surplus = portfolio.surplus if portfolio else 0
        luxury_pct = portfolio.luxury_pct if portfolio else 50
        nonmand_pct = portfolio.nonmand_pct if portfolio else 50
        month = latest_summary.month if latest_summary else "Recent"
        risk_category = portfolio.category if portfolio else "Moderate"
        chosen_assets = portfolio.chosen_assets if portfolio and portfolio.chosen_assets else "Savings, FD"

        groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

        prompt = f"""
User Financial Profile for {month}:
- Monthly Spending: ₹{spending}
- Monthly Savings: ₹{savings}
- Investable Surplus: ₹{surplus}
- Risk Profile: {risk_category}
- Luxury Savings Target: {luxury_pct}% (target % to save from luxury expenses)
- Non-Mandatory Savings Target: {nonmand_pct}% (target % to save from non-essential expenses)
- Target Assets: {chosen_assets}

CONTEXT: The savings targets are POSITIVE wealth-building goals - not 'waste' to cut. A 50% target means the user wants to save half of that expense category by reducing unnecessary spending. Higher trim = more aggressive saving goal.

Generate 3 short, actionable insights:
1. One about progress toward savings targets (positive framing)
2. One actionable suggestion to hit targets faster
3. One projection/goal insight about their surplus growth potential

Output ONLY JSON array with keys: "type" (saving/alert/goal), "text" (max 12 words), "time" ("Just now").
"""

        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are a professional financial intelligence bot returning raw JSON output."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )

        content = json.loads(response.choices[0].message.content)
        insights = content.get("insights", content) if isinstance(content, dict) else content
        if isinstance(insights, dict) and not isinstance(insights, list):
            if "insights" in insights:
                insights = insights["insights"]
            else:
                insights = list(insights.values())

        return jsonify(insights if isinstance(insights, list) else [content]), 200

    except Exception as e:
        return jsonify([
            {"id": 1, "type": "saving", "text": "Your budget is stabilizing.", "time": "Just now"},
            {"id": 2, "type": "alert", "text": "Review fixed utility bills.", "time": "Just now"},
            {"id": 3, "type": "goal", "text": "Your surplus leads to results.", "time": "Just now"}
        ]), 200


@insights_bp.route('/knowledge/learning-plan', methods=['GET'])
def get_learning_plan():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'detail': 'Authentication required'}), 401

    try:
        from models import Portfolio

        portfolio = Portfolio.query.filter_by(user_id=user_id).order_by(Portfolio.created_at.desc()).first()

        risk_category = portfolio.category if portfolio else "Moderate"
        chosen_assets = portfolio.chosen_assets if portfolio and portfolio.chosen_assets else ["Savings", "Mutual Funds", "FD"]
        surplus = portfolio.surplus if portfolio else 5000

        groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

        prompt = f"""
        CONTEXT SYSTEM:
        User's Financial Profile: {risk_category}
        Suggested Assets to Learn: {json.dumps(chosen_assets)}
        Investable Monthly Surplus: ₹{surplus}

        TASK:
        Create a customized 4-step progressive learning plan (Step 1 to Step 4).
        JSON SCHEMA (Array of 4 objects):
        - "step": integer (1, 2, 3, or 4)
        - "title": "Catchy name for the milestone"
        - "description": "10-word hook explaining the objective"
        - "content": "2 detailed paragraphs explaining the strategy + 1 specific Pro Tip"
        - "target": "The name of the asset being studied"

        Return ONLY the raw JSON array.
        """

        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are a professional financial education bot returning raw JSON output."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )

        content = json.loads(response.choices[0].message.content)
        plan = content.get("plan", content) if isinstance(content, dict) else content
        if isinstance(content, dict) and not isinstance(plan, list):
            if "steps" in content:
                plan = content["steps"]
            elif "learning_plan" in content:
                plan = content["learning_plan"]
            else:
                plan = list(content.values())

        return jsonify(plan if isinstance(plan, list) else []), 200

    except Exception as e:
        return jsonify([
            {"step": 1, "title": "Budget Foundations", "description": "Mastering surplus tracking.", "content": "Start by identifying your mandatory expenses vs luxury leakages.", "target": "Savings"},
            {"step": 2, "title": "Index Fund Basics", "description": "Understanding diversified market exposure.", "content": "Index funds track the market.", "target": "Mutual Funds"},
            {"step": 3, "title": "Risk Mitigation", "description": "Balancing equity with safe debt.", "content": "Ensure liquidity for corrections.", "target": "Fixed Income"},
            {"step": 4, "title": "Strategy Review", "description": "Evaluating portfolio performance.", "content": "Check allocation every 6 months.", "target": "Strategy"}
        ]), 200