"""
Router for frame-related endpoints.
"""
from typing import Optional

import cv2
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse, Response
from pathlib import Path

from backend.utils.file_utils import get_frame_path
from backend.services.video_service import extract_frame_at_time

router = APIRouter(prefix="/video-frame", tags=["frames"])


@router.get("/{video_id}")
async def get_video_frame(video_id: str, timestamp: Optional[float] = Query(default=None, ge=0.0)):
    """
    Get a video frame as an image.

    - Without timestamp: returns the first extracted frame.
    - With timestamp: extracts the frame at the requested time (in seconds).
    """
    if timestamp is None:
        frame_path = get_frame_path(video_id)

        if not frame_path.exists():
            raise HTTPException(
                status_code=404,
                detail="Frame not found. Video may not have been processed yet.",
            )

        return FileResponse(
            path=str(frame_path),
            media_type="image/jpeg",
            filename=f"{video_id}_frame.jpg",
        )

    # Dynamic frame extraction at specific timestamp
    frame = extract_frame_at_time(video_id, timestamp)

    success, buffer = cv2.imencode(".jpg", frame)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to encode frame")

    return Response(content=buffer.tobytes(), media_type="image/jpeg")


