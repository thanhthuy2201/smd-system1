"""Crawler API endpoints"""
from fastapi import APIRouter, HTTPException, UploadFile, File
from celery.result import AsyncResult

from app.schemas import (
    CrawlReferenceRequest, CrawlReferenceResponse, CrawlReferenceResult,
    PDFProcessRequest, PDFProcessResult,
    URLContentRequest, URLContentResult,
    TaskStatusResponse
)
from app.tasks import crawl_references, process_pdf, fetch_url_content
from app.services.crawler import get_web_crawler, get_pdf_processor

router = APIRouter(prefix="/crawler", tags=["Crawler & Document Processing"])


@router.post("/references", response_model=CrawlReferenceResponse)
async def crawl_reference_materials(request: CrawlReferenceRequest):
    """
    Crawl web for reference materials related to a syllabus.

    Searches multiple sources:
    - Open Library (textbooks)
    - Google Books API
    - Google Scholar (academic papers)

    Returns found references with relevance scores.
    """
    task = crawl_references.delay(
        syllabus_id=request.syllabus_id,
        search_queries=request.search_queries,
        crawl_type=request.crawl_type.value,
        sources=request.sources,
        max_results=request.max_results
    )

    return CrawlReferenceResponse(
        task_id=task.id,
        status="processing",
        message="Reference crawl started. Use /tasks/{task_id} to check status."
    )


@router.post("/references/sync", response_model=CrawlReferenceResult)
async def crawl_references_sync(request: CrawlReferenceRequest):
    """
    Synchronously crawl for references.

    May take 10-60 seconds depending on number of queries and sources.
    """
    import time

    crawler = get_web_crawler()
    start = time.time()

    references = await crawler.search_references(
        queries=request.search_queries,
        crawl_type=request.crawl_type,
        sources=request.sources,
        max_results=request.max_results
    )

    return CrawlReferenceResult(
        syllabus_id=request.syllabus_id,
        total_found=len(references),
        references=references,
        crawl_duration_seconds=round(time.time() - start, 2),
        sources_crawled=request.sources or ["openlibrary"]
    )


@router.post("/pdf/process", response_model=PDFProcessResult)
async def process_pdf_document(
    file_path: str = None,
    file_url: str = None,
    extract_text: bool = True,
    extract_structure: bool = True,
    perform_ocr: bool = False
):
    """
    Process a PDF document and extract content.

    Supports:
    - Text extraction from PDF
    - Section structure detection
    - OCR for scanned documents (Vietnamese + English)

    Provide either file_path (local) or file_url (remote).
    """
    if not file_path and not file_url:
        raise HTTPException(400, "Either file_path or file_url must be provided")

    processor = get_pdf_processor()
    result = await processor.process_pdf(
        file_path=file_path,
        file_url=file_url,
        extract_text=extract_text,
        extract_structure=extract_structure,
        perform_ocr=perform_ocr
    )

    return result


@router.post("/pdf/upload", response_model=PDFProcessResult)
async def upload_and_process_pdf(
    file: UploadFile = File(...),
    extract_text: bool = True,
    extract_structure: bool = True,
    perform_ocr: bool = False
):
    """
    Upload a PDF file and process it.
    """
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(400, "File must be a PDF")

    content = await file.read()

    processor = get_pdf_processor()
    result = await processor.process_pdf(
        file_content=content,
        extract_text=extract_text,
        extract_structure=extract_structure,
        perform_ocr=perform_ocr
    )

    return result


@router.post("/pdf/async")
async def process_pdf_async(request: PDFProcessRequest):
    """
    Async PDF processing (for large documents).
    """
    task = process_pdf.delay(
        file_path=request.file_path,
        file_url=request.file_url,
        syllabus_id=request.syllabus_id,
        extract_text=request.extract_text,
        extract_structure=request.extract_structure,
        perform_ocr=request.perform_ocr
    )

    return {
        "task_id": task.id,
        "status": "processing",
        "message": "PDF processing started."
    }


@router.post("/url/fetch", response_model=URLContentResult)
async def fetch_url(request: URLContentRequest):
    """
    Fetch and extract content from a URL.

    Useful for:
    - Importing syllabus content from web pages
    - Extracting reference material content
    - Content analysis from external sources
    """
    crawler = get_web_crawler()
    result = await crawler.fetch_url_content(str(request.url))
    return result


@router.get("/tasks/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(task_id: str):
    """Get status of a crawler task."""
    result = AsyncResult(task_id)

    if result.ready():
        if result.successful():
            return TaskStatusResponse(
                task_id=task_id,
                status="completed",
                task_type="crawler",
                created_at=None,
                result=result.result
            )
        else:
            return TaskStatusResponse(
                task_id=task_id,
                status="failed",
                task_type="crawler",
                created_at=None,
                error=str(result.result)
            )
    else:
        return TaskStatusResponse(
            task_id=task_id,
            status=result.status.lower(),
            task_type="crawler",
            created_at=None
        )
