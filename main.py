from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from uuid import uuid4
from typing import Optional, List
import pdfplumber
import docx
from database import SessionLocal, Jobmodel, ResumeModel, init_db
import json
from embeddings import embed_and_store_job, embed_and_store_resume, search_jobs
from llm import extract_resume_data, rerank_jobs




app = FastAPI(title="Semantic Job Matching API")


# -------------------------
# JOBS STORE AND MODELS
# -------------------------


init_db()


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

    db = SessionLocal()
    job = Jobmodel(id=str(uuid4()), title=title, description=description)
    db.add(job)
    db.commit()
    db.refresh(job)
    db.close()
    embed_and_store_job(job.id, description)

    return {"id": job.id, "title": job.title, "description": job.description}


@app.get("/jobs")
def list_jobs():
        db = SessionLocal()
        jobs = db.query(Jobmodel).all()
        db.close()
        return [{"id": job.id, "title": job.title, "description": job.description} for job in jobs]

@app.get("/jobs/{job_id}")
def get_job(job_id: str):
        db = SessionLocal()
        job = db.query(Jobmodel).filter(Jobmodel.id == job_id).first()
        db.close()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return {"id": job.id, "title": job.title, "description": job.description}




@app.delete("/jobs/{job_id}")
def delete_job(job_id: str):
    db = SessionLocal()
    job = db.query(Jobmodel).filter(Jobmodel.id == job_id).first()
    if not job:
        db.close()
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(job)
    db.commit()
    db.close()
    return {"message": "Job deleted successfully"}





# -------------------------
# RESUMES STORE AND MODELS
# -------------------------

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

    structured_data = extract_resume_data(text)

    resume_id = str(uuid4())
    db = SessionLocal()
    resume = ResumeModel(id=resume_id, raw_text=text, structured_data=json.dumps(structured_data.dict()))
    db.add(resume)
    db.commit()
    db.close()
    embed_and_store_resume(resume_id, text)

    return {"id": resume_id, "structured_data": structured_data}



@app.get("/resumes/{resume_id}")
def get_resume(resume_id: str):
    db = SessionLocal()
    resume = db.query(ResumeModel).filter(ResumeModel.id == resume_id).first()
    db.close()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return{"id": resume.id, "raw_text": resume.raw_text, "structured_data": json.loads(resume.structured_data)}


@app.post("/resumes/{resume_id}/match")
def match_resume_to_jobs(resume_id: str):
    db = SessionLocal()
    resume = db.query(ResumeModel).filter(ResumeModel.id == resume_id).first()
    if not resume:
        db.close()
        raise HTTPException(status_code=404, detail="Resume not found")
    results = search_jobs(resume.raw_text)

    job_ids = list(set(
        meta["job_id"] for meta in results["metadatas"][0]
    ))

    jobs = db.query(Jobmodel).filter(Jobmodel.id.in_(job_ids)).all()
    db.close()
    
    jobs_list = [{"id": j.id, "title": j.title, "description": j.description} for j in jobs]
    ranked = rerank_jobs(resume.raw_text, jobs_list)

    jobs_map = {j["id"]: j["title"] for j in jobs_list}
    valid_matches = []
    for match in ranked:
        job_id = match.get("job_id", "")
        if job_id and job_id in jobs_map:
            match["title"] = jobs_map[job_id]
            valid_matches.append(match)

    return {"resume_id": resume_id, "matches": valid_matches}



