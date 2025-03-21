import os
from pydantic import BaseSettings, PostgresDsn, validator
from typing import Optional, Dict, Any, List

class Settings(BaseSettings):
    # Database
    DATABASE_URL: PostgresDsn
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    CORS_ORIGINS: str = "http://localhost:3000"
    
    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    
    # Directories
    ML_MODELS_DIR: str = "./ml_models"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        env_file_encoding = "utf-8"

# Calculate the absolute path to the .env file
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")

# Load settings from environment variables
settings = Settings(_env_file=env_path)