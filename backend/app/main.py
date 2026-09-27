import os
import uuid
import threading
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, BackgroundTasks, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.config import UPLOAD_DIR, PROCESSED_DIR, DATA_DIR, SAMPLE_DIR
from app.database import engine, Base, get_db
from app.models import (
    JobModel, JobStatus, JobResponse, CameraPoseModel, CameraPoseSchema,
    DetectedObjectModel, DetectedObjectSchema, ModelUrlResponse
)
from app.pipeline.runner import run_reconstruction_pipeline
from sample_data.create_sample_dataset import generate_sample_drone_video

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AEROVISTA-X API",
    description="Single-Pass Drone Video to 3D Digital Twin Generation Engine (SIH26158)",
    version="1.0.0"
)

# Enable CORS for React dashboard frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files serving for 3D GLTF models, PLY files, keyframes
app.mount("/data", StaticFiles(directory=str(DATA_DIR)), name="data")

@app.on_event("startup")
def startup_event():
    # Ensure sample video exists
    sample_mp4 = SAMPLE_DIR / "sample_drone_flight.mp4"
    if not sample_mp4.exists():
        generate_sample_drone_video(str(sample_mp4))

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "system": "AEROVISTA-X Engine",
        "version": "1.0.0-hackathon-prototype",
        "gpu_accelerated": False
    }

@app.get("/api/jobs", response_model=List[JobResponse])
def get_jobs(db: Session = Depends(get_db)):
    jobs = db.query(JobModel).order_by(JobModel.created_at.desc()).all()
    return jobs

@app.post("/api/jobs/upload", response_model=JobResponse)
def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith(('.mp4', '.mov', '.avi', '.mkv')):
        raise HTTPException(status_code=400, detail="Invalid file format. Upload .mp4 or .mov drone video.")

    job_id = f"job_{uuid.uuid4().hex[:8]}"
    save_path = os.path.join(UPLOAD_DIR, f"{job_id}_{file.filename}")

    with open(save_path, "wb") as buffer:
        buffer.write(file.file.read())

    job = JobModel(
        id=job_id,
        filename=file.filename,
        status=JobStatus.CREATED.value,
        progress=0.0,
        current_step="Uploaded drone video",
        logs=[f"[INFO] Video uploaded: {file.filename}"]
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Launch async pipeline background task
    background_tasks.add_task(run_reconstruction_pipeline, job_id, save_path, db)

    return job

@app.post("/api/jobs/demo", response_model=JobResponse)
def trigger_demo_job(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    sample_mp4 = SAMPLE_DIR / "sample_drone_flight.mp4"
    if not sample_mp4.exists():
        generate_sample_drone_video(str(sample_mp4))

    job_id = f"demo_{uuid.uuid4().hex[:6]}"
    job = JobModel(
        id=job_id,
        filename="sample_drone_flight.mp4",
        status=JobStatus.CREATED.value,
        progress=0.0,
        current_step="Demo flight triggered",
        logs=["[INFO] Pre-loaded sample drone video initialized"]
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Execute pipeline asynchronously
    background_tasks.add_task(run_reconstruction_pipeline, job_id, str(sample_mp4), db)

    return job

@app.get("/api/jobs/{job_id}/status", response_model=JobResponse)
def get_job_status(job_id: str, db: Session = Depends(get_db)):
    job = db.query(JobModel).filter(JobModel.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    return job

@app.get("/api/jobs/{job_id}/poses", response_model=List[CameraPoseSchema])
def get_job_camera_poses(job_id: str, db: Session = Depends(get_db)):
    poses = db.query(CameraPoseModel).filter(CameraPoseModel.job_id == job_id).all()
    return poses

@app.get("/api/jobs/{job_id}/objects", response_model=List[DetectedObjectSchema])
def get_job_objects(job_id: str, db: Session = Depends(get_db)):
    objects = db.query(DetectedObjectModel).filter(DetectedObjectModel.job_id == job_id).all()
    return objects

@app.get("/api/jobs/{job_id}/model", response_model=ModelUrlResponse)
def get_job_model_urls(job_id: str, db: Session = Depends(get_db)):
    job = db.query(JobModel).filter(JobModel.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    base_url = f"/data/processed/{job_id}"
    geo = job.geo_metadata or {}

    return ModelUrlResponse(
        job_id=job_id,
        gltf_url=f"{base_url}/{job_id}_mesh.gltf",
        ply_url=f"{base_url}/{job_id}_mesh.ply",
        obj_url=f"{base_url}/{job_id}_mesh.obj",
        point_cloud_url=f"{base_url}/{job_id}_cloud.ply",
        geo_origin=geo.get("origin", {}),
        confidence_summary=geo.get("confidence_summary", {})
    )
