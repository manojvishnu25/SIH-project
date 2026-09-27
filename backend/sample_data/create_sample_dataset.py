import os
import cv2
import numpy as np
from pathlib import Path

def generate_sample_drone_video(output_path: str, duration_sec: int = 10, fps: int = 30):
    """
    Synthesize a sample aerial drone video orbiting a 3D building complex with terrain.
    """
    Path(os.path.dirname(output_path)).mkdir(parents=True, exist_ok=True)
    width, height = 1280, 720
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    total_frames = duration_sec * fps

    for i in range(total_frames):
        # Create aerial terrain canvas
        img = np.zeros((height, width, 3), dtype=np.uint8)
        img[:, :] = [70, 140, 70] # Green lawn base

        angle = (2.0 * np.pi * i) / total_frames
        
        # Center building perspective transform
        cx = int(width / 2 + np.cos(angle) * 150)
        cy = int(height / 2 + np.sin(angle) * 80)
        
        # Draw courtyard pavement
        cv2.rectangle(img, (cx - 250, cy - 180), (cx + 250, cy + 180), (160, 160, 160), -1)
        
        # Draw Building Roof Structure (Terracotta tile)
        pts = np.array([
            [cx - 140, cy - 100],
            [cx + 140, cy - 100],
            [cx + 180, cy + 100],
            [cx - 100, cy + 100]
        ], np.int32)
        cv2.fillPoly(img, [pts], (60, 80, 210))
        cv2.polylines(img, [pts], True, (30, 40, 140), 3)

        # Draw Solar Panel Arrays on roof
        cv2.rectangle(img, (cx - 80, cy - 70), (cx + 40, cy - 20), (180, 100, 30), -1)

        # Draw Vehicles in Parking Lot
        cv2.rectangle(img, (cx + 180, cy + 40), (cx + 220, cy + 110), (40, 40, 200), -1) # Red Car
        cv2.rectangle(img, (cx - 220, cy + 60), (cx - 180, cy + 130), (220, 220, 220), -1) # White SUV

        # Draw Tree Canopies
        cv2.circle(img, (cx - 280, cy - 150), 45, (40, 180, 40), -1)
        cv2.circle(img, (cx + 260, cy - 140), 50, (30, 160, 30), -1)

        # Add Drone Telemetry OSD Overlay
        cv2.putText(img, f"AEROVISTA-X DRONE TELEMETRY | ALT: 120.5m | LAT: 28.6139 | LON: 77.2090", (30, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        cv2.putText(img, f"FRAME: {i:04d} / {total_frames} | HEADING: {int(np.degrees(angle)) % 360} DEG", (30, 75),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)

        out.write(img)

    out.release()
    print(f"[SampleGenerator] Generated drone video at: {output_path}")

if __name__ == "__main__":
    out_file = os.path.join(os.path.dirname(__file__), "sample_drone_flight.mp4")
    generate_sample_drone_video(out_file)
