/**
 * Graph viewer component for displaying analysis results.
 */
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const GraphViewer = ({ graphUrl }) => {
  if (!graphUrl) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No graph available</Text>
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
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
  },
});

export default GraphViewer;







