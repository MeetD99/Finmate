"""
Financial Chat Agent Service
Full-fledged chatbot with persistent memory and financial expertise
"""

import os
import uuid
from datetime import datetime, timedelta
from groq import Groq
from models import db as sqla_db, ChatHistory, Summary, Portfolio, Transaction, User


SYSTEM_PROMPT = """You are MulyaAI - a comprehensive Indian financial advisor and investment expert.

YOUR NAME: MulyaAI (Mulya = Value/Wealth in Hindi)

YOUR EXPERTISE:
- Personal Finance & Budgeting
- Investment Strategies (Stocks, Mutual Funds, ETFs, FDs, PPF, NPS, Bonds)
- Tax Planning (ITAX deductions, Section 80C, capital gains)
- Retirement Planning (PF, NPS, retirement corpus calculations)
- Risk Management & Insurance
- Debt Management & Loan Optimization
- Emergency Fund Planning
- Goal-Based Financial Planning

YOUR CHARACTER:
- Professional yet friendly and approachable
- Evidence-based with Indian market context
- Practical and actionable
- Honest about limitations
- Empathetic to financial struggles

RESPONSE GUIDELINES:
1. Keep responses CONCISE - maximum 3 sentences/short paragraphs
2. Start with the key answer, then briefly explain if needed
3. Always acknowledge their question first
4. Explain concepts in simple terms with examples
5. Use Indian financial products and regulations
6. Provide specific, actionable advice
7. Include relevant disclaimers when needed
8. Ask clarifying questions for better advice
9. Use ₹符号 for amounts
10. Reference current Indian tax rules and rates

IMPORTANT CONTEXT ABOUT YOUR ROLE:
- You provide educational information, not personalized investment advice
- Always recommend consulting a certified financial planner for complex decisions
- Never guarantee returns or predict specific stock prices
- Always consider the user's risk profile and goals
- Flag conflicts of interest

FINANCIAL PRODUCT KNOWLEDGE:
- PPF: 15-year lock-in, currently 7.1% interest, tax-free
- EPF: Employee PF, 8.25% interest, tax-free withdrawal
- NPS: National Pension System, voluntary retirement savings
- MF: Mutual Funds - equity, debt, hybrid categories
- SIP: Systematic Investment Plan - rupee cost averaging
- ELSS: Equity Linked Savings Scheme - 80C tax benefit
- FDs: Fixed Deposits - term deposits with banks/NBFCs
- Gold ETFs: Exchange traded funds tracking gold
- Index Funds: Nifty 50, Sensex tracking funds
- REITs: Real Estate Investment Trusts
- AIF: Alternate Investment Funds

TAX KNOWLEDGE (FY 2025-26):
- Standard Deduction: ₹50,000
- Section 80C: ₹1,50,000 max
- Section 80D: ₹25,000 (self) + ₹50,000 (parents)
- Section 24: Interest on home loan (₹2L self-occupied)
- Capital Gains: Short-term (<24mo) @ slab, Long-term @ 12.5%
- Dividend Tax: Now taxed at slab rate

ADVICE PRINCIPLES:
1. Emergency fund first (3-6 months expenses)
2. Insurance before investments
3. Clear high-interest debt before investing
4. Start early for compounding
5. Diversify across asset classes
6. Review portfolio annually
7. Don't try to time the market
8. Stay invested for long term"""


MEMORY_SYSTEM_PROMPT = """You have access to the user's complete financial history.

USER PROFILE DATA (from FinMate app):
- Risk Profile: {risk_category}
- Monthly Income: ₹{monthly_income:,.0f}
- Monthly Expenses: ₹{monthly_expenses:,.0f}
- Monthly Savings: ₹{monthly_savings:,.0f}
- Monthly Investable Surplus: ₹{surplus:,.0f}
- Investment Experience: {experience_level}
- Portfolio Allocations: Low-risk {low_pct}%, Mid-risk {mid_pct}%, High-risk {high_pct}%
- Target Split: Needs {needs_pct}% | Wants {wants_pct}% | Savings {savings_pct}%

RECENT TRANSACTIONS (last {tx_count}):
{recent_transactions}

CONVERSATION HISTORY:
{conversation_history}

Use this context to provide personalized advice that considers:
- Their actual financial situation (not generic advice)
- Their risk tolerance and investment experience
- Their transaction patterns and spending habits
- Their portfolio composition and goals

When they ask about investments, reference their actual numbers.
When they ask about budgeting, consider their actual income/expenses.
When they ask about goals, factor in their actual surplus and allocations."""


def get_groq_client():
    return Groq(api_key=os.getenv("GROQ_API_KEY"))


def get_user_context_data(user_id):
    """Fetch all user data needed for chat context."""
    latest_summary = sqla_db.session.query(Summary).filter(Summary.user_id == user_id).order_by(
        Summary.year.desc(), Summary.month.desc()
    ).first()
    
    portfolio = sqla_db.session.query(Portfolio).filter(Portfolio.user_id == user_id).order_by(
        Portfolio.created_at.desc()
    ).first()
    
    transactions = sqla_db.session.query(Transaction).filter(Transaction.user_id == user_id).order_by(
        Transaction.date.desc()
    ).limit(30).all()
    
    user = User.query.get(user_id)
    
    return {
        'summary': latest_summary,
        'portfolio': portfolio,
        'transactions': transactions,
        'user': user
    }


def determine_experience_level(user_data):
    """Determine user's investment experience level."""
    portfolio = user_data.get('portfolio')
    transactions = user_data.get('transactions', [])
    
    if not portfolio and len(transactions) == 0:
        return "Beginner - Just starting their financial journey"
    elif portfolio and portfolio.surplus and portfolio.surplus > 25000:
        return "Intermediate - Has some investment experience"
    else:
        return "Growing - Building investment habits"


def format_transactions(transactions):
    """Format transactions for chat context."""
    if not transactions:
        return "No transactions recorded yet."
    
    lines = []
    for t in transactions:
        date_str = t.date.strftime('%Y-%m-%d') if t.date else "N/A"
        amount_str = f"₹{t.amount:,.0f}"
        lines.append(f"{date_str}: {amount_str} - {t.desc} ({t.category.value if hasattr(t.category, 'value') else t.category})")
    return "\n".join(lines)


def get_conversation_history(user_id, limit=10):
    """Fetch conversation history for context in chronological order."""
    chats = sqla_db.session.query(ChatHistory).filter(ChatHistory.user_id == user_id).order_by(
        ChatHistory.created_at.asc()
    ).limit(limit).all()
    
    if not chats:
        return "No previous conversation yet. This is a new session."
    
    history_lines = []
    for chat in reversed(chats):
        user_date = chat.created_at.strftime('%Y-%m-%d %H:%M') if chat.created_at else ""
        history_lines.append(f"[{user_date}] User: {chat.query}")
        history_lines.append(f"[{user_date}] FinMate: {chat.response[:200]}..." if len(chat.response) > 200 else f"[{user_date}] FinMate: {chat.response}")
    
    return "\n".join(history_lines)


def build_system_prompt(user_data, user_id):
    """Build the full system prompt with user context."""
    summary = user_data.get('summary')
    portfolio = user_data.get('portfolio')
    transactions = user_data.get('transactions')
    
    risk_category = portfolio.category if portfolio else "Not set"
    monthly_income = (summary.spending + summary.savings) if summary and summary.spending else 0
    monthly_expenses = summary.spending if summary and summary.spending else 0
    monthly_savings = summary.savings if summary and summary.savings else 0
    surplus = portfolio.surplus if portfolio and portfolio.surplus else 0
    
    experience_level = determine_experience_level(user_data)
    
    low_pct = portfolio.low if portfolio and portfolio.low else 0
    mid_pct = portfolio.mid if portfolio and portfolio.mid else 0
    high_pct = portfolio.high if portfolio and portfolio.high else 0
    
    lux_pct = portfolio.luxury_pct if portfolio and portfolio.luxury_pct else 50
    nonmand_pct = portfolio.nonmand_pct if portfolio and portfolio.nonmand_pct else 50
    
    needs_pct = 100 - nonmand_pct
    wants_pct = nonmand_pct
    
    formatted_transactions = format_transactions(transactions)
    conversation_history = get_conversation_history(user_id)
    
    context_prompt = MEMORY_SYSTEM_PROMPT.format(
        risk_category=risk_category,
        monthly_income=monthly_income,
        monthly_expenses=monthly_expenses,
        monthly_savings=monthly_savings,
        surplus=surplus,
        experience_level=experience_level,
        low_pct=low_pct,
        mid_pct=mid_pct,
        high_pct=high_pct,
        needs_pct=needs_pct,
        wants_pct=wants_pct,
        savings_pct=nonmand_pct,
        recent_transactions=formatted_transactions,
        tx_count=len(transactions) if transactions else 0,
        conversation_history=conversation_history
    )
    
    return SYSTEM_PROMPT + "\n\n" + context_prompt


def process_chat_message(user_id, user_message, conversation_id=None):
    """
    Process a chat message with full context and memory.
    
    Args:
        user_id: The user ID
        user_message: The user's message
        conversation_id: Optional conversation ID for session continuity
    
    Returns:
        dict: {response, conversation_id, context_used}
    """
    if not os.getenv("GROQ_API_KEY"):
        return {
            "response": "API key not configured. Please contact admin to set GROQ_API_KEY.",
            "conversation_id": None,
            "context_used": False
        }
    
    user_data = get_user_context_data(user_id)
    full_system_prompt = build_system_prompt(user_data, user_id)
    
    groq_client = get_groq_client()
    
    messages = [
        {"role": "system", "content": full_system_prompt},
        {"role": "user", "content": user_message}
    ]
    
    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.5,
            max_tokens=300
        )
        
        ai_response = response.choices[0].message.content
        
        chat = ChatHistory(
            user_id=user_id,
            query=user_message,
            response=ai_response
        )
        sqla_db.session.add(chat)
        sqla_db.session.commit()
        
        return {
            "response": ai_response,
            "conversation_id": None,
            "context_used": True
        }
        
    except Exception as e:
        sqla_db.session.rollback()
        print(f"Chat error: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            "response": "I apologize, but I encountered an error processing your request. Please try again.",
            "conversation_id": None,
            "context_used": False
        }


def get_chat_history(user_id, limit=20):
    """Get user's chat history in descending order (newest first)."""
    chats = sqla_db.session.query(ChatHistory).filter(ChatHistory.user_id == user_id).order_by(
        ChatHistory.created_at.desc()
    ).limit(limit).all()
    return [chat.to_dict() for chat in chats]


def clear_chat_history(user_id):
    """Clear user's chat history."""
    try:
        sqla_db.session.query(ChatHistory).filter(ChatHistory.user_id == user_id).delete()
        sqla_db.session.commit()
        return True
    except Exception as e:
        sqla_db.session.rollback()
        print(f"Error clearing chat history: {e}")
        return False