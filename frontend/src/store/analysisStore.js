/**
 * Zustand store for managing analysis state.
 */
import { create } from 'zustand';

const useAnalysisStore = create((set) => ({
  // Video data
  videoId: null,
  frameUrl: null,
  videoUri: null,
  
  // Time range
  startTime: null,
  endTime: null,
  
  // Calibration
  calibrationType: null, // 'manual' or 'tap'
  calibrationData: null,
  
  // Analysis results
  analysisResults: null,
  graphUrl: null,
  
  // Actions
  setVideoData: (videoId, frameUrl, videoUri) => set({
    videoId,
    frameUrl,
    videoUri,
  }),
  
  setTimeRange: (startTime, endTime) => set({
    startTime,
    endTime,
  }),
  
  setCalibration: (type, data) => set({
    calibrationType: type,
    calibrationData: data,
  }),
  
  setAnalysisResults: (results) => set({
    analysisResults: results,
    graphUrl: results?.graph_url || null,
  }),
  
  reset: () => set({
    videoId: null,
    frameUrl: null,
    videoUri: null,
    startTime: null,
    endTime: null,
    calibrationType: null,
    calibrationData: null,
    analysisResults: null,
    graphUrl: null,
  }),
}));

export default useAnalysisStore;




