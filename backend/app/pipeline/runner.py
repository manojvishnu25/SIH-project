import os
import time
import json
import traceback
from pathlib import Path
from sqlalchemy.orm import Session

from app.config import PROCESSED_DIR, DEFAULT_GEO_ORIGIN
from app.models import JobModel, JobStatus, CameraPoseModel, DetectedObjectModel
from app.pipeline.keyframe_selector import extract_keyframes
from app.pipeline.sfm_reconstruction import estimate_camera_poses_and_sparse_cloud
from app.pipeline.dense_meshing import generate_dense_mesh
from app.pipeline.object_detector import ObjectDetector
from app.pipeline.confidence_mapper import map_mesh_confidence

def update_job(db: Session, job: JobModel, status: JobStatus, progress: float, step_name: str, log_msg: str):
    job.status = status.value
    job.progress = progress
    job.current_step = step_name
    if not job.logs:
        job.logs = []
    timestamp_str = time.strftime("[%H:%M:%S]")
    job.logs = job.logs + [f"{timestamp_str} {log_msg}"]
    db.commit()
    db.refresh(job)

def run_reconstruction_pipeline(job_id: str, video_path: str, db: Session):
    """
    Execute full end-to-end drone video to 3D model pipeline.
    """
    job = db.query(JobModel).filter(JobModel.id == job_id).first()
    if not job:
        return

    job_output_dir = os.path.join(PROCESSED_DIR, job_id)
    keyframes_dir = os.path.join(job_output_dir, "keyframes")
    Path(keyframes_dir).mkdir(parents=True, exist_ok=True)

    try:
        # Step 1: Keyframe Extraction & Filtering
        update_job(db, job, JobStatus.EXTRACTING_KEYFRAMES, 15.0, "Extracting Keyframes", "Starting video keyframe extraction & blur/duplicate filtering...")
        kf_results = extract_keyframes(video_path, keyframes_dir, fps_stride=15)
        
        job.total_frames = kf_results["total_video_frames"]
        job.keyframes_selected = kf_results["keyframes_selected_count"]
        db.commit()
        
        update_job(db, job, JobStatus.EXTRACTING_KEYFRAMES, 30.0, "Keyframes Extracted", f"Selected {job.keyframes_selected} sharp keyframes from {job.total_frames} video frames.")

        # Step 2: Camera Pose Estimation (Structure from Motion)
        update_job(db, job, JobStatus.ESTIMATING_POSES, 45.0, "SfM Pose Estimation", "Computing SIFT/ORB keypoints & estimating camera extrinsic matrices...")
        keyframe_paths = [kf["frame_path"] for kf in kf_results["keyframes"]]
        sfm_res = estimate_camera_poses_and_sparse_cloud(keyframe_paths)

        # Store camera poses in database
        for pose_data in sfm_res["camera_poses"]:
            pose_rec = CameraPoseModel(
                job_id=job_id,
                frame_index=pose_data["frame_index"],
                timestamp_sec=float(pose_data["frame_index"] * 0.5),
                blur_score=95.0,
                is_keyframe=1,
                translation=pose_data["translation"],
                rotation=pose_data["rotation"],
                confidence=pose_data["confidence"]
            )
            db.add(pose_rec)
        
        job.sparse_points_count = sfm_res["sparse_count"]
        db.commit()
        
        update_job(db, job, JobStatus.ESTIMATING_POSES, 60.0, "Camera Trajectory Recovered", f"Estimated camera poses for {len(sfm_res['camera_poses'])} keyframes. Triangulated {job.sparse_points_count} sparse points.")

        # Step 3: Dense 3D Surface Mesh Generation
        update_job(db, job, JobStatus.RECONSTRUCTING_3D, 75.0, "3D Mesh Reconstruction", "Running Poisson Surface Reconstruction & generating GLTF 3D model...")
        mesh_res = generate_dense_mesh(sfm_res["points_3d"], sfm_res["colors_3d"], job_output_dir, job_id)
        
        job.dense_faces_count = mesh_res["face_count"]
        db.commit()

        # Step 4: Object Detection & 3D Projection
        update_job(db, job, JobStatus.DETECTING_OBJECTS, 85.0, "YOLO Object Detection", "Detecting buildings, vehicles & vegetation; projecting bounding volumes into 3D...")
        detector = ObjectDetector()
        
        # Sample detections on first keyframe
        kf_dets = detector.detect_objects_in_image(keyframe_paths[0]) if keyframe_paths else []
        
        # Project into 3D
        bounds = {"min_x": -10.0, "max_x": 10.0, "min_y": -10.0, "max_y": 10.0, "min_z": 0.0, "max_z": 8.0}
        objects_3d = detector.project_detections_to_3d(kf_dets, sfm_res["camera_poses"], bounds)
        
        for obj in objects_3d:
            obj_rec = DetectedObjectModel(
                job_id=job_id,
                label=obj["label"],
                confidence=obj["confidence"],
                bbox_2d=obj.get("bbox_2d"),
                bbox_3d=obj["bbox_3d"],
                color_hex=obj["color_hex"],
                geo_location=obj.get("geo_location")
            )
            db.add(obj_rec)
            
        job.objects_count = len(objects_3d)
        db.commit()

        # Step 5: Confidence Mapping & GIS Geo-referencing
        update_job(db, job, JobStatus.MAPPING_CONFIDENCE, 95.0, "Confidence Heatmap Calculation", "Evaluating point density & reprojection error heuristic scores...")
        conf_res = map_mesh_confidence(sfm_res["points_3d"], sfm_res["camera_poses"])
        
        job.avg_confidence = conf_res["avg_confidence"]
        job.geo_metadata = {
            "origin": DEFAULT_GEO_ORIGIN,
            "confidence_summary": conf_res["summary"],
            "mesh_paths": {
                "gltf": f"/data/processed/{job_id}/{job_id}_mesh.gltf",
                "ply": f"/data/processed/{job_id}/{job_id}_mesh.ply",
                "obj": f"/data/processed/{job_id}/{job_id}_mesh.obj",
                "cloud": f"/data/processed/{job_id}/{job_id}_cloud.ply"
            }
        }
        
        # Save confidence details JSON
        with open(os.path.join(job_output_dir, "confidence_data.json"), "w") as f:
            json.dump(conf_res, f)

        db.commit()

        # Final Completion
        update_job(db, job, JobStatus.COMPLETED, 100.0, "Pipeline Execution Complete", "3D Digital Twin ready for interactive visualization & measurement.")

    except Exception as e:
        err_msg = f"Pipeline execution failed: {str(e)}\n{traceback.format_exc()}"
        print(f"[RunnerError] {err_msg}")
        update_job(db, job, JobStatus.FAILED, job.progress, "Pipeline Error", f"Error: {str(e)}")
