"""Health check and status endpoints"""
from fastapi import APIRouter
from celery.result import AsyncResult

from app.core.config import settings
from app.schemas import HealthCheckResponse, TaskStatusResponse
from app.services.nlp import get_llm_provider
from app.core.celery_app import celery_app

router = APIRouter(tags=["Health & Status"])


@router.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """
    Check health of all services.

    Returns status of:
    - API server
    - Celery workers
    - Redis connection
    - LLM providers (OpenAI, Gemini, Ollama)
    - Database connection
    """
    services = {}

    # Check LLM providers
    try:
        llm = get_llm_provider()
        provider_status = llm.get_status()
        for name, available in provider_status.items():
            services[f"llm_{name}"] = "available" if available else "unavailable"
    except Exception as e:
        services["llm"] = f"error: {e}"

    # Check Celery/Redis
    try:
        celery_app.control.ping(timeout=1)
        services["celery"] = "available"
    except Exception:
        services["celery"] = "unavailable"

    # Check Redis
    try:
        import redis
        r = redis.from_url(settings.REDIS_URL)
        r.ping()
        services["redis"] = "available"
    except Exception:
        services["redis"] = "unavailable"

    # Overall status
    critical_services = ["redis"]
    all_critical_ok = all(
        services.get(s) == "available" for s in critical_services
    )
    any_llm_available = any(
        services.get(f"llm_{p}") == "available"
        for p in ["openai", "gemini", "ollama"]
    )

    overall_status = "healthy" if (all_critical_ok and any_llm_available) else "degraded"

    return HealthCheckResponse(
        status=overall_status,
        version=settings.APP_VERSION,
        services=services
    )


@router.get("/status")
async def service_status():
    """Get detailed service status."""
    llm = get_llm_provider()

    return {
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "debug": settings.DEBUG,
        "llm_providers": llm.get_status(),
        "llm_priority": settings.AI_PROVIDER_PRIORITY.split(","),
        "embedding_model": settings.LOCAL_EMBEDDING_MODEL,
        "core_api_url": settings.CORE_API_URL,
    }


@router.get("/tasks/{task_id}", response_model=TaskStatusResponse)
async def get_any_task_status(task_id: str):
    """
    Get status of any task by ID.

    Works for all task types (CLO-PLO, semantic diff, summarization, crawler).
    """
    result = AsyncResult(task_id)

    status_map = {
        "PENDING": "pending",
        "STARTED": "processing",
        "RETRY": "retrying",
        "FAILURE": "failed",
        "SUCCESS": "completed",
    }

    if result.ready():
        if result.successful():
            return TaskStatusResponse(
                task_id=task_id,
                status="completed",
                task_type="unknown",
                created_at=None,
                result=result.result
            )
        else:
            return TaskStatusResponse(
                task_id=task_id,
                status="failed",
                task_type="unknown",
                created_at=None,
                error=str(result.result)
            )
    else:
        return TaskStatusResponse(
            task_id=task_id,
            status=status_map.get(result.status, result.status.lower()),
            task_type="unknown",
            created_at=None
        )
