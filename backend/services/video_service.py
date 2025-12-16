"""
Video processing service for handling uploads and frame extraction.
"""
import cv2
import os
from pathlib import Path
from typing import Optional, Tuple
from fastapi import UploadFile, HTTPException

from backend.core.config import settings
from backend.utils.file_utils import get_video_path, get_frame_path, generate_video_id


def save_uploaded_video_chunk(video_id: str, chunk: bytes, chunk_index: int, is_last: bool) -> None:
    """
    Save a video chunk to disk.
    
    Args:
        video_id: Unique video identifier
        chunk: Binary chunk data
        chunk_index: Index of the chunk (0-based)
        is_last: Whether this is the last chunk
    """
    video_path = get_video_path(video_id)
    
    # Append chunk to file
    mode = 'ab' if chunk_index > 0 else 'wb'
    with open(video_path, mode) as f:
        f.write(chunk)


def extract_first_frame(video_id: str) -> Path:
    """
    Extract the first frame from a video and save it as an image.
    
    Args:
        video_id: Unique video identifier
    
    Returns:
        Path to the saved frame image
    
    Raises:
        HTTPException: If video cannot be opened or frame cannot be extracted
    """
    video_path = get_video_path(video_id)
    frame_path = get_frame_path(video_id)
    
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Video file not found")
    
    # Open video file
    cap = cv2.VideoCapture(str(video_path))
    
    if not cap.isOpened():
        raise HTTPException(status_code=500, detail="Failed to open video file")
    
    try:
        # Read first frame
        ret, frame = cap.read()
        
        if not ret or frame is None:
            raise HTTPException(status_code=500, detail="Failed to read frame from video")
        
        # Save frame as JPEG
        cv2.imwrite(str(frame_path), frame)
        
        if not frame_path.exists():
            raise HTTPException(status_code=500, detail="Failed to save frame image")
        
        return frame_path
    
    finally:
        cap.release()


def get_video_info(video_id: str) -> dict:
    """
    Get video metadata (duration, fps, resolution).
    
    Args:
        video_id: Unique video identifier
    
    Returns:
        Dictionary with video information
    """
    video_path = get_video_path(video_id)
    
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Video file not found")
    
    cap = cv2.VideoCapture(str(video_path))
    
    if not cap.isOpened():
        raise HTTPException(status_code=500, detail="Failed to open video file")
    
    try:
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        duration = frame_count / fps if fps > 0 else 0
        
        return {
            'fps': float(fps),
            'frame_count': frame_count,
            'width': width,
            'height': height,
            'duration': float(duration)
        }
    finally:
        cap.release()


def extract_frames_in_range(video_id: str, start_time: float, end_time: float) -> list:
    """
    Extract frames within a time range for analysis.
    
    Args:
        video_id: Unique video identifier
        start_time: Start time in seconds
        end_time: End time in seconds
    
    Returns:
        List of frames (numpy arrays) with timestamps
    """
    video_path = get_video_path(video_id)
    
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Video file not found")
    
    cap = cv2.VideoCapture(str(video_path))
    
    if not cap.isOpened():
        raise HTTPException(status_code=500, detail="Failed to open video file")
    
    fps = cap.get(cv2.CAP_PROP_FPS)
    start_frame = int(start_time * fps)
    end_frame = int(end_time * fps)
    
    frames_data = []
    
    try:
        cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
        
        current_frame = start_frame
        while current_frame <= end_frame:
            ret, frame = cap.read()
            
            if not ret:
                break
            
            timestamp = current_frame / fps
            frames_data.append({
                'frame': frame,
                'timestamp': timestamp,
                'frame_number': current_frame
            })
            
            current_frame += 1
    
    finally:
        cap.release()
    
    return frames_data

