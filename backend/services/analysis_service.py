import cv2
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
from typing import List, Dict, Tuple
from pathlib import Path

from backend.core.config import settings
from backend.utils.file_utils import get_graph_path
from backend.utils.math_utils import power_law_regression, calculate_viscosity
from backend.services.calibration_service import calibration_service
from backend.services.reference_service import reference_service
from backend.services.video_service import extract_frames_in_range

_analysis_cache = {}


def extract_topmost_y_from_frame(frame: np.ndarray) -> float | None:
    """
    Extract liquid height from a video frame using color-based detection.
    
    Uses HSV color space to detect blue liquid and finds the topmost point
    of the liquid surface to calculate height.
    
    Args:
        frame: Video frame as numpy array (BGR format)
        cm_per_pixel: Calibration factor (cm per pixel)
    
    Returns:
        Height in centimeters
    """
    # Convert to HSV for better color detection
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

    # Define range for blue color
    lower_blue = np.array([88, 45, 40])
    upper_blue = np.array([130, 255, 255])

    # Create mask for blue color
    mask = cv2.inRange(hsv, lower_blue, upper_blue)

    # Apply morphological operations to clean up the mask
    kernel = np.ones((5, 5), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

    # Find contours
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if contours:
        # Find the largest contour (assuming it's the liquid)
        largest_contour = max(contours, key=cv2.contourArea)
        
        # Get the topmost point of the contour (liquid front)
        topmost = tuple(largest_contour[largest_contour[:, :, 1].argmin()][0])
        # Return the y-coordinate of the topmost point (pixels from top of frame)
        return float(topmost[1])

    # No liquid detected
    return None


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

    # Get user-selected reference height (in pixels from top of frame)
    try:
        reference_y = reference_service.get_reference(video_id)
    except ValueError as e:
        raise ValueError(f"Reference height must be selected before analysis: {e}")

    # Extract frames in the specified time range
    frames_data = extract_frames_in_range(video_id, start_time, end_time)

    if len(frames_data) == 0:
        raise ValueError("No frames found in the specified time range")

    # Extract height (relative to reference) for each frame
    time_data = []
    height_data = []
    
    for frame_info in frames_data:
        timestamp = frame_info['timestamp']
        frame = frame_info['frame']

        # Detect topmost liquid surface position in pixels from top
        topmost_y = extract_topmost_y_from_frame(frame)
        if topmost_y is None:
            # Skip frames where liquid is not detected
            continue

        # Height in centimeters relative to user-selected reference:
        # positive when the liquid surface moves upward (toward top of frame)
        height_cm = (reference_y - topmost_y) * cm_per_pixel
        height_mm = height_cm * 10
        
        # Store relative time from start
        relative_time = timestamp - start_time
        relative_time_min = relative_time / 60

        time_data.append(relative_time_min)
        height_data.append(height_mm)
    
    if len(time_data) < 2:
        raise ValueError("Need at least 2 data points for analysis")
    
    # Filter out data points that violate power-law constraints
    # Power-law requires: time > 0 and height > 0
    filtered_time = []
    filtered_height = []
    min_positive_value = 1e-6  # Small positive value to avoid exactly zero
    
    for t, h in zip(time_data, height_data):
        # Skip first point if time is 0, and skip any points with non-positive height
        if t > min_positive_value and h > min_positive_value:
            filtered_time.append(t)
            filtered_height.append(h)
    
    if len(filtered_time) < 2:
        raise ValueError("Not enough valid data points for power-law regression (need time > 0 and height > 0)")
    
    # Perform power-law regression on filtered data
    regression_result = power_law_regression(filtered_time, filtered_height)
    a = regression_result['a']
    b = regression_result['b']
    
    # Calculate viscosity
    viscosity = calculate_viscosity(a)
    
    # Generate graph using ALL data (including filtered out points for visualization)
    graph_path = generate_graph(video_id, time_data, height_data, filtered_time, filtered_height, a, b)
    
    # Generate graph URL (relative to static files)
    # The URL will be served by FastAPI static file mount
    graph_url = f"/static/graphs/{graph_path.name}"
    results = {'viscosity': viscosity,
        'a': a,
        'b': b,
        'r_squared': regression_result['r_squared'],
        'graph_url': graph_url,
        'time_data': time_data,
        'height_data': height_data,
        'filtered_time_data': filtered_time,
        'filtered_height_data': filtered_height}

    _analysis_cache[video_id] = results
    return results

def get_cached_analysis(video_id: str):
    return _analysis_cache.get(video_id)


def generate_graph(video_id: str, time_data: List[float], height_data: List[float],
                   filtered_time: List[float], filtered_height: List[float],
                   a: float, b: float) -> Path:
    """
    Generate a matplotlib graph showing height vs time with fitted power-law curve.
    
    Args:
        video_id: Unique video identifier
        time_data: List of all time values (seconds)
        height_data: List of all height values (cm)
        filtered_time: List of time values used in regression (seconds)
        filtered_height: List of height values used in regression (cm)
        a: Coefficient from power-law regression (height = a * time^b)
        b: Exponent from power-law regression
    
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
    
    # Plot all measured data points (including those excluded from regression)
    plt.scatter(time_data, height_data, alpha=0.4, s=30, label='All Measured Data', color='#95a5a6')
    
    # Highlight filtered data points used in regression
    plt.scatter(filtered_time, filtered_height, alpha=0.8, s=50, label='Data Used in Fit', color='#2c3e50')
    
    # Plot fitted power-law curve over the range of filtered data
    if len(filtered_time) > 0:
        time_array = np.linspace(min(filtered_time), max(filtered_time), 100)
        fitted_curve = a * time_array**b
        plt.plot(time_array, fitted_curve, 'r-', linewidth=2, label=f'Fitted Curve: y = {a:.4f}x^{b:.4f}')
    
    # Labels and title
    plt.xlabel('Time (s)', fontsize=12, fontweight='bold')
    plt.ylabel('Height Change (mm)', fontsize=12, fontweight='bold')
    plt.title('Liquid Height vs Time', fontsize=14, fontweight='bold')
    plt.legend(fontsize=10)
    plt.grid(True, alpha=0.3)
    
    # Tight layout for clean appearance
    plt.tight_layout()
    
    # Save figure
    plt.savefig(graph_path, dpi=300, bbox_inches='tight')
    plt.close()
    
    return graph_path