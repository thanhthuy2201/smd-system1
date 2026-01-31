"""Celery tasks for semantic diff"""
import logging
from datetime import datetime
import asyncio

from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.models.ai_task import AITask, TaskStatus, TaskType
from app.services.nlp import get_semantic_diff_service

logger = logging.getLogger(__name__)


def run_async(coro):
    """Run async function in sync context"""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(bind=True, name="semantic.compare_versions")
def compare_syllabus_versions(
    self,
    syllabus_id: int,
    version_old: int,
    version_new: int,
    old_content: dict,
    new_content: dict,
    sections: list[str] = None,
    user_id: int = None
):
    """
    Async task to compare two syllabus versions semantically.
    """
    task_id = self.request.id
    logger.info(f"Starting semantic diff task {task_id} for syllabus {syllabus_id}")

    db = SessionLocal()
    start_time = datetime.utcnow()

    try:
        # Create task record
        ai_task = AITask(
            task_id=task_id,
            task_type=TaskType.SEMANTIC_DIFF,
            status=TaskStatus.PROCESSING,
            syllabus_id=syllabus_id,
            version_id=version_new,
            user_id=user_id,
            input_data={
                "version_old": version_old,
                "version_new": version_new,
                "sections": sections
            },
            started_at=start_time
        )
        db.add(ai_task)
        db.commit()

        # Run semantic diff
        service = get_semantic_diff_service()
        result = run_async(
            service.compare_versions(
                syllabus_id=syllabus_id,
                version_old=version_old,
                version_new=version_new,
                old_content=old_content,
                new_content=new_content,
                sections=sections
            )
        )

        # Update task with result
        end_time = datetime.utcnow()
        ai_task.status = TaskStatus.COMPLETED
        ai_task.completed_at = end_time
        ai_task.processing_time_ms = int((end_time - start_time).total_seconds() * 1000)
        ai_task.result_data = result.model_dump()
        db.commit()

        logger.info(f"Semantic diff completed for task {task_id}")
        return result.model_dump()

    except Exception as e:
        logger.error(f"Semantic diff failed for task {task_id}: {e}")

        ai_task = db.query(AITask).filter(AITask.task_id == task_id).first()
        if ai_task:
            ai_task.status = TaskStatus.FAILED
            ai_task.error_message = str(e)
            ai_task.completed_at = datetime.utcnow()
            db.commit()

        raise

    finally:
        db.close()


@celery_app.task(bind=True, name="semantic.quick_diff")
def quick_semantic_diff(self, text_old: str, text_new: str):
    """
    Quick semantic comparison between two texts.
    """
    task_id = self.request.id
    logger.info(f"Running quick diff for task {task_id}")

    service = get_semantic_diff_service()
    result = run_async(service.quick_diff(text_old, text_new))

    return {
        "task_id": task_id,
        **result
    }
