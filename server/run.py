#!/usr/bin/env python3
"""
Simple script to run the Finmate Flask application
"""

import os
from app import app

if __name__ == '__main__':
    # Set environment variables if not already set
    if not os.environ.get('FLASK_ENV'):
        os.environ['FLASK_ENV'] = 'development'
    
    print("Starting Finmate API server...")
    print("API will be available at: http://localhost:8080")
    print("Health check: http://localhost:8080/api/health")
    print("Press Ctrl+C to stop the server")
    
    app.run(
        debug=True,
        host='0.0.0.0',
        port=8080,
        threaded=True
    )
