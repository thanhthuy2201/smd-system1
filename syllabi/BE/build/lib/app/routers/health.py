"""Health check and database status endpoints"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import get_db, engine
from app.core.config import settings
from app.core.supabase import supabase_db
from app.models import User, Department, Program, Course, AcademicYear

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
async def health_check():
    """Basic health check"""
    return {"status": "healthy", "app": settings.APP_NAME}


@router.get("/db")
async def database_health(db: Session = Depends(get_db)):
    """Check database connection"""
    try:
        # Test SQLAlchemy connection
        result = db.execute(text("SELECT 1"))
        result.fetchone()

        db_type = "sqlite" if "sqlite" in settings.DATABASE_URL else "postgresql"

        return {
            "status": "healthy",
            "database": db_type,
            "connection": "ok"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "unknown",
            "error": str(e)
        }


@router.get("/supabase")
async def supabase_health():
    """Check Supabase connection"""
    if not supabase_db.is_available:
        return {
            "status": "not_configured",
            "message": "Supabase credentials not set"
        }

    try:
        # Try a simple query
        result = supabase_db.client.table("users").select("user_id").limit(1).execute()

        return {
            "status": "healthy",
            "connection": "ok",
            "url": settings.SUPABASE_URL
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }


@router.get("/full")
async def full_health_check(db: Session = Depends(get_db)):
    """Complete health check of all services"""
    health = {
        "app": {"status": "healthy", "name": settings.APP_NAME},
        "database": {"status": "unknown"},
        "supabase": {"status": "unknown"},
        "firebase": {"status": "unknown"}
    }

    # Check database
    try:
        db.execute(text("SELECT 1"))
        health["database"] = {
            "status": "healthy",
            "type": "sqlite" if "sqlite" in settings.DATABASE_URL else "postgresql"
        }
    except Exception as e:
        health["database"] = {"status": "unhealthy", "error": str(e)}

    # Check Supabase
    if settings.SUPABASE_URL:
        if supabase_db.is_available:
            health["supabase"] = {"status": "healthy", "configured": True}
        else:
            health["supabase"] = {"status": "unhealthy", "configured": True}
    else:
        health["supabase"] = {"status": "not_configured"}

    # Check Firebase
    if settings.FIREBASE_PROJECT_ID:
        health["firebase"] = {"status": "configured", "project": settings.FIREBASE_PROJECT_ID}
    else:
        health["firebase"] = {"status": "not_configured"}

    # Overall status
    overall = "healthy"
    if health["database"]["status"] != "healthy":
        overall = "degraded"

    return {"overall": overall, "services": health}


@router.get("/stats")
async def database_stats(db: Session = Depends(get_db)):
    """
    Get database statistics - counts of all main entities.
    Useful for verifying seed data.
    """
    try:
        stats = {
            "users": db.query(User).count(),
            "departments": db.query(Department).count(),
            "programs": db.query(Program).count(),
            "courses": db.query(Course).count(),
            "academic_years": db.query(AcademicYear).count(),
        }

        # Get sample data
        sample_users = db.query(User).limit(5).all()
        sample_departments = db.query(Department).limit(5).all()

        return {
            "status": "ok",
            "counts": stats,
            "sample_users": [
                {"id": u.user_id, "email": u.email, "role": u.role.value, "name": u.full_name}
                for u in sample_users
            ],
            "sample_departments": [
                {"id": d.dept_id, "code": d.dept_code, "name": d.dept_name, "name_vn": d.dept_name_vn}
                for d in sample_departments
            ]
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
