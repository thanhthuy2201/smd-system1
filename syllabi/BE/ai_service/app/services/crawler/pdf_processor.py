"""PDF Processing Service with OCR support"""
import logging
import io
from typing import Optional
from pathlib import Path

import httpx

from app.core.config import settings
from app.schemas.crawler import PDFProcessResult, PDFSection

logger = logging.getLogger(__name__)


class PDFProcessorService:
    """Service for processing PDF documents"""

    def __init__(self):
        self._pypdf_available = False
        self._ocr_available = False
        self._check_dependencies()

    def _check_dependencies(self):
        """Check available PDF processing libraries"""
        try:
            import PyPDF2
            self._pypdf_available = True
        except ImportError:
            logger.warning("PyPDF2 not available")

        try:
            import pytesseract
            from PIL import Image
            self._ocr_available = True
        except ImportError:
            logger.warning("OCR (pytesseract/PIL) not available")

    async def process_pdf(
        self,
        file_path: Optional[str] = None,
        file_url: Optional[str] = None,
        file_content: Optional[bytes] = None,
        extract_text: bool = True,
        extract_structure: bool = True,
        perform_ocr: bool = False
    ) -> PDFProcessResult:
        """Process a PDF file and extract content"""
        logger.info(f"Processing PDF: {file_path or file_url or 'uploaded content'}")

        # Get PDF content
        pdf_bytes = await self._get_pdf_content(file_path, file_url, file_content)
        filename = self._get_filename(file_path, file_url)

        if not self._pypdf_available:
            raise RuntimeError("PyPDF2 not installed. Cannot process PDF.")

        import PyPDF2

        # Read PDF
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
        total_pages = len(pdf_reader.pages)

        # Extract metadata
        metadata = {}
        if pdf_reader.metadata:
            metadata = {
                "title": pdf_reader.metadata.get("/Title", ""),
                "author": pdf_reader.metadata.get("/Author", ""),
                "subject": pdf_reader.metadata.get("/Subject", ""),
                "creator": pdf_reader.metadata.get("/Creator", ""),
            }

        # Extract text from all pages
        extracted_text = ""
        sections: list[PDFSection] = []

        if extract_text:
            page_texts = []
            for i, page in enumerate(pdf_reader.pages):
                text = page.extract_text() or ""

                # If no text and OCR is requested
                if not text.strip() and perform_ocr and self._ocr_available:
                    text = await self._ocr_page(pdf_bytes, i)

                page_texts.append(text)
                extracted_text += f"\n--- Page {i+1} ---\n{text}"

            # Try to extract structure
            if extract_structure:
                sections = self._extract_sections(page_texts)

        # Detect language (simple heuristic)
        language = self._detect_language(extracted_text)

        return PDFProcessResult(
            filename=filename,
            total_pages=total_pages,
            extracted_text=extracted_text.strip() if extract_text else None,
            sections=sections,
            metadata=metadata,
            language_detected=language,
            ocr_used=perform_ocr and self._ocr_available
        )

    async def _get_pdf_content(
        self,
        file_path: Optional[str],
        file_url: Optional[str],
        file_content: Optional[bytes]
    ) -> bytes:
        """Get PDF content from various sources"""
        if file_content:
            return file_content

        if file_path:
            path = Path(file_path)
            if not path.exists():
                raise FileNotFoundError(f"PDF file not found: {file_path}")
            return path.read_bytes()

        if file_url:
            async with httpx.AsyncClient(timeout=60) as client:
                response = await client.get(file_url)
                response.raise_for_status()
                return response.content

        raise ValueError("No PDF source provided")

    def _get_filename(self, file_path: Optional[str], file_url: Optional[str]) -> str:
        """Extract filename from path or URL"""
        if file_path:
            return Path(file_path).name
        if file_url:
            return file_url.split("/")[-1].split("?")[0] or "document.pdf"
        return "uploaded.pdf"

    def _extract_sections(self, page_texts: list[str]) -> list[PDFSection]:
        """Try to extract logical sections from PDF"""
        sections: list[PDFSection] = []

        # Common section headers in syllabi
        section_patterns = [
            "course description",
            "learning outcomes",
            "course objectives",
            "assessment",
            "grading",
            "textbooks",
            "references",
            "schedule",
            "prerequisites",
            "teaching methods",
            "course content",
            "topics"
        ]

        current_section = None
        current_content = []
        current_pages = []

        for page_num, page_text in enumerate(page_texts, 1):
            lines = page_text.split("\n")

            for line in lines:
                line_lower = line.lower().strip()

                # Check if this line is a section header
                is_header = False
                for pattern in section_patterns:
                    if pattern in line_lower and len(line_lower) < 100:
                        # Save previous section
                        if current_section and current_content:
                            sections.append(PDFSection(
                                title=current_section,
                                content="\n".join(current_content),
                                page_numbers=list(set(current_pages))
                            ))

                        # Start new section
                        current_section = line.strip()
                        current_content = []
                        current_pages = [page_num]
                        is_header = True
                        break

                if not is_header and current_section:
                    current_content.append(line)
                    if page_num not in current_pages:
                        current_pages.append(page_num)

        # Save last section
        if current_section and current_content:
            sections.append(PDFSection(
                title=current_section,
                content="\n".join(current_content),
                page_numbers=list(set(current_pages))
            ))

        return sections

    async def _ocr_page(self, pdf_bytes: bytes, page_num: int) -> str:
        """Perform OCR on a PDF page"""
        try:
            import pytesseract
            from pdf2image import convert_from_bytes
            from PIL import Image

            # Convert PDF page to image
            images = convert_from_bytes(
                pdf_bytes,
                first_page=page_num + 1,
                last_page=page_num + 1,
                dpi=300
            )

            if not images:
                return ""

            # Perform OCR
            text = pytesseract.image_to_string(images[0], lang='vie+eng')
            return text

        except Exception as e:
            logger.error(f"OCR failed for page {page_num}: {e}")
            return ""

    def _detect_language(self, text: str) -> str:
        """Simple language detection"""
        if not text:
            return "unknown"

        # Vietnamese characters
        vietnamese_chars = set("àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ")
        vietnamese_chars.update(c.upper() for c in vietnamese_chars)

        text_chars = set(text.lower())
        vietnamese_count = len(text_chars & vietnamese_chars)

        if vietnamese_count > 5:
            return "vi"
        return "en"


# Singleton
_processor: Optional[PDFProcessorService] = None


def get_pdf_processor() -> PDFProcessorService:
    global _processor
    if _processor is None:
        _processor = PDFProcessorService()
    return _processor
