import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useAnalysisStore from '../store/analysisStore';
import { getVideoFrameUrl, setReferenceHeight } from '../services/api';
import PrecisionPointSelector from '../components/PrecisionPointSelector';

const ReferenceSelectionScreen = () => {
  const navigation = useNavigation();
  const { videoId, frameUrl, startTime, endTime, setReference } = useAnalysisStore();

  const [imageUrl, setImageUrl] = useState(null);
  const [referencePoint, setReferencePoint] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!videoId) {
      Alert.alert('Error', 'Video not found. Please upload again.', [
        { text: 'OK', onPress: () => navigation.navigate('Upload') },
      ]);
      return;
    }

    const baseUrl = getVideoFrameUrl(videoId);

    // Prefer a frame slightly after the selected start time (start + 0.10s),
    // but keep it within the selected range if endTime is available.
    if (typeof startTime === 'number') {
      const offset = 0.1;
      let targetTime = startTime + offset;

      if (typeof endTime === 'number' && targetTime > endTime) {
        targetTime = startTime;
      }

      const timedUrl = `${baseUrl}?timestamp=${targetTime.toFixed(3)}`;
      setImageUrl(timedUrl);
      return;
    }

    if (frameUrl && frameUrl.startsWith('http')) {
      setImageUrl(frameUrl);
    } else {
      setImageUrl(baseUrl);
    }
  }, [videoId, frameUrl, startTime, endTime, navigation]);

  const handleReferenceSelected = (point) => {
    setReferencePoint(point || null);
  };

  const handleContinue = async () => {
    if (!referencePoint) {
      Alert.alert('Missing Reference', 'Please set the reference point on the image.');
      return;
    }

    setSaving(true);
    try {
      const result = await setReferenceHeight(videoId, referencePoint.y);
      setReference(result.reference_y);
      navigation.navigate('CalibrationChoice');
    } catch (error) {
      console.error('Reference save error:', error);

      let errorMessage = 'Failed to save reference height. Please try again.';

      if (error.response) {
        if (error.response.data?.detail) {
          errorMessage = String(error.response.data.detail);
        } else if (error.response.data?.message) {
          errorMessage = String(error.response.data.message);
        }
      } else if (error.message) {
        errorMessage = String(error.message);
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (!imageUrl) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading frame...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Reference Height</Text>
        <Text style={styles.subtitle}>
          Position the crosshair on the initial liquid surface to set the reference height.
        </Text>
      </View>

      <View style={styles.content}>
        <PrecisionPointSelector
          imageUri={imageUrl}
          onReferenceSelected={handleReferenceSelected}
          enableSecondPoint={false}
        />
      </View>

      <View style={styles.bottomButton}>
        <TouchableOpacity
          style={[
            styles.button,
            (!referencePoint || saving) && styles.buttonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!referencePoint || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {referencePoint ? 'Save Reference Height' : 'Set Reference to Continue'}
            </Text>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
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
  content: {
    flex: 1,
  },
  bottomButton: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    backgroundColor: '#3498db',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReferenceSelectionScreen;

