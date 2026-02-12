"""
Router for report generation endpoints.
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from typing import Optional

from backend.utils.file_utils import get_report_path, cleanup_temp_files
from backend.services.report_service import generate_report
from backend.services.analysis_service import analyze_viscosity, get_cached_analysis
from backend.services.calibration_service import calibration_service
from backend.routers.analyze import _time_ranges

router = APIRouter(prefix="/report", tags=["report"])


@router.get("/{video_id}")
async def get_report(background_tasks: BackgroundTasks, video_id: str):
    """
    Generate and return a PDF report for the analysis.
    
    Requires:
    - Video to be calibrated
    - Analysis to be completed (or will run analysis automatically)
    
    Args:
        background_tasks: FastAPI background tasks
        video_id: Unique video identifier
    
    Returns:
        PDF file
    """
    report_path = get_report_path(video_id)
    
    # If report doesn't exist, generate it
    if not report_path.exists():
        # Check if analysis has been done (we'll need to get results)
        # For now, we'll run analysis if needed
        
        # Check calibration
        try:
            calibration_service.get_calibration(video_id)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Video must be calibrated before generating report"
            )
        
        # Get time range
        if video_id not in _time_ranges:
            raise HTTPException(
                status_code=400,
                detail="Time range must be selected before generating report"
            )
        
        time_range = _time_ranges[video_id]
        
        try:
            # Run analysis to get results
            results = get_cached_analysis(video_id)

            if results is None:
                results = analyze_viscosity(video_id, time_range['start_time'], time_range['end_time'])

            
            # Generate report
            generate_report(
                video_id,
                results['viscosity'],
                results['a'],
                results['b'],
                results.get('r_squared')
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")
    
    # Schedule cleanup of temporary files after response
    background_tasks.add_task(cleanup_temp_files, video_id)
    
    return FileResponse(
        path=str(report_path),
        media_type="application/pdf",
        filename=f"{video_id}_report.pdf"
    )


