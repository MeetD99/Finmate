import os
from groq import Groq
from dotenv import load_dotenv, find_dotenv

doten_path = find_dotenv()
load_dotenv(dotenv_path=doten_path)

# --- Setup -----------------------------------------------------------
api_key = os.environ["GROQ_API_KEY"]
client = Groq(api_key=api_key)


# --- 1️⃣ RISK SCORING ENGINE ----------------------------------------
def calculate_risk_score(profile):
    """Compute numeric risk score (0–100) and category."""
    age, income = profile["age"], profile["income"]
    dependents, emi = profile["dependents"], profile["emi_burden"]
    growth = profile["growth"]

    score = 0

    # Age
    if age <= 25: score += 20
    elif age <= 35: score += 15
    elif age <= 45: score += 10
    elif age <= 60: score += 5

    # Income (₹)
    if income > 200000: score += 20
    elif income > 100000: score += 15
    elif income > 60000: score += 10
    elif income > 30000: score += 5

    # Dependents
    if dependents == 0: score += 20
    elif dependents == 1: score += 15
    elif dependents == 2: score += 10
    elif dependents == 3: score += 5

    # EMI burden %
    if emi < 15: score += 15
    elif emi < 30: score += 10
    elif emi < 50: score += 5

    # Growth preference
    if growth.lower() == "rapid": score += 20
    elif growth.lower() == "balanced": score += 10
    elif growth.lower() == "slow": score += 0

    # Classification
    if score <= 35:
        category = "Conservative"
        mix = {"low": 70, "medium": 25, "high": 5}
        drawdown = "≈5–10%"
    elif score <= 65:
        category = "Moderate"
        mix = {"low": 40, "medium": 40, "high": 20}
        drawdown = "≈10–20%"
    else:
        category = "Aggressive"
        mix = {"low": 20, "medium": 40, "high": 40}
        drawdown = "≈20–35%+"

    return {
        "score": score,
        "category": category,
        "mix": mix,
        "drawdown": drawdown
    }


# --- 2️⃣ PROMPT BUILDER ---------------------------------------------
def generate_risk_prompt(profile, risk_result):
    """Create structured prompt for FinMate Risk Advisor with enriched advice generation."""
    prompt = f"""
You are FinMate Risk Advisor — a professional financial guidance AI.

Your role: Analyze the user's profile and provide **comprehensive investment advice**
based on their **risk appetite category**, allocation mix, and financial context.

---

User Profile:
Age: {profile['age']}, Monthly Income: ₹{profile['income']}, Dependents: {profile['dependents']},
EMI Burden: {profile['emi_burden']}%, Employment: {profile['emp_type']},
Emergency Fund: {profile['emergency_fund']} months, Horizon: {profile['horizon']},
Volatility Tolerance: {profile['volatility']}, Growth Preference: {profile['growth']},
Goals: {profile.get('goals', 'Not specified')}, Current Investments: {profile.get('current_investments', 'Not specified')},
Insurance Coverage: {profile.get('insurance', 'Not specified')}, Tax Bracket: {profile.get('tax_bracket', 'Not specified')}

---

Risk Appetite Result:
Score: {risk_result['score']} / 100
Profile: {risk_result['category']}
Expected Max Drawdown: {risk_result['drawdown']}

Suggested Allocation:
Low Risk: {risk_result['mix']['low']}%
Medium Risk: {risk_result['mix']['medium']}%
High Risk: {risk_result['mix']['high']}%

---

Now generate a clear, detailed investment advisory message explaining:
1. Why the user's profile fits this risk category and typical investor behavior.
2. Recommended asset types for each risk bucket with rationale (e.g., FDs, Debt Funds, Index Funds, Smallcases, Crypto).
3. Tax efficiency, liquidity considerations, and inflation protection.
4. How to maintain discipline, rebalance periodically, and mitigate risks.
5. Align advice with stated goals and horizon.

Keep tone professional, actionable, and within 250 words.
"""
    return prompt


# --- 3️⃣ LLM CALLER -------------------------------------------------
def get_llm_advice(prompt):
    """Call Groq LLM for investment advice."""
    try:
        resp = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are FinMate Risk Advisor — an expert in portfolio strategy."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.6,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        return f"[Groq API Error] {e}"


# --- 4️⃣ MAIN DRIVER ------------------------------------------------
if __name__ == "__main__":
    # Example input
    user_profile = {
        "age": 30,
        "income": 120000,
        "dependents": 1,
        "emi_burden": 20,
        "emp_type": "Salaried",
        "emergency_fund": 4,
        "horizon": "Medium",
        "volatility": "Medium",
        "growth": "Rapid"
    }

    risk_result = calculate_risk_score(user_profile)
    prompt = generate_risk_prompt(user_profile, risk_result)

    print("---- Risk Profile ----")
    print(risk_result)
    print("\n---- Generated Advisory ----\n")
    print(get_llm_advice(prompt))
