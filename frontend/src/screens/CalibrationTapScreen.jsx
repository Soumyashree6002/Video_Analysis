import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useAnalysisStore from '../store/analysisStore';
import { getVideoFrameUrl } from '../services/api';
import PrecisionPointSelector from '../components/PrecisionPointSelector';

const CalibrationTapScreen = () => {
  const navigation = useNavigation();
  const { videoId, frameUrl, setCalibrationPoints } = useAnalysisStore();
  const [point1, setPoint1] = useState(null);
  const [point2, setPoint2] = useState(null);
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
    // Handle null case (Reset All)
    if (selectedPoints === null || selectedPoints === undefined) {
      setPoint1(null);
      setPoint2(null);
      return;
    }

    // Handle array of points [point1, point2]
    // Each can be a coordinate object or null
    if (Array.isArray(selectedPoints)) {
      if (selectedPoints.length >= 1) {
        setPoint1(selectedPoints[0]);
      }
      if (selectedPoints.length >= 2) {
        setPoint2(selectedPoints[1]);
      }
    }
  };

  const validatePoints = () => {
    if (!point1 || !point2) {
      Alert.alert('Error', 'Please select both calibration points');
      return false;
    }

    // Check if points are the same
    if (point1.x === point2.x && point1.y === point2.y) {
      Alert.alert(
        'Invalid Points', 
        'Point 1 and Point 2 cannot be at the same location. Please select two different points on the image.'
      );
      return false;
    }

    // Check if points are too close (optional - helps avoid precision issues)
    const distanceBetweenPoints = Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
    );
    
    if (distanceBetweenPoints < 10) {
      Alert.alert(
        'Points Too Close', 
        'The selected points are too close together. Please select points that are at least 10 pixels apart for accurate calibration.'
      );
      return false;
    }

    return true;
  };

  const handleContinue = () => {
    // Validate points first
    if (!validatePoints()) {
      return;
    }

    // Save points to store and navigate to distance input screen
    setCalibrationPoints(point1, point2);
    navigation.navigate('CalibrationDistance');
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
        <Text style={styles.title}>Select Calibration Points</Text>
        <Text style={styles.subtitle}>
          Pan and zoom to position crosshair precisely on two reference points
        </Text>
      </View>
      
      {/* PrecisionPointSelector fills all available space */}
      <View style={styles.content}>
        <PrecisionPointSelector
          imageUri={imageUrl}
          onPointsSelected={handlePointsSelected}
        />
      </View>

      {/* Fixed bottom button - always visible */}
      <View style={styles.bottomButton}>
        <TouchableOpacity
          style={[styles.button, (!point1 || !point2) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!point1 || !point2}
        >
          <Text style={styles.buttonText}>
            {point1 && point2 ? 'Continue to Distance Input' : 'Select Both Points to Continue'}
          </Text>
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

export default CalibrationTapScreen;