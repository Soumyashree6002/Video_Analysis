/**
 * Video trim screen for selecting time range.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import VideoPlayerTrim from '../components/VideoPlayerTrim';
import useAnalysisStore from '../store/analysisStore';
import { selectTimeRange } from '../services/api';

const VideoTrimScreen = () => {
  const navigation = useNavigation();
  const { videoId, videoUri, setTimeRange } = useAnalysisStore();

  const handleTimeRangeSelected = async (startTime, endTime) => {
    try {
      await selectTimeRange(videoId, startTime, endTime);
      setTimeRange(startTime, endTime);
      navigation.navigate('CalibrationChoice');
    } catch (error) {
      console.error('Error selecting time range:', error);
      alert('Failed to save time range. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Time Range</Text>
        <Text style={styles.subtitle}>
          Use the sliders to select the analysis time range
        </Text>
      </View>
      
      <VideoPlayerTrim
        videoUri={videoUri}
        onTimeRangeSelected={handleTimeRangeSelected}
      />
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
});

export default VideoTrimScreen;




