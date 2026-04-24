from groq import Groq
import json
import re
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
def generate_risk_prompt(profile, risk_result, assets=None):
    """
    Create structured prompt for FinMate Risk Advisor with:
    - Assumptions & methodology transparency
    - Forecast instructions using provided asset classes (rate/vol/downsideVol/riskScore)
    - JSON plan that is machine-readable
    """
    # --- Helpers ---
    def fmt_inr(num):
        try:
            n = float(num)
            s = f"{int(n):,}"
            parts = s.split(",")
            if len(parts) > 3:
                first = "".join(parts[:-3])
                last3 = parts[-3:]
                s = f"{first},{last3[0]},{last3[1]},{last3[2]}"
            return f"₹{s}"
        except Exception:
            return f"₹{num}"

    def fmt_pct(x):
        try:
            return f"{float(x):.0f}%"
        except Exception:
            return f"{x}%"

    # --- Safe reads with defaults ---
    age = profile.get('age', 'NA')
    income = profile.get('income', 'NA')
    dependents = profile.get('dependents', 'NA')
    emi_burden = profile.get('emi_burden', 'NA')
    emp_type = profile.get('emp_type', 'NA')
    emergency_fund = profile.get('emergency_fund', 'NA')
    horizon = profile.get('horizon', 'NA')
    volatility = profile.get('volatility', 'NA')
    growth = profile.get('growth', 'NA')
    goals = profile.get('goals', 'Not specified')
    current_investments = profile.get('current_investments', 'Not specified')
    insurance = profile.get('insurance', 'Not specified')
    tax_bracket = profile.get('tax_bracket', 'Not specified')

    score = risk_result.get('score', 'NA')
    category = risk_result.get('category', 'NA')
    drawdown = risk_result.get('drawdown', 'NA')
    mix = risk_result.get('mix', {})
    low_mix = mix.get('low', 0)
    med_mix = mix.get('medium', 0)
    high_mix = mix.get('high', 0)

    # --- Inline catalog as JSON-like text for the model ---
    import json
    catalog_text = json.dumps(assets, indent=2)

    prompt = f"""
You are **FinMate Risk Advisor** — a professional financial guidance AI.

Your role: Analyze the user's profile and provide **comprehensive, India‑context investment advice**
strictly using the **asset catalog provided below**. Keep the narrative succinct (**≤ 250 words**).

---

**User Profile**
• Age: {age}  
• Monthly Income: {fmt_inr(income)}  
• Dependents: {dependents}  
• EMI Burden: {fmt_pct(emi_burden)}  
• Employment: {emp_type}  
• Emergency Fund: {emergency_fund} months  
• Horizon: {horizon}  
• Volatility Tolerance: {volatility}  
• Growth Preference: {growth}  
• Goals: {goals}  
• Current Investments: {current_investments}  
• Insurance Coverage: {insurance}  
• Tax Bracket: {tax_bracket}

---

**Risk Appetite Result**
• Score: {score} / 100  
• Profile: {category}  
• Expected Max Drawdown: {drawdown}  
• Suggested Allocation Mix — Low: {fmt_pct(low_mix)}, Medium: {fmt_pct(med_mix)}, High: {fmt_pct(high_mix)}

---

**ASSET CATALOG (use only these assets; do not add others)**
{catalog_text}

Each object has fields:  
• `rate` = expected annualized return (CAGR, pre‑tax, illustrative)  
• `vol` = annualized volatility (σ)  
• `downsideVol` = annualized downside deviation (σ−)  
• `riskScore` = relative risk (1–4)

---

**What to deliver (structure & constraints)**
Markdown Summary (≤ 250 words)
1. Why the user's profile fits this risk category + typical investor behavior.  
2. Recommended assets within each bucket (LOW/MID/HIGH) from the catalog with rationale tied to horizon/goals.  
3. Tax efficiency, liquidity, and inflation protection (high level; do not quote statutory rates).  
4. Discipline: SIPs, rebalancing cadence (e.g., annual or drift ±5%), diversification, position sizing, downside controls.  
5. **Assumptions & methodology used** to produce forecasts (compounding, pre/post‑tax treatment, inflation anchor, fees, data gaps).

**Important**
• Educational guidance only; not personalized financial advice. Consult a licensed advisor for decisions.  
• Use **only** assets from the catalog; do not invent instruments or platforms.  
• If data is missing/conflicting, explicitly state assumptions and keep suggestions conservative.
"""
    return prompt

# --- 2️⃣ PROMPT BUILDER ---------------------------------------------
def generate_assets(profile, risk_result, assets=None):
    """
    Create structured prompt for FinMate Risk Advisor with:
    - Assumptions & methodology transparency
    - Forecast instructions using provided asset classes (rate/vol/downsideVol/riskScore)
    - JSON plan that is machine-readable
    """

    # --- Default ASSET CATALOG (editable via param) ---
    DEFAULT_ASSETS = {
    "LOW": [
        {"index": "a", "label": "Fixed Deposit (FD)", "rate": 0.067, "notes": "Bank Deposits", "vol": 0.03, "downsideVol": 0.02, "riskScore": 1},
        {"index": "b", "label": "Recurring Deposit (RD)", "rate": 0.065, "notes": "Bank Deposits", "vol": 0.03, "downsideVol": 0.02, "riskScore": 1},
    ],
    "MID": [
        {"index": "c", "label": "Short Duration Fund (1–3 yrs)", "rate": 0.09, "notes": "Debt Fund", "vol": 0.07, "downsideVol": 0.05, "riskScore": 2},
        {"index": "d", "label": "Medium Duration Fund (3–5 yrs)", "rate": 0.095, "notes": "Debt Fund", "vol": 0.08, "downsideVol": 0.06, "riskScore": 2},
        {"index": "e", "label": "Long Duration Fund (>5 yrs)", "rate": 0.10, "notes": "Debt Fund", "vol": 0.09, "downsideVol": 0.07, "riskScore": 2},
    ],
    "HIGH": [
        {"index": "f", "label": "S&P 500 Index Fund", "rate": 0.14, "notes": "Index Fund", "vol": 0.18, "downsideVol": 0.14, "riskScore": 3},
        {"index": "g", "label": "Nifty 50 Index Fund", "rate": 0.16, "notes": "Index Fund", "vol": 0.20, "downsideVol": 0.16, "riskScore": 3},
        {"index": "h", "label": "Nifty 500 Index Fund", "rate": 0.15, "notes": "Index Fund", "vol": 0.22, "downsideVol": 0.17, "riskScore": 3},
        {"index": "i", "label": "Nifty Next 50 Index Fund", "rate": 0.18, "notes": "Index Fund", "vol": 0.28, "downsideVol": 0.22, "riskScore": 3},
        {"index": "j", "label": "Large-Cap Fund", "rate": 0.15, "notes": "Equity MF", "vol": 0.20, "downsideVol": 0.16, "riskScore": 3},
        {"index": "k", "label": "Mid-Cap Fund", "rate": 0.25, "notes": "Equity MF", "vol": 0.30, "downsideVol": 0.24, "riskScore": 3},
        {"index": "l", "label": "Small-Cap Fund", "rate": 0.30, "notes": "Equity MF", "vol": 0.35, "downsideVol": 0.28, "riskScore": 3},
        {"index": "m", "label": "Flexi-Cap Fund", "rate": 0.17, "notes": "Equity MF", "vol": 0.22, "downsideVol": 0.18, "riskScore": 3},
        {"index": "n", "label": "Multi-Cap Fund", "rate": 0.18, "notes": "Equity MF", "vol": 0.24, "downsideVol": 0.19, "riskScore": 3},
        {"index": "o", "label": "Thematic / Sectoral", "rate": 0.20, "notes": "Smallcase", "vol": 0.28, "downsideVol": 0.22, "riskScore": 3},
        {"index": "p", "label": "Momentum", "rate": 0.18, "notes": "Smallcase", "vol": 0.25, "downsideVol": 0.20, "riskScore": 3},
        {"index": "q", "label": "Bitcoin (BTC)", "rate": 1.50, "notes": "Crypto (illustrative)", "vol": 1.00, "downsideVol": 0.80, "riskScore": 4},
        {"index": "r", "label": "Altcoins", "rate": 1.00, "notes": "Crypto (illustrative)", "vol": 1.20, "downsideVol": 1.00, "riskScore": 4},
     ],
    }


    assets = assets or DEFAULT_ASSETS

    # --- Helpers ---
    def fmt_inr(num):
        try:
            n = float(num)
            s = f"{int(n):,}"
            parts = s.split(",")
            if len(parts) > 3:
                first = "".join(parts[:-3])
                last3 = parts[-3:]
                s = f"{first},{last3[0]},{last3[1]},{last3[2]}"
            return f"₹{s}"
        except Exception:
            return f"₹{num}"

    def fmt_pct(x):
        try:
            return f"{float(x):.0f}%"
        except Exception:
            return f"{x}%"

    # --- Safe reads with defaults ---
    age = profile.get('age', 'NA')
    income = profile.get('income', 'NA')
    dependents = profile.get('dependents', 'NA')
    emi_burden = profile.get('emi_burden', 'NA')
    emp_type = profile.get('emp_type', 'NA')
    emergency_fund = profile.get('emergency_fund', 'NA')
    horizon = profile.get('horizon', 'NA')
    volatility = profile.get('volatility', 'NA')
    growth = profile.get('growth', 'NA')
    goals = profile.get('goals', 'Not specified')
    current_investments = profile.get('current_investments', 'Not specified')
    insurance = profile.get('insurance', 'Not specified')
    tax_bracket = profile.get('tax_bracket', 'Not specified')

    score = risk_result.get('score', 'NA')
    category = risk_result.get('category', 'NA')
    drawdown = risk_result.get('drawdown', 'NA')
    mix = risk_result.get('mix', {})
    low_mix = mix.get('low', 0)
    med_mix = mix.get('medium', 0)
    high_mix = mix.get('high', 0)

    # --- Inline catalog as JSON-like text for the model ---
    import json
    catalog_text = json.dumps(assets, indent=2)

    prompt = f"""
You are **FinMate Risk Advisor** — a professional financial guidance AI.

Your role: Analyze the user's profile and provide **comprehensive, India‑context investment advice**
strictly using the **asset catalog provided below**. Keep the narrative succinct (**≤ 250 words**).

---

**User Profile**
• Age: {age}  
• Monthly Income: {fmt_inr(income)}  
• Dependents: {dependents}  
• EMI Burden: {fmt_pct(emi_burden)}  
• Employment: {emp_type}  
• Emergency Fund: {emergency_fund} months  
• Horizon: {horizon}  
• Volatility Tolerance: {volatility}  
• Growth Preference: {growth}  
• Goals: {goals}  
• Current Investments: {current_investments}  
• Insurance Coverage: {insurance}  
• Tax Bracket: {tax_bracket}

---

**Risk Appetite Result**
• Score: {score} / 100  
• Profile: {category}  
• Expected Max Drawdown: {drawdown}  
• Suggested Allocation Mix — Low: {fmt_pct(low_mix)}, Medium: {fmt_pct(med_mix)}, High: {fmt_pct(high_mix)}

---

**ASSET CATALOG (use only these assets; do not add others)**
{catalog_text}

Each object has fields:  
• `rate` = expected annualized return (CAGR, pre‑tax, illustrative)  
• `vol` = annualized volatility (σ)  
• `downsideVol` = annualized downside deviation (σ−)  
• `riskScore` = relative risk (1–4)

---

**What to deliver (structure & constraints)**

  "chosen_assets": {{
    "LOW": ["index from catalog"],
    "MID": ["index from catalog"],
    "HIGH": ["index from catalog"]
  }} combined into a single string in output


**Important**
• Educational guidance only; not personalized financial advice. Consult a licensed advisor for decisions.  
• Use **only** assets from the catalog; do not invent instruments or platforms.  
• If data is missing/conflicting, explicitly state assumptions and keep suggestions conservative.
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
    prompt2=generate_assets(user_profile,risk_result)

    print("---- Risk Profile ----")
    print(risk_result)
    print("\n---- Generated Advisory ----\n")
    print(get_llm_advice(prompt))

    pattern = r'"chosen_assets"\s*:\s*\{[\s\S]*?\}'
    match = re.search(pattern, get_llm_advice(prompt2))
    if match:
     extracted = match.group(0).strip()
    print(extracted)
