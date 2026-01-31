"""Celery tasks for CLO-PLO checking"""
import logging
from datetime import datetime
import asyncio

from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.models.ai_task import AITask, TaskStatus, TaskType
from app.services.nlp import get_clo_plo_checker
from app.schemas.clo_plo import CLOInput, PLOInput

logger = logging.getLogger(__name__)


def run_async(coro):
    """Run async function in sync context"""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(bind=True, name="clo_plo.check_alignment")
def check_clo_plo_alignment(
    self,
    syllabus_id: int,
    program_id: int,
    clos: list[dict],
    plos: list[dict],
    user_id: int = None
):
    """
    Async task to check CLO-PLO alignment.
    """
    task_id = self.request.id
    logger.info(f"Starting CLO-PLO check task {task_id} for syllabus {syllabus_id}")

    db = SessionLocal()
    start_time = datetime.utcnow()

    try:
        # Update task status
        ai_task = AITask(
            task_id=task_id,
            task_type=TaskType.CLO_PLO_CHECK,
            status=TaskStatus.PROCESSING,
            syllabus_id=syllabus_id,
            user_id=user_id,
            input_data={"clos": clos, "plos": plos},
            started_at=start_time
        )
        db.add(ai_task)
        db.commit()

        # Convert to schema objects
        clo_inputs = [CLOInput(**c) for c in clos]
        plo_inputs = [PLOInput(**p) for p in plos]

        # Run the check
        checker = get_clo_plo_checker()
        result = run_async(
            checker.check_alignment(syllabus_id, program_id, clo_inputs, plo_inputs)
        )

        # Update task with result
        end_time = datetime.utcnow()
        ai_task.status = TaskStatus.COMPLETED
        ai_task.completed_at = end_time
        ai_task.processing_time_ms = int((end_time - start_time).total_seconds() * 1000)
        ai_task.result_data = result.model_dump()
        db.commit()

        logger.info(f"CLO-PLO check completed for task {task_id}")
        return result.model_dump()

    except Exception as e:
        logger.error(f"CLO-PLO check failed for task {task_id}: {e}")

        # Update task with error
        ai_task = db.query(AITask).filter(AITask.task_id == task_id).first()
        if ai_task:
            ai_task.status = TaskStatus.FAILED
            ai_task.error_message = str(e)
            ai_task.completed_at = datetime.utcnow()
            db.commit()

        raise

    finally:
        db.close()


@celery_app.task(bind=True, name="clo_plo.find_similar")
def find_similar_clos(
    self,
    clo_text: str,
    top_k: int = 5,
    department_id: int = None
):
    """
    Find similar CLOs from the database.
    """
    task_id = self.request.id
    logger.info(f"Finding similar CLOs for task {task_id}")

    # This would typically query the database for all CLOs
    # For now, return empty as we need the main system integration

    return {
        "task_id": task_id,
        "query": clo_text,
        "similar_clos": [],
        "message": "Integration with main database required"
    }
