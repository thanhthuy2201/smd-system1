"""API Routers for SMD System"""
from app.routers import (
    auth,
    users,
    departments,
    programs,
    courses,
    syllabi,
    syllabus_versions,
    approvals,
    ai_analysis,
    # FE02-FE07 Academic Manager Module
    academic_years,
    review_schedules,
    evaluation_templates,
    update_requests,
    notifications,
    import_data,
    # Lecturer Module
    lecturer,
    comments,
    messages,
    peer_reviews,
)

__all__ = [
    "auth",
    "users",
    "departments",
    "programs",
    "courses",
    "syllabi",
    "syllabus_versions",
    "approvals",
    "ai_analysis",
    # FE02-FE07
    "academic_years",
    "review_schedules",
    "evaluation_templates",
    "update_requests",
    "notifications",
    "import_data",
    # Lecturer Module
    "lecturer",
    "comments",
    "messages",
    "peer_reviews",
]
