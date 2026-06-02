from sentence_transformers import SentenceTransformer
import chromadb


model = SentenceTransformer("all-MiniLM-L6-v2")
chroma_client = chromadb.PersistentClient(path="./chroma_db")
jobs_collection = chroma_client.get_or_create_collection("jobs")
resumes_collection = chroma_client.get_or_create_collection("resumes")

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50):

    words = text.split()
    chunks = []
    i = 0
    while i<len(words):
        chunk = " ".join(words[i:i+chunk_size])
        chunks.append(chunk)
        i += chunk_size - overlap
    return chunks

def embed_and_store_job(job_id:str, text: str):
    chunks = chunk_text(text)
    embeddings = model.encode(chunks)
    for i, chunk in enumerate(chunks):
        jobs_collection.add(
            ids=[f"{job_id}_chunk_{i}"],
            embeddings=[embeddings[i].tolist()],
            documents=[chunk],
            metadatas=[{"job_id": job_id, "chunk_id": i}]
        )

def embed_and_store_resume(resume_id:str, text: str):
    chunks = chunk_text(text)
    embeddings = model.encode(chunks)
    for i, chunk in enumerate(chunks):
        resumes_collection.add(
            ids=[f"{resume_id}_chunk_{i}"],
            embeddings=[embeddings[i].tolist()],
            documents=[chunk],
            metadatas=[{"resume_id": resume_id, "chunk_id": i}]
        )
        

def search_jobs(query_text: str, top_k: int = 5):
    embedding = model.encode(query_text).tolist()
    results = jobs_collection.query(
        query_embeddings = [embedding],
        n_results=top_k,
        include=["metadatas", "documents", "distances"]
    )
    return results
