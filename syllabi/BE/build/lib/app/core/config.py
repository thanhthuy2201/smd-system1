"""Application configuration settings"""
import os
from pydantic_settings import BaseSettings
from typing import Optional


def find_env_file():
    """Find .env file in common locations"""
    possible_paths = [
        ".env",  # Current directory
        "src/.env",  # From project root
        "../.env",  # Parent directory
        "../src/.env",  # From scripts directory
        os.path.join(os.path.dirname(__file__), "../../../.env"),  # Relative to this file
    ]
    for path in possible_paths:
        if os.path.exists(path):
            return path
    return ".env"


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Application
    APP_NAME: str = "SMD API"
    DEBUG: bool = True
    SECRET_KEY: str = "change-this-secret-key-in-production"

    # Supabase Settings (Phase 1)
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None  # anon/public key for client
    SUPABASE_SERVICE_KEY: Optional[str] = None  # service_role key for admin operations

    # Database - Supabase PostgreSQL or local SQLite
    # For Supabase: postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
    DATABASE_URL: str = "sqlite:///./smd.db"

    # Firebase Settings (matching frontend VITE_FIREBASE_* variables)
    FIREBASE_API_KEY: Optional[str] = None
    FIREBASE_AUTH_DOMAIN: Optional[str] = None
    FIREBASE_PROJECT_ID: Optional[str] = None
    FIREBASE_STORAGE_BUCKET: Optional[str] = None
    FIREBASE_MESSAGING_SENDER_ID: Optional[str] = None
    FIREBASE_APP_ID: Optional[str] = None
    FIREBASE_CREDENTIALS_PATH: Optional[str] = None  # Path to service account JSON for Admin SDK

    # CORS
    CORS_ORIGINS: list[str] = ["*"]

    class Config:
        env_file = find_env_file()
        case_sensitive = True


settings = Settings()
