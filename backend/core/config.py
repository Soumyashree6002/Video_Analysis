"""
Configuration settings for the video analysis backend.
"""
import os
from pathlib import Path
from typing import Optional

class Settings:
    """Application settings."""
    
    # Base paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    UPLOAD_DIR: Path = BASE_DIR / "backend" / "uploads"
    STATIC_DIR: Path = BASE_DIR / "backend" / "static"
    RESULTS_DIR: Path = STATIC_DIR / "results"
    GRAPHS_DIR: Path = STATIC_DIR / "graphs"
    
    # API settings
    API_V1_PREFIX: str = "/api/v1"
    MAX_UPLOAD_SIZE: int = 500 * 1024 * 1024  # 500MB
    CHUNK_SIZE: int = 10 * 1024 * 1024  # 10MB chunks
    
    # Video processing
    SUPPORTED_VIDEO_FORMATS: list = [".mp4", ".mov", ".avi", ".mkv"]
    
    # Temporary file cleanup (in seconds)
    TEMP_FILE_TTL: int = 3600  # 1 hour
    
    def __init__(self):
        """Initialize directories."""
        self.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        self.STATIC_DIR.mkdir(parents=True, exist_ok=True)
        self.RESULTS_DIR.mkdir(parents=True, exist_ok=True)
        self.GRAPHS_DIR.mkdir(parents=True, exist_ok=True)

settings = Settings()


