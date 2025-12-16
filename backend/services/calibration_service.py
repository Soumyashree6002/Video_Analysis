"""
Calibration service for pixel-to-centimeter conversion.
"""
from typing import Dict
from backend.utils.math_utils import calculate_pixel_distance, calculate_cm_per_pixel


class CalibrationService:
    """Service for handling calibration operations."""
    
    def __init__(self):
        """Initialize calibration service."""
        self._calibrations: Dict[str, float] = {}  # video_id -> cm_per_pixel
    
    def calibrate_manual(self, video_id: str, distance_cm: float, reference_pixel_distance: float = None) -> float:
        """
        Perform manual calibration using a known distance.
        
        Args:
            video_id: Unique video identifier
            distance_cm: Real-world distance in centimeters
            reference_pixel_distance: Optional reference pixel distance (if not provided, uses default)
        
        Returns:
            cm_per_pixel conversion factor
        """
        # If no reference pixel distance provided, use a default based on typical screen sizes
        # This is a simplified approach - in practice, you might need frame dimensions
        if reference_pixel_distance is None:
            # Default assumption: 100 pixels = distance_cm (user should provide actual measurement)
            reference_pixel_distance = 100.0
        
        cm_per_pixel = calculate_cm_per_pixel(reference_pixel_distance, distance_cm)
        self._calibrations[video_id] = cm_per_pixel
        
        return cm_per_pixel
    
    def calibrate_tap(self, video_id: str, point1: Dict[str, float], point2: Dict[str, float], real_distance_cm: float) -> float:
        """
        Perform calibration using two tapped points.
        
        Args:
            video_id: Unique video identifier
            point1: Dictionary with 'x' and 'y' keys (pixel coordinates)
            point2: Dictionary with 'x' and 'y' keys (pixel coordinates)
            real_distance_cm: Real-world distance between the two points in centimeters
        
        Returns:
            cm_per_pixel conversion factor
        """
        # Calculate pixel distance between the two points
        pixel_distance = calculate_pixel_distance(point1, point2)
        
        # Calculate conversion factor
        cm_per_pixel = calculate_cm_per_pixel(pixel_distance, real_distance_cm)
        
        # Store calibration for this video
        self._calibrations[video_id] = cm_per_pixel
        
        return cm_per_pixel
    
    def get_calibration(self, video_id: str) -> float:
        """
        Get the calibration factor for a video.
        
        Args:
            video_id: Unique video identifier
        
        Returns:
            cm_per_pixel conversion factor
        
        Raises:
            ValueError: If video has not been calibrated
        """
        if video_id not in self._calibrations:
            raise ValueError(f"Video {video_id} has not been calibrated")
        
        return self._calibrations[video_id]
    
    def pixel_to_cm(self, video_id: str, pixel_distance: float) -> float:
        """
        Convert pixel distance to centimeters.
        
        Args:
            video_id: Unique video identifier
            pixel_distance: Distance in pixels
        
        Returns:
            Distance in centimeters
        """
        cm_per_pixel = self.get_calibration(video_id)
        return pixel_distance * cm_per_pixel


# Global calibration service instance
calibration_service = CalibrationService()

