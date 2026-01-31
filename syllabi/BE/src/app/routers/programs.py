"""Programs Router - Academic Program Management APIs"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, UserRole
from app.models.program import Program, DegreeType
from app.models.plo import ProgramLearningOutcome
from app.models.course import Course
from app.schemas.program import ProgramCreate, ProgramUpdate, ProgramResponse, ProgramList
from app.schemas.course import CourseList
from app.schemas.plo import PLOCreate, PLOUpdate, PLOResponse, PLOListResponse

router = APIRouter()


def require_admin_or_coordinator(current_user: User = Depends(get_current_user)):
    """Dependency to require admin or department head role"""
    if current_user.role not in [UserRole.ADMIN, UserRole.HOD, UserRole.ACADEMIC_AFFAIRS]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin, Head of Department, or Academic Affairs access required"
        )
    return current_user


@router.get(
    "",
    response_model=ProgramList,
    summary="List All Programs",
    description="""
Get a paginated list of all academic programs.

**Filters:**
- `department_id`: Filter by department ID
- `degree_type`: Filter by degree type (Bachelor, Master, Doctorate)
- `is_active`: Filter by active status (true/false)
- `search`: Search by program code or name

**Sorting:**
- `sortBy`: Field to sort by (program_id, program_code, program_name, degree_type)
- `sortOrder`: Sort order (asc, desc)
    """
)
async def list_programs(
    # Pagination
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    pageSize: int = Query(10, ge=1, le=100, description="Items per page"),
    # Search
    search: Optional[str] = Query(None, description="Search by code or name"),
    # Filters
    department_id: Optional[int] = Query(None, description="Filter by department"),
    degree_type: Optional[DegreeType] = Query(None, description="Filter by degree type"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    # Sorting
    sortBy: Optional[str] = Query("program_code", description="Field to sort by"),
    sortOrder: str = Query("asc", description="Sort order: asc or desc"),
    # Dependencies
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all programs with filters, search, sorting, and pagination."""
    query = db.query(Program)

    # Apply search
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Program.program_code.ilike(search_term)) |
            (Program.program_name.ilike(search_term))
        )

    # Apply filters
    if department_id:
        query = query.filter(Program.department_id == department_id)
    if degree_type:
        query = query.filter(Program.degree_type == degree_type)
    if is_active is not None:
        query = query.filter(Program.is_active == is_active)

    # Apply sorting
    sort_columns = {
        "program_id": Program.program_id,
        "program_code": Program.program_code,
        "program_name": Program.program_name,
        "degree_type": Program.degree_type,
    }
    sort_column = sort_columns.get(sortBy, Program.program_code)
    if sortOrder == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    # Get total and paginate
    total = query.count()
    skip = (page - 1) * pageSize
    total_pages = (total + pageSize - 1) // pageSize if pageSize > 0 else 1
    programs = query.offset(skip).limit(pageSize).all()

    return {
        "total": total,
        "page": page,
        "pageSize": pageSize,
        "totalPages": total_pages,
        "items": programs
    }


@router.get(
    "/{program_id}",
    response_model=ProgramResponse,
    summary="Get Program by ID",
    description="Get a specific program by its ID."
)
async def get_program(
    program_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a program by ID.
    """
    program = db.query(Program).filter(Program.program_id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    return program


@router.post(
    "",
    response_model=ProgramResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Program",
    description="Create a new academic program. **Admin or Coordinator only.**"
)
async def create_program(
    program_data: ProgramCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_coordinator)
):
    """
    Create a new program.
    """
    # Check if program_code exists
    if db.query(Program).filter(Program.program_code == program_data.program_code).first():
        raise HTTPException(status_code=400, detail="Program code already exists")

    program = Program(**program_data.model_dump())
    db.add(program)
    db.commit()
    db.refresh(program)

    return program


@router.put(
    "/{program_id}",
    response_model=ProgramResponse,
    summary="Update Program",
    description="Update an existing program. **Admin or Coordinator only.**"
)
async def update_program(
    program_id: int,
    program_data: ProgramUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_coordinator)
):
    """
    Update a program by ID.
    """
    program = db.query(Program).filter(Program.program_id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    update_data = program_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(program, field, value)

    db.commit()
    db.refresh(program)

    return program


@router.delete(
    "/{program_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Program",
    description="Delete a program. **Admin only.**"
)
async def delete_program(
    program_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_coordinator)
):
    """
    Delete a program by ID.
    """
    program = db.query(Program).filter(Program.program_id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    # Check if program has courses
    if program.courses:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete program with assigned courses"
        )

    db.delete(program)
    db.commit()

    return None


@router.get(
    "/{program_id}/courses",
    response_model=CourseList,
    summary="Get Courses in Program",
    description="Get all courses assigned to a specific program."
)
async def get_program_courses(
    program_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all courses in a program.
    """
    program = db.query(Program).filter(Program.program_id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    query = db.query(Course).filter(Course.program_id == program_id)
    total = query.count()
    courses = query.offset(skip).limit(limit).all()

    return {"total": total, "items": courses}


# ==================== PLO Management ====================

@router.get(
    "/{program_id}/plos",
    response_model=PLOListResponse,
    summary="Get Program Learning Outcomes",
    description="Get all PLOs for a specific program. Used for CLO-PLO mapping in syllabus creation."
)
async def get_program_plos(
    program_id: int,
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    category: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all Program Learning Outcomes (PLOs) for a program.

    This endpoint is used by lecturers when creating syllabi to map
    Course Learning Outcomes (CLOs) to Program Learning Outcomes (PLOs).
    """
    program = db.query(Program).filter(Program.program_id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    query = db.query(ProgramLearningOutcome).filter(
        ProgramLearningOutcome.program_id == program_id
    )

    if is_active is not None:
        query = query.filter(ProgramLearningOutcome.is_active == is_active)
    if category:
        query = query.filter(ProgramLearningOutcome.category == category)

    plos = query.order_by(ProgramLearningOutcome.display_order).all()

    return {"total": len(plos), "items": plos}


@router.post(
    "/{program_id}/plos",
    response_model=PLOResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create PLO",
    description="Create a new Program Learning Outcome. **Admin or Coordinator only.**"
)
async def create_plo(
    program_id: int,
    plo_data: PLOCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_coordinator)
):
    """
    Create a new PLO for a program.
    """
    program = db.query(Program).filter(Program.program_id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    # Check if PLO code already exists for this program
    existing = db.query(ProgramLearningOutcome).filter(
        ProgramLearningOutcome.program_id == program_id,
        ProgramLearningOutcome.code == plo_data.code
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="PLO code already exists for this program")

    plo = ProgramLearningOutcome(
        program_id=program_id,
        **plo_data.model_dump()
    )
    db.add(plo)
    db.commit()
    db.refresh(plo)

    return plo


@router.put(
    "/{program_id}/plos/{plo_id}",
    response_model=PLOResponse,
    summary="Update PLO",
    description="Update a Program Learning Outcome. **Admin or Coordinator only.**"
)
async def update_plo(
    program_id: int,
    plo_id: int,
    plo_data: PLOUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_coordinator)
):
    """
    Update a PLO.
    """
    plo = db.query(ProgramLearningOutcome).filter(
        ProgramLearningOutcome.plo_id == plo_id,
        ProgramLearningOutcome.program_id == program_id
    ).first()

    if not plo:
        raise HTTPException(status_code=404, detail="PLO not found")

    update_data = plo_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(plo, field, value)

    db.commit()
    db.refresh(plo)

    return plo


@router.delete(
    "/{program_id}/plos/{plo_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete PLO",
    description="Delete a Program Learning Outcome. **Admin or Coordinator only.**"
)
async def delete_plo(
    program_id: int,
    plo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_coordinator)
):
    """
    Delete a PLO.
    """
    plo = db.query(ProgramLearningOutcome).filter(
        ProgramLearningOutcome.plo_id == plo_id,
        ProgramLearningOutcome.program_id == program_id
    ).first()

    if not plo:
        raise HTTPException(status_code=404, detail="PLO not found")

    db.delete(plo)
    db.commit()

    return None
