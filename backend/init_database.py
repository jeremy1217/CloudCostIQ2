#!/usr/bin/env python3
"""
Database initialization script for CloudCostIQ
"""
import os
import sys
from pathlib import Path

# Add the backend directory to the path
CURRENT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(CURRENT_DIR))

from app.db.init_db import init_db
from dotenv import load_dotenv

if __name__ == "__main__":
    print("Initializing CloudCostIQ database...")
    load_dotenv()
    
    # Get database URL from environment
    db_url = os.getenv("DATABASE_URL")
    print(f"Using database: {db_url}")
    
    # Initialize the database
    init_db()
    
    print("Database initialization complete!") 