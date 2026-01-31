"""Common schemas"""
from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime


class TaskStatusResponse(BaseModel):
    """Generic task status response"""
    task_id: str
    status: str
    task_type: str
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    processing_time_ms: Optional[int] = None
    progress: Optional[float] = Field(None, ge=0, le=100)
    result: Optional[Any] = None
    error: Optional[str] = None


class HealthCheckResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    services: dict[str, str]


class ErrorResponse(BaseModel):
    """Error response"""
    error: str
    detail: Optional[str] = None
    task_id: Optional[str] = None
