/**
 * Validation utility functions.
 */

/**
 * Validate video file.
 * @param {string} uri - File URI
 * @returns {boolean}
 */
export const isValidVideoFile = (uri) => {
  if (!uri) return false;
  const ext = uri.toLowerCase().split('.').pop();
  const validExtensions = ['mp4', 'mov', 'avi', 'mkv'];
  return validExtensions.includes(ext);
};

/**
 * Validate time range.
 * @param {number} startTime - Start time in seconds
 * @param {number} endTime - End time in seconds
 * @param {number} maxDuration - Maximum video duration
 * @returns {{valid: boolean, error: string|null}}
 */
export const validateTimeRange = (startTime, endTime, maxDuration = null) => {
  if (startTime < 0) {
    return { valid: false, error: 'Start time cannot be negative' };
  }
  
  if (endTime <= startTime) {
    return { valid: false, error: 'End time must be greater than start time' };
  }
  
  if (maxDuration && endTime > maxDuration) {
    return { valid: false, error: 'End time exceeds video duration' };
  }
  
  return { valid: true, error: null };
};

/**
 * Validate distance input.
 * @param {number} distance - Distance in centimeters
 * @returns {{valid: boolean, error: string|null}}
 */
export const validateDistance = (distance) => {
  if (!distance || distance <= 0) {
    return { valid: false, error: 'Distance must be greater than zero' };
  }
  
  if (distance > 10000) {
    return { valid: false, error: 'Distance seems unreasonably large' };
  }
  
  return { valid: true, error: null };
};

/**
 * Validate point coordinates.
 * @param {Object} point - Point with x and y
 * @param {number} maxWidth - Maximum width
 * @param {number} maxHeight - Maximum height
 * @returns {{valid: boolean, error: string|null}}
 */
export const validatePoint = (point, maxWidth = null, maxHeight = null) => {
  if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
    return { valid: false, error: 'Point must have numeric x and y coordinates' };
  }
  
  if (point.x < 0 || point.y < 0) {
    return { valid: false, error: 'Coordinates cannot be negative' };
  }
  
  if (maxWidth && point.x > maxWidth) {
    return { valid: false, error: 'X coordinate exceeds image width' };
  }
  
  if (maxHeight && point.y > maxHeight) {
    return { valid: false, error: 'Y coordinate exceeds image height' };
  }
  
  return { valid: true, error: null };
};







