"""Web Crawler Service for fetching reference materials"""
import logging
import asyncio
from typing import Optional
from urllib.parse import quote_plus
import re

import httpx
from bs4 import BeautifulSoup

from app.core.config import settings
from app.schemas.crawler import CrawledReference, CrawlType, URLContentResult

logger = logging.getLogger(__name__)


class WebCrawlerService:
    """Service for crawling web content and reference materials"""

    SEARCH_SOURCES = {
        "google_scholar": "https://scholar.google.com/scholar?q=",
        "google_books": "https://www.google.com/search?tbm=bks&q=",
        "openlibrary": "https://openlibrary.org/search.json?q=",
    }

    def __init__(self):
        self.headers = {
            "User-Agent": settings.CRAWLER_USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        }
        self.timeout = settings.CRAWLER_TIMEOUT

    async def search_references(
        self,
        queries: list[str],
        crawl_type: CrawlType,
        sources: Optional[list[str]] = None,
        max_results: int = 10
    ) -> list[CrawledReference]:
        """Search for reference materials across multiple sources"""
        logger.info(f"Searching references for {len(queries)} queries")

        all_references: list[CrawledReference] = []
        used_sources = sources or ["openlibrary"]

        async with httpx.AsyncClient(timeout=self.timeout, headers=self.headers) as client:
            for query in queries:
                for source in used_sources:
                    try:
                        refs = await self._search_source(client, query, source, crawl_type)
                        all_references.extend(refs)
                    except Exception as e:
                        logger.warning(f"Failed to search {source} for '{query}': {e}")

        # Remove duplicates and sort by relevance
        seen_urls = set()
        unique_refs = []
        for ref in sorted(all_references, key=lambda x: x.relevance_score, reverse=True):
            if ref.url not in seen_urls:
                seen_urls.add(ref.url)
                unique_refs.append(ref)

        return unique_refs[:max_results]

    async def _search_source(
        self,
        client: httpx.AsyncClient,
        query: str,
        source: str,
        crawl_type: CrawlType
    ) -> list[CrawledReference]:
        """Search a specific source"""
        if source == "openlibrary":
            return await self._search_openlibrary(client, query, crawl_type)
        elif source == "google_scholar":
            return await self._search_google_scholar(client, query, crawl_type)
        elif source == "google_books":
            return await self._search_google_books(client, query, crawl_type)
        else:
            logger.warning(f"Unknown source: {source}")
            return []

    async def _search_openlibrary(
        self,
        client: httpx.AsyncClient,
        query: str,
        crawl_type: CrawlType
    ) -> list[CrawledReference]:
        """Search Open Library API"""
        url = f"https://openlibrary.org/search.json?q={quote_plus(query)}&limit=5"

        try:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()

            references = []
            for doc in data.get("docs", [])[:5]:
                title = doc.get("title", "Unknown Title")
                authors = doc.get("author_name", [])
                year = doc.get("first_publish_year")
                key = doc.get("key", "")

                references.append(CrawledReference(
                    title=title,
                    url=f"https://openlibrary.org{key}",
                    source="Open Library",
                    snippet=f"By {', '.join(authors[:2])}" if authors else None,
                    authors=authors[:3] if authors else None,
                    year=year,
                    relevance_score=0.7,
                    crawl_type=crawl_type
                ))

            return references

        except Exception as e:
            logger.error(f"Open Library search failed: {e}")
            return []

    async def _search_google_scholar(
        self,
        client: httpx.AsyncClient,
        query: str,
        crawl_type: CrawlType
    ) -> list[CrawledReference]:
        """Search Google Scholar (basic scraping - may be blocked)"""
        url = f"https://scholar.google.com/scholar?q={quote_plus(query)}&hl=en"

        try:
            response = await client.get(url)
            if response.status_code == 429:
                logger.warning("Google Scholar rate limited")
                return []

            soup = BeautifulSoup(response.text, "lxml")
            references = []

            for result in soup.select(".gs_r.gs_or.gs_scl")[:5]:
                title_elem = result.select_one(".gs_rt a")
                if not title_elem:
                    continue

                title = title_elem.get_text(strip=True)
                href = title_elem.get("href", "")

                snippet_elem = result.select_one(".gs_rs")
                snippet = snippet_elem.get_text(strip=True)[:200] if snippet_elem else None

                # Extract authors and year from citation line
                cite_elem = result.select_one(".gs_a")
                authors = []
                year = None
                if cite_elem:
                    cite_text = cite_elem.get_text()
                    # Try to extract year
                    year_match = re.search(r'\b(19|20)\d{2}\b', cite_text)
                    if year_match:
                        year = int(year_match.group())
                    # Authors are usually before the first dash
                    if " - " in cite_text:
                        authors_text = cite_text.split(" - ")[0]
                        authors = [a.strip() for a in authors_text.split(",")][:3]

                references.append(CrawledReference(
                    title=title,
                    url=href,
                    source="Google Scholar",
                    snippet=snippet,
                    authors=authors if authors else None,
                    year=year,
                    relevance_score=0.8,
                    crawl_type=crawl_type
                ))

            return references

        except Exception as e:
            logger.error(f"Google Scholar search failed: {e}")
            return []

    async def _search_google_books(
        self,
        client: httpx.AsyncClient,
        query: str,
        crawl_type: CrawlType
    ) -> list[CrawledReference]:
        """Search Google Books API"""
        url = f"https://www.googleapis.com/books/v1/volumes?q={quote_plus(query)}&maxResults=5"

        try:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()

            references = []
            for item in data.get("items", [])[:5]:
                info = item.get("volumeInfo", {})
                title = info.get("title", "Unknown Title")
                authors = info.get("authors", [])
                year = None
                pub_date = info.get("publishedDate", "")
                if pub_date:
                    year_match = re.match(r"(\d{4})", pub_date)
                    if year_match:
                        year = int(year_match.group(1))

                link = info.get("infoLink", item.get("selfLink", ""))
                description = info.get("description", "")[:200]

                references.append(CrawledReference(
                    title=title,
                    url=link,
                    source="Google Books",
                    snippet=description if description else None,
                    authors=authors[:3] if authors else None,
                    year=year,
                    relevance_score=0.75,
                    crawl_type=crawl_type
                ))

            return references

        except Exception as e:
            logger.error(f"Google Books search failed: {e}")
            return []

    async def fetch_url_content(self, url: str) -> URLContentResult:
        """Fetch and extract content from a URL"""
        logger.info(f"Fetching content from: {url}")

        async with httpx.AsyncClient(timeout=self.timeout, headers=self.headers) as client:
            response = await client.get(url)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, "lxml")

            # Extract title
            title = ""
            if soup.title:
                title = soup.title.get_text(strip=True)

            # Remove script and style elements
            for element in soup(["script", "style", "nav", "footer", "header", "aside"]):
                element.decompose()

            # Try to find main content
            main_content = ""
            for selector in ["article", "main", ".content", "#content", ".post-content"]:
                content_elem = soup.select_one(selector)
                if content_elem:
                    main_content = content_elem.get_text(separator="\n", strip=True)
                    break

            if not main_content:
                body = soup.find("body")
                if body:
                    main_content = body.get_text(separator="\n", strip=True)

            # Clean up content
            lines = [line.strip() for line in main_content.split("\n") if line.strip()]
            main_content = "\n".join(lines)

            return URLContentResult(
                url=str(url),
                title=title,
                main_content=main_content[:10000],  # Limit content length
                word_count=len(main_content.split())
            )


# Singleton
_crawler: Optional[WebCrawlerService] = None


def get_web_crawler() -> WebCrawlerService:
    global _crawler
    if _crawler is None:
        _crawler = WebCrawlerService()
    return _crawler
