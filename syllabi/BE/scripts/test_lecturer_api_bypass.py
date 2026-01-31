#!/usr/bin/env python3
"""
Comprehensive API Test Script for Lecturer Module
Tests all endpoints with real data, BYPASSING authentication using TestClient.

This script creates a test FastAPI app that overrides authentication
to use a mock lecturer user.

Usage:
    cd /Users/thaopv/PycharmProjects/fastapi
    source venv/bin/activate
    cd src
    python ../scripts/test_lecturer_api_bypass.py
"""

import sys
import os
import logging

# Suppress SQLAlchemy verbose logging BEFORE importing anything else
logging.basicConfig(level=logging.WARNING)
for logger_name in ['sqlalchemy', 'sqlalchemy.engine', 'sqlalchemy.engine.Engine',
                    'sqlalchemy.pool', 'sqlalchemy.dialects', 'sqlalchemy.orm']:
    logging.getLogger(logger_name).setLevel(logging.ERROR)
    logging.getLogger(logger_name).propagate = False

# Also set the root logger for sqlalchemy
sql_logger = logging.getLogger('sqlalchemy.engine.Engine')
sql_logger.handlers = []
sql_logger.addHandler(logging.NullHandler())

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

# Override DEBUG setting to disable SQL echo
os.environ['DEBUG'] = 'false'

from datetime import datetime
from typing import Optional
import json

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

# Import app and dependencies
from app.main import app
from app.core.database import get_db, Base, engine
from app.core.security import get_current_user
from app.models import User, UserRole, Department, Program, Course

# Create tables
Base.metadata.create_all(bind=engine)

# ============================================================
# MOCK USER SETUP
# ============================================================

# Create or get test user
def get_or_create_test_user(db: Session, role: UserRole = UserRole.LECTURER) -> User:
    """Get or create a test user with specified role"""
    if role == UserRole.ADMIN:
        test_email = "test.admin@ut.edu.vn"
        username = "test_admin"
        first_name = "Test"
        last_name = "Admin"
        firebase_uid = "test_firebase_admin_uid"
    else:
        test_email = "test.lecturer@ut.edu.vn"
        username = "test_lecturer"
        first_name = "Test"
        last_name = "Lecturer"
        firebase_uid = "test_firebase_uid_123"

    user = db.query(User).filter(User.email == test_email).first()
    if not user:
        # First, ensure we have a department
        dept = db.query(Department).first()
        if not dept:
            dept = Department(
                dept_code="TEST_DEPT",
                dept_name="Test Department",
                description="Test department for API testing"
            )
            db.add(dept)
            db.commit()
            db.refresh(dept)

        user = User(
            username=username,
            email=test_email,
            password_hash="$2b$12$test_hash_not_used_for_firebase_auth",
            first_name=first_name,
            last_name=last_name,
            role=role,
            department_id=dept.dept_id,
            is_active=True,
            firebase_uid=firebase_uid
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"✅ Created test user: {user.email} (ID: {user.user_id}, Role: {role.value})")
    else:
        print(f"✅ Using existing test user: {user.email} (ID: {user.user_id}, Role: {user.role.value})")

    return user


# Mock authentication dependency
class MockAuth:
    """Holds the current mock user"""
    user: Optional[User] = None
    admin_user: Optional[User] = None
    lecturer_user: Optional[User] = None

mock_auth = MockAuth()


def override_get_current_user():
    """Override authentication to return mock user"""
    return mock_auth.user


def set_current_user(user: User):
    """Set the current mock user"""
    mock_auth.user = user


def switch_to_admin():
    """Switch to admin user"""
    if mock_auth.admin_user:
        mock_auth.user = mock_auth.admin_user
        print(f"🔄 Switched to admin: {mock_auth.user.email}")


def switch_to_lecturer():
    """Switch to lecturer user"""
    if mock_auth.lecturer_user:
        mock_auth.user = mock_auth.lecturer_user
        print(f"🔄 Switched to lecturer: {mock_auth.user.email}")


# For backwards compatibility
test_user = None  # Will be set in setup

# Apply override
app.dependency_overrides[get_current_user] = override_get_current_user

# Create test client
client = TestClient(app)

# ============================================================
# TEST DATA STORAGE
# ============================================================

created_ids = {
    "user_id": None,
    "department_id": None,
    "program_id": None,
    "course_id": None,
    "syllabus_id": None,
    "clo_ids": [],
    "content_ids": [],
    "assessment_ids": [],
    "reference_ids": [],
    "comment_ids": [],
    "message_ids": [],
    "plo_ids": [],
    "update_request_id": None,
}

test_results = []


def log_result(test_name: str, success: bool, details: str = "", response=None):
    """Log test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    result = {
        "test": test_name,
        "success": success,
        "details": details,
        "status_code": response.status_code if response else None
    }
    test_results.append(result)

    print(f"\n{status}: {test_name}")
    if details:
        print(f"   Details: {details}")
    if response and not success:
        try:
            print(f"   Response: {response.json()}")
        except:
            print(f"   Response: {response.text[:500]}")


# ============================================================
# SETUP: Create prerequisite data
# ============================================================

def setup_test_data():
    """Create prerequisite data for tests"""
    global test_user

    print("\n" + "="*60)
    print("SETUP: Creating prerequisite test data")
    print("="*60)

    # Get DB session and create users
    db = next(get_db())

    # Create admin user first for setup tasks
    admin_user = get_or_create_test_user(db, UserRole.ADMIN)
    mock_auth.admin_user = admin_user
    mock_auth.user = admin_user  # Use admin for setup
    test_user = admin_user

    # Create lecturer user for later tests
    lecturer_user = get_or_create_test_user(db, UserRole.LECTURER)
    mock_auth.lecturer_user = lecturer_user
    created_ids["user_id"] = lecturer_user.user_id
    created_ids["department_id"] = lecturer_user.department_id

    # 1. Create Program
    print("\n--- Creating Program ---")
    program_data = {
        "program_code": f"TEST_BSCS_{datetime.now().strftime('%H%M%S')}",
        "program_name": "Test Bachelor of Science in Computer Science",
        "degree_type": "Bachelor",
        "duration_years": 4,
        "total_credits": 140,
        "department_id": created_ids["department_id"],
        "description": "Test program for API testing"
    }
    response = client.post("/api/v1/programs", json=program_data)
    if response.status_code in [200, 201]:
        created_ids["program_id"] = response.json().get("program_id")
        log_result("Create Program", True, f"ID: {created_ids['program_id']}", response)
    else:
        log_result("Create Program", False, "", response)
        # Try to get existing
        response = client.get("/api/v1/programs", params={"search": "TEST_BSCS"})
        if response.status_code == 200:
            items = response.json().get("items", [])
            if items:
                created_ids["program_id"] = items[0].get("program_id")
                log_result("Create Program", True, f"Using existing: {created_ids['program_id']}")

    # 2. Create Course
    print("\n--- Creating Course ---")
    course_data = {
        "course_code": f"TEST_CS101_{datetime.now().strftime('%H%M%S')}",
        "course_name": "Test Introduction to Computer Science",
        "department_id": created_ids["department_id"],
        "program_id": created_ids["program_id"],
        "description": "Test course for API testing"
    }
    response = client.post("/api/v1/courses", json=course_data)
    if response.status_code in [200, 201]:
        created_ids["course_id"] = response.json().get("course_id")
        log_result("Create Course", True, f"ID: {created_ids['course_id']}", response)
    else:
        log_result("Create Course", False, "", response)
        # Try to get existing
        response = client.get("/api/v1/courses", params={"search": "TEST_CS101"})
        if response.status_code == 200:
            items = response.json().get("items", [])
            if items:
                created_ids["course_id"] = items[0].get("course_id")
                log_result("Create Course", True, f"Using existing: {created_ids['course_id']}")

    # Switch back to lecturer user for the actual tests
    switch_to_lecturer()
    test_user = mock_auth.user

    db.close()
    return all([created_ids["department_id"], created_ids["program_id"], created_ids["course_id"]])


# ============================================================
# TEST: PLO Management
# ============================================================

def test_plo_management():
    """Test PLO CRUD operations"""
    print("\n" + "="*60)
    print("TEST: PLO Management")
    print("="*60)

    program_id = created_ids["program_id"]
    if not program_id:
        log_result("PLO Tests", False, "No program_id available")
        return

    # Switch to admin for PLO creation (requires admin/HoD/Academic Affairs)
    switch_to_admin()

    # 1. Create PLOs
    print("\n--- Creating PLOs ---")
    plos_data = [
        {"code": "PLO1", "description": "Apply fundamental programming concepts and algorithms", "category": "Knowledge", "display_order": 1},
        {"code": "PLO2", "description": "Design and implement software solutions", "category": "Skills", "display_order": 2},
        {"code": "PLO3", "description": "Work effectively in teams and communicate technical ideas", "category": "Attitudes", "display_order": 3},
    ]

    for plo in plos_data:
        response = client.post(f"/api/v1/programs/{program_id}/plos", json=plo)
        if response.status_code in [200, 201]:
            plo_id = response.json().get("plo_id")
            created_ids["plo_ids"].append(plo_id)
            log_result(f"Create PLO {plo['code']}", True, f"ID: {plo_id}", response)
        elif response.status_code == 400:
            log_result(f"Create PLO {plo['code']}", True, "PLO already exists", response)
        else:
            log_result(f"Create PLO {plo['code']}", False, "", response)

    # Switch back to lecturer
    switch_to_lecturer()

    # 2. Get all PLOs
    print("\n--- Get All PLOs ---")
    response = client.get(f"/api/v1/programs/{program_id}/plos")
    if response.status_code == 200:
        data = response.json()
        log_result("Get All PLOs", True, f"Found {data.get('total', 0)} PLOs", response)
        if not created_ids["plo_ids"]:
            created_ids["plo_ids"] = [p["plo_id"] for p in data.get("items", [])]
    else:
        log_result("Get All PLOs", False, "", response)

    # 3. Get PLOs with filter
    print("\n--- Get PLOs with Filter ---")
    response = client.get(f"/api/v1/programs/{program_id}/plos", params={"category": "Knowledge"})
    if response.status_code == 200:
        log_result("Get PLOs by Category", True, f"Found {response.json().get('total', 0)} PLOs", response)
    else:
        log_result("Get PLOs by Category", False, "", response)

    # 4. Update PLO (requires admin)
    if created_ids["plo_ids"]:
        switch_to_admin()
        print("\n--- Update PLO ---")
        plo_id = created_ids["plo_ids"][0]
        update_data = {"description": "Updated: Apply programming concepts, algorithms, and data structures"}
        response = client.put(f"/api/v1/programs/{program_id}/plos/{plo_id}", json=update_data)
        if response.status_code == 200:
            log_result("Update PLO", True, f"Updated PLO {plo_id}", response)
        else:
            log_result("Update PLO", False, "", response)
        switch_to_lecturer()


# ============================================================
# TEST: Lecturer Dashboard & Courses
# ============================================================

def test_lecturer_dashboard():
    """Test lecturer dashboard and courses endpoints"""
    print("\n" + "="*60)
    print("TEST: Lecturer Dashboard & Courses")
    print("="*60)

    # 1. Get Dashboard
    print("\n--- Get Lecturer Dashboard ---")
    response = client.get("/api/v1/lecturer/dashboard")
    if response.status_code == 200:
        data = response.json()
        log_result("Get Dashboard", True, f"Courses: {data.get('total_courses', 0)}, Drafts: {data.get('draft_syllabi', 0)}", response)
    else:
        log_result("Get Dashboard", False, "", response)

    # 2. Get Courses
    print("\n--- Get Lecturer Courses ---")
    response = client.get("/api/v1/lecturer/courses")
    if response.status_code == 200:
        courses = response.json()
        log_result("Get Courses", True, f"Found {len(courses)} courses", response)
    else:
        log_result("Get Courses", False, "", response)

    # 3. Get Review Schedules
    print("\n--- Get Review Schedules ---")
    response = client.get("/api/v1/lecturer/review-schedules")
    if response.status_code == 200:
        log_result("Get Review Schedules", True, f"Found {len(response.json())} schedules", response)
    else:
        log_result("Get Review Schedules", False, "", response)

    # 4. Get Deadlines
    print("\n--- Get Deadlines ---")
    response = client.get("/api/v1/lecturer/deadlines")
    if response.status_code == 200:
        log_result("Get Deadlines", True, f"Found {len(response.json())} deadlines", response)
    else:
        log_result("Get Deadlines", False, "", response)

    # 5. Get Submissions
    print("\n--- Get Submissions ---")
    response = client.get("/api/v1/lecturer/submissions")
    if response.status_code == 200:
        log_result("Get Submissions", True, f"Found {len(response.json())} submissions", response)
    else:
        log_result("Get Submissions", False, "", response)


# ============================================================
# TEST: Syllabus CRUD with Nested Structure
# ============================================================

def test_syllabus_crud():
    """Test syllabus creation with nested structure"""
    print("\n" + "="*60)
    print("TEST: Syllabus CRUD")
    print("="*60)

    course_id = created_ids["course_id"]
    if not course_id:
        log_result("Syllabus Tests", False, "No course_id available")
        return

    # 1. Create Syllabus with nested structure
    print("\n--- Create Syllabus (Nested Structure) ---")
    syllabus_data = {
        "course_id": course_id,
        "academic_year": "2024-2025",
        "semester": "Fall",
        "credits": 3,
        "total_hours": 45,
        "description": "This course provides a comprehensive introduction to computer science fundamentals including programming, algorithms, and problem-solving techniques. Students will learn to think computationally and develop practical coding skills.",
        "prerequisites": "None",
        "clos": [
            {"code": "CLO1", "description": "Understand fundamental programming concepts and syntax", "bloom_level": "Understand", "mapped_plos": ["PLO1"]},
            {"code": "CLO2", "description": "Apply programming techniques to solve computational problems", "bloom_level": "Apply", "mapped_plos": ["PLO1", "PLO2"]},
            {"code": "CLO3", "description": "Analyze algorithm efficiency and select appropriate solutions", "bloom_level": "Analyze", "mapped_plos": ["PLO2"]},
        ],
        "contents": [
            {"week_number": 1, "title": "Introduction to Programming", "description": "Overview of programming concepts", "lecture_hours": 3, "lab_hours": 0, "teaching_methods": ["Lecture", "Discussion"], "related_clos": ["CLO1"]},
            {"week_number": 2, "title": "Variables and Data Types", "description": "Understanding data types and variables", "lecture_hours": 2, "lab_hours": 2, "teaching_methods": ["Lecture", "Lab"], "related_clos": ["CLO1", "CLO2"]},
            {"week_number": 3, "title": "Control Structures", "description": "Conditionals and loops", "lecture_hours": 2, "lab_hours": 2, "teaching_methods": ["Lecture", "Lab"], "related_clos": ["CLO2"]},
        ],
        "assessments": [
            {"assessment_type": "Quiz", "name": "Quiz 1", "description": "Quiz on basics", "weight": 10, "related_clos": ["CLO1"]},
            {"assessment_type": "Assignment", "name": "Assignment 1", "description": "Programming assignment", "weight": 20, "related_clos": ["CLO1", "CLO2"]},
            {"assessment_type": "Midterm", "name": "Midterm Exam", "description": "Written exam", "weight": 30, "related_clos": ["CLO1", "CLO2", "CLO3"]},
            {"assessment_type": "Final", "name": "Final Exam", "description": "Comprehensive final", "weight": 40, "related_clos": ["CLO1", "CLO2", "CLO3"]},
        ],
        "references": [
            {"reference_type": "Required", "title": "Introduction to Computing Using Python", "authors": "Ljubomir Perkovic", "publisher": "Wiley", "year": 2022, "isbn": "978-1118890943"},
            {"reference_type": "Recommended", "title": "Think Python", "authors": "Allen B. Downey", "publisher": "O'Reilly", "year": 2021},
        ]
    }

    response = client.post("/api/v1/lecturer/syllabi", json=syllabus_data)
    if response.status_code in [200, 201]:
        created_ids["syllabus_id"] = response.json().get("syllabus_id")
        log_result("Create Syllabus", True, f"ID: {created_ids['syllabus_id']}", response)
    else:
        log_result("Create Syllabus", False, "", response)
        return

    syllabus_id = created_ids["syllabus_id"]

    # 2. Get My Syllabi
    print("\n--- Get My Syllabi ---")
    response = client.get("/api/v1/lecturer/syllabi")
    if response.status_code == 200:
        log_result("Get My Syllabi", True, f"Found {len(response.json())} syllabi", response)
    else:
        log_result("Get My Syllabi", False, "", response)

    # 3. Get Syllabi by Status
    print("\n--- Get Syllabi by Status (Draft) ---")
    response = client.get("/api/v1/lecturer/syllabi", params={"status": "Draft"})
    if response.status_code == 200:
        log_result("Get Draft Syllabi", True, f"Found {len(response.json())} drafts", response)
    else:
        log_result("Get Draft Syllabi", False, "", response)

    # 4. Get Syllabus Preview
    print("\n--- Get Syllabus Preview ---")
    response = client.get(f"/api/v1/lecturer/syllabi/{syllabus_id}/preview")
    if response.status_code == 200:
        data = response.json()
        log_result("Get Preview", True, f"Course: {data.get('course', {}).get('name')}", response)
    else:
        log_result("Get Preview", False, "", response)

    # 5. Save Draft
    print("\n--- Save Draft ---")
    draft_data = {"description": "Updated description: Comprehensive introduction course..."}
    response = client.put(f"/api/v1/lecturer/syllabi/{syllabus_id}/draft", json=draft_data)
    if response.status_code == 200:
        log_result("Save Draft", True, "", response)
    else:
        log_result("Save Draft", False, "", response)


# ============================================================
# TEST: CLO Management
# ============================================================

def test_clo_management():
    """Test CLO CRUD operations"""
    print("\n" + "="*60)
    print("TEST: CLO Management")
    print("="*60)

    syllabus_id = created_ids["syllabus_id"]
    if not syllabus_id:
        log_result("CLO Tests", False, "No syllabus_id available")
        return

    # 1. Add CLO
    print("\n--- Add CLO ---")
    clo_data = {
        "code": "CLO4",
        "description": "Design and implement complete software solutions following best practices",
        "bloom_level": "Create",
        "mapped_plos": ["PLO2", "PLO3"]
    }
    response = client.post(f"/api/v1/lecturer/syllabi/{syllabus_id}/clos", json=clo_data)
    if response.status_code in [200, 201]:
        clo_id = response.json().get("clo_id")
        created_ids["clo_ids"].append(clo_id)
        log_result("Add CLO", True, f"ID: {clo_id}", response)
    else:
        log_result("Add CLO", False, "", response)

    # 2. Update CLO
    if created_ids["clo_ids"]:
        print("\n--- Update CLO ---")
        clo_id = created_ids["clo_ids"][0]
        update_data = {"description": "Updated: Design and implement comprehensive software solutions"}
        response = client.put(f"/api/v1/lecturer/syllabi/{syllabus_id}/clos/{clo_id}", json=update_data)
        if response.status_code == 200:
            log_result("Update CLO", True, "", response)
        else:
            log_result("Update CLO", False, "", response)


# ============================================================
# TEST: Content Management
# ============================================================

def test_content_management():
    """Test content CRUD operations"""
    print("\n" + "="*60)
    print("TEST: Content Management")
    print("="*60)

    syllabus_id = created_ids["syllabus_id"]
    if not syllabus_id:
        log_result("Content Tests", False, "No syllabus_id available")
        return

    # 1. Add Content
    print("\n--- Add Content ---")
    content_data = {
        "week_number": 4,
        "title": "Functions and Modules",
        "description": "Creating and using functions",
        "lecture_hours": 2,
        "lab_hours": 2,
        "teaching_methods": ["Lecture", "Lab"],
        "related_clos": ["CLO2", "CLO3"]
    }
    response = client.post(f"/api/v1/lecturer/syllabi/{syllabus_id}/content", json=content_data)
    if response.status_code in [200, 201]:
        content_id = response.json().get("content_id")
        created_ids["content_ids"].append(content_id)
        log_result("Add Content", True, f"ID: {content_id}", response)
    else:
        log_result("Add Content", False, "", response)

    # 2. Update Content
    if created_ids["content_ids"]:
        print("\n--- Update Content ---")
        content_id = created_ids["content_ids"][0]
        update_data = {"title": "Functions, Modules, and Code Organization", "lecture_hours": 3}
        response = client.put(f"/api/v1/lecturer/syllabi/{syllabus_id}/content/{content_id}", json=update_data)
        if response.status_code == 200:
            log_result("Update Content", True, "", response)
        else:
            log_result("Update Content", False, "", response)


# ============================================================
# TEST: Assessment Management
# ============================================================

def test_assessment_management():
    """Test assessment CRUD operations"""
    print("\n" + "="*60)
    print("TEST: Assessment Management")
    print("="*60)

    syllabus_id = created_ids["syllabus_id"]
    if not syllabus_id:
        log_result("Assessment Tests", False, "No syllabus_id available")
        return

    # 1. Add Assessment
    print("\n--- Add Assessment ---")
    assessment_data = {
        "assessment_type": "Project",
        "name": "Mini Project",
        "description": "Small programming project",
        "weight": 0,
        "related_clos": ["CLO2", "CLO3"]
    }
    response = client.post(f"/api/v1/lecturer/syllabi/{syllabus_id}/assessments", json=assessment_data)
    if response.status_code in [200, 201]:
        assessment_id = response.json().get("assessment_id")
        created_ids["assessment_ids"].append(assessment_id)
        log_result("Add Assessment", True, f"ID: {assessment_id}", response)
    else:
        log_result("Add Assessment", False, "", response)

    # 2. Update Assessment
    if created_ids["assessment_ids"]:
        print("\n--- Update Assessment ---")
        assessment_id = created_ids["assessment_ids"][0]
        update_data = {"name": "Updated Mini Project"}
        response = client.put(f"/api/v1/lecturer/syllabi/{syllabus_id}/assessments/{assessment_id}", json=update_data)
        if response.status_code == 200:
            log_result("Update Assessment", True, "", response)
        else:
            log_result("Update Assessment", False, "", response)


# ============================================================
# TEST: Reference Management
# ============================================================

def test_reference_management():
    """Test reference CRUD operations"""
    print("\n" + "="*60)
    print("TEST: Reference Management")
    print("="*60)

    syllabus_id = created_ids["syllabus_id"]
    if not syllabus_id:
        log_result("Reference Tests", False, "No syllabus_id available")
        return

    # 1. Add Reference
    print("\n--- Add Reference ---")
    reference_data = {
        "reference_type": "Online Resource",
        "title": "Python Documentation",
        "url": "https://docs.python.org/3/"
    }
    response = client.post(f"/api/v1/lecturer/syllabi/{syllabus_id}/references", json=reference_data)
    if response.status_code in [200, 201]:
        reference_id = response.json().get("reference_id")
        created_ids["reference_ids"].append(reference_id)
        log_result("Add Reference", True, f"ID: {reference_id}", response)
    else:
        log_result("Add Reference", False, "", response)

    # 2. Update Reference
    if created_ids["reference_ids"]:
        print("\n--- Update Reference ---")
        reference_id = created_ids["reference_ids"][0]
        update_data = {"title": "Official Python Documentation"}
        response = client.put(f"/api/v1/lecturer/syllabi/{syllabus_id}/references/{reference_id}", json=update_data)
        if response.status_code == 200:
            log_result("Update Reference", True, "", response)
        else:
            log_result("Update Reference", False, "", response)


# ============================================================
# TEST: Validation & Submission
# ============================================================

def test_validation_submission():
    """Test validation and submission workflow"""
    print("\n" + "="*60)
    print("TEST: Validation & Submission")
    print("="*60)

    syllabus_id = created_ids["syllabus_id"]
    if not syllabus_id:
        log_result("Validation Tests", False, "No syllabus_id available")
        return

    # 1. Validate Syllabus
    print("\n--- Validate Syllabus ---")
    response = client.post(f"/api/v1/lecturer/syllabi/{syllabus_id}/validate")
    if response.status_code == 200:
        data = response.json()
        is_valid = data.get("is_valid", False)
        errors = data.get("errors", [])
        warnings = data.get("warnings", [])
        log_result("Validate Syllabus", True, f"Valid: {is_valid}, Errors: {len(errors)}, Warnings: {len(warnings)}", response)
        if errors:
            print(f"   Validation Errors: {[e.get('message') for e in errors]}")
    else:
        log_result("Validate Syllabus", False, "", response)

    # 2. Submit for Review
    print("\n--- Submit for Review ---")
    submit_data = {"notes": "Please review this syllabus.", "confirm": True}
    response = client.post(f"/api/v1/lecturer/syllabi/{syllabus_id}/submit", json=submit_data)
    if response.status_code == 200:
        log_result("Submit for Review", True, "", response)
    else:
        log_result("Submit for Review", False, "May have validation errors", response)

    # 3. Get Submission Status
    print("\n--- Get Submission Status ---")
    response = client.get(f"/api/v1/lecturer/syllabi/{syllabus_id}/submission-status")
    if response.status_code == 200:
        data = response.json()
        log_result("Get Submission Status", True, f"Status: {data.get('status')}", response)
    else:
        log_result("Get Submission Status", False, "", response)

    # 4. Get Approval Timeline
    print("\n--- Get Approval Timeline ---")
    response = client.get(f"/api/v1/lecturer/syllabi/{syllabus_id}/approval-timeline")
    if response.status_code == 200:
        data = response.json()
        log_result("Get Approval Timeline", True, f"Current: {data.get('current_stage')}, Next: {data.get('next_stage')}", response)
    else:
        log_result("Get Approval Timeline", False, "", response)

    # 5. Withdraw (if submitted)
    print("\n--- Withdraw Submission ---")
    response = client.post(f"/api/v1/lecturer/syllabi/{syllabus_id}/withdraw")
    if response.status_code == 200:
        log_result("Withdraw Submission", True, "", response)
    else:
        log_result("Withdraw Submission", False, "May not be in pending state", response)


# ============================================================
# TEST: Comments/Feedback System
# ============================================================

def test_comments_system():
    """Test comment/feedback operations"""
    print("\n" + "="*60)
    print("TEST: Comments/Feedback System")
    print("="*60)

    syllabus_id = created_ids["syllabus_id"]
    if not syllabus_id:
        log_result("Comment Tests", False, "No syllabus_id available")
        return

    # 1. Add Comment
    print("\n--- Add Comment ---")
    comment_data = {
        "comment_type": "Suggestion",
        "section_reference": "CLO Section",
        "content": "Consider adding more CLOs related to soft skills.",
        "priority": "Medium"
    }
    response = client.post(f"/api/v1/syllabi/{syllabus_id}/comments", json=comment_data)
    if response.status_code in [200, 201]:
        comment_id = response.json().get("comment_id")
        created_ids["comment_ids"].append(comment_id)
        log_result("Add Comment", True, f"ID: {comment_id}", response)
    else:
        log_result("Add Comment", False, "", response)

    # 2. Get Comments
    print("\n--- Get Comments ---")
    response = client.get(f"/api/v1/syllabi/{syllabus_id}/comments")
    if response.status_code == 200:
        log_result("Get Comments", True, f"Found {len(response.json())} comments", response)
    else:
        log_result("Get Comments", False, "", response)

    # 3. Reply to Comment
    if created_ids["comment_ids"]:
        print("\n--- Reply to Comment ---")
        comment_id = created_ids["comment_ids"][0]
        reply_data = {"content": "Thank you for the suggestion!"}
        response = client.post(f"/api/v1/syllabi/{syllabus_id}/comments/{comment_id}/reply", json=reply_data)
        if response.status_code in [200, 201]:
            log_result("Reply to Comment", True, "", response)
        else:
            log_result("Reply to Comment", False, "", response)

    # 4. Resolve Comment
    if created_ids["comment_ids"]:
        print("\n--- Resolve Comment ---")
        comment_id = created_ids["comment_ids"][0]
        response = client.put(f"/api/v1/syllabi/{syllabus_id}/comments/{comment_id}/resolve")
        if response.status_code == 200:
            log_result("Resolve Comment", True, "", response)
        else:
            log_result("Resolve Comment", False, "", response)

    # 5. Get Feedback
    print("\n--- Get Feedback ---")
    response = client.get(f"/api/v1/lecturer/syllabi/{syllabus_id}/feedback")
    if response.status_code == 200:
        log_result("Get Feedback", True, f"Found {len(response.json())} items", response)
    else:
        log_result("Get Feedback", False, "", response)


# ============================================================
# TEST: Messaging System
# ============================================================

def test_messaging_system():
    """Test internal messaging operations"""
    print("\n" + "="*60)
    print("TEST: Messaging System")
    print("="*60)

    # 1. Get Contacts (Users)
    print("\n--- Get Contacts (Users) ---")
    response = client.get("/api/v1/users/contacts")
    if response.status_code == 200:
        log_result("Get Contacts (Users)", True, f"Found {len(response.json())} contacts", response)
    else:
        log_result("Get Contacts (Users)", False, "", response)

    # 2. Get Contacts (Messages)
    print("\n--- Get Contacts (Messages) ---")
    response = client.get("/api/v1/messages/contacts")
    if response.status_code == 200:
        log_result("Get Contacts (Messages)", True, f"Found {len(response.json())} contacts", response)
    else:
        log_result("Get Contacts (Messages)", False, "", response)

    # 3. Get Inbox
    print("\n--- Get Inbox ---")
    response = client.get("/api/v1/messages/inbox")
    if response.status_code == 200:
        log_result("Get Inbox", True, f"Found {len(response.json())} messages", response)
    else:
        log_result("Get Inbox", False, "", response)

    # 4. Get Conversations
    print("\n--- Get Conversations ---")
    response = client.get("/api/v1/messages/conversations")
    if response.status_code == 200:
        log_result("Get Conversations", True, f"Found {len(response.json())} conversations", response)
    else:
        log_result("Get Conversations", False, "", response)


# ============================================================
# TEST: Peer Reviews
# ============================================================

def test_peer_reviews():
    """Test peer review operations"""
    print("\n" + "="*60)
    print("TEST: Peer Reviews")
    print("="*60)

    # 1. Get Assigned Reviews
    print("\n--- Get Assigned Reviews ---")
    response = client.get("/api/v1/peer-reviews")
    if response.status_code == 200:
        log_result("Get Assigned Reviews", True, f"Found {len(response.json())} reviews", response)
    else:
        log_result("Get Assigned Reviews", False, "", response)

    # 2. Get Evaluation Templates
    print("\n--- Get Evaluation Templates ---")
    response = client.get("/api/v1/evaluation-templates")
    if response.status_code == 200:
        templates = response.json()
        # Handle both list and dict response formats
        if isinstance(templates, list):
            count = len(templates)
        else:
            count = len(templates.get('items', []))
        log_result("Get Templates", True, f"Found {count} templates", response)
    else:
        log_result("Get Templates", False, "", response)


# ============================================================
# TEST: Update Requests
# ============================================================

def test_update_requests():
    """Test update request operations"""
    print("\n" + "="*60)
    print("TEST: Update Requests")
    print("="*60)

    # 1. Get My Update Requests
    print("\n--- Get My Update Requests ---")
    response = client.get("/api/v1/update-requests/my-requests")
    if response.status_code == 200:
        log_result("Get My Requests", True, f"Found {len(response.json())} requests", response)
    else:
        log_result("Get My Requests", False, "", response)

    # 2. List All Update Requests
    print("\n--- List Update Requests ---")
    response = client.get("/api/v1/update-requests")
    if response.status_code == 200:
        log_result("List Update Requests", True, f"Found {len(response.json())} requests", response)
    else:
        log_result("List Update Requests", False, "", response)


# ============================================================
# TEST: Approved Syllabi & Versions
# ============================================================

def test_approved_and_versions():
    """Test approved syllabi and versions"""
    print("\n" + "="*60)
    print("TEST: Approved Syllabi & Versions")
    print("="*60)

    # 1. Get Approved Syllabi
    print("\n--- Get Approved Syllabi ---")
    response = client.get("/api/v1/lecturer/syllabi/approved")
    if response.status_code == 200:
        log_result("Get Approved Syllabi", True, f"Found {len(response.json())} syllabi", response)
    else:
        log_result("Get Approved Syllabi", False, "", response)

    # 2. Get Version History
    syllabus_id = created_ids["syllabus_id"]
    if syllabus_id:
        print("\n--- Get Version History ---")
        response = client.get(f"/api/v1/syllabi/{syllabus_id}/versions")
        if response.status_code == 200:
            data = response.json()
            log_result("Get Versions", True, f"Found {data.get('total', 0)} versions", response)
        else:
            log_result("Get Versions", False, "", response)


# ============================================================
# CLEANUP
# ============================================================

def cleanup_test_data():
    """Clean up created test data"""
    print("\n" + "="*60)
    print("CLEANUP: Removing test data")
    print("="*60)

    syllabus_id = created_ids["syllabus_id"]

    # Delete in reverse order
    if syllabus_id:
        # Comments
        for cid in created_ids["comment_ids"]:
            r = client.delete(f"/api/v1/syllabi/{syllabus_id}/comments/{cid}")
            if r.status_code == 204:
                print(f"   Deleted comment {cid}")

        # Content
        for cid in created_ids["content_ids"]:
            r = client.delete(f"/api/v1/lecturer/syllabi/{syllabus_id}/content/{cid}")
            if r.status_code == 204:
                print(f"   Deleted content {cid}")

        # Assessments
        for aid in created_ids["assessment_ids"]:
            r = client.delete(f"/api/v1/lecturer/syllabi/{syllabus_id}/assessments/{aid}")
            if r.status_code == 204:
                print(f"   Deleted assessment {aid}")

        # References
        for rid in created_ids["reference_ids"]:
            r = client.delete(f"/api/v1/lecturer/syllabi/{syllabus_id}/references/{rid}")
            if r.status_code == 204:
                print(f"   Deleted reference {rid}")

        # CLOs
        for cid in created_ids["clo_ids"]:
            r = client.delete(f"/api/v1/lecturer/syllabi/{syllabus_id}/clos/{cid}")
            if r.status_code == 204:
                print(f"   Deleted CLO {cid}")

    # PLOs
    program_id = created_ids["program_id"]
    if program_id:
        for pid in created_ids["plo_ids"]:
            r = client.delete(f"/api/v1/programs/{program_id}/plos/{pid}")
            if r.status_code == 204:
                print(f"   Deleted PLO {pid}")

    # Syllabus
    if syllabus_id:
        r = client.delete(f"/api/v1/syllabi/{syllabus_id}")
        if r.status_code == 204:
            print(f"   Deleted syllabus {syllabus_id}")

    print("\n   Note: Test user, department, program, and course kept for future tests.")


# ============================================================
# SUMMARY
# ============================================================

def print_summary():
    """Print test summary"""
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)

    passed = sum(1 for r in test_results if r["success"])
    failed = sum(1 for r in test_results if not r["success"])
    total = len(test_results)

    print(f"\nTotal Tests: {total}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"Success Rate: {(passed/total*100) if total > 0 else 0:.1f}%")

    if failed > 0:
        print("\n--- Failed Tests ---")
        for r in test_results:
            if not r["success"]:
                print(f"  - {r['test']}: {r['details']}")

    print("\n" + "="*60)


# ============================================================
# MAIN
# ============================================================

def main():
    print("="*60)
    print("LECTURER MODULE API TEST SUITE (Auth Bypass)")
    print("="*60)
    print(f"Timestamp: {datetime.now().isoformat()}")
    print(f"Database: SQLite (smd.db)")

    # Setup
    if not setup_test_data():
        print("\n❌ Failed to setup test data. Some tests may fail.")

    # Run all tests
    tests = [
        test_plo_management,
        test_lecturer_dashboard,
        test_syllabus_crud,
        test_clo_management,
        test_content_management,
        test_assessment_management,
        test_reference_management,
        test_validation_submission,
        test_comments_system,
        test_messaging_system,
        test_peer_reviews,
        test_update_requests,
        test_approved_and_versions,
    ]

    for test_func in tests:
        try:
            test_func()
        except Exception as e:
            log_result(f"{test_func.__name__}", False, f"Exception: {str(e)[:200]}")

    # Cleanup
    cleanup_test_data()

    # Summary
    print_summary()


if __name__ == "__main__":
    main()
