import os
from dotenv import load_dotenv

load_dotenv()

def get_database_uri():
    database_url = os.environ.get('DATABASE_URL')
    if database_url:
        # Ensure SSL is enforced for remote connections (Supabase)
        if 'sslmode=' not in database_url:
            # Append query param correctly (handle existing ? params)
            if '?' in database_url:
                database_url += '&sslmode=require'
            else:
                database_url += '?sslmode=require'
        return database_url

    
    db_host = os.environ.get('DB_HOST', 'localhost')
    db_port = os.environ.get('DB_PORT', '5432')
    db_name = os.environ.get('DB_NAME', 'postgres')
    db_user = os.environ.get('DB_USER', 'postgres')
    db_password = os.environ.get('DB_PASSWORD', '')
    
    return f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    SQLALCHEMY_DATABASE_URI = get_database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '').split(',') or [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
        'https://finmate-vnfb.onrender.com',
        # Allow Railway domain (wildcard for any subdomain)
    ]

class DevelopmentConfig(Config):
    DEBUG = True
    FLASK_ENV = 'development'

class ProductionConfig(Config):
    DEBUG = False
    FLASK_ENV = 'production'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
