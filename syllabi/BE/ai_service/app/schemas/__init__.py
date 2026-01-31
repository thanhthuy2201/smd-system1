"""API Schemas"""
from app.schemas.clo_plo import (
    CLOInput, PLOInput, CLOPLOCheckRequest, CLOPLOCheckResult,
    CLOPLOCheckResponse, CLOPLOMapping, AlignmentLevel,
    SimilarCLORequest, SimilarCLOResult
)
from app.schemas.semantic import (
    SemanticDiffRequest, SemanticDiffResult, SemanticDiffResponse,
    SectionChange, ChangeType, ChangeSignificance,
    QuickDiffRequest, QuickDiffResult
)
from app.schemas.summary import (
    SummarizeRequest, SummarizeResult, SummarizeResponse,
    SummaryLength, SummaryLanguage, SyllabusHighlight,
    KeywordExtractionRequest, KeywordExtractionResult, Keyword
)
from app.schemas.crawler import (
    CrawlReferenceRequest, CrawlReferenceResult, CrawlReferenceResponse,
    CrawledReference, CrawlType, CrawlStatus,
    PDFProcessRequest, PDFProcessResult, PDFSection,
    URLContentRequest, URLContentResult
)
from app.schemas.common import TaskStatusResponse, HealthCheckResponse, ErrorResponse

__all__ = [
    # CLO-PLO
    "CLOInput", "PLOInput", "CLOPLOCheckRequest", "CLOPLOCheckResult",
    "CLOPLOCheckResponse", "CLOPLOMapping", "AlignmentLevel",
    "SimilarCLORequest", "SimilarCLOResult",
    # Semantic
    "SemanticDiffRequest", "SemanticDiffResult", "SemanticDiffResponse",
    "SectionChange", "ChangeType", "ChangeSignificance",
    "QuickDiffRequest", "QuickDiffResult",
    # Summary
    "SummarizeRequest", "SummarizeResult", "SummarizeResponse",
    "SummaryLength", "SummaryLanguage", "SyllabusHighlight",
    "KeywordExtractionRequest", "KeywordExtractionResult", "Keyword",
    # Crawler
    "CrawlReferenceRequest", "CrawlReferenceResult", "CrawlReferenceResponse",
    "CrawledReference", "CrawlType", "CrawlStatus",
    "PDFProcessRequest", "PDFProcessResult", "PDFSection",
    "URLContentRequest", "URLContentResult",
    # Common
    "TaskStatusResponse", "HealthCheckResponse", "ErrorResponse",
]
