"""Vector embeddings model with pgvector"""
from sqlalchemy import Column, Integer, String, DateTime, Text, Index
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector

from app.core.database import Base
from app.core.config import settings


class CLOEmbedding(Base):
    """Store CLO (Course Learning Outcome) embeddings for similarity search"""
    __tablename__ = "clo_embeddings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    syllabus_id = Column(Integer, nullable=False, index=True)
    clo_index = Column(Integer, nullable=False)  # CLO number (1, 2, 3...)
    clo_text = Column(Text, nullable=False)
    embedding = Column(Vector(settings.EMBEDDING_DIMENSION), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index('ix_clo_embedding_vector', embedding, postgresql_using='ivfflat'),
    )


class PLOEmbedding(Base):
    """Store PLO (Program Learning Outcome) embeddings"""
    __tablename__ = "plo_embeddings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    program_id = Column(Integer, nullable=False, index=True)
    plo_index = Column(Integer, nullable=False)
    plo_text = Column(Text, nullable=False)
    embedding = Column(Vector(settings.EMBEDDING_DIMENSION), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index('ix_plo_embedding_vector', embedding, postgresql_using='ivfflat'),
    )


class SyllabusContentEmbedding(Base):
    """Store full syllabus content embeddings for semantic search"""
    __tablename__ = "syllabus_content_embeddings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    syllabus_id = Column(Integer, nullable=False, index=True)
    version_id = Column(Integer, nullable=True, index=True)
    section = Column(String(100), nullable=False)  # learning_outcomes, assessment, etc.
    content_chunk = Column(Text, nullable=False)
    chunk_index = Column(Integer, default=0)
    embedding = Column(Vector(settings.EMBEDDING_DIMENSION), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        Index('ix_syllabus_content_embedding_vector', embedding, postgresql_using='ivfflat'),
    )
