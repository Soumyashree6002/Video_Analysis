/**
 * API service for communicating with the backend.
 */
import axios from 'axios';
import * as FileSystem from 'expo-file-system/legacy';

// Base API URL - update this to match your backend server
// For Android emulator, use 10.0.2.2 instead of localhost
// For iOS simulator, use localhost
// For physical device, use your computer's IP address
const getBaseUrl = () => {
  if (__DEV__) {
    // Change this to your computer's IP address when testing on physical device
    return 'http://10.25.178.160:8000/api/v1';
  }
  return 'https://your-production-api.com/api/v1';
};

const API_BASE_URL = getBaseUrl();
const BASE_URL_WITHOUT_API = API_BASE_URL.replace('/api/v1', '');

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes for large video uploads
});

/**
 * Upload video file (supports chunked upload for large files).
 * @param {string} videoUri - Local file URI
 * @param {Function} onProgress - Progress callback (progress: number) => void
 * @returns {Promise<{video_id: string, frame_url: string}>}
 */

export const uploadVideo = async (videoUri, onProgress = null) => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(videoUri);

    if (!fileInfo.exists) {
      throw new Error('Video file not found');
    }

    const formData = new FormData();
    const filename = videoUri.split('/').pop() || 'video.mp4';

    formData.append('chunk', {
      uri: videoUri,
      type: 'video/mp4',
      name: filename,
    });
    formData.append('chunk_index', '0');
    formData.append('is_last', 'true');

    const response = await api.post('/upload-video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return;

        // 🔒 Network progress ONLY (cap at 99%)
        const rawPercent = (event.loaded / event.total) * 100;

        const safePercent = Math.min(
          99,
          Math.max(0, Math.round(rawPercent))
        );

        onProgress(safePercent);
      },
    });

    // ✅ Upload + server processing DONE
    if (onProgress) {
      onProgress(100);
    }

    return {
      video_id: response.data.video_id,
      frame_url: response.data.frame_url,
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

/**
 * Get video frame image URL.
 * @param {string} videoId - Video identifier
 * @returns {string} Frame image URL
 */
export const getVideoFrameUrl = (videoId) => {
  return `${BASE_URL_WITHOUT_API}/api/v1/video-frame/${videoId}`;
};

/**
 * Get full URL for a static resource (graph, etc.)
 * @param {string} relativePath - Relative path like "/static/graphs/xxx.png"
 * @returns {string} Full URL
 */
export const getStaticUrl = (relativePath) => {
  return `${BASE_URL_WITHOUT_API}${relativePath}`;
};

/**
 * Select time range for analysis.
 * @param {string} videoId - Video identifier
 * @param {number} startTime - Start time in seconds
 * @param {number} endTime - End time in seconds
 * @returns {Promise<Object>}
 */
export const selectTimeRange = async (videoId, startTime, endTime) => {
  const response = await api.post('/analyze/select-time-range', {
    video_id: videoId,
    start_time: startTime,
    end_time: endTime,
  });
  return response.data;
};

/**
 * Perform manual calibration.
 * @param {string} videoId - Video identifier
 * @param {number} distanceCm - Real-world distance in centimeters
 * @returns {Promise<Object>}
 */
export const calibrateManual = async (videoId, distanceCm) => {
  const response = await api.post('/calibration/manual', {
    video_id: videoId,
    distance_cm: distanceCm,
  });
  return response.data;
};

/**
 * Perform tap-based calibration.
 * @param {string} videoId - Video identifier
 * @param {Object} point1 - First point {x, y}
 * @param {Object} point2 - Second point {x, y}
 * @param {number} realDistanceCm - Real-world distance in centimeters
 * @returns {Promise<Object>}
 */
export const calibrateTap = async (videoId, point1, point2, realDistanceCm) => {
  const response = await api.post('/calibration/tap', {
    video_id: videoId,
    point1: point1,
    point2: point2,
    real_distance_cm: realDistanceCm,
  });
  return response.data;
};

/**
 * Perform viscosity analysis.
 * @param {string} videoId - Video identifier
 * @returns {Promise<Object>}
 */
export const analyzeViscosity = async (videoId) => {
  const response = await api.post('/analyze', {
    video_id: videoId,
  });
  return response.data;
};

/**
 * Get report PDF URL.
 * @param {string} videoId - Video identifier
 * @returns {string} Report PDF URL
 */
export const getReportUrl = (videoId) => {
  return `${API_BASE_URL}/report/${videoId}`;
};

export default api;

