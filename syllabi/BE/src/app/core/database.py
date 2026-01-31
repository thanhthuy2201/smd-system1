"""Database configuration and session management"""
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from typing import Generator
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# Database URL from settings
DATABASE_URL = settings.DATABASE_URL

# Configure engine based on database type
if DATABASE_URL.startswith("sqlite"):
    # SQLite for local development
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=settings.DEBUG
    )
    logger.info("Using SQLite database")

elif DATABASE_URL.startswith("postgresql") or DATABASE_URL.startswith("postgres"):
    # PostgreSQL (Supabase or direct)
    # Supabase URLs often use 'postgres://' but SQLAlchemy prefers 'postgresql://'
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        pool_recycle=300,
        echo=settings.DEBUG
    )
    logger.info("Using PostgreSQL database (Supabase)")

else:
    # Other databases (MySQL, etc.)
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        echo=settings.DEBUG
    )
    logger.info(f"Using database: {DATABASE_URL.split('://')[0]}")

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db() -> Generator:
    """
    Dependency to get database session.

    Usage:
        @router.get("/items")
        def get_items(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """
    Create all tables in the database.

    For Supabase, you can also use migrations or the Supabase dashboard.
    """
    from app.models import (
        User, Department, Program, Course, Syllabus, SyllabusVersion,
        ApprovalHistory, AcademicYear, Semester, SubmissionPeriod,
        ReviewSchedule, ReviewerAssignment, EvaluationTemplate,
        EvaluationCriteria, CriteriaPLOMapping, TemplateProgram,
        UpdateRequest, EvaluationResult, Notification, NotificationRecipient,
        NotificationTemplate, AutoReminderConfig, ImportLog, ImportError,
        SyllabusCLO, SyllabusContent, SyllabusAssessment, SyllabusReference,
        SyllabusComment, Message, MessageAttachment, PeerEvaluation, PeerEvaluationScore
    )

    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")


def drop_tables():
    """Drop all tables. Use with caution!"""
    logger.warning("Dropping all database tables...")
    Base.metadata.drop_all(bind=engine)
    logger.info("All tables dropped")


def check_connection() -> bool:
    """Check if database connection is working."""
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False
