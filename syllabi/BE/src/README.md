# SMD - Syllabus Management and Digitalization System API

A FastAPI-based REST API for managing university syllabi, courses, and academic programs.

## Features

- **Authentication**: JWT-based authentication with role-based access control
- **User Management**: CRUD operations for user accounts (Admin only)
- **Department Management**: Manage academic departments
- **Program Management**: Manage academic programs/degrees
- **Course Management**: Manage courses offered by the university
- **Syllabus Management**: Create, edit, submit, and manage syllabi
- **Version Control**: Track syllabus versions and changes
- **Approval Workflow**: Multi-level approval process (HoD → Academic Affairs)

## Project Structure

```
src/
├── app/
│   ├── core/           # Configuration, database, security
│   ├── models/         # SQLAlchemy ORM models
│   ├── schemas/        # Pydantic schemas (request/response)
│   ├── routers/        # API endpoints
│   ├── services/       # Business logic
│   └── main.py         # FastAPI application
├── requirements.txt
└── README.md
```

## Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt
```

## Configuration

Create a `.env` file in the `src` directory:

```env
DATABASE_URL=mysql+pymysql://user:password@localhost:3306/smd_db
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
DEBUG=True
```

## Running the Application

```bash
cd src
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

Once running, access:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## API Endpoints Summary

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Users (Admin only)
- `GET /api/users` - List all users
- `GET /api/users/{id}` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user
- `PUT /api/users/{id}/role` - Assign role

### Departments
- `GET /api/departments` - List departments
- `GET /api/departments/{id}` - Get department
- `POST /api/departments` - Create department
- `PUT /api/departments/{id}` - Update department
- `DELETE /api/departments/{id}` - Delete department

### Programs
- `GET /api/programs` - List programs
- `GET /api/programs/{id}` - Get program
- `POST /api/programs` - Create program
- `PUT /api/programs/{id}` - Update program
- `DELETE /api/programs/{id}` - Delete program
- `GET /api/programs/{id}/courses` - Get courses in program

### Courses
- `GET /api/courses` - List courses
- `GET /api/courses/{id}` - Get course
- `POST /api/courses` - Create course
- `PUT /api/courses/{id}` - Update course
- `DELETE /api/courses/{id}` - Delete course

### Syllabi
- `GET /api/syllabi` - List syllabi
- `GET /api/syllabi/search` - Search syllabi
- `GET /api/syllabi/{id}` - Get syllabus
- `POST /api/syllabi` - Create syllabus
- `PUT /api/syllabi/{id}` - Update syllabus
- `DELETE /api/syllabi/{id}` - Delete syllabus
- `POST /api/syllabi/{id}/submit` - Submit for review

### Syllabus Versions
- `GET /api/syllabi/{id}/versions` - List versions
- `GET /api/syllabi/{id}/versions/{vid}` - Get version
- `POST /api/syllabi/{id}/versions` - Create version
- `GET /api/syllabi/{id}/versions/compare` - Compare versions
- `PUT /api/syllabi/{id}/versions/{vid}/activate` - Set current version

### Approvals
- `GET /api/syllabi/{id}/approvals` - Get approval history
- `POST /api/syllabi/{id}/approve` - Approve syllabus
- `POST /api/syllabi/{id}/reject` - Reject syllabus
- `POST /api/syllabi/{id}/return` - Return for revision
- `GET /api/approvals/pending` - Get pending approvals

## User Roles

| Role | Description |
|------|-------------|
| Admin | Full system access, user management |
| Department Head | First-level reviewer, department management |
| Program Coordinator | Program management |
| Instructor | Create and manage syllabi |
| Reviewer | Academic Affairs staff |
| Viewer | Read-only access (Students) |

## Database Tables

- `users` - User accounts
- `departments` - Academic departments
- `programs` - Academic programs
- `courses` - University courses
- `syllabi` - Syllabus content
- `syllabus_versions` - Version history
- `approval_history` - Approval workflow records

## License

MIT License
