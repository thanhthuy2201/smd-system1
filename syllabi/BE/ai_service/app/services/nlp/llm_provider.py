"""LLM Provider with hybrid support (OpenAI, Gemini, Ollama)"""
import logging
from typing import Optional
from abc import ABC, abstractmethod

from app.core.config import settings

logger = logging.getLogger(__name__)


class BaseLLMProvider(ABC):
    """Base class for LLM providers"""

    @abstractmethod
    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        pass

    @abstractmethod
    def is_available(self) -> bool:
        pass


class OpenAIProvider(BaseLLMProvider):
    """OpenAI API provider"""

    def __init__(self):
        self._client = None
        if settings.OPENAI_API_KEY:
            try:
                from openai import AsyncOpenAI
                self._client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI client: {e}")

    def is_available(self) -> bool:
        return self._client is not None

    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        if not self.is_available():
            raise RuntimeError("OpenAI provider not available")

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        response = await self._client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=2000
        )
        return response.choices[0].message.content


class GeminiProvider(BaseLLMProvider):
    """Google Gemini API provider"""

    def __init__(self):
        self._model = None
        if settings.GOOGLE_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GOOGLE_API_KEY)
                self._model = genai.GenerativeModel(settings.GEMINI_MODEL)
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini client: {e}")

    def is_available(self) -> bool:
        return self._model is not None

    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        if not self.is_available():
            raise RuntimeError("Gemini provider not available")

        full_prompt = prompt
        if system_prompt:
            full_prompt = f"{system_prompt}\n\n{prompt}"

        response = await self._model.generate_content_async(full_prompt)
        return response.text


class OllamaProvider(BaseLLMProvider):
    """Ollama local LLM provider"""

    def __init__(self):
        self._available = False
        self._check_availability()

    def _check_availability(self):
        """Check if Ollama is running"""
        import httpx
        try:
            response = httpx.get(f"{settings.OLLAMA_BASE_URL}/api/tags", timeout=5)
            self._available = response.status_code == 200
        except Exception:
            self._available = False

    def is_available(self) -> bool:
        return self._available

    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        if not self.is_available():
            raise RuntimeError("Ollama provider not available")

        import httpx

        payload = {
            "model": settings.OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False
        }
        if system_prompt:
            payload["system"] = system_prompt

        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/generate",
                json=payload
            )
            response.raise_for_status()
            return response.json()["response"]


class HybridLLMProvider:
    """Hybrid LLM provider that falls back through available providers"""

    def __init__(self):
        self._providers: dict[str, BaseLLMProvider] = {}
        self._priority: list[str] = []
        self._init_providers()

    def _init_providers(self):
        """Initialize all providers"""
        self._providers = {
            "openai": OpenAIProvider(),
            "gemini": GeminiProvider(),
            "ollama": OllamaProvider()
        }

        # Set priority from config
        priority_list = settings.AI_PROVIDER_PRIORITY.split(",")
        self._priority = [p.strip() for p in priority_list if p.strip() in self._providers]

        # Log available providers
        available = [name for name, p in self._providers.items() if p.is_available()]
        logger.info(f"Available LLM providers: {available}")
        logger.info(f"Provider priority: {self._priority}")

    def get_available_provider(self) -> tuple[str, BaseLLMProvider]:
        """Get first available provider based on priority"""
        for name in self._priority:
            provider = self._providers.get(name)
            if provider and provider.is_available():
                return name, provider

        raise RuntimeError("No LLM provider available")

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        preferred_provider: Optional[str] = None
    ) -> tuple[str, str]:
        """
        Generate response using available provider.
        Returns: (response_text, provider_name)
        """
        # Try preferred provider first
        if preferred_provider and preferred_provider in self._providers:
            provider = self._providers[preferred_provider]
            if provider.is_available():
                try:
                    response = await provider.generate(prompt, system_prompt)
                    return response, preferred_provider
                except Exception as e:
                    logger.warning(f"Preferred provider {preferred_provider} failed: {e}")

        # Fall back through priority list
        errors = []
        for name in self._priority:
            provider = self._providers.get(name)
            if provider and provider.is_available():
                try:
                    response = await provider.generate(prompt, system_prompt)
                    return response, name
                except Exception as e:
                    errors.append(f"{name}: {e}")
                    logger.warning(f"Provider {name} failed: {e}")

        raise RuntimeError(f"All LLM providers failed: {errors}")

    def get_status(self) -> dict[str, bool]:
        """Get availability status of all providers"""
        return {name: p.is_available() for name, p in self._providers.items()}


# Singleton instance
_llm_provider: Optional[HybridLLMProvider] = None


def get_llm_provider() -> HybridLLMProvider:
    """Get singleton LLM provider instance"""
    global _llm_provider
    if _llm_provider is None:
        _llm_provider = HybridLLMProvider()
    return _llm_provider
