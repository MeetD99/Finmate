#!/usr/bin/env python3
"""
Simple test script to verify the Finmate API endpoints
"""

import requests
import json

BASE_URL = "http://localhost:8080/api"

# Create a session to maintain cookies
session = requests.Session()

def clear_session():
    """Clear the session cookies"""
    session.cookies.clear()

def test_health():
    """Test the health check endpoint"""
    try:
        response = session.get(f"{BASE_URL}/health")
        print(f"Health Check: {response.status_code} - {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Health Check Failed: {e}")
        return False

def test_register():
    """Test user registration"""
    try:
        user_data = {
            "name": "Test User",
            "email": "test@example.com",
            "password": "testpassword123"
        }
        response = session.post(f"{BASE_URL}/auth/register", json=user_data)
        print(f"Register: {response.status_code} - {response.json()}")
        # Accept both 201 (created) and 400 (already exists) as success
        return response.status_code in [201, 400]
    except Exception as e:
        print(f"Register Failed: {e}")
        return False

def test_login():
    """Test user login"""
    try:
        login_data = {
            "email": "test@example.com",
            "password": "testpassword123"
        }
        response = session.post(f"{BASE_URL}/auth/login", json=login_data)
        print(f"Login: {response.status_code} - {response.json()}")
        
        # Check if has_risk_profile field is present
        if response.status_code == 200:
            user_data = response.json()
            if 'has_risk_profile' in user_data:
                print(f"Risk Profile Status: {user_data['has_risk_profile']}")
            else:
                print("Warning: has_risk_profile field not found in response")
        
        return response.status_code == 200
    except Exception as e:
        print(f"Login Failed: {e}")
        return False

def test_logout():
    """Test user logout"""
    try:
        response = session.post(f"{BASE_URL}/auth/logout")
        print(f"Logout: {response.status_code} - {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Logout Failed: {e}")
        return False

def test_risk_profile():
    """Test risk profile creation and retrieval"""
    try:
        # First check user info before creating risk profile
        me_response = session.get(f"{BASE_URL}/auth/me")
        if me_response.status_code == 200:
            user_data = me_response.json()
            print(f"User before risk profile: has_risk_profile = {user_data.get('has_risk_profile', 'Not found')}")
        
        # Create risk profile
        risk_data = {
            "age": 25,
            "monthly_income": 50000,
            "EMI_burden": 15000,
            "dependants": 2,
            "employment_type": 2,
            "risk_score": 75,
            "risk_category": 2
        }
        response = session.post(f"{BASE_URL}/risk-profile", json=risk_data)
        print(f"Risk Profile Create: {response.status_code} - {response.json()}")
        
        # Get risk profile
        get_response = session.get(f"{BASE_URL}/risk-profile")
        print(f"Risk Profile Get: {get_response.status_code} - {get_response.json()}")
        
        # Check user info after creating risk profile
        me_response_after = session.get(f"{BASE_URL}/auth/me")
        if me_response_after.status_code == 200:
            user_data_after = me_response_after.json()
            print(f"User after risk profile: has_risk_profile = {user_data_after.get('has_risk_profile', 'Not found')}")
        
        return response.status_code == 201 and get_response.status_code == 200
    except Exception as e:
        print(f"Risk Profile Test Failed: {e}")
        return False

def test_transaction():
    """Test transaction creation and retrieval"""
    try:
        # Create transaction
        transaction_data = {
            "desc": "Grocery shopping",
            "amount": 1500,
            "type": "Withdraw",
            "date": "2024-01-15",
            "category": "Mandatory/Utilities"
        }
        response = session.post(f"{BASE_URL}/transactions", json=transaction_data)
        print(f"Transaction Create: {response.status_code} - {response.json()}")
        
        # Get transactions
        get_response = session.get(f"{BASE_URL}/transactions")
        print(f"Transaction Get: {get_response.status_code} - {get_response.json()}")
        
        return response.status_code == 201 and get_response.status_code == 200
    except Exception as e:
        print(f"Transaction Test Failed: {e}")
        return False

def test_summary():
    """Test summary creation and retrieval"""
    try:
        # Create summary
        summary_data = {
            "month": "January",
            "year": "2024",
            "spending": 25000,
            "savings": 15000
        }
        response = session.post(f"{BASE_URL}/summary", json=summary_data)
        print(f"Summary Create: {response.status_code} - {response.json()}")
        
        # Get summaries
        get_response = session.get(f"{BASE_URL}/summary")
        print(f"Summary Get: {get_response.status_code} - {get_response.json()}")
        
        return response.status_code == 201 and get_response.status_code == 200
    except Exception as e:
        print(f"Summary Test Failed: {e}")
        return False

def test_portfolio():
    """Test portfolio creation and retrieval"""
    try:
        # Create portfolio
        portfolio_data = {
            "surplus": 10000,
            "luxury": 50,
            "total": 50000,
            "non_mandatory": 30,
            "high": 20,
            "mid": 30,
            "low": 50,
            "l_trim": 25,
            "n_trim": 15
        }
        response = session.post(f"{BASE_URL}/portfolio", json=portfolio_data)
        print(f"Portfolio Create: {response.status_code} - {response.json()}")
        
        # Get portfolio
        get_response = session.get(f"{BASE_URL}/portfolio")
        print(f"Portfolio Get: {get_response.status_code} - {get_response.json()}")
        
        return response.status_code == 201 and get_response.status_code == 200
    except Exception as e:
        print(f"Portfolio Test Failed: {e}")
        return False

def main():
    """Run all tests"""
    print("Testing Finmate API...")
    print("=" * 50)
    
    # Clear session before starting tests
    clear_session()
    
    tests = [
        ("Health Check", test_health),
        ("User Registration", test_register),
        ("User Login", test_login),
        ("Risk Profile", test_risk_profile),
        ("Transaction", test_transaction),
        ("Summary", test_summary),
        ("Portfolio", test_portfolio),
        ("User Logout", test_logout)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n{test_name}:")
        result = test_func()
        results.append((test_name, result))
    
    print("\n" + "=" * 50)
    print("Test Results:")
    for test_name, result in results:
        status = "PASS" if result else "FAIL"
        print(f"{test_name}: {status}")
    
    all_passed = all(result for _, result in results)
    print(f"\nOverall: {'ALL TESTS PASSED' if all_passed else 'SOME TESTS FAILED'}")

if __name__ == "__main__":
    main()
