/**
 * Video trim screen for selecting time range with true scrubbing behavior.
 *
 * IMPORTANT:
 * - Uses the `Video` component from `expo-av` for real video playback.
 * - Uses slider-driven seeking so the displayed frame updates as the user scrubs.
 * - Backend is only given timestamps; it does NOT handle preview or trimming.
 */
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Video } from 'expo-av';
import Slider from '@react-native-community/slider';
import useAnalysisStore from '../store/analysisStore';
import { selectTimeRange } from '../services/api';

const VideoTrimScreen = () => {
  const navigation = useNavigation();
  const { videoId, videoUri, setTimeRange } = useAnalysisStore();

  const videoRef = useRef(null);

  // Current playback time of the video (in seconds)
  const [currentTime, setCurrentTime] = useState(0);
  // Full duration of the video (in seconds)
  const [duration, setDuration] = useState(0);
  // Selected analysis window
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  // True while the user is actively scrubbing with the slider
  const [isSeeking, setIsSeeking] = useState(false);
  const seekTimeout = useRef(null);

  const formatTime = (seconds) => {
    // Display with 2 decimal places for research-grade precision (no rounding of internal values)
    if (!Number.isFinite(seconds)) return '0.00 s';
    const clamped = Math.max(0, seconds);
    return `${clamped.toFixed(2)} s`;
  };

  const handlePlaybackStatusUpdate = (status) => {
    if (!status.isLoaded) return;

    // Update duration when it becomes available
    if (status.durationMillis && duration === 0) {
      const durSeconds = status.durationMillis / 1000;
      setDuration(durSeconds);
      // Initialize endTime to full duration on first load
      setEndTime(durSeconds);
    }

    // While not manually seeking, keep slider in sync with playback
    if (!isSeeking && status.positionMillis != null) {
      setCurrentTime(status.positionMillis / 1000);
    }
  };

  const pauseVideoIfPossible = async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.pauseAsync();
      } catch (e) {
        // Ignore pause errors on some platforms
      }
    }
  };

  const seekTo = async (timeSeconds) => {
    // In expo-av, `setPositionAsync` is the way to SEEK the video
    // to an exact timestamp (in milliseconds). This fulfills the same
    // role as `videoRef.current.seek(time)` in react-native-video.
    if (videoRef.current) {
      try {
        await videoRef.current.setPositionAsync(timeSeconds * 1000);
      } catch (e) {
        console.warn('Seek failed', e);
      }
    }
  };

  const handleSlidingStart = () => {
    setIsSeeking(true);
    // Pause playback while scrubbing so the frame reflects the slider position
    pauseVideoIfPossible();
  };

  const handleSliderValueChange = (value) => {
    setCurrentTime(value);
    if (seekTimeout.current) clearTimeout(seekTimeout.current);
    seekTimeout.current = setTimeout(() => {
        seekTo(value);
    }, 50); 
    };

  const handleSlidingComplete = (value) => {
    // Finalize seek position
    setCurrentTime(value);
    seekTo(value);
    // Keep video paused after seek for precise frame inspection
    setIsSeeking(false);
  };

  const adjustCurrentTime = (delta) => {
    if (duration <= 0) return;
    const target = Math.min(Math.max(currentTime + delta, 0), duration);
    setCurrentTime(target);
    seekTo(target);
  };

  const handleMarkStart = () => {
    const t = Math.min(Math.max(currentTime, 0), duration);
    setStartTime(t);
    if (endTime < t) setEndTime(t);
  };


  const handleMarkEnd = () => {
    const t = Math.min(Math.max(currentTime, 0), duration);
    setEndTime(t);
    if (startTime > t) setStartTime(t);
  };


  const handleConfirmRange = async () => {
    if (!videoId || !videoUri) {
        Alert.alert('Error', 'Video data is missing. Please upload again.');
        return;
    }

    const cleanStart = Number(startTime.toFixed(3));
    const cleanEnd = Number(endTime.toFixed(3));

    if (cleanStart >= cleanEnd) {
        Alert.alert('Invalid Range', 'Start time must be less than end time.');
        return;
    }

    try {
        await selectTimeRange(videoId, cleanStart, cleanEnd);
        setTimeRange(cleanStart, cleanEnd);
        navigation.navigate('CalibrationChoice');
    } catch (error) {
        console.error('Error selecting time range:', error);
        Alert.alert('Error', 'Failed to save time range. Please try again.');
        }
    };


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Time Range</Text>
        <Text style={styles.subtitle}>
          Scrub through the video and mark the analysis interval
        </Text>
      </View>

      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={{ uri: videoUri }}
          style={styles.video}
          resizeMode="contain"
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        />
        <View style={styles.timestampOverlay}>
          <Text style={styles.timestampText}>{formatTime(currentTime)}</Text>
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>Current: {formatTime(currentTime)}</Text>
          <Text style={styles.timeLabel}>Duration: {formatTime(duration)}</Text>
        </View>

        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration || 0}
          value={currentTime}
          // Explicit small step for sub-second precision (≈ 1 frame at 30 fps)
          // 0.033 s ≈ 33 ms, which is adequate for research scrubbing without overloading seeks
          step={0.033}
          minimumTrackTintColor="#3498db"
          maximumTrackTintColor="#e0e0e0"
          thumbTintColor="#3498db"
          onSlidingStart={handleSlidingStart}
          onValueChange={handleSliderValueChange}
          onSlidingComplete={handleSlidingComplete}
        />

        <View style={styles.fineAdjustRow}>
          <TouchableOpacity
            style={styles.fineAdjustButton}
            onPress={() => adjustCurrentTime(-0.1)}
          >
            <Text style={styles.fineAdjustText}>-0.10 s</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fineAdjustButton}
            onPress={() => adjustCurrentTime(0.1)}
          >
            <Text style={styles.fineAdjustText}>+0.10 s</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.rangeRow}>
          <View style={styles.rangeColumn}>
            <Text style={styles.rangeLabel}>Start</Text>
            <Text style={styles.rangeValue}>{formatTime(startTime)}</Text>
            <TouchableOpacity
              style={styles.rangeButton}
              onPress={handleMarkStart}
            >
              <Text style={styles.rangeButtonText}>Set Start</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rangeColumn}>
            <Text style={styles.rangeLabel}>End</Text>
            <Text style={styles.rangeValue}>{formatTime(endTime)}</Text>
            <TouchableOpacity
              style={styles.rangeButton}
              onPress={handleMarkEnd}
            >
              <Text style={styles.rangeButtonText}>Set End</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.confirmButton,
            (startTime >= endTime || duration === 0) && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirmRange}
          disabled={startTime >= endTime || duration === 0}
        >
          <Text style={styles.confirmButtonText}>Confirm Time Range</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  timestampOverlay: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  timestampText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  controlsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 16,
  },
  fineAdjustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  fineAdjustButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#ecf0f1',
    alignItems: 'center',
  },
  fineAdjustText: {
    fontSize: 12,
    color: '#2c3e50',
    fontWeight: '500',
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  rangeColumn: {
    flex: 1,
    alignItems: 'center',
  },
  rangeLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  rangeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  rangeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#ecf0f1',
  },
  rangeButtonText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  confirmButton: {
    marginTop: 4,
    backgroundColor: '#27ae60',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VideoTrimScreen;