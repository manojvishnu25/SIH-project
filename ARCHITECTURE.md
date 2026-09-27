# AEROVISTA-X — Technical Architecture & Problem Statement Mapping
*(SIH26158: Single-Pass Drone Video to Accurate 3D Model Generation System — Team: The Sixth Syndicate)*

---

## 1. Problem Statement Requirements vs. Prototype Implementation

| Claim / Problem Statement Requirement | AEROVISTA-X Dashboard & Pipeline Implementation | Technical Mechanism |
|---|---|---|
| **Single-Pass Drone Flight** | Ingests a single `.mp4` video stream without needing overlapping grid passes | Smart keyframe extraction selects optimal camera poses along the single flight trajectory |
| **Reduced GCP Dependency** | Approximates 3D scale and orientation using flight telemetry and intrinsic camera geometry | Geo-registers model origin ($WGS84$) with altitude-based scale factor ($1\text{ unit} = 1.0\text{ m}$) |
| **Confidence-Aware 3D Twin** | Interactive "Confidence Heatmap" mode toggles vertex colors between photorealistic texture and quality overlay | Multi-factor rule-based heuristic evaluating point density, reprojection error, and observed vs AI-estimated regions |
| **Dynamic Object Removal** | Removes transient moving objects (cars, pedestrians) prior to 3D point triangulation | Pretrained YOLOv8 object detector extracts dynamic object masks to prune keypoints |
| **3D Object Identification** | Interactive 3D bounding boxes around structures, vehicles, and vegetation | Projects 2D YOLO keyframe bounding boxes into 3D camera ray intersections |
| **Interactive 3D Measurement** | Distance, Vertical Height ($\Delta Z$), and Planar Surface Area ($m^2$) tools | Real-time 3D raycasting and vector math operating directly on point cloud & mesh geometry |

---

## 2. API Endpoints Reference

### Core REST Endpoints (FastAPI)
- `POST /api/jobs/upload`: Accepts uploaded `.mp4`/`.mov` drone video, creates a job record, and spawns asynchronous pipeline execution.
- `POST /api/jobs/demo`: Instantly initializes a pre-computed demo job with sample drone flight data for judge evaluation.
- `GET /api/jobs/{job_id}/status`: Returns current pipeline stage, progress percentage ($0-100\%$), and live execution logs.
- `GET /api/jobs/{job_id}/model`: Returns static asset URLs for generated 3D models (`.gltf`, `.ply`, `.obj`), point cloud, GIS metadata, and confidence summaries.
- `GET /api/jobs/{job_id}/objects`: Returns list of 3D detected objects with labels, bounding box coordinates, volumes, and geolocations.
- `GET /api/jobs/{job_id}/poses`: Returns camera trajectory poses ($[x,y,z]$ and rotation matrices) for all keyframes.

---

## 3. Database Schema (PostGIS / SQLite Fallback)

### `jobs` Table
- `id` (VARCHAR PK): Unique job identifier (`job_xxxx` or `demo_xxxx`).
- `status` (VARCHAR): Pipeline state (`CREATED`, `EXTRACTING_KEYFRAMES`, `ESTIMATING_POSES`, `RECONSTRUCTING_3D`, `DETECTING_OBJECTS`, `MAPPING_CONFIDENCE`, `COMPLETED`, `FAILED`).
- `progress` (FLOAT): Stage completion percentage ($0.0 - 100.0$).
- `keyframes_selected` (INT): Number of sharp keyframes passing Laplacian and similarity filters.
- `sparse_points_count` (INT): Total triangulated 3D points.
- `dense_faces_count` (INT): Total surface mesh triangles.
- `avg_confidence` (FLOAT): Heuristic confidence metric ($0.0 - 1.0$).
- `geo_metadata` (JSONB): GIS origin ($lat, lon, alt$), spatial scale, confidence distribution summary.

### `camera_poses` Table
- `id` (INT PK): Primary key.
- `job_id` (VARCHAR FK): Reference to `jobs.id`.
- `frame_index` (INT): Keyframe sequence index.
- `translation` (JSONB): Camera 3D location $[x, y, z]$.
- `rotation` (JSONB): $3 \times 3$ rotation matrix or quaternion $[q_w, q_x, q_y, q_z]$.

### `detected_objects` Table
- `id` (INT PK): Primary key.
- `job_id` (VARCHAR FK): Reference to `jobs.id`.
- `label` (VARCHAR): Object classification category (Building, Vehicle, Vegetation, Infrastructure).
- `confidence` (FLOAT): Detection confidence ($0.0 - 1.0$).
- `bbox_3d` (JSONB): 3D bounding box `{center: [x,y,z], size: [dx,dy,dz]}`.
- `geo_location` (JSONB): WGS84 coordinate `{lat, lon, alt}`.
