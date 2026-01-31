"""
Seed Data Script for SMD System

This script creates sample data for testing purposes.
Run: python -m app.seed_data
To truncate: python -m app.seed_data --truncate
"""
import argparse
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.department import Department
from app.models.program import Program, DegreeType
from app.models.course import Course
from app.models.syllabus import Syllabus, SyllabusStatus
from app.models.syllabus_version import SyllabusVersion
from app.models.approval_history import ApprovalHistory, ApprovalAction


def truncate_all_tables(db: Session):
    """Remove all data from all tables"""
    print("Truncating all tables...")

    # Delete in reverse order of dependencies
    db.query(ApprovalHistory).delete()
    db.query(SyllabusVersion).delete()
    db.query(Syllabus).delete()
    db.query(Course).delete()
    db.query(Program).delete()
    db.query(User).delete()
    db.query(Department).delete()

    db.commit()
    print("All tables truncated successfully!")


def seed_departments(db: Session) -> list[Department]:
    """Create sample departments"""
    print("Creating departments...")

    departments_data = [
        {
            "dept_code": "CS",
            "dept_name": "Computer Science",
            "dept_name_vn": "Khoa Học Máy Tính",
            "email": "cs@university.edu",
            "phone": "028-1234-5001",
            "office_location": "Building A, Room 101",
            "established_year": 1995
        },
        {
            "dept_code": "EE",
            "dept_name": "Electrical Engineering",
            "dept_name_vn": "Kỹ Thuật Điện",
            "email": "ee@university.edu",
            "phone": "028-1234-5002",
            "office_location": "Building B, Room 201",
            "established_year": 1990
        },
        {
            "dept_code": "BA",
            "dept_name": "Business Administration",
            "dept_name_vn": "Quản Trị Kinh Doanh",
            "email": "ba@university.edu",
            "phone": "028-1234-5003",
            "office_location": "Building C, Room 301",
            "established_year": 2000
        },
        {
            "dept_code": "ME",
            "dept_name": "Mechanical Engineering",
            "dept_name_vn": "Kỹ Thuật Cơ Khí",
            "email": "me@university.edu",
            "phone": "028-1234-5004",
            "office_location": "Building D, Room 401",
            "established_year": 1992
        },
        {
            "dept_code": "MA",
            "dept_name": "Mathematics",
            "dept_name_vn": "Toán Học",
            "email": "math@university.edu",
            "phone": "028-1234-5005",
            "office_location": "Building E, Room 501",
            "established_year": 1988
        }
    ]

    departments = []
    for data in departments_data:
        dept = Department(**data)
        db.add(dept)
        departments.append(dept)

    db.commit()
    for dept in departments:
        db.refresh(dept)

    print(f"Created {len(departments)} departments")
    return departments


def seed_users(db: Session, departments: list[Department]) -> list[User]:
    """Create sample users"""
    print("Creating users...")

    users_data = [
        # Admin
        {
            "username": "admin",
            "password_hash": get_password_hash("admin123"),
            "email": "admin@university.edu",
            "first_name": "System",
            "last_name": "Administrator",
            "role": UserRole.ADMIN,
            "department_id": None,
            "faculty_position": "System Administrator",
            "phone": "028-1234-0001",
            "is_active": True
        },
        # Department Heads
        {
            "username": "nguyen.van.a",
            "password_hash": get_password_hash("password123"),
            "email": "nguyen.van.a@university.edu",
            "first_name": "Nguyen Van",
            "last_name": "A",
            "role": UserRole.DEPARTMENT_HEAD,
            "department_id": departments[0].dept_id,  # CS
            "faculty_position": "Professor",
            "phone": "028-1234-1001",
            "is_active": True
        },
        {
            "username": "tran.thi.b",
            "password_hash": get_password_hash("password123"),
            "email": "tran.thi.b@university.edu",
            "first_name": "Tran Thi",
            "last_name": "B",
            "role": UserRole.DEPARTMENT_HEAD,
            "department_id": departments[1].dept_id,  # EE
            "faculty_position": "Professor",
            "phone": "028-1234-1002",
            "is_active": True
        },
        # Program Coordinators
        {
            "username": "le.van.c",
            "password_hash": get_password_hash("password123"),
            "email": "le.van.c@university.edu",
            "first_name": "Le Van",
            "last_name": "C",
            "role": UserRole.PROGRAM_COORDINATOR,
            "department_id": departments[0].dept_id,  # CS
            "faculty_position": "Associate Professor",
            "phone": "028-1234-2001",
            "is_active": True
        },
        {
            "username": "pham.thi.d",
            "password_hash": get_password_hash("password123"),
            "email": "pham.thi.d@university.edu",
            "first_name": "Pham Thi",
            "last_name": "D",
            "role": UserRole.PROGRAM_COORDINATOR,
            "department_id": departments[2].dept_id,  # BA
            "faculty_position": "Associate Professor",
            "phone": "028-1234-2002",
            "is_active": True
        },
        # Instructors
        {
            "username": "hoang.van.e",
            "password_hash": get_password_hash("password123"),
            "email": "hoang.van.e@university.edu",
            "first_name": "Hoang Van",
            "last_name": "E",
            "role": UserRole.INSTRUCTOR,
            "department_id": departments[0].dept_id,  # CS
            "faculty_position": "Senior Lecturer",
            "phone": "028-1234-3001",
            "is_active": True
        },
        {
            "username": "vu.thi.f",
            "password_hash": get_password_hash("password123"),
            "email": "vu.thi.f@university.edu",
            "first_name": "Vu Thi",
            "last_name": "F",
            "role": UserRole.INSTRUCTOR,
            "department_id": departments[0].dept_id,  # CS
            "faculty_position": "Lecturer",
            "phone": "028-1234-3002",
            "is_active": True
        },
        {
            "username": "do.van.g",
            "password_hash": get_password_hash("password123"),
            "email": "do.van.g@university.edu",
            "first_name": "Do Van",
            "last_name": "G",
            "role": UserRole.INSTRUCTOR,
            "department_id": departments[1].dept_id,  # EE
            "faculty_position": "Senior Lecturer",
            "phone": "028-1234-3003",
            "is_active": True
        },
        # Reviewers (Academic Affairs)
        {
            "username": "bui.thi.h",
            "password_hash": get_password_hash("password123"),
            "email": "bui.thi.h@university.edu",
            "first_name": "Bui Thi",
            "last_name": "H",
            "role": UserRole.REVIEWER,
            "department_id": None,
            "faculty_position": "Academic Affairs Officer",
            "phone": "028-1234-4001",
            "is_active": True
        },
        {
            "username": "dang.van.i",
            "password_hash": get_password_hash("password123"),
            "email": "dang.van.i@university.edu",
            "first_name": "Dang Van",
            "last_name": "I",
            "role": UserRole.REVIEWER,
            "department_id": None,
            "faculty_position": "Senior Academic Affairs Officer",
            "phone": "028-1234-4002",
            "is_active": True
        },
        # Viewers (Students)
        {
            "username": "student1",
            "password_hash": get_password_hash("student123"),
            "email": "student1@university.edu",
            "first_name": "Nguyen",
            "last_name": "Student One",
            "role": UserRole.VIEWER,
            "department_id": departments[0].dept_id,
            "faculty_position": None,
            "phone": "090-1234-5001",
            "is_active": True
        },
        {
            "username": "student2",
            "password_hash": get_password_hash("student123"),
            "email": "student2@university.edu",
            "first_name": "Tran",
            "last_name": "Student Two",
            "role": UserRole.VIEWER,
            "department_id": departments[1].dept_id,
            "faculty_position": None,
            "phone": "090-1234-5002",
            "is_active": True
        }
    ]

    users = []
    for data in users_data:
        user = User(**data)
        db.add(user)
        users.append(user)

    db.commit()
    for user in users:
        db.refresh(user)

    # Update department deans
    departments[0].dean_id = users[1].user_id  # CS - nguyen.van.a
    departments[1].dean_id = users[2].user_id  # EE - tran.thi.b
    db.commit()

    print(f"Created {len(users)} users")
    return users


def seed_programs(db: Session, departments: list[Department], users: list[User]) -> list[Program]:
    """Create sample programs"""
    print("Creating programs...")

    programs_data = [
        {
            "program_code": "CS-BSC",
            "program_name": "Bachelor of Science in Computer Science",
            "program_name_vn": "Cử Nhân Khoa Học Máy Tính",
            "degree_type": DegreeType.BACHELOR,
            "duration_years": 4,
            "total_credits": 130,
            "department_id": departments[0].dept_id,
            "coordinator_id": users[3].user_id,  # le.van.c
            "description": "A comprehensive undergraduate program in computer science covering software development, algorithms, and systems.",
            "is_active": True
        },
        {
            "program_code": "CS-MSC",
            "program_name": "Master of Science in Computer Science",
            "program_name_vn": "Thạc Sĩ Khoa Học Máy Tính",
            "degree_type": DegreeType.MASTER,
            "duration_years": 2,
            "total_credits": 45,
            "department_id": departments[0].dept_id,
            "coordinator_id": users[3].user_id,
            "description": "An advanced graduate program focusing on research and specialized topics in computer science.",
            "is_active": True
        },
        {
            "program_code": "EE-BSC",
            "program_name": "Bachelor of Science in Electrical Engineering",
            "program_name_vn": "Cử Nhân Kỹ Thuật Điện",
            "degree_type": DegreeType.BACHELOR,
            "duration_years": 4,
            "total_credits": 135,
            "department_id": departments[1].dept_id,
            "coordinator_id": users[2].user_id,  # tran.thi.b (also HoD)
            "description": "Undergraduate program covering electrical systems, electronics, and power engineering.",
            "is_active": True
        },
        {
            "program_code": "BA-BBA",
            "program_name": "Bachelor of Business Administration",
            "program_name_vn": "Cử Nhân Quản Trị Kinh Doanh",
            "degree_type": DegreeType.BACHELOR,
            "duration_years": 4,
            "total_credits": 125,
            "department_id": departments[2].dept_id,
            "coordinator_id": users[4].user_id,  # pham.thi.d
            "description": "Undergraduate business program covering management, marketing, and finance.",
            "is_active": True
        },
        {
            "program_code": "BA-MBA",
            "program_name": "Master of Business Administration",
            "program_name_vn": "Thạc Sĩ Quản Trị Kinh Doanh",
            "degree_type": DegreeType.MASTER,
            "duration_years": 2,
            "total_credits": 48,
            "department_id": departments[2].dept_id,
            "coordinator_id": users[4].user_id,
            "description": "Graduate business program for leadership and strategic management.",
            "is_active": True
        },
        {
            "program_code": "CS-CERT-AI",
            "program_name": "Certificate in Artificial Intelligence",
            "program_name_vn": "Chứng Chỉ Trí Tuệ Nhân Tạo",
            "degree_type": DegreeType.CERTIFICATE,
            "duration_years": 1,
            "total_credits": 18,
            "department_id": departments[0].dept_id,
            "coordinator_id": users[3].user_id,
            "description": "Short-term certificate program covering AI fundamentals and applications.",
            "is_active": True
        }
    ]

    programs = []
    for data in programs_data:
        program = Program(**data)
        db.add(program)
        programs.append(program)

    db.commit()
    for program in programs:
        db.refresh(program)

    print(f"Created {len(programs)} programs")
    return programs


def seed_courses(db: Session, departments: list[Department], programs: list[Program]) -> list[Course]:
    """Create sample courses"""
    print("Creating courses...")

    courses_data = [
        # Computer Science courses
        {
            "course_code": "CS101",
            "course_name": "Introduction to Programming",
            "course_name_vn": "Nhập Môn Lập Trình",
            "description": "Fundamental programming concepts using Python. Covers variables, control structures, functions, and basic data structures.",
            "department_id": departments[0].dept_id,
            "program_id": programs[0].program_id,  # CS-BSC
            "is_elective": False,
            "min_students": 20,
            "max_students": 60,
            "is_active": True
        },
        {
            "course_code": "CS201",
            "course_name": "Data Structures and Algorithms",
            "course_name_vn": "Cấu Trúc Dữ Liệu và Giải Thuật",
            "description": "Advanced data structures including trees, graphs, and hash tables. Algorithm analysis and design techniques.",
            "department_id": departments[0].dept_id,
            "program_id": programs[0].program_id,
            "is_elective": False,
            "min_students": 15,
            "max_students": 50,
            "is_active": True
        },
        {
            "course_code": "CS301",
            "course_name": "Database Systems",
            "course_name_vn": "Hệ Thống Cơ Sở Dữ Liệu",
            "description": "Relational database design, SQL, normalization, and database administration.",
            "department_id": departments[0].dept_id,
            "program_id": programs[0].program_id,
            "is_elective": False,
            "min_students": 15,
            "max_students": 45,
            "is_active": True
        },
        {
            "course_code": "CS401",
            "course_name": "Software Engineering",
            "course_name_vn": "Kỹ Thuật Phần Mềm",
            "description": "Software development methodologies, project management, testing, and quality assurance.",
            "department_id": departments[0].dept_id,
            "program_id": programs[0].program_id,
            "is_elective": False,
            "min_students": 15,
            "max_students": 40,
            "is_active": True
        },
        {
            "course_code": "CS450",
            "course_name": "Machine Learning",
            "course_name_vn": "Học Máy",
            "description": "Introduction to machine learning algorithms, supervised and unsupervised learning, neural networks.",
            "department_id": departments[0].dept_id,
            "program_id": programs[0].program_id,
            "is_elective": True,
            "min_students": 10,
            "max_students": 35,
            "is_active": True
        },
        # Electrical Engineering courses
        {
            "course_code": "EE101",
            "course_name": "Circuit Analysis",
            "course_name_vn": "Phân Tích Mạch Điện",
            "description": "Basic electrical circuit analysis, Kirchhoff's laws, network theorems.",
            "department_id": departments[1].dept_id,
            "program_id": programs[2].program_id,  # EE-BSC
            "is_elective": False,
            "min_students": 20,
            "max_students": 50,
            "is_active": True
        },
        {
            "course_code": "EE201",
            "course_name": "Digital Electronics",
            "course_name_vn": "Điện Tử Số",
            "description": "Digital logic design, combinational and sequential circuits, FPGA basics.",
            "department_id": departments[1].dept_id,
            "program_id": programs[2].program_id,
            "is_elective": False,
            "min_students": 15,
            "max_students": 45,
            "is_active": True
        },
        # Business courses
        {
            "course_code": "BA101",
            "course_name": "Principles of Management",
            "course_name_vn": "Nguyên Lý Quản Trị",
            "description": "Fundamentals of management theory, planning, organizing, leading, and controlling.",
            "department_id": departments[2].dept_id,
            "program_id": programs[3].program_id,  # BA-BBA
            "is_elective": False,
            "min_students": 25,
            "max_students": 80,
            "is_active": True
        },
        {
            "course_code": "BA201",
            "course_name": "Marketing Fundamentals",
            "course_name_vn": "Nguyên Lý Marketing",
            "description": "Introduction to marketing concepts, consumer behavior, and marketing strategy.",
            "department_id": departments[2].dept_id,
            "program_id": programs[3].program_id,
            "is_elective": False,
            "min_students": 20,
            "max_students": 70,
            "is_active": True
        },
        {
            "course_code": "BA301",
            "course_name": "Financial Management",
            "course_name_vn": "Quản Trị Tài Chính",
            "description": "Corporate finance, capital budgeting, financial analysis, and valuation.",
            "department_id": departments[2].dept_id,
            "program_id": programs[3].program_id,
            "is_elective": False,
            "min_students": 15,
            "max_students": 60,
            "is_active": True
        }
    ]

    courses = []
    for data in courses_data:
        course = Course(**data)
        db.add(course)
        courses.append(course)

    db.commit()
    for course in courses:
        db.refresh(course)

    print(f"Created {len(courses)} courses")
    return courses


def seed_syllabi(db: Session, courses: list[Course], users: list[User]) -> list[Syllabus]:
    """Create sample syllabi"""
    print("Creating syllabi...")

    # Get instructor users
    instructors = [u for u in users if u.role == UserRole.INSTRUCTOR]

    syllabi_data = [
        {
            "course_id": courses[0].course_id,  # CS101
            "academic_year": "2024-2025",
            "semester": "Fall",
            "credits": 3,
            "total_hours": 45,
            "learning_outcomes": """1. Understand fundamental programming concepts
2. Write basic Python programs
3. Apply problem-solving techniques
4. Use control structures effectively
5. Implement basic data structures""",
            "assessment_methods": """- Assignments: 30%
- Midterm Exam: 25%
- Final Project: 20%
- Final Exam: 25%""",
            "textbooks": """1. "Python Crash Course" by Eric Matthes
2. "Automate the Boring Stuff with Python" by Al Sweigart""",
            "teaching_methods": "Lectures, Lab sessions, Group projects, Online exercises",
            "prerequisites": "None",
            "materials": "Computer with Python 3.10+, IDE (VS Code recommended)",
            "created_by": instructors[0].user_id,  # hoang.van.e
            "status": SyllabusStatus.APPROVED
        },
        {
            "course_id": courses[1].course_id,  # CS201
            "academic_year": "2024-2025",
            "semester": "Spring",
            "credits": 4,
            "total_hours": 60,
            "learning_outcomes": """1. Implement common data structures
2. Analyze algorithm complexity
3. Apply appropriate algorithms for problem-solving
4. Design efficient solutions
5. Understand recursion and dynamic programming""",
            "assessment_methods": """- Programming Assignments: 35%
- Midterm Exam: 20%
- Quizzes: 10%
- Final Exam: 35%""",
            "textbooks": """1. "Introduction to Algorithms" by Cormen et al.
2. "Data Structures and Algorithms in Python" by Goodrich""",
            "teaching_methods": "Lectures, Coding labs, Algorithm visualization, Competitive programming exercises",
            "prerequisites": "CS101 Introduction to Programming",
            "materials": "Computer with Python, Algorithm visualization tools",
            "created_by": instructors[0].user_id,
            "status": SyllabusStatus.APPROVED
        },
        {
            "course_id": courses[2].course_id,  # CS301 Database
            "academic_year": "2024-2025",
            "semester": "Fall",
            "credits": 3,
            "total_hours": 45,
            "learning_outcomes": """1. Design normalized database schemas
2. Write complex SQL queries
3. Understand transaction management
4. Implement database security
5. Apply indexing and optimization""",
            "assessment_methods": """- Lab Assignments: 30%
- Database Project: 25%
- Midterm Exam: 20%
- Final Exam: 25%""",
            "textbooks": """1. "Database System Concepts" by Silberschatz
2. "SQL in 10 Minutes" by Ben Forta""",
            "teaching_methods": "Lectures, Hands-on SQL labs, Group database projects",
            "prerequisites": "CS101 Introduction to Programming",
            "materials": "MySQL or PostgreSQL, Database design tools",
            "created_by": instructors[1].user_id,  # vu.thi.f
            "status": SyllabusStatus.PENDING_REVIEW
        },
        {
            "course_id": courses[3].course_id,  # CS401 Software Engineering
            "academic_year": "2024-2025",
            "semester": "Spring",
            "credits": 3,
            "total_hours": 45,
            "learning_outcomes": """1. Apply software development methodologies
2. Manage software projects effectively
3. Perform software testing and QA
4. Use version control systems
5. Write technical documentation""",
            "assessment_methods": """- Team Project: 40%
- Individual Assignments: 20%
- Midterm Exam: 15%
- Final Exam: 25%""",
            "textbooks": """1. "Software Engineering" by Ian Sommerville
2. "Clean Code" by Robert C. Martin""",
            "teaching_methods": "Lectures, Team projects, Agile simulations, Code reviews",
            "prerequisites": "CS201 Data Structures and Algorithms",
            "materials": "Git, Project management tools, IDEs",
            "created_by": instructors[0].user_id,
            "status": SyllabusStatus.DRAFT
        },
        {
            "course_id": courses[4].course_id,  # CS450 Machine Learning
            "academic_year": "2024-2025",
            "semester": "Fall",
            "credits": 3,
            "total_hours": 45,
            "learning_outcomes": """1. Understand ML fundamentals
2. Implement supervised learning algorithms
3. Apply unsupervised learning techniques
4. Build and train neural networks
5. Evaluate ML models""",
            "assessment_methods": """- Programming Assignments: 35%
- ML Project: 30%
- Midterm Exam: 15%
- Final Exam: 20%""",
            "textbooks": """1. "Hands-On Machine Learning" by Aurélien Géron
2. "Deep Learning" by Goodfellow et al.""",
            "teaching_methods": "Lectures, Jupyter notebooks, Kaggle competitions",
            "prerequisites": "CS201, Linear Algebra, Statistics",
            "materials": "Python, TensorFlow/PyTorch, Jupyter, GPU access",
            "created_by": instructors[1].user_id,
            "status": SyllabusStatus.DRAFT
        },
        {
            "course_id": courses[5].course_id,  # EE101 Circuit Analysis
            "academic_year": "2024-2025",
            "semester": "Fall",
            "credits": 4,
            "total_hours": 60,
            "learning_outcomes": """1. Analyze DC and AC circuits
2. Apply Kirchhoff's laws
3. Use network theorems
4. Understand circuit components
5. Simulate circuits using software""",
            "assessment_methods": """- Lab Reports: 25%
- Homework: 15%
- Midterm Exam: 25%
- Final Exam: 35%""",
            "textbooks": """1. "Engineering Circuit Analysis" by Hayt
2. "Electric Circuits" by Nilsson""",
            "teaching_methods": "Lectures, Lab experiments, Circuit simulations",
            "prerequisites": "Physics, Calculus",
            "materials": "Multimeter, Breadboard, Oscilloscope, LTSpice",
            "created_by": instructors[2].user_id,  # do.van.g
            "status": SyllabusStatus.APPROVED
        }
    ]

    syllabi = []
    for data in syllabi_data:
        syllabus = Syllabus(**data)
        db.add(syllabus)
        syllabi.append(syllabus)

    db.commit()
    for syllabus in syllabi:
        db.refresh(syllabus)

    print(f"Created {len(syllabi)} syllabi")
    return syllabi


def seed_syllabus_versions(db: Session, syllabi: list[Syllabus], users: list[User]) -> list[SyllabusVersion]:
    """Create sample syllabus versions"""
    print("Creating syllabus versions...")

    instructors = [u for u in users if u.role == UserRole.INSTRUCTOR]

    versions = []

    # Create versions for approved syllabi
    for syllabus in syllabi:
        if syllabus.status == SyllabusStatus.APPROVED:
            # Version 1 - Initial
            v1 = SyllabusVersion(
                syllabus_id=syllabus.syllabus_id,
                version_number=1,
                changes_summary="Initial version of the syllabus",
                content_json={
                    "academic_year": syllabus.academic_year,
                    "semester": syllabus.semester,
                    "credits": syllabus.credits,
                    "total_hours": syllabus.total_hours,
                    "learning_outcomes": syllabus.learning_outcomes,
                    "assessment_methods": syllabus.assessment_methods,
                    "textbooks": syllabus.textbooks,
                    "teaching_methods": syllabus.teaching_methods
                },
                created_by=syllabus.created_by,
                effective_date=date(2024, 8, 1),
                expiry_date=date(2025, 7, 31),
                is_current=False
            )
            db.add(v1)
            versions.append(v1)

            # Version 2 - Updated (current)
            v2 = SyllabusVersion(
                syllabus_id=syllabus.syllabus_id,
                version_number=2,
                changes_summary="Updated assessment methods and added new textbook reference",
                content_json={
                    "academic_year": syllabus.academic_year,
                    "semester": syllabus.semester,
                    "credits": syllabus.credits,
                    "total_hours": syllabus.total_hours,
                    "learning_outcomes": syllabus.learning_outcomes,
                    "assessment_methods": syllabus.assessment_methods,
                    "textbooks": syllabus.textbooks,
                    "teaching_methods": syllabus.teaching_methods,
                    "updates": ["Added online resources", "Updated grading scale"]
                },
                created_by=syllabus.created_by,
                effective_date=date(2024, 8, 15),
                expiry_date=None,
                is_current=True
            )
            db.add(v2)
            versions.append(v2)

    # Create a single version for pending/draft syllabi
    for syllabus in syllabi:
        if syllabus.status in [SyllabusStatus.PENDING_REVIEW, SyllabusStatus.DRAFT]:
            v = SyllabusVersion(
                syllabus_id=syllabus.syllabus_id,
                version_number=1,
                changes_summary="Initial draft version",
                content_json={
                    "academic_year": syllabus.academic_year,
                    "semester": syllabus.semester,
                    "credits": syllabus.credits,
                    "total_hours": syllabus.total_hours,
                    "learning_outcomes": syllabus.learning_outcomes,
                    "assessment_methods": syllabus.assessment_methods
                },
                created_by=syllabus.created_by,
                effective_date=None,
                expiry_date=None,
                is_current=True
            )
            db.add(v)
            versions.append(v)

    db.commit()
    for v in versions:
        db.refresh(v)

    # Update syllabi with current version_id
    for syllabus in syllabi:
        current_version = next((v for v in versions if v.syllabus_id == syllabus.syllabus_id and v.is_current), None)
        if current_version:
            syllabus.version_id = current_version.version_id
    db.commit()

    print(f"Created {len(versions)} syllabus versions")
    return versions


def seed_approval_history(db: Session, syllabi: list[Syllabus], versions: list[SyllabusVersion], users: list[User]) -> list[ApprovalHistory]:
    """Create sample approval history"""
    print("Creating approval history...")

    # Get users by role
    hod = next(u for u in users if u.role == UserRole.DEPARTMENT_HEAD)
    reviewer = next(u for u in users if u.role == UserRole.REVIEWER)
    instructors = [u for u in users if u.role == UserRole.INSTRUCTOR]

    approvals = []

    for syllabus in syllabi:
        current_version = next((v for v in versions if v.syllabus_id == syllabus.syllabus_id and v.is_current), None)

        if syllabus.status == SyllabusStatus.APPROVED:
            # Submitted by instructor
            a1 = ApprovalHistory(
                syllabus_id=syllabus.syllabus_id,
                version_id=current_version.version_id if current_version else None,
                approver_id=syllabus.created_by,
                approver_role="Instructor",
                action=ApprovalAction.SUBMITTED,
                comments="Submitting for department review",
                review_date=datetime.now() - timedelta(days=30),
                deadline=date.today() - timedelta(days=23),
                next_approver_id=hod.user_id,
                is_completed=True
            )
            db.add(a1)
            approvals.append(a1)

            # Reviewed by HoD
            a2 = ApprovalHistory(
                syllabus_id=syllabus.syllabus_id,
                version_id=current_version.version_id if current_version else None,
                approver_id=hod.user_id,
                approver_role="Department Head",
                action=ApprovalAction.REVIEWED,
                comments="Reviewed and approved at department level. Forwarding to Academic Affairs.",
                review_date=datetime.now() - timedelta(days=25),
                deadline=date.today() - timedelta(days=18),
                next_approver_id=reviewer.user_id,
                is_completed=True
            )
            db.add(a2)
            approvals.append(a2)

            # Final approval by Academic Affairs
            a3 = ApprovalHistory(
                syllabus_id=syllabus.syllabus_id,
                version_id=current_version.version_id if current_version else None,
                approver_id=reviewer.user_id,
                approver_role="Academic Affairs",
                action=ApprovalAction.APPROVED,
                comments="Final approval granted. Syllabus is ready for publication.",
                review_date=datetime.now() - timedelta(days=20),
                deadline=None,
                next_approver_id=None,
                is_completed=True
            )
            db.add(a3)
            approvals.append(a3)

        elif syllabus.status == SyllabusStatus.PENDING_REVIEW:
            # Submitted and waiting for HoD review
            a1 = ApprovalHistory(
                syllabus_id=syllabus.syllabus_id,
                version_id=current_version.version_id if current_version else None,
                approver_id=syllabus.created_by,
                approver_role="Instructor",
                action=ApprovalAction.SUBMITTED,
                comments="Submitting new syllabus for review",
                review_date=datetime.now() - timedelta(days=5),
                deadline=date.today() + timedelta(days=7),
                next_approver_id=hod.user_id,
                is_completed=False
            )
            db.add(a1)
            approvals.append(a1)

    db.commit()
    for a in approvals:
        db.refresh(a)

    print(f"Created {len(approvals)} approval history records")
    return approvals


def seed_all(db: Session):
    """Seed all data in correct order"""
    print("\n" + "="*50)
    print("Starting seed data creation...")
    print("="*50 + "\n")

    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)

    # Seed in order of dependencies
    departments = seed_departments(db)
    users = seed_users(db, departments)
    programs = seed_programs(db, departments, users)
    courses = seed_courses(db, departments, programs)
    syllabi = seed_syllabi(db, courses, users)
    versions = seed_syllabus_versions(db, syllabi, users)
    approvals = seed_approval_history(db, syllabi, versions, users)

    print("\n" + "="*50)
    print("Seed data creation completed!")
    print("="*50)
    print("\nSummary:")
    print(f"  - Departments: {len(departments)}")
    print(f"  - Users: {len(users)}")
    print(f"  - Programs: {len(programs)}")
    print(f"  - Courses: {len(courses)}")
    print(f"  - Syllabi: {len(syllabi)}")
    print(f"  - Syllabus Versions: {len(versions)}")
    print(f"  - Approval History: {len(approvals)}")

    print("\n" + "-"*50)
    print("Test Accounts:")
    print("-"*50)
    print("Admin:           admin / admin123")
    print("Dept Head (CS):  nguyen.van.a / password123")
    print("Dept Head (EE):  tran.thi.b / password123")
    print("Coordinator:     le.van.c / password123")
    print("Instructor:      hoang.van.e / password123")
    print("Reviewer:        bui.thi.h / password123")
    print("Student:         student1 / student123")
    print("-"*50 + "\n")


def main():
    parser = argparse.ArgumentParser(description="SMD System Seed Data")
    parser.add_argument("--truncate", action="store_true", help="Truncate all tables before seeding")
    parser.add_argument("--truncate-only", action="store_true", help="Only truncate tables, don't seed")
    args = parser.parse_args()

    db = SessionLocal()

    try:
        if args.truncate or args.truncate_only:
            truncate_all_tables(db)

        if not args.truncate_only:
            seed_all(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
