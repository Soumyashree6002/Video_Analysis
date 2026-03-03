"""
Reference height service for storing user-selected liquid surface positions.
"""
from typing import Dict


class ReferenceService:
    """Service for handling per-video reference height (in pixels)."""

    def __init__(self) -> None:
        # video_id -> reference_y (pixel coordinate from top of frame)
        self._references: Dict[str, float] = {}

    def set_reference(self, video_id: str, reference_y: float) -> float:
        """
        Store the reference y-coordinate (in pixels) for a video.

        Args:
            video_id: Unique video identifier.
            reference_y: Y-coordinate of the liquid surface in pixels
                         measured from the top of the frame.

        Returns:
            The stored reference_y value.
        """
        if reference_y < 0:
            raise ValueError("reference_y must be non-negative")

        self._references[video_id] = float(reference_y)
        return self._references[video_id]

    def get_reference(self, video_id: str) -> float:
        """
        Get the stored reference y-coordinate (in pixels) for a video.

        Args:
            video_id: Unique video identifier.

        Returns:
            Reference y-coordinate in pixels.

        Raises:
            ValueError: If no reference has been stored for this video.
        """
        if video_id not in self._references:
            raise ValueError(f"Reference height for video {video_id} has not been set")

        return self._references[video_id]


# Global reference service instance
reference_service = ReferenceService()

