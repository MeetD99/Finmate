# Finmate - Financial Management Application

A full-stack financial management application with React frontend and Flask backend.

## Project Structure

```
BNP/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── context/        # React context (auth)
│   │   ├── pages/          # Page components
│   │   └── ...
│   ├── package.json
│   └── ...
└── server/                 # Flask backend
    ├── app.py             # Main Flask application
    ├── config.py          # Configuration settings
    ├── requirements.txt   # Python dependencies
    ├── run.py            # Server startup script
    ├── setup.py          # Setup script
    ├── test_api.py       # API testing script
    └── README.md         # Backend documentation
```

## Quick Start

### Backend Setup

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Run setup script:**
   ```bash
   python setup.py
   ```

3. **Start the Flask server:**
   ```bash
   python run.py
   ```

   The API will be available at `http://localhost:8080`

### Frontend Setup

1. **Navigate to client directory:**
   ```bash
   cd client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`

## Vector Database Setup (Required for Transaction Categorization)

The application uses Pinecone for vector-based transaction categorization to automatically categorize your bank transactions.

### 1. Create Pinecone Account
- Sign up at [pinecone.io](https://www.pinecone.io/)
- Create a new index named `finmate-transactions`
- Use dimension: 384 (default for all-MiniLM-L6-v2)
- Metric: cosine

### 2. Seed the Vector Database
Run the seed script from the server directory:
```bash
cd server
python -c "from controllers.vector_db.upload_to_vector_db import seed_from_csv; seed_from_csv()"
```

This will load the default CSV from `data/distinct_description_category_pairs.csv`.

### Expected CSV Format
If using your own CSV:
```csv
description,category
Salary,Income
Shopping,Expenses
Dinner,Food
...
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

### Health Check
- `GET /api/health` - API health status

## Features

### Frontend (React)
- User authentication (login/register)
- Dashboard with financial data visualization
- File upload for CSV/Excel analysis
- Responsive design with Tailwind CSS
- Chart visualization with Recharts

### Backend (Flask)
- RESTful API with Flask
- SQLite database with SQLAlchemy ORM
- Session-based authentication
- CORS support for frontend integration
- Input validation and error handling
- Password hashing with Werkzeug

## Testing

To test the API endpoints:

```bash
cd server
python test_api.py
```

## Development

### Backend Development
- The Flask app runs on port 8080
- SQLite database file: `finmate.db`
- Configuration in `config.py`
- Environment variables in `.env`

### Frontend Development
- React app runs on port 5173 (Vite default)
- Uses Axios for API calls
- Context API for state management
- Tailwind CSS for styling

## Database Schema

### Users Table
- `id` (Primary Key)
- `name` (String, 100 chars)
- `email` (String, 120 chars, unique)
- `password_hash` (String, 128 chars)
- `created_at` (DateTime)

## Security Features

- Password hashing with Werkzeug
- Session-based authentication
- Input validation and sanitization
- CORS configuration
- SQL injection protection with SQLAlchemy ORM

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
