"""File storage service for syllabus documents using Supabase Storage"""
import logging
import os
import uuid
from datetime import datetime
from typing import Optional, Tuple
from pathlib import Path

from app.core.config import settings

logger = logging.getLogger(__name__)

# Storage bucket name
SYLLABUS_BUCKET = "syllabi"


class FileStorageService:
    """
    File storage service supporting multiple backends:
    - Supabase Storage (recommended)
    - Local filesystem (fallback)
    """

    def __init__(self):
        self.supabase_client = None
        self.local_storage_path = None
        self._init_storage()

    def _init_storage(self):
        """Initialize storage backend"""
        # Try Supabase first
        if settings.SUPABASE_URL and settings.SUPABASE_KEY:
            try:
                from supabase import create_client
                self.supabase_client = create_client(
                    settings.SUPABASE_URL,
                    settings.SUPABASE_KEY
                )
                logger.info("Supabase Storage initialized")
                return
            except Exception as e:
                logger.warning(f"Failed to init Supabase Storage: {e}")

        # Fallback to local storage
        self.local_storage_path = Path("uploads/syllabi")
        self.local_storage_path.mkdir(parents=True, exist_ok=True)
        logger.info(f"Using local storage at: {self.local_storage_path}")

    def _generate_file_path(self, original_filename: str, user_id: int) -> str:
        """Generate unique storage path"""
        ext = Path(original_filename).suffix.lower()
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        return f"user_{user_id}/{timestamp}_{unique_id}{ext}"

    async def upload_file(
        self,
        file_content: bytes,
        original_filename: str,
        user_id: int,
        content_type: str = "application/octet-stream"
    ) -> Tuple[str, str]:
        """
        Upload file to storage.

        Args:
            file_content: Raw file bytes
            original_filename: Original filename
            user_id: User who uploaded the file
            content_type: MIME type

        Returns:
            Tuple of (storage_path, public_url or None)
        """
        file_path = self._generate_file_path(original_filename, user_id)

        if self.supabase_client:
            return await self._upload_to_supabase(file_content, file_path, content_type)
        else:
            return await self._upload_to_local(file_content, file_path)

    async def _upload_to_supabase(
        self,
        file_content: bytes,
        file_path: str,
        content_type: str
    ) -> Tuple[str, str]:
        """Upload to Supabase Storage"""
        try:
            # Upload file
            result = self.supabase_client.storage.from_(SYLLABUS_BUCKET).upload(
                path=file_path,
                file=file_content,
                file_options={"content-type": content_type}
            )

            # Get public URL
            public_url = self.supabase_client.storage.from_(SYLLABUS_BUCKET).get_public_url(file_path)

            logger.info(f"Uploaded to Supabase: {file_path}")
            return file_path, public_url

        except Exception as e:
            logger.error(f"Supabase upload failed: {e}")
            # Fallback to local
            return await self._upload_to_local(file_content, file_path)

    async def _upload_to_local(
        self,
        file_content: bytes,
        file_path: str
    ) -> Tuple[str, Optional[str]]:
        """Upload to local filesystem"""
        full_path = self.local_storage_path / file_path
        full_path.parent.mkdir(parents=True, exist_ok=True)

        with open(full_path, 'wb') as f:
            f.write(file_content)

        logger.info(f"Saved to local: {full_path}")
        return file_path, None

    async def download_file(self, file_path: str) -> Optional[bytes]:
        """
        Download file from storage.

        Args:
            file_path: Storage path

        Returns:
            File content bytes or None
        """
        if self.supabase_client:
            return await self._download_from_supabase(file_path)
        else:
            return await self._download_from_local(file_path)

    async def _download_from_supabase(self, file_path: str) -> Optional[bytes]:
        """Download from Supabase Storage"""
        try:
            response = self.supabase_client.storage.from_(SYLLABUS_BUCKET).download(file_path)
            return response
        except Exception as e:
            logger.error(f"Supabase download failed: {e}")
            return None

    async def _download_from_local(self, file_path: str) -> Optional[bytes]:
        """Download from local filesystem"""
        full_path = self.local_storage_path / file_path
        if full_path.exists():
            with open(full_path, 'rb') as f:
                return f.read()
        return None

    async def delete_file(self, file_path: str) -> bool:
        """
        Delete file from storage.

        Args:
            file_path: Storage path

        Returns:
            True if deleted successfully
        """
        if self.supabase_client:
            return await self._delete_from_supabase(file_path)
        else:
            return await self._delete_from_local(file_path)

    async def _delete_from_supabase(self, file_path: str) -> bool:
        """Delete from Supabase Storage"""
        try:
            self.supabase_client.storage.from_(SYLLABUS_BUCKET).remove([file_path])
            logger.info(f"Deleted from Supabase: {file_path}")
            return True
        except Exception as e:
            logger.error(f"Supabase delete failed: {e}")
            return False

    async def _delete_from_local(self, file_path: str) -> bool:
        """Delete from local filesystem"""
        full_path = self.local_storage_path / file_path
        if full_path.exists():
            full_path.unlink()
            logger.info(f"Deleted from local: {full_path}")
            return True
        return False

    def get_public_url(self, file_path: str) -> Optional[str]:
        """Get public URL for a file (Supabase only)"""
        if self.supabase_client:
            return self.supabase_client.storage.from_(SYLLABUS_BUCKET).get_public_url(file_path)
        return None


# Singleton instance
file_storage = FileStorageService()


def get_content_type(filename: str) -> str:
    """Get MIME type from filename"""
    ext = Path(filename).suffix.lower()
    mime_types = {
        '.pdf': 'application/pdf',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.doc': 'application/msword',
        '.txt': 'text/plain',
        '.rtf': 'application/rtf',
    }
    return mime_types.get(ext, 'application/octet-stream')
