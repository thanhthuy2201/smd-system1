# SMD System - Complete AI Flows Documentation

This document describes all AI-powered features and their real-world usage flows.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT APPS                                 │
│   Web App (React)  │  Mobile App (React Native)  │  Admin Panel         │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         CORE API (FastAPI :8000)                         │
│   /api/auth     /api/users     /api/syllabi     /api/ai/*               │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
            ┌──────────────┐ ┌──────────┐ ┌──────────────────┐
            │   SQLite/    │ │  Redis   │ │  AI SERVICE      │
            │   MySQL      │ │  Cache   │ │  (FastAPI :8001) │
            └──────────────┘ └──────────┘ └────────┬─────────┘
                                                   │
                                    ┌──────────────┼──────────────┐
                                    ▼              ▼              ▼
                            ┌────────────┐ ┌────────────┐ ┌────────────┐
                            │  Local     │ │  Cloud     │ │  Celery    │
                            │  Embeddings│ │  LLM APIs  │ │  Workers   │
                            └────────────┘ └────────────┘ └────────────┘
```

---

## Flow 1: CLO-PLO Alignment Check

### Use Case
HoD or Academic Affairs reviewer needs to verify that Course Learning Outcomes (CLOs) properly align with Program Learning Outcomes (PLOs).

### Actors
- HoD (Head of Department)
- Academic Affairs Staff
- Program Coordinator

### Flow Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Reviewer   │     │   Core API   │     │  AI Service  │     │   Database   │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │                    │
       │ 1. Request Check   │                    │                    │
       │ POST /api/ai/clo-plo/check              │                    │
       │ {syllabus_id: 1}   │                    │                    │
       │───────────────────>│                    │                    │
       │                    │                    │                    │
       │                    │ 2. Fetch Syllabus  │                    │
       │                    │───────────────────────────────────────>│
       │                    │                    │                    │
       │                    │<─ Syllabus + CLOs ─│                    │
       │                    │                    │                    │
       │                    │ 3. Fetch Program PLOs                  │
       │                    │───────────────────────────────────────>│
       │                    │                    │                    │
       │                    │<──── PLO List ─────│                    │
       │                    │                    │                    │
       │                    │ 4. Check Alignment │                    │
       │                    │ POST /clo-plo/check/sync               │
       │                    │───────────────────>│                    │
       │                    │                    │                    │
       │                    │                    │ 5. Compute         │
       │                    │                    │    Embeddings      │
       │                    │                    │    (Local Model)   │
       │                    │                    │                    │
       │                    │                    │ 6. Generate        │
       │                    │                    │    Suggestions     │
       │                    │                    │    (Gemini/OpenAI) │
       │                    │                    │                    │
       │                    │<── Result ─────────│                    │
       │                    │                    │                    │
       │<── Alignment Report│                    │                    │
       │                    │                    │                    │
```

### API Calls

```bash
# Step 1: Check CLO-PLO alignment
curl -X POST "http://localhost:8000/api/ai/clo-plo/check" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "syllabus_id": 1,
    "program_id": 1
  }'
```

### Response Example

```json
{
  "syllabus_id": 1,
  "course_code": "CS101",
  "course_name": "Introduction to Programming",
  "program_code": "CS-BSC",
  "program_name": "Bachelor of Science in Computer Science",
  "total_clos": 5,
  "total_plos": 5,
  "coverage_score": 0.8,
  "mappings": [
    {
      "clo_index": 1,
      "clo_text": "Understand fundamental programming concepts",
      "plo_index": 1,
      "plo_text": "Apply knowledge of computing fundamentals",
      "similarity_score": 0.89,
      "alignment_level": "strong"
    },
    {
      "clo_index": 2,
      "clo_text": "Write basic Python programs",
      "plo_index": 2,
      "plo_text": "Develop software solutions",
      "similarity_score": 0.75,
      "alignment_level": "moderate"
    }
  ],
  "unmapped_clos": [5],
  "suggestions": [
    "CLO 5 'Debug and fix code errors' has weak alignment. Consider rephrasing to emphasize problem-solving skills.",
    "Add explicit connection to PLO 2 by mentioning 'software development' in CLO descriptions.",
    "Consider adding a CLO related to teamwork to align with PLO 4."
  ]
}
```

---

## Flow 2: Semantic Version Comparison

### Use Case
HoD needs to review changes between syllabus versions before approval, understanding what actually changed (not just text diff).

### Actors
- HoD
- Academic Affairs
- Lecturer (viewing own changes)

### Flow Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│     HoD      │     │   Core API   │     │  AI Service  │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │ 1. Compare Versions│                    │
       │ POST /api/ai/semantic/compare           │
       │ {version_old:1, version_new:2}          │
       │───────────────────>│                    │
       │                    │                    │
       │                    │ 2. Fetch both versions from DB
       │                    │                    │
       │                    │ 3. Call AI Service │
       │                    │───────────────────>│
       │                    │                    │
       │                    │                    │ 4. Compute semantic
       │                    │                    │    similarity per section
       │                    │                    │
       │                    │                    │ 5. Generate change
       │                    │                    │    summaries (LLM)
       │                    │                    │
       │                    │<── Diff Result ────│
       │                    │                    │
       │<── Semantic Report │                    │
```

### API Calls

```bash
# Compare two versions
curl -X POST "http://localhost:8000/api/ai/semantic/compare" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "syllabus_id": 1,
    "version_old": 1,
    "version_new": 2
  }'
```

### Response Example

```json
{
  "syllabus_id": 1,
  "course_code": "CS101",
  "version_old": 1,
  "version_new": 2,
  "overall_similarity": 0.78,
  "overall_significance": "minor",
  "section_changes": [
    {
      "section": "learning_outcomes",
      "change_type": "modified",
      "significance": "minor",
      "semantic_similarity": 0.85,
      "change_summary": "Added emphasis on practical programming skills. CLO 3 now includes 'debugging' as a specific outcome."
    },
    {
      "section": "assessment_methods",
      "change_type": "modified",
      "significance": "major",
      "semantic_similarity": 0.65,
      "change_summary": "Reduced exam weight from 50% to 35%. Added new project component worth 25%. This shifts focus from memorization to practical application."
    },
    {
      "section": "textbooks",
      "change_type": "modified",
      "significance": "cosmetic",
      "semantic_similarity": 0.95,
      "change_summary": "Updated edition numbers. No change in core content."
    }
  ],
  "change_summary": "This revision shifts the course toward more hands-on learning with a new project component replacing some exam weight.",
  "key_changes": [
    "New 25% project component added",
    "Exam weight reduced from 50% to 35%",
    "Debugging skills explicitly added to learning outcomes"
  ],
  "impact_analysis": "Students will need to allocate more time for project work. The reduced exam pressure may benefit students who learn better through practice."
}
```

---

## Flow 3: AI Summarization for Students

### Use Case
Student wants to quickly understand what a course is about before enrollment.

### Actors
- Student (Viewer)
- Public User

### Flow Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Student    │     │   Core API   │     │  AI Service  │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │ 1. Get Summary     │                    │
       │ GET /api/ai/summary/1?language=vi       │
       │───────────────────>│                    │
       │                    │                    │
       │                    │ 2. Check syllabus is published
       │                    │                    │
       │                    │ 3. Request Summary │
       │                    │───────────────────>│
       │                    │                    │
       │                    │                    │ 4. Generate summary
       │                    │                    │    using LLM
       │                    │                    │
       │                    │<── Summary ────────│
       │                    │                    │
       │<── Course Summary  │                    │
```

### API Calls

```bash
# Get summary (public endpoint for published syllabi)
curl "http://localhost:8000/api/ai/summary/1?language=vi&length=medium"
```

### Response Example

```json
{
  "syllabus_id": 1,
  "course_code": "CS101",
  "course_name": "Introduction to Programming",
  "summary": "This course introduces fundamental programming concepts using Python. Students will learn to write programs, work with data structures, and solve problems systematically. The course emphasizes hands-on practice with weekly coding assignments and a final project.",
  "summary_vi": "Môn học này giới thiệu các khái niệm lập trình cơ bản sử dụng Python. Sinh viên sẽ học cách viết chương trình, làm việc với cấu trúc dữ liệu và giải quyết vấn đề một cách có hệ thống.",
  "key_highlights": [
    {"category": "credits", "content": "3 credits", "importance": "high"},
    {"category": "skill", "content": "Python programming", "importance": "high"},
    {"category": "skill", "content": "Problem solving", "importance": "high"},
    {"category": "assessment", "content": "Assignments: 30%", "importance": "medium"},
    {"category": "assessment", "content": "Project: 25%", "importance": "medium"}
  ],
  "prerequisites_summary": "No prior programming experience required",
  "learning_outcomes_summary": "By the end of this course, students will be able to write Python programs, understand control structures, and implement basic algorithms.",
  "assessment_summary": "Continuous assessment through weekly assignments (30%), midterm exam (20%), final project (25%), and final exam (25%).",
  "recommended_for": [
    "First-year Computer Science students",
    "Students from other majors interested in programming",
    "Anyone wanting to start coding with Python"
  ],
  "difficulty_level": "Beginner",
  "estimated_workload": "~5 hours/week (Moderate)"
}
```

---

## Flow 4: Reference Material Crawler

### Use Case
Lecturer is creating a new syllabus and needs to find relevant textbooks and reference materials.

### Actors
- Lecturer
- Program Coordinator

### Flow Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Lecturer   │     │   Core API   │     │  AI Service  │     │ Web Sources  │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │                    │
       │ 1. Search References                    │                    │
       │ POST /api/ai/references/search          │                    │
       │ {syllabus_id: 1}   │                    │                    │
       │───────────────────>│                    │                    │
       │                    │                    │                    │
       │                    │ 2. Get syllabus info                   │
       │                    │                    │                    │
       │                    │ 3. Build search queries                │
       │                    │                    │                    │
       │                    │ 4. Crawl References│                    │
       │                    │───────────────────>│                    │
       │                    │                    │                    │
       │                    │                    │ 5. Search          │
       │                    │                    │───────────────────>│
       │                    │                    │    Open Library    │
       │                    │                    │    Google Books    │
       │                    │                    │<── Results ────────│
       │                    │                    │                    │
       │                    │<── References ─────│                    │
       │                    │                    │                    │
       │<── Reference List  │                    │                    │
```

### API Calls

```bash
# Search for reference materials
curl -X POST "http://localhost:8000/api/ai/references/search" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "syllabus_id": 1,
    "additional_queries": ["Python algorithms"],
    "max_results": 10
  }'
```

### Response Example

```json
{
  "syllabus_id": 1,
  "course_code": "CS101",
  "search_queries_used": [
    "Introduction to Programming",
    "Python Crash Course",
    "Python algorithms"
  ],
  "total_found": 8,
  "references": [
    {
      "title": "Python Crash Course",
      "url": "https://openlibrary.org/works/OL17930368W",
      "source": "Open Library",
      "authors": ["Eric Matthes"],
      "year": 2019,
      "relevance_score": 0.95,
      "crawl_type": "textbook"
    },
    {
      "title": "Automate the Boring Stuff with Python",
      "url": "https://openlibrary.org/works/OL17354624W",
      "source": "Open Library",
      "authors": ["Al Sweigart"],
      "year": 2020,
      "relevance_score": 0.88,
      "crawl_type": "textbook"
    }
  ],
  "crawl_duration_seconds": 3.2,
  "sources_crawled": ["openlibrary", "google_books"]
}
```

---

## Flow 5: Complete Syllabus Submission with AI Validation

### Use Case
Lecturer submits syllabus for review. System automatically checks CLO-PLO alignment and generates summary for reviewers.

### Actors
- Lecturer
- System (Automated)
- HoD (Reviewer)

### Flow Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Lecturer   │     │   Core API   │     │  AI Service  │     │     HoD      │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │                    │
       │ 1. Submit Syllabus │                    │                    │
       │ POST /api/syllabi/1/submit              │                    │
       │───────────────────>│                    │                    │
       │                    │                    │                    │
       │                    │ 2. Update status to PENDING_REVIEW     │
       │                    │                    │                    │
       │                    │ 3. Auto CLO-PLO Check (async)          │
       │                    │───────────────────>│                    │
       │                    │                    │                    │
       │                    │ 4. Auto Summary (async)                │
       │                    │───────────────────>│                    │
       │                    │                    │                    │
       │<── Submitted OK ───│                    │                    │
       │                    │                    │                    │
       │                    │ 5. Notify HoD      │                    │
       │                    │─────────────────────────────────────────>
       │                    │                    │                    │
       │                    │                    │    6. HoD Reviews  │
       │                    │                    │    with AI insights│
       │                    │<────────────────────────────────────────│
       │                    │                    │                    │
```

### Complete API Flow

```bash
# 1. Lecturer creates syllabus
curl -X POST "http://localhost:8000/api/syllabi" \
  -H "Authorization: Bearer $LECTURER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "course_id": 1,
    "academic_year": "2024-2025",
    "semester": "Fall",
    "credits": 3,
    "total_hours": 45,
    "learning_outcomes": "1. Understand programming concepts\n2. Write Python programs\n3. Apply problem-solving",
    "assessment_methods": "Assignments: 30%\nProject: 25%\nMidterm: 20%\nFinal: 25%",
    "textbooks": "Python Crash Course by Eric Matthes"
  }'

# 2. Lecturer submits for review
curl -X POST "http://localhost:8000/api/syllabi/1/submit" \
  -H "Authorization: Bearer $LECTURER_TOKEN"

# 3. HoD gets pending syllabi with AI analysis
curl "http://localhost:8000/api/approvals/pending" \
  -H "Authorization: Bearer $HOD_TOKEN"

# 4. HoD checks CLO-PLO alignment
curl -X POST "http://localhost:8000/api/ai/clo-plo/check" \
  -H "Authorization: Bearer $HOD_TOKEN" \
  -d '{"syllabus_id": 1}'

# 5. HoD compares with previous version
curl -X POST "http://localhost:8000/api/ai/semantic/compare" \
  -H "Authorization: Bearer $HOD_TOKEN" \
  -d '{"syllabus_id": 1, "version_old": 1, "version_new": 2}'

# 6. HoD approves
curl -X POST "http://localhost:8000/api/syllabi/1/approve" \
  -H "Authorization: Bearer $HOD_TOKEN" \
  -d '{"comments": "CLO-PLO alignment is good. Approved."}'
```

---

## Flow 6: PDF Import and Processing

### Use Case
Lecturer has an existing PDF syllabus and wants to import it into the system.

### API Calls

```bash
# Upload and process PDF
curl -X POST "http://localhost:8000/api/ai/pdf/extract" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@syllabus.pdf" \
  -F "perform_ocr=true"
```

### Response Example

```json
{
  "filename": "syllabus.pdf",
  "total_pages": 5,
  "extracted_text": "Course: CS101 Introduction to Programming...",
  "sections": [
    {
      "title": "Course Description",
      "content": "This course introduces fundamental programming...",
      "page_numbers": [1]
    },
    {
      "title": "Learning Outcomes",
      "content": "1. Understand basic programming concepts...",
      "page_numbers": [1, 2]
    },
    {
      "title": "Assessment",
      "content": "Assignments: 30%...",
      "page_numbers": [3]
    }
  ],
  "metadata": {
    "title": "CS101 Syllabus",
    "author": "Dr. Nguyen"
  },
  "language_detected": "en",
  "ocr_used": true
}
```

---

## Quick Reference: All AI Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/ai/clo-plo/check` | POST | Check CLO-PLO alignment | Yes |
| `/api/ai/clo-plo/similar` | POST | Find similar CLOs | Yes |
| `/api/ai/semantic/compare` | POST | Compare syllabus versions | Yes |
| `/api/ai/semantic/quick-diff` | GET | Quick text comparison | Yes |
| `/api/ai/summary/generate` | POST | Generate syllabus summary | Yes |
| `/api/ai/summary/{id}` | GET | Get summary (public) | No* |
| `/api/ai/keywords/{id}` | POST | Extract keywords | Yes |
| `/api/ai/references/search` | POST | Search references | Yes |
| `/api/ai/pdf/extract` | POST | Process PDF | Yes |
| `/api/ai/url/fetch` | GET | Fetch URL content | Yes |
| `/api/ai/health` | GET | AI service health | No |

*Only for published/approved syllabi

---

## Running the System

### Start Core API
```bash
cd /Users/thaopv/PycharmProjects/fastapi/src
PYTHONPATH=$(pwd) uvicorn app.main:app --reload --port 8000
```

### Start AI Service
```bash
cd /Users/thaopv/PycharmProjects/fastapi/ai_service
cp .env.example .env
# Add your GOOGLE_API_KEY or OPENAI_API_KEY to .env
docker-compose up -d
```

### Access
- Core API Docs: http://localhost:8000/docs
- AI Service Docs: http://localhost:8001/docs
- Celery Monitor: http://localhost:5555
