"""Router for Academic Year and Semester Management (FE02)"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import date

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models import User, AcademicYear, Semester, SubmissionPeriod
from app.schemas.academic_year import (
    AcademicYearCreate, AcademicYearUpdate, AcademicYearResponse,
    AcademicYearListResponse, AcademicYearListPaginated,
    SemesterCreate, SemesterUpdate, SemesterResponse,
    SubmissionPeriodCreate, SubmissionPeriodUpdate, SubmissionPeriodResponse
)

router = APIRouter(prefix="/academic-years", tags=["Academic Years"])


# ==================== Academic Year ====================

@router.get("", response_model=AcademicYearListPaginated)
def list_academic_years(
    is_active: Optional[bool] = None,
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    pageSize: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all academic years with optional filtering and pagination"""
    # Count query
    count_query = db.query(AcademicYear)
    if is_active is not None:
        count_query = count_query.filter(AcademicYear.is_active == is_active)
    total = count_query.count()

    # Calculate offset from page
    skip = (page - 1) * pageSize
    total_pages = (total + pageSize - 1) // pageSize if pageSize > 0 else 1

    # Main query
    query = db.query(
        AcademicYear,
        func.count(Semester.semester_id).label("semester_count")
    ).outerjoin(Semester).group_by(AcademicYear.academic_year_id)

    if is_active is not None:
        query = query.filter(AcademicYear.is_active == is_active)

    results = query.order_by(AcademicYear.start_date.desc()).offset(skip).limit(pageSize).all()

    items = [
        AcademicYearListResponse(
            academic_year_id=ay.academic_year_id,
            name=ay.name,
            start_date=ay.start_date,
            end_date=ay.end_date,
            is_active=ay.is_active,
            semester_count=count
        )
        for ay, count in results
    ]

    return AcademicYearListPaginated(
        total=total,
        page=page,
        pageSize=pageSize,
        totalPages=total_pages,
        items=items
    )


@router.post("", response_model=AcademicYearResponse, status_code=status.HTTP_201_CREATED)
def create_academic_year(
    data: AcademicYearCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Academic Affairs"]))
):
    """Create a new academic year"""
    # Check for duplicate name
    existing = db.query(AcademicYear).filter(AcademicYear.name == data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Academic year '{data.name}' already exists"
        )

    # If setting as active, deactivate others
    if data.is_active:
        db.query(AcademicYear).filter(AcademicYear.is_active == True).update({"is_active": False})

    academic_year = AcademicYear(
        name=data.name,
        start_date=data.start_date,
        end_date=data.end_date,
        is_active=data.is_active
    )
    db.add(academic_year)
    db.flush()

    # Create semesters if provided
    if data.semesters:
        for sem_data in data.semesters:
            semester = Semester(
                academic_year_id=academic_year.academic_year_id,
                name=sem_data.name,
                start_date=sem_data.start_date,
                end_date=sem_data.end_date
            )
            db.add(semester)
            db.flush()

            # Create submission period if dates provided
            if sem_data.submission_start and sem_data.submission_end:
                period = SubmissionPeriod(
                    semester_id=semester.semester_id,
                    submission_start=sem_data.submission_start,
                    submission_end=sem_data.submission_end
                )
                db.add(period)

    db.commit()
    db.refresh(academic_year)
    return academic_year


@router.get("/current", response_model=AcademicYearResponse)
def get_current_academic_year(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the current active academic year"""
    academic_year = db.query(AcademicYear).filter(AcademicYear.is_active == True).first()
    if not academic_year:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active academic year found"
        )
    return academic_year


@router.get("/{academic_year_id}", response_model=AcademicYearResponse)
def get_academic_year(
    academic_year_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get academic year by ID with semesters"""
    academic_year = db.query(AcademicYear).filter(
        AcademicYear.academic_year_id == academic_year_id
    ).first()
    if not academic_year:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Academic year not found"
        )
    return academic_year


@router.put("/{academic_year_id}", response_model=AcademicYearResponse)
def update_academic_year(
    academic_year_id: int,
    data: AcademicYearUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Academic Affairs"]))
):
    """Update an academic year"""
    academic_year = db.query(AcademicYear).filter(
        AcademicYear.academic_year_id == academic_year_id
    ).first()
    if not academic_year:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Academic year not found"
        )

    # If setting as active, deactivate others
    if data.is_active:
        db.query(AcademicYear).filter(
            AcademicYear.academic_year_id != academic_year_id,
            AcademicYear.is_active == True
        ).update({"is_active": False})

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(academic_year, field, value)

    db.commit()
    db.refresh(academic_year)
    return academic_year


@router.delete("/{academic_year_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_academic_year(
    academic_year_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin"]))
):
    """Delete an academic year"""
    academic_year = db.query(AcademicYear).filter(
        AcademicYear.academic_year_id == academic_year_id
    ).first()
    if not academic_year:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Academic year not found"
        )

    # Check if has semesters
    if academic_year.semesters:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete academic year with semesters. Delete semesters first."
        )

    db.delete(academic_year)
    db.commit()


# ==================== Semester ====================

@router.post("/{academic_year_id}/semesters", response_model=SemesterResponse, status_code=status.HTTP_201_CREATED)
def create_semester(
    academic_year_id: int,
    data: SemesterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Academic Affairs"]))
):
    """Create a semester in an academic year"""
    academic_year = db.query(AcademicYear).filter(
        AcademicYear.academic_year_id == academic_year_id
    ).first()
    if not academic_year:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Academic year not found"
        )

    semester = Semester(
        academic_year_id=academic_year_id,
        name=data.name,
        start_date=data.start_date,
        end_date=data.end_date
    )
    db.add(semester)
    db.flush()

    # Create submission period if dates provided
    if data.submission_start and data.submission_end:
        period = SubmissionPeriod(
            semester_id=semester.semester_id,
            submission_start=data.submission_start,
            submission_end=data.submission_end
        )
        db.add(period)

    db.commit()
    db.refresh(semester)
    return semester


@router.get("/{academic_year_id}/semesters", response_model=list[SemesterResponse])
def list_semesters(
    academic_year_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List semesters for an academic year"""
    semesters = db.query(Semester).filter(
        Semester.academic_year_id == academic_year_id
    ).order_by(Semester.start_date).all()
    return semesters


@router.get("/semesters/{semester_id}", response_model=SemesterResponse)
def get_semester(
    semester_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get semester by ID"""
    semester = db.query(Semester).filter(Semester.semester_id == semester_id).first()
    if not semester:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Semester not found"
        )
    return semester


@router.put("/semesters/{semester_id}", response_model=SemesterResponse)
def update_semester(
    semester_id: int,
    data: SemesterUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Academic Affairs"]))
):
    """Update a semester"""
    semester = db.query(Semester).filter(Semester.semester_id == semester_id).first()
    if not semester:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Semester not found"
        )

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(semester, field, value)

    db.commit()
    db.refresh(semester)
    return semester


@router.delete("/semesters/{semester_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_semester(
    semester_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin"]))
):
    """Delete a semester"""
    semester = db.query(Semester).filter(Semester.semester_id == semester_id).first()
    if not semester:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Semester not found"
        )

    db.delete(semester)
    db.commit()


# ==================== Submission Period ====================

@router.post("/semesters/{semester_id}/submission-periods", response_model=SubmissionPeriodResponse, status_code=status.HTTP_201_CREATED)
def create_submission_period(
    semester_id: int,
    data: SubmissionPeriodCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Academic Affairs"]))
):
    """Create a submission period for a semester"""
    semester = db.query(Semester).filter(Semester.semester_id == semester_id).first()
    if not semester:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Semester not found"
        )

    period = SubmissionPeriod(
        semester_id=semester_id,
        submission_start=data.submission_start,
        submission_end=data.submission_end,
        description=data.description
    )
    db.add(period)
    db.commit()
    db.refresh(period)
    return period


@router.get("/submission-periods/current", response_model=SubmissionPeriodResponse)
def get_current_submission_period(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get currently open submission period"""
    today = date.today()
    period = db.query(SubmissionPeriod).filter(
        SubmissionPeriod.is_open == True,
        SubmissionPeriod.submission_start <= today,
        SubmissionPeriod.submission_end >= today
    ).first()

    if not period:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No open submission period found"
        )
    return period


@router.put("/submission-periods/{period_id}", response_model=SubmissionPeriodResponse)
def update_submission_period(
    period_id: int,
    data: SubmissionPeriodUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Academic Affairs"]))
):
    """Update a submission period"""
    period = db.query(SubmissionPeriod).filter(SubmissionPeriod.period_id == period_id).first()
    if not period:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission period not found"
        )

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(period, field, value)

    db.commit()
    db.refresh(period)
    return period


@router.delete("/submission-periods/{period_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_submission_period(
    period_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin"]))
):
    """Delete a submission period"""
    period = db.query(SubmissionPeriod).filter(SubmissionPeriod.period_id == period_id).first()
    if not period:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission period not found"
        )

    db.delete(period)
    db.commit()
