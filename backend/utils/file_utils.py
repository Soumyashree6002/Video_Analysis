"""
File utility functions for handling uploads and temporary files.
"""
import os
import uuid
from pathlib import Path
from typing import Optional
from datetime import datetime, timedelta

from backend.core.config import settings


def generate_video_id() -> str:
    """Generate a unique video ID."""
    return str(uuid.uuid4())


def get_video_path(video_id: str) -> Path:
    """Get the file path for a video ID."""
    return settings.UPLOAD_DIR / f"{video_id}.mp4"


def get_frame_path(video_id: str) -> Path:
    """Get the file path for an extracted frame."""
    return settings.STATIC_DIR / "results" / f"{video_id}_frame.jpg"


def get_graph_path(video_id: str) -> Path:
    """Get the file path for a generated graph."""
    return settings.GRAPHS_DIR / f"{video_id}_graph.png"


def get_report_path(video_id: str) -> Path:
    """Get the file path for a generated report."""
    return settings.RESULTS_DIR / f"{video_id}_report.pdf"


def cleanup_temp_files(video_id: str) -> None:
    """Delete temporary files associated with a video ID."""
    files_to_delete = [
        get_video_path(video_id),
        get_frame_path(video_id),
        get_graph_path(video_id),
    ]
    
    for file_path in files_to_delete:
        if file_path.exists():
            try:
                file_path.unlink()
            except Exception as e:
                print(f"Error deleting {file_path}: {e}")


def cleanup_old_files(max_age_hours: int = 24) -> None:
    """Clean up files older than max_age_hours."""
    cutoff_time = datetime.now() - timedelta(hours=max_age_hours)
    
    for directory in [settings.UPLOAD_DIR, settings.RESULTS_DIR, settings.GRAPHS_DIR]:
        if not directory.exists():
            continue
            
        for file_path in directory.iterdir():
            if file_path.is_file():
                file_mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
                if file_mtime < cutoff_time:
                    try:
                        file_path.unlink()
                    except Exception as e:
                        print(f"Error deleting old file {file_path}: {e}")










