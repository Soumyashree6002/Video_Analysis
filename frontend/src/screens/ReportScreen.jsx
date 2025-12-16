/**
 * Report screen for downloading PDF report.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import useAnalysisStore from '../store/analysisStore';
import { getReportUrl } from '../services/api';

const ReportScreen = () => {
  const { videoId } = useAnalysisStore();
  const [loading, setLoading] = useState(false);

  const handleDownloadReport = async () => {
    if (!videoId) {
      alert('No video ID available');
      return;
    }

    setLoading(true);
    try {
      const reportUrl = getReportUrl(videoId);
      const canOpen = await Linking.canOpenURL(reportUrl);
      
      if (canOpen) {
        await Linking.openURL(reportUrl);
      } else {
        alert('Cannot open report URL. Please check your connection.');
      }
    } catch (error) {
      console.error('Error opening report:', error);
      alert('Failed to open report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Report Ready</Text>
        <Text style={styles.subtitle}>
          Your analysis report has been generated
        </Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            The PDF report contains:
          </Text>
          <Text style={styles.infoItem}>• Height vs Time graph</Text>
          <Text style={styles.infoItem}>• Regression equation</Text>
          <Text style={styles.infoItem}>• Viscosity value</Text>
        </View>
        
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleDownloadReport}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Download PDF Report</Text>
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
  infoCard: {
    backgroundColor: '#f8f9fa',
    padding: 24,
    borderRadius: 12,
    marginBottom: 30,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  infoItem: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
    marginLeft: 8,
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
});

export default ReportScreen;




