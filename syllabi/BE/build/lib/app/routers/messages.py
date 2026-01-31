"""Router for Internal Messaging (FE08)"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, Syllabus, Message
from app.schemas.lecturer import (
    MessageCreate, MessageReply, MessageResponse, MessageListResponse, ConversationResponse
)

router = APIRouter(prefix="/messages", tags=["Messages"])


@router.get("/inbox", response_model=list[MessageListResponse])
def get_inbox(
    unread_only: bool = False,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get inbox messages"""
    query = db.query(Message).filter(
        Message.recipient_id == current_user.user_id,
        Message.is_deleted_by_recipient == False
    )

    if unread_only:
        query = query.filter(Message.is_read == False)

    messages = query.order_by(Message.sent_at.desc()).offset(skip).limit(limit).all()

    result = []
    for m in messages:
        sender = db.query(User).filter(User.user_id == m.sender_id).first()
        result.append(MessageListResponse(
            message_id=m.message_id,
            sender_id=m.sender_id,
            sender_name=sender.full_name if sender else None,
            recipient_id=m.recipient_id,
            recipient_name=current_user.full_name,
            subject=m.subject,
            is_read=m.is_read,
            sent_at=m.sent_at,
            has_attachments=len(m.attachments) > 0 if m.attachments else False
        ))

    return result


@router.get("/sent", response_model=list[MessageListResponse])
def get_sent_messages(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get sent messages"""
    messages = db.query(Message).filter(
        Message.sender_id == current_user.user_id,
        Message.is_deleted_by_sender == False
    ).order_by(Message.sent_at.desc()).offset(skip).limit(limit).all()

    result = []
    for m in messages:
        recipient = db.query(User).filter(User.user_id == m.recipient_id).first()
        result.append(MessageListResponse(
            message_id=m.message_id,
            sender_id=m.sender_id,
            sender_name=current_user.full_name,
            recipient_id=m.recipient_id,
            recipient_name=recipient.full_name if recipient else None,
            subject=m.subject,
            is_read=m.is_read,
            sent_at=m.sent_at,
            has_attachments=len(m.attachments) > 0 if m.attachments else False
        ))

    return result


@router.get("/conversation/{user_id}", response_model=list[MessageResponse])
def get_conversation(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get conversation thread with a user"""
    messages = db.query(Message).filter(
        or_(
            and_(Message.sender_id == current_user.user_id, Message.recipient_id == user_id, Message.is_deleted_by_sender == False),
            and_(Message.sender_id == user_id, Message.recipient_id == current_user.user_id, Message.is_deleted_by_recipient == False)
        )
    ).order_by(Message.sent_at.desc()).offset(skip).limit(limit).all()

    other_user = db.query(User).filter(User.user_id == user_id).first()

    result = []
    for m in messages:
        syllabus_title = None
        if m.syllabus_id:
            syllabus = db.query(Syllabus).filter(Syllabus.syllabus_id == m.syllabus_id).first()
            syllabus_title = syllabus.title if syllabus else None

        result.append(MessageResponse(
            message_id=m.message_id,
            sender_id=m.sender_id,
            sender_name=current_user.full_name if m.sender_id == current_user.user_id else (other_user.full_name if other_user else None),
            recipient_id=m.recipient_id,
            recipient_name=other_user.full_name if m.recipient_id == user_id else current_user.full_name,
            subject=m.subject,
            body=m.body,
            syllabus_id=m.syllabus_id,
            syllabus_title=syllabus_title,
            parent_message_id=m.parent_message_id,
            is_read=m.is_read,
            read_at=m.read_at,
            sent_at=m.sent_at,
            attachments=[{"name": a.file_name, "size": a.file_size} for a in m.attachments] if m.attachments else []
        ))

    return result


@router.get("/conversations", response_model=list[ConversationResponse])
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of conversations with unread counts"""
    # Get all unique users the current user has messaged with
    sent_to = db.query(Message.recipient_id).filter(
        Message.sender_id == current_user.user_id
    ).distinct()

    received_from = db.query(Message.sender_id).filter(
        Message.recipient_id == current_user.user_id
    ).distinct()

    user_ids = set()
    for (uid,) in sent_to.all():
        user_ids.add(uid)
    for (uid,) in received_from.all():
        user_ids.add(uid)

    conversations = []
    for uid in user_ids:
        user = db.query(User).filter(User.user_id == uid).first()
        if not user:
            continue

        # Get last message
        last_msg = db.query(Message).filter(
            or_(
                and_(Message.sender_id == current_user.user_id, Message.recipient_id == uid),
                and_(Message.sender_id == uid, Message.recipient_id == current_user.user_id)
            )
        ).order_by(Message.sent_at.desc()).first()

        # Count unread
        unread = db.query(func.count(Message.message_id)).filter(
            Message.sender_id == uid,
            Message.recipient_id == current_user.user_id,
            Message.is_read == False
        ).scalar() or 0

        if last_msg:
            conversations.append(ConversationResponse(
                user_id=uid,
                user_name=user.full_name,
                last_message=last_msg.body[:100] + "..." if len(last_msg.body) > 100 else last_msg.body,
                last_message_at=last_msg.sent_at,
                unread_count=unread
            ))

    return sorted(conversations, key=lambda x: x.last_message_at, reverse=True)


@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send new message"""
    # Validate recipient exists
    recipient = db.query(User).filter(User.user_id == data.recipient_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")

    # Validate syllabus if provided
    syllabus_title = None
    if data.syllabus_id:
        syllabus = db.query(Syllabus).filter(Syllabus.syllabus_id == data.syllabus_id).first()
        if not syllabus:
            raise HTTPException(status_code=404, detail="Syllabus not found")
        syllabus_title = syllabus.title

    message = Message(
        sender_id=current_user.user_id,
        recipient_id=data.recipient_id,
        subject=data.subject,
        body=data.body,
        syllabus_id=data.syllabus_id
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    return MessageResponse(
        message_id=message.message_id,
        sender_id=message.sender_id,
        sender_name=current_user.full_name,
        recipient_id=message.recipient_id,
        recipient_name=recipient.full_name,
        subject=message.subject,
        body=message.body,
        syllabus_id=message.syllabus_id,
        syllabus_title=syllabus_title,
        parent_message_id=None,
        is_read=False,
        read_at=None,
        sent_at=message.sent_at,
        attachments=[]
    )


@router.post("/{message_id}/reply", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def reply_to_message(
    message_id: int,
    data: MessageReply,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reply to message"""
    original = db.query(Message).filter(Message.message_id == message_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Message not found")

    # Must be sender or recipient of original
    if original.sender_id != current_user.user_id and original.recipient_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to reply to this message")

    # Determine recipient (the other party)
    recipient_id = original.sender_id if original.recipient_id == current_user.user_id else original.recipient_id
    recipient = db.query(User).filter(User.user_id == recipient_id).first()

    reply = Message(
        sender_id=current_user.user_id,
        recipient_id=recipient_id,
        subject=f"Re: {original.subject}" if not original.subject.startswith("Re:") else original.subject,
        body=data.body,
        syllabus_id=original.syllabus_id,
        parent_message_id=message_id
    )
    db.add(reply)
    db.commit()
    db.refresh(reply)

    syllabus_title = None
    if reply.syllabus_id:
        syllabus = db.query(Syllabus).filter(Syllabus.syllabus_id == reply.syllabus_id).first()
        syllabus_title = syllabus.title if syllabus else None

    return MessageResponse(
        message_id=reply.message_id,
        sender_id=reply.sender_id,
        sender_name=current_user.full_name,
        recipient_id=reply.recipient_id,
        recipient_name=recipient.full_name if recipient else None,
        subject=reply.subject,
        body=reply.body,
        syllabus_id=reply.syllabus_id,
        syllabus_title=syllabus_title,
        parent_message_id=reply.parent_message_id,
        is_read=False,
        read_at=None,
        sent_at=reply.sent_at,
        attachments=[]
    )


@router.put("/{message_id}/read")
def mark_as_read(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark message as read"""
    message = db.query(Message).filter(
        Message.message_id == message_id,
        Message.recipient_id == current_user.user_id
    ).first()

    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    if not message.is_read:
        message.is_read = True
        message.read_at = datetime.utcnow()
        db.commit()

    return {"message": "Marked as read", "read_at": message.read_at.isoformat()}


@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete message (soft delete)"""
    message = db.query(Message).filter(Message.message_id == message_id).first()

    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    if message.sender_id == current_user.user_id:
        message.is_deleted_by_sender = True
    elif message.recipient_id == current_user.user_id:
        message.is_deleted_by_recipient = True
    else:
        raise HTTPException(status_code=403, detail="Not authorized to delete this message")

    db.commit()


@router.get("/contacts")
def get_contacts(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get available contacts for messaging"""
    query = db.query(User).filter(
        User.user_id != current_user.user_id,
        User.is_active == True
    )

    if search:
        query = query.filter(
            or_(
                User.first_name.ilike(f"%{search}%"),
                User.last_name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%")
            )
        )

    users = query.limit(20).all()

    return [
        {
            "user_id": u.user_id,
            "name": u.full_name,
            "email": u.email,
            "role": u.role.value,
            "department_id": u.department_id
        }
        for u in users
    ]
