"""
Router for reference height selection endpoints.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.services.reference_service import reference_service

router = APIRouter(prefix="/reference", tags=["reference"])


class ReferenceRequest(BaseModel):
    """Request model for setting reference height."""
    video_id: str = Field(..., description="Unique video identifier")
    reference_y: float = Field(
        ...,
        ge=0,
        description="Y-coordinate of liquid surface in pixels from top of frame",
    )


class ReferenceResponse(BaseModel):
    """Response model for reference height."""
    video_id: str
    reference_y: float
    message: str


@router.post("", response_model=ReferenceResponse)
async def set_reference(request: ReferenceRequest):
    """
    Store the user-selected reference height for a video.

    Args:
        request: Reference height request with video_id and reference_y in pixels.

    Returns:
        Confirmation with stored reference_y.
    """
    try:
        reference_y = reference_service.set_reference(request.video_id, request.reference_y)
        return ReferenceResponse(
            video_id=request.video_id,
            reference_y=reference_y,
            message="Reference height saved successfully",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save reference height: {str(e)}")

