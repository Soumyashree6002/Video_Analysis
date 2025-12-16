"""
Router for frame-related endpoints.
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path

from backend.utils.file_utils import get_frame_path

router = APIRouter(prefix="/video-frame", tags=["frames"])


@router.get("/{video_id}")
async def get_video_frame(video_id: str):
    """
    Get the first frame of a video as an image.
    
    Args:
        video_id: Unique video identifier
    
    Returns:
        Image file (JPEG)
    """
    frame_path = get_frame_path(video_id)
    
    if not frame_path.exists():
        raise HTTPException(status_code=404, detail="Frame not found. Video may not have been processed yet.")
    
    return FileResponse(
        path=str(frame_path),
        media_type="image/jpeg",
        filename=f"{video_id}_frame.jpg"
    )


