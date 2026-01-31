#!/usr/bin/env python3
"""
Comprehensive API Test Script for Lecturer Module
Tests all endpoints with real data, bypassing authentication.

Usage:
    python scripts/test_lecturer_api.py [--base-url http://localhost:8000]
"""

import requests
import json
import sys
from datetime import datetime, date
from typing import Optional
import argparse

# Test configuration
BASE_URL = "http://localhost:8000/api/v1"
HEADERS = {"Content-Type": "application/json"}

# Store created IDs for cleanup and chaining
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
    "peer_evaluation_id": None,
}

# Test results tracking
test_results = []


def log_result(test_name: str, success: bool, details: str = "", response: Optional[requests.Response] = None):
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
            print(f"   Response: {response.text[:200]}")


def api_call(method: str, endpoint: str, data: dict = None, params: dict = None, expected_status: list = None):
    """Make API call and return response"""
    url = f"{BASE_URL}{endpoint}"
    expected_status = expected_status or [200, 201]

    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=HEADERS, params=params)
        elif method.upper() == "POST":
            response = requests.post(url, headers=HEADERS, json=data)
        elif method.upper() == "PUT":
            response = requests.put(url, headers=HEADERS, json=data)
        elif method.upper() == "PATCH":
            response = requests.patch(url, headers=HEADERS, json=data)
        elif method.upper() == "DELETE":
            response = requests.delete(url, headers=HEADERS)
        else:
            raise ValueError(f"Unknown method: {method}")

        return response
    except requests.exceptions.ConnectionError:
        print(f"❌ Connection Error: Could not connect to {url}")
        return None


# ============================================================
# SETUP: Create prerequisite data
# ============================================================

def setup_test_data():
    """Create prerequisite data for tests"""
    print("\n" + "="*60)
    print("SETUP: Creating prerequisite test data")
    print("="*60)

    # 1. Create Department
    print("\n--- Creating Department ---")
    dept_data = {
        "dept_code": "TEST_CS",
        "dept_name": "Test Computer Science Department",
        "description": "Test department for API testing"
    }
    response = api_call("POST", "/departments", dept_data)
    if response and response.status_code in [200, 201]:
        created_ids["department_id"] = response.json().get("dept_id")
        log_result("Create Department", True, f"ID: {created_ids['department_id']}", response)
    elif response and response.status_code == 400:
        # Department might already exist, try to get it
        response = api_call("GET", "/departments", params={"search": "TEST_CS"})
        if response and response.status_code == 200:
            items = response.json().get("items", [])
            if items:
                created_ids["department_id"] = items[0].get("dept_id")
                log_result("Create Department", True, f"Using existing ID: {created_ids['department_id']}", response)
    else:
        log_result("Create Department", False, "Failed to create department", response)

    # 2. Create Program
    print("\n--- Creating Program ---")
    program_data = {
        "program_code": "TEST_BSCS",
        "program_name": "Test Bachelor of Science in Computer Science",
        "degree_type": "Bachelor",
        "duration_years": 4,
        "total_credits": 140,
        "department_id": created_ids["department_id"],
        "description": "Test program for API testing"
    }
    response = api_call("POST", "/programs", program_data)
    if response and response.status_code in [200, 201]:
        created_ids["program_id"] = response.json().get("program_id")
        log_result("Create Program", True, f"ID: {created_ids['program_id']}", response)
    elif response and response.status_code == 400:
        response = api_call("GET", "/programs", params={"search": "TEST_BSCS"})
        if response and response.status_code == 200:
            items = response.json().get("items", [])
            if items:
                created_ids["program_id"] = items[0].get("program_id")
                log_result("Create Program", True, f"Using existing ID: {created_ids['program_id']}", response)
    else:
        log_result("Create Program", False, "Failed to create program", response)

    # 3. Create Course
    print("\n--- Creating Course ---")
    course_data = {
        "code": "TEST_CS101",
        "name": "Test Introduction to Computer Science",
        "credits": 3,
        "department_id": created_ids["department_id"],
        "program_id": created_ids["program_id"],
        "description": "Test course for API testing"
    }
    response = api_call("POST", "/courses", course_data)
    if response and response.status_code in [200, 201]:
        created_ids["course_id"] = response.json().get("course_id")
        log_result("Create Course", True, f"ID: {created_ids['course_id']}", response)
    elif response and response.status_code == 400:
        response = api_call("GET", "/courses", params={"search": "TEST_CS101"})
        if response and response.status_code == 200:
            items = response.json().get("items", [])
            if items:
                created_ids["course_id"] = items[0].get("course_id")
                log_result("Create Course", True, f"Using existing ID: {created_ids['course_id']}", response)
    else:
        log_result("Create Course", False, "Failed to create course", response)

    return all([created_ids["department_id"], created_ids["program_id"], created_ids["course_id"]])


# ============================================================
# TEST: PLO Management (GET /api/v1/programs/{id}/plos)
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

    # 1. Create PLOs
    print("\n--- Creating PLOs ---")
    plos_data = [
        {"code": "PLO1", "description": "Apply fundamental programming concepts and algorithms", "category": "Knowledge", "display_order": 1},
        {"code": "PLO2", "description": "Design and implement software solutions", "category": "Skills", "display_order": 2},
        {"code": "PLO3", "description": "Work effectively in teams and communicate technical ideas", "category": "Attitudes", "display_order": 3},
        {"code": "PLO4", "description": "Apply ethical principles in computing practice", "category": "Attitudes", "display_order": 4},
    ]

    for plo in plos_data:
        response = api_call("POST", f"/programs/{program_id}/plos", plo)
        if response and response.status_code in [200, 201]:
            plo_id = response.json().get("plo_id")
            created_ids["plo_ids"].append(plo_id)
            log_result(f"Create PLO {plo['code']}", True, f"ID: {plo_id}", response)
        elif response and response.status_code == 400:
            log_result(f"Create PLO {plo['code']}", True, "PLO already exists", response)
        else:
            log_result(f"Create PLO {plo['code']}", False, "", response)

    # 2. Get all PLOs
    print("\n--- Get All PLOs ---")
    response = api_call("GET", f"/programs/{program_id}/plos")
    if response and response.status_code == 200:
        data = response.json()
        log_result("Get All PLOs", True, f"Found {data.get('total', 0)} PLOs", response)
        # Store IDs if we didn't create them
        if not created_ids["plo_ids"]:
            created_ids["plo_ids"] = [p["plo_id"] for p in data.get("items", [])]
    else:
        log_result("Get All PLOs", False, "", response)

    # 3. Get PLOs with filter
    print("\n--- Get PLOs with Filter ---")
    response = api_call("GET", f"/programs/{program_id}/plos", params={"category": "Knowledge"})
    if response and response.status_code == 200:
        log_result("Get PLOs by Category", True, f"Found {response.json().get('total', 0)} PLOs", response)
    else:
        log_result("Get PLOs by Category", False, "", response)

    # 4. Update PLO
    if created_ids["plo_ids"]:
        print("\n--- Update PLO ---")
        plo_id = created_ids["plo_ids"][0]
        update_data = {"description": "Updated: Apply fundamental programming concepts, algorithms, and data structures"}
        response = api_call("PUT", f"/programs/{program_id}/plos/{plo_id}", update_data)
        if response and response.status_code == 200:
            log_result("Update PLO", True, f"Updated PLO {plo_id}", response)
        else:
            log_result("Update PLO", False, "", response)


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
    response = api_call("GET", "/lecturer/dashboard")
    if response and response.status_code == 200:
        data = response.json()
        log_result("Get Dashboard", True, f"Courses: {data.get('total_courses', 0)}, Drafts: {data.get('draft_syllabi', 0)}", response)
    else:
        log_result("Get Dashboard", False, "", response)

    # 2. Get Courses
    print("\n--- Get Lecturer Courses ---")
    response = api_call("GET", "/lecturer/courses")
    if response and response.status_code == 200:
        courses = response.json()
        log_result("Get Courses", True, f"Found {len(courses)} courses", response)
    else:
        log_result("Get Courses", False, "", response)

    # 3. Get Review Schedules
    print("\n--- Get Review Schedules ---")
    response = api_call("GET", "/lecturer/review-schedules")
    if response and response.status_code == 200:
        log_result("Get Review Schedules", True, f"Found {len(response.json())} schedules", response)
    else:
        log_result("Get Review Schedules", False, "", response)

    # 4. Get Deadlines
    print("\n--- Get Deadlines ---")
    response = api_call("GET", "/lecturer/deadlines")
    if response and response.status_code == 200:
        log_result("Get Deadlines", True, f"Found {len(response.json())} deadlines", response)
    else:
        log_result("Get Deadlines", False, "", response)

    # 5. Get Submissions
    print("\n--- Get Submissions ---")
    response = api_call("GET", "/lecturer/submissions")
    if response and response.status_code == 200:
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
            {"code": "CLO4", "description": "Design and implement complete software solutions", "bloom_level": "Create", "mapped_plos": ["PLO2", "PLO3"]},
        ],
        "contents": [
            {"week_number": 1, "title": "Introduction to Programming", "description": "Overview of programming concepts", "lecture_hours": 3, "lab_hours": 0, "teaching_methods": ["Lecture", "Discussion"], "related_clos": ["CLO1"]},
            {"week_number": 2, "title": "Variables and Data Types", "description": "Understanding data types and variables", "lecture_hours": 2, "lab_hours": 2, "teaching_methods": ["Lecture", "Lab"], "related_clos": ["CLO1", "CLO2"]},
            {"week_number": 3, "title": "Control Structures", "description": "Conditionals and loops", "lecture_hours": 2, "lab_hours": 2, "teaching_methods": ["Lecture", "Lab"], "related_clos": ["CLO2"]},
        ],
        "assessments": [
            {"assessment_type": "Quiz", "name": "Quiz 1 - Basics", "description": "Quiz on programming fundamentals", "weight": 10, "related_clos": ["CLO1"]},
            {"assessment_type": "Assignment", "name": "Programming Assignment 1", "description": "Implement basic programs", "weight": 20, "related_clos": ["CLO1", "CLO2"]},
            {"assessment_type": "Midterm", "name": "Midterm Examination", "description": "Written exam covering weeks 1-7", "weight": 30, "related_clos": ["CLO1", "CLO2", "CLO3"]},
            {"assessment_type": "Final", "name": "Final Examination", "description": "Comprehensive final exam", "weight": 40, "related_clos": ["CLO1", "CLO2", "CLO3", "CLO4"]},
        ],
        "references": [
            {"reference_type": "Required", "title": "Introduction to Computing Using Python", "authors": "Ljubomir Perkovic", "publisher": "Wiley", "year": 2022, "isbn": "978-1118890943"},
            {"reference_type": "Recommended", "title": "Think Python", "authors": "Allen B. Downey", "publisher": "O'Reilly Media", "year": 2021},
            {"reference_type": "Online Resource", "title": "Python Documentation", "url": "https://docs.python.org/3/"},
        ]
    }

    response = api_call("POST", "/lecturer/syllabi", syllabus_data)
    if response and response.status_code in [200, 201]:
        created_ids["syllabus_id"] = response.json().get("syllabus_id")
        log_result("Create Syllabus", True, f"ID: {created_ids['syllabus_id']}", response)
    else:
        log_result("Create Syllabus", False, "", response)
        return

    syllabus_id = created_ids["syllabus_id"]

    # 2. Get My Syllabi
    print("\n--- Get My Syllabi ---")
    response = api_call("GET", "/lecturer/syllabi")
    if response and response.status_code == 200:
        log_result("Get My Syllabi", True, f"Found {len(response.json())} syllabi", response)
    else:
        log_result("Get My Syllabi", False, "", response)

    # 3. Get Syllabi by Status
    print("\n--- Get Syllabi by Status (Draft) ---")
    response = api_call("GET", "/lecturer/syllabi", params={"status": "Draft"})
    if response and response.status_code == 200:
        log_result("Get Draft Syllabi", True, f"Found {len(response.json())} drafts", response)
    else:
        log_result("Get Draft Syllabi", False, "", response)

    # 4. Get Syllabus Preview
    print("\n--- Get Syllabus Preview ---")
    response = api_call("GET", f"/lecturer/syllabi/{syllabus_id}/preview")
    if response and response.status_code == 200:
        data = response.json()
        log_result("Get Preview", True, f"Course: {data.get('course', {}).get('name')}", response)
    else:
        log_result("Get Preview", False, "", response)

    # 5. Save Draft
    print("\n--- Save Draft ---")
    draft_data = {"description": "Updated description: This is a comprehensive introduction course..."}
    response = api_call("PUT", f"/lecturer/syllabi/{syllabus_id}/draft", draft_data)
    if response and response.status_code == 200:
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
        "code": "CLO5",
        "description": "Evaluate the quality and efficiency of software solutions",
        "bloom_level": "Evaluate",
        "mapped_plos": ["PLO2", "PLO3"]
    }
    response = api_call("POST", f"/lecturer/syllabi/{syllabus_id}/clos", clo_data)
    if response and response.status_code in [200, 201]:
        clo_id = response.json().get("clo_id")
        created_ids["clo_ids"].append(clo_id)
        log_result("Add CLO", True, f"ID: {clo_id}", response)
    else:
        log_result("Add CLO", False, "", response)

    # 2. Update CLO
    if created_ids["clo_ids"]:
        print("\n--- Update CLO ---")
        clo_id = created_ids["clo_ids"][0]
        update_data = {"description": "Updated: Critically evaluate software solutions for quality and efficiency"}
        response = api_call("PUT", f"/lecturer/syllabi/{syllabus_id}/clos/{clo_id}", update_data)
        if response and response.status_code == 200:
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
        "description": "Creating and using functions, modular programming",
        "lecture_hours": 2,
        "lab_hours": 2,
        "teaching_methods": ["Lecture", "Lab", "Discussion"],
        "related_clos": ["CLO2", "CLO3"]
    }
    response = api_call("POST", f"/lecturer/syllabi/{syllabus_id}/content", content_data)
    if response and response.status_code in [200, 201]:
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
        response = api_call("PUT", f"/lecturer/syllabi/{syllabus_id}/content/{content_id}", update_data)
        if response and response.status_code == 200:
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
        "name": "Final Project",
        "description": "Comprehensive programming project",
        "weight": 0,  # Will be adjusted
        "related_clos": ["CLO2", "CLO3", "CLO4"]
    }
    response = api_call("POST", f"/lecturer/syllabi/{syllabus_id}/assessments", assessment_data)
    if response and response.status_code in [200, 201]:
        assessment_id = response.json().get("assessment_id")
        created_ids["assessment_ids"].append(assessment_id)
        log_result("Add Assessment", True, f"ID: {assessment_id}", response)
    else:
        log_result("Add Assessment", False, "", response)

    # 2. Update Assessment
    if created_ids["assessment_ids"]:
        print("\n--- Update Assessment ---")
        assessment_id = created_ids["assessment_ids"][0]
        update_data = {"name": "Capstone Final Project", "weight": 0}
        response = api_call("PUT", f"/lecturer/syllabi/{syllabus_id}/assessments/{assessment_id}", update_data)
        if response and response.status_code == 200:
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
        "reference_type": "Recommended",
        "title": "Clean Code: A Handbook of Agile Software Craftsmanship",
        "authors": "Robert C. Martin",
        "publisher": "Prentice Hall",
        "year": 2008,
        "isbn": "978-0132350884"
    }
    response = api_call("POST", f"/lecturer/syllabi/{syllabus_id}/references", reference_data)
    if response and response.status_code in [200, 201]:
        reference_id = response.json().get("reference_id")
        created_ids["reference_ids"].append(reference_id)
        log_result("Add Reference", True, f"ID: {reference_id}", response)
    else:
        log_result("Add Reference", False, "", response)

    # 2. Update Reference
    if created_ids["reference_ids"]:
        print("\n--- Update Reference ---")
        reference_id = created_ids["reference_ids"][0]
        update_data = {"year": 2009}
        response = api_call("PUT", f"/lecturer/syllabi/{syllabus_id}/references/{reference_id}", update_data)
        if response and response.status_code == 200:
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
    response = api_call("POST", f"/lecturer/syllabi/{syllabus_id}/validate")
    if response and response.status_code == 200:
        data = response.json()
        is_valid = data.get("is_valid", False)
        errors = data.get("errors", [])
        warnings = data.get("warnings", [])
        log_result("Validate Syllabus", True, f"Valid: {is_valid}, Errors: {len(errors)}, Warnings: {len(warnings)}", response)
        if errors:
            print(f"   Errors: {[e.get('message') for e in errors]}")
    else:
        log_result("Validate Syllabus", False, "", response)

    # 2. Submit for Review
    print("\n--- Submit for Review ---")
    submit_data = {"notes": "Please review this syllabus for the upcoming semester.", "confirm": True}
    response = api_call("POST", f"/lecturer/syllabi/{syllabus_id}/submit", submit_data)
    if response and response.status_code == 200:
        log_result("Submit for Review", True, "", response)
    else:
        # May fail validation
        log_result("Submit for Review", False, "May have validation errors", response)

    # 3. Get Submission Status
    print("\n--- Get Submission Status ---")
    response = api_call("GET", f"/lecturer/syllabi/{syllabus_id}/submission-status")
    if response and response.status_code == 200:
        data = response.json()
        log_result("Get Submission Status", True, f"Status: {data.get('status')}, Stage: {data.get('current_stage')}", response)
    else:
        log_result("Get Submission Status", False, "", response)

    # 4. Get Approval Timeline
    print("\n--- Get Approval Timeline ---")
    response = api_call("GET", f"/lecturer/syllabi/{syllabus_id}/approval-timeline")
    if response and response.status_code == 200:
        data = response.json()
        log_result("Get Approval Timeline", True, f"Current: {data.get('current_stage')}, Next: {data.get('next_stage')}", response)
    else:
        log_result("Get Approval Timeline", False, "", response)

    # 5. Withdraw Submission (if submitted)
    print("\n--- Withdraw Submission ---")
    response = api_call("POST", f"/lecturer/syllabi/{syllabus_id}/withdraw")
    if response and response.status_code == 200:
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
        "content": "Consider adding more CLOs related to soft skills and teamwork.",
        "priority": "Medium"
    }
    response = api_call("POST", f"/syllabi/{syllabus_id}/comments", comment_data)
    if response and response.status_code in [200, 201]:
        comment_id = response.json().get("comment_id")
        created_ids["comment_ids"].append(comment_id)
        log_result("Add Comment", True, f"ID: {comment_id}", response)
    else:
        log_result("Add Comment", False, "", response)

    # 2. Get Comments
    print("\n--- Get Comments ---")
    response = api_call("GET", f"/syllabi/{syllabus_id}/comments")
    if response and response.status_code == 200:
        log_result("Get Comments", True, f"Found {len(response.json())} comments", response)
    else:
        log_result("Get Comments", False, "", response)

    # 3. Reply to Comment
    if created_ids["comment_ids"]:
        print("\n--- Reply to Comment ---")
        comment_id = created_ids["comment_ids"][0]
        reply_data = {"content": "Thank you for the suggestion. I will consider adding CLO for teamwork."}
        response = api_call("POST", f"/syllabi/{syllabus_id}/comments/{comment_id}/reply", reply_data)
        if response and response.status_code in [200, 201]:
            reply_id = response.json().get("comment_id")
            created_ids["comment_ids"].append(reply_id)
            log_result("Reply to Comment", True, f"Reply ID: {reply_id}", response)
        else:
            log_result("Reply to Comment", False, "", response)

    # 4. Resolve Comment
    if created_ids["comment_ids"]:
        print("\n--- Resolve Comment ---")
        comment_id = created_ids["comment_ids"][0]
        response = api_call("PUT", f"/syllabi/{syllabus_id}/comments/{comment_id}/resolve")
        if response and response.status_code == 200:
            log_result("Resolve Comment", True, "", response)
        else:
            log_result("Resolve Comment", False, "", response)

    # 5. Get Feedback
    print("\n--- Get Feedback ---")
    response = api_call("GET", f"/lecturer/syllabi/{syllabus_id}/feedback")
    if response and response.status_code == 200:
        log_result("Get Feedback", True, f"Found {len(response.json())} feedback items", response)
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

    # 1. Get Contacts
    print("\n--- Get Contacts ---")
    response = api_call("GET", "/users/contacts")
    if response and response.status_code == 200:
        contacts = response.json()
        log_result("Get Contacts", True, f"Found {len(contacts)} contacts", response)
    else:
        log_result("Get Contacts", False, "", response)

    # Also test messages/contacts endpoint
    print("\n--- Get Contacts (Messages Route) ---")
    response = api_call("GET", "/messages/contacts")
    if response and response.status_code == 200:
        log_result("Get Contacts (Messages)", True, f"Found {len(response.json())} contacts", response)
    else:
        log_result("Get Contacts (Messages)", False, "", response)

    # 2. Get Inbox
    print("\n--- Get Inbox ---")
    response = api_call("GET", "/messages/inbox")
    if response and response.status_code == 200:
        log_result("Get Inbox", True, f"Found {len(response.json())} messages", response)
    else:
        log_result("Get Inbox", False, "", response)

    # 3. Get Sent Messages
    print("\n--- Get Sent Messages ---")
    response = api_call("GET", "/messages/sent")
    if response and response.status_code == 200:
        log_result("Get Sent", True, f"Found {len(response.json())} messages", response)
    else:
        log_result("Get Sent", False, "", response)

    # 4. Get Conversations
    print("\n--- Get Conversations ---")
    response = api_call("GET", "/messages/conversations")
    if response and response.status_code == 200:
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
    response = api_call("GET", "/peer-reviews")
    if response and response.status_code == 200:
        reviews = response.json()
        log_result("Get Assigned Reviews", True, f"Found {len(reviews)} assigned reviews", response)
    else:
        log_result("Get Assigned Reviews", False, "", response)

    # 2. Get Evaluation Templates
    print("\n--- Get Evaluation Templates ---")
    response = api_call("GET", "/evaluation-templates")
    if response and response.status_code == 200:
        templates = response.json()
        log_result("Get Templates", True, f"Found {len(templates.get('items', []))} templates", response)
        if templates.get("items"):
            template_id = templates["items"][0].get("template_id")
            # Get specific template
            response = api_call("GET", f"/peer-reviews/templates/{template_id}")
            if response and response.status_code == 200:
                log_result("Get Template Details", True, f"Template: {response.json().get('name')}", response)
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

    syllabus_id = created_ids["syllabus_id"]

    # 1. Get My Update Requests
    print("\n--- Get My Update Requests ---")
    response = api_call("GET", "/update-requests/my-requests")
    if response and response.status_code == 200:
        log_result("Get My Requests", True, f"Found {len(response.json())} requests", response)
    else:
        log_result("Get My Requests", False, "", response)

    # 2. Create Update Request (only for approved syllabi)
    print("\n--- Create Update Request ---")
    if syllabus_id:
        request_data = {
            "syllabus_id": syllabus_id,
            "reason": "Need to update textbook references to the latest editions and add additional online resources for students."
        }
        response = api_call("POST", "/update-requests", request_data)
        if response and response.status_code in [200, 201]:
            created_ids["update_request_id"] = response.json().get("request_id")
            log_result("Create Update Request", True, f"ID: {created_ids['update_request_id']}", response)
        else:
            log_result("Create Update Request", False, "Syllabus may not be approved", response)

    # 3. Save Draft Changes
    if created_ids.get("update_request_id"):
        print("\n--- Save Draft Changes ---")
        draft_data = {
            "description": "Updated course description with new focus areas",
            "textbooks": "New textbook list with latest editions",
            "changes_summary": "Updated textbooks and added online resources"
        }
        response = api_call("PUT", f"/update-requests/{created_ids['update_request_id']}/draft-changes", draft_data)
        if response and response.status_code == 200:
            log_result("Save Draft Changes", True, "", response)
        else:
            log_result("Save Draft Changes", False, "", response)

    # 4. List All Update Requests
    print("\n--- List Update Requests ---")
    response = api_call("GET", "/update-requests")
    if response and response.status_code == 200:
        log_result("List Update Requests", True, f"Found {len(response.json())} requests", response)
    else:
        log_result("List Update Requests", False, "", response)


# ============================================================
# TEST: Approved Syllabi
# ============================================================

def test_approved_syllabi():
    """Test approved syllabi endpoint"""
    print("\n" + "="*60)
    print("TEST: Approved Syllabi")
    print("="*60)

    print("\n--- Get Approved Syllabi ---")
    response = api_call("GET", "/lecturer/syllabi/approved")
    if response and response.status_code == 200:
        log_result("Get Approved Syllabi", True, f"Found {len(response.json())} approved syllabi", response)
    else:
        log_result("Get Approved Syllabi", False, "", response)


# ============================================================
# TEST: Syllabus Versions
# ============================================================

def test_syllabus_versions():
    """Test syllabus version operations"""
    print("\n" + "="*60)
    print("TEST: Syllabus Versions")
    print("="*60)

    syllabus_id = created_ids["syllabus_id"]
    if not syllabus_id:
        log_result("Version Tests", False, "No syllabus_id available")
        return

    # 1. Get Version History
    print("\n--- Get Version History ---")
    response = api_call("GET", f"/syllabi/{syllabus_id}/versions")
    if response and response.status_code == 200:
        data = response.json()
        log_result("Get Versions", True, f"Found {data.get('total', 0)} versions", response)
    else:
        log_result("Get Versions", False, "", response)


# ============================================================
# CLEANUP: Delete test data
# ============================================================

def cleanup_test_data():
    """Clean up created test data"""
    print("\n" + "="*60)
    print("CLEANUP: Removing test data")
    print("="*60)

    # Delete in reverse order of dependencies

    # Delete comments
    for comment_id in created_ids["comment_ids"]:
        response = api_call("DELETE", f"/syllabi/{created_ids['syllabus_id']}/comments/{comment_id}")
        if response and response.status_code == 204:
            print(f"   Deleted comment {comment_id}")

    # Delete content
    for content_id in created_ids["content_ids"]:
        response = api_call("DELETE", f"/lecturer/syllabi/{created_ids['syllabus_id']}/content/{content_id}")
        if response and response.status_code == 204:
            print(f"   Deleted content {content_id}")

    # Delete assessments
    for assessment_id in created_ids["assessment_ids"]:
        response = api_call("DELETE", f"/lecturer/syllabi/{created_ids['syllabus_id']}/assessments/{assessment_id}")
        if response and response.status_code == 204:
            print(f"   Deleted assessment {assessment_id}")

    # Delete references
    for reference_id in created_ids["reference_ids"]:
        response = api_call("DELETE", f"/lecturer/syllabi/{created_ids['syllabus_id']}/references/{reference_id}")
        if response and response.status_code == 204:
            print(f"   Deleted reference {reference_id}")

    # Delete CLOs
    for clo_id in created_ids["clo_ids"]:
        response = api_call("DELETE", f"/lecturer/syllabi/{created_ids['syllabus_id']}/clos/{clo_id}")
        if response and response.status_code == 204:
            print(f"   Deleted CLO {clo_id}")

    # Delete PLOs
    for plo_id in created_ids["plo_ids"]:
        response = api_call("DELETE", f"/programs/{created_ids['program_id']}/plos/{plo_id}")
        if response and response.status_code == 204:
            print(f"   Deleted PLO {plo_id}")

    # Delete syllabus
    if created_ids["syllabus_id"]:
        response = api_call("DELETE", f"/syllabi/{created_ids['syllabus_id']}")
        if response and response.status_code == 204:
            print(f"   Deleted syllabus {created_ids['syllabus_id']}")

    # Note: Keep department, program, course for future tests
    print("\n   Note: Department, Program, and Course were not deleted for future tests.")


# ============================================================
# MAIN
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


def main():
    parser = argparse.ArgumentParser(description="Test Lecturer Module APIs")
    parser.add_argument("--base-url", default="http://localhost:8000/api/v1", help="Base URL for API")
    parser.add_argument("--no-cleanup", action="store_true", help="Skip cleanup of test data")
    parser.add_argument("--only", type=str, help="Run only specific test (plo, dashboard, syllabus, clo, content, assessment, reference, validation, comments, messages, peer, update, versions)")
    args = parser.parse_args()

    global BASE_URL
    BASE_URL = args.base_url

    print("="*60)
    print("LECTURER MODULE API TEST SUITE")
    print("="*60)
    print(f"Base URL: {BASE_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}")

    # Check connection
    try:
        response = requests.get(f"{BASE_URL.replace('/api/v1', '')}/")
        if response.status_code != 200:
            print(f"\n❌ Cannot connect to API at {BASE_URL}")
            sys.exit(1)
        print("✅ API connection successful")
    except requests.exceptions.ConnectionError:
        print(f"\n❌ Cannot connect to API at {BASE_URL}")
        print("Make sure the FastAPI server is running:")
        print("  cd src && uvicorn app.main:app --reload")
        sys.exit(1)

    # Setup
    if not setup_test_data():
        print("\n❌ Failed to setup test data. Aborting.")
        sys.exit(1)

    # Run tests
    test_map = {
        "plo": test_plo_management,
        "dashboard": test_lecturer_dashboard,
        "syllabus": test_syllabus_crud,
        "clo": test_clo_management,
        "content": test_content_management,
        "assessment": test_assessment_management,
        "reference": test_reference_management,
        "validation": test_validation_submission,
        "comments": test_comments_system,
        "messages": test_messaging_system,
        "peer": test_peer_reviews,
        "update": test_update_requests,
        "approved": test_approved_syllabi,
        "versions": test_syllabus_versions,
    }

    if args.only:
        if args.only in test_map:
            test_map[args.only]()
        else:
            print(f"Unknown test: {args.only}")
            print(f"Available: {', '.join(test_map.keys())}")
            sys.exit(1)
    else:
        # Run all tests
        for name, test_func in test_map.items():
            try:
                test_func()
            except Exception as e:
                log_result(f"{name} tests", False, f"Exception: {str(e)}")

    # Cleanup
    if not args.no_cleanup:
        cleanup_test_data()

    # Summary
    print_summary()


if __name__ == "__main__":
    main()
