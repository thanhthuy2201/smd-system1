"""Courses Router - Course Management APIs"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, UserRole
from app.models.course import Course
from app.schemas.course import CourseCreate, CourseUpdate, CourseResponse, CourseList

router = APIRouter()


def require_staff(current_user: User = Depends(get_current_user)):
    """Dependency to require staff role (not student)"""
    if current_user.role == UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff access required"
        )
    return current_user


@router.get(
    "",
    response_model=CourseList,
    summary="List All Courses",
    description="""
Get a paginated list of all courses.

**Filters:**
- `department_id`: Filter by department ID
- `program_id`: Filter by program ID
- `is_elective`: Filter by elective status (true/false)
- `is_active`: Filter by active status (true/false)
- `search`: Search by course code or name

**Sorting:**
- `sortBy`: Field to sort by (course_id, course_code, course_name, credits, created_at)
- `sortOrder`: Sort order (asc, desc)
    """
)
async def list_courses(
    # Pagination
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    pageSize: int = Query(10, ge=1, le=100, description="Items per page"),
    # Search
    search: Optional[str] = Query(None, description="Search by code or name"),
    # Filters
    department_id: Optional[int] = Query(None, description="Filter by department"),
    program_id: Optional[int] = Query(None, description="Filter by program"),
    is_elective: Optional[bool] = Query(None, description="Filter by elective status"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    # Sorting
    sortBy: Optional[str] = Query("course_code", description="Field to sort by"),
    sortOrder: str = Query("asc", description="Sort order: asc or desc"),
    # Dependencies
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all courses with filters, search, sorting, and pagination."""
    query = db.query(Course)

    # Apply search
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Course.course_code.ilike(search_term)) |
            (Course.course_name.ilike(search_term))
        )

    # Apply filters
    if department_id:
        query = query.filter(Course.department_id == department_id)
    if program_id:
        query = query.filter(Course.program_id == program_id)
    if is_elective is not None:
        query = query.filter(Course.is_elective == is_elective)
    if is_active is not None:
        query = query.filter(Course.is_active == is_active)

    # Apply sorting
    sort_columns = {
        "course_id": Course.course_id,
        "course_code": Course.course_code,
        "course_name": Course.course_name,
    }
    sort_column = sort_columns.get(sortBy, Course.course_code)
    if sortOrder == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    # Get total and paginate
    total = query.count()
    skip = (page - 1) * pageSize
    total_pages = (total + pageSize - 1) // pageSize if pageSize > 0 else 1
    courses = query.offset(skip).limit(pageSize).all()

    return {
        "total": total,
        "page": page,
        "pageSize": pageSize,
        "totalPages": total_pages,
        "items": courses
    }


@router.get(
    "/{course_id}",
    response_model=CourseResponse,
    summary="Get Course by ID",
    description="Get a specific course by its ID."
)
async def get_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a course by ID.
    """
    course = db.query(Course).filter(Course.course_id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.post(
    "",
    response_model=CourseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Course",
    description="Create a new course. **Staff only.**"
)
async def create_course(
    course_data: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Create a new course.
    """
    # Check if course_code exists
    if db.query(Course).filter(Course.course_code == course_data.course_code).first():
        raise HTTPException(status_code=400, detail="Course code already exists")

    course = Course(**course_data.model_dump())
    db.add(course)
    db.commit()
    db.refresh(course)

    return course


@router.put(
    "/{course_id}",
    response_model=CourseResponse,
    summary="Update Course",
    description="Update an existing course. **Staff only.**"
)
async def update_course(
    course_id: int,
    course_data: CourseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Update a course by ID.
    """
    course = db.query(Course).filter(Course.course_id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    update_data = course_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(course, field, value)

    db.commit()
    db.refresh(course)

    return course


@router.delete(
    "/{course_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Course",
    description="Delete a course. **Staff only.**"
)
async def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Delete a course by ID.
    """
    course = db.query(Course).filter(Course.course_id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Check if course has syllabi
    if course.syllabi:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete course with existing syllabi"
        )

    db.delete(course)
    db.commit()

    return None
