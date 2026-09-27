import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
PROCESSED_DIR = DATA_DIR / "processed"
SAMPLE_DIR = BASE_DIR / "sample_data"

# Create directories
for d in [DATA_DIR, UPLOAD_DIR, PROCESSED_DIR, SAMPLE_DIR]:
    d.mkdir(parents=True, exist_ok=True)

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATA_DIR}/aerovista.db")

# Pipeline Configuration Defaults
KEYFRAME_INTERVAL_SEC = 0.5  # extract frame every 0.5 sec
BLUR_THRESHOLD = 80.0       # Variance of Laplacian below this is considered blurry
SIMILARITY_THRESHOLD = 0.85  # Structural / feature similarity above which frame is dropped as duplicate
YOLO_MODEL_NAME = "yolov8n.pt"  # nano model for lightweight fast CPU inference

# Default GIS Origin (e.g., SIH Hackathon Venue / Aerial Survey Demo Site)
DEFAULT_GEO_ORIGIN = {
    "latitude": 28.6139,
    "longitude": 77.2090,
    "altitude_m": 120.5,
    "scale_ratio": 1.0  # 1 unit = 1.0 meter
}
