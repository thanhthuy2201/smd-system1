"""Crawler Services"""
from app.services.crawler.web_crawler import WebCrawlerService, get_web_crawler
from app.services.crawler.pdf_processor import PDFProcessorService, get_pdf_processor

__all__ = [
    "WebCrawlerService", "get_web_crawler",
    "PDFProcessorService", "get_pdf_processor",
]
