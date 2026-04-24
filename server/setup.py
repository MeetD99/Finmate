#!/usr/bin/env python3
"""
Setup script for Finmate Flask backend
"""

import subprocess
import sys
import os

def install_requirements():
    """Install required packages"""
    print("Installing required packages...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✓ Requirements installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Failed to install requirements: {e}")
        return False

def create_env_file():
    """Create .env file if it doesn't exist"""
    env_file = ".env"
    if not os.path.exists(env_file):
        print("Creating .env file...")
        with open(env_file, 'w') as f:
            f.write("""# Flask Configuration
SECRET_KEY=dev-secret-key-change-in-production
FLASK_ENV=development
FLASK_DEBUG=True

# Database Configuration (PostgreSQL)
# Set DATABASE_URL for PostgreSQL (e.g., Supabase, local Postgres)
# Or use individual variables below:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=finmate
# DB_USER=postgres
# DB_PASSWORD=your_password
DATABASE_URL=postgresql://postgres:password@localhost:5432/finmate

# Groq API (for MulyaAI chat)
GROQ_API_KEY=your_groq_api_key

# Alpha Vantage (for live stock prices)
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key

# CORS Configuration
FRONTEND_URL=http://localhost:5173
""")
        print("✓ .env file created")
    else:
        print("✓ .env file already exists")

def main():
    """Main setup function"""
    print("Setting up Finmate Flask Backend...")
    print("=" * 40)
    
    # Install requirements
    if not install_requirements():
        print("Setup failed. Please check the error messages above.")
        return False
    
    # Create .env file
    create_env_file()
    
    print("\n" + "=" * 40)
    print("Setup completed successfully!")
    print("\nTo start the server:")
    print("  python run.py")
    print("\nTo test the API:")
    print("  python test_api.py")
    print("\nAPI will be available at: http://localhost:8080")
    
    return True

if __name__ == "__main__":
    main()
