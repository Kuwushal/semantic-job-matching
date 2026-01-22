from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from uuid import uuid4
from typing import Optional, List
import pdfplumber
import docx

app = FastAPI(title="Semantic Job Matching API")


# -------------------------
# JOBS STORE AND MODELS
# -------------------------


jobs_store = {}

@app.get("/health")
def health_check():
    return {"status": "ok"}

class JobCreate(BaseModel):
    title: str
    description: Optional[str]=None


class JobOut(BaseModel):
    id: str
    title: str
    description: str


def extract_text_from_pdf(file) -> str:
    text = ""
    with pdfplumber.open(file) as pdf:
        for page in pdf.pages:
            text += page.extract_text() or ""
    return text.strip()


def extract_text_from_docx(file)-> str:
    doc = docx.Document(file)
    full_text=[]
    for para in doc.paragraphs:
        full_text.apend(para.text)
        return "\n".join(full_text).strip()
    
def extract_text_from_txt(file)-> str:
    return file.read().decode('utf-8').strip()


@app.post("/jobs", response_model=JobOut)
async def create_job(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    if file:
        filename = file.filename.lower()
        if filename.endswith(".pdf"):
            text = extract_text_from_pdf(file.file)
        elif filename.endswith(".docx"):
            text = extract_text_from_docx(file.file)
        elif filename.endswith(".txt"):
            text = extract_text_from_txt(file.file)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        
        if not text:
            raise HTTPException(status_code=400, detail="Failed to extract text or empty file")
        
        description = text
    
    elif not description:
        raise HTTPException(status_code=400, detail="Either file or description must be provided")

    job_id = str(uuid4())
    jobs_store[job_id] = {
        "id": job_id,
        "title": title,
        "description": description,
    }

    return jobs_store[job_id]

@app.get("/jobs")
def list_jobs():
    return [
        {"id": job["id"], "title": job["title"]}
        for job in jobs_store.values()
    ]

@app.get("/jobs/{job_id}")
def get_job(job_id: str):
    job = jobs_store.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@app.delete("/jobs/{job_id}")
def delete_job(job_id: str):
    if job_id not in jobs_store:
        raise HTTPException(status_code=404, detail="Job not found")
    del jobs_store[job_id]
    return {"message": "Job deleted successfully"}



# -------------------------
# RESUMES STORE AND MODELS
# -------------------------

resumes_store = {}

class WorkExperience(BaseModel):
    company: str
    role: str
    duration: str

class Education(BaseModel):
    institution: str
    degree: str
    year: str

class ResumeData(BaseModel):
    skills: List[str]
    projects: List[str]
    work_experience: List[WorkExperience]
    education: List[Education]

def mock_llm_extract(text: str)-> ResumeData:
    return ResumeData(
        skills=["Python", "FastAPI", "SQL"],
        projects=["E-commerce Platform", "Task Management App"],
        work_experience=[
             WorkExperience(company="Tech Corp", role="Backend Developer", duration="2 years"),
            ],
            education=[
                Education(institution="University of Tech", degree="BSc Computer Science", year="2020"),
            ]
        )

@app.post("/resumes")
async def upload_resume(file: UploadFile = File(...)):
    filename = file.filename.lower()
    if filename.endswith(".pdf"):
        text = extract_text_from_pdf(file.file)
    elif filename.endswith(".docx"):
        text = extract_text_from_docx(file.file)
    elif filename.endswith(".txt"):
        text = extract_text_from_txt(file.file)
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    if not text:
        raise HTTPException(status_code=400, detail="Failed to extract text or empty file")

    structured_data = mock_llm_extract(text)

    resume_id = str(uuid4())
    resumes_store[resume_id] = {
        "id": resume_id,
        "raw_text": text,
        "structured_data": structured_data.dict()
    }

    return {"id": resume_id, "structured_data": structured_data}


@app.get("/resume/{resume_id}")
def get_resume(resume_id: str):
    resume = resumes_store.get(resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume




# -------------------------
# HEALTH CHECK
# -------------------------

@app.get("/health")
def health_check():
    return {"status": "ok"}