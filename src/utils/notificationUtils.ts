import { Platform, Alert, Linking, PermissionsAndroid } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { NotificationPermissionStatus } from '../types/notifications';

export class NotificationUtils {
  // Check notification permission status
  static async getPermissionStatus(): Promise<NotificationPermissionStatus> {
    try {
      const authStatus = await messaging().hasPermission();
      
      return {
        authorized: authStatus === messaging.AuthorizationStatus.AUTHORIZED,
        provisional: authStatus === messaging.AuthorizationStatus.PROVISIONAL,
        denied: authStatus === messaging.AuthorizationStatus.DENIED,
        notDetermined: authStatus === messaging.AuthorizationStatus.NOT_DETERMINED,
      };
    } catch (error) {
      console.error('Error checking permission status:', error);
      return {
        authorized: false,
        provisional: false,
        denied: true,
        notDetermined: false,
      };
    }
  }

  // Request notification permission with proper handling
  static async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        // For Android 13+ (API level 33+), request notification permission
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Notification Permission',
              message: 'This app needs notification permission to send you important updates.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            return false;
          }
        }
      }

      // Request Firebase messaging permission
      const authStatus = await messaging().requestPermission({
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      });

      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      return enabled;
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  }

  // Show permission denied alert
  static showPermissionDeniedAlert(): void {
    Alert.alert(
      'Notification Permission Required',
      'To receive important updates and notifications, please enable notifications in your device settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Settings', 
          onPress: () => Linking.openSettings() 
        }
      ]
    );
  }

  // Check if app is in foreground
  static isAppInForeground(): boolean {
    return Platform.OS === 'ios' ? true : true; // You can implement proper foreground detection
  }

  // Format notification data
  static formatNotificationData(data: any): any {
    if (!data) return {};

    // Handle different data formats
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        return { message: data };
      }
    }

    return data;
  }

  // Validate notification payload
  static validateNotificationPayload(payload: any): boolean {
    if (!payload) return false;
    
    // Check if payload has required fields
    if (payload.notification && payload.notification.title && payload.notification.body) {
      return true;
    }
    
    // Check if it's a data-only message
    if (payload.data && (payload.data.title || payload.data.message)) {
      return true;
    }
    
    return false;
  }

  // Create notification channel for Android
  // NOTE: This is now handled in MainApplication.kt onCreate()
  // This method is kept for backward compatibility but the channel is created natively
  static async createNotificationChannel(): Promise<void> {
    if (Platform.OS === 'android') {
      try {
        // Notification channel is created in MainApplication.kt
        // Firebase will use the default channel if it exists
        console.log('Notification channel should be created in MainApplication.kt');
      } catch (error) {
        console.error('Error creating notification channel:', error);
      }
    }
  }

  // Get device info for debugging
  static getDeviceInfo(): object {
    return {
      platform: Platform.OS,
      version: Platform.Version,
      isTablet: Platform.isPad || Platform.isTVOS,
    };
  }

  // Handle deep link from notification
  static handleDeepLink(url: string): void {
    try {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        Linking.openURL(url);
      } else if (url.startsWith('app://')) {
        // Handle custom app deep links
        console.log('Custom deep link:', url);
        // Implement your deep link handling logic here
      }
    } catch (error) {
      console.error('Error handling deep link:', error);
    }
  }

  // Check if notification is from today
  static isNotificationFromToday(timestamp: number): boolean {
    const today = new Date();
    const notificationDate = new Date(timestamp);
    
    return (
      today.getDate() === notificationDate.getDate() &&
      today.getMonth() === notificationDate.getMonth() &&
      today.getFullYear() === notificationDate.getFullYear()
    );
  }

  // Generate notification ID
  static generateNotificationId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Parse notification action
  static parseNotificationAction(data: any): { action: string; params: any } {
    if (!data || !data.action) {
      return { action: 'default', params: {} };
    }

    const { action, ...params } = data;
    return { action, params };
  }
}

export default NotificationUtils;
