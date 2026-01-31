"""Router for Notification Management (FE06)"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models import (
    User, UserRole, Department,
    Notification, NotificationRecipient, NotificationTemplate,
    AutoReminderConfig, NotificationType, NotificationPriority, NotificationStatus
)
from app.schemas.notification import (
    NotificationCreate, NotificationBroadcast, NotificationResponse, NotificationListResponse,
    NotificationRecipientResponse,
    NotificationTemplateCreate, NotificationTemplateUpdate, NotificationTemplateResponse,
    AutoReminderConfigCreate, AutoReminderConfigUpdate, AutoReminderConfigResponse,
    UserNotificationSummary, MarkAsReadRequest
)

router = APIRouter(prefix="/notifications", tags=["Notifications"])


# ==================== User Notifications ====================

@router.get("/my-notifications", response_model=list[NotificationListResponse])
def get_my_notifications(
    unread_only: bool = False,
    notification_type: Optional[NotificationType] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's notifications"""
    query = db.query(
        Notification,
        NotificationRecipient.status,
        NotificationRecipient.read_at
    ).join(
        NotificationRecipient,
        Notification.notification_id == NotificationRecipient.notification_id
    ).filter(
        NotificationRecipient.user_id == current_user.user_id
    )

    if unread_only:
        query = query.filter(NotificationRecipient.status != NotificationStatus.READ)

    if notification_type:
        query = query.filter(Notification.notification_type == notification_type)

    results = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()

    return [
        NotificationListResponse(
            notification_id=n.notification_id,
            title=n.title,
            notification_type=n.notification_type,
            priority=n.priority,
            status=recipient_status,
            created_at=n.created_at,
            read_at=read_at
        )
        for n, recipient_status, read_at in results
    ]


@router.get("/my-notifications/summary", response_model=UserNotificationSummary)
def get_notification_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get notification summary for current user"""
    # Count unread
    unread_count = db.query(func.count(NotificationRecipient.recipient_id)).filter(
        NotificationRecipient.user_id == current_user.user_id,
        NotificationRecipient.status != NotificationStatus.READ
    ).scalar() or 0

    # Count by type
    type_counts = db.query(
        Notification.notification_type,
        func.count(NotificationRecipient.recipient_id)
    ).join(
        NotificationRecipient,
        Notification.notification_id == NotificationRecipient.notification_id
    ).filter(
        NotificationRecipient.user_id == current_user.user_id,
        NotificationRecipient.status != NotificationStatus.READ
    ).group_by(Notification.notification_type).all()

    unread_by_type = {t.value: c for t, c in type_counts}

    # Get recent notifications
    recent = db.query(
        Notification,
        NotificationRecipient.status,
        NotificationRecipient.read_at
    ).join(
        NotificationRecipient,
        Notification.notification_id == NotificationRecipient.notification_id
    ).filter(
        NotificationRecipient.user_id == current_user.user_id
    ).order_by(Notification.created_at.desc()).limit(5).all()

    recent_list = [
        NotificationListResponse(
            notification_id=n.notification_id,
            title=n.title,
            notification_type=n.notification_type,
            priority=n.priority,
            status=recipient_status,
            created_at=n.created_at,
            read_at=read_at
        )
        for n, recipient_status, read_at in recent
    ]

    return UserNotificationSummary(
        total_unread=unread_count,
        unread_by_type=unread_by_type,
        recent_notifications=recent_list
    )


@router.post("/mark-as-read")
def mark_notifications_read(
    data: MarkAsReadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark notifications as read"""
    now = datetime.utcnow()

    updated = db.query(NotificationRecipient).filter(
        NotificationRecipient.user_id == current_user.user_id,
        NotificationRecipient.notification_id.in_(data.notification_ids)
    ).update({
        "status": NotificationStatus.READ,
        "read_at": now
    }, synchronize_session=False)

    db.commit()

    return {"marked_as_read": updated}


@router.post("/mark-all-read")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark all notifications as read"""
    now = datetime.utcnow()

    updated = db.query(NotificationRecipient).filter(
        NotificationRecipient.user_id == current_user.user_id,
        NotificationRecipient.status != NotificationStatus.READ
    ).update({
        "status": NotificationStatus.READ,
        "read_at": now
    }, synchronize_session=False)

    db.commit()

    return {"marked_as_read": updated}


# ==================== Send Notifications ====================

@router.post("", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def create_notification(
    data: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Academic Affairs"]))
):
    """Create and send a notification to specific users"""
    # Validate recipients exist
    recipients = db.query(User).filter(User.user_id.in_(data.recipient_ids)).all()
    if len(recipients) != len(data.recipient_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Some recipient IDs are invalid"
        )

    notification = Notification(
        title=data.title,
        content=data.content,
        notification_type=data.notification_type,
        priority=data.priority,
        created_by=current_user.user_id,
        related_entity_type=data.related_entity_type,
        related_entity_id=data.related_entity_id,
        scheduled_at=data.scheduled_at
    )
    db.add(notification)
    db.flush()

    # Create recipient records
    for user_id in data.recipient_ids:
        recipient = NotificationRecipient(
            notification_id=notification.notification_id,
            user_id=user_id,
            status=NotificationStatus.PENDING
        )
        db.add(recipient)

    # Mark as sent if not scheduled
    if not data.scheduled_at:
        notification.sent_at = datetime.utcnow()
        db.query(NotificationRecipient).filter(
            NotificationRecipient.notification_id == notification.notification_id
        ).update({"status": NotificationStatus.SENT})

    db.commit()
    db.refresh(notification)
    return notification


@router.post("/broadcast", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def broadcast_notification(
    data: NotificationBroadcast,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Academic Affairs"]))
):
    """Broadcast notification to all users or filtered by role/department"""
    # Build recipient query
    query = db.query(User).filter(User.is_active == True)

    if not data.send_to_all:
        if data.target_role:
            try:
                role = UserRole(data.target_role)
                query = query.filter(User.role == role)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid role: {data.target_role}"
                )

        if data.target_department_id:
            query = query.filter(User.department_id == data.target_department_id)

    recipients = query.all()

    if not recipients:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No recipients match the criteria"
        )

    notification = Notification(
        title=data.title,
        content=data.content,
        notification_type=data.notification_type,
        priority=data.priority,
        created_by=current_user.user_id,
        sent_at=datetime.utcnow()
    )
    db.add(notification)
    db.flush()

    # Create recipient records
    for user in recipients:
        recipient = NotificationRecipient(
            notification_id=notification.notification_id,
            user_id=user.user_id,
            status=NotificationStatus.SENT
        )
        db.add(recipient)

    db.commit()
    db.refresh(notification)
    return notification


@router.get("/{notification_id}", response_model=NotificationResponse)
def get_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get notification details"""
    notification = db.query(Notification).filter(
        Notification.notification_id == notification_id
    ).first()

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    # Check if user is recipient or admin
    is_recipient = db.query(NotificationRecipient).filter(
        NotificationRecipient.notification_id == notification_id,
        NotificationRecipient.user_id == current_user.user_id
    ).first()

    if not is_recipient and current_user.role not in [UserRole.ADMIN, UserRole.ACADEMIC_AFFAIRS]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this notification"
        )

    # Add recipient details
    for recipient in notification.recipients:
        user = db.query(User).filter(User.user_id == recipient.user_id).first()
        if user:
            recipient.user_name = user.full_name
            recipient.user_email = user.email

    return notification


# ==================== Notification Templates ====================

@router.get("/templates", response_model=list[NotificationTemplateResponse])
def list_templates(
    is_active: Optional[bool] = None,
    notification_type: Optional[NotificationType] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Academic Affairs"]))
):
    """List notification templates"""
    query = db.query(NotificationTemplate)

    if is_active is not None:
        query = query.filter(NotificationTemplate.is_active == is_active)
    if notification_type:
        query = query.filter(NotificationTemplate.notification_type == notification_type)

    return query.order_by(NotificationTemplate.name).all()


@router.post("/templates", response_model=NotificationTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_template(
    data: NotificationTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Academic Affairs"]))
):
    """Create a notification template"""
    template = NotificationTemplate(
        name=data.name,
        notification_type=data.notification_type,
        subject_template=data.subject_template,
        body_template=data.body_template,
        description=data.description,
        created_by=current_user.user_id
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


@router.put("/templates/{template_id}", response_model=NotificationTemplateResponse)
def update_template(
    template_id: int,
    data: NotificationTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Academic Affairs"]))
):
    """Update a notification template"""
    template = db.query(NotificationTemplate).filter(
        NotificationTemplate.template_id == template_id
    ).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(template, field, value)

    db.commit()
    db.refresh(template)
    return template


@router.delete("/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin"]))
):
    """Delete a notification template"""
    template = db.query(NotificationTemplate).filter(
        NotificationTemplate.template_id == template_id
    ).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    db.delete(template)
    db.commit()


# ==================== Auto Reminder Configs ====================

@router.get("/auto-reminders", response_model=list[AutoReminderConfigResponse])
def list_auto_reminders(
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Academic Affairs"]))
):
    """List auto reminder configurations"""
    query = db.query(AutoReminderConfig)

    if is_active is not None:
        query = query.filter(AutoReminderConfig.is_active == is_active)

    configs = query.order_by(AutoReminderConfig.name).all()

    # Add template names
    for config in configs:
        template = db.query(NotificationTemplate).filter(
            NotificationTemplate.template_id == config.template_id
        ).first()
        if template:
            config.template_name = template.name

    return configs


@router.post("/auto-reminders", response_model=AutoReminderConfigResponse, status_code=status.HTTP_201_CREATED)
def create_auto_reminder(
    data: AutoReminderConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Academic Affairs"]))
):
    """Create an auto reminder configuration"""
    # Validate template exists
    template = db.query(NotificationTemplate).filter(
        NotificationTemplate.template_id == data.template_id
    ).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    config = AutoReminderConfig(
        name=data.name,
        reminder_type=data.reminder_type,
        days_before=data.days_before,
        template_id=data.template_id,
        target_role=data.target_role,
        created_by=current_user.user_id
    )
    db.add(config)
    db.commit()
    db.refresh(config)

    config.template_name = template.name
    return config


@router.put("/auto-reminders/{config_id}", response_model=AutoReminderConfigResponse)
def update_auto_reminder(
    config_id: int,
    data: AutoReminderConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Academic Affairs"]))
):
    """Update an auto reminder configuration"""
    config = db.query(AutoReminderConfig).filter(
        AutoReminderConfig.config_id == config_id
    ).first()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration not found"
        )

    # Validate template if updating
    if data.template_id:
        template = db.query(NotificationTemplate).filter(
            NotificationTemplate.template_id == data.template_id
        ).first()
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(config, field, value)

    db.commit()
    db.refresh(config)
    return config


@router.delete("/auto-reminders/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_auto_reminder(
    config_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin"]))
):
    """Delete an auto reminder configuration"""
    config = db.query(AutoReminderConfig).filter(
        AutoReminderConfig.config_id == config_id
    ).first()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration not found"
        )

    db.delete(config)
    db.commit()
