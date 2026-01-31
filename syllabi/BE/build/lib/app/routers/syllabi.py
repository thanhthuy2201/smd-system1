"""Syllabi Router - Syllabus Management APIs"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, UserRole
from app.models.syllabus import Syllabus, SyllabusStatus
from app.models.course import Course
from app.schemas.syllabus import SyllabusCreate, SyllabusUpdate, SyllabusResponse, SyllabusList, SyllabusSearch
from app.services.file_parser import (
    process_syllabus_file,
    validate_file_extension,
    get_supported_extensions,
    ParsedSyllabus
)
from app.services.file_storage import file_storage, get_content_type

router = APIRouter()


# ==================== File Upload Schemas ====================

class FileUploadResponse(BaseModel):
    """Response for file upload/parse"""
    success: bool
    message: str
    parsed_content: Optional[dict] = None
    syllabus_id: Optional[int] = None


class ParsedContentResponse(BaseModel):
    """Response for parsed content preview"""
    course_code: Optional[str] = None
    course_name: Optional[str] = None
    credits: Optional[int] = None
    total_hours: Optional[int] = None
    academic_year: Optional[str] = None
    semester: Optional[str] = None
    prerequisites: Optional[str] = None
    learning_outcomes: Optional[str] = None
    assessment_methods: Optional[str] = None
    textbooks: Optional[str] = None
    teaching_methods: Optional[str] = None
    materials: Optional[str] = None
    raw_text_preview: Optional[str] = None


def require_instructor(current_user: User = Depends(get_current_user)):
    """Dependency to require instructor or higher role (not student)"""
    if current_user.role == UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor access required"
        )
    return current_user


@router.get(
    "",
    response_model=SyllabusList,
    summary="List All Syllabi",
    description="""
Get a paginated list of all syllabi with optional filters.

**Filters:**
- `course_id`: Filter by course ID
- `academic_year`: Filter by academic year (e.g., "2024-2025")
- `semester`: Filter by semester
- `status`: Filter by status (Draft, Submitted, Under Review, Approved, Rejected)
- `created_by`: Filter by creator user ID
- `search`: Search by syllabus title

**Sorting:**
- `sortBy`: Field to sort by (syllabus_id, academic_year, status, created_date, updated_date)
- `sortOrder`: Sort order (asc, desc)
    """
)
async def list_syllabi(
    # Pagination
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    pageSize: int = Query(10, ge=1, le=100, description="Items per page"),
    # Search
    search: Optional[str] = Query(None, description="Search by title"),
    # Filters
    course_id: Optional[int] = Query(None, description="Filter by course"),
    academic_year: Optional[str] = Query(None, description="Filter by academic year"),
    semester: Optional[str] = Query(None, description="Filter by semester"),
    status: Optional[SyllabusStatus] = Query(None, description="Filter by status"),
    created_by: Optional[int] = Query(None, description="Filter by creator"),
    # Sorting
    sortBy: Optional[str] = Query("created_date", description="Field to sort by"),
    sortOrder: str = Query("desc", description="Sort order: asc or desc"),
    # Dependencies
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all syllabi with filters, search, sorting, and pagination."""
    query = db.query(Syllabus)

    # Apply search
    if search:
        query = query.filter(Syllabus.title.ilike(f"%{search}%"))

    # Apply filters
    if course_id:
        query = query.filter(Syllabus.course_id == course_id)
    if academic_year:
        query = query.filter(Syllabus.academic_year == academic_year)
    if semester:
        query = query.filter(Syllabus.semester == semester)
    if status:
        query = query.filter(Syllabus.status == status)
    if created_by:
        query = query.filter(Syllabus.created_by == created_by)

    # Non-admin users can only see their own drafts or approved syllabi
    if current_user.role == UserRole.STUDENT:
        query = query.filter(Syllabus.status == SyllabusStatus.APPROVED)
    elif current_user.role == UserRole.LECTURER:
        query = query.filter(
            (Syllabus.created_by == current_user.user_id) |
            (Syllabus.status == SyllabusStatus.APPROVED)
        )

    # Apply sorting
    sort_columns = {
        "syllabus_id": Syllabus.syllabus_id,
        "academic_year": Syllabus.academic_year,
        "status": Syllabus.status,
        "created_date": Syllabus.created_date,
        "updated_date": Syllabus.updated_date,
    }
    sort_column = sort_columns.get(sortBy, Syllabus.created_date)
    if sortOrder == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    # Get total and paginate
    total = query.count()
    skip = (page - 1) * pageSize
    total_pages = (total + pageSize - 1) // pageSize if pageSize > 0 else 1
    syllabi = query.offset(skip).limit(pageSize).all()

    return {
        "total": total,
        "page": page,
        "pageSize": pageSize,
        "totalPages": total_pages,
        "items": syllabi
    }


@router.get(
    "/search",
    response_model=SyllabusList,
    summary="Search Syllabi",
    description="Search syllabi by multiple criteria."
)
async def search_syllabi(
    search_params: SyllabusSearch = Depends(),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    pageSize: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Advanced search for syllabi.
    """
    query = db.query(Syllabus).join(Course)

    if search_params.course_code:
        query = query.filter(Course.course_code.ilike(f"%{search_params.course_code}%"))
    if search_params.course_name:
        query = query.filter(Course.course_name.ilike(f"%{search_params.course_name}%"))
    if search_params.academic_year:
        query = query.filter(Syllabus.academic_year == search_params.academic_year)
    if search_params.semester:
        query = query.filter(Syllabus.semester == search_params.semester)
    if search_params.department_id:
        query = query.filter(Course.department_id == search_params.department_id)
    if search_params.status:
        query = query.filter(Syllabus.status == search_params.status)
    if search_params.created_by:
        query = query.filter(Syllabus.created_by == search_params.created_by)

    total = query.count()
    skip = (page - 1) * pageSize
    total_pages = (total + pageSize - 1) // pageSize if pageSize > 0 else 1
    syllabi = query.offset(skip).limit(pageSize).all()

    return {
        "total": total,
        "page": page,
        "pageSize": pageSize,
        "totalPages": total_pages,
        "items": syllabi
    }


@router.get(
    "/{syllabus_id}",
    response_model=SyllabusResponse,
    summary="Get Syllabus by ID",
    description="Get a specific syllabus by its ID."
)
async def get_syllabus(
    syllabus_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a syllabus by ID.
    """
    syllabus = db.query(Syllabus).filter(Syllabus.syllabus_id == syllabus_id).first()
    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    # Check access - students can only view approved syllabi
    if current_user.role == UserRole.STUDENT and syllabus.status != SyllabusStatus.APPROVED:
        raise HTTPException(status_code=403, detail="Access denied")

    return syllabus


@router.post(
    "",
    response_model=SyllabusResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Syllabus",
    description="Create a new syllabus. **Instructor only.**"
)
async def create_syllabus(
    syllabus_data: SyllabusCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor)
):
    """
    Create a new syllabus.

    The syllabus will be created with 'Draft' status.
    """
    # Verify course exists
    course = db.query(Course).filter(Course.course_id == syllabus_data.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    syllabus = Syllabus(
        **syllabus_data.model_dump(),
        created_by=current_user.user_id,
        status=SyllabusStatus.DRAFT
    )

    db.add(syllabus)
    db.commit()
    db.refresh(syllabus)

    return syllabus


@router.put(
    "/{syllabus_id}",
    response_model=SyllabusResponse,
    summary="Update Syllabus",
    description="Update an existing syllabus. **Owner or Admin only.**"
)
async def update_syllabus(
    syllabus_id: int,
    syllabus_data: SyllabusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor)
):
    """
    Update a syllabus by ID.

    Only the creator or admin can update a syllabus.
    Cannot update an approved syllabus (create a new version instead).
    """
    syllabus = db.query(Syllabus).filter(Syllabus.syllabus_id == syllabus_id).first()
    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    # Check ownership
    if syllabus.created_by != current_user.user_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to update this syllabus")

    # Cannot update approved syllabus
    if syllabus.status == SyllabusStatus.APPROVED:
        raise HTTPException(
            status_code=400,
            detail="Cannot update approved syllabus. Create a new version instead."
        )

    update_data = syllabus_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(syllabus, field, value)

    db.commit()
    db.refresh(syllabus)

    return syllabus


@router.delete(
    "/{syllabus_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Syllabus",
    description="Delete a syllabus. **Owner or Admin only.**"
)
async def delete_syllabus(
    syllabus_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor)
):
    """
    Delete a syllabus by ID.

    Only draft syllabi can be deleted.
    """
    syllabus = db.query(Syllabus).filter(Syllabus.syllabus_id == syllabus_id).first()
    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    # Check ownership
    if syllabus.created_by != current_user.user_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to delete this syllabus")

    # Cannot delete non-draft syllabus
    if syllabus.status != SyllabusStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Can only delete draft syllabi")

    db.delete(syllabus)
    db.commit()

    return None


@router.post(
    "/{syllabus_id}/submit",
    response_model=SyllabusResponse,
    summary="Submit Syllabus for Review",
    description="Submit a syllabus for approval review. **Owner only.**"
)
async def submit_syllabus(
    syllabus_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor)
):
    """
    Submit a syllabus for review.

    Changes status from 'Draft' to 'Pending Review'.
    """
    syllabus = db.query(Syllabus).filter(Syllabus.syllabus_id == syllabus_id).first()
    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    # Check ownership
    if syllabus.created_by != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to submit this syllabus")

    # Check status
    if syllabus.status != SyllabusStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Can only submit draft syllabi")

    syllabus.status = SyllabusStatus.PENDING_REVIEW
    db.commit()
    db.refresh(syllabus)

    return syllabus


# ==================== File Upload Endpoints ====================

@router.post(
    "/upload/parse",
    response_model=ParsedContentResponse,
    summary="Parse Syllabus File",
    description=f"""
Upload and parse a syllabus document to extract structured content.

**Supported file types:** {', '.join(get_supported_extensions())}

**Max file size:** 10MB

This endpoint extracts:
- Course code and name
- Credits and total hours
- Academic year and semester
- Prerequisites
- Learning outcomes (CLO)
- Assessment methods
- Textbooks and references
- Teaching methods

**Use this to preview** what will be extracted before creating a syllabus.
    """
)
async def parse_syllabus_file(
    file: UploadFile = File(..., description="Syllabus document (PDF, DOCX, or TXT)"),
    current_user: User = Depends(get_current_user)
):
    """
    Parse syllabus file and return extracted content without saving.
    Use this to preview before creating a syllabus.
    """
    # Validate file extension
    if not validate_file_extension(file.filename):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Supported: {', '.join(get_supported_extensions())}"
        )

    # Check file size (10MB max)
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max size: 10MB")

    try:
        parsed = await process_syllabus_file(content, file.filename)

        return ParsedContentResponse(
            course_code=parsed.course_code,
            course_name=parsed.course_name,
            credits=parsed.credits,
            total_hours=parsed.total_hours,
            academic_year=parsed.academic_year,
            semester=parsed.semester,
            prerequisites=parsed.prerequisites,
            learning_outcomes=parsed.learning_outcomes,
            assessment_methods=parsed.assessment_methods,
            textbooks=parsed.textbooks,
            teaching_methods=parsed.teaching_methods,
            materials=parsed.materials,
            raw_text_preview=parsed.raw_text[:1000] if parsed.raw_text else None
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")


@router.post(
    "/upload/create",
    response_model=FileUploadResponse,
    summary="Upload and Create Syllabus",
    description=f"""
Upload a syllabus document, parse it, and create a new syllabus.

**Supported file types:** {', '.join(get_supported_extensions())}

**Required parameters:**
- `file`: The syllabus document
- `course_id`: The course ID to associate with

**Optional parameters (override parsed values):**
- `academic_year`: Academic year (e.g., "2024-2025")
- `semester`: Semester (Fall, Spring, Summer)
- `credits`: Number of credits
- `total_hours`: Total contact hours

The syllabus will be created with 'Draft' status.
    """
)
async def upload_and_create_syllabus(
    file: UploadFile = File(..., description="Syllabus document (PDF, DOCX, or TXT)"),
    course_id: int = Form(..., description="Course ID to associate with"),
    academic_year: Optional[str] = Form(None, description="Academic year (e.g., 2024-2025)"),
    semester: Optional[str] = Form(None, description="Semester (Fall, Spring, Summer)"),
    credits: Optional[int] = Form(None, description="Number of credits"),
    total_hours: Optional[int] = Form(None, description="Total contact hours"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor)
):
    """
    Upload syllabus file, parse content, and create a new syllabus.
    """
    # Validate file extension
    if not validate_file_extension(file.filename):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Supported: {', '.join(get_supported_extensions())}"
        )

    # Check file size (10MB max)
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max size: 10MB")

    # Verify course exists
    course = db.query(Course).filter(Course.course_id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    try:
        # Parse file content
        parsed = await process_syllabus_file(content, file.filename)

        # Use provided values or fall back to parsed values
        final_academic_year = academic_year or parsed.academic_year
        final_semester = semester or parsed.semester
        final_credits = credits or parsed.credits or course.credits
        final_total_hours = total_hours or parsed.total_hours or (final_credits * 15 if final_credits else 45)

        # Validate required fields
        if not final_academic_year:
            raise HTTPException(
                status_code=400,
                detail="Academic year is required. Provide it or ensure it's in the document."
            )
        if not final_semester:
            raise HTTPException(
                status_code=400,
                detail="Semester is required. Provide it or ensure it's in the document."
            )

        # Upload file to storage
        content_type = get_content_type(file.filename)
        storage_path, public_url = await file_storage.upload_file(
            file_content=content,
            original_filename=file.filename,
            user_id=current_user.user_id,
            content_type=content_type
        )

        # Create syllabus with file info
        syllabus = Syllabus(
            course_id=course_id,
            academic_year=final_academic_year,
            semester=final_semester,
            credits=final_credits,
            total_hours=final_total_hours,
            learning_outcomes=parsed.learning_outcomes or "To be updated",
            assessment_methods=parsed.assessment_methods or "To be updated",
            textbooks=parsed.textbooks,
            teaching_methods=parsed.teaching_methods,
            prerequisites=parsed.prerequisites,
            materials=parsed.materials,
            created_by=current_user.user_id,
            status=SyllabusStatus.DRAFT,
            # File info
            original_file_name=file.filename,
            file_path=storage_path,
            file_size=len(content),
            file_type=content_type
        )

        db.add(syllabus)
        db.commit()
        db.refresh(syllabus)

        return FileUploadResponse(
            success=True,
            message=f"Syllabus created successfully from {file.filename}",
            parsed_content={
                "course_code": parsed.course_code,
                "credits": final_credits,
                "total_hours": final_total_hours,
                "academic_year": final_academic_year,
                "semester": final_semester,
                "has_learning_outcomes": bool(parsed.learning_outcomes),
                "has_assessment_methods": bool(parsed.assessment_methods),
                "has_textbooks": bool(parsed.textbooks),
                "file_stored": True,
                "file_path": storage_path,
            },
            syllabus_id=syllabus.syllabus_id
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create syllabus: {str(e)}")


@router.get(
    "/upload/supported-formats",
    summary="Get Supported File Formats",
    description="Get list of supported file formats for syllabus upload."
)
async def get_supported_formats():
    """Get supported file formats for upload."""
    return {
        "supported_formats": get_supported_extensions(),
        "max_file_size_mb": 10,
        "description": "Upload PDF, DOCX, or TXT files containing syllabus content"
    }


@router.get(
    "/{syllabus_id}/download",
    summary="Download Original Syllabus File",
    description="Download the original uploaded file for a syllabus."
)
async def download_syllabus_file(
    syllabus_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Download the original uploaded file."""
    from fastapi.responses import StreamingResponse
    from io import BytesIO

    syllabus = db.query(Syllabus).filter(Syllabus.syllabus_id == syllabus_id).first()
    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    if not syllabus.file_path:
        raise HTTPException(status_code=404, detail="No file attached to this syllabus")

    # Check access
    if current_user.role == UserRole.STUDENT and syllabus.status != SyllabusStatus.APPROVED:
        raise HTTPException(status_code=403, detail="Access denied")

    # Download file from storage
    file_content = await file_storage.download_file(syllabus.file_path)
    if not file_content:
        raise HTTPException(status_code=404, detail="File not found in storage")

    return StreamingResponse(
        BytesIO(file_content),
        media_type=syllabus.file_type or "application/octet-stream",
        headers={
            "Content-Disposition": f'attachment; filename="{syllabus.original_file_name}"'
        }
    )
