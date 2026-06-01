from sqlalchemy import create_engine, Column, String, Text
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL= "sqlite:///./semantic.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker (bind=engine)
Base = declarative_base()

class Jobmodel(Base):
    __tablename__ = "jobs"
    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)


class ResumeModel(Base):
    __tablename__ = "resumes"
    id = Column(String, primary_key=True)
    raw_text = Column(Text, nullable=False)
    structured_data = Column(Text, nullable=False)

def init_db():
    Base.metadata.create_all(bind=engine)


