"""Router for Syllabus Comments/Feedback (FE07)"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, Syllabus, SyllabusComment, CommentType, CommentPriority
from app.schemas.lecturer import (
    CommentCreate, CommentReply, CommentUpdate, CommentResponse
)

router = APIRouter(prefix="/syllabi/{syllabus_id}/comments", tags=["Syllabus Comments"])


@router.get("", response_model=list[CommentResponse])
def get_comments(
    syllabus_id: int,
    resolved: Optional[bool] = None,
    comment_type: Optional[CommentType] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all comments on a syllabus"""
    syllabus = db.query(Syllabus).filter(Syllabus.syllabus_id == syllabus_id).first()
    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    query = db.query(SyllabusComment).filter(
        SyllabusComment.syllabus_id == syllabus_id,
        SyllabusComment.parent_comment_id == None  # Top-level comments only
    )

    if resolved is not None:
        query = query.filter(SyllabusComment.is_resolved == resolved)
    if comment_type:
        query = query.filter(SyllabusComment.comment_type == comment_type)

    comments = query.order_by(SyllabusComment.created_at.desc()).all()

    def build_comment_response(comment):
        author = db.query(User).filter(User.user_id == comment.user_id).first()
        resolver = None
        if comment.resolved_by:
            resolver = db.query(User).filter(User.user_id == comment.resolved_by).first()

        # Get replies
        replies = db.query(SyllabusComment).filter(
            SyllabusComment.parent_comment_id == comment.comment_id
        ).order_by(SyllabusComment.created_at).all()

        reply_responses = [build_comment_response(r) for r in replies]

        return CommentResponse(
            comment_id=comment.comment_id,
            syllabus_id=comment.syllabus_id,
            user_id=comment.user_id,
            author_name=author.full_name if author else None,
            parent_comment_id=comment.parent_comment_id,
            comment_type=comment.comment_type,
            section_reference=comment.section_reference,
            content=comment.content,
            priority=comment.priority,
            is_resolved=comment.is_resolved,
            resolved_by=comment.resolved_by,
            resolver_name=resolver.full_name if resolver else None,
            resolved_at=comment.resolved_at,
            created_at=comment.created_at,
            updated_at=comment.updated_at,
            replies=reply_responses
        )

    return [build_comment_response(c) for c in comments]


@router.post("", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def add_comment(
    syllabus_id: int,
    data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add new comment to syllabus"""
    syllabus = db.query(Syllabus).filter(Syllabus.syllabus_id == syllabus_id).first()
    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    comment = SyllabusComment(
        syllabus_id=syllabus_id,
        user_id=current_user.user_id,
        comment_type=data.comment_type,
        section_reference=data.section_reference,
        content=data.content,
        priority=data.priority
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    return CommentResponse(
        comment_id=comment.comment_id,
        syllabus_id=comment.syllabus_id,
        user_id=comment.user_id,
        author_name=current_user.full_name,
        parent_comment_id=None,
        comment_type=comment.comment_type,
        section_reference=comment.section_reference,
        content=comment.content,
        priority=comment.priority,
        is_resolved=comment.is_resolved,
        resolved_by=None,
        resolver_name=None,
        resolved_at=None,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
        replies=[]
    )


@router.post("/{comment_id}/reply", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def reply_to_comment(
    syllabus_id: int,
    comment_id: int,
    data: CommentReply,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reply to existing comment"""
    parent = db.query(SyllabusComment).filter(
        SyllabusComment.comment_id == comment_id,
        SyllabusComment.syllabus_id == syllabus_id
    ).first()

    if not parent:
        raise HTTPException(status_code=404, detail="Comment not found")

    reply = SyllabusComment(
        syllabus_id=syllabus_id,
        user_id=current_user.user_id,
        parent_comment_id=comment_id,
        comment_type=parent.comment_type,
        section_reference=parent.section_reference,
        content=data.content
    )
    db.add(reply)
    db.commit()
    db.refresh(reply)

    return CommentResponse(
        comment_id=reply.comment_id,
        syllabus_id=reply.syllabus_id,
        user_id=reply.user_id,
        author_name=current_user.full_name,
        parent_comment_id=reply.parent_comment_id,
        comment_type=reply.comment_type,
        section_reference=reply.section_reference,
        content=reply.content,
        priority=None,
        is_resolved=reply.is_resolved,
        resolved_by=None,
        resolver_name=None,
        resolved_at=None,
        created_at=reply.created_at,
        updated_at=reply.updated_at,
        replies=[]
    )


@router.put("/{comment_id}", response_model=CommentResponse)
def update_comment(
    syllabus_id: int,
    comment_id: int,
    data: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Edit own comment"""
    comment = db.query(SyllabusComment).filter(
        SyllabusComment.comment_id == comment_id,
        SyllabusComment.syllabus_id == syllabus_id,
        SyllabusComment.user_id == current_user.user_id
    ).first()

    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found or not authorized")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(comment, field, value)

    db.commit()
    db.refresh(comment)

    return CommentResponse(
        comment_id=comment.comment_id,
        syllabus_id=comment.syllabus_id,
        user_id=comment.user_id,
        author_name=current_user.full_name,
        parent_comment_id=comment.parent_comment_id,
        comment_type=comment.comment_type,
        section_reference=comment.section_reference,
        content=comment.content,
        priority=comment.priority,
        is_resolved=comment.is_resolved,
        resolved_by=comment.resolved_by,
        resolver_name=None,
        resolved_at=comment.resolved_at,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
        replies=[]
    )


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    syllabus_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete own comment"""
    comment = db.query(SyllabusComment).filter(
        SyllabusComment.comment_id == comment_id,
        SyllabusComment.syllabus_id == syllabus_id,
        SyllabusComment.user_id == current_user.user_id
    ).first()

    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found or not authorized")

    db.delete(comment)
    db.commit()


@router.put("/{comment_id}/resolve")
def resolve_comment(
    syllabus_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark comment as resolved"""
    comment = db.query(SyllabusComment).filter(
        SyllabusComment.comment_id == comment_id,
        SyllabusComment.syllabus_id == syllabus_id
    ).first()

    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Only syllabus owner or comment author can resolve
    syllabus = db.query(Syllabus).filter(Syllabus.syllabus_id == syllabus_id).first()
    if syllabus.created_by != current_user.user_id and comment.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to resolve this comment")

    comment.is_resolved = True
    comment.resolved_by = current_user.user_id
    comment.resolved_at = datetime.utcnow()

    db.commit()

    return {"message": "Comment resolved", "resolved_at": comment.resolved_at.isoformat()}
