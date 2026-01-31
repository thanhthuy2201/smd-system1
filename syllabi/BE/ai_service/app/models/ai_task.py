"""AI Task tracking model"""
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, Enum
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskType(str, enum.Enum):
    CLO_PLO_CHECK = "clo_plo_check"
    SEMANTIC_DIFF = "semantic_diff"
    SUMMARIZATION = "summarization"
    KEYWORD_EXTRACTION = "keyword_extraction"
    SIMILARITY_SEARCH = "similarity_search"
    CRAWL_REFERENCE = "crawl_reference"
    PDF_PROCESSING = "pdf_processing"


class AITask(Base):
    """Track AI processing tasks"""
    __tablename__ = "ai_tasks"

    task_id = Column(String(50), primary_key=True)  # Celery task ID
    task_type = Column(Enum(TaskType), nullable=False)
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING)

    # Reference to main system entities
    syllabus_id = Column(Integer, nullable=True)
    version_id = Column(Integer, nullable=True)
    user_id = Column(Integer, nullable=True)

    # Task data
    input_data = Column(JSON, nullable=True)
    result_data = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)

    # Metadata
    created_at = Column(DateTime, server_default=func.now())
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    processing_time_ms = Column(Integer, nullable=True)

    # Provider used
    ai_provider = Column(String(50), nullable=True)  # openai, gemini, ollama, local
