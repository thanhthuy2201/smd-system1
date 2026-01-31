"""Celery tasks for crawler operations"""
import logging
from datetime import datetime
import asyncio
import time

from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.models.ai_task import AITask, TaskStatus, TaskType
from app.services.crawler import get_web_crawler, get_pdf_processor
from app.schemas.crawler import CrawlType

logger = logging.getLogger(__name__)


def run_async(coro):
    """Run async function in sync context"""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(bind=True, name="crawler.crawl_references")
def crawl_references(
    self,
    syllabus_id: int,
    search_queries: list[str],
    crawl_type: str = "reference",
    sources: list[str] = None,
    max_results: int = 10,
    user_id: int = None
):
    """
    Crawl web for reference materials.
    """
    task_id = self.request.id
    logger.info(f"Starting crawl task {task_id} for syllabus {syllabus_id}")

    db = SessionLocal()
    start_time = datetime.utcnow()
    crawl_start = time.time()

    try:
        # Create task record
        ai_task = AITask(
            task_id=task_id,
            task_type=TaskType.CRAWL_REFERENCE,
            status=TaskStatus.PROCESSING,
            syllabus_id=syllabus_id,
            user_id=user_id,
            input_data={
                "queries": search_queries,
                "crawl_type": crawl_type,
                "sources": sources
            },
            started_at=start_time
        )
        db.add(ai_task)
        db.commit()

        # Run crawler
        crawler = get_web_crawler()
        references = run_async(
            crawler.search_references(
                queries=search_queries,
                crawl_type=CrawlType(crawl_type),
                sources=sources,
                max_results=max_results
            )
        )

        crawl_duration = time.time() - crawl_start

        result = {
            "syllabus_id": syllabus_id,
            "total_found": len(references),
            "references": [r.model_dump() for r in references],
            "crawl_duration_seconds": round(crawl_duration, 2),
            "sources_crawled": sources or ["openlibrary"]
        }

        # Update task
        end_time = datetime.utcnow()
        ai_task.status = TaskStatus.COMPLETED
        ai_task.completed_at = end_time
        ai_task.processing_time_ms = int((end_time - start_time).total_seconds() * 1000)
        ai_task.result_data = result
        db.commit()

        logger.info(f"Crawl completed for task {task_id}: found {len(references)} references")
        return result

    except Exception as e:
        logger.error(f"Crawl failed for task {task_id}: {e}")

        ai_task = db.query(AITask).filter(AITask.task_id == task_id).first()
        if ai_task:
            ai_task.status = TaskStatus.FAILED
            ai_task.error_message = str(e)
            ai_task.completed_at = datetime.utcnow()
            db.commit()

        raise

    finally:
        db.close()


@celery_app.task(bind=True, name="crawler.process_pdf")
def process_pdf(
    self,
    file_path: str = None,
    file_url: str = None,
    syllabus_id: int = None,
    extract_text: bool = True,
    extract_structure: bool = True,
    perform_ocr: bool = False,
    user_id: int = None
):
    """
    Process a PDF file and extract content.
    """
    task_id = self.request.id
    logger.info(f"Starting PDF processing task {task_id}")

    db = SessionLocal()
    start_time = datetime.utcnow()

    try:
        # Create task record
        ai_task = AITask(
            task_id=task_id,
            task_type=TaskType.PDF_PROCESSING,
            status=TaskStatus.PROCESSING,
            syllabus_id=syllabus_id,
            user_id=user_id,
            input_data={
                "file_path": file_path,
                "file_url": file_url,
                "extract_text": extract_text,
                "perform_ocr": perform_ocr
            },
            started_at=start_time
        )
        db.add(ai_task)
        db.commit()

        # Process PDF
        processor = get_pdf_processor()
        result = run_async(
            processor.process_pdf(
                file_path=file_path,
                file_url=file_url,
                extract_text=extract_text,
                extract_structure=extract_structure,
                perform_ocr=perform_ocr
            )
        )

        result_dict = result.model_dump()

        # Update task
        end_time = datetime.utcnow()
        ai_task.status = TaskStatus.COMPLETED
        ai_task.completed_at = end_time
        ai_task.processing_time_ms = int((end_time - start_time).total_seconds() * 1000)
        ai_task.result_data = result_dict
        db.commit()

        logger.info(f"PDF processing completed for task {task_id}")
        return result_dict

    except Exception as e:
        logger.error(f"PDF processing failed for task {task_id}: {e}")

        ai_task = db.query(AITask).filter(AITask.task_id == task_id).first()
        if ai_task:
            ai_task.status = TaskStatus.FAILED
            ai_task.error_message = str(e)
            ai_task.completed_at = datetime.utcnow()
            db.commit()

        raise

    finally:
        db.close()


@celery_app.task(bind=True, name="crawler.fetch_url")
def fetch_url_content(self, url: str):
    """
    Fetch and extract content from a URL.
    """
    task_id = self.request.id
    logger.info(f"Fetching URL content for task {task_id}: {url}")

    crawler = get_web_crawler()
    result = run_async(crawler.fetch_url_content(url))

    return result.model_dump()
