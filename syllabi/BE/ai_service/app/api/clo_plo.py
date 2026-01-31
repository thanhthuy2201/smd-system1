"""CLO-PLO API endpoints"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from celery.result import AsyncResult

from app.schemas import (
    CLOPLOCheckRequest, CLOPLOCheckResponse, CLOPLOCheckResult,
    SimilarCLORequest, SimilarCLOResult, TaskStatusResponse
)
from app.tasks import check_clo_plo_alignment, find_similar_clos
from app.services.nlp import get_clo_plo_checker

router = APIRouter(prefix="/clo-plo", tags=["CLO-PLO Analysis"])


@router.post("/check", response_model=CLOPLOCheckResponse)
async def check_alignment(request: CLOPLOCheckRequest):
    """
    Check CLO-PLO alignment for a syllabus.

    This endpoint submits an async task to analyze the alignment between
    Course Learning Outcomes (CLOs) and Program Learning Outcomes (PLOs).

    The task uses:
    - Local embedding models for semantic similarity
    - Cloud LLM (Gemini/OpenAI) for generating improvement suggestions
    """
    # Submit async task
    task = check_clo_plo_alignment.delay(
        syllabus_id=request.syllabus_id,
        program_id=request.program_id,
        clos=[c.model_dump() for c in request.clos],
        plos=[p.model_dump() for p in request.plos] if request.plos else []
    )

    return CLOPLOCheckResponse(
        task_id=task.id,
        status="processing",
        message="CLO-PLO alignment check started. Use /tasks/{task_id} to check status."
    )


@router.post("/check/sync", response_model=CLOPLOCheckResult)
async def check_alignment_sync(request: CLOPLOCheckRequest):
    """
    Synchronously check CLO-PLO alignment.

    Use this for immediate results (may take longer to respond).
    For large analyses, use the async /check endpoint instead.
    """
    if not request.plos:
        raise HTTPException(400, "PLOs must be provided for sync check")

    checker = get_clo_plo_checker()
    result = await checker.check_alignment(
        syllabus_id=request.syllabus_id,
        program_id=request.program_id,
        clos=request.clos,
        plos=request.plos
    )

    return result


@router.post("/similar", response_model=list[SimilarCLOResult])
async def find_similar(request: SimilarCLORequest):
    """
    Find similar CLOs from other courses.

    Uses embedding similarity to find CLOs with similar content.
    """
    # This would need integration with main database
    # For now, submit as async task
    task = find_similar_clos.delay(
        clo_text=request.clo_text,
        top_k=request.top_k,
        department_id=request.department_id
    )

    # Wait for result (short task)
    result = AsyncResult(task.id)

    try:
        data = result.get(timeout=30)
        return data.get("similar_clos", [])
    except Exception as e:
        raise HTTPException(500, f"Failed to find similar CLOs: {e}")


@router.get("/tasks/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(task_id: str):
    """Get status of a CLO-PLO check task."""
    result = AsyncResult(task_id)

    if result.ready():
        if result.successful():
            return TaskStatusResponse(
                task_id=task_id,
                status="completed",
                task_type="clo_plo_check",
                created_at=None,  # Would need DB lookup
                result=result.result
            )
        else:
            return TaskStatusResponse(
                task_id=task_id,
                status="failed",
                task_type="clo_plo_check",
                created_at=None,
                error=str(result.result)
            )
    else:
        return TaskStatusResponse(
            task_id=task_id,
            status=result.status.lower(),
            task_type="clo_plo_check",
            created_at=None
        )
