/**
 * SVG-based point selector for precise calibration point selection.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, TouchableWithoutFeedback } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SvgPointSelector = ({ imageUri, onPointsSelected }) => {
  const [points, setPoints] = useState([]);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const handleImageLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    setImageSize({ width, height });
  };

  const handlePress = (event) => {
    if (points.length >= 2) {
      // Reset if already have 2 points
      setPoints([]);
      return;
    }

    const { locationX, locationY } = event.nativeEvent;
    const newPoint = { x: locationX, y: locationY };
    const updatedPoints = [...points, newPoint];
    setPoints(updatedPoints);

    if (updatedPoints.length === 2) {
      // Second point selected
      onPointsSelected(updatedPoints);
    }
  };

  const resetPoints = () => {
    setPoints([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>
        {points.length === 0
          ? 'Tap two points on the image to mark a known distance'
          : points.length === 1
          ? 'Tap the second point'
          : 'Tap again to reset'}
      </Text>
      
      <TouchableWithoutFeedback onPress={handlePress}>
        <View style={styles.imageContainer} onLayout={handleImageLayout}>
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="contain"
          />
          
          <Svg
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          >
          {points.length > 0 && (
            <Circle
              cx={points[0].x}
              cy={points[0].y}
              r={8}
              fill="#3498db"
              stroke="#fff"
              strokeWidth={2}
            />
          )}
          
          {points.length > 1 && (
            <>
              <Circle
                cx={points[1].x}
                cy={points[1].y}
                r={8}
                fill="#e74c3c"
                stroke="#fff"
                strokeWidth={2}
              />
              <Line
                x1={points[0].x}
                y1={points[0].y}
                x2={points[1].x}
                y2={points[1].y}
                stroke="#27ae60"
                strokeWidth={2}
                strokeDasharray="5,5"
              />
            </>
          )}
        </Svg>
        </View>
      </TouchableWithoutFeedback>
      
      {points.length === 2 && (
        <TouchableOpacity style={styles.resetButton} onPress={resetPoints}>
          <Text style={styles.resetButtonText}>Reset Points</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  instruction: {
    fontSize: 16,
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  resetButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#95a5a6',
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SvgPointSelector;

