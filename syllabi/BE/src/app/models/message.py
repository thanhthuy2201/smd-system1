"""Internal Messaging models"""
from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, backref

from app.core.database import Base


class Message(Base):
    """
    MESSAGE Table - Internal messaging between users
    """
    __tablename__ = "messages"

    message_id = Column(Integer, primary_key=True, autoincrement=True)
    sender_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    subject = Column(String(200), nullable=False)
    body = Column(Text, nullable=False)
    syllabus_id = Column(Integer, ForeignKey("syllabi.syllabus_id", ondelete="SET NULL"), nullable=True)
    parent_message_id = Column(Integer, ForeignKey("messages.message_id", ondelete="SET NULL"), nullable=True)
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)
    is_deleted_by_sender = Column(Boolean, default=False)
    is_deleted_by_recipient = Column(Boolean, default=False)
    sent_at = Column(DateTime, server_default=func.now())

    # Relationships
    sender = relationship("User", foreign_keys=[sender_id], backref="sent_messages")
    recipient = relationship("User", foreign_keys=[recipient_id], backref="received_messages")
    syllabus = relationship("Syllabus", backref="related_messages")
    replies = relationship("Message", backref=backref("parent_message", remote_side=[message_id]))


class MessageAttachment(Base):
    """
    MESSAGE_ATTACHMENT Table - File attachments for messages
    """
    __tablename__ = "message_attachments"

    attachment_id = Column(Integer, primary_key=True, autoincrement=True)
    message_id = Column(Integer, ForeignKey("messages.message_id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=True)  # Size in bytes
    mime_type = Column(String(100), nullable=True)
    uploaded_at = Column(DateTime, server_default=func.now())

    # Relationships
    message = relationship("Message", backref="attachments")
