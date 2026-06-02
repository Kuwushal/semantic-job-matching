# Semantic Job Matching API

A backend FastAPI service that matches resumes to job descriptions using embeddings, vector search, and LLM reranking.

## Requirements

- Python 3.9+
- [Ollama](https://ollama.com/download) installed and running locally

## Setup

1. Clone the repo:
```bash
git clone https://github.com/Kuwushal/semantic-job-matching.git
cd semantic-job-matching
```

2. Install dependencies:
```bash
pip3 install fastapi uvicorn pdfplumber python-docx sqlalchemy sentence-transformers chromadb ollama
```

3. Pull the LLM model:
```bash
ollama pull llama3
```

4. Make sure Ollama is running, then start the server:
```bash
uvicorn main:app --reload
```

5. Open the API docs at:
```
http://localhost:8000/docs
```

## Environment Variables

No environment variables required. Ollama runs locally.

## Example Curl Requests

### Upload a job
```bash
curl -X POST http://localhost:8000/jobs \
  -F "title=Backend Engineer" \
  -F "file=@job1.txt;type=text/plain"
```

### List all jobs
```bash
curl http://localhost:8000/jobs
```

### Get a job by ID
```bash
curl http://localhost:8000/jobs/{job_id}
```

### Delete a job
```bash
curl -X DELETE http://localhost:8000/jobs/{job_id}
```

### Upload a resume
```bash
curl -X POST http://localhost:8000/resumes \
  -F "file=@resume.txt;type=text/plain"
```

### Get a resume by ID
```bash
curl http://localhost:8000/resumes/{resume_id}
```

### Match a resume to jobs
```bash
curl -X POST http://localhost:8000/resumes/{resume_id}/match
```

## Demo

1. Upload a few jobs:
```bash
curl -X POST http://localhost:8000/jobs -F "title=Backend Engineer" -F "file=@job1.txt;type=text/plain"
curl -X POST http://localhost:8000/jobs -F "title=Data Scientist" -F "file=@job2.txt;type=text/plain"
curl -X POST http://localhost:8000/jobs -F "title=DevOps Engineer" -F "file=@job3.txt;type=text/plain"
```

2. Upload a resume:
```bash
curl -X POST http://localhost:8000/resumes -F "file=@resume.txt;type=text/plain"
```

3. Match the resume to jobs (replace with your resume_id):
```bash
curl -X POST http://localhost:8000/resumes/{resume_id}/match
```

You will get back a ranked list of jobs with a reason for each match.
