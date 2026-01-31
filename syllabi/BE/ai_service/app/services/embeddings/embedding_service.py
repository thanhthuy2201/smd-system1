"""Embedding service using local sentence-transformers"""
import numpy as np
from typing import Optional
from functools import lru_cache
import logging

from sentence_transformers import SentenceTransformer

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating text embeddings using local models"""

    _instance: Optional["EmbeddingService"] = None
    _model: Optional[SentenceTransformer] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._model is None:
            self._load_model()

    def _load_model(self):
        """Load the embedding model"""
        try:
            logger.info(f"Loading embedding model: {settings.LOCAL_EMBEDDING_MODEL}")
            self._model = SentenceTransformer(settings.LOCAL_EMBEDDING_MODEL)
            logger.info("Embedding model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            raise

    def encode(self, text: str) -> np.ndarray:
        """Generate embedding for a single text"""
        if self._model is None:
            self._load_model()
        return self._model.encode(text, normalize_embeddings=True)

    def encode_batch(self, texts: list[str], batch_size: int = 32) -> np.ndarray:
        """Generate embeddings for multiple texts"""
        if self._model is None:
            self._load_model()
        return self._model.encode(
            texts,
            batch_size=batch_size,
            normalize_embeddings=True,
            show_progress_bar=len(texts) > 100
        )

    def compute_similarity(self, text1: str, text2: str) -> float:
        """Compute cosine similarity between two texts"""
        emb1 = self.encode(text1)
        emb2 = self.encode(text2)
        return float(np.dot(emb1, emb2))

    def compute_similarity_matrix(
        self,
        texts1: list[str],
        texts2: list[str]
    ) -> np.ndarray:
        """Compute similarity matrix between two lists of texts"""
        emb1 = self.encode_batch(texts1)
        emb2 = self.encode_batch(texts2)
        return np.dot(emb1, emb2.T)

    def find_most_similar(
        self,
        query: str,
        candidates: list[str],
        top_k: int = 5
    ) -> list[tuple[int, float]]:
        """Find most similar texts from candidates"""
        query_emb = self.encode(query)
        candidate_embs = self.encode_batch(candidates)

        similarities = np.dot(candidate_embs, query_emb)
        top_indices = np.argsort(similarities)[::-1][:top_k]

        return [(int(idx), float(similarities[idx])) for idx in top_indices]


@lru_cache()
def get_embedding_service() -> EmbeddingService:
    """Get singleton embedding service instance"""
    return EmbeddingService()
