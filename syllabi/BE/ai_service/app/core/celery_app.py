"""Celery application for async task processing"""
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "smd_ai_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.clo_plo_tasks",
        "app.tasks.semantic_tasks",
        "app.tasks.summary_tasks",
        "app.tasks.crawler_tasks",
    ]
)

# Celery Configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Ho_Chi_Minh",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=settings.TASK_TIMEOUT,
    task_soft_time_limit=settings.TASK_TIMEOUT - 30,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    result_expires=3600,  # Results expire after 1 hour
    broker_connection_retry_on_startup=True,
)

# Task routing
celery_app.conf.task_routes = {
    "app.tasks.clo_plo_tasks.*": {"queue": "ai_processing"},
    "app.tasks.semantic_tasks.*": {"queue": "ai_processing"},
    "app.tasks.summary_tasks.*": {"queue": "ai_processing"},
    "app.tasks.crawler_tasks.*": {"queue": "crawler"},
}

# Beat schedule for periodic tasks (optional)
celery_app.conf.beat_schedule = {
    # Example: refresh embeddings daily
    # "refresh-embeddings-daily": {
    #     "task": "app.tasks.embedding_tasks.refresh_all_embeddings",
    #     "schedule": 86400.0,  # 24 hours
    # },
}
