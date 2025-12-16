"""
Mathematical utility functions for viscosity analysis.
"""
import numpy as np
from scipy import stats
from typing import Tuple, Dict


def calculate_pixel_distance(point1: dict, point2: dict) -> float:
    """
    Calculate Euclidean distance between two points.
    
    Args:
        point1: Dictionary with 'x' and 'y' keys
        point2: Dictionary with 'x' and 'y' keys
    
    Returns:
        Pixel distance between the two points
    """
    x1, y1 = point1['x'], point1['y']
    x2, y2 = point2['x'], point2['y']
    
    return np.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)


def calculate_cm_per_pixel(pixel_distance: float, real_distance_cm: float) -> float:
    """
    Calculate centimeters per pixel conversion factor.
    
    Args:
        pixel_distance: Distance in pixels
        real_distance_cm: Real-world distance in centimeters
    
    Returns:
        Conversion factor (cm per pixel)
    """
    if pixel_distance == 0:
        raise ValueError("Pixel distance cannot be zero")
    
    return real_distance_cm / pixel_distance


def linear_regression(time_data: list, height_data: list) -> Dict[str, float]:
    """
    Perform linear regression on time vs height data.
    
    Args:
        time_data: List of time values (seconds)
        height_data: List of height values (cm)
    
    Returns:
        Dictionary with 'slope', 'intercept', 'r_value', 'p_value', 'std_err'
    """
    if len(time_data) != len(height_data):
        raise ValueError("Time and height data must have the same length")
    
    if len(time_data) < 2:
        raise ValueError("Need at least 2 data points for regression")
    
    time_array = np.array(time_data)
    height_array = np.array(height_data)
    
    # Perform linear regression
    slope, intercept, r_value, p_value, std_err = stats.linregress(time_array, height_array)
    
    return {
        'slope': float(slope),
        'intercept': float(intercept),
        'r_value': float(r_value),
        'p_value': float(p_value),
        'std_err': float(std_err)
    }


def calculate_viscosity(slope: float, density: float = 1.0, gravity: float = 9.81) -> float:
    """
    Calculate viscosity from the slope of height vs time.
    
    This is a simplified model. The actual formula depends on the specific
    experimental setup and fluid dynamics model being used.
    
    Args:
        slope: Slope from linear regression (cm/s)
        density: Fluid density (g/cm³), default 1.0 for water
        gravity: Gravitational acceleration (m/s²), default 9.81
    
    Returns:
        Viscosity value (Pa·s)
    
    Note:
        This is a placeholder formula. The user should provide the actual
        viscosity calculation algorithm based on their research methodology.
    """
    # Convert slope from cm/s to m/s
    slope_ms = slope / 100.0
    
    # Simplified viscosity calculation
    # This should be replaced with the actual research formula
    # Example: η = (2 * ρ * g * r^2) / (9 * v) for Stokes flow
    # For now, using a basic relationship
    viscosity = (density * gravity) / (abs(slope_ms) + 1e-6)  # Avoid division by zero
    
    return float(viscosity)


