"""
SMD AI Service - Microservice for AI-powered syllabus analysis

Features:
- CLO-PLO Alignment Checking
- Semantic Version Diff
- AI Summarization
- Reference Crawler
- PDF Processing

Architecture:
- FastAPI for async API
- Celery for background tasks
- Hybrid LLM (Gemini/OpenAI/Ollama)
- Local embeddings (sentence-transformers)
- PostgreSQL + pgvector for vector storage
- Redis for caching and task queue
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api import (
    clo_plo_router,
    semantic_router,
    summary_router,
    crawler_router,
    health_router
)

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")

    # Initialize services
    try:
        from app.services.nlp import get_llm_provider
        llm = get_llm_provider()
        logger.info(f"LLM providers: {llm.get_status()}")
    except Exception as e:
        logger.warning(f"LLM initialization warning: {e}")

    try:
        from app.services.embeddings import get_embedding_service
        embeddings = get_embedding_service()
        logger.info("Embedding service initialized")
    except Exception as e:
        logger.warning(f"Embedding service warning: {e}")

    yield

    # Shutdown
    logger.info("Shutting down AI service")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="""
## SMD AI Microservice

AI-powered analysis service for the Syllabus Management and Digitalization System.

### Features

1. **CLO-PLO Alignment** (`/api/v1/clo-plo`)
   - Check alignment between Course and Program Learning Outcomes
   - Find similar CLOs across courses
   - Get AI-powered improvement suggestions

2. **Semantic Diff** (`/api/v1/semantic`)
   - Compare syllabus versions semantically
   - Detect significant vs cosmetic changes
   - Generate change summaries

3. **AI Summarization** (`/api/v1/summary`)
   - Generate course summaries for students
   - Extract keywords and topics
   - Multi-language support (EN/VI)

4. **Crawler & Documents** (`/api/v1/crawler`)
   - Find reference materials online
   - Process PDF documents
   - Extract content from URLs

### Async Processing

Most endpoints support both sync and async processing:
- **Sync**: Immediate response, may take longer
- **Async**: Returns task_id, poll `/tasks/{task_id}` for results

### AI Providers (Hybrid)

- **Local**: Sentence-transformers for embeddings
- **Cloud**: Gemini/OpenAI for summarization and reasoning
- **Fallback**: Ollama for local LLM when cloud unavailable
    """,
    version=settings.APP_VERSION,
    openapi_tags=[
        {
            "name": "CLO-PLO Analysis",
            "description": "Course Learning Outcome and Program Learning Outcome alignment checking"
        },
        {
            "name": "Semantic Analysis",
            "description": "Semantic comparison of syllabus versions"
        },
        {
            "name": "AI Summarization",
            "description": "AI-powered content summarization and keyword extraction"
        },
        {
            "name": "Crawler & Document Processing",
            "description": "Web crawling and document processing services"
        },
        {
            "name": "Health & Status",
            "description": "Service health and task status endpoints"
        }
    ],
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health_router, prefix=settings.API_PREFIX)
app.include_router(clo_plo_router, prefix=settings.API_PREFIX)
app.include_router(semantic_router, prefix=settings.API_PREFIX)
app.include_router(summary_router, prefix=settings.API_PREFIX)
app.include_router(crawler_router, prefix=settings.API_PREFIX)


@app.get("/")
async def root():
    """Root endpoint with service info"""
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": f"{settings.API_PREFIX}/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=settings.DEBUG
    )
