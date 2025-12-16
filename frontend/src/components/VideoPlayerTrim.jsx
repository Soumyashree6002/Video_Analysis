/**
 * Video player component with time range selection.
 */
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Video } from 'expo-av';
import Slider from '@react-native-community/slider';

const VideoPlayerTrim = ({ videoUri, onTimeRangeSelected, maxDuration }) => {
  const videoRef = useRef(null);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(maxDuration || 10);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(maxDuration || 10);

  useEffect(() => {
    if (maxDuration) {
      setEndTime(maxDuration);
      setDuration(maxDuration);
    }
  }, [maxDuration]);

  const handlePlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setCurrentTime(status.positionMillis / 1000);
      if (status.durationMillis) {
        setDuration(status.durationMillis / 1000);
        if (!maxDuration) {
          setEndTime(status.durationMillis / 1000);
        }
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleConfirm = () => {
    if (startTime < endTime) {
      onTimeRangeSelected(startTime, endTime);
    }
  };

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={{ uri: videoUri }}
        style={styles.video}
        useNativeControls
        resizeMode="contain"
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
      />
      
      <View style={styles.controlsContainer}>
        <View style={styles.timeDisplay}>
          <Text style={styles.timeLabel}>Start: {formatTime(startTime)}</Text>
          <Text style={styles.timeLabel}>End: {formatTime(endTime)}</Text>
        </View>
        
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>Start Time</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration}
            value={startTime}
            onValueChange={setStartTime}
            minimumTrackTintColor="#3498db"
            maximumTrackTintColor="#e0e0e0"
          />
        </View>
        
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>End Time</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration}
            value={endTime}
            onValueChange={setEndTime}
            minimumTrackTintColor="#e74c3c"
            maximumTrackTintColor="#e0e0e0"
          />
        </View>
        
        <TouchableOpacity
          style={[styles.confirmButton, startTime >= endTime && styles.buttonDisabled]}
          onPress={handleConfirm}
          disabled={startTime >= endTime}
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
  video: {
    width: '100%',
    height: 300,
    backgroundColor: '#000',
  },
  controlsContainer: {
    padding: 20,
  },
  timeDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  confirmButton: {
    backgroundColor: '#27ae60',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VideoPlayerTrim;







