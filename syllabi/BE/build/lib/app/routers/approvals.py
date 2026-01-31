"""Approvals Router - Syllabus Approval Workflow APIs"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, UserRole
from app.models.syllabus import Syllabus, SyllabusStatus
from app.models.approval_history import ApprovalHistory, ApprovalAction
from app.schemas.approval import (
    ApprovalResponse, ApprovalHistoryList, ApproveRequest, RejectRequest
)

router = APIRouter()


def require_reviewer(current_user: User = Depends(get_current_user)):
    """Dependency to require reviewer role (HoD, Academic Affairs, Admin)"""
    allowed_roles = [UserRole.ADMIN, UserRole.HOD, UserRole.ACADEMIC_AFFAIRS]
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Reviewer access required (HoD, Academic Affairs, or Admin)"
        )
    return current_user


@router.get(
    "/syllabi/{syllabus_id}/approvals",
    response_model=ApprovalHistoryList,
    summary="Get Approval History",
    description="Get the complete approval history for a syllabus."
)
async def get_approval_history(
    syllabus_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get approval history for a syllabus.
    """
    syllabus = db.query(Syllabus).filter(Syllabus.syllabus_id == syllabus_id).first()
    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    query = db.query(ApprovalHistory).filter(ApprovalHistory.syllabus_id == syllabus_id)
    total = query.count()
    approvals = query.order_by(ApprovalHistory.review_date.desc()).offset(skip).limit(limit).all()

    return {"total": total, "items": approvals}


@router.post(
    "/syllabi/{syllabus_id}/approve",
    response_model=ApprovalResponse,
    summary="Approve Syllabus",
    description="Approve a syllabus. **Reviewer only (HoD, Academic Affairs, Admin).**"
)
async def approve_syllabus(
    syllabus_id: int,
    approval_data: ApproveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_reviewer)
):
    """
    Approve a syllabus.

    - HoD approval: First level review (academic quality)
    - Academic Affairs approval: Second level review (compliance)
    - Final approval changes status to 'Approved'
    """
    syllabus = db.query(Syllabus).filter(Syllabus.syllabus_id == syllabus_id).first()
    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    # Check if syllabus is pending review
    if syllabus.status != SyllabusStatus.PENDING_REVIEW:
        raise HTTPException(
            status_code=400,
            detail="Can only approve syllabi with 'Pending Review' status"
        )

    # Determine if this is final approval
    is_final = approval_data.next_approver_id is None

    # Create approval record
    approval = ApprovalHistory(
        syllabus_id=syllabus_id,
        version_id=syllabus.version_id,
        approver_id=current_user.user_id,
        approver_role=current_user.role.value,
        action=ApprovalAction.APPROVED,
        comments=approval_data.comments,
        next_approver_id=approval_data.next_approver_id,
        is_completed=is_final
    )

    db.add(approval)

    # Update syllabus status if final approval
    if is_final:
        syllabus.status = SyllabusStatus.APPROVED

    db.commit()
    db.refresh(approval)

    return approval


@router.post(
    "/syllabi/{syllabus_id}/reject",
    response_model=ApprovalResponse,
    summary="Reject Syllabus",
    description="Reject a syllabus and request revision. **Reviewer only.**"
)
async def reject_syllabus(
    syllabus_id: int,
    rejection_data: RejectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_reviewer)
):
    """
    Reject a syllabus.

    The syllabus status will be changed back to 'Draft' for revision.
    A reason must be provided.
    """
    syllabus = db.query(Syllabus).filter(Syllabus.syllabus_id == syllabus_id).first()
    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    # Check if syllabus is pending review
    if syllabus.status != SyllabusStatus.PENDING_REVIEW:
        raise HTTPException(
            status_code=400,
            detail="Can only reject syllabi with 'Pending Review' status"
        )

    # Create rejection record
    approval = ApprovalHistory(
        syllabus_id=syllabus_id,
        version_id=syllabus.version_id,
        approver_id=current_user.user_id,
        approver_role=current_user.role.value,
        action=ApprovalAction.REJECTED,
        comments=rejection_data.comments,
        deadline=rejection_data.deadline,
        is_completed=False
    )

    db.add(approval)

    # Update syllabus status back to draft
    syllabus.status = SyllabusStatus.DRAFT

    db.commit()
    db.refresh(approval)

    return approval


@router.get(
    "/approvals/pending",
    response_model=ApprovalHistoryList,
    summary="Get Pending Approvals",
    description="Get all syllabi pending approval for the current reviewer."
)
async def get_pending_approvals(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_reviewer)
):
    """
    Get all syllabi pending approval.

    Returns syllabi that are waiting for the current user's review.
    """
    # Get syllabi pending review
    query = db.query(Syllabus).filter(Syllabus.status == SyllabusStatus.PENDING_REVIEW)

    # If HoD, filter by department
    if current_user.role == UserRole.DEPARTMENT_HEAD and current_user.department_id:
        from app.models.course import Course
        query = query.join(Course).filter(Course.department_id == current_user.department_id)

    total = query.count()
    syllabi = query.offset(skip).limit(limit).all()

    # Convert to approval-like format
    pending_items = []
    for syllabus in syllabi:
        # Create a pseudo-approval record for display
        pending_item = ApprovalHistory(
            approval_id=0,  # Placeholder
            syllabus_id=syllabus.syllabus_id,
            version_id=syllabus.version_id,
            approver_id=current_user.user_id,
            approver_role=current_user.role.value,
            action=ApprovalAction.SUBMITTED,
            is_completed=False
        )
        pending_items.append(pending_item)

    return {"total": total, "items": pending_items}


@router.post(
    "/syllabi/{syllabus_id}/return",
    response_model=ApprovalResponse,
    summary="Return for Revision",
    description="Return a syllabus for revision with feedback. **Reviewer only.**"
)
async def return_for_revision(
    syllabus_id: int,
    return_data: RejectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_reviewer)
):
    """
    Return a syllabus for revision.

    Similar to reject, but indicates the syllabus needs minor changes.
    """
    syllabus = db.query(Syllabus).filter(Syllabus.syllabus_id == syllabus_id).first()
    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    if syllabus.status != SyllabusStatus.PENDING_REVIEW:
        raise HTTPException(
            status_code=400,
            detail="Can only return syllabi with 'Pending Review' status"
        )

    # Create return record
    approval = ApprovalHistory(
        syllabus_id=syllabus_id,
        version_id=syllabus.version_id,
        approver_id=current_user.user_id,
        approver_role=current_user.role.value,
        action=ApprovalAction.RETURNED_FOR_REVISION,
        comments=return_data.comments,
        deadline=return_data.deadline,
        is_completed=False
    )

    db.add(approval)

    # Update syllabus status back to draft
    syllabus.status = SyllabusStatus.DRAFT

    db.commit()
    db.refresh(approval)

    return approval
