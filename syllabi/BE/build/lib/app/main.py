"""
Syllabus Management and Digitalization System (SMD) API
University Syllabus Management Platform
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

from app.core.config import settings
from app.core.database import create_tables

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
from app.routers import health

# Configure logging
logging.basicConfig(level=logging.INFO if settings.DEBUG else logging.WARNING)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting SMD API...")
    logger.info(f"Database: {settings.DATABASE_URL[:30]}...")
    logger.info(f"Supabase: {'Configured' if settings.SUPABASE_URL else 'Not configured'}")
    logger.info(f"Firebase: {'Configured' if settings.FIREBASE_PROJECT_ID else 'Not configured'}")

    # Create tables if needed (development)
    if settings.DEBUG:
        try:
            create_tables()
            logger.info("Database tables verified")
        except Exception as e:
            logger.error(f"Failed to create tables: {e}")

    yield

    # Shutdown
    logger.info("Shutting down SMD API...")

app = FastAPI(
    title="Syllabus Management and Digitalization System (SMD)",
    lifespan=lifespan,
    description="""
## SMD API Documentation

The Syllabus Management and Digitalization System (SMD) is an integrated solution
designed to automate the academic syllabus lifecycle.

### API Versioning
- **v1**: `/api/v1/...` - Current stable version
- **legacy**: `/api/...` - Deprecated (for backward compatibility)

### Authentication
All endpoints (except `/api/v1/auth/firebase-config`) require Firebase authentication.

**Send token via one of:**
- `Authorization: Bearer <firebase_token>`
- `X-Firebase-Token: <firebase_token>`
- Cookie: `firebase_auth_token=<firebase_token>`

**Login Flow:**
1. Login via Firebase on frontend
2. Call `POST /api/v1/auth/verify` to get user info and role
3. New users are auto-registered with `Student` role

### Pagination, Filtering & Sorting
All list endpoints support:

**Pagination:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 1 | Page number (1-indexed) |
| `pageSize` | int | 10 | Items per page (max: 100) |

**Search & Filter:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search across multiple fields |
| `{field}` | varies | Filter by specific field (e.g., `role`, `department_id`, `is_active`) |

**Sorting:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sortBy` | string | varies | Field to sort by |
| `sortOrder` | string | desc | Sort order: `asc` or `desc` |

**Example:**
```
GET /api/v1/users?page=1&pageSize=20&search=john&role=Lecturer&sortBy=created_date&sortOrder=desc
```

**Response format:**
```json
{
  "total": 100,
  "page": 1,
  "pageSize": 10,
  "totalPages": 10,
  "items": [...]
}
```

### User Roles
| Role | Description |
|------|-------------|
| **Admin** | System administration and user management |
| **Lecturer** | Create and edit syllabi |
| **HoD** | Head of Department - First-level reviewer |
| **Academic Affairs** | Second-level reviewer for compliance |
| **Principal** | Strategic approver |
| **Student** | View and search syllabi (default role) |

### Features
- **User Management**: Admin CRUD operations for user accounts
- **Department Management**: Manage academic departments
- **Program Management**: Manage academic programs/degrees
- **Course Management**: Manage courses offered by the university
- **Syllabus Management**: Create, edit, and manage syllabi
- **Version Control**: Track syllabus versions and changes
- **Approval Workflow**: Multi-level approval process
    """,
    version="1.0.0",
    contact={
        "name": "SMD Development Team",
        "email": "smd-support@university.edu.vn",
    },
    license_info={
        "name": "MIT License",
    },
    openapi_tags=[
        {
            "name": "Authentication",
            "description": "Login, logout, and token management",
        },
        {
            "name": "Users",
            "description": "User account management (Admin only)",
        },
        {
            "name": "Departments",
            "description": "Academic department management",
        },
        {
            "name": "Programs",
            "description": "Academic program/degree management",
        },
        {
            "name": "Courses",
            "description": "Course management",
        },
        {
            "name": "Syllabi",
            "description": "Syllabus creation, editing, and management",
        },
        {
            "name": "Syllabus Versions",
            "description": "Version control for syllabi",
        },
        {
            "name": "Approvals",
            "description": "Syllabus approval workflow",
        },
        {
            "name": "AI Analysis",
            "description": "AI-powered analysis: CLO-PLO checking, semantic diff, summarization, reference crawler",
        },
        {
            "name": "Academic Years",
            "description": "FE02: Manage academic years, semesters, and submission periods",
        },
        {
            "name": "Review Schedules",
            "description": "FE03: Manage review schedules and reviewer assignments",
        },
        {
            "name": "Evaluation Templates",
            "description": "FE04: Manage evaluation templates and criteria",
        },
        {
            "name": "Update Requests",
            "description": "FE05: Evaluate update requests and make decisions",
        },
        {
            "name": "Notifications",
            "description": "FE06: Manage notifications, templates, and auto-reminders",
        },
        {
            "name": "Data Import",
            "description": "FE07: Import data from files (courses, syllabi, programs, users)",
        },
        {
            "name": "Lecturer",
            "description": "Lecturer module: Dashboard, syllabus creation, CLO management, submission",
        },
        {
            "name": "Syllabus Comments",
            "description": "FE07: Provide feedback and comments on syllabi",
        },
        {
            "name": "Messages",
            "description": "FE08: Internal messaging between users",
        },
        {
            "name": "Peer Reviews",
            "description": "FE06: Peer review and evaluation of syllabi",
        },
        {
            "name": "Health",
            "description": "Health check endpoints for monitoring system status",
        },
    ],
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== API Version 1 ====================
api_v1 = APIRouter(prefix="/api/v1")

# Authentication
api_v1.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# User Management
api_v1.include_router(users.router, prefix="/users", tags=["Users"])

# Core Resources
api_v1.include_router(departments.router, prefix="/departments", tags=["Departments"])
api_v1.include_router(programs.router, prefix="/programs", tags=["Programs"])
api_v1.include_router(courses.router, prefix="/courses", tags=["Courses"])

# Syllabus Management
api_v1.include_router(syllabi.router, prefix="/syllabi", tags=["Syllabi"])
api_v1.include_router(syllabus_versions.router, prefix="/syllabi", tags=["Syllabus Versions"])
api_v1.include_router(approvals.router, tags=["Approvals"])
api_v1.include_router(ai_analysis.router, tags=["AI Analysis"])

# FE02-FE07 Academic Manager Module
api_v1.include_router(academic_years.router, tags=["Academic Years"])
api_v1.include_router(review_schedules.router, tags=["Review Schedules"])
api_v1.include_router(evaluation_templates.router, tags=["Evaluation Templates"])
api_v1.include_router(update_requests.router, tags=["Update Requests"])
api_v1.include_router(notifications.router, tags=["Notifications"])
api_v1.include_router(import_data.router, tags=["Data Import"])

# Lecturer Module
api_v1.include_router(lecturer.router, tags=["Lecturer"])
api_v1.include_router(comments.router, tags=["Syllabus Comments"])
api_v1.include_router(messages.router, tags=["Messages"])
api_v1.include_router(peer_reviews.router, tags=["Peer Reviews"])

# Health Check
api_v1.include_router(health.router, tags=["Health"])

# Mount v1 router
app.include_router(api_v1)


# ==================== Legacy /api routes (backward compatibility) ====================
# These routes will continue to work but are deprecated
# Frontend should migrate to /api/v1/...

api_legacy = APIRouter(prefix="/api", deprecated=True)

api_legacy.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_legacy.include_router(users.router, prefix="/users", tags=["Users"])
api_legacy.include_router(departments.router, prefix="/departments", tags=["Departments"])
api_legacy.include_router(programs.router, prefix="/programs", tags=["Programs"])
api_legacy.include_router(courses.router, prefix="/courses", tags=["Courses"])
api_legacy.include_router(syllabi.router, prefix="/syllabi", tags=["Syllabi"])
api_legacy.include_router(syllabus_versions.router, prefix="/syllabi", tags=["Syllabus Versions"])
api_legacy.include_router(approvals.router, tags=["Approvals"])
api_legacy.include_router(ai_analysis.router, tags=["AI Analysis"])
api_legacy.include_router(academic_years.router, tags=["Academic Years"])
api_legacy.include_router(review_schedules.router, tags=["Review Schedules"])
api_legacy.include_router(evaluation_templates.router, tags=["Evaluation Templates"])
api_legacy.include_router(update_requests.router, tags=["Update Requests"])
api_legacy.include_router(notifications.router, tags=["Notifications"])
api_legacy.include_router(import_data.router, tags=["Data Import"])
api_legacy.include_router(lecturer.router, tags=["Lecturer"])
api_legacy.include_router(comments.router, tags=["Syllabus Comments"])
api_legacy.include_router(messages.router, tags=["Messages"])
api_legacy.include_router(peer_reviews.router, tags=["Peer Reviews"])
api_legacy.include_router(health.router, tags=["Health"])

app.include_router(api_legacy)


# ==================== Root Endpoint ====================
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint - API information"""
    return {
        "message": "Welcome to SMD API",
        "version": "1.0.0",
        "api_versions": {
            "v1": "/api/v1",
            "legacy": "/api (deprecated)"
        },
        "docs": "/docs",
        "redoc": "/redoc",
    }


# ==================== Custom OpenAPI Schema ====================
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
        tags=app.openapi_tags,
    )

    # Add security schemes
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "Firebase JWT",
            "description": "Firebase ID token. Get it from Firebase Auth after login."
        },
        "FirebaseTokenHeader": {
            "type": "apiKey",
            "in": "header",
            "name": "X-Firebase-Token",
            "description": "Firebase ID token via custom header"
        },
        "FirebaseTokenCookie": {
            "type": "apiKey",
            "in": "cookie",
            "name": "firebase_auth_token",
            "description": "Firebase ID token via cookie"
        }
    }

    # Apply security globally (except for specific endpoints)
    openapi_schema["security"] = [
        {"BearerAuth": []},
        {"FirebaseTokenHeader": []},
        {"FirebaseTokenCookie": []}
    ]

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi
