"""API routers"""
from app.api.clo_plo import router as clo_plo_router
from app.api.semantic import router as semantic_router
from app.api.summary import router as summary_router
from app.api.crawler import router as crawler_router
from app.api.health import router as health_router

__all__ = [
    "clo_plo_router",
    "semantic_router",
    "summary_router",
    "crawler_router",
    "health_router",
]
