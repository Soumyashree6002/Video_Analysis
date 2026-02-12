"""
Mathematical utility functions for viscosity analysis.
"""
import numpy as np 
from typing import Dict
from scipy.optimize import curve_fit


def calculate_pixel_distance(point1: dict, point2: dict) -> float:
    x1, y1 = point1['x'], point1['y']
    x2, y2 = point2['x'], point2['y']
    
    return abs(y2 - y1)


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


def power_law_regression(time_data: list, height_data: list) -> Dict[str, float]:
    """
    Perform power-law regression on experimental time vs height data.

    Model:
        height = a * time^b

    Assumptions:
        - All values are positive
        - Measurement noise is additive in height
    """

    if len(time_data) != len(height_data):
        raise ValueError("Time and height data must have the same length")

    if len(time_data) < 2:
        raise ValueError("Need at least 2 data points for regression")

    time = np.asarray(time_data, dtype=float)
    height = np.asarray(height_data, dtype=float)

    if np.any(time <= 0) or np.any(height <= 0):
        raise ValueError("Power-law fit requires all values to be positive")

    def power_law(t, a, b):
        return a * t**b

    # Initial guess improves convergence for experimental data
    initial_guess = (height[0], 1.0)

    try:
        popt, pcov = curve_fit(
            power_law,
            time,
            height,
            p0=initial_guess,
            maxfev=10000
        )
    except RuntimeError as e:
        raise RuntimeError("Power-law regression failed to converge") from e

    a, b = popt
    perr = np.sqrt(np.maximum(np.diag(pcov), 0))
    a_std, b_std = perr 


    # Goodness of fit (R^2)
    residuals = height - power_law(time, a, b)
    ss_res = np.sum(residuals**2)
    ss_tot = np.sum((height - np.mean(height))**2)
    if ss_tot == 0:
        r_squared = float("nan")
    else:
        r_squared = 1.0 - ss_res / ss_tot


    return {
        "a": float(a),
        "b": float(b),
        "a_std": float(a_std),
        "b_std": float(b_std),
        "r_squared": float(r_squared)
    }

def calculate_viscosity(a: float) -> float:
    viscosity = 1924.5021*(a^-2.23174)
    
    return float(viscosity)
