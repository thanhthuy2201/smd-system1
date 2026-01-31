"""AI Service Configuration"""
from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Application
    APP_NAME: str = "SMD AI Service"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    API_PREFIX: str = "/api/v1"

    # Core API Connection (main FastAPI service)
    CORE_API_URL: str = "http://localhost:8000"
    CORE_API_KEY: Optional[str] = None

    # Database - PostgreSQL with pgvector
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/smd_ai"

    # Redis for Celery and Caching
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # Elasticsearch
    ELASTICSEARCH_URL: str = "http://localhost:9200"
    ELASTICSEARCH_INDEX_PREFIX: str = "smd_"

    # AI Models Configuration
    # Local Models (Hybrid - for embeddings and Vietnamese NLP)
    LOCAL_EMBEDDING_MODEL: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    VIETNAMESE_NLP_MODEL: str = "vinai/phobert-base-v2"

    # Cloud AI APIs (Hybrid - for summarization and complex reasoning)
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"

    GOOGLE_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-1.5-flash"

    # Ollama (Local LLM fallback)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.1:8b"

    # AI Provider Priority (comma-separated: openai,gemini,ollama)
    AI_PROVIDER_PRIORITY: str = "gemini,openai,ollama"

    # Vector Store Settings
    EMBEDDING_DIMENSION: int = 384  # For multilingual-MiniLM
    SIMILARITY_THRESHOLD: float = 0.75

    # Crawler Settings
    CRAWLER_USER_AGENT: str = "SMD-Crawler/1.0 (Educational Purpose)"
    CRAWLER_TIMEOUT: int = 30
    CRAWLER_MAX_PAGES: int = 10

    # Task Settings
    TASK_TIMEOUT: int = 300  # 5 minutes
    MAX_RETRIES: int = 3

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
