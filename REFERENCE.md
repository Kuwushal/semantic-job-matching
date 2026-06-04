# Project Structure & Function Reference

---

## database.py
Sets up SQLite database using SQLAlchemy. Creates tables and provides a session factory.

- `JobModel` — SQLAlchemy table model for storing jobs (id, title, description)
- `ResumeModel` — SQLAlchemy table model for storing resumes (id, raw_text, structured_data as JSON string)
- `init_db()` — Creates all tables in the database if they don't exist. Called once on server startup.

---

## embeddings.py
Handles text chunking, embedding generation, and vector storage using ChromaDB and sentence-transformers.

- `chunk_text(text, chunk_size, overlap)` — Splits a long text into smaller overlapping chunks of words. Used before embedding to avoid sending huge texts to the model.
- `embed_and_store_job(job_id, text)` — Chunks a job description, generates embeddings for each chunk, and stores them in the ChromaDB jobs collection with the job_id as metadata.
- `embed_and_store_resume(resume_id, text)` — Chunks a resume, generates embeddings for each chunk, and stores them in the ChromaDB resumes collection with the resume_id as metadata.
- `search_jobs(query_text, top_k)` — Embeds the query text and searches the jobs ChromaDB collection for the top matching job chunks. Returns metadata, documents, and distances.

---

## llm.py
Handles all LLM interactions using Ollama (llama3 running locally).

- `WorkExperience` — Pydantic model for a single work experience entry (company, role, duration)
- `Education` — Pydantic model for a single education entry (institution, degree, year)
- `ResumeData` — Pydantic model for the full structured resume output (skills, projects, work_experience, education)
- `extract_resume_data(text)` — Sends resume raw text to Ollama and asks it to extract structured JSON. Validates the response using ResumeData Pydantic model. Retries once with a stricter prompt if the JSON is invalid.
- `rerank_jobs(resume_text, jobs)` — Sends the resume and a list of candidate jobs to Ollama and asks it to rank them by best match with a short reason for each. Retries once if the JSON is invalid. Returns a ranked list of job_id, title, and reason.

---

## main.py
The main FastAPI application. Defines all API endpoints and wires everything together.

- `health_check()` — GET /health — Returns server status
- `extract_text_from_pdf(file)` — Helper that extracts text from an uploaded PDF file using pdfplumber
- `extract_text_from_docx(file)` — Helper that extracts text from an uploaded DOCX file using python-docx
- `extract_text_from_txt(file)` — Helper that reads plain text from an uploaded TXT file
- `create_job()` — POST /jobs — Accepts a job title and either a file (pdf/docx/txt) or raw description text. Saves to SQLite and stores embeddings in ChromaDB.
- `list_jobs()` — GET /jobs — Returns a list of all jobs (id and title) from SQLite
- `get_job(job_id)` — GET /jobs/{job_id} — Returns full details of a single job from SQLite
- `delete_job(job_id)` — DELETE /jobs/{job_id} — Deletes a job from SQLite
- `upload_resume()` — POST /resumes — Accepts a resume file (pdf/docx/txt), extracts text, runs LLM extraction to get structured data, saves to SQLite, and stores embeddings in ChromaDB
- `get_resume(resume_id)` — GET /resumes/{resume_id} — Returns full resume details including structured data from SQLite
- `match_resume_to_jobs(resume_id)` — POST /resumes/{resume_id}/match — Fetches the resume, runs vector search to find top matching jobs, then sends them to the LLM to rerank and explain. Returns a ranked list of matched jobs with reasons.
