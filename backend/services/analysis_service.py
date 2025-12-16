"""
Analysis service for viscosity calculation and graph generation.
"""
import cv2
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
from typing import List, Dict, Tuple
from pathlib import Path

from backend.core.config import settings
from backend.utils.file_utils import get_graph_path
from backend.utils.math_utils import linear_regression, calculate_viscosity
from backend.services.calibration_service import calibration_service
from backend.services.video_service import extract_frames_in_range


def extract_height_from_frame(frame: np.ndarray, cm_per_pixel: float) -> float:
    """
    Extract liquid height from a video frame.
    
    This is a simplified implementation. In practice, this would use
    computer vision techniques to detect the liquid surface level.
    
    Args:
        frame: Video frame as numpy array (BGR format)
        cm_per_pixel: Calibration factor (cm per pixel)
    
    Returns:
        Height in centimeters
    """
    # Convert to grayscale for processing
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    # Apply edge detection to find liquid surface
    edges = cv2.Canny(gray, 50, 150)
    
    # Find horizontal lines (liquid surface)
    # This is a simplified approach - actual implementation would be more sophisticated
    height, width = edges.shape
    
    # Find the bottom-most horizontal edge (assuming liquid fills from bottom)
    # In practice, you'd use more sophisticated CV techniques
    surface_y = height
    
    for y in range(height - 1, -1, -1):
        # Check if there's a significant horizontal edge at this row
        row_edges = np.sum(edges[y, :])
        if row_edges > width * 0.1:  # Threshold: 10% of row has edges
            surface_y = y
            break
    
    # Calculate height from bottom of frame
    pixel_height = height - surface_y
    
    # Convert to centimeters
    height_cm = pixel_height * cm_per_pixel
    
    return height_cm


def analyze_viscosity(video_id: str, start_time: float, end_time: float) -> Dict:
    """
    Perform complete viscosity analysis on a video segment.
    
    Args:
        video_id: Unique video identifier
        start_time: Start time in seconds
        end_time: End time in seconds
    
    Returns:
        Dictionary with analysis results including viscosity, slope, intercept, and graph URL
    """
    # Get calibration factor
    try:
        cm_per_pixel = calibration_service.get_calibration(video_id)
    except ValueError as e:
        raise ValueError(f"Video must be calibrated before analysis: {e}")
    
    # Extract frames in the specified time range
    frames_data = extract_frames_in_range(video_id, start_time, end_time)
    
    if len(frames_data) == 0:
        raise ValueError("No frames found in the specified time range")
    
    # Extract height for each frame
    time_data = []
    height_data = []
    
    for frame_info in frames_data:
        timestamp = frame_info['timestamp']
        frame = frame_info['frame']
        
        # Extract height from frame
        height_cm = extract_height_from_frame(frame, cm_per_pixel)
        
        time_data.append(timestamp - start_time)  # Relative time from start
        height_data.append(height_cm)
    
    if len(time_data) < 2:
        raise ValueError("Need at least 2 data points for analysis")
    
    # Perform linear regression
    regression_result = linear_regression(time_data, height_data)
    slope = regression_result['slope']
    intercept = regression_result['intercept']
    
    # Calculate viscosity
    viscosity = calculate_viscosity(slope)
    
    # Generate graph
    graph_path = generate_graph(video_id, time_data, height_data, slope, intercept)
    
    # Generate graph URL (relative to static files)
    # The URL will be served by FastAPI static file mount
    graph_url = f"/static/graphs/{graph_path.name}"
    
    return {
        'viscosity': viscosity,
        'slope': slope,
        'intercept': intercept,
        'r_value': regression_result['r_value'],
        'graph_url': graph_url,
        'time_data': time_data,
        'height_data': height_data
    }


def generate_graph(video_id: str, time_data: List[float], height_data: List[float], 
                   slope: float, intercept: float) -> Path:
    """
    Generate a matplotlib graph showing height vs time with fitted line.
    
    Args:
        video_id: Unique video identifier
        time_data: List of time values (seconds)
        height_data: List of height values (cm)
        slope: Slope from linear regression
        intercept: Intercept from linear regression
    
    Returns:
        Path to the saved graph image
    """
    graph_path = get_graph_path(video_id)
    
    # Create figure with clean, academic style
    plt.figure(figsize=(10, 6))
    try:
        plt.style.use('seaborn-v0_8-whitegrid')
    except OSError:
        # Fallback for older matplotlib versions
        try:
            plt.style.use('seaborn-whitegrid')
        except OSError:
            plt.style.use('default')
    
    # Plot data points
    plt.scatter(time_data, height_data, alpha=0.6, s=50, label='Measured Data', color='#2c3e50')
    
    # Plot fitted line
    time_array = np.array(time_data)
    fitted_line = slope * time_array + intercept
    plt.plot(time_array, fitted_line, 'r-', linewidth=2, label=f'Fitted Line: y = {slope:.4f}x + {intercept:.4f}')
    
    # Labels and title
    plt.xlabel('Time (s)', fontsize=12, fontweight='bold')
    plt.ylabel('Height (cm)', fontsize=12, fontweight='bold')
    plt.title('Liquid Height vs Time', fontsize=14, fontweight='bold')
    plt.legend(fontsize=10)
    plt.grid(True, alpha=0.3)
    
    # Tight layout for clean appearance
    plt.tight_layout()
    
    # Save figure
    plt.savefig(graph_path, dpi=300, bbox_inches='tight')
    plt.close()
    
    return graph_path

