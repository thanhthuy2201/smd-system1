"""Router for Update Request Evaluation (FE05)"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Optional
from datetime import datetime, date

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models import (
    User, UserRole, UpdateRequest, UpdateRequestStatus, EvaluationResult,
    Syllabus, SyllabusVersion, Course, EvaluationCriteria, EvaluationTemplate
)
from app.schemas.update_request import (
    UpdateRequestCreate, UpdateRequestUpdate, UpdateRequestResponse, UpdateRequestListResponse,
    EvaluationSubmission, EvaluationResultResponse,
    DecisionRequest, DecisionResponse,
    VersionDiffResponse, SectionDiff,
    DraftChangesRequest, DraftChangesResponse
)

router = APIRouter(prefix="/update-requests", tags=["Update Requests"])


# ==================== Update Requests ====================

@router.get("", response_model=list[UpdateRequestListResponse])
def list_update_requests(
    status_filter: Optional[UpdateRequestStatus] = Query(None, alias="status"),
    syllabus_id: Optional[int] = None,
    requested_by: Optional[int] = None,
    reviewer_id: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List update requests with filtering"""
    query = db.query(
        UpdateRequest,
        Course.course_code.label("course_code"),
        Course.course_name.label("course_name"),
        (User.first_name + ' ' + User.last_name).label("requester_name")
    ).join(
        Syllabus, UpdateRequest.syllabus_id == Syllabus.syllabus_id
    ).join(
        Course, Syllabus.course_id == Course.course_id
    ).join(
        User, UpdateRequest.requested_by == User.user_id
    )

    if status_filter:
        query = query.filter(UpdateRequest.status == status_filter)
    if syllabus_id:
        query = query.filter(UpdateRequest.syllabus_id == syllabus_id)
    if requested_by:
        query = query.filter(UpdateRequest.requested_by == requested_by)
    if reviewer_id:
        query = query.filter(UpdateRequest.current_reviewer_id == reviewer_id)

    # Role-based filtering
    if current_user.role == UserRole.LECTURER:
        query = query.filter(UpdateRequest.requested_by == current_user.user_id)
    elif current_user.role == UserRole.HOD:
        # HoD sees requests from their department
        query = query.filter(
            and_(
                UpdateRequest.review_level == 1,
                Syllabus.course_id.in_(
                    db.query(Course.course_id).filter(
                        Course.department_id == current_user.department_id
                    )
                )
            )
        )

    results = query.order_by(UpdateRequest.created_at.desc()).offset(skip).limit(limit).all()

    today = date.today()
    return [
        UpdateRequestListResponse(
            request_id=req.request_id,
            syllabus_id=req.syllabus_id,
            course_code=course_code,
            course_name=course_name,
            requester_name=requester_name,
            status=req.status,
            review_level=req.review_level,
            created_at=req.created_at,
            days_pending=(today - req.created_at.date()).days if req.status in [UpdateRequestStatus.PENDING, UpdateRequestStatus.UNDER_REVIEW] else 0
        )
        for req, course_code, course_name, requester_name in results
    ]


@router.post("", response_model=UpdateRequestResponse, status_code=status.HTTP_201_CREATED)
def create_update_request(
    data: UpdateRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new update request"""
    # Validate syllabus exists
    syllabus = db.query(Syllabus).filter(Syllabus.syllabus_id == data.syllabus_id).first()
    if not syllabus:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Syllabus not found"
        )

    # Check for existing pending request
    existing = db.query(UpdateRequest).filter(
        UpdateRequest.syllabus_id == data.syllabus_id,
        UpdateRequest.status.in_([UpdateRequestStatus.PENDING, UpdateRequestStatus.UNDER_REVIEW])
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A pending update request already exists for this syllabus"
        )

    # Get current version
    current_version = db.query(SyllabusVersion).filter(
        SyllabusVersion.syllabus_id == data.syllabus_id,
        SyllabusVersion.is_current == True
    ).first()

    request = UpdateRequest(
        syllabus_id=data.syllabus_id,
        old_version_id=current_version.version_id if current_version else None,
        requested_by=current_user.user_id,
        reason=data.reason,
        status=UpdateRequestStatus.PENDING,
        review_level=1
    )
    db.add(request)
    db.commit()
    db.refresh(request)

    # Add computed fields
    request.requester_name = current_user.full_name
    course = db.query(Course).filter(Course.course_id == syllabus.course_id).first()
    if course:
        request.course_code = course.code
        request.syllabus_title = syllabus.title

    return request


@router.get("/my-requests", response_model=list[UpdateRequestListResponse])
def get_my_requests(
    status_filter: Optional[UpdateRequestStatus] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's update requests"""
    query = db.query(
        UpdateRequest,
        Course.course_code.label("course_code"),
        Course.course_name.label("course_name"),
        (User.first_name + ' ' + User.last_name).label("requester_name")
    ).join(
        Syllabus, UpdateRequest.syllabus_id == Syllabus.syllabus_id
    ).join(
        Course, Syllabus.course_id == Course.course_id
    ).join(
        User, UpdateRequest.requested_by == User.user_id
    ).filter(
        UpdateRequest.requested_by == current_user.user_id
    )

    if status_filter:
        query = query.filter(UpdateRequest.status == status_filter)

    results = query.order_by(UpdateRequest.created_at.desc()).all()

    today = date.today()
    return [
        UpdateRequestListResponse(
            request_id=req.request_id,
            syllabus_id=req.syllabus_id,
            course_code=course_code,
            course_name=course_name,
            requester_name=requester_name,
            status=req.status,
            review_level=req.review_level,
            created_at=req.created_at,
            days_pending=(today - req.created_at.date()).days if req.status in [UpdateRequestStatus.PENDING, UpdateRequestStatus.UNDER_REVIEW] else 0
        )
        for req, course_code, course_name, requester_name in results
    ]


@router.get("/pending-review", response_model=list[UpdateRequestListResponse])
def get_pending_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["HoD", "Academic Affairs", "Admin"]))
):
    """Get requests pending review by current user"""
    query = db.query(
        UpdateRequest,
        Course.course_code.label("course_code"),
        Course.course_name.label("course_name"),
        (User.first_name + ' ' + User.last_name).label("requester_name")
    ).join(
        Syllabus, UpdateRequest.syllabus_id == Syllabus.syllabus_id
    ).join(
        Course, Syllabus.course_id == Course.course_id
    ).join(
        User, UpdateRequest.requested_by == User.user_id
    ).filter(
        UpdateRequest.status == UpdateRequestStatus.UNDER_REVIEW
    )

    # Filter by role and department
    if current_user.role == UserRole.HOD:
        query = query.filter(
            UpdateRequest.review_level == 1,
            Course.department_id == current_user.department_id
        )
    elif current_user.role == UserRole.ACADEMIC_AFFAIRS:
        query = query.filter(UpdateRequest.review_level == 2)

    results = query.order_by(UpdateRequest.created_at).all()

    today = date.today()
    return [
        UpdateRequestListResponse(
            request_id=req.request_id,
            syllabus_id=req.syllabus_id,
            course_code=course_code,
            course_name=course_name,
            requester_name=requester_name,
            status=req.status,
            review_level=req.review_level,
            created_at=req.created_at,
            days_pending=(today - req.created_at.date()).days
        )
        for req, course_code, course_name, requester_name in results
    ]


@router.get("/{request_id}", response_model=UpdateRequestResponse)
def get_update_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get update request details"""
    request = db.query(UpdateRequest).filter(
        UpdateRequest.request_id == request_id
    ).first()
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Update request not found"
        )

    # Add computed fields
    requester = db.query(User).filter(User.user_id == request.requested_by).first()
    request.requester_name = requester.full_name if requester else None

    syllabus = db.query(Syllabus).filter(Syllabus.syllabus_id == request.syllabus_id).first()
    if syllabus:
        request.syllabus_title = syllabus.title
        course = db.query(Course).filter(Course.course_id == syllabus.course_id).first()
        if course:
            request.course_code = course.code

    if request.current_reviewer_id:
        reviewer = db.query(User).filter(User.user_id == request.current_reviewer_id).first()
        request.current_reviewer_name = reviewer.full_name if reviewer else None

    return request


@router.put("/{request_id}", response_model=UpdateRequestResponse)
def update_request(
    request_id: int,
    data: UpdateRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an update request (only by requester, only if pending)"""
    request = db.query(UpdateRequest).filter(
        UpdateRequest.request_id == request_id
    ).first()
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Update request not found"
        )

    if request.requested_by != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the requester can update this request"
        )

    if request.status != UpdateRequestStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only update pending requests"
        )

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(request, field, value)

    db.commit()
    db.refresh(request)
    return request


@router.post("/{request_id}/submit", response_model=UpdateRequestResponse)
def submit_for_review(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit request for review"""
    request = db.query(UpdateRequest).filter(
        UpdateRequest.request_id == request_id
    ).first()
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Update request not found"
        )

    if request.requested_by != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the requester can submit this request"
        )

    if request.status != UpdateRequestStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only submit pending requests"
        )

    request.status = UpdateRequestStatus.UNDER_REVIEW
    request.review_level = 1
    db.commit()
    db.refresh(request)
    return request


@router.post("/{request_id}/cancel", response_model=UpdateRequestResponse)
def cancel_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel an update request"""
    request = db.query(UpdateRequest).filter(
        UpdateRequest.request_id == request_id
    ).first()
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Update request not found"
        )

    if request.requested_by != current_user.user_id and current_user.role not in [UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the requester or admin can cancel this request"
        )

    if request.status in [UpdateRequestStatus.APPROVED, UpdateRequestStatus.REJECTED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel completed requests"
        )

    request.status = UpdateRequestStatus.CANCELLED
    db.commit()
    db.refresh(request)
    return request


@router.put("/{request_id}/draft-changes", response_model=DraftChangesResponse)
def save_draft_changes(
    request_id: int,
    data: DraftChangesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save proposed changes for an update request

    This creates a new draft version with the proposed changes.
    The changes are not applied until the update request is approved.
    """
    request = db.query(UpdateRequest).filter(
        UpdateRequest.request_id == request_id
    ).first()
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Update request not found"
        )

    if request.requested_by != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the requester can save draft changes"
        )

    if request.status not in [UpdateRequestStatus.PENDING, UpdateRequestStatus.REVISION_REQUIRED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only save draft changes for pending or revision-required requests"
        )

    # Get syllabus
    syllabus = db.query(Syllabus).filter(
        Syllabus.syllabus_id == request.syllabus_id
    ).first()
    if not syllabus:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Syllabus not found"
        )

    # Get or create new draft version
    if request.new_version_id:
        # Update existing draft version
        new_version = db.query(SyllabusVersion).filter(
            SyllabusVersion.version_id == request.new_version_id
        ).first()
        if new_version:
            # Update the version content
            content_json = new_version.content_json or {}
            if data.content_json:
                content_json.update(data.content_json)
            if data.description:
                content_json["description"] = data.description
            if data.learning_outcomes:
                content_json["learning_outcomes"] = data.learning_outcomes
            if data.assessment_methods:
                content_json["assessment_methods"] = data.assessment_methods
            if data.teaching_methods:
                content_json["teaching_methods"] = data.teaching_methods
            if data.textbooks:
                content_json["textbooks"] = data.textbooks
            if data.materials:
                content_json["materials"] = data.materials
            if data.prerequisites:
                content_json["prerequisites"] = data.prerequisites

            new_version.content_json = content_json
            if data.changes_summary:
                new_version.changes_summary = data.changes_summary

            db.commit()
            db.refresh(new_version)

            return DraftChangesResponse(
                request_id=request_id,
                new_version_id=new_version.version_id,
                version_number=new_version.version_number,
                message="Draft changes updated",
                saved_at=datetime.utcnow()
            )

    # Create new draft version
    max_version = db.query(SyllabusVersion).filter(
        SyllabusVersion.syllabus_id == request.syllabus_id
    ).order_by(SyllabusVersion.version_number.desc()).first()

    next_version = (max_version.version_number + 1) if max_version else 1

    # Build content JSON from provided data
    content_json = data.content_json or {}
    if data.description:
        content_json["description"] = data.description
    if data.learning_outcomes:
        content_json["learning_outcomes"] = data.learning_outcomes
    if data.assessment_methods:
        content_json["assessment_methods"] = data.assessment_methods
    if data.teaching_methods:
        content_json["teaching_methods"] = data.teaching_methods
    if data.textbooks:
        content_json["textbooks"] = data.textbooks
    if data.materials:
        content_json["materials"] = data.materials
    if data.prerequisites:
        content_json["prerequisites"] = data.prerequisites

    new_version = SyllabusVersion(
        syllabus_id=request.syllabus_id,
        version_number=next_version,
        changes_summary=data.changes_summary or "Draft changes for update request",
        content_json=content_json,
        created_by=current_user.user_id,
        is_current=False  # Not current until approved
    )
    db.add(new_version)
    db.flush()

    # Link new version to request
    request.new_version_id = new_version.version_id
    db.commit()
    db.refresh(new_version)

    return DraftChangesResponse(
        request_id=request_id,
        new_version_id=new_version.version_id,
        version_number=new_version.version_number,
        message="Draft changes saved",
        saved_at=datetime.utcnow()
    )


# ==================== Evaluation ====================

@router.post("/{request_id}/evaluate", response_model=list[EvaluationResultResponse])
def submit_evaluation(
    request_id: int,
    data: EvaluationSubmission,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["HoD", "Academic Affairs", "Admin"]))
):
    """Submit evaluation scores for a request"""
    request = db.query(UpdateRequest).filter(
        UpdateRequest.request_id == request_id
    ).first()
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Update request not found"
        )

    if request.status != UpdateRequestStatus.UNDER_REVIEW:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only evaluate requests under review"
        )

    # Validate reviewer permissions
    if current_user.role == UserRole.HOD and request.review_level != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HoD can only evaluate Level 1 reviews"
        )
    if current_user.role == UserRole.ACADEMIC_AFFAIRS and request.review_level != 2:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Academic Affairs can only evaluate Level 2 reviews"
        )

    results = []
    for score_data in data.scores:
        # Validate criteria exists
        criteria = db.query(EvaluationCriteria).filter(
            EvaluationCriteria.criteria_id == score_data.criteria_id
        ).first()
        if not criteria:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Criteria {score_data.criteria_id} not found"
            )

        # Check for existing result
        existing = db.query(EvaluationResult).filter(
            EvaluationResult.request_id == request_id,
            EvaluationResult.criteria_id == score_data.criteria_id,
            EvaluationResult.evaluator_id == current_user.user_id
        ).first()

        if existing:
            existing.score = score_data.score
            existing.comment = score_data.comment
            existing.evaluated_at = datetime.utcnow()
            result = existing
        else:
            result = EvaluationResult(
                request_id=request_id,
                criteria_id=score_data.criteria_id,
                evaluator_id=current_user.user_id,
                score=score_data.score,
                comment=score_data.comment
            )
            db.add(result)

        db.flush()

        # Add computed fields
        result.criteria_name = criteria.name
        result.max_score = criteria.max_score
        result.is_passing = score_data.score >= (criteria.passing_score or 0)
        results.append(result)

    # Update reviewer
    request.current_reviewer_id = current_user.user_id

    db.commit()
    return results


@router.get("/{request_id}/evaluations", response_model=list[EvaluationResultResponse])
def get_evaluations(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all evaluations for a request"""
    request = db.query(UpdateRequest).filter(
        UpdateRequest.request_id == request_id
    ).first()
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Update request not found"
        )

    results = db.query(EvaluationResult).filter(
        EvaluationResult.request_id == request_id
    ).all()

    # Add computed fields
    for result in results:
        criteria = db.query(EvaluationCriteria).filter(
            EvaluationCriteria.criteria_id == result.criteria_id
        ).first()
        if criteria:
            result.criteria_name = criteria.name
            result.max_score = criteria.max_score
            result.is_passing = result.score >= (criteria.passing_score or 0)

    return results


# ==================== Decision ====================

@router.post("/{request_id}/decide", response_model=DecisionResponse)
def make_decision(
    request_id: int,
    data: DecisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["HoD", "Academic Affairs", "Admin"]))
):
    """Make decision on update request"""
    request = db.query(UpdateRequest).filter(
        UpdateRequest.request_id == request_id
    ).first()
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Update request not found"
        )

    if request.status != UpdateRequestStatus.UNDER_REVIEW:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only decide on requests under review"
        )

    # Validate reviewer permissions
    if current_user.role == UserRole.HOD and request.review_level != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HoD can only decide on Level 1 reviews"
        )
    if current_user.role == UserRole.ACADEMIC_AFFAIRS and request.review_level != 2:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Academic Affairs can only decide on Level 2 reviews"
        )

    # Validate revision deadline if required
    if data.decision.value == "Revision Required" and not data.revision_deadline:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Revision deadline is required when requesting revision"
        )

    now = datetime.utcnow()

    if data.decision.value == "Approved":
        if request.review_level == 1:
            # Move to Level 2 review
            request.review_level = 2
            request.current_reviewer_id = None
        else:
            # Final approval
            request.status = UpdateRequestStatus.APPROVED
            request.decision_by = current_user.user_id
            request.decision_comments = data.comments
            request.decision_date = now
    elif data.decision.value == "Rejected":
        request.status = UpdateRequestStatus.REJECTED
        request.decision_by = current_user.user_id
        request.decision_comments = data.comments
        request.decision_date = now
    else:  # Revision Required
        request.status = UpdateRequestStatus.REVISION_REQUIRED
        request.decision_by = current_user.user_id
        request.decision_comments = data.comments
        request.decision_date = now
        request.revision_deadline = data.revision_deadline

    db.commit()
    db.refresh(request)

    return DecisionResponse(
        request_id=request_id,
        decision=data.decision,
        comments=data.comments,
        decision_by=current_user.user_id,
        decision_date=now,
        revision_deadline=data.revision_deadline
    )


# ==================== Version Diff ====================

@router.get("/{request_id}/diff", response_model=VersionDiffResponse)
def get_version_diff(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get diff between old and new syllabus versions"""
    request = db.query(UpdateRequest).filter(
        UpdateRequest.request_id == request_id
    ).first()
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Update request not found"
        )

    if not request.old_version_id or not request.new_version_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Version information not available"
        )

    old_version = db.query(SyllabusVersion).filter(
        SyllabusVersion.version_id == request.old_version_id
    ).first()
    new_version = db.query(SyllabusVersion).filter(
        SyllabusVersion.version_id == request.new_version_id
    ).first()

    if not old_version or not new_version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Version not found"
        )

    # Compare sections
    sections = []
    old_content = old_version.content or {}
    new_content = new_version.content or {}

    all_keys = set(old_content.keys()) | set(new_content.keys())

    for key in sorted(all_keys):
        old_val = old_content.get(key)
        new_val = new_content.get(key)

        if old_val is None:
            change_type = "added"
        elif new_val is None:
            change_type = "removed"
        elif old_val != new_val:
            change_type = "modified"
        else:
            change_type = "unchanged"

        sections.append(SectionDiff(
            section=key,
            old_content=str(old_val) if old_val else None,
            new_content=str(new_val) if new_val else None,
            change_type=change_type
        ))

    return VersionDiffResponse(
        request_id=request_id,
        old_version=old_version.version_number,
        new_version=new_version.version_number,
        sections=sections
    )
