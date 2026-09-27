import datetime
import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict, Any
from app.database import Base

class JobStatus(str, enum.Enum):
    CREATED = "CREATED"
    EXTRACTING_KEYFRAMES = "EXTRACTING_KEYFRAMES"
    ESTIMATING_POSES = "ESTIMATING_POSES"
    RECONSTRUCTING_3D = "RECONSTRUCTING_3D"
    DETECTING_OBJECTS = "DETECTING_OBJECTS"
    MAPPING_CONFIDENCE = "MAPPING_CONFIDENCE"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class JobModel(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    status = Column(String, default=JobStatus.CREATED.value)
    progress = Column(Float, default=0.0)
    current_step = Column(String, default="Job Initialized")
    total_frames = Column(Integer, default=0)
    keyframes_selected = Column(Integer, default=0)
    sparse_points_count = Column(Integer, default=0)
    dense_faces_count = Column(Integer, default=0)
    objects_count = Column(Integer, default=0)
    avg_confidence = Column(Float, default=0.0)
    geo_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    logs = Column(JSON, default=list)

    # Relationships
    poses = relationship("CameraPoseModel", back_populates="job", cascade="all, delete-orphan")
    objects = relationship("DetectedObjectModel", back_populates="job", cascade="all, delete-orphan")

class CameraPoseModel(Base):
    __tablename__ = "camera_poses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False)
    frame_index = Column(Integer, nullable=False)
    timestamp_sec = Column(Float, default=0.0)
    blur_score = Column(Float, default=0.0)
    is_keyframe = Column(Integer, default=1)
    translation = Column(JSON, nullable=False) # [x, y, z]
    rotation = Column(JSON, nullable=False)    # 3x3 matrix or quaternion
    confidence = Column(Float, default=1.0)

    job = relationship("JobModel", back_populates="poses")

class DetectedObjectModel(Base):
    __tablename__ = "detected_objects"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False)
    label = Column(String, nullable=False)  # building, vehicle, vegetation, road, person
    confidence = Column(Float, nullable=False)
    bbox_2d = Column(JSON, nullable=True)   # [x1, y1, x2, y2]
    bbox_3d = Column(JSON, nullable=False)  # {center: [x,y,z], size: [dx,dy,dz]}
    color_hex = Column(String, default="#3B82F6")
    geo_location = Column(JSON, nullable=True) # {lat, lon, alt}

    job = relationship("JobModel", back_populates="objects")

# --- Pydantic Schemas ---

class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    filename: str
    status: str
    progress: float
    current_step: str
    total_frames: int
    keyframes_selected: int
    sparse_points_count: int
    dense_faces_count: int
    objects_count: int
    avg_confidence: float
    geo_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    logs: List[str] = []

class CameraPoseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    frame_index: int
    timestamp_sec: float
    blur_score: float
    is_keyframe: bool
    translation: List[float]
    rotation: List[List[float]]
    confidence: float

class DetectedObjectSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    label: str
    confidence: float
    bbox_2d: Optional[List[float]] = None
    bbox_3d: Dict[str, Any]
    color_hex: str
    geo_location: Optional[Dict[str, Any]] = None

class ModelUrlResponse(BaseModel):
    job_id: str
    gltf_url: str
    ply_url: str
    obj_url: str
    point_cloud_url: str
    geo_origin: Dict[str, Any]
    confidence_summary: Dict[str, Any]
