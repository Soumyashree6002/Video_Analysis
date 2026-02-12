/**
 * Results screen displaying viscosity and graph.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useAnalysisStore from '../store/analysisStore';
import { analyzeViscosity, getReportUrl, getStaticUrl } from '../services/api';
import GraphViewer from '../components/GraphViewer';

const ResultsScreen = () => {
  const navigation = useNavigation();
  const { videoId, analysisResults, graphUrl, setAnalysisResults } = useAnalysisStore();
  const [loading, setLoading] = useState(false);
  const [showGraph, setShowGraph] = useState(false);

  useEffect(() => {
    // Auto-run analysis if not already done
    if (!analysisResults && videoId) {
      runAnalysis();
    }
  }, []);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const results = await analyzeViscosity(videoId);
      setAnalysisResults(results);
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to perform analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = () => {
    navigation.navigate('Report');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Analyzing video...</Text>
      </View>
    );
  }

  if (!analysisResults) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Analysis Results</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.errorText}>No analysis results available</Text>
          <TouchableOpacity style={styles.button} onPress={runAnalysis}>
            <Text style={styles.buttonText}>Run Analysis</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analysis Results</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Viscosity</Text>
          <Text style={styles.resultValue}>
            {analysisResults.viscosity.toFixed(6)} Pa·s
          </Text>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Coefficient (a)</Text>
            <Text style={styles.statValue}>
              {analysisResults.a.toFixed(6)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Exponent (b)</Text>
            <Text style={styles.statValue}>
              {analysisResults.b.toFixed(6)}
            </Text>
          </View>
          {analysisResults.r_squared && (
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>R²</Text>
              <Text style={styles.statValue}>
                {analysisResults.r_squared.toFixed(6)}
              </Text>
            </View>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowGraph(!showGraph)}
        >
          <Text style={styles.buttonText}>
            {showGraph ? 'Hide Graph' : 'Display Graph'}
          </Text>
        </TouchableOpacity>
        
        {showGraph && graphUrl && (
          <View style={styles.graphContainer}>
            <GraphViewer 
              graphUrl={graphUrl.startsWith('http') 
                ? graphUrl 
                : getStaticUrl(graphUrl)} 
            />
          </View>
        )}
        
        <TouchableOpacity
          style={[styles.button, styles.reportButton]}
          onPress={handleGenerateReport}
        >
          <Text style={styles.buttonText}>Generate Report</Text>
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
    padding: 30,
    paddingTop: 60,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  resultCard: {
    backgroundColor: '#3498db',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  resultLabel: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
  },
  resultValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  button: {
    backgroundColor: '#27ae60',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  reportButton: {
    backgroundColor: '#2c3e50',
    marginTop: 'auto',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  graphContainer: {
    height: 300,
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    overflow: 'hidden',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default ResultsScreen;

