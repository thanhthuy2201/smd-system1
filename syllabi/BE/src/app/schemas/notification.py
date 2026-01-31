"""Schemas for Notifications (FE06)"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class NotificationTypeEnum(str, Enum):
    SYSTEM = "System"
    REMINDER = "Reminder"
    APPROVAL = "Approval"
    REJECTION = "Rejection"
    DEADLINE = "Deadline"
    UPDATE = "Update"


class NotificationPriorityEnum(str, Enum):
    LOW = "Low"
    NORMAL = "Normal"
    HIGH = "High"
    URGENT = "Urgent"


class NotificationStatusEnum(str, Enum):
    PENDING = "Pending"
    SENT = "Sent"
    DELIVERED = "Delivered"
    READ = "Read"
    FAILED = "Failed"


# ==================== Notification Recipient ====================

class NotificationRecipientBase(BaseModel):
    user_id: int


class NotificationRecipientCreate(NotificationRecipientBase):
    pass


class NotificationRecipientResponse(NotificationRecipientBase):
    recipient_id: int
    notification_id: int
    status: NotificationStatusEnum
    read_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None

    class Config:
        from_attributes = True


# ==================== Notification ====================

class NotificationBase(BaseModel):
    title: str = Field(..., max_length=200)
    content: str
    notification_type: NotificationTypeEnum = NotificationTypeEnum.SYSTEM
    priority: NotificationPriorityEnum = NotificationPriorityEnum.NORMAL


class NotificationCreate(NotificationBase):
    recipient_ids: list[int] = Field(..., min_length=1)
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[int] = None
    scheduled_at: Optional[datetime] = None


class NotificationBroadcast(NotificationBase):
    """Send notification to all users or by role/department"""
    target_role: Optional[str] = None
    target_department_id: Optional[int] = None
    send_to_all: bool = False


class NotificationResponse(NotificationBase):
    notification_id: int
    created_by: Optional[int] = None
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[int] = None
    scheduled_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    created_at: datetime
    recipients: list[NotificationRecipientResponse] = []

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    notification_id: int
    title: str
    notification_type: NotificationTypeEnum
    priority: NotificationPriorityEnum
    status: NotificationStatusEnum
    created_at: datetime
    read_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==================== Notification Template ====================

class NotificationTemplateBase(BaseModel):
    name: str = Field(..., max_length=100)
    notification_type: NotificationTypeEnum
    subject_template: str = Field(..., max_length=200)
    body_template: str
    description: Optional[str] = None


class NotificationTemplateCreate(NotificationTemplateBase):
    pass


class NotificationTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    notification_type: Optional[NotificationTypeEnum] = None
    subject_template: Optional[str] = Field(None, max_length=200)
    body_template: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class NotificationTemplateResponse(NotificationTemplateBase):
    template_id: int
    is_active: bool
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== Auto Reminder Config ====================

class AutoReminderConfigBase(BaseModel):
    name: str = Field(..., max_length=100)
    reminder_type: str = Field(..., max_length=50, description="e.g., submission_deadline, review_deadline")
    days_before: int = Field(..., ge=1, le=30)
    template_id: int
    target_role: Optional[str] = None


class AutoReminderConfigCreate(AutoReminderConfigBase):
    pass


class AutoReminderConfigUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    reminder_type: Optional[str] = None
    days_before: Optional[int] = Field(None, ge=1, le=30)
    template_id: Optional[int] = None
    target_role: Optional[str] = None
    is_active: Optional[bool] = None


class AutoReminderConfigResponse(AutoReminderConfigBase):
    config_id: int
    is_active: bool
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    template_name: Optional[str] = None

    class Config:
        from_attributes = True


# ==================== User Notifications ====================

class UserNotificationSummary(BaseModel):
    total_unread: int
    unread_by_type: dict[str, int]
    recent_notifications: list[NotificationListResponse]


class MarkAsReadRequest(BaseModel):
    notification_ids: list[int]
