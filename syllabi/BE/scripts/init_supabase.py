#!/usr/bin/env python3
"""
Initialize Supabase database with tables and seed data.

Usage:
    python scripts/init_supabase.py

Make sure to set environment variables:
    SUPABASE_URL=https://your-project.supabase.co
    SUPABASE_SERVICE_KEY=your-service-role-key
    DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
"""
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

# Load .env from src directory
from dotenv import load_dotenv
env_path = os.path.join(os.path.dirname(__file__), '..', 'src', '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
    print(f"Loaded .env from: {env_path}")

from app.core.config import settings
from app.core.database import create_tables, check_connection, engine
from app.core.supabase import supabase_db


def main():
    print("=" * 60)
    print("SMD System - Supabase Database Initialization")
    print("=" * 60)

    # Check configuration
    print("\n1. Checking configuration...")

    if not settings.DATABASE_URL or "sqlite" in settings.DATABASE_URL:
        print("   WARNING: Using SQLite. Set DATABASE_URL for Supabase PostgreSQL.")
        print(f"   Current: {settings.DATABASE_URL}")
    else:
        print(f"   Database URL: {settings.DATABASE_URL[:50]}...")

    if settings.SUPABASE_URL:
        print(f"   Supabase URL: {settings.SUPABASE_URL}")
    else:
        print("   Supabase URL: Not configured")

    # Test database connection
    print("\n2. Testing database connection...")

    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("   Database connection: OK")
    except Exception as e:
        print(f"   Database connection: FAILED - {e}")
        return 1

    # Test Supabase client
    print("\n3. Testing Supabase client...")

    if supabase_db.is_available:
        print("   Supabase client: OK")
    else:
        print("   Supabase client: Not available (credentials not set)")

    # Create tables
    print("\n4. Creating database tables...")

    try:
        create_tables()
        print("   Tables created successfully!")
    except Exception as e:
        print(f"   Failed to create tables: {e}")
        return 1

    # List created tables
    print("\n5. Verifying tables...")

    try:
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"   Found {len(tables)} tables:")
        for table in sorted(tables):
            print(f"      - {table}")
    except Exception as e:
        print(f"   Could not list tables: {e}")

    print("\n" + "=" * 60)
    print("Database initialization complete!")
    print("=" * 60)

    return 0


if __name__ == "__main__":
    sys.exit(main())
