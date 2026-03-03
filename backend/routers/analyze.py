"""
Router for analysis endpoints.
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List

from backend.services.analysis_service import analyze_viscosity
from backend.services.calibration_service import calibration_service
from backend.services.reference_service import reference_service

router = APIRouter(prefix="/analyze", tags=["analysis"])


class TimeRangeRequest(BaseModel):
    """Request model for time range selection."""
    video_id: str = Field(..., description="Unique video identifier")
    start_time: float = Field(..., ge=0, description="Start time in seconds")
    end_time: float = Field(..., gt=0, description="End time in seconds")


class AnalyzeRequest(BaseModel):
    """Request model for viscosity analysis."""
    video_id: str = Field(..., description="Unique video identifier")


class AnalysisResponse(BaseModel):
    """Response model for analysis results."""
    video_id: str
    viscosity: float
    a: float  # Coefficient from power-law regression
    b: float  # Exponent from power-law regression
    r_squared: Optional[float] = None
    graph_url: str
    message: str


# Store time ranges (in production, use database)
_time_ranges = {}


@router.post("/select-time-range")
async def select_time_range(request: TimeRangeRequest):
    """
    Store the selected time range for analysis.
    
    Args:
        request: Time range request with video_id, start_time, and end_time
    
    Returns:
        Success message
    """
    if request.start_time >= request.end_time:
        raise HTTPException(status_code=400, detail="start_time must be less than end_time")
    
    _time_ranges[request.video_id] = {
        'start_time': request.start_time,
        'end_time': request.end_time
    }
    
    return {
        "video_id": request.video_id,
        "start_time": request.start_time,
        "end_time": request.end_time,
        "message": "Time range selected successfully"
    }


@router.post("", response_model=AnalysisResponse)
async def analyze(background_tasks: BackgroundTasks, request: AnalyzeRequest):
    """
    Perform viscosity analysis on the video.
    
    Requires:
    - Video to be calibrated (via /calibration/manual or /calibration/tap)
    - Time range to be selected (via /select-time-range)
    
    Args:
        background_tasks: FastAPI background tasks
        request: Analysis request with video_id
    
    Returns:
        Analysis results including viscosity, regression parameters, and graph URL
    """
    # Check if video is calibrated
    try:
        calibration_service.get_calibration(request.video_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Video must be calibrated before analysis. Use /calibration/manual or /calibration/tap"
        )
    
    # Get time range
    if request.video_id not in _time_ranges:
        raise HTTPException(
            status_code=400,
            detail="Time range must be selected before analysis. Use /select-time-range"
        )
    
    time_range = _time_ranges[request.video_id]
    start_time = time_range['start_time']
    end_time = time_range['end_time']

    # Ensure reference height has been selected
    try:
        reference_service.get_reference(request.video_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Reference height must be selected before analysis."
        )

    try:
        # Perform analysis
        results = analyze_viscosity(request.video_id, start_time, end_time)
        
        return AnalysisResponse(
            video_id=request.video_id,
            viscosity=results['viscosity'],
            a=results['a'],     
            b=results['b'],      
            r_squared=results.get('r_squared'),
            graph_url=results['graph_url'],
            message="Analysis completed successfully"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


