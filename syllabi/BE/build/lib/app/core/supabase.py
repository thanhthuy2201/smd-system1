"""Supabase client configuration"""
import logging
from typing import Optional
from functools import lru_cache

from app.core.config import settings

logger = logging.getLogger(__name__)

_supabase_client = None


def get_supabase_client():
    """
    Get Supabase client instance.

    Uses service_role key for full database access.
    """
    global _supabase_client

    if _supabase_client is not None:
        return _supabase_client

    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
        logger.warning("Supabase credentials not configured")
        return None

    try:
        from supabase import create_client, Client

        _supabase_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY
        )
        logger.info("Supabase client initialized successfully")
        return _supabase_client

    except ImportError:
        logger.warning("supabase-py package not installed. Run: pip install supabase")
        return None
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        return None


def get_supabase_anon_client():
    """
    Get Supabase client with anon key.

    Used for operations that should respect RLS policies.
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        return None

    try:
        from supabase import create_client
        return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    except Exception as e:
        logger.error(f"Failed to create anon Supabase client: {e}")
        return None


class SupabaseDB:
    """
    Supabase database helper class.

    Provides convenient methods for CRUD operations using Supabase client.
    This is an alternative to SQLAlchemy for direct Supabase API usage.
    """

    def __init__(self):
        self.client = get_supabase_client()

    @property
    def is_available(self) -> bool:
        return self.client is not None

    # ==================== Generic CRUD ====================

    def select(self, table: str, columns: str = "*", filters: dict = None,
               order_by: str = None, limit: int = None, offset: int = None):
        """
        Select records from a table.

        Args:
            table: Table name
            columns: Columns to select (default: "*")
            filters: Dict of {column: value} for filtering
            order_by: Column to order by (prefix with - for desc)
            limit: Max records to return
            offset: Number of records to skip
        """
        if not self.client:
            return None

        query = self.client.table(table).select(columns)

        if filters:
            for key, value in filters.items():
                if isinstance(value, list):
                    query = query.in_(key, value)
                elif value is None:
                    query = query.is_(key, "null")
                else:
                    query = query.eq(key, value)

        if order_by:
            if order_by.startswith("-"):
                query = query.order(order_by[1:], desc=True)
            else:
                query = query.order(order_by)

        if limit:
            query = query.limit(limit)

        if offset:
            query = query.offset(offset)

        response = query.execute()
        return response.data

    def select_one(self, table: str, columns: str = "*", filters: dict = None):
        """Select a single record."""
        if not self.client:
            return None

        query = self.client.table(table).select(columns)

        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)

        response = query.limit(1).execute()
        return response.data[0] if response.data else None

    def insert(self, table: str, data: dict | list):
        """
        Insert record(s) into a table.

        Args:
            table: Table name
            data: Dict for single record, list of dicts for multiple
        """
        if not self.client:
            return None

        response = self.client.table(table).insert(data).execute()
        return response.data

    def update(self, table: str, data: dict, filters: dict):
        """
        Update records in a table.

        Args:
            table: Table name
            data: Dict of {column: new_value}
            filters: Dict of {column: value} to identify records
        """
        if not self.client:
            return None

        query = self.client.table(table).update(data)

        for key, value in filters.items():
            query = query.eq(key, value)

        response = query.execute()
        return response.data

    def upsert(self, table: str, data: dict | list):
        """
        Insert or update record(s).

        Uses primary key to determine insert vs update.
        """
        if not self.client:
            return None

        response = self.client.table(table).upsert(data).execute()
        return response.data

    def delete(self, table: str, filters: dict):
        """
        Delete records from a table.

        Args:
            table: Table name
            filters: Dict of {column: value} to identify records
        """
        if not self.client:
            return None

        query = self.client.table(table).delete()

        for key, value in filters.items():
            query = query.eq(key, value)

        response = query.execute()
        return response.data

    # ==================== Count ====================

    def count(self, table: str, filters: dict = None) -> int:
        """Count records in a table."""
        if not self.client:
            return 0

        query = self.client.table(table).select("*", count="exact")

        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)

        response = query.execute()
        return response.count or 0

    # ==================== Raw SQL (via RPC) ====================

    def rpc(self, function_name: str, params: dict = None):
        """
        Call a Supabase database function (RPC).

        Create functions in Supabase SQL editor first.
        """
        if not self.client:
            return None

        response = self.client.rpc(function_name, params or {}).execute()
        return response.data

    # ==================== Storage ====================

    def upload_file(self, bucket: str, path: str, file_data: bytes,
                    content_type: str = "application/octet-stream"):
        """Upload a file to Supabase Storage."""
        if not self.client:
            return None

        response = self.client.storage.from_(bucket).upload(
            path, file_data, {"content-type": content_type}
        )
        return response

    def get_file_url(self, bucket: str, path: str, expires_in: int = 3600) -> str:
        """Get a signed URL for a file."""
        if not self.client:
            return None

        response = self.client.storage.from_(bucket).create_signed_url(path, expires_in)
        return response.get("signedURL")

    def delete_file(self, bucket: str, paths: list[str]):
        """Delete file(s) from storage."""
        if not self.client:
            return None

        response = self.client.storage.from_(bucket).remove(paths)
        return response


# Singleton instance
supabase_db = SupabaseDB()
