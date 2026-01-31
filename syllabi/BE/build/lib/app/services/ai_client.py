"""
AI Service Client - Integration layer for Core API to communicate with AI Microservice

This module provides a clean interface for the Core API to use all AI features.
"""
import httpx
from typing import Optional
from pydantic import BaseModel
from enum import Enum

# AI Service Configuration
AI_SERVICE_URL = "http://localhost:8001/api/v1"
AI_SERVICE_TIMEOUT = 120.0  # seconds


class SummaryLength(str, Enum):
    SHORT = "short"
    MEDIUM = "medium"
    DETAILED = "detailed"


class SummaryLanguage(str, Enum):
    EN = "en"
    VI = "vi"
    BOTH = "both"


class AIServiceClient:
    """Client for communicating with AI Microservice"""

    def __init__(self, base_url: str = AI_SERVICE_URL):
        self.base_url = base_url

    async def health_check(self) -> dict:
        """Check AI service health"""
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(f"{self.base_url}/health")
            return response.json()

    # ==================== CLO-PLO Analysis ====================

    async def check_clo_plo_alignment(
        self,
        syllabus_id: int,
        program_id: int,
        clos: list[dict],
        plos: list[dict],
        sync: bool = True
    ) -> dict:
        """
        Check alignment between CLOs and PLOs.

        Args:
            syllabus_id: Syllabus ID
            program_id: Program ID
            clos: List of CLOs [{"index": 1, "text": "..."}]
            plos: List of PLOs [{"index": 1, "text": "..."}]
            sync: If True, wait for result; if False, return task_id

        Returns:
            Alignment result with mappings and suggestions
        """
        endpoint = "/clo-plo/check/sync" if sync else "/clo-plo/check"

        async with httpx.AsyncClient(timeout=AI_SERVICE_TIMEOUT) as client:
            response = await client.post(
                f"{self.base_url}{endpoint}",
                json={
                    "syllabus_id": syllabus_id,
                    "program_id": program_id,
                    "clos": clos,
                    "plos": plos
                }
            )
            response.raise_for_status()
            return response.json()

    async def find_similar_clos(
        self,
        clo_text: str,
        top_k: int = 5,
        department_id: Optional[int] = None
    ) -> list[dict]:
        """Find similar CLOs from other courses"""
        async with httpx.AsyncClient(timeout=AI_SERVICE_TIMEOUT) as client:
            response = await client.post(
                f"{self.base_url}/clo-plo/similar",
                json={
                    "clo_text": clo_text,
                    "top_k": top_k,
                    "department_id": department_id
                }
            )
            response.raise_for_status()
            return response.json()

    # ==================== Semantic Diff ====================

    async def compare_syllabus_versions(
        self,
        syllabus_id: int,
        version_old: int,
        version_new: int,
        old_content: dict,
        new_content: dict,
        sections: Optional[list[str]] = None,
        sync: bool = True
    ) -> dict:
        """
        Compare two syllabus versions semantically.

        Args:
            syllabus_id: Syllabus ID
            version_old: Old version number
            version_new: New version number
            old_content: Dict with old version content by section
            new_content: Dict with new version content by section
            sections: Specific sections to compare (all if None)
            sync: If True, wait for result

        Returns:
            Semantic diff result with changes and summaries
        """
        endpoint = "/semantic/diff/sync" if sync else "/semantic/diff/with-content"

        params = {
            "syllabus_id": syllabus_id,
            "version_old": version_old,
            "version_new": version_new
        }
        if sections:
            params["sections"] = sections

        async with httpx.AsyncClient(timeout=AI_SERVICE_TIMEOUT) as client:
            response = await client.post(
                f"{self.base_url}{endpoint}",
                params=params,
                json={
                    "old_content": old_content,
                    "new_content": new_content
                }
            )
            response.raise_for_status()
            return response.json()

    async def quick_diff(self, text_old: str, text_new: str) -> dict:
        """Quick semantic comparison between two texts"""
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{self.base_url}/semantic/quick-diff",
                json={"text_old": text_old, "text_new": text_new}
            )
            response.raise_for_status()
            return response.json()

    # ==================== Summarization ====================

    async def generate_summary(
        self,
        syllabus_id: int,
        course_code: str,
        course_name: str,
        content: dict,
        version_id: Optional[int] = None,
        length: SummaryLength = SummaryLength.MEDIUM,
        language: SummaryLanguage = SummaryLanguage.EN,
        target_audience: str = "student",
        sync: bool = True
    ) -> dict:
        """
        Generate AI summary for a syllabus.

        Args:
            syllabus_id: Syllabus ID
            course_code: Course code (e.g., "CS101")
            course_name: Full course name
            content: Syllabus content dict
            version_id: Optional version ID
            length: Summary length (short/medium/detailed)
            language: Output language (en/vi/both)
            target_audience: Target audience
            sync: If True, wait for result

        Returns:
            Summary result with highlights
        """
        endpoint = "/summary/generate/sync" if sync else "/summary/generate"

        async with httpx.AsyncClient(timeout=AI_SERVICE_TIMEOUT) as client:
            response = await client.post(
                f"{self.base_url}{endpoint}",
                params={
                    "syllabus_id": syllabus_id,
                    "course_code": course_code,
                    "course_name": course_name,
                    "version_id": version_id,
                    "length": length.value,
                    "language": language.value,
                    "target_audience": target_audience
                },
                json=content
            )
            response.raise_for_status()
            return response.json()

    async def extract_keywords(
        self,
        syllabus_id: int,
        content: dict,
        top_k: int = 10
    ) -> dict:
        """Extract keywords and topics from syllabus"""
        async with httpx.AsyncClient(timeout=AI_SERVICE_TIMEOUT) as client:
            response = await client.post(
                f"{self.base_url}/summary/keywords",
                params={"syllabus_id": syllabus_id, "top_k": top_k},
                json=content
            )
            response.raise_for_status()
            return response.json()

    # ==================== Crawler ====================

    async def crawl_references(
        self,
        syllabus_id: int,
        search_queries: list[str],
        crawl_type: str = "reference",
        sources: Optional[list[str]] = None,
        max_results: int = 10,
        sync: bool = True
    ) -> dict:
        """
        Crawl web for reference materials.

        Args:
            syllabus_id: Syllabus ID
            search_queries: Search queries
            crawl_type: Type (textbook/reference/course_material/academic_paper)
            sources: Specific sources (openlibrary, google_books, google_scholar)
            max_results: Maximum results to return
            sync: If True, wait for result

        Returns:
            List of found references
        """
        endpoint = "/crawler/references/sync" if sync else "/crawler/references"

        async with httpx.AsyncClient(timeout=AI_SERVICE_TIMEOUT) as client:
            response = await client.post(
                f"{self.base_url}{endpoint}",
                json={
                    "syllabus_id": syllabus_id,
                    "search_queries": search_queries,
                    "crawl_type": crawl_type,
                    "sources": sources,
                    "max_results": max_results
                }
            )
            response.raise_for_status()
            return response.json()

    async def process_pdf(
        self,
        file_path: Optional[str] = None,
        file_url: Optional[str] = None,
        extract_text: bool = True,
        extract_structure: bool = True,
        perform_ocr: bool = False
    ) -> dict:
        """Process a PDF document"""
        async with httpx.AsyncClient(timeout=AI_SERVICE_TIMEOUT) as client:
            response = await client.post(
                f"{self.base_url}/crawler/pdf/process",
                params={
                    "file_path": file_path,
                    "file_url": file_url,
                    "extract_text": extract_text,
                    "extract_structure": extract_structure,
                    "perform_ocr": perform_ocr
                }
            )
            response.raise_for_status()
            return response.json()

    async def fetch_url_content(self, url: str) -> dict:
        """Fetch and extract content from URL"""
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                f"{self.base_url}/crawler/url/fetch",
                json={"url": url}
            )
            response.raise_for_status()
            return response.json()

    # ==================== Task Status ====================

    async def get_task_status(self, task_id: str) -> dict:
        """Get status of any async task"""
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(f"{self.base_url}/tasks/{task_id}")
            response.raise_for_status()
            return response.json()

    async def wait_for_task(self, task_id: str, max_wait: int = 300) -> dict:
        """Wait for async task to complete"""
        import asyncio

        start = asyncio.get_event_loop().time()
        while True:
            status = await self.get_task_status(task_id)
            if status["status"] in ["completed", "failed"]:
                return status

            elapsed = asyncio.get_event_loop().time() - start
            if elapsed > max_wait:
                raise TimeoutError(f"Task {task_id} did not complete in {max_wait}s")

            await asyncio.sleep(2)


# Singleton instance
ai_client = AIServiceClient()
