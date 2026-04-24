## Base URL
```
http://localhost:8080/api
```

## Authentication
All endpoints (except health check and registration) require user authentication via session cookies.

## Endpoints

### 1. Health Check
- **GET** `/health`
- **Description**: Check API health status
- **Authentication**: None required
- **Response**: 
  ```json
  {
    "status": "healthy",
    "message": "Finmate API is running"
  }
  ```

### 2. User Registration
- **POST** `/auth/register`
- **Description**: Register a new user
- **Authentication**: None required
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response**: User object (201) or error (400)

### 3. User Login
- **POST** `/auth/login`
- **Description**: Login user and create session
- **Authentication**: None required
- **Request Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response**: User object (200) or error (401)

### 4. User Logout
- **POST** `/auth/logout`
- **Description**: Logout user and clear session
- **Authentication**: Required
- **Response**: Success message (200)

### 5. Get Current User
- **GET** `/auth/me`
- **Description**: Get current authenticated user info
- **Authentication**: Required
- **Response**: User object (200) or error (401)

### 6. Risk Profile

#### Create Risk Profile
- **POST** `/risk-profile`
- **Description**: Create user's risk assessment profile
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "age": 25,
    "monthly_income": 50000,
    "EMI_burden": 15000,
    "dependants": 2,
    "employment_type": 2,
    "risk_score": 75,
    "risk_category": 2
  }
  ```
- **Response**: Risk profile object (201) or error (400)

#### Get Risk Profile
- **GET** `/risk-profile`
- **Description**: Get user's risk profile
- **Authentication**: Required
- **Response**: Risk profile object (200) or error (404)

### 7. Transactions

#### Create Transaction
- **POST** `/transactions`
- **Description**: Create a new financial transaction
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "desc": "Grocery shopping",
    "amount": 1500,
    "type": "Withdraw",
    "date": "2024-01-15",
    "category": "Mandatory/Utilities"
  }
  ```
- **Transaction Types**: "Withdraw", "Deposit"
- **Categories**: "Mandatory/Utilities", "Non-Mandatory", "Luxury/Discretionary", "Travel", "Investment/Savings", "Adjustment"
- **Response**: Transaction object (201) or error (400)

#### Get Transactions
- **GET** `/transactions`
- **Description**: Get all user's transactions
- **Authentication**: Required
- **Response**: Array of transaction objects (200)

### 8. Summary

#### Create Summary
- **POST** `/summary`
- **Description**: Create monthly/yearly financial summary
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "month": "January",
    "year": "2024",
    "spending": 25000,
    "savings": 15000
  }
  ```
- **Response**: Summary object (201) or error (400)

#### Get Summaries
- **GET** `/summary`
- **Description**: Get all user's summaries
- **Authentication**: Required
- **Response**: Array of summary objects (200)

### 9. Portfolio

#### Create Portfolio
- **POST** `/portfolio`
- **Description**: Create portfolio allocation
- **Authentication**: Required
- **Request Body**:
  ```json
  {
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
  ```
- **Response**: Portfolio object (201) or error (400)

#### Get Portfolio
- **GET** `/portfolio`
- **Description**: Get user's portfolio
- **Authentication**: Required
- **Response**: Portfolio object (200) or error (404)

### 10. File Upload

#### Upload Excel File
- **POST** `/upload-excel`
- **Description**: Upload and process Excel file with transaction categorization
- **Authentication**: Required
- **Request**: Multipart form data with Excel file
- **File Requirements**: 
  - Must be .xlsx or .xls format
  - Must contain columns: Date, Description, Withdrawal, Deposit, Balance
- **Response**: 
  ```json
  {
    "message": "File processed successfully",
    "transactions": [
      {
        "transaction_id": 1,
        "description": "Grocery shopping",
        "amount": 1500,
        "type": "Withdraw",
        "date": "2024-01-15",
        "category": "Mandatory/Utilities",
        "confidence": 0.95,
        "justification": "Similar to other grocery transactions",
        "withdrawal": 1500,
        "deposit": 0,
        "balance": 8500
      }
    ],
    "summary": {
      "id": 1,
      "user_id": 1,
      "month": "January",
      "year": "2024",
      "spending": 25000,
      "savings": 15000
    },
    "statistics": {
      "total_transactions": 50,
      "total_spending": 25000,
      "total_savings": 15000,
      "month": "January",
      "year": "2024"
    }
  }
  ```

## Data Models

### User
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "created_at": "2024-01-01T00:00:00"
}
```

### Risk Profile
```json
{
  "risk_id": 1,
  "user_id": 1,
  "age": 25,
  "monthly_income": 50000,
  "EMI_burden": 15000,
  "dependants": 2,
  "employment_type": 2,
  "risk_score": 75,
  "risk_category": 2,
  "created_at": "2024-01-01T00:00:00"
}
```

### Transaction
```json
{
  "transaction_id": 1,
  "user_id": 1,
  "desc": "Grocery shopping",
  "amount": 1500,
  "type": "Withdraw",
  "date": "2024-01-15",
  "category": "Mandatory/Utilities",
  "created_at": "2024-01-01T00:00:00"
}
```

### Summary
```json
{
  "id": 1,
  "user_id": 1,
  "month": "January",
  "year": "2024",
  "spending": 25000,
  "savings": 15000,
  "created_at": "2024-01-01T00:00:00"
}
```

### Portfolio
```json
{
  "id": 1,
  "user_id": 1,
  "surplus": 10000,
  "luxury": 50,
  "total": 50000,
  "non_mandatory": 30,
  "high": 20,
  "mid": 30,
  "low": 50,
  "l_trim": 25,
  "n_trim": 15,
  "created_at": "2024-01-01T00:00:00"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "detail": "Error message description"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (authentication required)
- `404`: Not Found
- `500`: Internal Server Error

## Testing

Run the test suite to verify all endpoints:

```bash
cd server
python test_api.py
```

This will test all endpoints and show which ones pass or fail.
