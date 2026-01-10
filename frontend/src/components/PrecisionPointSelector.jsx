import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Circle, Line } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CROSSHAIR_SIZE = 40;
const MIN_ZOOM = 1.0;
const MAX_ZOOM = 5.0;
// Use percentage of screen height instead of fixed height
const IMAGE_HEIGHT = SCREEN_HEIGHT * 0.5; // 50% of screen height

const PrecisionPointSelector = ({ imageUri, onPointsSelected }) => {
  // Image dimensions and layout
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });
  const [imageLayout, setImageLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Zoom and pan state (using Reanimated for smooth animations)
  const scale = useSharedValue(1.0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const savedScale = useSharedValue(1.0);

  // Synced state for coordinate calculations (updated only when gesture ends)
  const [currentScale, setCurrentScale] = useState(1.0);
  const [currentTranslateX, setCurrentTranslateX] = useState(0);
  const [currentTranslateY, setCurrentTranslateY] = useState(0);

  // Selected points in IMAGE coordinate space
  const [point1, setPoint1] = useState(null);
  const [point2, setPoint2] = useState(null);

  // Fine adjustment step size
  const [stepSize, setStepSize] = useState(1); // 1px or 5px

  // Sync transform values to React state (called only when gesture ends)
  const syncTransformToJS = (scaleVal, translateXVal, translateYVal) => {
    setCurrentScale(scaleVal);
    setCurrentTranslateX(translateXVal);
    setCurrentTranslateY(translateYVal);
  };

  /**
   * Calculate displayed image dimensions and offsets (letterboxing)
   */
  const getImageDisplayInfo = () => {
    const containerWidth = imageLayout.width;
    const containerHeight = imageLayout.height;
    
    if (containerWidth === 0 || containerHeight === 0 || imageNaturalSize.width === 0) {
      return null;
    }

    const imageAspect = imageNaturalSize.width / imageNaturalSize.height;
    const containerAspect = containerWidth / containerHeight;

    let displayedWidth, displayedHeight, offsetX, offsetY;

    if (imageAspect > containerAspect) {
      // Image is wider - fit to width
      displayedWidth = containerWidth;
      displayedHeight = containerWidth / imageAspect;
      offsetX = 0;
      offsetY = (containerHeight - displayedHeight) / 2;
    } else {
      // Image is taller - fit to height
      displayedWidth = containerHeight * imageAspect;
      displayedHeight = containerHeight;
      offsetX = (containerWidth - displayedWidth) / 2;
      offsetY = 0;
    }

    return { displayedWidth, displayedHeight, offsetX, offsetY };
  };

  /**
   * Constrain pan to prevent image from going too far off-screen.
   */
  const constrainPan = () => {
    'worklet';
    const maxTranslate = 200 * scale.value;
    
    if (Math.abs(translateX.value) > maxTranslate) {
      translateX.value = withSpring(translateX.value > 0 ? maxTranslate : -maxTranslate);
      savedTranslateX.value = translateX.value;
    }
    if (Math.abs(translateY.value) > maxTranslate) {
      translateY.value = withSpring(translateY.value > 0 ? maxTranslate : -maxTranslate);
      savedTranslateY.value = translateY.value;
    }
  };

  // Gesture handlers
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      const newScale = savedScale.value * e.scale;
      scale.value = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < MIN_ZOOM) {
        scale.value = withSpring(MIN_ZOOM);
        savedScale.value = MIN_ZOOM;
      }
      if (scale.value > MAX_ZOOM) {
        scale.value = withSpring(MAX_ZOOM);
        savedScale.value = MAX_ZOOM;
      }
      
      // Sync to JS thread only when gesture ends
      runOnJS(syncTransformToJS)(scale.value, translateX.value, translateY.value);
    });

  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      constrainPan();
      
      // Sync to JS thread only when gesture ends
      runOnJS(syncTransformToJS)(scale.value, translateX.value, translateY.value);
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  /**
   * Convert screen coordinates (where crosshair is) to image coordinates.
   */
  const getImageCoordinateUnderCrosshair = () => {
    const displayInfo = getImageDisplayInfo();
    if (!displayInfo) return { x: 0, y: 0 };

    const { displayedWidth, displayedHeight, offsetX, offsetY } = displayInfo;
    const containerWidth = imageLayout.width;
    const containerHeight = imageLayout.height;

    const crosshairScreenX = containerWidth / 2;
    const crosshairScreenY = containerHeight / 2;

    const imageCenterScreenX = offsetX + displayedWidth / 2;
    const imageCenterScreenY = offsetY + displayedHeight / 2;

    const relativeX = (crosshairScreenX - imageCenterScreenX - currentTranslateX) / currentScale;
    const relativeY = (crosshairScreenY - imageCenterScreenY - currentTranslateY) / currentScale;

    const displayX = relativeX + displayedWidth / 2;
    const displayY = relativeY + displayedHeight / 2;

    const imageX = (displayX / displayedWidth) * imageNaturalSize.width;
    const imageY = (displayY / displayedHeight) * imageNaturalSize.height;

    return {
      x: Math.max(0, Math.min(imageNaturalSize.width, Math.round(imageX))),
      y: Math.max(0, Math.min(imageNaturalSize.height, Math.round(imageY))),
    };
  };

  const handleSetPoint1 = () => {
    const coord = getImageCoordinateUnderCrosshair();
    setPoint1(coord);
    if (point2) {
      onPointsSelected?.([coord, point2]);
    }
  };

  const handleSetPoint2 = () => {
    const coord = getImageCoordinateUnderCrosshair();
    setPoint2(coord);
    if (point1) {
      onPointsSelected?.([point1, coord]);
    }
  };

  const adjustPoint = (deltaX, deltaY, pointIndex) => {
    const delta = deltaX !== 0 ? { x: deltaX * stepSize, y: 0 } : { x: 0, y: deltaY * stepSize };
    
    if (pointIndex === 1 && point1) {
      const newPoint = {
        x: Math.max(0, Math.min(imageNaturalSize.width, point1.x + delta.x)),
        y: Math.max(0, Math.min(imageNaturalSize.height, point1.y + delta.y)),
      };
      setPoint1(newPoint);
      if (point2) {
        onPointsSelected?.([newPoint, point2]);
      }
    } else if (pointIndex === 2 && point2) {
      const newPoint = {
        x: Math.max(0, Math.min(imageNaturalSize.width, point2.x + delta.x)),
        y: Math.max(0, Math.min(imageNaturalSize.height, point2.y + delta.y)),
      };
      setPoint2(newPoint);
      if (point1) {
        onPointsSelected?.([point1, newPoint]);
      }
    }
  };

  const imageToScreen = (imageX, imageY) => {
    const displayInfo = getImageDisplayInfo();
    if (!displayInfo) return { x: 0, y: 0 };

    const { displayedWidth, displayedHeight, offsetX, offsetY } = displayInfo;

    const displayX = (imageX / imageNaturalSize.width) * displayedWidth;
    const displayY = (imageY / imageNaturalSize.height) * displayedHeight;

    const relativeX = displayX - displayedWidth / 2;
    const relativeY = displayY - displayedHeight / 2;

    const imageCenterScreenX = offsetX + displayedWidth / 2;
    const imageCenterScreenY = offsetY + displayedHeight / 2;

    const screenX = relativeX * currentScale + currentTranslateX + imageCenterScreenX;
    const screenY = relativeY * currentScale + currentTranslateY + imageCenterScreenY;

    return { x: screenX, y: screenY };
  };

  const animatedImageStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  const handleImageLoad = (event) => {
    const { width, height } = event.nativeEvent.source;
    setImageNaturalSize({ width, height });
  };

  const handleImageLayout = (event) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setImageLayout({ x, y, width, height });
  };

  const resetView = () => {
    scale.value = withSpring(1.0);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedScale.value = 1.0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    
    // Sync to JS thread after reset
    syncTransformToJS(1.0, 0, 0);
  };

  const renderCrosshair = () => {
    const containerWidth = imageLayout.width;
    const containerHeight = imageLayout.height;
    
    if (containerWidth === 0 || containerHeight === 0) {
      return null;
    }

    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;
    const halfSize = CROSSHAIR_SIZE / 2;

    return (
      <Svg 
        width={containerWidth} 
        height={containerHeight} 
        style={StyleSheet.absoluteFill} 
        pointerEvents="none"
      >
        <Line
          x1={centerX - halfSize}
          y1={centerY}
          x2={centerX + halfSize}
          y2={centerY}
          stroke="#3498db"
          strokeWidth={2}
        />
        <Line
          x1={centerX}
          y1={centerY - halfSize}
          x2={centerX}
          y2={centerY + halfSize}
          stroke="#3498db"
          strokeWidth={2}
        />
        <Circle
          cx={centerX}
          cy={centerY}
          r={3}
          fill="#3498db"
        />
      </Svg>
    );
  };

  const renderMarkers = () => {
    if (!point1 && !point2) return null;

    const markers = [];
    
    if (point1) {
      const screenPos = imageToScreen(point1.x, point1.y);
      markers.push(
        <Circle
          key="point1"
          cx={screenPos.x}
          cy={screenPos.y}
          r={12}
          fill="#3498db"
          stroke="#fff"
          strokeWidth={3}
        />
      );
    }

    if (point2) {
      const screenPos = imageToScreen(point2.x, point2.y);
      markers.push(
        <Circle
          key="point2"
          cx={screenPos.x}
          cy={screenPos.y}
          r={12}
          fill="#e74c3c"
          stroke="#fff"
          strokeWidth={3}
        />
      );
    }

    if (point1 && point2) {
      const screen1 = imageToScreen(point1.x, point1.y);
      const screen2 = imageToScreen(point2.x, point2.y);
      markers.push(
        <Line
          key="line"
          x1={screen1.x}
          y1={screen1.y}
          x2={screen2.x}
          y2={screen2.y}
          stroke="#27ae60"
          strokeWidth={2}
          strokeDasharray="5,5"
        />
      );
    }

    const containerWidth = imageLayout.width || SCREEN_WIDTH;
    const containerHeight = imageLayout.height || SCREEN_HEIGHT;

    return (
      <Svg 
        width={containerWidth} 
        height={containerHeight} 
        style={StyleSheet.absoluteFill} 
        pointerEvents="none"
      >
        {markers}
      </Svg>
    );
  };

  const calculateDistance = () => {
    if (!point1 || !point2) return null;
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const distance = calculateDistance();

  return (
    <View style={styles.container}>
      {/* Fixed-height image section */}
      <View style={styles.imageSection}>
        <Text style={styles.instruction}>
          Pan and zoom the image, then position the crosshair over your calibration points
        </Text>

        <View style={styles.imageWrapper} onLayout={handleImageLayout}>
          <GestureDetector gesture={composedGesture}>
            <Animated.View style={[styles.imageContainer, animatedImageStyle]}>
              <Image
                source={{ uri: imageUri }}
                style={styles.image}
                resizeMode="contain"
                onLoad={handleImageLoad}
              />
            </Animated.View>
          </GestureDetector>
          {renderCrosshair()}
          {renderMarkers()}
        </View>
      </View>

      {/* Scrollable controls section */}
      <ScrollView 
        style={styles.controlsSection}
        contentContainerStyle={styles.controlsContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Point selection buttons */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.setButton, point1 && styles.setButtonActive]}
            onPress={handleSetPoint1}
          >
            <Text style={[styles.setButtonText, point1 && styles.setButtonTextActive]}>
              Set Point 1
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.setButton, point2 && styles.setButtonActive]}
            onPress={handleSetPoint2}
          >
            <Text style={[styles.setButtonText, point2 && styles.setButtonTextActive]}>
              Set Point 2
            </Text>
          </TouchableOpacity>
        </View>

        {/* Coordinate display */}
        {(point1 || point2) && (
          <View style={styles.coordinateDisplay}>
            {point1 && (
              <Text style={styles.coordinateText}>
                Point 1: ({point1.x.toFixed(1)}, {point1.y.toFixed(1)}) px
              </Text>
            )}
            {point2 && (
              <Text style={styles.coordinateText}>
                Point 2: ({point2.x.toFixed(1)}, {point2.y.toFixed(1)}) px
              </Text>
            )}
            {distance && (
              <Text style={[styles.coordinateText, styles.distanceText]}>
                Distance: {distance.toFixed(2)} px
              </Text>
            )}
          </View>
        )}

        {/* Fine adjustment controls */}
        {(point1 || point2) && (
          <View style={styles.adjustmentSection}>
            <Text style={styles.adjustmentLabel}>
              Fine Adjust (Step: {stepSize}px)
            </Text>
            <TouchableOpacity
              style={styles.stepToggle}
              onPress={() => setStepSize(stepSize === 1 ? 5 : 1)}
            >
              <Text style={styles.stepToggleText}>
                {stepSize === 1 ? 'Switch to 5px' : 'Switch to 1px'}
              </Text>
            </TouchableOpacity>

            {point1 && (
              <View style={styles.adjustmentGroup}>
                <Text style={styles.adjustmentGroupLabel}>Point 1:</Text>
                <View style={styles.arrowGrid}>
                  <View style={styles.arrowRow}>
                    <TouchableOpacity
                      style={styles.arrowButton}
                      onPress={() => adjustPoint(0, -1, 1)}
                    >
                      <Text style={styles.arrowText}>↑</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.arrowRow}>
                    <TouchableOpacity
                      style={styles.arrowButton}
                      onPress={() => adjustPoint(-1, 0, 1)}
                    >
                      <Text style={styles.arrowText}>←</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.arrowButton}
                      onPress={() => adjustPoint(1, 0, 1)}
                    >
                      <Text style={styles.arrowText}>→</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.arrowRow}>
                    <TouchableOpacity
                      style={styles.arrowButton}
                      onPress={() => adjustPoint(0, 1, 1)}
                    >
                      <Text style={styles.arrowText}>↓</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {point2 && (
              <View style={styles.adjustmentGroup}>
                <Text style={styles.adjustmentGroupLabel}>Point 2:</Text>
                <View style={styles.arrowGrid}>
                  <View style={styles.arrowRow}>
                    <TouchableOpacity
                      style={styles.arrowButton}
                      onPress={() => adjustPoint(0, -1, 2)}
                    >
                      <Text style={styles.arrowText}>↑</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.arrowRow}>
                    <TouchableOpacity
                      style={styles.arrowButton}
                      onPress={() => adjustPoint(-1, 0, 2)}
                    >
                      <Text style={styles.arrowText}>←</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.arrowButton}
                      onPress={() => adjustPoint(1, 0, 2)}
                    >
                      <Text style={styles.arrowText}>→</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.arrowRow}>
                    <TouchableOpacity
                      style={styles.arrowButton}
                      onPress={() => adjustPoint(0, 1, 2)}
                    >
                      <Text style={styles.arrowText}>↓</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Reset controls */}
        <View style={styles.resetRow}>
          <TouchableOpacity
            style={[styles.resetButton, !point1 && styles.resetButtonDisabled]}
            onPress={() => {
              setPoint1(null);
              if (point2) onPointsSelected?.([null, point2]);
            }}
            disabled={!point1}
          >
            <Text style={styles.resetButtonText}>Reset Point 1</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.resetButton, !point2 && styles.resetButtonDisabled]}
            onPress={() => {
              setPoint2(null);
              if (point1) onPointsSelected?.([point1, null]);
            }}
            disabled={!point2}
          >
            <Text style={styles.resetButtonText}>Reset Point 2</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              setPoint1(null);
              setPoint2(null);
              resetView();
              onPointsSelected?.(null);
            }}
          >
            <Text style={styles.resetButtonText}>Reset All</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageSection: {
    height: IMAGE_HEIGHT,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  instruction: {
    fontSize: 14,
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  imageWrapper: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  controlsSection: {
    flex: 1,
  },
  controlsContent: {
    padding: 16,
    paddingTop: 8,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  setButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#ecf0f1',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  setButtonActive: {
    backgroundColor: '#3498db',
  },
  setButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  setButtonTextActive: {
    color: '#fff',
  },
  coordinateDisplay: {
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 12,
  },
  coordinateText: {
    fontSize: 12,
    color: '#2c3e50',
    fontFamily: 'monospace',
    marginVertical: 2,
  },
  distanceText: {
    fontWeight: '600',
    color: '#27ae60',
    marginTop: 4,
  },
  adjustmentSection: {
    marginBottom: 12,
  },
  adjustmentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  stepToggle: {
    padding: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 12,
  },
  stepToggleText: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: '600',
  },
  adjustmentGroup: {
    marginBottom: 12,
  },
  adjustmentGroupLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 6,
  },
  arrowGrid: {
    alignItems: 'center',
  },
  arrowRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  arrowButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
    borderRadius: 6,
    margin: 2,
  },
  arrowText: {
    fontSize: 20,
    color: '#2c3e50',
  },
  resetRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  resetButton: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    backgroundColor: '#95a5a6',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  resetButtonDisabled: {
    opacity: 0.4,
  },
  resetButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
});

export default PrecisionPointSelector;