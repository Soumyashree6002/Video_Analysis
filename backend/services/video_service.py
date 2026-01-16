"""
Improved hybrid video processing service with safe upload,
first-frame extraction, metadata, and hybrid sampling strategy.
"""

import cv2
from pathlib import Path
from fastapi import HTTPException

from backend.utils.file_utils import get_video_path, get_frame_path


def save_uploaded_video_chunk(video_id: str, chunk: bytes, chunk_index: int, is_last: bool) -> None:
    video_path = get_video_path(video_id)
    video_path.parent.mkdir(parents=True, exist_ok=True)

    mode = 'ab' if chunk_index > 0 else 'wb'
    with open(video_path, mode) as f:
        f.write(chunk)

    if is_last:
        if not video_path.exists() or video_path.stat().st_size == 0:
            raise HTTPException(status_code=500, detail="Final video chunk write failed")


def extract_first_frame(video_id: str) -> Path:
    video_path = get_video_path(video_id)
    frame_path = get_frame_path(video_id)

    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Video file not found")

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise HTTPException(status_code=500, detail="Failed to open video file")

    try:
        ret, frame = cap.read()
        if not ret:
            raise HTTPException(status_code=500, detail="Failed to read first frame")

        frame_path.parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(str(frame_path), frame)
        return frame_path

    finally:
        cap.release()


def get_video_info(video_id: str) -> dict:
    video_path = get_video_path(video_id)

    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Video file not found")

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise HTTPException(status_code=500, detail="Failed to open video file")

    try:
        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps <= 0:
            raise HTTPException(status_code=500, detail="Invalid FPS detected")

        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        duration = frame_count / fps

        return {
            "fps": float(fps),
            "frame_count": frame_count,
            "width": width,
            "height": height,
            "duration": float(duration),
        }

    finally:
        cap.release()


def extract_frames_in_range(video_id: str, start_time: float, end_time: float, max_frames: int = 200) -> list:
    """
    Hybrid sampling strategy:
    - If codec seek is accurate -> uses direct seeking (fast)
    - Else -> sequential fallback for accuracy
    """

    video_path = get_video_path(video_id)

    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Video file not found")

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise HTTPException(status_code=500, detail="Failed to open video file")

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        raise HTTPException(status_code=500, detail="Invalid FPS")

    start_frame = int(start_time * fps)
    end_frame = int(end_time * fps)
    total_frames = max(0, end_frame - start_frame + 1)

    if total_frames <= max_frames:
        frame_indices = list(range(start_frame, end_frame + 1))
    else:
        step = total_frames / max_frames
        frame_indices = [int(start_frame + i * step) for i in range(max_frames)]

    frames_data = []

    try:
        cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)

        # test if seeking works reliably
        test_idx = frame_indices[len(frame_indices)//2]
        cap.set(cv2.CAP_PROP_POS_FRAMES, test_idx)
        ret, test_frame = cap.read()
        seek_works = bool(ret and test_frame is not None)

        if seek_works:
            # Fast seek-based sampling
            for idx in frame_indices:
                cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
                ret, frame = cap.read()
                if not ret:
                    continue
                frames_data.append({
                    "frame": frame,
                    "timestamp": idx / fps,
                    "frame_number": idx,
                })
        else:
            # Accurate sequential fallback
            current = start_frame
            cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
            frame_index_set = set(frame_indices)

            while current <= end_frame:
                ret, frame = cap.read()
                if not ret:
                    break
                if current in frame_index_set:
                    frames_data.append({
                        "frame": frame,
                        "timestamp": current / fps,
                        "frame_number": current,
                    })
                current += 1

    finally:
        cap.release()

    return frames_data
