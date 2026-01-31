"""Router for Review Schedule Management (FE03)"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import date

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models import (
    User, UserRole, ReviewSchedule, ReviewerAssignment,
    Semester, AcademicYear, Department, Syllabus, UpdateRequest
)
from app.schemas.review_schedule import (
    ReviewScheduleCreate, ReviewScheduleUpdate, ReviewScheduleResponse,
    ReviewScheduleListResponse, ReviewScheduleListPaginated,
    ReviewerAssignmentCreate, ReviewerAssignmentResponse,
    ReviewProgressResponse, AvailableReviewerResponse
)

router = APIRouter(prefix="/review-schedules", tags=["Review Schedules"])


# ==================== Review Schedule ====================

@router.get("", response_model=ReviewScheduleListPaginated)
def list_review_schedules(
    semester_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    pageSize: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all review schedules with optional filtering and pagination"""
    # Base query for counting
    count_query = db.query(ReviewSchedule)
    if semester_id:
        count_query = count_query.filter(ReviewSchedule.semester_id == semester_id)
    if is_active is not None:
        count_query = count_query.filter(ReviewSchedule.is_active == is_active)
    total = count_query.count()

    # Calculate offset from page
    skip = (page - 1) * pageSize
    total_pages = (total + pageSize - 1) // pageSize if pageSize > 0 else 1

    # Main query with joins
    query = db.query(
        ReviewSchedule,
        Semester.name.label("semester_name"),
        AcademicYear.name.label("academic_year"),
        func.count(ReviewerAssignment.assignment_id).label("assignment_count")
    ).join(
        Semester, ReviewSchedule.semester_id == Semester.semester_id
    ).join(
        AcademicYear, Semester.academic_year_id == AcademicYear.academic_year_id
    ).outerjoin(
        ReviewerAssignment
    ).group_by(
        ReviewSchedule.schedule_id, Semester.name, AcademicYear.name
    )

    if semester_id:
        query = query.filter(ReviewSchedule.semester_id == semester_id)
    if is_active is not None:
        query = query.filter(ReviewSchedule.is_active == is_active)

    results = query.order_by(ReviewSchedule.review_start.desc()).offset(skip).limit(pageSize).all()

    items = [
        ReviewScheduleListResponse(
            schedule_id=rs.schedule_id,
            name=rs.name,
            semester_name=semester_name,
            academic_year=academic_year,
            review_start=rs.review_start,
            l1_deadline=rs.l1_deadline,
            l2_deadline=rs.l2_deadline,
            final_approval=rs.final_approval,
            is_active=rs.is_active,
            assignment_count=count
        )
        for rs, semester_name, academic_year, count in results
    ]

    return ReviewScheduleListPaginated(
        total=total,
        page=page,
        pageSize=pageSize,
        totalPages=total_pages,
        items=items
    )


@router.post("", response_model=ReviewScheduleResponse, status_code=status.HTTP_201_CREATED)
def create_review_schedule(
    data: ReviewScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Academic Affairs"]))
):
    """Create a new review schedule"""
    # Validate semester exists
    semester = db.query(Semester).filter(Semester.semester_id == data.semester_id).first()
    if not semester:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Semester not found"
        )

    schedule = ReviewSchedule(
        name=data.name,
        semester_id=data.semester_id,
        review_start=data.review_start,
        l1_deadline=data.l1_deadline,
        l2_deadline=data.l2_deadline,
        final_approval=data.final_approval,
        is_active=data.is_active,
        created_by=current_user.user_id
    )
    db.add(schedule)
    db.flush()

    # Create assignments if provided
    if data.assignments:
        for assign_data in data.assignments:
            assignment = ReviewerAssignment(
                schedule_id=schedule.schedule_id,
                reviewer_id=assign_data.reviewer_id,
                department_id=assign_data.department_id,
                review_level=assign_data.review_level,
                is_primary=assign_data.is_primary
            )
            db.add(assignment)

    db.commit()
    db.refresh(schedule)

    # Add computed fields
    academic_year = db.query(AcademicYear).filter(
        AcademicYear.academic_year_id == semester.academic_year_id
    ).first()
    schedule.semester_name = semester.name
    schedule.academic_year = academic_year.name if academic_year else None

    return schedule


@router.get("/current", response_model=ReviewScheduleResponse)
def get_current_review_schedule(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the current active review schedule"""
    today = date.today()
    schedule = db.query(ReviewSchedule).filter(
        ReviewSchedule.is_active == True,
        ReviewSchedule.review_start <= today,
        ReviewSchedule.final_approval >= today
    ).first()

    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active review schedule found"
        )

    # Add computed fields
    semester = db.query(Semester).filter(Semester.semester_id == schedule.semester_id).first()
    academic_year = db.query(AcademicYear).filter(
        AcademicYear.academic_year_id == semester.academic_year_id
    ).first()
    schedule.semester_name = semester.name
    schedule.academic_year = academic_year.name if academic_year else None

    return schedule


@router.get("/{schedule_id}", response_model=ReviewScheduleResponse)
def get_review_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get review schedule by ID with assignments"""
    schedule = db.query(ReviewSchedule).filter(
        ReviewSchedule.schedule_id == schedule_id
    ).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review schedule not found"
        )

    # Add computed fields
    semester = db.query(Semester).filter(Semester.semester_id == schedule.semester_id).first()
    academic_year = db.query(AcademicYear).filter(
        AcademicYear.academic_year_id == semester.academic_year_id
    ).first()
    schedule.semester_name = semester.name
    schedule.academic_year = academic_year.name if academic_year else None

    # Add reviewer names to assignments
    for assignment in schedule.assignments:
        reviewer = db.query(User).filter(User.user_id == assignment.reviewer_id).first()
        if reviewer:
            assignment.reviewer_name = reviewer.full_name
        if assignment.department_id:
            dept = db.query(Department).filter(Department.dept_id == assignment.department_id).first()
            if dept:
                assignment.department_name = dept.dept_name

    return schedule


@router.put("/{schedule_id}", response_model=ReviewScheduleResponse)
def update_review_schedule(
    schedule_id: int,
    data: ReviewScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Academic Affairs"]))
):
    """Update a review schedule"""
    schedule = db.query(ReviewSchedule).filter(
        ReviewSchedule.schedule_id == schedule_id
    ).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review schedule not found"
        )

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(schedule, field, value)

    db.commit()
    db.refresh(schedule)
    return schedule


@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin"]))
):
    """Delete a review schedule"""
    schedule = db.query(ReviewSchedule).filter(
        ReviewSchedule.schedule_id == schedule_id
    ).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review schedule not found"
        )

    db.delete(schedule)
    db.commit()


# ==================== Reviewer Assignments ====================

@router.post("/{schedule_id}/assignments", response_model=ReviewerAssignmentResponse, status_code=status.HTTP_201_CREATED)
def create_reviewer_assignment(
    schedule_id: int,
    data: ReviewerAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Academic Affairs"]))
):
    """Assign a reviewer to a schedule"""
    schedule = db.query(ReviewSchedule).filter(
        ReviewSchedule.schedule_id == schedule_id
    ).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review schedule not found"
        )

    # Validate reviewer exists and has appropriate role
    reviewer = db.query(User).filter(User.user_id == data.reviewer_id).first()
    if not reviewer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reviewer not found"
        )

    # Check for duplicate assignment
    existing = db.query(ReviewerAssignment).filter(
        ReviewerAssignment.schedule_id == schedule_id,
        ReviewerAssignment.reviewer_id == data.reviewer_id,
        ReviewerAssignment.department_id == data.department_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reviewer already assigned to this schedule for this department"
        )

    assignment = ReviewerAssignment(
        schedule_id=schedule_id,
        reviewer_id=data.reviewer_id,
        department_id=data.department_id,
        review_level=data.review_level,
        is_primary=data.is_primary
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    # Add computed fields
    assignment.reviewer_name = reviewer.full_name
    if data.department_id:
        dept = db.query(Department).filter(Department.dept_id == data.department_id).first()
        if dept:
            assignment.department_name = dept.dept_name

    return assignment


@router.get("/{schedule_id}/assignments", response_model=list[ReviewerAssignmentResponse])
def list_reviewer_assignments(
    schedule_id: int,
    review_level: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all reviewer assignments for a schedule"""
    query = db.query(ReviewerAssignment).filter(
        ReviewerAssignment.schedule_id == schedule_id
    )

    if review_level:
        query = query.filter(ReviewerAssignment.review_level == review_level)

    assignments = query.all()

    # Add computed fields
    for assignment in assignments:
        reviewer = db.query(User).filter(User.user_id == assignment.reviewer_id).first()
        if reviewer:
            assignment.reviewer_name = reviewer.full_name
        if assignment.department_id:
            dept = db.query(Department).filter(Department.dept_id == assignment.department_id).first()
            if dept:
                assignment.department_name = dept.dept_name

    return assignments


@router.delete("/assignments/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reviewer_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Academic Affairs"]))
):
    """Remove a reviewer assignment"""
    assignment = db.query(ReviewerAssignment).filter(
        ReviewerAssignment.assignment_id == assignment_id
    ).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    db.delete(assignment)
    db.commit()


# ==================== Progress Tracking ====================

@router.get("/{schedule_id}/progress", response_model=ReviewProgressResponse)
def get_review_progress(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get review progress for a schedule"""
    schedule = db.query(ReviewSchedule).filter(
        ReviewSchedule.schedule_id == schedule_id
    ).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review schedule not found"
        )

    # Get semester info for filtering
    semester = db.query(Semester).filter(Semester.semester_id == schedule.semester_id).first()

    # Count syllabi by status
    total = db.query(func.count(Syllabus.syllabus_id)).scalar() or 0

    # Count update requests by status
    pending_submission = db.query(func.count(UpdateRequest.request_id)).filter(
        UpdateRequest.status == "Pending"
    ).scalar() or 0

    pending_l1 = db.query(func.count(UpdateRequest.request_id)).filter(
        UpdateRequest.status == "Under Review",
        UpdateRequest.review_level == 1
    ).scalar() or 0

    pending_l2 = db.query(func.count(UpdateRequest.request_id)).filter(
        UpdateRequest.status == "Under Review",
        UpdateRequest.review_level == 2
    ).scalar() or 0

    approved = db.query(func.count(UpdateRequest.request_id)).filter(
        UpdateRequest.status == "Approved"
    ).scalar() or 0

    rejected = db.query(func.count(UpdateRequest.request_id)).filter(
        UpdateRequest.status == "Rejected"
    ).scalar() or 0

    completion = (approved / total * 100) if total > 0 else 0.0

    return ReviewProgressResponse(
        schedule_id=schedule_id,
        schedule_name=schedule.name,
        total_syllabi=total,
        pending_submission=pending_submission,
        pending_l1_review=pending_l1,
        pending_l2_review=pending_l2,
        approved=approved,
        rejected=rejected,
        completion_percentage=round(completion, 2)
    )


# ==================== Available Reviewers ====================

@router.get("/reviewers/available", response_model=list[AvailableReviewerResponse])
def list_available_reviewers(
    review_level: int = Query(..., ge=1, le=2, description="1=HoD, 2=AA"),
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Academic Affairs"]))
):
    """List users available as reviewers based on their role"""
    # Level 1 = HoD, Level 2 = Academic Affairs
    if review_level == 1:
        roles = [UserRole.HOD]
    else:
        roles = [UserRole.ACADEMIC_AFFAIRS, UserRole.ADMIN]

    query = db.query(User).filter(
        User.role.in_(roles),
        User.is_active == True
    )

    if department_id and review_level == 1:
        query = query.filter(User.department_id == department_id)

    users = query.all()

    result = []
    for user in users:
        dept_name = None
        if user.department_id:
            dept = db.query(Department).filter(Department.dept_id == user.department_id).first()
            if dept:
                dept_name = dept.dept_name

        result.append(AvailableReviewerResponse(
            user_id=user.user_id,
            username=user.username,
            full_name=user.full_name,
            role=user.role.value,
            department_id=user.department_id,
            department_name=dept_name
        ))

    return result
