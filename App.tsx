/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {
  StatusBar,
  LogBox,
  Platform,
} from 'react-native';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
// import AstroselfLogin from './src/screen/SplashScreen';
import MainNavigator from './src/routes/navigation';
import Toast from 'react-native-toast-message';
 
import { useSelector } from 'react-redux';
import { RootState } from './src/state/store';
import { useAppInitialization } from './src/hooks/useAppInitialization';
import { useNotifications } from './src/hooks/useNotifications';
import PermissionRequestModal from './src/components/PermissionRequestModal';
// import NotificationBanner from './src/components/NotificationBanner';
import permissionChecker from './src/utils/permissionChecker';
import CrashlyticsService from './src/services/crashlyticsService';
import { ThemeProvider } from './src/context/ThemeContext';

// import iOSDebugInfo from './src/components/iOSDebugInfo';
// Enable optimized screens
enableScreens();

// // Ignore specific logs
LogBox.ignoreLogs(['Warning: ...']);
LogBox.ignoreAllLogs();

function App() {
  // Initialize app with user data from AsyncStorage
  useAppInitialization();

  
  
  // Initialize push notifications
  const { fcmToken, isNotificationEnabled, isLoading } = useNotifications();
  const [showPermissionModal, setShowPermissionModal] = React.useState(false);

  const keyState = useSelector((state: RootState) => state.app.keyState);

  // Initialize Crashlytics
  React.useEffect(() => {
    const initializeCrashlytics = async () => {
      try {
        // Enable Crashlytics collection
        await CrashlyticsService.setEnabled(true);
        
        // Log app startup
        CrashlyticsService.log('App started', {
          platform: Platform.OS,
          version: '1.0.0', // You can get this from package.json or app config
        });
        
        console.log('Crashlytics initialized successfully');
      } catch (error) {
        console.warn('Failed to initialize Crashlytics:', error);
      }
    };

    initializeCrashlytics();
  }, []);

  console.log('keyState---->', keyState);
  console.log('FCM Token---->',Platform.OS,"---->", fcmToken);
  console.log('Notification Enabled---->', isNotificationEnabled);
  
  // Copy FCM token to clipboard for easy testing
  if (fcmToken) {
    console.log('📱 COPY THIS FCM TOKEN FOR TESTING:');
    console.log('=====================================');
    console.log(fcmToken);
    console.log('=====================================');
  }

  // Show permission modal if notifications are not enabled and loading is complete
  React.useEffect(() => {
    const checkAndShowPermission = async () => {
      if (!isLoading && !isNotificationEnabled) {
        const shouldShow = await permissionChecker.shouldShowPermissionRequest();
        if (shouldShow) {
          // Show modal after a short delay to let the app load
          const timer = setTimeout(() => {
            // setShowPermissionModal(true);
          }, 2000);
          
          return () => clearTimeout(timer);
        }
      }
    };

    checkAndShowPermission();
  }, [isLoading, isNotificationEnabled]);

  return (
    // <View key={keyState} style={{flex:1}}>
      <ThemeProvider>
        <SafeAreaProvider>
          <StatusBar />
          {/* <View key={keyState}> */}
          <MainNavigator />
          {/* </View> */}
          <Toast  />
          
          {/* Notification Banner */}
          {/* <NotificationBanner
            onPress={() => setShowPermissionModal(true)}
          /> */}
          
          {/* Permission Request Modal */}
          <PermissionRequestModal
            visible={showPermissionModal}
            onClose={() => setShowPermissionModal(false)}
          />
          
          {/* iOS Debug Info */}
          {/* <iOSDebugInfo /> */}
        </SafeAreaProvider>
      </ThemeProvider>
    // </View>
  );
}


export default App;
