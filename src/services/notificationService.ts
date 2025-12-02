import messaging from '@react-native-firebase/messaging';
import { Platform, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
  imageUrl?: string;
  actionUrl?: string;
}

class NotificationService {
  private fcmToken: string | null = null;

  // Initialize push notifications
  async initialize(): Promise<void> {
    try {
      // Request permission for notifications
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

      console.log('Authorization status---->',Platform.OS,"---->", enabled);

      if (enabled) {
        console.log('Authorization status:', authStatus);
        
        // Get FCM token
        await this.getFCMToken();
        
        // Set up message handlers
        this.setupMessageHandlers();
        
        // Set up token refresh listener
        this.setupTokenRefreshListener();
        
        // Check for initial notification
        this.checkInitialNotification();
      } else {
        console.log('Notification permission denied');
        Alert.alert(
          'Notification Permission',
          'Please enable notifications in settings to receive important updates.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Linking.openSettings() }
          ]
        );
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  // Get FCM token
  async getFCMToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      this.fcmToken = token;
      
      // Store token in AsyncStorage
      await AsyncStorage.setItem('fcmToken', token);
      
      console.log('🔥 FCM Token Generated:', token);
      console.log('📱 Platform:', Platform.OS);
      console.log('🔔 Token Length:', token.length);
      
      // Send token to your server here
      // await this.sendTokenToServer(token);
      
      return token;
    } catch (error) {
      console.error('❌ Error getting FCM token:', error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  // Get stored FCM token
  async getStoredFCMToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem('fcmToken');
      return token;
    } catch (error) {
      console.error('Error getting stored FCM token:', error);
      return null;
    }
  }

  // Get or create FCM token - optimized to reuse stored token
  // This method will:
  // 1. First check if token exists in storage
  // 2. If exists, return stored token (no new generation)
  // 3. If not exists, generate new token once and store it
  // This prevents unnecessary token regeneration
  async getOrCreateFCMToken(): Promise<string | null> {
    try {
      // First, try to get stored token
      let token = await this.getStoredFCMToken();
      
      if (token) {
        // Token exists in storage, use it (no need to generate new)
        console.log('✅ Using stored FCM token (no regeneration)');
        this.fcmToken = token;
        return token;
      }
      
      // Token doesn't exist, generate new token once
      console.log('🆕 No stored token found, generating new FCM token');
      token = await this.getFCMToken();
      
      return token;
    } catch (error) {
      console.error('❌ Error in getOrCreateFCMToken:', error);
      return null;
    }
  }

  // Send token to server (implement your API call here)
  private async sendTokenToServer(token: string): Promise<void> {
    try {
      // Replace with your actual API endpoint
      // const response = await fetch('YOUR_API_ENDPOINT/fcm-token', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${userToken}` // if needed
      //   },
      //   body: JSON.stringify({ fcmToken: token })
      // });
      
      console.log('Token sent to server:', token);
    } catch (error) {
      console.error('Error sending token to server:', error);
    }
  }

  // Set up message handlers
  private setupMessageHandlers(): void {
    // Handle background messages
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Message handled in the background!', remoteMessage);
      
      // You can perform background tasks here
      // For example, update local storage, sync data, etc.
      
      return Promise.resolve();
    });

    // Handle foreground messages
    messaging().onMessage(async remoteMessage => {
      console.log('A new FCM message arrived!', remoteMessage);
      
      // Show local notification or custom UI
      this.handleForegroundMessage(remoteMessage);
    });

    // Handle notification opened app
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification caused app to open from background state:', remoteMessage);
      
      // Handle navigation based on notification data
      this.handleNotificationPress(remoteMessage);
    });
  }

  // Set up token refresh listener
  private setupTokenRefreshListener(): void {
    messaging().onTokenRefresh(async (token) => {
      console.log('FCM Token refreshed:', token);
      this.fcmToken = token;
      
      // Store new token in AsyncStorage
      await AsyncStorage.setItem('fcmToken', token);
      
      // Send new token to your server here
      // await this.sendTokenToServer(token);
    });
  }

  // Check for initial notification (when app is opened from notification)
  private async checkInitialNotification(): Promise<void> {
    try {
      const remoteMessage = await messaging().getInitialNotification();
      
      if (remoteMessage) {
        console.log('Notification caused app to open from quit state:', remoteMessage);
        
        // Handle navigation based on notification data
        this.handleNotificationPress(remoteMessage);
      }
    } catch (error) {
      console.error('Error checking initial notification:', error);
    }
  }

  // Handle foreground messages
  private handleForegroundMessage(remoteMessage: any): void {
    const { notification } = remoteMessage;
    
    if (notification) {
      // Show custom alert or in-app notification
      Alert.alert(
        notification.title || 'New Notification',
        notification.body || 'You have a new message',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'View', 
            onPress: () => this.handleNotificationPress(remoteMessage)
          }
        ]
      );
    }
  }

  // Handle notification press
  private handleNotificationPress(remoteMessage: any): void {
    const { data } = remoteMessage;
    
    if (data) {
      // Navigate based on notification data
      if (data.screen) {
        // Navigate to specific screen
        console.log('Navigate to screen:', data.screen);
        // Implement navigation logic here
      }
      
      if (data.url) {
        // Open URL
        Linking.openURL(data.url);
      }
      
      if (data.action) {
        // Handle custom action
        console.log('Custom action:', data.action);
      }
    }
    
    // Log the data for debugging
    console.log('Notification data:', data);
  }

  // Subscribe to topic
  async subscribeToTopic(topic: string): Promise<void> {
    try {
      await messaging().subscribeToTopic(topic);
      console.log(`Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error('Error subscribing to topic:', error);
    }
  }

  // Unsubscribe from topic
  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      await messaging().unsubscribeFromTopic(topic);
      console.log(`Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
    }
  }

  // Get current FCM token
  getCurrentToken(): string | null {
    return this.fcmToken;
  }

  // Refresh FCM token
  async refreshToken(): Promise<string | null> {
    try {
      await messaging().deleteToken();
      return await this.getFCMToken();
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }

  // Check if notifications are enabled
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      const authStatus = await messaging().hasPermission();
      return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
             authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    } catch (error) {
      console.error('Error checking notification permission:', error);
      return false;
    }
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
             authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Initialize notifications (call this from your app)
  async initializeNotifications(): Promise<void> {
    await this.initialize();
  }
}

export default new NotificationService();
