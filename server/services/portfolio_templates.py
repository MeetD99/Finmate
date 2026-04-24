"""
Sample Portfolio Templates with Indian Context
"""

# Indian-themed portfolio names
SAMPLE_PORTFOLIOS = {
    "shuruaat": {
        "slug": "shuruaat",
        "name": "Shuruaat",
        "tagline": "Boond Boond se sagar bharta hai!",
        "description": "Perfect for your first step into investing. Start with as little as ₹500/month.",
        "min_surplus": 500,
        "max_surplus": 5000,
        "risk_level": "Kam",
        "time_horizon": "1-3 saal",
        "ideal_for": "Students, first job freshers, emergency fund builders",
        "allocation": {
            "low": 70,
            "mid": 20,
            "high": 10
        },
        "assets": [
            {
                "name": "PPF (Public Provident Fund)",
                "type": "govt",
                "category": "low",
                "allocation": 40,
                "return_rate": 7.1,
                "risk": "Bilkul secure",
                "description": "GOVT backed, tax-free, 15 saal lock-in",
                "symbol": "PPF"
            },
            {
                "name": "HDFC Liquid Fund",
                "type": "mutual_fund",
                "category": "low",
                "allocation": 30,
                "return_rate": 6.5,
                "risk": "Kam",
                "description": "Emergency fund ke liye best, 1 din mein payout",
                "symbol": "HDFCLiq"
            },
            {
                "name": "UTI Nifty 50 Index Fund",
                "type": "mutual_fund",
                "category": "high",
                "allocation": 30,
                "return_rate": 12,
                "risk": "Jyaada",
                "description": "Market ki seedi, no brainer option",
                "symbol": "UTINifty"
            }
        ]
    },
    
    "junglee": {
        "slug": "junglee",
        "name": "Junglee",
        "tagline": "Aaj kuch toofani krte hai!",
        "description": "Balanced portfolio for those who want growth without too much risk.",
        "min_surplus": 5000,
        "max_surplus": 15000,
        "risk_level": "Thoda",
        "time_horizon": "3-5 saal",
        "ideal_for": "Young professionals, stable income walo ke liye",
        "allocation": {
            "low": 40,
            "mid": 35,
            "high": 25
        },
        "assets": [
            {
                "name": "FD (Fixed Deposit)",
                "type": "bank",
                "category": "low",
                "allocation": 25,
                "return_rate": 6.8,
                "risk": "Nahi hai",
                "description": "Bank mein paisa rakhna, safe hai",
                "symbol": "FD"
            },
            {
                "name": "SBI Balanced Advantage Fund",
                "type": "mutual_fund",
                "category": "mid",
                "allocation": 35,
                "return_rate": 11,
                "risk": "Kam",
                "description": "Equity + Debt ka mixer, market ko handle karta hai",
                "symbol": "SBIBal"
            },
            {
                "name": "HDFC Nifty 50 Index Fund",
                "type": "mutual_fund",
                "category": "high",
                "allocation": 25,
                "return_rate": 12,
                "risk": "Jyaada",
                "description": "Nifty 50 ko copy karta hai, cost kam hai",
                "symbol": "HDFCNifty"
            },
            {
                "name": "HDFC Mid-Cap Fund",
                "type": "mutual_fund",
                "category": "high",
                "allocation": 15,
                "return_rate": 15,
                "risk": "Bahut jyaada",
                "description": "Mid-cap companies mein invest, growth jyada",
                "symbol": "HDFCMid"
            }
        ]
    },
    
    "chakravyuh": {
        "slug": "chakravyuh",
        "name": "Chakravyuh",
        "tagline": "Har Chakravyuh ka ek solution hota hai",
        "description": "For experienced investors who want their money working hard.",
        "min_surplus": 15000,
        "max_surplus": 50000,
        "risk_level": "Zyada",
        "time_horizon": "5-10 saal",
        "ideal_for": "Settled professionals, long-term wealth builders",
        "allocation": {
            "low": 20,
            "mid": 30,
            "high": 50
        },
        "assets": [
            {
                "name": "NPS (National Pension System)",
                "type": "govt",
                "category": "low",
                "allocation": 20,
                "return_rate": 9,
                "risk": "Kam",
                "description": "Retirement planning ka solid option",
                "symbol": "NPS"
            },
            {
                "name": "ICICI Prudential Balanced Advantage",
                "type": "mutual_fund",
                "category": "mid",
                "allocation": 30,
                "return_rate": 11,
                "risk": "Kam",
                "description": "Smart allocation, market smart",
                "symbol": "ICICIBal"
            },
            {
                "name": "HDFC Nifty 50 Index Fund",
                "type": "mutual_fund",
                "category": "high",
                "allocation": 30,
                "return_rate": 12,
                "risk": "Jyaada",
                "description": "Large-cap exposure, stable growth",
                "symbol": "HDFCNifty"
            },
            {
                "name": "Nippon India Small Cap Fund",
                "type": "mutual_fund",
                "category": "high",
                "allocation": 20,
                "return_rate": 18,
                "risk": "Bahut jyaada",
                "description": "Small companies, high risk = high reward",
                "symbol": "NipponSmall"
            }
        ]
    },
    
    "dhoom": {
        "slug": "dhoom",
        "name": "Dhoom",
        "tagline": "Dhoom macha dene ka",
        "description": "Aggressive portfolio for those who can handle market swings.",
        "min_surplus": 50000,
        "max_surplus": 200000,
        "risk_level": "Bahut zyada",
        "time_horizon": "10+ saal",
        "ideal_for": "High earners, aggressive growth seekers",
        "allocation": {
            "low": 10,
            "mid": 20,
            "high": 70
        },
        "assets": [
            {
                "name": "Gold ETF",
                "type": "etf",
                "category": "low",
                "allocation": 10,
                "return_rate": 8,
                "risk": "Kam",
                "description": "Digital gold, inflation hedge",
                "symbol": "GOLDBEES"
            },
            {
                "name": "Mirae Asset Large Cap Fund",
                "type": "mutual_fund",
                "category": "high",
                "allocation": 30,
                "return_rate": 14,
                "risk": "Jyaada",
                "description": "Top companies, consistent performer",
                "symbol": "MiraeLarge"
            },
            {
                "name": "UTI Nifty 50 Index Fund",
                "type": "mutual_fund",
                "category": "high",
                "allocation": 30,
                "return_rate": 12,
                "risk": "Jyaada",
                "description": "Market seedi, low cost",
                "symbol": "UTINifty"
            },
            {
                "name": "Kotak Emerging Equity",
                "type": "mutual_fund",
                "category": "high",
                "allocation": 30,
                "return_rate": 16,
                "risk": "Bahut jyaada",
                "description": "Mid-cap growth potential",
                "symbol": "KotakEmer"
            }
        ]
    }
}


def get_sample_portfolios():
    """Return all sample portfolios"""
    return SAMPLE_PORTFOLIOS


def get_sample_portfolio(slug):
    """Return a specific sample portfolio"""
    return SAMPLE_PORTFOLIOS.get(slug)


def get_portfolio_for_surplus(surplus):
    """Suggest best portfolio based on surplus amount"""
    if surplus < 5000:
        return SAMPLE_PORTFOLIOS["shuruaat"]
    elif surplus < 15000:
        return SAMPLE_PORTFOLIOS["junglee"]
    elif surplus < 50000:
        return SAMPLE_PORTFOLIOS["chakravyuh"]
    else:
        return SAMPLE_PORTFOLIOS["dhoom"]


def calculate_portfolio_return(portfolio):
    """Calculate weighted average return for a portfolio"""
    total_allocation = sum(a["allocation"] for a in portfolio["assets"])
    weighted_return = sum(
        (a["allocation"] / total_allocation) * a["return_rate"] 
        for a in portfolio["assets"]
    )
    return round(weighted_return, 1)


def calculate_growth_trajectory(monthly_investment, rate, years):
    """
    Calculate future value with compound interest (SIP formula)
    FV = P × ((1 + r)^n - 1) / r × (1 + r)
    """
    if rate == 0:
        return monthly_investment * 12 * years
    
    monthly_rate = rate / 12 / 100
    months = years * 12
    future_value = monthly_investment * ((1 + monthly_rate) ** months - 1) / monthly_rate
    return round(future_value)


def get_growth_data(monthly_investment, portfolio, years_list=[1, 3, 5, 10, 15]):
    """Generate growth trajectory data for a portfolio"""
    portfolio_return = calculate_portfolio_return(portfolio)
    
    growth_data = []
    for years in years_list:
        future_value = calculate_growth_trajectory(monthly_investment, portfolio_return, years)
        total_invested = monthly_investment * 12 * years
        gains = future_value - total_invested
        
        growth_data.append({
            "years": years,
            "total_invested": total_invested,
            "future_value": future_value,
            "gains": gains,
            "return_rate": portfolio_return,
            "label": f"{years} saal"
        })
    
    return {
        "monthly_investment": monthly_investment,
        "expected_return": portfolio_return,
        "yearly_projections": growth_data
    }