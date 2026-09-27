import numpy as np
from typing import List, Dict, Any, Tuple

def map_mesh_confidence(
    points_3d: List[List[float]],
    camera_poses: List[Dict[str, Any]],
    ai_estimated_ratio: float = 0.15
) -> Dict[str, Any]:
    """
    Compute rule-based 3D confidence heuristic map for mesh & point cloud:
    Confidence = w1 * PointDensity + w2 * (1 - ReprojectionError) + w3 * ObservationFlag
    """
    pts = np.array(points_3d, dtype=np.float32)
    num_points = len(pts)

    if num_points == 0:
        return {"avg_confidence": 0.0, "confidence_colors": [], "summary": {}}

    # 1. Point Density Heuristic
    # Distance to k-nearest neighbors
    from scipy.spatial import KDTree
    tree = KDTree(pts)
    distances, _ = tree.query(pts, k=min(10, num_points))
    mean_neighbor_dist = np.mean(distances[:, 1:], axis=1) # Exclude distance to self
    
    # Normalize density score (smaller distance = higher density)
    max_d = np.percentile(mean_neighbor_dist, 95) + 1e-5
    density_score = np.clip(1.0 - (mean_neighbor_dist / max_d), 0.0, 1.0)

    # 2. Simulated Reprojection Error (0.2px to 2.5px)
    reproj_errors = np.random.uniform(0.2, 2.2, size=num_points)
    reproj_score = np.clip(1.0 - (reproj_errors / 3.0), 0.0, 1.0)

    # 3. Observed vs AI-Estimated Flag
    # Randomly flag low-texture occluded points (e.g. shadowed roof corners) as AI-estimated
    is_ai_estimated = np.random.rand(num_points) < ai_estimated_ratio
    obs_score = np.where(is_ai_estimated, 0.4, 1.0)

    # Combined Confidence Score (0.0 to 1.0)
    confidence_scores = (0.45 * density_score) + (0.35 * reproj_score) + (0.20 * obs_score)
    confidence_scores = np.clip(confidence_scores, 0.0, 1.0)

    avg_conf = float(np.mean(confidence_scores))

    # Generate Heatmap RGB Colors:
    # High (>0.7) -> Green [34, 197, 94]
    # Medium (0.4-0.7) -> Yellow [234, 179, 8]
    # Low (<0.4) -> Red [239, 68, 68]
    confidence_colors = []
    high_count, med_count, low_count = 0, 0, 0

    for score in confidence_scores:
        if score >= 0.7:
            high_count += 1
            # Interpolate Yellow to Green
            t = (score - 0.7) / 0.3
            r = int(234 * (1 - t) + 34 * t)
            g = int(179 * (1 - t) + 197 * t)
            b = int(8 * (1 - t) + 94 * t)
        elif score >= 0.4:
            med_count += 1
            # Interpolate Red to Yellow
            t = (score - 0.4) / 0.3
            r = int(239 * (1 - t) + 234 * t)
            g = int(68 * (1 - t) + 179 * t)
            b = int(68 * (1 - t) + 8 * t)
        else:
            low_count += 1
            r, g, b = 239, 68, 68 # Solid Red

        confidence_colors.append([r, g, b])

    return {
        "avg_confidence": round(avg_conf, 3),
        "confidence_scores": confidence_scores.tolist(),
        "confidence_colors": confidence_colors,
        "summary": {
            "high_confidence_pct": round((high_count / num_points) * 100, 1),
            "medium_confidence_pct": round((med_count / num_points) * 100, 1),
            "low_confidence_pct": round((low_count / num_points) * 100, 1),
            "observed_points_count": int(np.sum(~is_ai_estimated)),
            "ai_estimated_points_count": int(np.sum(is_ai_estimated))
        }
    }
