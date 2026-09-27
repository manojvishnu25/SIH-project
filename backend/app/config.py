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

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATA_DIR}/aerovista.db")

# Pipeline Configuration (configurable via .env)
KEYFRAME_INTERVAL_SEC = float(os.getenv("KEYFRAME_INTERVAL_SEC", "0.5"))
BLUR_THRESHOLD = float(os.getenv("BLUR_THRESHOLD", "80.0"))
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.85"))
YOLO_MODEL_NAME = os.getenv("YOLO_MODEL_NAME", "yolov8n.pt")

# Default GIS Origin
DEFAULT_GEO_ORIGIN = {
    "latitude": float(os.getenv("DEFAULT_LATITUDE", "28.6139")),
    "longitude": float(os.getenv("DEFAULT_LONGITUDE", "77.2090")),
    "altitude_m": float(os.getenv("DEFAULT_ALTITUDE_M", "120.5")),
    "scale_ratio": float(os.getenv("DEFAULT_SCALE_RATIO", "1.0"))
}
