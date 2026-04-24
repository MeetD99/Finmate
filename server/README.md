# Finmate Backend API

A Flask-based REST API for the Finmate financial management application.

## Features

- User authentication (register, login, logout)
- SQLite database with SQLAlchemy ORM
- CORS support for frontend integration
- Session-based authentication
- Input validation and error handling
- AI-powered chat (MulyaAI) using Groq
- Transaction categorization using Pinecone vector DB
- Stock recommendations using Alpha Vantage

## Prerequisites

- Python 3.10+
- PostgreSQL (optional, SQLite works for development)
- Pinecone account (for vector DB)
- Groq API key
- Alpha Vantage API key (for live stock prices)

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment variables:**
   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

3. **Run the application:**
   ```bash
   python run.py
   ```

   The API will be available at `http://localhost:8080`

## Vector Database Setup (Required for Transaction Categorization)

The application uses Pinecone for vector-based transaction categorization.

### 1. Create Pinecone Account
- Sign up at [pinecone.io](https://www.pinecone.io/)
- Create a new index named `finmate-transactions`
- Use dimension: 384 (default for all-MiniLM-L6-v2)
- Metric: cosine

### 2. Seed the Vector Database
The application needs your CSV data embedded and uploaded to Pinecone:

```bash
python -m controllers.vector_db.upload_to_vector_db
```

Or manually with your CSV:
```bash
python -c "from controllers.vector_db.upload_to_vector_db import seed_from_csv; seed_from_csv('path/to/your.csv')"
```

Expected CSV format:
```
description,category
Salary,Income
Shopping,Expenses
...
```

### 3. Generate Embeddings
The script automatically generates embeddings using the all-MiniLM-L6-v2 model and uploads to Pinecone.

## Environment Variables

Create a `.env` file in the server directory:

```env
# Flask Configuration
SECRET_KEY=your-secret-key-here
FLASK_ENV=development
FLASK_DEBUG=True

# Database Configuration
# Option 1: SQLite (development)
DATABASE_URL=sqlite:///finmate.db

# Option 2: PostgreSQL (production)
DATABASE_URL=postgresql://user:password@localhost:5432/finmate

# Groq API (for MulyaAI chat)
GROQ_API_KEY=your_groq_api_key

# Alpha Vantage (for live stock prices)
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key

# Pinecone Vector DB
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=finmate-transactions

# Vector DB CSV (optional - for seeding)
VECTOR_DB_CSV_PATH=data/distinct_description_category_pairs.csv
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info

### Risk Profile

- `POST /api/risk-profile` - Create risk profile
- `GET /api/risk-profile` - Get user's risk profile

### Transactions

- `POST /api/transactions` - Create a new transaction
- `GET /api/transactions` - Get user's transactions
- `POST /api/upload-excel` - Upload bank statement (Excel)

### Summary

- `POST /api/summary` - Create monthly/yearly summary
- `GET /api/summary` - Get user's summaries

### Portfolio

- `POST /api/portfolio` - Create portfolio allocation
- `GET /api/portfolio` - Get user's portfolio
- `POST /api/portfolio/trim` - Calculate trim

### Chat (MulyaAI)

- `POST /api/chat/query` - Send chat message
- `GET /api/chat/history` - Get chat history

### Expenses

- `GET /api/expenses` - Get user's expenses
- `POST /api/expenses` - Add expense
- `PUT /api/expenses/<id>` - Update expense
- `DELETE /api/expenses/<id>` - Delete expense

### Health Check

- `GET /api/health` - API health status

## Database

The application uses SQLite database (`finmate.db`) with the following tables:

- **users**: Stores user information (id, name, email, password_hash, created_at)
- **risk_profile**: Stores user risk assessment
- **transaction**: Stores financial transactions
- **summary**: Stores monthly/yearly summaries
- **portfolio**: Stores portfolio allocations
- **chat_history**: Stores chat conversations

## Frontend Integration

The API is configured to work with the React frontend running on:
- `http://localhost:5173` (Vite default)
- `http://localhost:3000` (React default)

Make sure your frontend is making requests to `http://localhost:8080/api/...`