"""
Router for calibration endpoints.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict

from backend.services.calibration_service import calibration_service

router = APIRouter(prefix="/calibration", tags=["calibration"])


class ManualCalibrationRequest(BaseModel):
    """Request model for manual calibration."""
    video_id: str = Field(..., description="Unique video identifier")
    distance_cm: float = Field(..., gt=0, description="Real-world distance in centimeters")


class TapCalibrationRequest(BaseModel):
    """Request model for tap-based calibration."""
    video_id: str = Field(..., description="Unique video identifier")
    point1: Dict[str, float] = Field(..., description="First point with 'x' and 'y' keys")
    point2: Dict[str, float] = Field(..., description="Second point with 'x' and 'y' keys")
    real_distance_cm: float = Field(..., gt=0, description="Real-world distance between points in centimeters")


class CalibrationResponse(BaseModel):
    """Response model for calibration."""
    video_id: str
    cm_per_pixel: float
    message: str


@router.post("/manual", response_model=CalibrationResponse)
async def calibrate_manual(request: ManualCalibrationRequest):
    """
    Perform manual calibration using a known distance.
    
    Args:
        request: Manual calibration request with video_id and distance_cm
    
    Returns:
        Calibration response with cm_per_pixel factor
    """
    try:
        cm_per_pixel = calibration_service.calibrate_manual(
            request.video_id,
            request.distance_cm
        )
        
        return CalibrationResponse(
            video_id=request.video_id,
            cm_per_pixel=cm_per_pixel,
            message="Manual calibration completed successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calibration failed: {str(e)}")


@router.post("/tap", response_model=CalibrationResponse)
async def calibrate_tap(request: TapCalibrationRequest):
    """
    Perform calibration using two tapped points on the image.
    
    Args:
        request: Tap calibration request with video_id, two points, and real distance
    
    Returns:
        Calibration response with cm_per_pixel factor
    """
    # Validate points
    if 'x' not in request.point1 or 'y' not in request.point1:
        raise HTTPException(status_code=400, detail="point1 must contain 'x' and 'y' keys")
    
    if 'x' not in request.point2 or 'y' not in request.point2:
        raise HTTPException(status_code=400, detail="point2 must contain 'x' and 'y' keys")
    
    try:
        cm_per_pixel = calibration_service.calibrate_tap(
            request.video_id,
            request.point1,
            request.point2,
            request.real_distance_cm
        )
        
        return CalibrationResponse(
            video_id=request.video_id,
            cm_per_pixel=cm_per_pixel,
            message="Tap-based calibration completed successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calibration failed: {str(e)}")


