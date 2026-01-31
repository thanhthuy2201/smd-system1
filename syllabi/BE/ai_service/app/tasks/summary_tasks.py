"""Celery tasks for summarization"""
import logging
from datetime import datetime
import asyncio

from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.models.ai_task import AITask, TaskStatus, TaskType
from app.services.nlp import get_summarizer_service
from app.schemas.summary import SummaryLength, SummaryLanguage

logger = logging.getLogger(__name__)


def run_async(coro):
    """Run async function in sync context"""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(bind=True, name="summary.summarize_syllabus")
def summarize_syllabus(
    self,
    syllabus_id: int,
    version_id: int = None,
    course_code: str = "",
    course_name: str = "",
    content: dict = None,
    length: str = "medium",
    language: str = "en",
    target_audience: str = "student",
    user_id: int = None
):
    """
    Async task to generate syllabus summary.
    """
    task_id = self.request.id
    logger.info(f"Starting summarization task {task_id} for syllabus {syllabus_id}")

    db = SessionLocal()
    start_time = datetime.utcnow()

    try:
        # Create task record
        ai_task = AITask(
            task_id=task_id,
            task_type=TaskType.SUMMARIZATION,
            status=TaskStatus.PROCESSING,
            syllabus_id=syllabus_id,
            version_id=version_id,
            user_id=user_id,
            input_data={
                "length": length,
                "language": language,
                "target_audience": target_audience
            },
            started_at=start_time
        )
        db.add(ai_task)
        db.commit()

        # Run summarization
        service = get_summarizer_service()
        result = run_async(
            service.summarize_syllabus(
                syllabus_id=syllabus_id,
                version_id=version_id,
                course_code=course_code,
                course_name=course_name,
                content=content or {},
                length=SummaryLength(length),
                language=SummaryLanguage(language),
                target_audience=target_audience
            )
        )

        # Update task with result
        end_time = datetime.utcnow()
        ai_task.status = TaskStatus.COMPLETED
        ai_task.completed_at = end_time
        ai_task.processing_time_ms = int((end_time - start_time).total_seconds() * 1000)
        ai_task.result_data = result.model_dump()
        db.commit()

        logger.info(f"Summarization completed for task {task_id}")
        return result.model_dump()

    except Exception as e:
        logger.error(f"Summarization failed for task {task_id}: {e}")

        ai_task = db.query(AITask).filter(AITask.task_id == task_id).first()
        if ai_task:
            ai_task.status = TaskStatus.FAILED
            ai_task.error_message = str(e)
            ai_task.completed_at = datetime.utcnow()
            db.commit()

        raise

    finally:
        db.close()


@celery_app.task(bind=True, name="summary.extract_keywords")
def extract_keywords(
    self,
    syllabus_id: int,
    content: dict,
    top_k: int = 10,
    user_id: int = None
):
    """
    Extract keywords from syllabus content.
    """
    task_id = self.request.id
    logger.info(f"Starting keyword extraction task {task_id}")

    db = SessionLocal()
    start_time = datetime.utcnow()

    try:
        ai_task = AITask(
            task_id=task_id,
            task_type=TaskType.KEYWORD_EXTRACTION,
            status=TaskStatus.PROCESSING,
            syllabus_id=syllabus_id,
            user_id=user_id,
            started_at=start_time
        )
        db.add(ai_task)
        db.commit()

        service = get_summarizer_service()
        result = run_async(
            service.extract_keywords(syllabus_id, content, top_k)
        )

        end_time = datetime.utcnow()
        ai_task.status = TaskStatus.COMPLETED
        ai_task.completed_at = end_time
        ai_task.processing_time_ms = int((end_time - start_time).total_seconds() * 1000)
        ai_task.result_data = result.model_dump()
        db.commit()

        return result.model_dump()

    except Exception as e:
        logger.error(f"Keyword extraction failed: {e}")

        ai_task = db.query(AITask).filter(AITask.task_id == task_id).first()
        if ai_task:
            ai_task.status = TaskStatus.FAILED
            ai_task.error_message = str(e)
            db.commit()

        raise

    finally:
        db.close()
