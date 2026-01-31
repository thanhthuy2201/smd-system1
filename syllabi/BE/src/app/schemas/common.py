"""Common schemas for pagination, filtering, and shared types"""
from typing import Generic, TypeVar, List, Optional, Literal
from pydantic import BaseModel, Field
from fastapi import Query
from enum import Enum

T = TypeVar('T')


class SortOrder(str, Enum):
    ASC = "asc"
    DESC = "desc"


class PaginatedResponse(BaseModel, Generic[T]):
    """Standard paginated response with page-based pagination"""
    total: int = Field(..., description="Total number of items")
    page: int = Field(..., description="Current page number (1-indexed)")
    pageSize: int = Field(..., description="Items per page")
    totalPages: int = Field(..., description="Total number of pages")
    items: List[T] = Field(..., description="List of items")

    @property
    def hasNext(self) -> bool:
        """Whether there are more pages"""
        return self.page < self.totalPages

    @property
    def hasPrev(self) -> bool:
        """Whether there are previous pages"""
        return self.page > 1


class PaginationParams:
    """
    Standard pagination parameters.

    Usage:
        @router.get("/items")
        def list_items(pagination: PaginationParams = Depends()):
            skip = (pagination.page - 1) * pagination.pageSize
            ...
    """
    def __init__(
        self,
        page: int = Query(1, ge=1, description="Page number (1-indexed)"),
        pageSize: int = Query(10, ge=1, le=100, description="Items per page"),
    ):
        self.page = page
        self.pageSize = pageSize

    @property
    def skip(self) -> int:
        return (self.page - 1) * self.pageSize

    def get_total_pages(self, total: int) -> int:
        if self.pageSize == 0:
            return 1
        return (total + self.pageSize - 1) // self.pageSize


class SortParams:
    """
    Standard sorting parameters.

    Usage:
        @router.get("/items")
        def list_items(sort: SortParams = Depends()):
            order = desc(getattr(Model, sort.sortBy)) if sort.sortOrder == "desc" else asc(...)
            ...
    """
    def __init__(
        self,
        sortBy: Optional[str] = Query(None, description="Field to sort by"),
        sortOrder: SortOrder = Query(SortOrder.DESC, description="Sort order: asc or desc"),
    ):
        self.sortBy = sortBy
        self.sortOrder = sortOrder


class SearchParams:
    """
    Standard search parameter.

    Usage:
        @router.get("/items")
        def list_items(search: SearchParams = Depends()):
            if search.q:
                query = query.filter(Model.name.ilike(f"%{search.q}%"))
            ...
    """
    def __init__(
        self,
        search: Optional[str] = Query(None, description="Search keyword"),
    ):
        self.q = search


class BaseListParams:
    """
    Combined base parameters for list endpoints.
    Includes pagination, sorting, and search.

    Usage:
        @router.get("/items")
        def list_items(params: BaseListParams = Depends()):
            skip = params.skip
            if params.search:
                query = query.filter(...)
            ...
    """
    def __init__(
        self,
        page: int = Query(1, ge=1, description="Page number (1-indexed)"),
        pageSize: int = Query(10, ge=1, le=100, description="Items per page"),
        search: Optional[str] = Query(None, description="Search keyword"),
        sortBy: Optional[str] = Query(None, description="Field to sort by"),
        sortOrder: SortOrder = Query(SortOrder.DESC, description="Sort order: asc or desc"),
    ):
        self.page = page
        self.pageSize = pageSize
        self.search = search
        self.sortBy = sortBy
        self.sortOrder = sortOrder

    @property
    def skip(self) -> int:
        return (self.page - 1) * self.pageSize

    def get_total_pages(self, total: int) -> int:
        if self.pageSize == 0:
            return 1
        return (total + self.pageSize - 1) // self.pageSize


def build_paginated_response(
    items: list,
    total: int,
    page: int,
    pageSize: int
) -> dict:
    """
    Build a standard paginated response dict.

    Usage:
        return build_paginated_response(
            items=users,
            total=total,
            page=params.page,
            pageSize=params.pageSize
        )
    """
    total_pages = (total + pageSize - 1) // pageSize if pageSize > 0 else 1
    return {
        "total": total,
        "page": page,
        "pageSize": pageSize,
        "totalPages": total_pages,
        "items": items
    }
