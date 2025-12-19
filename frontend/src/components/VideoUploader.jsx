/**
 * Video uploader component with correct progress UX.
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { uploadVideo } from '../services/api';

const VideoUploader = ({ onUploadComplete, onError }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [finalizing, setFinalizing] = useState(false);

  const pickVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const videoUri = result.assets[0].uri;

      setUploading(true);
      setFinalizing(false);
      setProgress(0);

      const response = await uploadVideo(videoUri, (progressValue) => {
        const safe = Math.min(99, Math.max(0, progressValue));
        setProgress(safe);

        if (safe === 99) {
          setFinalizing(true);
        }
      });

      // Backend has confirmed upload
      setFinalizing(true);
      setProgress(100);

      setUploading(false);
      onUploadComplete(response, videoUri);
    } catch (error) {
      console.error('Upload error:', error);
      setUploading(false);
      setFinalizing(false);
      onError(error.message || 'Failed to upload video');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, uploading && styles.buttonDisabled]}
        onPress={pickVideo}
        disabled={uploading}
      >
        {uploading ? (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.buttonText}>
              {finalizing
                ? 'Finalizing upload…'
                : `Uploading… ${progress}%`}
            </Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>Select Video</Text>
        )}
      </TouchableOpacity>

      {uploading && (
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${progress}%` },
            ]}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 20,
  },
  button: {
    backgroundColor: '#2c3e50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBarContainer: {
    marginTop: 10,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3498db',
  },
});

export default VideoUploader;
