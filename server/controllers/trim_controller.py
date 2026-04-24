import os
from dotenv import load_dotenv, find_dotenv
from groq import Groq

doten_path = find_dotenv()
load_dotenv(dotenv_path=doten_path)

# --- Setup -----------------------------------------------------------
api_key = os.environ["GROQ_API_KEY"]
client = Groq(api_key=api_key)
# ------------------- PHASE 1: FACTOR TABLES -------------------

def get_factor_adjustment(age, income, emi_burden, dependents, emp_type, ef_months, horizon, volatility, growth):
    """Return cumulative % adjustment based on profile."""

    adj = 0

    # ---- Age ----
    if 18 <= age <= 25: adj += 10
    elif 26 <= age <= 35: adj += 5
    elif 36 <= age <= 45: adj += 0
    elif 46 <= age <= 60: adj -= 5
    else: adj -= 10

    # ---- Income ----
    if income < 30000: adj -= 10
    elif income < 60000: adj -= 5
    elif income < 100000: adj += 0
    elif income < 200000: adj += 5
    else: adj += 10

    # ---- EMI Burden ----
    if emi_burden > 50: adj -= 15
    elif emi_burden > 30: adj -= 10
    elif emi_burden >= 15: adj += 0
    else: adj += 10

    # ---- Dependents ----
    if dependents == 0: adj += 10
    elif dependents <= 2: adj += 5
    else: adj -= 5

    # ---- Employment ----
    if emp_type.lower() == "self-employed": adj -= 5

    # ---- Emergency Fund ----
    if ef_months < 3: adj -= 10
    elif ef_months <= 6: adj += 0
    else: adj += 5

    # ---- Horizon ----
    if horizon.lower() == "short": adj -= 10
    elif horizon.lower() == "long": adj += 5

    # ---- Volatility ----
    if volatility.lower() == "low": adj -= 10
    elif volatility.lower() == "high": adj += 5

    # ---- Growth ----
    if growth.lower() == "slow": adj -= 10
    elif growth.lower() == "rapid": adj += 10

    return adj


# ------------------- PHASE 2: TRIM CALCULATION -------------------

def compute_trim(luxury_amt, nonmandatory_amt, total_income, adjustments):
    """Compute trim percentages and absolute amounts."""

    # Base trims (midpoint of range)
    base_luxury_trim = 0.20
    base_nonmandatory_trim = 0.15

    tim = 1 + (adjustments / 100)

    luxury_trim_pct = base_luxury_trim * tim
    nonmand_trim_pct = base_nonmandatory_trim * tim

    luxury_trim_value = luxury_amt * luxury_trim_pct
    nonmand_trim_value = nonmandatory_amt * nonmand_trim_pct
    total_trim = luxury_trim_value + nonmand_trim_value

    return {
        "luxury_trim_pct": luxury_trim_pct * 100,
        "nonmand_trim_pct": nonmand_trim_pct * 100,
        "luxury_trim_value": luxury_trim_value,
        "nonmand_trim_value": nonmand_trim_value,
        "luxury_amt": luxury_amt,
        "nonmandatory_amt": nonmandatory_amt,
        "total_trim": total_trim
    }


# ------------------- PHASE 3: LLM ADVISORY -------------------
def generate_advisory(profile, trim_data):
    """Send structured summary to Groq LLM for message generation."""
    prompt = f"""
You are FinMate Trim Bot — a smart financial advisory assistant.
Your goal is to analyze spending and suggest **trims only** — i.e., where and why to reduce expenses
in luxury or non-mandatory categories. 

⚠️ Do NOT give investment, saving, or reallocation advice.
Focus purely on trimming: explain how much to cut and why, in a concise and motivating tone.

---

User Profile:
Age: {profile['age']}, Monthly Income: ₹{profile['income']}, Dependents: {profile['dependents']}, 
EMI Burden: {profile['emi_burden']}%, Employment: {profile['emp_type']}, Growth Preference: {profile['growth']}

Monthly Spend Summary:
Luxury Spend: ₹{profile['luxury']}, Non-Mandatory Spend: ₹{profile['nonmandatory']}

Suggested Trim:
Luxury: {trim_data['luxury_trim_pct']:.1f}% → ₹{trim_data['luxury_trim_value']:.0f}
Non-Mandatory: {trim_data['nonmand_trim_pct']:.1f}% → ₹{trim_data['nonmand_trim_value']:.0f}

Total Potential Monthly Trim: ₹{trim_data['total_trim']:.0f}

---

Now write a concise and user-friendly message explaining:
- Where the trims apply (Luxury vs Non-Mandatory)
- Why trimming these amounts makes sense based on the user profile
- Encourage mindful spending without sounding harsh or judgmental

Keep tone supportive, practical, and under 120 words.
"""
    try:
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {"role": "system", "content": "You are a friendly and witty financial coach who gives practical lifestyle advice."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"[Groq API Error]: {e}")
        return "⚠️ Unable to generate advisory message right now."


# ------------------- PHASE 4: PIPELINE WRAPPER -------------------

def run_pipeline(profile):
    adjustments = get_factor_adjustment(
        age=profile["age"],
        income=profile["income"],
        emi_burden=profile["emi_burden"],
        dependents=profile["dependents"],
        emp_type=profile["emp_type"],
        ef_months=profile["ef_months"],
        horizon=profile["horizon"],
        volatility=profile["volatility"],
        growth=profile["growth"]
    )

    trim_data = compute_trim(profile["luxury"], profile["nonmandatory"], profile["income"], adjustments)

    print("=== Trim Calculation Summary ===")
    print(trim_data)

    advisory = generate_advisory(profile, trim_data)
    return advisory


# ------------------- EXAMPLE RUN -------------------

if __name__ == "__main__":
    user_profile = {
        "age": 30,
        "income": 100000,
        "emi_burden": 20,
        "dependents": 1,
        "emp_type": "Salaried",
        "ef_months": 4,
        "horizon": "Medium",
        "volatility": "Medium",
        "growth": "Rapid",
        "luxury": 12000,
        "nonmandatory": 18000
    }

    advisory_message = run_pipeline(user_profile)
    print("\n💬 Advisory:\n", advisory_message)
