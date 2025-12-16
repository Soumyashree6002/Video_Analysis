"""
Router for video upload endpoints.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import Optional
import os

from backend.core.config import settings
from backend.utils.file_utils import generate_video_id, get_frame_path
from backend.services.video_service import save_uploaded_video_chunk, extract_first_frame

router = APIRouter(prefix="/upload-video", tags=["upload"])


@router.post("")
async def upload_video(
    background_tasks: BackgroundTasks,
    chunk: UploadFile = File(...),
    video_id: Optional[str] = None,
    chunk_index: int = 0,
    is_last: bool = True
):
    """
    Upload video file (supports chunked uploads for large files).
    
    Args:
        background_tasks: FastAPI background tasks
        chunk: Video file chunk
        video_id: Optional video ID (if continuing upload)
        chunk_index: Index of the current chunk
        is_last: Whether this is the last chunk
    
    Returns:
        JSON response with video_id and frame_url
    """
    # Generate video ID if not provided (first chunk)
    if video_id is None:
        video_id = generate_video_id()
    
    # Validate file extension
    filename = chunk.filename or ""
    file_ext = os.path.splitext(filename)[1].lower()
    
    if file_ext not in settings.SUPPORTED_VIDEO_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format. Supported formats: {settings.SUPPORTED_VIDEO_FORMATS}"
        )
    
    # Read chunk data
    chunk_data = await chunk.read()
    
    # Save chunk
    try:
        save_uploaded_video_chunk(video_id, chunk_data, chunk_index, is_last)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save video chunk: {str(e)}")
    
    # If this is the last chunk, extract first frame
    frame_url = None
    if is_last:
        try:
            frame_path = extract_first_frame(video_id)
            # Generate URL for the frame
            frame_url = f"/static/results/{frame_path.name}"
        except Exception as e:
            # Don't fail the upload if frame extraction fails
            print(f"Warning: Failed to extract frame: {str(e)}")
    
    return JSONResponse({
        "video_id": video_id,
        "frame_url": frame_url,
        "chunk_index": chunk_index,
        "uploaded": True
    })


