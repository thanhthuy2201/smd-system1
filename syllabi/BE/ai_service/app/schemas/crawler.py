"""Schemas for Crawler Service"""
from pydantic import BaseModel, Field, HttpUrl
from typing import Optional
from enum import Enum


class CrawlType(str, Enum):
    TEXTBOOK = "textbook"
    REFERENCE = "reference"
    COURSE_MATERIAL = "course_material"
    ACADEMIC_PAPER = "academic_paper"


class CrawlStatus(str, Enum):
    PENDING = "pending"
    CRAWLING = "crawling"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class CrawlReferenceRequest(BaseModel):
    """Request to crawl reference materials"""
    syllabus_id: int
    search_queries: list[str] = Field(..., description="Search queries for finding references")
    crawl_type: CrawlType = Field(CrawlType.REFERENCE)
    sources: Optional[list[str]] = Field(
        None,
        description="Specific sources to crawl (Google Scholar, library sites, etc.)"
    )
    max_results: int = Field(10, ge=1, le=50)

    class Config:
        json_schema_extra = {
            "example": {
                "syllabus_id": 1,
                "search_queries": [
                    "Introduction to Programming Python",
                    "Data Structures Python tutorial"
                ],
                "crawl_type": "textbook",
                "max_results": 10
            }
        }


class CrawledReference(BaseModel):
    """Single crawled reference"""
    title: str
    url: str
    source: str
    snippet: Optional[str] = None
    authors: Optional[list[str]] = None
    year: Optional[int] = None
    relevance_score: float = Field(..., ge=0, le=1)
    crawl_type: CrawlType


class CrawlReferenceResult(BaseModel):
    """Crawl result"""
    syllabus_id: int
    total_found: int
    references: list[CrawledReference]
    crawl_duration_seconds: float
    sources_crawled: list[str]


class CrawlReferenceResponse(BaseModel):
    """API response for crawl"""
    task_id: str
    status: str
    message: str
    result: Optional[CrawlReferenceResult] = None


class PDFProcessRequest(BaseModel):
    """Request to process a PDF document"""
    file_url: Optional[str] = None
    file_path: Optional[str] = None
    syllabus_id: Optional[int] = None
    extract_text: bool = Field(True)
    extract_structure: bool = Field(True)
    perform_ocr: bool = Field(False, description="Use OCR for scanned PDFs")


class PDFSection(BaseModel):
    """Extracted PDF section"""
    title: str
    content: str
    page_numbers: list[int]


class PDFProcessResult(BaseModel):
    """PDF processing result"""
    filename: str
    total_pages: int
    extracted_text: Optional[str] = None
    sections: list[PDFSection]
    metadata: dict
    language_detected: str
    ocr_used: bool


class URLContentRequest(BaseModel):
    """Request to fetch and process URL content"""
    url: HttpUrl
    extract_main_content: bool = Field(True)
    include_links: bool = Field(False)


class URLContentResult(BaseModel):
    """URL content extraction result"""
    url: str
    title: str
    main_content: str
    summary: Optional[str] = None
    links: Optional[list[str]] = None
    word_count: int
