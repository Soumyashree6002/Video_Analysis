/**
 * Tap-based calibration screen.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useAnalysisStore from '../store/analysisStore';
import { calibrateTap, getVideoFrameUrl } from '../services/api';
import { validateDistance } from '../utils/validators';
import PrecisionPointSelector from '../components/PrecisionPointSelector';

const CalibrationTapScreen = () => {
  const navigation = useNavigation();
  const { videoId, frameUrl, setCalibration } = useAnalysisStore();
  const [point1, setPoint1] = useState(null);
  const [point2, setPoint2] = useState(null);
  const [distance, setDistance] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    // Get frame URL
    if (frameUrl) {
      // If frameUrl is relative, construct full URL
      const fullUrl = frameUrl.startsWith('http') 
        ? frameUrl 
        : getVideoFrameUrl(videoId);
      setImageUrl(fullUrl);
    } else {
      // Fetch frame if not available
      setImageUrl(getVideoFrameUrl(videoId));
    }
  }, [videoId, frameUrl]);

  const handlePointsSelected = (selectedPoints) => {
    // selectedPoints is [point1, point2] or [null, point2] or [point1, null]
    if (selectedPoints[0] !== undefined) setPoint1(selectedPoints[0]);
    if (selectedPoints[1] !== undefined) setPoint2(selectedPoints[1]);
  };

  const handleCalibrate = async () => {
    if (!point1 || !point2) {
      Alert.alert('Error', 'Please select both calibration points');
      return;
    }

    const distanceValue = parseFloat(distance);
    const validation = validateDistance(distanceValue);
    if (!validation.valid) {
      Alert.alert('Invalid Input', validation.error);
      return;
    }

    setLoading(true);
    try {
      const result = await calibrateTap(
        videoId,
        point1,
        point2,
        distanceValue
      );
      setCalibration('tap', result);
      navigation.navigate('Results');
    } catch (error) {
      console.error('Calibration error:', error);
      Alert.alert('Error', 'Failed to perform calibration. Please try again.');
    } finally {
      setLoading(false);
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
        <Text style={styles.title}>Precision Calibration</Text>
        <Text style={styles.subtitle}>
          Pan and zoom to position crosshair, then set two points
        </Text>
      </View>
      
      <View style={styles.content}>
        <PrecisionPointSelector
          imageUri={imageUrl}
          onPointsSelected={handlePointsSelected}
        />
        
        {point1 && point2 && (
          <View style={styles.inputSection}>
            <Text style={styles.label}>Distance between points (cm)</Text>
            <TextInput
              style={styles.input}
              value={distance}
              onChangeText={setDistance}
              placeholder="Enter distance"
              keyboardType="decimal-pad"
            />
            
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleCalibrate}
              disabled={loading || !point1 || !point2}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Calibrating...' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
  inputSection: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#3498db',
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
});

export default CalibrationTapScreen;




