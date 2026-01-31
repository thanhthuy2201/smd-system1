"""Services module"""
from app.services.embeddings import EmbeddingService, get_embedding_service
from app.services.nlp import (
    HybridLLMProvider, get_llm_provider,
    CLOPLOChecker, get_clo_plo_checker,
    SemanticDiffService, get_semantic_diff_service,
    SummarizerService, get_summarizer_service,
)
from app.services.crawler import (
    WebCrawlerService, get_web_crawler,
    PDFProcessorService, get_pdf_processor,
)

__all__ = [
    # Embeddings
    "EmbeddingService", "get_embedding_service",
    # NLP
    "HybridLLMProvider", "get_llm_provider",
    "CLOPLOChecker", "get_clo_plo_checker",
    "SemanticDiffService", "get_semantic_diff_service",
    "SummarizerService", "get_summarizer_service",
    # Crawler
    "WebCrawlerService", "get_web_crawler",
    "PDFProcessorService", "get_pdf_processor",
]
