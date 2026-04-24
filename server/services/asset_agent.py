import requests
import os
import time
from groq import Groq


ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY", "")

# Yahoo Finance mapped to NSE symbols for Indian stocks
INDIAN_STOCKS = {
    "RELIANCE": "RELIANCE.NS",
    "HDFCBANK": "HDFCBANK.NS",
    "TCS": "TCS.NS",
    "INFOSYS": "INFY.NS",
    "HDFC": "HDFC.NS",
    "SBIN": "SBIN.NS",
    "BAJFINANCE": "BAJFINANCE.NS",
    "KOTAKBANK": "KOTAKBANK.NS",
    "ITC": "ITC.NS",
    "HINDUNILVR": "HINDUNILVR.NS",
}


def get_yahoo_price(symbol):
    """Fetch live price from Yahoo Finance."""
    try:
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers, timeout=5)
        data = response.json()
        
        chart = data.get("chart", {})
        result = chart.get("result", [])
        if result:
            meta = result[0].get("meta", {})
            price = meta.get("regularMarketPrice")
            prev_close = meta.get("chartPreviousClose", meta.get("previousClose"))
            
            if price and prev_close:
                change = price - prev_close
                change_pct = (change / prev_close) * 100
                return {
                    "price": price,
                    "change": f"{change:.2f}",
                    "change_pct": f"{change_pct:.2f}%",
                    "symbol": symbol
                }
    except Exception as e:
        pass
    
    return None


def get_stock_price(symbol):
    """Fetch live price - tries Yahoo Finance first."""
    # Try Yahoo Finance for Indian stocks
    if symbol.endswith(".NS"):
        return get_yahoo_price(symbol)
    
    # Try mapped symbol
    nse_symbol = INDIAN_STOCKS.get(symbol, f"{symbol}.NS")
    price_data = get_yahoo_price(nse_symbol)
    if price_data:
        return price_data
    
    # Fallback: Alpha Vantage for US stocks
    if ALPHA_VANTAGE_API_KEY:
        try:
            url = "https://www.alphavantage.co/query"
            params = {
                "function": "GLOBAL_QUOTE",
                "symbol": symbol,
                "apikey": ALPHA_VANTAGE_API_KEY
            }
            response = requests.get(url, params=params, timeout=5)
            data = response.json()
            
            quote = data.get("Global Quote", {})
            if quote:
                price = quote.get("05. price")
                if price:
                    return {
                        "price": float(price),
                        "change": quote.get("09. change", "0"),
                        "change_pct": quote.get("10. change %", "0%"),
                        "symbol": symbol
                    }
        except Exception:
            pass
    
    return None


def get_live_prices():
    """Fetch live prices for key Indian stocks."""
    prices = {}
    
    # Only fetch a few key stocks to avoid rate limits
    key_stocks = ["RELIANCE", "HDFCBANK", "TCS", "INFOSYS", "SBIN"]
    
    for symbol in key_stocks:
        price_data = get_stock_price(symbol)
        if price_data and price_data.get("price"):
            prices[symbol] = price_data
        time.sleep(0.3)  # Be gentle with rate limits
    
    return prices


# Map common fund names to stock symbols
FUND_SYMBOL_MAP = {
    "reliance": "RELIANCE",
    "hdfc bank": "HDFCBANK",
    "hdfc": "HDFC",
    "tcs": "TCS",
    "infosys": "INFOSYS",
    "sbi": "SBIN",
    "bajaj": "BAJFINANCE",
    "kotak": "KOTAKBANK",
    "itc": "ITC",
    "hindustan unilever": "HINDUNILVR",
    "nifty": "NIFTY",
    "sensex": "SENSEX",
}


def get_asset_suggestions(risk_category, monthly_surplus):
    """Get AI-suggested assets with live prices."""
    groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    
    risk_lower = risk_category.lower() if risk_category else "moderate"
    
    prompt = f"""Based on {risk_lower} risk profile and monthly investable amount of ₹{monthly_surplus}, suggest 3-4 best Indian investment options.

Output ONLY valid JSON (no markdown, no explanation):
{{
  "suggestions": [
    {{"name": "Fund Name", "category": "low|mid|high", "expected_return": "X%", "description": "1 line"}}
  ]
}}

Rules:
- For low risk (Conservative): FDs, Liquid funds, Short-term debt
- For mid risk (Moderate): Balanced MFs, Duration funds, Hybrid funds  
- For high risk (Aggressive): Index funds, Mid-cap, Small-cap
- Use real Indian fund names
- Include expected annual return range
"""

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=300
        )
        
        content = response.choices[0].message.content
        
        import json
        import re
        
        json_match = re.search(r'\{[\s\S]*\}', content)
        if json_match:
            data = json.loads(json_match.group())
            suggestions = data.get("suggestions", [])
            
            # Get live prices
            live_prices = get_live_prices()
            
            for s in suggestions:
                name_lower = s.get("name", "").lower()
                matched_symbol = None
                for fund_name, symbol in FUND_SYMBOL_MAP.items():
                    if fund_name in name_lower:
                        matched_symbol = symbol
                        break
                
                if matched_symbol and matched_symbol in live_prices:
                    price_data = live_prices[matched_symbol]
                    s["live_price"] = f"₹{price_data['price']}"
                    s["change"] = price_data.get("change_pct", "")
                    s["symbol"] = matched_symbol
                else:
                    s["live_price"] = None
            
            return {
                "suggestions": suggestions,
                "source": "ai",
                "live_prices": live_prices
            }
    except Exception:
        pass
    
    return get_fallback_suggestions()


def get_fallback_suggestions():
    """Return default asset suggestions."""
    return {
        "suggestions": [
            {"name": "Fixed Deposit (FD)", "category": "low", "expected_return": "6-7%", "description": "Bank deposits, safest option", "live_price": None},
            {"name": "Liquid Fund", "category": "low", "expected_return": "6-7%", "description": "Short-term debt fund", "live_price": None},
            {"name": "Short Duration Fund", "category": "mid", "expected_return": "7-9%", "description": "1-3 year debt fund", "live_price": None},
            {"name": "Balanced Advantage Fund", "category": "mid", "expected_return": "10-12%", "description": "Hybrid equity-debt fund", "live_price": None},
            {"name": "Nifty 50 Index Fund", "category": "high", "expected_return": "12-15%", "description": "Large-cap index", "live_price": None},
            {"name": "Mid-Cap Fund", "category": "high", "expected_return": "15-20%", "description": "Mid-cap equity fund", "live_price": None},
        ],
        "source": "fallback"
    }


def generate_asset_explanation(risk_category, surplus):
    """Generate AI explanation for asset allocation."""
    groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    
    prompt = f"""For a {risk_category} investor with ₹{surplus} monthly, give a 1-sentence allocation tip. Keep casual."""

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=100
        )
        return response.choices[0].message.content
    except Exception:
        return "Consistency is key to building wealth!"