"""Basic API tests"""
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "service" in data
    assert "version" in data


def test_health():
    """Test health endpoint"""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "services" in data


def test_status():
    """Test status endpoint"""
    response = client.get("/api/v1/status")
    assert response.status_code == 200
    data = response.json()
    assert "app_name" in data
    assert "llm_providers" in data


def test_quick_diff():
    """Test quick semantic diff"""
    response = client.post("/api/v1/semantic/quick-diff", json={
        "text_old": "Learn programming fundamentals",
        "text_new": "Understand programming basics"
    })
    assert response.status_code == 200
    data = response.json()
    assert "similarity_score" in data
    assert "significance" in data


# Integration tests (require running services)
@pytest.mark.integration
def test_clo_plo_check_sync():
    """Test synchronous CLO-PLO check"""
    response = client.post("/api/v1/clo-plo/check/sync", json={
        "syllabus_id": 1,
        "program_id": 1,
        "clos": [
            {"index": 1, "text": "Understand programming concepts"},
            {"index": 2, "text": "Write Python programs"}
        ],
        "plos": [
            {"index": 1, "text": "Apply computing fundamentals"},
            {"index": 2, "text": "Develop software solutions"}
        ]
    })
    assert response.status_code == 200
    data = response.json()
    assert "coverage_score" in data
    assert "mappings" in data


@pytest.mark.integration
def test_summarize_sync():
    """Test synchronous summarization"""
    response = client.post(
        "/api/v1/summary/generate/sync",
        params={
            "syllabus_id": 1,
            "course_code": "CS101",
            "course_name": "Intro to Programming"
        },
        json={
            "learning_outcomes": "1. Understand programming\n2. Write code",
            "assessment_methods": "Assignments: 40%, Exam: 60%"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
