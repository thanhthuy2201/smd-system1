"""Departments Router - Department Management APIs"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, UserRole
from app.models.department import Department
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentResponse, DepartmentList

router = APIRouter()


def require_admin_or_hod(current_user: User = Depends(get_current_user)):
    """Dependency to require admin or department head role"""
    if current_user.role not in [UserRole.ADMIN, UserRole.DEPARTMENT_HEAD]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or Department Head access required"
        )
    return current_user


@router.get(
    "",
    response_model=DepartmentList,
    summary="List All Departments",
    description="""
Get a paginated list of all departments.

**Search:**
- `search`: Search by department code or name

**Sorting:**
- `sortBy`: Field to sort by (dept_id, dept_code, dept_name)
- `sortOrder`: Sort order (asc, desc)
    """
)
async def list_departments(
    # Pagination
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    pageSize: int = Query(10, ge=1, le=100, description="Items per page"),
    # Search
    search: Optional[str] = Query(None, description="Search by name or code"),
    # Sorting
    sortBy: Optional[str] = Query("dept_code", description="Field to sort by"),
    sortOrder: str = Query("asc", description="Sort order: asc or desc"),
    # Dependencies
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all departments with search, sorting, and pagination."""
    query = db.query(Department)

    # Apply search
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Department.dept_code.ilike(search_term)) |
            (Department.dept_name.ilike(search_term)) |
            (Department.dept_name_vn.ilike(search_term))
        )

    # Apply sorting
    sort_columns = {
        "dept_id": Department.dept_id,
        "dept_code": Department.dept_code,
        "dept_name": Department.dept_name,
    }
    sort_column = sort_columns.get(sortBy, Department.dept_code)
    if sortOrder == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    # Get total and paginate
    total = query.count()
    skip = (page - 1) * pageSize
    total_pages = (total + pageSize - 1) // pageSize if pageSize > 0 else 1
    departments = query.offset(skip).limit(pageSize).all()

    return {
        "total": total,
        "page": page,
        "pageSize": pageSize,
        "totalPages": total_pages,
        "items": departments
    }


@router.get(
    "/{dept_id}",
    response_model=DepartmentResponse,
    summary="Get Department by ID",
    description="Get a specific department by its ID."
)
async def get_department(
    dept_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a department by ID.
    """
    department = db.query(Department).filter(Department.dept_id == dept_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    return department


@router.post(
    "",
    response_model=DepartmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Department",
    description="Create a new department. **Admin only.**"
)
async def create_department(
    dept_data: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_hod)
):
    """
    Create a new department.
    """
    # Check if dept_code exists
    if db.query(Department).filter(Department.dept_code == dept_data.dept_code).first():
        raise HTTPException(status_code=400, detail="Department code already exists")

    department = Department(**dept_data.model_dump())
    db.add(department)
    db.commit()
    db.refresh(department)

    return department


@router.put(
    "/{dept_id}",
    response_model=DepartmentResponse,
    summary="Update Department",
    description="Update an existing department. **Admin or HoD only.**"
)
async def update_department(
    dept_id: int,
    dept_data: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_hod)
):
    """
    Update a department by ID.
    """
    department = db.query(Department).filter(Department.dept_id == dept_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    update_data = dept_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(department, field, value)

    db.commit()
    db.refresh(department)

    return department


@router.delete(
    "/{dept_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Department",
    description="Delete a department. **Admin only.**"
)
async def delete_department(
    dept_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_hod)
):
    """
    Delete a department by ID.
    """
    department = db.query(Department).filter(Department.dept_id == dept_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    # Check if department has users
    if department.users:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete department with assigned users"
        )

    db.delete(department)
    db.commit()

    return None
