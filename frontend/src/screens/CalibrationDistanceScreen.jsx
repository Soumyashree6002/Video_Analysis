import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useAnalysisStore from '../store/analysisStore';
import { calibrateTap, getVideoFrameUrl } from '../services/api';
import { validateDistance } from '../utils/validators';
import Svg, { Circle, Line } from 'react-native-svg';

const CalibrationDistanceScreen = () => {
  const navigation = useNavigation();
  const { videoId, frameUrl, calibrationPoints, setCalibration } = useAnalysisStore();
  const [distance, setDistance] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Image dimensions
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });
  const [previewLayout, setPreviewLayout] = useState({ width: 0, height: 0 });

  const { point1, point2 } = calibrationPoints || {};

  // Calculate pixel distance for reference (vertical distance only, matching backend)
  const calculatePixelDistance = () => {
    if (!point1 || !point2) return null;
    return Math.abs(point2.y - point1.y);
  };

  const pixelDistance = calculatePixelDistance();

  // Calculate scale factors based on actual dimensions
  const getScaleFactors = () => {
    if (imageNaturalSize.width === 0 || imageNaturalSize.height === 0 || 
        previewLayout.width === 0 || previewLayout.height === 0) {
      return { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 };
    }

    // Calculate displayed image dimensions considering aspect ratio (contain mode)
    const imageAspect = imageNaturalSize.width / imageNaturalSize.height;
    const containerAspect = previewLayout.width / previewLayout.height;

    let displayedWidth, displayedHeight, offsetX, offsetY;

    if (imageAspect > containerAspect) {
      // Image is wider - fit to width
      displayedWidth = previewLayout.width;
      displayedHeight = previewLayout.width / imageAspect;
      offsetX = 0;
      offsetY = (previewLayout.height - displayedHeight) / 2;
    } else {
      // Image is taller - fit to height
      displayedWidth = previewLayout.height * imageAspect;
      displayedHeight = previewLayout.height;
      offsetX = (previewLayout.width - displayedWidth) / 2;
      offsetY = 0;
    }

    return {
      scaleX: displayedWidth / imageNaturalSize.width,
      scaleY: displayedHeight / imageNaturalSize.height,
      offsetX,
      offsetY,
    };
  };

  // Convert image coordinates to screen coordinates for preview
  const imageToPreviewCoords = (imageX, imageY) => {
    const { scaleX, scaleY, offsetX, offsetY } = getScaleFactors();
    return {
      x: imageX * scaleX + offsetX,
      y: imageY * scaleY + offsetY,
    };
  };

  const handleCalibrate = async () => {
    // Validate distance
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
      
      let errorMessage = 'Failed to perform calibration. Please try again.';
      
      if (error.response) {
        if (error.response.status === 500) {
          errorMessage = 'Server error occurred. Please ensure your points are valid and try again.';
        } else if (error.response.data?.message) {
          errorMessage = String(error.response.data.message);
        } else if (error.response.data?.error) {
          errorMessage = String(error.response.data.error);
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = String(error.message);
      }
      
      Alert.alert('Calibration Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleImageLoad = (event) => {
    const { width, height } = event.nativeEvent.source;
    setImageNaturalSize({ width, height });
  };

  const handlePreviewLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    setPreviewLayout({ width, height });
  };

  // If no points are set, redirect back
  // Add this useEffect at the top of the component (after all useState/hooks)
    useEffect(() => {
        if (!point1 || !point2) {
        Alert.alert(
            'Error',
            'Calibration points not found. Please select points first.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        }
    }, [point1, point2, navigation]);
  
  // Then in the render, just do early return without side effects
  if (!point1 || !point2) {
    return null;
  }

  const imageUrl = frameUrl?.startsWith('http') ? frameUrl : getVideoFrameUrl(videoId);

  // Get scaled coordinates for rendering
  const point1Screen = imageToPreviewCoords(point1.x, point1.y);
  const point2Screen = imageToPreviewCoords(point2.x, point2.y);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Measure Distance</Text>
        <Text style={styles.subtitle}>
          Enter the real-world distance between your selected points
        </Text>
      </View>

      <View style={styles.content}>
        {/* Preview of selected points */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Selected Points Preview</Text>
          <View 
            style={styles.previewContainer}
            onLayout={handlePreviewLayout}
          >
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.previewImage}
              resizeMode="contain"
              onLoad={handleImageLoad}
            />
            {imageNaturalSize.width > 0 && previewLayout.width > 0 && (
              <Svg 
                width={previewLayout.width}
                height={previewLayout.height}
                style={StyleSheet.absoluteFill} 
                pointerEvents="none"
              >
                <Line
                  x1={point1Screen.x}
                  y1={point1Screen.y}
                  x2={point2Screen.x}
                  y2={point2Screen.y}
                  stroke="#27ae60"
                  strokeWidth={2}
                  strokeDasharray="5,5"
                />
                <Circle
                  cx={point1Screen.x}
                  cy={point1Screen.y}
                  r={8}
                  fill="#3498db"
                  stroke="#fff"
                  strokeWidth={2}
                />
                <Circle
                  cx={point2Screen.x}
                  cy={point2Screen.y}
                  r={8}
                  fill="#e74c3c"
                  stroke="#fff"
                  strokeWidth={2}
                />
              </Svg>
            )}
          </View>
        </View>

        {/* Point coordinates info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Point Coordinates</Text>
          <Text style={styles.infoText}>
            Point 1: ({point1.x.toFixed(1)}, {point1.y.toFixed(1)}) px
          </Text>
          <Text style={styles.infoText}>
            Point 2: ({point2.x.toFixed(1)}, {point2.y.toFixed(1)}) px
          </Text>
          {pixelDistance && (
            <Text style={[styles.infoText, styles.infoHighlight]}>
              Pixel Distance: {pixelDistance.toFixed(2)} px
            </Text>
          )}
        </View>

        {/* Distance input */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>
            What is the real distance between these points?
          </Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={distance}
              onChangeText={setDistance}
              placeholder="Enter distance"
              keyboardType="decimal-pad"
              autoFocus
            />
            <Text style={styles.unit}>cm</Text>
          </View>
          <Text style={styles.hint}>
            Measure the actual distance between Point 1 and Point 2 in your video
          </Text>
        </View>

        {/* Example/Help text */}
        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>💡 Tip</Text>
          <Text style={styles.helpText}>
            For best accuracy, use a known distance like the width of a door frame (typically 90 cm) 
            or the height of a standard table (typically 75 cm).
          </Text>
        </View>
      </View>

      {/* Bottom buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          disabled={loading}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.continueButton, (!distance || loading) && styles.buttonDisabled]}
          onPress={handleCalibrate}
          disabled={!distance || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.continueButtonText}>Complete Calibration</Text>
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
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
    padding: 20,
  },
  previewSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  previewContainer: {
    height: 200,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  infoCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#7f8c8d',
    fontFamily: 'monospace',
    marginVertical: 2,
  },
  infoHighlight: {
    color: '#27ae60',
    fontWeight: '600',
    marginTop: 4,
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#3498db',
    borderRadius: 8,
    padding: 16,
    fontSize: 24,
    fontWeight: '600',
    backgroundColor: '#fff',
  },
  unit: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 12,
  },
  hint: {
    fontSize: 12,
    color: '#95a5a6',
    fontStyle: 'italic',
  },
  helpCard: {
    backgroundColor: '#fff9e6',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f39c12',
    marginBottom: 6,
  },
  helpText: {
    fontSize: 13,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  bottomButtons: {
    flexDirection: 'row',
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
  backButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#ecf0f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  backButtonText: {
    color: '#2c3e50',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    flex: 2,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#27ae60',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CalibrationDistanceScreen;