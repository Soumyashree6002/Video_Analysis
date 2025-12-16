/**
 * Graph viewer component for displaying analysis results.
 */
import React from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

const GraphViewer = ({ graphUrl }) => {
  if (!graphUrl) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No graph available</Text>
      </View>
    );
  }

  // If graphUrl is a full URL, use WebView, otherwise use Image
  const isFullUrl = graphUrl.startsWith('http://') || graphUrl.startsWith('https://');

  if (isFullUrl) {
    return (
      <View style={styles.container}>
        <WebView
          source={{ uri: graphUrl }}
          style={styles.webview}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3498db" />
            </View>
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: graphUrl }}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  webview: {
    flex: 1,
    width: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
  },
});

export default GraphViewer;







