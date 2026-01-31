"""Celery tasks"""
from app.tasks.clo_plo_tasks import check_clo_plo_alignment, find_similar_clos
from app.tasks.semantic_tasks import compare_syllabus_versions, quick_semantic_diff
from app.tasks.summary_tasks import summarize_syllabus, extract_keywords
from app.tasks.crawler_tasks import crawl_references, process_pdf, fetch_url_content

__all__ = [
    # CLO-PLO
    "check_clo_plo_alignment",
    "find_similar_clos",
    # Semantic
    "compare_syllabus_versions",
    "quick_semantic_diff",
    # Summary
    "summarize_syllabus",
    "extract_keywords",
    # Crawler
    "crawl_references",
    "process_pdf",
    "fetch_url_content",
]
