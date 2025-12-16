/**
 * Main App component with navigation setup.
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Screens
import UploadScreen from './src/screens/UploadScreen';
import VideoTrimScreen from './src/screens/VideoTrimScreen';
import CalibrationChoiceScreen from './src/screens/CalibrationChoiceScreen';
import CalibrationManualScreen from './src/screens/CalibrationManualScreen';
import CalibrationTapScreen from './src/screens/CalibrationTapScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import ReportScreen from './src/screens/ReportScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Upload"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#fff' },
          }}
        >
          <Stack.Screen name="Upload" component={UploadScreen} />
          <Stack.Screen name="VideoTrim" component={VideoTrimScreen} />
          <Stack.Screen name="CalibrationChoice" component={CalibrationChoiceScreen} />
          <Stack.Screen name="CalibrationManual" component={CalibrationManualScreen} />
          <Stack.Screen name="CalibrationTap" component={CalibrationTapScreen} />
          <Stack.Screen name="Results" component={ResultsScreen} />
          <Stack.Screen name="Report" component={ReportScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}




