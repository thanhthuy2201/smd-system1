"""Syllabus Comment (Feedback) models"""
from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, backref
import enum

from app.core.database import Base


class CommentType(str, enum.Enum):
    SUGGESTION = "Suggestion"
    QUESTION = "Question"
    ERROR = "Error"
    GENERAL = "General"


class CommentPriority(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class SyllabusComment(Base):
    """
    SYLLABUS_COMMENT Table - Comments and feedback on syllabi
    """
    __tablename__ = "syllabus_comments"

    comment_id = Column(Integer, primary_key=True, autoincrement=True)
    syllabus_id = Column(Integer, ForeignKey("syllabi.syllabus_id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    parent_comment_id = Column(Integer, ForeignKey("syllabus_comments.comment_id", ondelete="CASCADE"), nullable=True)
    comment_type = Column(Enum(CommentType), default=CommentType.GENERAL)
    section_reference = Column(String(100), nullable=True)  # Which section the comment refers to
    content = Column(Text, nullable=False)
    priority = Column(Enum(CommentPriority), nullable=True)
    is_resolved = Column(Boolean, default=False)
    resolved_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    syllabus = relationship("Syllabus", back_populates="comments")
    author = relationship("User", foreign_keys=[user_id], backref="syllabus_comments")
    resolver = relationship("User", foreign_keys=[resolved_by])
    replies = relationship("SyllabusComment", backref=backref("parent_comment", remote_side=[comment_id]))
