# SMD AI Service

AI-powered microservice for the Syllabus Management and Digitalization System.

## Features

### 1. CLO-PLO Alignment Checking
- Semantic similarity analysis between Course Learning Outcomes (CLOs) and Program Learning Outcomes (PLOs)
- AI-powered improvement suggestions
- Find similar CLOs across courses

### 2. Semantic Version Diff
- Compare syllabus versions semantically (not just text diff)
- Detect significance of changes (major/minor/cosmetic)
- AI-generated change summaries

### 3. AI Summarization
- Generate course summaries for students
- Extract keywords, topics, skills, and tools
- Multi-language support (English/Vietnamese)

### 4. Reference Crawler
- Search Open Library, Google Books, Google Scholar
- Fetch and process web content
- PDF document processing with OCR support

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      AI Service                              │
├─────────────────────────────────────────────────────────────┤
│  FastAPI (Async API)          │  Celery Workers             │
│  ├── /clo-plo                 │  ├── ai_processing queue    │
│  ├── /semantic                │  └── crawler queue          │
│  ├── /summary                 │                             │
│  └── /crawler                 │                             │
├─────────────────────────────────────────────────────────────┤
│                    AI Providers (Hybrid)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Local Models │  │ Cloud APIs   │  │ Ollama       │       │
│  │ (Embeddings) │  │ (Gemini/GPT) │  │ (Fallback)   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL     │  Redis           │  Elasticsearch         │
│  + pgvector     │  (Cache/Queue)   │  (Full-text)           │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Clone and Configure

```bash
cd ai_service
cp .env.example .env
# Edit .env with your API keys
```

### 2. Run with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f ai-api

# Stop
docker-compose down
```

### 3. Run Locally (Development)

```bash
# Install dependencies
pip install -r requirements.txt

# Start Redis (required)
docker run -d -p 6379:6379 redis:alpine

# Start API server
uvicorn app.main:app --reload --port 8001

# Start Celery worker (new terminal)
celery -A app.core.celery_app worker --loglevel=info
```

## API Endpoints

### Health Check
```
GET /api/v1/health
```

### CLO-PLO Analysis
```
POST /api/v1/clo-plo/check          # Async check
POST /api/v1/clo-plo/check/sync     # Sync check
POST /api/v1/clo-plo/similar        # Find similar CLOs
```

### Semantic Diff
```
POST /api/v1/semantic/diff/with-content   # Compare versions
POST /api/v1/semantic/diff/sync           # Sync comparison
POST /api/v1/semantic/quick-diff          # Quick text diff
```

### Summarization
```
POST /api/v1/summary/generate       # Async summary
POST /api/v1/summary/generate/sync  # Sync summary
POST /api/v1/summary/keywords       # Extract keywords
```

### Crawler
```
POST /api/v1/crawler/references       # Search references
POST /api/v1/crawler/references/sync  # Sync search
POST /api/v1/crawler/pdf/process      # Process PDF
POST /api/v1/crawler/pdf/upload       # Upload & process PDF
POST /api/v1/crawler/url/fetch        # Fetch URL content
```

### Task Status
```
GET /api/v1/tasks/{task_id}         # Get any task status
```

## Configuration

### AI Provider Priority

Configure which LLM to use first in `.env`:

```env
AI_PROVIDER_PRIORITY=gemini,openai,ollama
```

The service will try providers in order, falling back if one fails.

### API Keys

```env
# Google Gemini (recommended - free tier available)
GOOGLE_API_KEY=your-key

# OpenAI (alternative)
OPENAI_API_KEY=sk-your-key

# Ollama (local fallback - no key needed)
OLLAMA_BASE_URL=http://localhost:11434
```

## Example Usage

### Check CLO-PLO Alignment

```python
import requests

response = requests.post("http://localhost:8001/api/v1/clo-plo/check/sync", json={
    "syllabus_id": 1,
    "program_id": 1,
    "clos": [
        {"index": 1, "text": "Understand fundamental programming concepts"},
        {"index": 2, "text": "Write basic Python programs"}
    ],
    "plos": [
        {"index": 1, "text": "Apply computing fundamentals to solve problems"},
        {"index": 2, "text": "Design and implement software solutions"}
    ]
})

result = response.json()
print(f"Coverage Score: {result['coverage_score']}")
print(f"Suggestions: {result['suggestions']}")
```

### Generate Summary

```python
response = requests.post("http://localhost:8001/api/v1/summary/generate/sync", params={
    "syllabus_id": 1,
    "course_code": "CS101",
    "course_name": "Introduction to Programming",
    "length": "medium",
    "language": "en"
}, json={
    "learning_outcomes": "1. Understand programming concepts...",
    "assessment_methods": "Assignments: 30%, Midterm: 25%...",
    "prerequisites": "None"
})

summary = response.json()
print(summary["summary"])
```

## Monitoring

### Celery Flower
Access task monitoring at: http://localhost:5555

### Logs
```bash
docker-compose logs -f celery-ai-worker
docker-compose logs -f celery-crawler-worker
```

## Integration with Core API

The AI service is designed to integrate with the main SMD Core API:

1. Core API fetches syllabus content
2. Core API calls AI service endpoints
3. AI service processes and returns results
4. Core API stores/displays results

```
[Core API] --> [AI Service] --> [Results]
     ↓              ↓
[Database]    [Task Queue]
```

## License

MIT License
