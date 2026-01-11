import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { uploadVideo } from '../services/api';

const VideoUploader = ({ onUploadComplete, onError }) => {
  const [uploading, setUploading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [progress, setProgress] = useState(0);

  const abortControllerRef = useRef(null);
  const uploadingRef = useRef(false);

  // keep ref in sync for cancel-safe UI updates
  useEffect(() => {
    uploadingRef.current = uploading;
  }, [uploading]);

  const pickVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const videoUri = result.assets[0].uri;

      // setup upload state
      setUploading(true);
      setFinalizing(false);
      setProgress(0);
      abortControllerRef.current = new AbortController();

      const response = await uploadVideo(
        videoUri,
        (p) => {
          if (!uploadingRef.current) return; // prevent late updates

          const safe = Math.min(99, Math.max(0, p));
          setProgress(safe);
          if (safe === 99) {
            setFinalizing(true);
          }
        },
        abortControllerRef.current.signal
      );

      // success
      setProgress(100);
      setFinalizing(false);
      setUploading(false);

      onUploadComplete?.(response, videoUri);
    } catch (error) {
      if (error.name === 'AbortError') {
        onCancel && onCancel();
      } else {
        console.error('Upload error:', error);
        onError?.(error.message || 'Failed to upload video');
      }
    } finally {
      // always cleanup controller
      abortControllerRef.current = null;
    }
  };

  const cancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setUploading(false);
    setFinalizing(false);
    setProgress(0);
  };

  return (
    <View style={styles.container}>
      {!uploading ? (
        <TouchableOpacity style={styles.button} onPress={pickVideo}>
          <Text style={styles.buttonText}>Select Video</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.uploadContainer}>
          <View style={styles.uploadStatusRow}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.buttonText}>
              {finalizing ? 'Finalizing upload…' : `Uploading… ${progress}%`}
            </Text>
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={cancelUpload}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {uploading && (
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
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
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadContainer: {
    backgroundColor: '#2c3e50',
    padding: 16,
    borderRadius: 8,
  },
  uploadStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cancelButton: {
    marginTop: 10,
    alignSelf: 'flex-end',
  },
  cancelText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: '500',
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
