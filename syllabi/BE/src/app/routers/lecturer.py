"""Router for Lecturer Module"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import Optional
from datetime import datetime
import json

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models import (
    User, UserRole, Course, Department, Program, Syllabus, SyllabusStatus,
    SyllabusCLO, SyllabusContent, SyllabusAssessment, SyllabusReference,
    SyllabusComment, Message, PeerEvaluation, PeerEvaluationScore,
    ApprovalHistory, ReviewSchedule, Notification, NotificationRecipient,
    EvaluationTemplate, EvaluationCriteria
)
from app.schemas.lecturer import (
    CLOCreate, CLOUpdate, CLOResponse,
    ContentCreate, ContentUpdate, ContentResponse,
    AssessmentCreate, AssessmentUpdate, AssessmentResponse,
    ReferenceCreate, ReferenceUpdate, ReferenceResponse,
    SyllabusFullCreate, SyllabusFullResponse, SyllabusDraftSave, SyllabusValidationResult, ValidationError,
    SubmitForReviewRequest,
    CommentCreate, CommentReply, CommentUpdate, CommentResponse,
    MessageCreate, MessageReply, MessageResponse, MessageListResponse, ConversationResponse,
    PeerEvaluationCreate, PeerEvaluationUpdate, PeerEvaluationResponse,
    LecturerDashboard, LecturerCourseResponse, SubmissionStatusResponse
)

router = APIRouter(prefix="/lecturer", tags=["Lecturer"])


# ==================== Dashboard ====================

@router.get("/dashboard", response_model=LecturerDashboard)
def get_lecturer_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get lecturer dashboard data"""
    # Count courses assigned to lecturer (via department or direct assignment)
    total_courses = db.query(func.count(Course.course_id)).filter(
        Course.department_id == current_user.department_id
    ).scalar() or 0

    # Count syllabi by status
    draft_count = db.query(func.count(Syllabus.syllabus_id)).filter(
        Syllabus.created_by == current_user.user_id,
        Syllabus.status == SyllabusStatus.DRAFT
    ).scalar() or 0

    pending_count = db.query(func.count(Syllabus.syllabus_id)).filter(
        Syllabus.created_by == current_user.user_id,
        Syllabus.status == SyllabusStatus.PENDING_REVIEW
    ).scalar() or 0

    approved_count = db.query(func.count(Syllabus.syllabus_id)).filter(
        Syllabus.created_by == current_user.user_id,
        Syllabus.status == SyllabusStatus.APPROVED
    ).scalar() or 0

    revision_count = db.query(func.count(Syllabus.syllabus_id)).filter(
        Syllabus.created_by == current_user.user_id,
        Syllabus.status == SyllabusStatus.REVISION_REQUIRED
    ).scalar() or 0

    # Count pending peer reviews
    pending_reviews = db.query(func.count(PeerEvaluation.evaluation_id)).filter(
        PeerEvaluation.evaluator_id == current_user.user_id,
        PeerEvaluation.is_draft == True
    ).scalar() or 0

    # Count unread messages
    unread_messages = db.query(func.count(Message.message_id)).filter(
        Message.recipient_id == current_user.user_id,
        Message.is_read == False,
        Message.is_deleted_by_recipient == False
    ).scalar() or 0

    # Get upcoming deadlines (from review schedules)
    deadlines = []
    schedules = db.query(ReviewSchedule).filter(
        ReviewSchedule.is_active == True
    ).order_by(ReviewSchedule.l1_deadline).limit(3).all()

    for schedule in schedules:
        deadlines.append({
            "name": schedule.name,
            "deadline": schedule.l1_deadline.isoformat(),
            "type": "Review Deadline"
        })

    # Get recent notifications
    notifications = db.query(Notification).join(
        NotificationRecipient
    ).filter(
        NotificationRecipient.user_id == current_user.user_id
    ).order_by(Notification.created_at.desc()).limit(5).all()

    recent_notifs = [
        {"title": n.title, "type": n.notification_type.value, "created_at": n.created_at.isoformat()}
        for n in notifications
    ]

    return LecturerDashboard(
        total_courses=total_courses,
        draft_syllabi=draft_count,
        pending_review=pending_count,
        approved_syllabi=approved_count,
        revision_required=revision_count,
        pending_peer_reviews=pending_reviews,
        unread_messages=unread_messages,
        upcoming_deadlines=deadlines,
        recent_notifications=recent_notifs
    )


# ==================== Courses ====================

@router.get("/courses", response_model=list[LecturerCourseResponse])
def get_lecturer_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get courses assigned to lecturer for syllabus creation"""
    courses = db.query(Course).filter(
        Course.department_id == current_user.department_id
    ).all()

    result = []
    for course in courses:
        # Check if syllabus exists
        syllabus = db.query(Syllabus).filter(
            Syllabus.course_id == course.course_id,
            Syllabus.created_by == current_user.user_id
        ).order_by(Syllabus.created_date.desc()).first()

        dept = db.query(Department).filter(
            Department.dept_id == course.department_id
        ).first()

        result.append(LecturerCourseResponse(
            course_id=course.course_id,
            code=course.course_code,
            name=course.course_name,
            credits=course.credits,
            program_id=course.program_id,
            department_name=dept.dept_name if dept else None,
            has_syllabus=syllabus is not None,
            syllabus_status=syllabus.status.value if syllabus else None,
            syllabus_id=syllabus.syllabus_id if syllabus else None
        ))

    return result


# ==================== My Syllabi ====================

@router.get("/syllabi")
def get_my_syllabi(
    status_filter: Optional[SyllabusStatus] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get lecturer's syllabi with optional status filter"""
    query = db.query(Syllabus).filter(
        Syllabus.created_by == current_user.user_id
    )

    if status_filter:
        query = query.filter(Syllabus.status == status_filter)

    # Get total count
    total = query.count()

    # Calculate offset from page
    skip = (page - 1) * page_size

    syllabi = query.order_by(Syllabus.created_date.desc()).offset(skip).limit(page_size).all()

    items = []
    for s in syllabi:
        course = db.query(Course).filter(Course.course_id == s.course_id).first()
        items.append({
            "syllabus_id": s.syllabus_id,
            "course_code": course.course_code if course else None,
            "course_name": course.course_name if course else None,
            "academic_year": s.academic_year,
            "semester": s.semester,
            "status": s.status.value,
            "created_date": s.created_date.isoformat(),
            "updated_at": s.updated_at.isoformat() if s.updated_at else None
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.get("/syllabi/approved")
def get_approved_syllabi(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get approved syllabi eligible for update requests"""
    syllabi = db.query(Syllabus).filter(
        Syllabus.created_by == current_user.user_id,
        Syllabus.status == SyllabusStatus.APPROVED
    ).all()

    result = []
    for s in syllabi:
        course = db.query(Course).filter(Course.course_id == s.course_id).first()
        result.append({
            "syllabus_id": s.syllabus_id,
            "course_code": course.course_code if course else None,
            "course_name": course.course_name if course else None,
            "academic_year": s.academic_year,
            "semester": s.semester,
            "status": s.status.value
        })

    return result


@router.get("/syllabi/{syllabus_id}", response_model=SyllabusFullResponse)
def get_syllabus_detail(
    syllabus_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get full syllabus details with all components"""
    syllabus = db.query(Syllabus).filter(
        Syllabus.syllabus_id == syllabus_id,
        Syllabus.created_by == current_user.user_id
    ).first()

    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    # Get course info
    course = db.query(Course).filter(Course.course_id == syllabus.course_id).first()

    # Get CLOs
    clos = db.query(SyllabusCLO).filter(
        SyllabusCLO.syllabus_id == syllabus_id
    ).order_by(SyllabusCLO.display_order).all()

    # Get contents
    contents_raw = db.query(SyllabusContent).filter(
        SyllabusContent.syllabus_id == syllabus_id
    ).order_by(SyllabusContent.week_number).all()

    # Get assessments
    assessments_raw = db.query(SyllabusAssessment).filter(
        SyllabusAssessment.syllabus_id == syllabus_id
    ).order_by(SyllabusAssessment.display_order).all()

    # Get references
    references = db.query(SyllabusReference).filter(
        SyllabusReference.syllabus_id == syllabus_id
    ).order_by(SyllabusReference.display_order).all()

    # Build CLO responses
    clo_responses = [
        CLOResponse(
            clo_id=clo.clo_id,
            syllabus_id=clo.syllabus_id,
            code=clo.code,
            description=clo.description,
            bloom_level=clo.bloom_level,
            mapped_plos=[],
            display_order=clo.display_order,
            created_at=clo.created_at
        )
        for clo in clos
    ]

    # Build content responses
    content_responses = [
        ContentResponse(
            content_id=c.content_id,
            syllabus_id=c.syllabus_id,
            week_number=c.week_number,
            title=c.title,
            description=c.description,
            lecture_hours=c.lecture_hours,
            lab_hours=c.lab_hours,
            teaching_methods=json.loads(c.teaching_methods) if c.teaching_methods else [],
            related_clos=[],
            created_at=c.created_at
        )
        for c in contents_raw
    ]

    # Build assessment responses
    assessment_responses = [
        AssessmentResponse(
            assessment_id=a.assessment_id,
            syllabus_id=a.syllabus_id,
            assessment_type=a.assessment_type,
            name=a.name,
            description=a.description,
            weight=a.weight,
            related_clos=[],
            display_order=a.display_order,
            created_at=a.created_at
        )
        for a in assessments_raw
    ]

    # Build reference responses
    reference_responses = [
        ReferenceResponse(
            reference_id=r.reference_id,
            syllabus_id=r.syllabus_id,
            reference_type=r.reference_type,
            title=r.title,
            authors=r.authors,
            publisher=r.publisher,
            year=r.year,
            isbn=r.isbn,
            url=r.url,
            display_order=r.display_order,
            created_at=r.created_at
        )
        for r in references
    ]

    return SyllabusFullResponse(
        syllabus_id=syllabus.syllabus_id,
        course_id=syllabus.course_id,
        course_code=course.course_code if course else None,
        course_name=course.course_name if course else None,
        academic_year=syllabus.academic_year,
        semester=syllabus.semester,
        credits=syllabus.credits,
        total_hours=syllabus.total_hours,
        description=syllabus.description,
        prerequisites=syllabus.prerequisites,
        status=syllabus.status.value,
        created_by=syllabus.created_by,
        created_date=syllabus.created_date,
        updated_at=syllabus.updated_at,
        clos=clo_responses,
        contents=content_responses,
        assessments=assessment_responses,
        references=reference_responses
    )


# ==================== Create Syllabus ====================

@router.post("/syllabi", status_code=status.HTTP_201_CREATED)
def create_syllabus(
    data: SyllabusFullCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new syllabus with all components"""
    # Validate course exists
    course = db.query(Course).filter(Course.course_id == data.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Create syllabus
    syllabus = Syllabus(
        course_id=data.course_id,
        academic_year=data.academic_year,
        semester=data.semester,
        credits=data.credits,
        total_hours=data.total_hours,
        description=data.description,
        prerequisites=data.prerequisites,
        learning_outcomes="",  # Will be populated from CLOs
        assessment_methods="",  # Will be populated from assessments
        created_by=current_user.user_id,
        status=SyllabusStatus.DRAFT
    )
    db.add(syllabus)
    db.flush()

    # Create CLOs
    for i, clo_data in enumerate(data.clos):
        clo = SyllabusCLO(
            syllabus_id=syllabus.syllabus_id,
            code=clo_data.code,
            description=clo_data.description,
            bloom_level=clo_data.bloom_level,
            display_order=i
        )
        db.add(clo)

    # Create contents
    for content_data in data.contents:
        content = SyllabusContent(
            syllabus_id=syllabus.syllabus_id,
            week_number=content_data.week_number,
            title=content_data.title,
            description=content_data.description,
            lecture_hours=content_data.lecture_hours,
            lab_hours=content_data.lab_hours,
            teaching_methods=json.dumps(content_data.teaching_methods)
        )
        db.add(content)

    # Create assessments
    for i, assess_data in enumerate(data.assessments):
        assessment = SyllabusAssessment(
            syllabus_id=syllabus.syllabus_id,
            assessment_type=assess_data.assessment_type,
            name=assess_data.name,
            description=assess_data.description,
            weight=assess_data.weight,
            display_order=i
        )
        db.add(assessment)

    # Create references
    for i, ref_data in enumerate(data.references):
        reference = SyllabusReference(
            syllabus_id=syllabus.syllabus_id,
            reference_type=ref_data.reference_type,
            title=ref_data.title,
            authors=ref_data.authors,
            publisher=ref_data.publisher,
            year=ref_data.year,
            isbn=ref_data.isbn,
            url=ref_data.url,
            display_order=i
        )
        db.add(reference)

    db.commit()
    db.refresh(syllabus)

    return {"syllabus_id": syllabus.syllabus_id, "message": "Syllabus created successfully"}


@router.put("/syllabi/{syllabus_id}/draft")
def save_draft(
    syllabus_id: int,
    data: SyllabusDraftSave,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Auto-save syllabus draft"""
    syllabus = db.query(Syllabus).filter(
        Syllabus.syllabus_id == syllabus_id,
        Syllabus.created_by == current_user.user_id
    ).first()

    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    if syllabus.status not in [SyllabusStatus.DRAFT, SyllabusStatus.REVISION_REQUIRED]:
        raise HTTPException(status_code=400, detail="Can only edit draft or revision-required syllabi")

    # Update basic fields
    update_fields = data.model_dump(exclude_unset=True, exclude={"clos", "contents", "assessments", "references"})
    for field, value in update_fields.items():
        if hasattr(syllabus, field):
            setattr(syllabus, field, value)

    # Update CLOs if provided
    if data.clos is not None:
        # Delete existing CLOs
        db.query(SyllabusCLO).filter(SyllabusCLO.syllabus_id == syllabus_id).delete()
        # Create new CLOs
        for i, clo_data in enumerate(data.clos):
            clo = SyllabusCLO(
                syllabus_id=syllabus_id,
                code=clo_data.code,
                description=clo_data.description,
                bloom_level=clo_data.bloom_level,
                display_order=i
            )
            db.add(clo)

    # Update contents if provided
    if data.contents is not None:
        # Delete existing contents
        db.query(SyllabusContent).filter(SyllabusContent.syllabus_id == syllabus_id).delete()
        # Create new contents
        for content_data in data.contents:
            content = SyllabusContent(
                syllabus_id=syllabus_id,
                week_number=content_data.week_number,
                title=content_data.title,
                description=content_data.description,
                lecture_hours=content_data.lecture_hours,
                lab_hours=content_data.lab_hours,
                teaching_methods=json.dumps(content_data.teaching_methods)
            )
            db.add(content)

    # Update assessments if provided
    if data.assessments is not None:
        # Delete existing assessments
        db.query(SyllabusAssessment).filter(SyllabusAssessment.syllabus_id == syllabus_id).delete()
        # Create new assessments
        for i, assess_data in enumerate(data.assessments):
            assessment = SyllabusAssessment(
                syllabus_id=syllabus_id,
                assessment_type=assess_data.assessment_type,
                name=assess_data.name,
                description=assess_data.description,
                weight=assess_data.weight,
                display_order=i
            )
            db.add(assessment)

    # Update references if provided
    if data.references is not None:
        # Delete existing references
        db.query(SyllabusReference).filter(SyllabusReference.syllabus_id == syllabus_id).delete()
        # Create new references
        for i, ref_data in enumerate(data.references):
            reference = SyllabusReference(
                syllabus_id=syllabus_id,
                reference_type=ref_data.reference_type,
                title=ref_data.title,
                authors=ref_data.authors,
                publisher=ref_data.publisher,
                year=ref_data.year,
                isbn=ref_data.isbn,
                url=ref_data.url,
                display_order=i
            )
            db.add(reference)

    db.commit()

    return {"message": "Draft saved", "saved_at": datetime.utcnow().isoformat()}


# ==================== CLO Management ====================

@router.post("/syllabi/{syllabus_id}/clos", response_model=CLOResponse, status_code=status.HTTP_201_CREATED)
def add_clo(
    syllabus_id: int,
    data: CLOCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add CLO to syllabus"""
    syllabus = db.query(Syllabus).filter(
        Syllabus.syllabus_id == syllabus_id,
        Syllabus.created_by == current_user.user_id
    ).first()

    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    if syllabus.status not in [SyllabusStatus.DRAFT, SyllabusStatus.REVISION_REQUIRED]:
        raise HTTPException(status_code=400, detail="Cannot modify syllabus in current status")

    # Get next display order
    max_order = db.query(func.max(SyllabusCLO.display_order)).filter(
        SyllabusCLO.syllabus_id == syllabus_id
    ).scalar() or 0

    clo = SyllabusCLO(
        syllabus_id=syllabus_id,
        code=data.code,
        description=data.description,
        bloom_level=data.bloom_level,
        display_order=max_order + 1
    )
    db.add(clo)
    db.commit()
    db.refresh(clo)

    return clo


@router.put("/syllabi/{syllabus_id}/clos/{clo_id}", response_model=CLOResponse)
def update_clo(
    syllabus_id: int,
    clo_id: int,
    data: CLOUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update specific CLO"""
    clo = db.query(SyllabusCLO).join(Syllabus).filter(
        SyllabusCLO.clo_id == clo_id,
        SyllabusCLO.syllabus_id == syllabus_id,
        Syllabus.created_by == current_user.user_id
    ).first()

    if not clo:
        raise HTTPException(status_code=404, detail="CLO not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field != "mapped_plos" and hasattr(clo, field):
            setattr(clo, field, value)

    db.commit()
    db.refresh(clo)
    return clo


@router.delete("/syllabi/{syllabus_id}/clos/{clo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_clo(
    syllabus_id: int,
    clo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove CLO from syllabus"""
    clo = db.query(SyllabusCLO).join(Syllabus).filter(
        SyllabusCLO.clo_id == clo_id,
        SyllabusCLO.syllabus_id == syllabus_id,
        Syllabus.created_by == current_user.user_id
    ).first()

    if not clo:
        raise HTTPException(status_code=404, detail="CLO not found")

    db.delete(clo)
    db.commit()


# ==================== Content Management ====================

@router.post("/syllabi/{syllabus_id}/content", status_code=status.HTTP_201_CREATED)
def add_content(
    syllabus_id: int,
    data: ContentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add course content/topic to syllabus"""
    syllabus = db.query(Syllabus).filter(
        Syllabus.syllabus_id == syllabus_id,
        Syllabus.created_by == current_user.user_id
    ).first()

    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    content = SyllabusContent(
        syllabus_id=syllabus_id,
        week_number=data.week_number,
        title=data.title,
        description=data.description,
        lecture_hours=data.lecture_hours,
        lab_hours=data.lab_hours,
        teaching_methods=json.dumps(data.teaching_methods)
    )
    db.add(content)
    db.commit()
    db.refresh(content)

    return {"content_id": content.content_id, "message": "Content added"}


@router.put("/syllabi/{syllabus_id}/content/{content_id}")
def update_content(
    syllabus_id: int,
    content_id: int,
    data: ContentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update specific course content"""
    content = db.query(SyllabusContent).join(Syllabus).filter(
        SyllabusContent.content_id == content_id,
        SyllabusContent.syllabus_id == syllabus_id,
        Syllabus.created_by == current_user.user_id
    ).first()

    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    # Check syllabus status
    syllabus = db.query(Syllabus).filter(Syllabus.syllabus_id == syllabus_id).first()
    if syllabus.status not in [SyllabusStatus.DRAFT, SyllabusStatus.REVISION_REQUIRED]:
        raise HTTPException(status_code=400, detail="Cannot modify syllabus in current status")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "teaching_methods":
            setattr(content, field, json.dumps(value) if value else None)
        elif field != "related_clos" and hasattr(content, field):
            setattr(content, field, value)

    db.commit()
    db.refresh(content)

    return {"content_id": content.content_id, "message": "Content updated"}


@router.delete("/syllabi/{syllabus_id}/content/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_content(
    syllabus_id: int,
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove course content from syllabus"""
    content = db.query(SyllabusContent).join(Syllabus).filter(
        SyllabusContent.content_id == content_id,
        SyllabusContent.syllabus_id == syllabus_id,
        Syllabus.created_by == current_user.user_id
    ).first()

    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    db.delete(content)
    db.commit()


# ==================== Assessment Management ====================

@router.post("/syllabi/{syllabus_id}/assessments", status_code=status.HTTP_201_CREATED)
def add_assessment(
    syllabus_id: int,
    data: AssessmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add assessment method to syllabus"""
    syllabus = db.query(Syllabus).filter(
        Syllabus.syllabus_id == syllabus_id,
        Syllabus.created_by == current_user.user_id
    ).first()

    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    max_order = db.query(func.max(SyllabusAssessment.display_order)).filter(
        SyllabusAssessment.syllabus_id == syllabus_id
    ).scalar() or 0

    assessment = SyllabusAssessment(
        syllabus_id=syllabus_id,
        assessment_type=data.assessment_type,
        name=data.name,
        description=data.description,
        weight=data.weight,
        display_order=max_order + 1
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    return {"assessment_id": assessment.assessment_id, "message": "Assessment added"}


@router.put("/syllabi/{syllabus_id}/assessments/{assessment_id}")
def update_assessment(
    syllabus_id: int,
    assessment_id: int,
    data: AssessmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update specific assessment"""
    assessment = db.query(SyllabusAssessment).join(Syllabus).filter(
        SyllabusAssessment.assessment_id == assessment_id,
        SyllabusAssessment.syllabus_id == syllabus_id,
        Syllabus.created_by == current_user.user_id
    ).first()

    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    # Check syllabus status
    syllabus = db.query(Syllabus).filter(Syllabus.syllabus_id == syllabus_id).first()
    if syllabus.status not in [SyllabusStatus.DRAFT, SyllabusStatus.REVISION_REQUIRED]:
        raise HTTPException(status_code=400, detail="Cannot modify syllabus in current status")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field != "related_clos" and hasattr(assessment, field):
            setattr(assessment, field, value)

    db.commit()
    db.refresh(assessment)

    return {"assessment_id": assessment.assessment_id, "message": "Assessment updated"}


@router.delete("/syllabi/{syllabus_id}/assessments/{assessment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assessment(
    syllabus_id: int,
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove assessment from syllabus"""
    assessment = db.query(SyllabusAssessment).join(Syllabus).filter(
        SyllabusAssessment.assessment_id == assessment_id,
        SyllabusAssessment.syllabus_id == syllabus_id,
        Syllabus.created_by == current_user.user_id
    ).first()

    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    db.delete(assessment)
    db.commit()


# ==================== Reference Management ====================

@router.post("/syllabi/{syllabus_id}/references", status_code=status.HTTP_201_CREATED)
def add_reference(
    syllabus_id: int,
    data: ReferenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add textbook/reference to syllabus"""
    syllabus = db.query(Syllabus).filter(
        Syllabus.syllabus_id == syllabus_id,
        Syllabus.created_by == current_user.user_id
    ).first()

    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    max_order = db.query(func.max(SyllabusReference.display_order)).filter(
        SyllabusReference.syllabus_id == syllabus_id
    ).scalar() or 0

    reference = SyllabusReference(
        syllabus_id=syllabus_id,
        reference_type=data.reference_type,
        title=data.title,
        authors=data.authors,
        publisher=data.publisher,
        year=data.year,
        isbn=data.isbn,
        url=data.url,
        display_order=max_order + 1
    )
    db.add(reference)
    db.commit()
    db.refresh(reference)

    return {"reference_id": reference.reference_id, "message": "Reference added"}


@router.put("/syllabi/{syllabus_id}/references/{reference_id}")
def update_reference(
    syllabus_id: int,
    reference_id: int,
    data: ReferenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update specific reference"""
    reference = db.query(SyllabusReference).join(Syllabus).filter(
        SyllabusReference.reference_id == reference_id,
        SyllabusReference.syllabus_id == syllabus_id,
        Syllabus.created_by == current_user.user_id
    ).first()

    if not reference:
        raise HTTPException(status_code=404, detail="Reference not found")

    # Check syllabus status
    syllabus = db.query(Syllabus).filter(Syllabus.syllabus_id == syllabus_id).first()
    if syllabus.status not in [SyllabusStatus.DRAFT, SyllabusStatus.REVISION_REQUIRED]:
        raise HTTPException(status_code=400, detail="Cannot modify syllabus in current status")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(reference, field):
            setattr(reference, field, value)

    db.commit()
    db.refresh(reference)

    return {"reference_id": reference.reference_id, "message": "Reference updated"}


@router.delete("/syllabi/{syllabus_id}/references/{reference_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reference(
    syllabus_id: int,
    reference_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove reference from syllabus"""
    reference = db.query(SyllabusReference).join(Syllabus).filter(
        SyllabusReference.reference_id == reference_id,
        SyllabusReference.syllabus_id == syllabus_id,
        Syllabus.created_by == current_user.user_id
    ).first()

    if not reference:
        raise HTTPException(status_code=404, detail="Reference not found")

    db.delete(reference)
    db.commit()


# ==================== Syllabus Preview ====================

@router.get("/syllabi/{syllabus_id}/preview")
def get_syllabus_preview(
    syllabus_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get formatted syllabus preview"""
    syllabus = db.query(Syllabus).filter(
        Syllabus.syllabus_id == syllabus_id
    ).first()

    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    # Get related data
    course = db.query(Course).filter(Course.course_id == syllabus.course_id).first()
    clos = db.query(SyllabusCLO).filter(SyllabusCLO.syllabus_id == syllabus_id).order_by(SyllabusCLO.display_order).all()
    contents = db.query(SyllabusContent).filter(SyllabusContent.syllabus_id == syllabus_id).order_by(SyllabusContent.week_number).all()
    assessments = db.query(SyllabusAssessment).filter(SyllabusAssessment.syllabus_id == syllabus_id).order_by(SyllabusAssessment.display_order).all()
    references = db.query(SyllabusReference).filter(SyllabusReference.syllabus_id == syllabus_id).order_by(SyllabusReference.display_order).all()

    return {
        "syllabus_id": syllabus.syllabus_id,
        "course": {
            "code": course.course_code if course else None,
            "name": course.course_name if course else None,
            "credits": syllabus.credits
        },
        "academic_year": syllabus.academic_year,
        "semester": syllabus.semester,
        "total_hours": syllabus.total_hours,
        "description": syllabus.description,
        "prerequisites": syllabus.prerequisites,
        "clos": [
            {
                "code": clo.code,
                "description": clo.description,
                "bloom_level": clo.bloom_level.value
            }
            for clo in clos
        ],
        "contents": [
            {
                "week": c.week_number,
                "title": c.title,
                "description": c.description,
                "lecture_hours": c.lecture_hours,
                "lab_hours": c.lab_hours,
                "teaching_methods": json.loads(c.teaching_methods) if c.teaching_methods else []
            }
            for c in contents
        ],
        "assessments": [
            {
                "type": a.assessment_type.value,
                "name": a.name,
                "weight": a.weight,
                "description": a.description
            }
            for a in assessments
        ],
        "references": [
            {
                "type": r.reference_type.value,
                "title": r.title,
                "authors": r.authors,
                "publisher": r.publisher,
                "year": r.year,
                "isbn": r.isbn,
                "url": r.url
            }
            for r in references
        ],
        "status": syllabus.status.value,
        "created_by": current_user.full_name,
        "created_date": syllabus.created_date.isoformat()
    }


# ==================== Validation & Submission ====================

@router.post("/syllabi/{syllabus_id}/validate", response_model=SyllabusValidationResult)
def validate_syllabus(
    syllabus_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Validate syllabus before submission"""
    syllabus = db.query(Syllabus).filter(
        Syllabus.syllabus_id == syllabus_id,
        Syllabus.created_by == current_user.user_id
    ).first()

    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    errors = []
    warnings = []

    # Check CLOs
    clos = db.query(SyllabusCLO).filter(SyllabusCLO.syllabus_id == syllabus_id).all()
    if len(clos) < 3:
        errors.append(ValidationError(field="clos", message="Minimum 3 CLOs required"))

    # Check course content
    contents = db.query(SyllabusContent).filter(SyllabusContent.syllabus_id == syllabus_id).all()
    if not contents:
        errors.append(ValidationError(field="contents", message="Course content is required"))

    # Check total hours
    total_lecture = sum(c.lecture_hours for c in contents)
    total_lab = sum(c.lab_hours for c in contents)
    if syllabus.total_hours and (total_lecture + total_lab) != syllabus.total_hours:
        warnings.append(ValidationError(field="total_hours", message=f"Content hours ({total_lecture + total_lab}) don't match total hours ({syllabus.total_hours})"))

    # Check assessments
    assessments = db.query(SyllabusAssessment).filter(SyllabusAssessment.syllabus_id == syllabus_id).all()
    if not assessments:
        errors.append(ValidationError(field="assessments", message="At least one assessment method is required"))
    else:
        total_weight = sum(a.weight for a in assessments)
        if abs(total_weight - 100) > 0.01:
            errors.append(ValidationError(field="assessments", message=f"Assessment weights must total 100% (currently {total_weight}%)"))

    # Check references
    references = db.query(SyllabusReference).filter(
        SyllabusReference.syllabus_id == syllabus_id,
        SyllabusReference.reference_type == "Required"
    ).all()
    if not references:
        errors.append(ValidationError(field="references", message="At least 1 required textbook needed"))

    return SyllabusValidationResult(
        is_valid=len(errors) == 0,
        errors=errors,
        warnings=warnings
    )


@router.post("/syllabi/{syllabus_id}/submit")
def submit_for_review(
    syllabus_id: int,
    data: SubmitForReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit syllabus for review"""
    syllabus = db.query(Syllabus).filter(
        Syllabus.syllabus_id == syllabus_id,
        Syllabus.created_by == current_user.user_id
    ).first()

    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    if syllabus.status not in [SyllabusStatus.DRAFT, SyllabusStatus.REVISION_REQUIRED]:
        raise HTTPException(status_code=400, detail="Syllabus cannot be submitted in current status")

    if not data.confirm:
        raise HTTPException(status_code=400, detail="Must confirm syllabus is ready")

    # Validate first
    validation = validate_syllabus(syllabus_id, db, current_user)
    if not validation.is_valid:
        raise HTTPException(
            status_code=422,
            detail={"message": "Validation failed", "errors": [e.model_dump() for e in validation.errors]}
        )

    # Update status
    syllabus.status = SyllabusStatus.PENDING_REVIEW
    syllabus.submission_notes = data.notes
    syllabus.submitted_at = datetime.utcnow()

    # Log approval history
    history = ApprovalHistory(
        syllabus_id=syllabus_id,
        approver_id=current_user.user_id,
        approver_role=current_user.role.value,
        action="SUBMITTED",
        comments=data.notes
    )
    db.add(history)

    db.commit()

    return {"message": "Syllabus submitted for review", "status": "Pending Review"}


@router.post("/syllabi/{syllabus_id}/withdraw")
def withdraw_submission(
    syllabus_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Withdraw syllabus from review to edit"""
    syllabus = db.query(Syllabus).filter(
        Syllabus.syllabus_id == syllabus_id,
        Syllabus.created_by == current_user.user_id
    ).first()

    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    if syllabus.status != SyllabusStatus.PENDING_REVIEW:
        raise HTTPException(status_code=400, detail="Can only withdraw pending submissions")

    syllabus.status = SyllabusStatus.DRAFT

    # Log withdrawal
    history = ApprovalHistory(
        syllabus_id=syllabus_id,
        approver_id=current_user.user_id,
        approver_role=current_user.role.value,
        action="WITHDRAWN",
        comments="Withdrawn by lecturer for editing"
    )
    db.add(history)

    db.commit()

    return {"message": "Submission withdrawn", "status": "Draft"}


@router.get("/syllabi/{syllabus_id}/submission-status", response_model=SubmissionStatusResponse)
def get_submission_status(
    syllabus_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current submission/approval status"""
    syllabus = db.query(Syllabus).filter(
        Syllabus.syllabus_id == syllabus_id,
        Syllabus.created_by == current_user.user_id
    ).first()

    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    # Get latest approval action
    latest_action = db.query(ApprovalHistory).filter(
        ApprovalHistory.syllabus_id == syllabus_id
    ).order_by(ApprovalHistory.review_date.desc()).first()

    # Get feedback comments
    feedback = db.query(SyllabusComment).filter(
        SyllabusComment.syllabus_id == syllabus_id,
        SyllabusComment.is_resolved == False
    ).all()

    feedback_list = [
        {"comment": f.content, "author": f.author.full_name if f.author else None, "type": f.comment_type.value}
        for f in feedback
    ]

    return SubmissionStatusResponse(
        syllabus_id=syllabus_id,
        status=syllabus.status.value,
        current_stage="Level 1 Review" if syllabus.status == SyllabusStatus.PENDING_REVIEW else syllabus.status.value,
        submitted_at=syllabus.submitted_at,
        review_level=1,
        reviewer_name=None,
        last_action=latest_action.action if latest_action else None,
        last_action_at=latest_action.review_date if latest_action else None,
        feedback=feedback_list
    )


# ==================== Review Schedules ====================

@router.get("/review-schedules")
def get_review_schedules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get review schedules for lecturer's department"""
    schedules = db.query(ReviewSchedule).filter(
        ReviewSchedule.is_active == True
    ).order_by(ReviewSchedule.review_start).all()

    return [
        {
            "schedule_id": s.schedule_id,
            "name": s.name,
            "review_start": s.review_start.isoformat(),
            "l1_deadline": s.l1_deadline.isoformat(),
            "l2_deadline": s.l2_deadline.isoformat(),
            "final_approval": s.final_approval.isoformat()
        }
        for s in schedules
    ]


@router.get("/submissions")
def get_my_submissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all submitted syllabi with status"""
    syllabi = db.query(Syllabus).filter(
        Syllabus.created_by == current_user.user_id,
        Syllabus.status != SyllabusStatus.DRAFT
    ).order_by(Syllabus.submitted_at.desc()).all()

    result = []
    for s in syllabi:
        course = db.query(Course).filter(Course.course_id == s.course_id).first()
        result.append({
            "syllabus_id": s.syllabus_id,
            "course_code": course.course_code if course else None,
            "course_name": course.course_name if course else None,
            "status": s.status.value,
            "submitted_at": s.submitted_at.isoformat() if s.submitted_at else None
        })

    return result


@router.get("/deadlines")
def get_upcoming_deadlines(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get upcoming deadlines"""
    from datetime import date
    today = date.today()

    schedules = db.query(ReviewSchedule).filter(
        ReviewSchedule.is_active == True,
        ReviewSchedule.final_approval >= today
    ).order_by(ReviewSchedule.l1_deadline).all()

    deadlines = []
    for s in schedules:
        if s.l1_deadline >= today:
            deadlines.append({
                "type": "HoD Review Deadline",
                "date": s.l1_deadline.isoformat(),
                "schedule": s.name
            })
        if s.l2_deadline >= today:
            deadlines.append({
                "type": "AA Review Deadline",
                "date": s.l2_deadline.isoformat(),
                "schedule": s.name
            })

    return sorted(deadlines, key=lambda x: x["date"])


# ==================== Syllabus Feedback ====================

@router.get("/syllabi/{syllabus_id}/feedback")
def get_feedback(
    syllabus_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get reviewer feedback requiring action"""
    syllabus = db.query(Syllabus).filter(
        Syllabus.syllabus_id == syllabus_id,
        Syllabus.created_by == current_user.user_id
    ).first()

    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    comments = db.query(SyllabusComment).filter(
        SyllabusComment.syllabus_id == syllabus_id
    ).order_by(SyllabusComment.created_at.desc()).all()

    result = []
    for c in comments:
        result.append({
            "comment_id": c.comment_id,
            "type": c.comment_type.value,
            "section": c.section_reference,
            "content": c.content,
            "priority": c.priority.value if c.priority else None,
            "author": c.author.full_name if c.author else None,
            "is_resolved": c.is_resolved,
            "created_at": c.created_at.isoformat()
        })

    return result


# ==================== Approval Timeline ====================

@router.get("/syllabi/{syllabus_id}/approval-timeline")
def get_approval_timeline(
    syllabus_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed approval timeline for a syllabus"""
    syllabus = db.query(Syllabus).filter(
        Syllabus.syllabus_id == syllabus_id,
        Syllabus.created_by == current_user.user_id
    ).first()

    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    # Get all approval history entries
    history = db.query(ApprovalHistory).filter(
        ApprovalHistory.syllabus_id == syllabus_id
    ).order_by(ApprovalHistory.review_date.asc()).all()

    course = db.query(Course).filter(Course.course_id == syllabus.course_id).first()

    timeline = []
    for h in history:
        approver = db.query(User).filter(User.user_id == h.approver_id).first()
        timeline.append({
            "action": h.action,
            "action_date": h.review_date.isoformat(),
            "approver_name": approver.full_name if approver else None,
            "approver_role": approver.role.value if approver else None,
            "comments": h.comments,
            "review_level": getattr(h, 'review_level', None)
        })

    # Determine current stage
    if syllabus.status == SyllabusStatus.DRAFT:
        current_stage = "Draft"
        next_stage = "Submit for Review"
    elif syllabus.status == SyllabusStatus.PENDING_REVIEW:
        current_stage = "Pending Review"
        next_stage = "HoD Review"
    elif syllabus.status == SyllabusStatus.REVISION_REQUIRED:
        current_stage = "Revision Required"
        next_stage = "Re-submit for Review"
    elif syllabus.status == SyllabusStatus.APPROVED:
        current_stage = "Approved"
        next_stage = None
    elif syllabus.status == SyllabusStatus.REJECTED:
        current_stage = "Rejected"
        next_stage = None
    else:
        current_stage = syllabus.status.value
        next_stage = None

    return {
        "syllabus_id": syllabus_id,
        "course_code": course.course_code if course else None,
        "course_name": course.course_name if course else None,
        "status": syllabus.status.value,
        "current_stage": current_stage,
        "next_stage": next_stage,
        "submitted_at": syllabus.submitted_at.isoformat() if syllabus.submitted_at else None,
        "created_date": syllabus.created_date.isoformat() if syllabus.created_date else None,
        "timeline": timeline,
        "stages": [
            {"name": "Draft", "completed": True},
            {"name": "Submitted", "completed": syllabus.submitted_at is not None},
            {"name": "HoD Review", "completed": syllabus.status in [SyllabusStatus.APPROVED, SyllabusStatus.REJECTED] or any(h.get("approver_role") == "HoD" for h in timeline)},
            {"name": "AA Review", "completed": syllabus.status in [SyllabusStatus.APPROVED, SyllabusStatus.REJECTED]},
            {"name": "Final Approval", "completed": syllabus.status == SyllabusStatus.APPROVED}
        ]
    }
