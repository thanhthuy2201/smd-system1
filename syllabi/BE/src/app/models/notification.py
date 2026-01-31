"""Notification models"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class NotificationType(str, enum.Enum):
    ANNOUNCEMENT = "Announcement"
    REMINDER = "Reminder"
    ALERT = "Alert"
    SYSTEM = "System"


class NotificationPriority(str, enum.Enum):
    LOW = "Low"
    NORMAL = "Normal"
    HIGH = "High"
    URGENT = "Urgent"


class NotificationStatus(str, enum.Enum):
    DRAFT = "Draft"
    SCHEDULED = "Scheduled"
    SENT = "Sent"
    CANCELLED = "Cancelled"


class Notification(Base):
    """
    NOTIFICATION Table - System notifications
    """
    __tablename__ = "notifications"

    notification_id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    notification_type = Column(Enum(NotificationType), nullable=False)
    priority = Column(Enum(NotificationPriority), default=NotificationPriority.NORMAL)
    status = Column(Enum(NotificationStatus), default=NotificationStatus.DRAFT)

    # Targeting
    target_roles = Column(JSON, nullable=True)  # List of roles
    target_departments = Column(JSON, nullable=True)  # List of department IDs
    target_users = Column(JSON, nullable=True)  # List of specific user IDs

    # Scheduling
    scheduled_at = Column(DateTime, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    send_email = Column(Boolean, default=False)

    # Metadata
    created_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    recipients = relationship("NotificationRecipient", back_populates="notification", cascade="all, delete-orphan")


class NotificationRecipient(Base):
    """
    NOTIFICATION_RECIPIENT Table - Track notification delivery
    """
    __tablename__ = "notification_recipients"

    id = Column(Integer, primary_key=True, autoincrement=True)
    notification_id = Column(Integer, ForeignKey("notifications.notification_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)
    email_sent = Column(Boolean, default=False)
    email_sent_at = Column(DateTime, nullable=True)

    # Relationships
    notification = relationship("Notification", back_populates="recipients")
    user = relationship("User")


class NotificationTemplate(Base):
    """
    NOTIFICATION_TEMPLATE Table - Reusable notification templates
    """
    __tablename__ = "notification_templates"

    template_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    title_template = Column(String(200), nullable=False)
    content_template = Column(Text, nullable=False)
    notification_type = Column(Enum(NotificationType), nullable=False)
    variables = Column(JSON, nullable=True)  # List of template variables
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    creator = relationship("User")


class AutoReminderConfig(Base):
    """
    AUTO_REMINDER_CONFIG Table - Configure automated reminders
    """
    __tablename__ = "auto_reminder_configs"

    config_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    reminder_type = Column(String(50), nullable=False)  # submission_deadline, review_deadline, etc.
    days_before = Column(Integer, nullable=False)  # Days before deadline
    template_id = Column(Integer, ForeignKey("notification_templates.template_id"), nullable=True)
    is_active = Column(Boolean, default=True)
    send_email = Column(Boolean, default=True)
    target_roles = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    template = relationship("NotificationTemplate")
