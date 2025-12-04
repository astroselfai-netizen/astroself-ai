import { useEffect, useState, useCallback } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notificationService from '../services/notificationService';

interface UseNotificationsReturn {
  fcmToken: string | null;
  isNotificationEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  refreshToken: () => Promise<void>;
  subscribeToTopic: (topic: string) => Promise<void>;
  unsubscribeFromTopic: (topic: string) => Promise<void>;
  requestPermission: () => Promise<boolean>;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize notifications
  const initializeNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize notification service
      await notificationService.initializeNotifications();

      // Check if notifications are enabled
      const enabled = await notificationService.areNotificationsEnabled();
      setIsNotificationEnabled(enabled);

      if (enabled) {
        // Get FCM token
        const token = await notificationService.getFCMToken();

        console.log('FCM Token---->',Platform.OS,"---->", token);
        setFcmToken(token);
      } else {
        // Don't automatically request permission, let user decide
        console.log('Notification permission not granted. User needs to enable manually.');
      }
    } catch (err) {
      console.error('Error initializing notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh FCM token
  const refreshToken = useCallback(async () => {
    try {
      setError(null);
      const token = await notificationService.refreshToken();
      setFcmToken(token);
    } catch (err) {
      console.error('Error refreshing token:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh token');
    }
  }, []);

  // Subscribe to topic
  const subscribeToTopic = useCallback(async (topic: string) => {
    try {
      setError(null);
      await notificationService.subscribeToTopic(topic);
    } catch (err) {
      console.error('Error subscribing to topic:', err);
      setError(err instanceof Error ? err.message : 'Failed to subscribe to topic');
    }
  }, []);

  // Unsubscribe from topic
  const unsubscribeFromTopic = useCallback(async (topic: string) => {
    try {
      setError(null);
      await notificationService.unsubscribeFromTopic(topic);
    } catch (err) {
      console.error('Error unsubscribing from topic:', err);
      setError(err instanceof Error ? err.message : 'Failed to unsubscribe from topic');
    }
  }, []);

  // Request permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      const granted = await notificationService.requestPermission();
      setIsNotificationEnabled(granted);
      
      if (granted) {
        const token = await notificationService.getFCMToken();
        setFcmToken(token);
      }
      
      return granted;
    } catch (err) {
      console.error('Error requesting permission:', err);
      setError(err instanceof Error ? err.message : 'Failed to request permission');
      return false;
    }
  }, []);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App came to foreground, check if we have a token
        // Only refresh if we don't have a token
        if (!fcmToken) {
          // refreshToken();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [refreshToken, fcmToken]);

  // Initialize on mount
  useEffect(() => {
    initializeNotifications();
  }, [initializeNotifications]);

  // Listen for token refresh
  useEffect(() => {
    const unsubscribe = messaging().onTokenRefresh(async (token) => {
      console.log('Token refreshed in hook:', token);
      setFcmToken(token);
    });

    return unsubscribe;
  }, []);

  return {
    fcmToken,
    isNotificationEnabled,
    isLoading,
    error,
    refreshToken,
    subscribeToTopic,
    unsubscribeFromTopic,
    requestPermission,
  };
};

export default useNotifications;
