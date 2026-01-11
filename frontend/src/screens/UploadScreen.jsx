/**
 * Upload screen for selecting and uploading video files.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import VideoUploader from '../components/VideoUploader';
import useAnalysisStore from '../store/analysisStore';

const UploadScreen = () => {
  const navigation = useNavigation();
  const { setVideoData } = useAnalysisStore();
  const [error, setError] = useState(null);

  const handleUploadComplete = (response, videoUri) => {
    const { video_id, frame_url } = response;
    setVideoData(video_id, frame_url, videoUri);
    navigation.navigate('VideoTrim');
  };

  const handleError = (errorMessage) => {
  if (!errorMessage) {
    setError(null);
    return;
  }

  setError(errorMessage);
  Alert.alert('Upload Error', errorMessage, [{ text: 'OK' }]);
};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Video Viscosity Analysis</Text>
        <Text style={styles.subtitle}>Upload a video to begin analysis</Text>
      </View>
      
      <View style={styles.content}>
        <VideoUploader
          onUploadComplete={handleUploadComplete}
          onError={handleError}
        />
        
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            • Supported formats: MP4, MOV, AVI, MKV
          </Text>
          <Text style={styles.infoText}>
            • Large files (&gt;200MB) are supported
          </Text>
        </View>
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
    padding: 30,
    paddingTop: 60,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  infoContainer: {
    marginTop: 40,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 8,
  },
});

export default UploadScreen;




