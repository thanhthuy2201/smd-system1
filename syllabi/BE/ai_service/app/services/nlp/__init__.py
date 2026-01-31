"""NLP Services"""
from app.services.nlp.llm_provider import HybridLLMProvider, get_llm_provider
from app.services.nlp.clo_plo_checker import CLOPLOChecker, get_clo_plo_checker
from app.services.nlp.semantic_diff import SemanticDiffService, get_semantic_diff_service
from app.services.nlp.summarizer import SummarizerService, get_summarizer_service

__all__ = [
    "HybridLLMProvider", "get_llm_provider",
    "CLOPLOChecker", "get_clo_plo_checker",
    "SemanticDiffService", "get_semantic_diff_service",
    "SummarizerService", "get_summarizer_service",
]
