"""Router for Data Import (FE07)"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, Any
from datetime import datetime
import json
import csv
import io

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models import (
    User, ImportLog, ImportError as ImportErrorModel,
    ImportStatus, ImportType,
    Course, Program, Syllabus, Department
)
from app.schemas.import_data import (
    ImportRequest, ImportLogResponse, ImportLogListResponse,
    ImportValidationResult, ImportProgressResponse, ImportSummaryResponse,
    ImportTemplateResponse, ImportErrorBase, ImportErrorResponse,
    BulkDeleteRequest, BulkDeleteResponse
)

router = APIRouter(prefix="/import", tags=["Data Import"])


# ==================== Import Templates ====================

@router.get("/templates/{import_type}", response_model=ImportTemplateResponse)
def get_import_template(
    import_type: ImportType,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Academic Affairs"]))
):
    """Get import template information and sample data"""
    templates = {
        ImportType.SYLLABUS: {
            "required_columns": ["course_code", "title", "description", "credits", "objectives"],
            "optional_columns": ["prerequisites", "clo_mappings", "assessment_methods", "references"],
            "column_descriptions": {
                "course_code": "Course code (must exist in system)",
                "title": "Syllabus title",
                "description": "Course description",
                "credits": "Number of credits (integer)",
                "objectives": "Learning objectives (JSON array or semicolon-separated)",
                "prerequisites": "Prerequisites (optional)",
                "clo_mappings": "CLO to PLO mappings (JSON format)",
                "assessment_methods": "Assessment methods (JSON array)",
                "references": "Reference materials (semicolon-separated)"
            },
            "sample_data": [
                {
                    "course_code": "CS101",
                    "title": "Introduction to Programming",
                    "description": "Basic programming concepts",
                    "credits": 3,
                    "objectives": "Understand variables;Write simple programs;Debug code"
                }
            ]
        },
        ImportType.COURSE: {
            "required_columns": ["code", "name", "department_code", "credits"],
            "optional_columns": ["description", "is_elective", "semester"],
            "column_descriptions": {
                "code": "Unique course code",
                "name": "Course name",
                "department_code": "Department code (must exist)",
                "credits": "Number of credits",
                "description": "Course description",
                "is_elective": "Whether course is elective (true/false)",
                "semester": "Recommended semester (1-8)"
            },
            "sample_data": [
                {
                    "code": "CS102",
                    "name": "Data Structures",
                    "department_code": "CS",
                    "credits": 3,
                    "description": "Introduction to data structures",
                    "is_elective": False
                }
            ]
        },
        ImportType.PROGRAM: {
            "required_columns": ["code", "name", "department_code", "degree_level"],
            "optional_columns": ["description", "total_credits", "duration_years"],
            "column_descriptions": {
                "code": "Unique program code",
                "name": "Program name",
                "department_code": "Department code (must exist)",
                "degree_level": "Degree level (Bachelor/Master/PhD)",
                "description": "Program description",
                "total_credits": "Total required credits",
                "duration_years": "Program duration in years"
            },
            "sample_data": [
                {
                    "code": "BSCS",
                    "name": "Bachelor of Science in Computer Science",
                    "department_code": "CS",
                    "degree_level": "Bachelor",
                    "total_credits": 120,
                    "duration_years": 4
                }
            ]
        },
        ImportType.USER: {
            "required_columns": ["username", "email", "full_name", "role"],
            "optional_columns": ["department_code", "phone"],
            "column_descriptions": {
                "username": "Unique username",
                "email": "Email address",
                "full_name": "Full name",
                "role": "User role (Lecturer/HoD/Academic Affairs/Admin)",
                "department_code": "Department code (required for Lecturer/HoD)",
                "phone": "Phone number"
            },
            "sample_data": [
                {
                    "username": "jdoe",
                    "email": "jdoe@university.edu",
                    "full_name": "John Doe",
                    "role": "Lecturer",
                    "department_code": "CS"
                }
            ]
        }
    }

    template_info = templates.get(import_type)
    if not template_info:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown import type: {import_type}"
        )

    return ImportTemplateResponse(
        import_type=import_type,
        **template_info
    )


@router.get("/templates/{import_type}/download")
def download_template(
    import_type: ImportType,
    format: str = Query("csv", regex="^(csv|xlsx)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Academic Affairs"]))
):
    """Download import template file"""
    template = get_import_template(import_type, db, current_user)

    # Generate CSV content
    output = io.StringIO()
    all_columns = template.required_columns + template.optional_columns
    writer = csv.DictWriter(output, fieldnames=all_columns)
    writer.writeheader()

    for row in template.sample_data:
        writer.writerow({k: row.get(k, "") for k in all_columns})

    content = output.getvalue()

    from fastapi.responses import StreamingResponse
    return StreamingResponse(
        io.BytesIO(content.encode()),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={import_type.value.lower()}_template.csv"
        }
    )


# ==================== Import Operations ====================

@router.post("/validate", response_model=ImportValidationResult)
async def validate_import(
    import_type: ImportType,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Academic Affairs"]))
):
    """Validate import file without importing"""
    # Read file content
    content = await file.read()

    try:
        if file.filename.endswith('.csv'):
            data = list(csv.DictReader(io.StringIO(content.decode('utf-8'))))
        elif file.filename.endswith('.json'):
            data = json.loads(content.decode('utf-8'))
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported file format. Use CSV or JSON."
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse file: {str(e)}"
        )

    errors = []
    warnings = []
    valid_rows = 0

    # Get template for validation
    template = get_import_template(import_type, db, current_user)
    required_columns = set(template.required_columns)

    for row_num, row in enumerate(data, start=1):
        row_errors = []
        row_keys = set(row.keys())

        # Check required columns
        missing = required_columns - row_keys
        if missing:
            row_errors.append(ImportErrorBase(
                row_number=row_num,
                error_type="missing_required",
                error_message=f"Missing required columns: {', '.join(missing)}",
                severity="Error"
            ))

        # Type-specific validation
        if import_type == ImportType.COURSE:
            if row.get('department_code'):
                dept = db.query(Department).filter(
                    Department.code == row['department_code']
                ).first()
                if not dept:
                    row_errors.append(ImportErrorBase(
                        row_number=row_num,
                        column_name="department_code",
                        error_type="invalid_reference",
                        error_message=f"Department '{row['department_code']}' not found",
                        severity="Error",
                        raw_value=row.get('department_code')
                    ))

            # Check duplicate course code
            if row.get('code'):
                existing = db.query(Course).filter(Course.code == row['code']).first()
                if existing:
                    warnings.append(ImportErrorBase(
                        row_number=row_num,
                        column_name="code",
                        error_type="duplicate",
                        error_message=f"Course '{row['code']}' already exists",
                        severity="Warning",
                        raw_value=row.get('code')
                    ))

        elif import_type == ImportType.SYLLABUS:
            if row.get('course_code'):
                course = db.query(Course).filter(
                    Course.code == row['course_code']
                ).first()
                if not course:
                    row_errors.append(ImportErrorBase(
                        row_number=row_num,
                        column_name="course_code",
                        error_type="invalid_reference",
                        error_message=f"Course '{row['course_code']}' not found",
                        severity="Error",
                        raw_value=row.get('course_code')
                    ))

        if row_errors:
            errors.extend(row_errors)
        else:
            valid_rows += 1

    return ImportValidationResult(
        is_valid=len(errors) == 0,
        total_rows=len(data),
        valid_rows=valid_rows,
        invalid_rows=len(data) - valid_rows,
        errors=errors,
        warnings=warnings,
        preview_data=data[:5] if data else None
    )


@router.post("", response_model=ImportLogResponse, status_code=status.HTTP_201_CREATED)
async def import_data(
    import_type: ImportType,
    skip_duplicates: bool = True,
    update_existing: bool = False,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Academic Affairs"]))
):
    """Import data from file"""
    # Create import log
    import_log = ImportLog(
        import_type=import_type,
        file_name=file.filename,
        status=ImportStatus.VALIDATING,
        imported_by=current_user.user_id,
        started_at=datetime.utcnow()
    )
    db.add(import_log)
    db.flush()

    try:
        # Read and parse file
        content = await file.read()

        if file.filename.endswith('.csv'):
            data = list(csv.DictReader(io.StringIO(content.decode('utf-8'))))
        elif file.filename.endswith('.json'):
            data = json.loads(content.decode('utf-8'))
        else:
            raise ValueError("Unsupported file format")

        import_log.total_rows = len(data)
        import_log.status = ImportStatus.PROCESSING
        db.flush()

        successful = 0
        failed = 0

        for row_num, row in enumerate(data, start=1):
            try:
                if import_type == ImportType.COURSE:
                    result = _import_course(db, row, skip_duplicates, update_existing)
                elif import_type == ImportType.SYLLABUS:
                    result = _import_syllabus(db, row, current_user, skip_duplicates, update_existing)
                elif import_type == ImportType.PROGRAM:
                    result = _import_program(db, row, skip_duplicates, update_existing)
                elif import_type == ImportType.USER:
                    result = _import_user(db, row, skip_duplicates, update_existing)
                else:
                    raise ValueError(f"Unknown import type: {import_type}")

                if result:
                    successful += 1
                else:
                    failed += 1

            except Exception as e:
                failed += 1
                error = ImportErrorModel(
                    import_id=import_log.import_id,
                    row_number=row_num,
                    error_type="processing_error",
                    error_message=str(e),
                    severity="Error"
                )
                db.add(error)

        import_log.successful_rows = successful
        import_log.failed_rows = failed
        import_log.status = ImportStatus.COMPLETED if failed == 0 else ImportStatus.PARTIAL
        import_log.completed_at = datetime.utcnow()

        db.commit()
        db.refresh(import_log)

        # Add importer name
        import_log.importer_name = current_user.full_name

        return import_log

    except Exception as e:
        import_log.status = ImportStatus.FAILED
        import_log.error_summary = str(e)
        import_log.completed_at = datetime.utcnow()
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Import failed: {str(e)}"
        )


def _import_course(db: Session, row: dict, skip_duplicates: bool, update_existing: bool) -> bool:
    """Import a single course record"""
    existing = db.query(Course).filter(Course.code == row['code']).first()

    if existing:
        if skip_duplicates:
            return False
        if update_existing:
            existing.name = row['name']
            existing.description = row.get('description')
            existing.credits = int(row['credits'])
            return True
        return False

    # Get department
    dept = db.query(Department).filter(Department.code == row['department_code']).first()
    if not dept:
        raise ValueError(f"Department '{row['department_code']}' not found")

    course = Course(
        code=row['code'],
        name=row['name'],
        department_id=dept.department_id,
        credits=int(row['credits']),
        description=row.get('description'),
        is_elective=str(row.get('is_elective', 'false')).lower() == 'true'
    )
    db.add(course)
    return True


def _import_syllabus(db: Session, row: dict, user: User, skip_duplicates: bool, update_existing: bool) -> bool:
    """Import a single syllabus record"""
    course = db.query(Course).filter(Course.code == row['course_code']).first()
    if not course:
        raise ValueError(f"Course '{row['course_code']}' not found")

    existing = db.query(Syllabus).filter(
        Syllabus.course_id == course.course_id,
        Syllabus.title == row['title']
    ).first()

    if existing:
        if skip_duplicates:
            return False
        if update_existing:
            existing.description = row.get('description')
            return True
        return False

    syllabus = Syllabus(
        course_id=course.course_id,
        title=row['title'],
        description=row.get('description'),
        created_by=user.user_id
    )
    db.add(syllabus)
    return True


def _import_program(db: Session, row: dict, skip_duplicates: bool, update_existing: bool) -> bool:
    """Import a single program record"""
    existing = db.query(Program).filter(Program.code == row['code']).first()

    if existing:
        if skip_duplicates:
            return False
        if update_existing:
            existing.name = row['name']
            existing.description = row.get('description')
            return True
        return False

    dept = db.query(Department).filter(Department.code == row['department_code']).first()
    if not dept:
        raise ValueError(f"Department '{row['department_code']}' not found")

    program = Program(
        code=row['code'],
        name=row['name'],
        department_id=dept.department_id,
        degree_level=row.get('degree_level', 'Bachelor'),
        description=row.get('description'),
        total_credits=int(row.get('total_credits', 120))
    )
    db.add(program)
    return True


def _import_user(db: Session, row: dict, skip_duplicates: bool, update_existing: bool) -> bool:
    """Import a single user record"""
    from app.core.security import get_password_hash
    from app.models import UserRole

    existing = db.query(User).filter(User.username == row['username']).first()

    # Parse full_name into first_name and last_name
    full_name = row.get('full_name', '')
    name_parts = full_name.strip().split(' ', 1)
    first_name = name_parts[0] if name_parts else ''
    last_name = name_parts[1] if len(name_parts) > 1 else ''

    if existing:
        if skip_duplicates:
            return False
        if update_existing:
            existing.first_name = first_name
            existing.last_name = last_name
            existing.email = row['email']
            return True
        return False

    # Get department if specified
    dept_id = None
    if row.get('department_code'):
        dept = db.query(Department).filter(Department.code == row['department_code']).first()
        if dept:
            dept_id = dept.department_id

    # Map role string to enum
    role_map = {
        'lecturer': UserRole.LECTURER,
        'hod': UserRole.HOD,
        'academic affairs': UserRole.ACADEMIC_AFFAIRS,
        'admin': UserRole.ADMIN,
        'principal': UserRole.PRINCIPAL,
        'student': UserRole.STUDENT
    }
    role = role_map.get(row['role'].lower(), UserRole.LECTURER)

    user = User(
        username=row['username'],
        email=row['email'],
        first_name=first_name,
        last_name=last_name,
        password_hash=get_password_hash("changeme123"),  # Default password
        role=role,
        department_id=dept_id
    )
    db.add(user)
    return True


# ==================== Import Logs ====================

@router.get("/logs", response_model=list[ImportLogListResponse])
def list_import_logs(
    import_type: Optional[ImportType] = None,
    status_filter: Optional[ImportStatus] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Academic Affairs"]))
):
    """List import logs"""
    query = db.query(
        ImportLog,
        User.full_name.label("importer_name")
    ).join(User, ImportLog.imported_by == User.user_id)

    if import_type:
        query = query.filter(ImportLog.import_type == import_type)
    if status_filter:
        query = query.filter(ImportLog.status == status_filter)

    results = query.order_by(ImportLog.started_at.desc()).offset(skip).limit(limit).all()

    return [
        ImportLogListResponse(
            import_id=log.import_id,
            import_type=log.import_type,
            file_name=log.file_name,
            status=log.status,
            total_rows=log.total_rows,
            successful_rows=log.successful_rows,
            failed_rows=log.failed_rows,
            started_at=log.started_at,
            completed_at=log.completed_at,
            importer_name=importer_name
        )
        for log, importer_name in results
    ]


@router.get("/logs/{import_id}", response_model=ImportLogResponse)
def get_import_log(
    import_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Academic Affairs"]))
):
    """Get import log details with errors"""
    log = db.query(ImportLog).filter(ImportLog.import_id == import_id).first()

    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Import log not found"
        )

    importer = db.query(User).filter(User.user_id == log.imported_by).first()
    log.importer_name = importer.full_name if importer else None

    return log


@router.get("/logs/{import_id}/errors", response_model=list[ImportErrorResponse])
def get_import_errors(
    import_id: int,
    severity: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Academic Affairs"]))
):
    """Get import errors for a specific import"""
    query = db.query(ImportErrorModel).filter(
        ImportErrorModel.import_id == import_id
    )

    if severity:
        query = query.filter(ImportErrorModel.severity == severity)

    return query.order_by(ImportErrorModel.row_number).offset(skip).limit(limit).all()


@router.delete("/logs/{import_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_import_log(
    import_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin"]))
):
    """Delete an import log and its errors"""
    log = db.query(ImportLog).filter(ImportLog.import_id == import_id).first()

    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Import log not found"
        )

    db.delete(log)
    db.commit()
