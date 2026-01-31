#!/usr/bin/env python3
"""
Seed Supabase database with sample data.

Usage:
    python scripts/seed_supabase.py
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

# Load .env from src directory
from dotenv import load_dotenv
env_path = os.path.join(os.path.dirname(__file__), '..', 'src', '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
    print(f"Loaded .env from: {env_path}")

from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, engine, Base
from app.models import (
    User, UserRole, Department, Program, DegreeType, Course, Syllabus, SyllabusStatus,
    AcademicYear, Semester, SubmissionPeriod, ReviewSchedule, ReviewerAssignment,
    EvaluationTemplate, EvaluationCriteria, CriteriaCategory, TemplateProgram
)


def clear_all_data(db: Session):
    """Clear all existing data from the database"""
    print("   Clearing existing data...")

    # All tables to clear
    tables_to_clear = [
        # Lecturer module related
        "peer_evaluation_scores",
        "peer_evaluations",
        "message_attachments",
        "messages",
        "syllabus_comments",
        "syllabus_references",
        "assessment_clo_mapping",
        "syllabus_assessments",
        "content_clo_mapping",
        "syllabus_contents",
        "clo_plo_mapping",
        "syllabus_clos",
        # Import
        "import_errors",
        "import_logs",
        # Notifications
        "auto_reminder_configs",
        "notification_templates",
        "notification_recipients",
        "notifications",
        # Update requests
        "evaluation_results",
        "update_requests",
        # Evaluation
        "template_programs",
        "criteria_plo_mappings",
        "evaluation_criteria",
        "evaluation_templates",
        # Review
        "reviewer_assignments",
        "review_schedules",
        # Academic
        "submission_periods",
        "semesters",
        "academic_years",
        # Approval
        "approval_history",
        # Syllabus
        "syllabus_versions",
        "syllabi",
        # Core
        "courses",
        "programs",
        "users",
        "departments",
    ]

    from sqlalchemy import text

    # Use raw connection to disable foreign key checks
    connection = db.get_bind().connect()
    try:
        # Disable foreign key checks for PostgreSQL
        connection.execute(text("SET session_replication_role = 'replica'"))
        connection.commit()

        for table in tables_to_clear:
            try:
                connection.execute(text(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE"))
                connection.commit()
            except Exception as e:
                connection.rollback()
                # Table might not exist, skip
                pass

        # Re-enable foreign key checks
        connection.execute(text("SET session_replication_role = 'origin'"))
        connection.commit()
    finally:
        connection.close()

    print("   All existing data cleared!")


def seed_departments(db: Session):
    """Seed departments with Vietnamese names"""
    departments = [
        {
            "dept_code": "CNTT",
            "dept_name": "Information Technology",
            "dept_name_vn": "Khoa Công nghệ Thông tin",
            "email": "cntt@ut.edu.vn",
            "phone": "028-1234-5678",
            "office_location": "Building A, Room 101",
            "established_year": 2000
        },
        {
            "dept_code": "DTVT",
            "dept_name": "Electronics and Telecommunications",
            "dept_name_vn": "Khoa Điện tử Viễn thông",
            "email": "dtvt@ut.edu.vn",
            "phone": "028-1234-5679",
            "office_location": "Building B, Room 201",
            "established_year": 1998
        },
        {
            "dept_code": "KTCK",
            "dept_name": "Mechanical Engineering",
            "dept_name_vn": "Khoa Kỹ thuật Cơ khí",
            "email": "ktck@ut.edu.vn",
            "phone": "028-1234-5680",
            "office_location": "Building C, Room 301",
            "established_year": 1995
        },
        {
            "dept_code": "QTKD",
            "dept_name": "Business Administration",
            "dept_name_vn": "Khoa Quản trị Kinh doanh",
            "email": "qtkd@ut.edu.vn",
            "phone": "028-1234-5681",
            "office_location": "Building D, Room 401",
            "established_year": 2005
        },
        {
            "dept_code": "NNAH",
            "dept_name": "Foreign Languages",
            "dept_name_vn": "Khoa Ngoại ngữ Ứng dụng",
            "email": "nnah@ut.edu.vn",
            "phone": "028-1234-5682",
            "office_location": "Building E, Room 501",
            "established_year": 2010
        },
    ]

    for dept_data in departments:
        existing = db.query(Department).filter(Department.dept_code == dept_data["dept_code"]).first()
        if not existing:
            dept = Department(**dept_data)
            db.add(dept)
            print(f"   Added department: {dept_data['dept_name']} ({dept_data['dept_name_vn']})")

    db.commit()
    return db.query(Department).all()


def seed_users(db: Session, departments: list):
    """Seed users with Vietnamese names"""
    cntt_dept = next((d for d in departments if d.dept_code == "CNTT"), None)
    dtvt_dept = next((d for d in departments if d.dept_code == "DTVT"), None)
    qtkd_dept = next((d for d in departments if d.dept_code == "QTKD"), None)

    users = [
        # Admin - Real user (Firebase)
        {
            "username": "thaopw",
            "email": "thaopw@gmail.com",
            "first_name": "Thao",
            "last_name": "Pham",
            "role": UserRole.ADMIN,
            "department_id": None,
            "firebase_uid": "uKfgyyphGzfKJwQl4p0HDyKFdE53",  # From Firebase token
        },
        # Admin - System
        {
            "username": "admin",
            "email": "admin@ut.edu.vn",
            "first_name": "Quản trị",
            "last_name": "Hệ thống",
            "role": UserRole.ADMIN,
            "department_id": None,
            "firebase_uid": None,
        },
        # HOD - Head of Department
        {
            "username": "truongkhoa_cntt",
            "email": "truongkhoa.cntt@ut.edu.vn",
            "first_name": "Nguyễn",
            "last_name": "Văn Trường",
            "role": UserRole.HOD,
            "department_id": cntt_dept.dept_id if cntt_dept else None,
            "faculty_position": "Trưởng khoa",
            "phone": "0901-234-567",
            "firebase_uid": None,
        },
        {
            "username": "truongkhoa_dtvt",
            "email": "truongkhoa.dtvt@ut.edu.vn",
            "first_name": "Trần",
            "last_name": "Thị Hương",
            "role": UserRole.HOD,
            "department_id": dtvt_dept.dept_id if dtvt_dept else None,
            "faculty_position": "Trưởng khoa",
            "phone": "0901-234-568",
            "firebase_uid": None,
        },
        # Lecturers - Giảng viên
        {
            "username": "giangvien01",
            "email": "giangvien01@ut.edu.vn",
            "first_name": "Lê",
            "last_name": "Thị Lan",
            "role": UserRole.LECTURER,
            "department_id": cntt_dept.dept_id if cntt_dept else None,
            "faculty_position": "Giảng viên chính",
            "phone": "0902-345-678",
            "firebase_uid": None,
        },
        {
            "username": "giangvien02",
            "email": "giangvien02@ut.edu.vn",
            "first_name": "Phạm",
            "last_name": "Văn Minh",
            "role": UserRole.LECTURER,
            "department_id": cntt_dept.dept_id if cntt_dept else None,
            "faculty_position": "Giảng viên",
            "phone": "0902-345-679",
            "firebase_uid": None,
        },
        {
            "username": "giangvien03",
            "email": "giangvien03@ut.edu.vn",
            "first_name": "Hoàng",
            "last_name": "Thị Mai",
            "role": UserRole.LECTURER,
            "department_id": dtvt_dept.dept_id if dtvt_dept else None,
            "faculty_position": "Giảng viên",
            "phone": "0902-345-680",
            "firebase_uid": None,
        },
        # Academic Affairs - Phòng đào tạo
        {
            "username": "daotao01",
            "email": "daotao01@ut.edu.vn",
            "first_name": "Võ",
            "last_name": "Thị Hoa",
            "role": UserRole.ACADEMIC_AFFAIRS,
            "department_id": None,
            "faculty_position": "Chuyên viên đào tạo",
            "phone": "0903-456-789",
            "firebase_uid": None,
        },
        {
            "username": "daotao02",
            "email": "daotao02@ut.edu.vn",
            "first_name": "Đặng",
            "last_name": "Văn Tâm",
            "role": UserRole.ACADEMIC_AFFAIRS,
            "department_id": None,
            "faculty_position": "Trưởng phòng đào tạo",
            "phone": "0903-456-790",
            "firebase_uid": None,
        },
        # Principal - Hiệu trưởng
        {
            "username": "hieutruong",
            "email": "hieutruong@ut.edu.vn",
            "first_name": "Bùi",
            "last_name": "Văn Đức",
            "role": UserRole.PRINCIPAL,
            "department_id": None,
            "faculty_position": "Hiệu trưởng",
            "phone": "0904-567-890",
            "firebase_uid": None,
        },
        # Students - Sinh viên
        {
            "username": "sinhvien01",
            "email": "sinhvien01@ut.edu.vn",
            "first_name": "Ngô",
            "last_name": "Văn Nam",
            "role": UserRole.STUDENT,
            "department_id": cntt_dept.dept_id if cntt_dept else None,
            "firebase_uid": None,
        },
        {
            "username": "sinhvien02",
            "email": "sinhvien02@ut.edu.vn",
            "first_name": "Đinh",
            "last_name": "Thị Hồng",
            "role": UserRole.STUDENT,
            "department_id": cntt_dept.dept_id if cntt_dept else None,
            "firebase_uid": None,
        },
    ]

    for user_data in users:
        existing = db.query(User).filter(User.email == user_data["email"]).first()
        if not existing:
            user = User(**user_data)
            db.add(user)
            print(f"   Added user: {user_data['email']} ({user_data['role'].value})")

    db.commit()
    return db.query(User).all()


def seed_programs(db: Session, departments: list):
    """Seed programs with Vietnamese names"""
    cntt_dept = next((d for d in departments if d.dept_code == "CNTT"), None)
    dtvt_dept = next((d for d in departments if d.dept_code == "DTVT"), None)
    qtkd_dept = next((d for d in departments if d.dept_code == "QTKD"), None)

    programs = [
        {
            "program_code": "CNTT-DH",
            "program_name": "Bachelor of Information Technology",
            "program_name_vn": "Cử nhân Công nghệ Thông tin",
            "department_id": cntt_dept.dept_id if cntt_dept else None,
            "degree_type": DegreeType.BACHELOR,
            "duration_years": 4,
            "total_credits": 130,
            "description": "Chương trình đào tạo cử nhân Công nghệ Thông tin, cung cấp kiến thức toàn diện về lập trình, cơ sở dữ liệu, mạng máy tính và phát triển phần mềm."
        },
        {
            "program_code": "CNTT-THS",
            "program_name": "Master of Information Technology",
            "program_name_vn": "Thạc sĩ Công nghệ Thông tin",
            "department_id": cntt_dept.dept_id if cntt_dept else None,
            "degree_type": DegreeType.MASTER,
            "duration_years": 2,
            "total_credits": 60,
            "description": "Chương trình đào tạo thạc sĩ Công nghệ Thông tin, chuyên sâu về trí tuệ nhân tạo, khoa học dữ liệu và bảo mật thông tin."
        },
        {
            "program_code": "DTVT-DH",
            "program_name": "Bachelor of Electronics and Telecommunications",
            "program_name_vn": "Cử nhân Điện tử Viễn thông",
            "department_id": dtvt_dept.dept_id if dtvt_dept else None,
            "degree_type": DegreeType.BACHELOR,
            "duration_years": 4,
            "total_credits": 135,
            "description": "Chương trình đào tạo cử nhân Điện tử Viễn thông, tập trung vào thiết kế mạch điện tử, hệ thống nhúng và công nghệ viễn thông."
        },
        {
            "program_code": "QTKD-DH",
            "program_name": "Bachelor of Business Administration",
            "program_name_vn": "Cử nhân Quản trị Kinh doanh",
            "department_id": qtkd_dept.dept_id if qtkd_dept else None,
            "degree_type": DegreeType.BACHELOR,
            "duration_years": 4,
            "total_credits": 125,
            "description": "Chương trình đào tạo cử nhân Quản trị Kinh doanh, cung cấp kiến thức về quản lý, marketing, tài chính và khởi nghiệp."
        },
    ]

    for prog_data in programs:
        existing = db.query(Program).filter(Program.program_code == prog_data["program_code"]).first()
        if not existing:
            prog = Program(**prog_data)
            db.add(prog)
            print(f"   Added program: {prog_data['program_name']} ({prog_data['program_name_vn']})")

    db.commit()
    return db.query(Program).all()


def seed_courses(db: Session, departments: list, programs: list):
    """Seed courses with Vietnamese names"""
    cntt_dept = next((d for d in departments if d.dept_code == "CNTT"), None)
    dtvt_dept = next((d for d in departments if d.dept_code == "DTVT"), None)
    qtkd_dept = next((d for d in departments if d.dept_code == "QTKD"), None)

    cntt_program = next((p for p in programs if p.program_code == "CNTT-DH"), None)
    dtvt_program = next((p for p in programs if p.program_code == "DTVT-DH"), None)
    qtkd_program = next((p for p in programs if p.program_code == "QTKD-DH"), None)

    courses = [
        # IT Courses
        {
            "course_code": "IT101",
            "course_name": "Introduction to Programming",
            "course_name_vn": "Nhập môn Lập trình",
            "department_id": cntt_dept.dept_id if cntt_dept else None,
            "program_id": cntt_program.program_id if cntt_program else None,
            "description": "Giới thiệu các khái niệm cơ bản về lập trình, thuật toán và cấu trúc dữ liệu cơ bản sử dụng ngôn ngữ Python.",
            "is_elective": False,
            "min_students": 30,
            "max_students": 60
        },
        {
            "course_code": "IT102",
            "course_name": "Data Structures and Algorithms",
            "course_name_vn": "Cấu trúc Dữ liệu và Giải thuật",
            "department_id": cntt_dept.dept_id if cntt_dept else None,
            "program_id": cntt_program.program_id if cntt_program else None,
            "description": "Học về các cấu trúc dữ liệu (mảng, danh sách liên kết, cây, đồ thị) và các thuật toán sắp xếp, tìm kiếm.",
            "is_elective": False,
            "min_students": 25,
            "max_students": 50
        },
        {
            "course_code": "IT201",
            "course_name": "Object-Oriented Programming",
            "course_name_vn": "Lập trình Hướng đối tượng",
            "department_id": cntt_dept.dept_id if cntt_dept else None,
            "program_id": cntt_program.program_id if cntt_program else None,
            "description": "Các nguyên lý lập trình hướng đối tượng: đóng gói, kế thừa, đa hình. Thực hành với Java/C++.",
            "is_elective": False,
            "min_students": 25,
            "max_students": 50
        },
        {
            "course_code": "IT301",
            "course_name": "Database Systems",
            "course_name_vn": "Hệ quản trị Cơ sở dữ liệu",
            "department_id": cntt_dept.dept_id if cntt_dept else None,
            "program_id": cntt_program.program_id if cntt_program else None,
            "description": "Thiết kế cơ sở dữ liệu, ngôn ngữ SQL, tối ưu hóa truy vấn và quản lý giao dịch.",
            "is_elective": False,
            "min_students": 25,
            "max_students": 50
        },
        {
            "course_code": "IT302",
            "course_name": "Software Engineering",
            "course_name_vn": "Công nghệ Phần mềm",
            "department_id": cntt_dept.dept_id if cntt_dept else None,
            "program_id": cntt_program.program_id if cntt_program else None,
            "description": "Quy trình phát triển phần mềm, phân tích yêu cầu, thiết kế hệ thống, kiểm thử và bảo trì.",
            "is_elective": False,
            "min_students": 25,
            "max_students": 50
        },
        {
            "course_code": "IT401",
            "course_name": "Machine Learning",
            "course_name_vn": "Học máy",
            "department_id": cntt_dept.dept_id if cntt_dept else None,
            "program_id": cntt_program.program_id if cntt_program else None,
            "description": "Các thuật toán học máy: hồi quy, phân loại, clustering, mạng neural. Thực hành với Python và TensorFlow.",
            "is_elective": True,
            "min_students": 20,
            "max_students": 40
        },
        {
            "course_code": "IT402",
            "course_name": "Web Development",
            "course_name_vn": "Phát triển Ứng dụng Web",
            "department_id": cntt_dept.dept_id if cntt_dept else None,
            "program_id": cntt_program.program_id if cntt_program else None,
            "description": "Phát triển ứng dụng web full-stack: HTML, CSS, JavaScript, React, Node.js và cơ sở dữ liệu.",
            "is_elective": True,
            "min_students": 20,
            "max_students": 40
        },
        {
            "course_code": "IT403",
            "course_name": "Mobile Application Development",
            "course_name_vn": "Phát triển Ứng dụng Di động",
            "department_id": cntt_dept.dept_id if cntt_dept else None,
            "program_id": cntt_program.program_id if cntt_program else None,
            "description": "Phát triển ứng dụng di động đa nền tảng với Flutter/React Native.",
            "is_elective": True,
            "min_students": 20,
            "max_students": 40
        },
        # Electronics Courses
        {
            "course_code": "ET101",
            "course_name": "Digital Electronics",
            "course_name_vn": "Điện tử Số",
            "department_id": dtvt_dept.dept_id if dtvt_dept else None,
            "program_id": dtvt_program.program_id if dtvt_program else None,
            "description": "Các cổng logic, mạch tổ hợp, mạch tuần tự và thiết kế hệ thống số.",
            "is_elective": False,
            "min_students": 25,
            "max_students": 50
        },
        {
            "course_code": "ET201",
            "course_name": "Embedded Systems",
            "course_name_vn": "Hệ thống Nhúng",
            "department_id": dtvt_dept.dept_id if dtvt_dept else None,
            "program_id": dtvt_program.program_id if dtvt_program else None,
            "description": "Lập trình vi điều khiển, thiết kế hệ thống nhúng và giao tiếp phần cứng.",
            "is_elective": False,
            "min_students": 20,
            "max_students": 40
        },
        # Business Courses
        {
            "course_code": "BA101",
            "course_name": "Principles of Management",
            "course_name_vn": "Nguyên lý Quản lý",
            "department_id": qtkd_dept.dept_id if qtkd_dept else None,
            "program_id": qtkd_program.program_id if qtkd_program else None,
            "description": "Các nguyên lý cơ bản về quản lý: lập kế hoạch, tổ chức, lãnh đạo và kiểm soát.",
            "is_elective": False,
            "min_students": 30,
            "max_students": 60
        },
        {
            "course_code": "BA201",
            "course_name": "Marketing Management",
            "course_name_vn": "Quản trị Marketing",
            "department_id": qtkd_dept.dept_id if qtkd_dept else None,
            "program_id": qtkd_program.program_id if qtkd_program else None,
            "description": "Chiến lược marketing, nghiên cứu thị trường, hành vi người tiêu dùng và marketing số.",
            "is_elective": False,
            "min_students": 25,
            "max_students": 50
        },
    ]

    for course_data in courses:
        existing = db.query(Course).filter(Course.course_code == course_data["course_code"]).first()
        if not existing:
            course = Course(**course_data)
            db.add(course)
            print(f"   Added course: {course_data['course_code']} - {course_data['course_name']} ({course_data['course_name_vn']})")

    db.commit()
    return db.query(Course).all()


def seed_academic_years(db: Session):
    """Seed academic years and semesters"""
    academic_years_data = [
        {
            "name": "2024-2025",
            "start_date": date(2024, 9, 1),
            "end_date": date(2025, 8, 31),
            "is_active": True,
            "semesters": [
                {"name": "Học kỳ 1", "start_date": date(2024, 9, 1), "end_date": date(2024, 12, 31), "is_active": True},
                {"name": "Học kỳ 2", "start_date": date(2025, 1, 15), "end_date": date(2025, 5, 31), "is_active": False},
                {"name": "Học kỳ Hè", "start_date": date(2025, 6, 1), "end_date": date(2025, 8, 15), "is_active": False},
            ]
        },
        {
            "name": "2025-2026",
            "start_date": date(2025, 9, 1),
            "end_date": date(2026, 8, 31),
            "is_active": False,
            "semesters": [
                {"name": "Học kỳ 1", "start_date": date(2025, 9, 1), "end_date": date(2025, 12, 31), "is_active": False},
                {"name": "Học kỳ 2", "start_date": date(2026, 1, 15), "end_date": date(2026, 5, 31), "is_active": False},
                {"name": "Học kỳ Hè", "start_date": date(2026, 6, 1), "end_date": date(2026, 8, 15), "is_active": False},
            ]
        },
    ]

    created_years = []
    for ay_data in academic_years_data:
        existing = db.query(AcademicYear).filter(AcademicYear.name == ay_data["name"]).first()
        if existing:
            created_years.append(existing)
            continue

        semesters_data = ay_data.pop("semesters")
        ay = AcademicYear(**ay_data)
        db.add(ay)
        db.flush()

        for sem_data in semesters_data:
            sem = Semester(academic_year_id=ay.academic_year_id, **sem_data)
            db.add(sem)
            print(f"   Added semester: {sem_data['name']} ({ay_data['name']})")

        print(f"   Added academic year: {ay_data['name']}")
        created_years.append(ay)

    db.commit()
    return created_years


def seed_submission_periods(db: Session):
    """Seed submission periods for all semesters"""
    semesters = db.query(Semester).all()
    if not semesters:
        print("   No semesters found, skipping submission periods")
        return []

    created_periods = []
    for semester in semesters:
        # Get academic year for this semester
        ay = db.query(AcademicYear).filter(AcademicYear.academic_year_id == semester.academic_year_id).first()
        if not ay:
            continue

        # Calculate submission period dates based on semester dates
        # Period 1: First 6 weeks of semester
        period1_start = semester.start_date
        period1_end = semester.start_date + timedelta(days=42)

        # Period 2: Supplementary submission (week 8-10)
        period2_start = semester.start_date + timedelta(days=56)
        period2_end = semester.start_date + timedelta(days=70)

        periods_data = [
            {
                "semester_id": semester.semester_id,
                "submission_start": period1_start,
                "submission_end": period1_end,
                "description": f"Đợt nộp đề cương chính {semester.name} {ay.name}",
                "is_open": semester.is_active  # Only open if semester is active
            },
            {
                "semester_id": semester.semester_id,
                "submission_start": period2_start,
                "submission_end": period2_end,
                "description": f"Đợt nộp đề cương bổ sung {semester.name} {ay.name}",
                "is_open": False
            },
        ]

        for period_data in periods_data:
            existing = db.query(SubmissionPeriod).filter(
                SubmissionPeriod.semester_id == period_data["semester_id"],
                SubmissionPeriod.submission_start == period_data["submission_start"]
            ).first()
            if not existing:
                period = SubmissionPeriod(**period_data)
                db.add(period)
                created_periods.append(period)
                print(f"   Added submission period: {period_data['description']}")

    db.commit()
    return created_periods


def seed_evaluation_templates(db: Session, users: list):
    """Seed default evaluation template with Vietnamese criteria"""
    admin = next((u for u in users if u.role == UserRole.ADMIN), None)

    existing = db.query(EvaluationTemplate).filter(EvaluationTemplate.is_default == True).first()
    if existing:
        return existing

    template = EvaluationTemplate(
        name="Mẫu đánh giá Đề cương Chuẩn",
        description="Mẫu đánh giá chuẩn cho việc thẩm định đề cương chi tiết học phần theo quy định của Bộ GD&ĐT.",
        is_default=True,
        is_active=True,
        created_by=admin.user_id if admin else None
    )
    db.add(template)
    db.flush()

    criteria = [
        {
            "name": "Mục tiêu học phần",
            "description": "Đánh giá tính rõ ràng, cụ thể và khả thi của mục tiêu học phần",
            "category": CriteriaCategory.CONTENT,
            "weight": 15,
            "max_score": 5,
            "is_mandatory": True,
            "display_order": 1
        },
        {
            "name": "Chuẩn đầu ra (CLO)",
            "description": "Đánh giá sự liên kết giữa chuẩn đầu ra học phần với chuẩn đầu ra chương trình (PLO)",
            "category": CriteriaCategory.CONTENT,
            "weight": 20,
            "max_score": 5,
            "is_mandatory": True,
            "display_order": 2
        },
        {
            "name": "Nội dung chi tiết",
            "description": "Đánh giá độ bao phủ, tính cập nhật và logic của nội dung học phần",
            "category": CriteriaCategory.CONTENT,
            "weight": 20,
            "max_score": 5,
            "is_mandatory": True,
            "display_order": 3
        },
        {
            "name": "Phương pháp đánh giá",
            "description": "Đánh giá tính phù hợp của phương pháp kiểm tra, đánh giá với CLO",
            "category": CriteriaCategory.QUALITY,
            "weight": 15,
            "max_score": 5,
            "is_mandatory": True,
            "display_order": 4
        },
        {
            "name": "Tài liệu tham khảo",
            "description": "Đánh giá chất lượng, tính cập nhật của tài liệu giáo trình và tham khảo",
            "category": CriteriaCategory.QUALITY,
            "weight": 10,
            "max_score": 5,
            "is_mandatory": True,
            "display_order": 5
        },
        {
            "name": "Định dạng và trình bày",
            "description": "Đánh giá việc tuân thủ mẫu đề cương theo quy định",
            "category": CriteriaCategory.FORMAT,
            "weight": 10,
            "max_score": 5,
            "is_mandatory": True,
            "display_order": 6
        },
        {
            "name": "Chất lượng tổng thể",
            "description": "Đánh giá tổng quan chất lượng đề cương và khả năng áp dụng thực tế",
            "category": CriteriaCategory.QUALITY,
            "weight": 10,
            "max_score": 5,
            "is_mandatory": True,
            "display_order": 7
        },
    ]

    for crit_data in criteria:
        crit = EvaluationCriteria(template_id=template.template_id, **crit_data)
        db.add(crit)

    db.commit()
    print(f"   Added evaluation template: {template.name} with {len(criteria)} criteria")
    return template


def seed_review_schedules(db: Session, users: list, departments: list):
    """Seed review schedules and reviewer assignments"""
    # Get semesters with their academic years
    semesters = db.query(Semester).all()
    if not semesters:
        print("   No semesters found, skipping review schedules")
        return []

    admin = next((u for u in users if u.role == UserRole.ADMIN), None)
    hods = [u for u in users if u.role == UserRole.HOD]
    aa_staff = [u for u in users if u.role == UserRole.ACADEMIC_AFFAIRS]

    created_schedules = []

    # Create review schedule for each semester
    for semester in semesters:
        # Get the academic year name
        ay = db.query(AcademicYear).filter(AcademicYear.academic_year_id == semester.academic_year_id).first()
        if not ay:
            continue

        # Determine schedule dates based on semester dates
        review_start = semester.start_date + timedelta(days=45)  # Start review 45 days into semester
        l1_deadline = review_start + timedelta(days=14)  # HoD has 2 weeks
        l2_deadline = l1_deadline + timedelta(days=14)  # AA has 2 weeks
        final_approval = l2_deadline + timedelta(days=14)  # Final approval 2 weeks after

        schedule_name = f"Lịch thẩm định đề cương {semester.name} {ay.name}"

        # Check if already exists
        existing = db.query(ReviewSchedule).filter(
            ReviewSchedule.semester_id == semester.semester_id
        ).first()
        if existing:
            created_schedules.append(existing)
            continue

        # Determine if this schedule should be active (only for active semester)
        is_active = semester.is_active

        schedule = ReviewSchedule(
            name=schedule_name,
            semester_id=semester.semester_id,
            review_start=review_start,
            l1_deadline=l1_deadline,
            l2_deadline=l2_deadline,
            final_approval=final_approval,
            is_active=is_active,
            created_by=admin.user_id if admin else None
        )
        db.add(schedule)
        db.flush()
        created_schedules.append(schedule)
        print(f"   Added review schedule: {schedule.name}")

        # Create reviewer assignments for this schedule
        # Assign HoDs (Level 1 reviewers) to their departments
        for hod in hods:
            if hod.department_id:
                assignment = ReviewerAssignment(
                    schedule_id=schedule.schedule_id,
                    reviewer_id=hod.user_id,
                    department_id=hod.department_id,
                    review_level=1,  # HoD level
                    is_primary=True,
                    assigned_by=admin.user_id if admin else None
                )
                db.add(assignment)
                print(f"      Assigned HoD reviewer: {hod.full_name} (Level 1)")

        # Assign Academic Affairs staff (Level 2 reviewers) - all departments
        for aa in aa_staff:
            for dept in departments:
                assignment = ReviewerAssignment(
                    schedule_id=schedule.schedule_id,
                    reviewer_id=aa.user_id,
                    department_id=dept.dept_id,
                    review_level=2,  # Academic Affairs level
                    is_primary=True,
                    assigned_by=admin.user_id if admin else None
                )
                db.add(assignment)
            print(f"      Assigned AA reviewer: {aa.full_name} (Level 2, all departments)")

    db.commit()
    return created_schedules


def seed_template_programs(db: Session, programs: list):
    """Link evaluation templates to programs"""
    template = db.query(EvaluationTemplate).filter(EvaluationTemplate.is_default == True).first()
    if not template:
        print("   No default template found, skipping template-program links")
        return

    for program in programs:
        existing = db.query(TemplateProgram).filter(
            TemplateProgram.template_id == template.template_id,
            TemplateProgram.program_id == program.program_id
        ).first()
        if not existing:
            tp = TemplateProgram(
                template_id=template.template_id,
                program_id=program.program_id
            )
            db.add(tp)
            print(f"   Linked template to program: {program.program_code}")

    db.commit()


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Seed Supabase database with sample data")
    parser.add_argument(
        "--clear", "-c",
        action="store_true",
        help="Clear all existing data before seeding"
    )
    args = parser.parse_args()

    print("=" * 70)
    print("SMD System - Seed Database with Vietnamese Data")
    print("=" * 70)

    db = SessionLocal()

    try:
        if args.clear:
            print("\n0. Clearing existing data...")
            clear_all_data(db)

        print("\n1. Seeding departments...")
        departments = seed_departments(db)

        print("\n2. Seeding users...")
        users = seed_users(db, departments)

        print("\n3. Seeding programs...")
        programs = seed_programs(db, departments)

        print("\n4. Seeding courses...")
        courses = seed_courses(db, departments, programs)

        print("\n5. Seeding academic years and semesters...")
        academic_years = seed_academic_years(db)

        print("\n6. Seeding submission periods...")
        submission_periods = seed_submission_periods(db)

        print("\n7. Seeding evaluation templates...")
        seed_evaluation_templates(db, users)

        print("\n8. Seeding template-program links...")
        seed_template_programs(db, programs)

        print("\n9. Seeding review schedules and assignments...")
        seed_review_schedules(db, users, departments)

        print("\n" + "=" * 70)
        print("Seed data complete!")
        print("=" * 70)

        # Summary
        print(f"\nSummary:")
        print(f"  - Departments: {db.query(Department).count()}")
        print(f"  - Users: {db.query(User).count()}")
        print(f"  - Programs: {db.query(Program).count()}")
        print(f"  - Courses: {db.query(Course).count()}")
        print(f"  - Academic Years: {db.query(AcademicYear).count()}")
        print(f"  - Semesters: {db.query(Semester).count()}")
        print(f"  - Submission Periods: {db.query(SubmissionPeriod).count()}")
        print(f"  - Evaluation Templates: {db.query(EvaluationTemplate).count()}")
        print(f"  - Evaluation Criteria: {db.query(EvaluationCriteria).count()}")
        print(f"  - Template-Program Links: {db.query(TemplateProgram).count()}")
        print(f"  - Review Schedules: {db.query(ReviewSchedule).count()}")
        print(f"  - Reviewer Assignments: {db.query(ReviewerAssignment).count()}")

    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return 1
    finally:
        db.close()

    return 0


if __name__ == "__main__":
    sys.exit(main())
