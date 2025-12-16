/**
 * Calibration choice screen - manual or tap-based.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const CalibrationChoiceScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Calibration Method</Text>
        <Text style={styles.subtitle}>
          Choose how to perform pixel-to-cm calibration
        </Text>
      </View>
      
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => navigation.navigate('CalibrationManual')}
        >
          <Text style={styles.optionTitle}>A: Manual Entry</Text>
          <Text style={styles.optionDescription}>
            Enter the real-world distance manually
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => navigation.navigate('CalibrationTap')}
        >
          <Text style={styles.optionTitle}>B: Tap Points</Text>
          <Text style={styles.optionDescription}>
            Select two points on the image and enter the distance between them
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
    gap: 20,
  },
  optionButton: {
    backgroundColor: '#f8f9fa',
    padding: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
});

export default CalibrationChoiceScreen;




