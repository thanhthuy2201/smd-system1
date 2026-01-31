"""Summarization API endpoints"""
from fastapi import APIRouter, HTTPException
from celery.result import AsyncResult

from app.schemas import (
    SummarizeRequest, SummarizeResponse, SummarizeResult,
    KeywordExtractionRequest, KeywordExtractionResult,
    TaskStatusResponse
)
from app.tasks import summarize_syllabus, extract_keywords
from app.services.nlp import get_summarizer_service

router = APIRouter(prefix="/summary", tags=["AI Summarization"])


@router.post("/generate", response_model=SummarizeResponse)
async def generate_summary(
    syllabus_id: int,
    course_code: str,
    course_name: str,
    content: dict,
    version_id: int = None,
    length: str = "medium",
    language: str = "en",
    target_audience: str = "student"
):
    """
    Generate AI summary for a syllabus.

    This endpoint submits an async task to create:
    - Main summary in specified language
    - Key highlights
    - Learning outcomes summary
    - Assessment summary
    - Recommendations for target students

    Args:
        syllabus_id: Syllabus ID
        course_code: Course code (e.g., "CS101")
        course_name: Full course name
        content: Dict with syllabus content sections
        version_id: Optional specific version
        length: "short", "medium", or "detailed"
        language: "en", "vi", or "both"
        target_audience: "student", "instructor", or "reviewer"
    """
    task = summarize_syllabus.delay(
        syllabus_id=syllabus_id,
        version_id=version_id,
        course_code=course_code,
        course_name=course_name,
        content=content,
        length=length,
        language=language,
        target_audience=target_audience
    )

    return SummarizeResponse(
        task_id=task.id,
        status="processing",
        message="Summary generation started. Use /tasks/{task_id} to check status."
    )


@router.post("/generate/sync", response_model=SummarizeResult)
async def generate_summary_sync(
    syllabus_id: int,
    course_code: str,
    course_name: str,
    content: dict,
    version_id: int = None,
    length: str = "medium",
    language: str = "en",
    target_audience: str = "student"
):
    """
    Synchronously generate AI summary.

    Returns immediate results. May take 10-30 seconds depending on content size.
    """
    from app.schemas.summary import SummaryLength, SummaryLanguage

    service = get_summarizer_service()
    result = await service.summarize_syllabus(
        syllabus_id=syllabus_id,
        version_id=version_id,
        course_code=course_code,
        course_name=course_name,
        content=content,
        length=SummaryLength(length),
        language=SummaryLanguage(language),
        target_audience=target_audience
    )
    return result


@router.post("/keywords", response_model=KeywordExtractionResult)
async def extract_keywords_endpoint(
    syllabus_id: int,
    content: dict,
    top_k: int = 10
):
    """
    Extract keywords and topics from syllabus content.

    Returns:
    - Top keywords with scores
    - Main topics
    - Skills mentioned
    - Tools/technologies used
    """
    service = get_summarizer_service()
    result = await service.extract_keywords(
        syllabus_id=syllabus_id,
        content=content,
        top_k=top_k
    )
    return result


@router.post("/keywords/async")
async def extract_keywords_async(request: KeywordExtractionRequest, content: dict):
    """
    Async keyword extraction (for large content).
    """
    task = extract_keywords.delay(
        syllabus_id=request.syllabus_id,
        content=content,
        top_k=request.top_k
    )

    return {
        "task_id": task.id,
        "status": "processing",
        "message": "Keyword extraction started."
    }


@router.get("/tasks/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(task_id: str):
    """Get status of a summarization task."""
    result = AsyncResult(task_id)

    if result.ready():
        if result.successful():
            return TaskStatusResponse(
                task_id=task_id,
                status="completed",
                task_type="summarization",
                created_at=None,
                result=result.result
            )
        else:
            return TaskStatusResponse(
                task_id=task_id,
                status="failed",
                task_type="summarization",
                created_at=None,
                error=str(result.result)
            )
    else:
        return TaskStatusResponse(
            task_id=task_id,
            status=result.status.lower(),
            task_type="summarization",
            created_at=None
        )
