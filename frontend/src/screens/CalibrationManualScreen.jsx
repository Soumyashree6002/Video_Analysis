/**
 * Manual calibration screen.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useAnalysisStore from '../store/analysisStore';
import { calibrateManual } from '../services/api';
import { validateDistance } from '../utils/validators';

const CalibrationManualScreen = () => {
  const navigation = useNavigation();
  const { videoId, setCalibration } = useAnalysisStore();
  const [distance, setDistance] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCalibrate = async () => {
    const distanceValue = parseFloat(distance);
    
    const validation = validateDistance(distanceValue);
    if (!validation.valid) {
      Alert.alert('Invalid Input', validation.error);
      return;
    }

    setLoading(true);
    try {
      const result = await calibrateManual(videoId, distanceValue);
      setCalibration('manual', result);
      navigation.navigate('Results');
    } catch (error) {
      console.error('Calibration error:', error);
      Alert.alert('Error', 'Failed to perform calibration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manual Calibration</Text>
        <Text style={styles.subtitle}>
          Enter how many pixels equal 1 centimeter
        </Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Pixels per cm</Text>
          <TextInput
            style={styles.input}
            value={distance}
            onChangeText={setDistance}
            placeholder="e.g., 150"
            keyboardType="decimal-pad"
            autoFocus
          />
        </View>
        
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCalibrate}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Calibrating...' : 'Continue'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Enter the number of pixels that equal 1 centimeter in your video. For example, if you enter 150, it means 1 cm = 150 pixels.
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
  inputContainer: {
    marginBottom: 30,
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
  infoContainer: {
    marginTop: 30,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
});

export default CalibrationManualScreen;




