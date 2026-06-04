import ollama
import json
from pydantic import BaseModel
from typing import List


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

def extract_resume_data(text: str) -> ResumeData:
    prompt = f"""
Extract information from the resume below and return ONLY valid JSON with this exact structure:
{{
    "skills": ["skill1", "skill2"],
    "projects": ["Project Name One", "Project Name Two"],
    "work_experience": [
        {{"company": "Company Name", "role": "Job Title", "duration": "X years"}}
    ],
    "education": [
        {{"institution": "University Name", "degree": "Degree Name", "year": "YYYY"}}
    ]
}}

IMPORTANT: "projects" must be a flat list of strings (just the project name), NOT objects.

Resume:
{text}

Return ONLY the JSON, no explanation.
"""
    response = ollama.chat(
        model="llama3",
        messages=[{"role": "user", "content": prompt}]
    )

    raw = response["message"]["content"].strip()

    def clean_json(text):
        if "```" in text:
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return text.strip()

    def normalize(data: dict) -> dict:
        # flatten projects if LLM returned objects
        projects = data.get("projects", [])
        data["projects"] = [
            p["name"] if isinstance(p, dict) else str(p)
            for p in projects
        ]
        return data

    try:
        return ResumeData(**normalize(json.loads(clean_json(raw))))
    except (json.JSONDecodeError, Exception):
        retry_prompt = f"Return ONLY valid JSON, no markdown, no explanation:\n{raw}"
        retry_response = ollama.chat(
            model="llama3",
            messages=[{"role": "user", "content": retry_prompt}]
        )
        return ResumeData(**normalize(json.loads(clean_json(retry_response["message"]["content"].strip()))))



def rerank_jobs(resume_text: str, jobs: list) -> list:
    jobs_text = "\n\n".join([
        f"Job ID: {job['id']}\nTitle: {job['title']}\nDescription: {job['description'][:300]}"
        for job in jobs
    ])

    prompt = f"""
You are a job matching assistant. Given a resume and a list of jobs, rank the jobs from best to worst match and explain why. When writing the reason, always refer to the candidate as "you" instead of using their name.


Resume:
{resume_text[:500]}

Jobs:
{jobs_text}

Return ONLY valid JSON as a list:
[
    {{"job_id": "id here", "title": "title here", "reason": "reason here"}},
    {{"job_id": "id here", "title": "title here", "reason": "reason here"}}
]
Do not use any other key names. Use exactly: job_id, title, reason.
Do not include any explanation or markdown. Return ONLY the JSON list.
"""
    response = ollama.chat(
        model="llama3",
        messages=[{"role": "user", "content": prompt}]
    )

    raw = response["message"]["content"].strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        retry_prompt = f"Return ONLY valid JSON list, no markdown, no explanation:\n{raw}"
        retry_response = ollama.chat(
            model="llama3",
            messages=[{"role": "user", "content": retry_prompt}]
        )
        return json.loads(retry_response["message"]["content"].strip())
