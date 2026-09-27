import os
import cv2
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Tuple
from app.config import BLUR_THRESHOLD, SIMILARITY_THRESHOLD

def calculate_blur_score(frame: np.ndarray) -> float:
    """Calculate Variance of Laplacian as blur metric. Higher = sharper."""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())

def calculate_frame_similarity(frame1: np.ndarray, frame2: np.ndarray) -> float:
    """Calculate normalized cross-correlation / histogram similarity between frames."""
    gray1 = cv2.cvtColor(frame1, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(frame2, cv2.COLOR_BGR2GRAY)
    
    # Resize for fast comparison
    g1 = cv2.resize(gray1, (128, 128))
    g2 = cv2.resize(gray2, (128, 128))
    
    hist1 = cv2.calcHist([g1], [0], None, [32], [0, 256])
    hist2 = cv2.calcHist([g2], [0], None, [32], [0, 256])
    cv2.normalize(hist1, hist1)
    cv2.normalize(hist2, hist2)
    
    return float(cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL))

def extract_keyframes(
    video_path: str,
    output_dir: str,
    fps_stride: int = 15,
    blur_threshold: float = BLUR_THRESHOLD,
    similarity_threshold: float = SIMILARITY_THRESHOLD
) -> Dict[str, Any]:
    """
    Extract keyframes from video with blur detection and duplicate filtering.
    """
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Unable to open video file: {video_path}")
        
    total_video_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    
    frame_idx = 0
    selected_keyframes = []
    all_frames_meta = []
    
    last_selected_frame = None
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        if frame_idx % fps_stride == 0:
            timestamp = round(frame_idx / fps, 2)
            blur_score = calculate_blur_score(frame)
            is_blurry = blur_score < blur_threshold
            
            is_duplicate = False
            sim_score = 0.0
            if not is_blurry and last_selected_frame is not None:
                sim_score = calculate_frame_similarity(last_selected_frame, frame)
                if sim_score > similarity_threshold:
                    is_duplicate = True
            
            is_keyframe = (not is_blurry) and (not is_duplicate)
            
            frame_filename = f"frame_{frame_idx:05d}.jpg"
            frame_path = os.path.join(output_dir, frame_filename)
            
            meta = {
                "frame_index": frame_idx,
                "timestamp_sec": timestamp,
                "blur_score": blur_score,
                "is_blurry": is_blurry,
                "is_duplicate": is_duplicate,
                "similarity_score": sim_score,
                "is_keyframe": is_keyframe,
                "frame_path": frame_path
            }
            
            all_frames_meta.append(meta)
            
            if is_keyframe:
                cv2.imwrite(frame_path, frame)
                last_selected_frame = frame.copy()
                selected_keyframes.append(meta)
                
        frame_idx += 1
        
    cap.release()
    
    # Fallback if no frames passed threshold: select top sharpest frames
    if len(selected_keyframes) == 0 and len(all_frames_meta) > 0:
        sorted_by_sharp = sorted(all_frames_meta, key=lambda x: x["blur_score"], reverse=True)
        top_k = sorted_by_sharp[:min(10, len(sorted_by_sharp))]
        for meta in top_k:
            meta["is_keyframe"] = True
            # Re-read and write frame
            cap = cv2.VideoCapture(video_path)
            cap.set(cv2.CAP_PROP_POS_FRAMES, meta["frame_index"])
            ret, frame = cap.read()
            if ret:
                cv2.imwrite(meta["frame_path"], frame)
            cap.release()
            selected_keyframes.append(meta)

    return {
        "total_video_frames": total_video_frames,
        "total_processed": len(all_frames_meta),
        "keyframes_selected_count": len(selected_keyframes),
        "keyframes": selected_keyframes,
        "all_metadata": all_frames_meta
    }
