"""
AI Analysis Router - Full integration with AI Microservice

Provides all AI-powered features for the SMD system:
1. CLO-PLO Alignment Checking
2. Semantic Version Diff
3. AI Summarization
4. Reference Crawler
"""
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, UserRole
from app.models.syllabus import Syllabus
from app.models.syllabus_version import SyllabusVersion
from app.models.course import Course
from app.models.program import Program
from app.services.ai_client import ai_client, SummaryLength, SummaryLanguage

router = APIRouter(prefix="/api/ai", tags=["AI Analysis"])


# ==================== Helper Functions ====================

def get_syllabus_content(syllabus: Syllabus) -> dict:
    """Extract syllabus content into dict format for AI service"""
    return {
        "learning_outcomes": syllabus.learning_outcomes or "",
        "assessment_methods": syllabus.assessment_methods or "",
        "textbooks": syllabus.textbooks or "",
        "teaching_methods": syllabus.teaching_methods or "",
        "prerequisites": syllabus.prerequisites or "",
        "materials": syllabus.materials or "",
        "credits": syllabus.credits,
        "total_hours": syllabus.total_hours
    }


def get_version_content(version: SyllabusVersion) -> dict:
    """Extract version content for comparison"""
    if version.content_json:
        return version.content_json
    return {}


def parse_learning_outcomes(text: str) -> list[dict]:
    """Parse learning outcomes text into structured list"""
    outcomes = []
    lines = text.strip().split("\n")
    for i, line in enumerate(lines, 1):
        line = line.strip()
        if line:
            # Remove numbering if present
            clean = line.lstrip("0123456789.-) ").strip()
            if clean:
                outcomes.append({"index": i, "text": clean})
    return outcomes


# ==================== Request/Response Models ====================

class CLOPLOCheckRequest(BaseModel):
    syllabus_id: int
    program_id: Optional[int] = None


class SummarizeRequest(BaseModel):
    syllabus_id: int
    length: str = "medium"
    language: str = "en"
    target_audience: str = "student"


class CompareVersionsRequest(BaseModel):
    syllabus_id: int
    version_old: int
    version_new: int


class CrawlReferencesRequest(BaseModel):
    syllabus_id: int
    additional_queries: Optional[list[str]] = None
    max_results: int = 10


# ==================== CLO-PLO Analysis Endpoints ====================

@router.post("/clo-plo/check")
async def check_clo_plo_alignment(
    request: CLOPLOCheckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Check CLO-PLO alignment for a syllabus.

    **Flow:**
    1. Fetch syllabus and extract CLOs
    2. Fetch program PLOs
    3. Call AI service for semantic analysis
    4. Return alignment mappings and improvement suggestions

    **Use Case:** HoD/Academic Affairs reviewing syllabus alignment
    """
    # 1. Get syllabus
    syllabus = db.query(Syllabus).filter(Syllabus.syllabus_id == request.syllabus_id).first()
    if not syllabus:
        raise HTTPException(404, "Syllabus not found")

    # 2. Get course and program
    course = db.query(Course).filter(Course.course_id == syllabus.course_id).first()
    program_id = request.program_id or course.program_id

    program = db.query(Program).filter(Program.program_id == program_id).first()
    if not program:
        raise HTTPException(404, "Program not found")

    # 3. Parse CLOs from syllabus
    clos = parse_learning_outcomes(syllabus.learning_outcomes or "")
    if not clos:
        raise HTTPException(400, "No learning outcomes found in syllabus")

    # 4. Get PLOs from program (stored in description for now)
    # In real system, PLOs would be in separate table
    plos = []
    if program.description:
        plos = parse_learning_outcomes(program.description)

    if not plos:
        # Default PLOs for demo
        plos = [
            {"index": 1, "text": "Apply knowledge of computing and mathematics to solve problems"},
            {"index": 2, "text": "Analyze and design computing solutions"},
            {"index": 3, "text": "Communicate effectively in professional settings"},
            {"index": 4, "text": "Function effectively in teams"},
            {"index": 5, "text": "Understand professional and ethical responsibilities"}
        ]

    # 5. Call AI service
    try:
        result = await ai_client.check_clo_plo_alignment(
            syllabus_id=request.syllabus_id,
            program_id=program_id,
            clos=clos,
            plos=plos,
            sync=True
        )
        return {
            "syllabus_id": request.syllabus_id,
            "course_code": course.course_code,
            "course_name": course.course_name,
            "program_code": program.program_code,
            "program_name": program.program_name,
            **result
        }
    except Exception as e:
        raise HTTPException(500, f"AI service error: {str(e)}")


@router.post("/clo-plo/similar")
async def find_similar_clos(
    clo_text: str = Query(..., description="CLO text to find similar ones"),
    department_id: Optional[int] = None,
    top_k: int = 5,
    current_user: User = Depends(get_current_user)
):
    """
    Find similar CLOs from other courses.

    **Use Case:** Lecturer creating new syllabus, looking for reference CLOs
    """
    try:
        result = await ai_client.find_similar_clos(
            clo_text=clo_text,
            top_k=top_k,
            department_id=department_id
        )
        return result
    except Exception as e:
        raise HTTPException(500, f"AI service error: {str(e)}")


# ==================== Semantic Diff Endpoints ====================

@router.post("/semantic/compare")
async def compare_syllabus_versions(
    request: CompareVersionsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Compare two syllabus versions semantically.

    **Flow:**
    1. Fetch both versions
    2. Extract content from each
    3. Call AI service for semantic comparison
    4. Return changes with significance levels

    **Use Case:** HoD reviewing changes before approval
    """
    # 1. Get syllabus and versions
    syllabus = db.query(Syllabus).filter(Syllabus.syllabus_id == request.syllabus_id).first()
    if not syllabus:
        raise HTTPException(404, "Syllabus not found")

    version_old = db.query(SyllabusVersion).filter(
        SyllabusVersion.syllabus_id == request.syllabus_id,
        SyllabusVersion.version_number == request.version_old
    ).first()

    version_new = db.query(SyllabusVersion).filter(
        SyllabusVersion.syllabus_id == request.syllabus_id,
        SyllabusVersion.version_number == request.version_new
    ).first()

    if not version_old or not version_new:
        raise HTTPException(404, "One or both versions not found")

    # 2. Get content
    old_content = get_version_content(version_old)
    new_content = get_version_content(version_new)

    # If content_json is empty, use current syllabus content for new version
    if not new_content:
        new_content = get_syllabus_content(syllabus)

    # 3. Call AI service
    try:
        result = await ai_client.compare_syllabus_versions(
            syllabus_id=request.syllabus_id,
            version_old=request.version_old,
            version_new=request.version_new,
            old_content=old_content,
            new_content=new_content,
            sync=True
        )

        course = db.query(Course).filter(Course.course_id == syllabus.course_id).first()

        return {
            "syllabus_id": request.syllabus_id,
            "course_code": course.course_code if course else "",
            "course_name": course.course_name if course else "",
            **result
        }
    except Exception as e:
        raise HTTPException(500, f"AI service error: {str(e)}")


@router.get("/semantic/quick-diff")
async def quick_semantic_diff(
    text_old: str = Query(..., description="Old text"),
    text_new: str = Query(..., description="New text"),
    current_user: User = Depends(get_current_user)
):
    """
    Quick semantic comparison between two texts.

    **Use Case:** Quick check during editing
    """
    try:
        return await ai_client.quick_diff(text_old, text_new)
    except Exception as e:
        raise HTTPException(500, f"AI service error: {str(e)}")


# ==================== Summarization Endpoints ====================

@router.post("/summary/generate")
async def generate_syllabus_summary(
    request: SummarizeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate AI summary for a syllabus.

    **Flow:**
    1. Fetch syllabus content
    2. Call AI service for summarization
    3. Return summary with highlights

    **Use Case:** Student viewing course summary
    """
    # 1. Get syllabus
    syllabus = db.query(Syllabus).filter(Syllabus.syllabus_id == request.syllabus_id).first()
    if not syllabus:
        raise HTTPException(404, "Syllabus not found")

    course = db.query(Course).filter(Course.course_id == syllabus.course_id).first()
    if not course:
        raise HTTPException(404, "Course not found")

    # 2. Get content
    content = get_syllabus_content(syllabus)

    # 3. Call AI service
    try:
        result = await ai_client.generate_summary(
            syllabus_id=request.syllabus_id,
            course_code=course.course_code,
            course_name=course.course_name,
            content=content,
            version_id=syllabus.version_id,
            length=SummaryLength(request.length),
            language=SummaryLanguage(request.language),
            target_audience=request.target_audience,
            sync=True
        )
        return result
    except Exception as e:
        raise HTTPException(500, f"AI service error: {str(e)}")


@router.get("/summary/{syllabus_id}")
async def get_syllabus_summary(
    syllabus_id: int,
    length: str = "medium",
    language: str = "en",
    db: Session = Depends(get_db)
):
    """
    Get AI summary for a syllabus (public endpoint for students).

    No authentication required for published syllabi.
    """
    syllabus = db.query(Syllabus).filter(Syllabus.syllabus_id == syllabus_id).first()
    if not syllabus:
        raise HTTPException(404, "Syllabus not found")

    # Check if syllabus is published/approved
    if syllabus.status.value not in ["Approved", "Published"]:
        raise HTTPException(403, "Syllabus is not published")

    course = db.query(Course).filter(Course.course_id == syllabus.course_id).first()
    content = get_syllabus_content(syllabus)

    try:
        return await ai_client.generate_summary(
            syllabus_id=syllabus_id,
            course_code=course.course_code if course else "",
            course_name=course.course_name if course else "",
            content=content,
            length=SummaryLength(length),
            language=SummaryLanguage(language),
            target_audience="student",
            sync=True
        )
    except Exception as e:
        raise HTTPException(500, f"AI service error: {str(e)}")


@router.post("/keywords/{syllabus_id}")
async def extract_syllabus_keywords(
    syllabus_id: int,
    top_k: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Extract keywords and topics from syllabus.

    **Use Case:** Categorization, search optimization
    """
    syllabus = db.query(Syllabus).filter(Syllabus.syllabus_id == syllabus_id).first()
    if not syllabus:
        raise HTTPException(404, "Syllabus not found")

    content = get_syllabus_content(syllabus)

    try:
        return await ai_client.extract_keywords(
            syllabus_id=syllabus_id,
            content=content,
            top_k=top_k
        )
    except Exception as e:
        raise HTTPException(500, f"AI service error: {str(e)}")


# ==================== Crawler Endpoints ====================

@router.post("/references/search")
async def search_references(
    request: CrawlReferencesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Search for reference materials related to a syllabus.

    **Flow:**
    1. Get syllabus and course info
    2. Generate search queries from course name and textbooks
    3. Crawl reference sources
    4. Return ranked results

    **Use Case:** Lecturer finding textbooks and references
    """
    # 1. Get syllabus
    syllabus = db.query(Syllabus).filter(Syllabus.syllabus_id == request.syllabus_id).first()
    if not syllabus:
        raise HTTPException(404, "Syllabus not found")

    course = db.query(Course).filter(Course.course_id == syllabus.course_id).first()

    # 2. Build search queries
    queries = []
    if course:
        queries.append(course.course_name)
        if course.course_name_vn:
            queries.append(course.course_name_vn)

    # Add textbook titles if available
    if syllabus.textbooks:
        # Extract book titles from textbooks field
        for line in syllabus.textbooks.split("\n"):
            line = line.strip()
            if line and len(line) > 10:
                # Extract title (usually in quotes or before "by")
                if '"' in line:
                    start = line.find('"') + 1
                    end = line.find('"', start)
                    if end > start:
                        queries.append(line[start:end])
                elif " by " in line.lower():
                    queries.append(line.split(" by ")[0].strip())

    # Add additional queries
    if request.additional_queries:
        queries.extend(request.additional_queries)

    if not queries:
        raise HTTPException(400, "No search queries could be generated")

    # 3. Call AI service
    try:
        result = await ai_client.crawl_references(
            syllabus_id=request.syllabus_id,
            search_queries=queries[:5],  # Limit to 5 queries
            crawl_type="textbook",
            sources=["openlibrary", "google_books"],
            max_results=request.max_results,
            sync=True
        )

        return {
            "syllabus_id": request.syllabus_id,
            "course_code": course.course_code if course else "",
            "search_queries_used": queries[:5],
            **result
        }
    except Exception as e:
        raise HTTPException(500, f"AI service error: {str(e)}")


@router.post("/pdf/extract")
async def extract_pdf_content(
    file: UploadFile = File(...),
    perform_ocr: bool = False,
    current_user: User = Depends(get_current_user)
):
    """
    Upload and extract content from a PDF syllabus.

    **Use Case:** Importing existing PDF syllabus into system
    """
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(400, "File must be a PDF")

    # Save temporarily and process
    import tempfile
    import os

    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        result = await ai_client.process_pdf(
            file_path=tmp_path,
            extract_text=True,
            extract_structure=True,
            perform_ocr=perform_ocr
        )
        return result
    finally:
        os.unlink(tmp_path)


@router.get("/url/fetch")
async def fetch_url_content(
    url: str = Query(..., description="URL to fetch"),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch and extract content from a URL.

    **Use Case:** Importing reference material from web
    """
    try:
        return await ai_client.fetch_url_content(url)
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch URL: {str(e)}")


# ==================== Health Check ====================

@router.get("/health")
async def ai_service_health():
    """Check AI service health status"""
    try:
        return await ai_client.health_check()
    except Exception as e:
        return {
            "status": "unavailable",
            "error": str(e)
        }
