import messaging from '@react-native-firebase/messaging';
import {
  Platform,
  Alert,
  Linking,
  NativeEventEmitter,
  DeviceEventEmitter,
  PermissionsAndroid,
  AppState,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserService from './user/user.service';
import { openAstrologerNotification } from '../utils/astrologerNotificationNavigation';
import { refreshAstrologerUnreadCount } from '../utils/astrologerUnreadCount';
import { store } from '../state/store';
import { incrementUnreadCount } from '../state/slices/notificationSlice';

export const FOREGROUND_PUSH_EVENT = 'astroself.foregroundPush';

export type ForegroundPushPayload = {
  title: string;
  body: string;
  remoteMessage: any;
};

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
  imageUrl?: string;
  actionUrl?: string;
}

class NotificationService {
  private fcmToken: string | null = null;
  private isIOSRegistered: boolean = false;
  private tokenPromiseResolve: ((token: string) => void) | null = null;
  private tokenPromiseReject: ((error: Error) => void) | null = null;
  private handlersReady: boolean = false;
  private handledInitialNotificationIds = new Set<string>();
  private checkingInitialNotification = false;

  private async requestAndroidPostNotifications(): Promise<boolean> {
    if (Platform.OS !== 'android' || Number(Platform.Version) < 33) {
      return true;
    }

    const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
    if (!permission) {
      return true;
    }

    try {
      const alreadyGranted = await PermissionsAndroid.check(permission);
      if (alreadyGranted) {
        return true;
      }

      const result = await PermissionsAndroid.request(permission, {
        title: 'Notification Permission',
        message:
          'Astrodha.AI needs notification permission to send you transit and planet alerts.',
        buttonPositive: 'OK',
        buttonNegative: 'Cancel',
      });

      return result === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error('Error requesting Android notification permission:', error);
      return false;
    }
  }

  private async persistAndSyncToken(token: string): Promise<void> {
    if (!token) {
      return;
    }

    this.fcmToken = token;
    await AsyncStorage.setItem('fcmToken', token);
    await this.sendTokenToServer(token);
  }

  // Helper method to ensure iOS device is registered for remote messages
  private async ensureIOSRegistration(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return true; // Not iOS, no registration needed
    }

    if (this.isIOSRegistered) {
      return true; // Already registered
    }

    try {
      console.log('📱 Calling registerDeviceForRemoteMessages()...');
      await messaging().registerDeviceForRemoteMessages();
      this.isIOSRegistered = true;
      console.log('✅ iOS device registered for remote messages');
      
      return true;
    } catch (error: any) {
      // Check if error is because already registered
      if (error?.code === 'messaging/already-registered' || 
          error?.message?.includes('already registered')) {
        this.isIOSRegistered = true;
        console.log('ℹ️ iOS device already registered');
        return true;
      }
      
      // Check if error is about missing entitlements
      if (error?.code === 'messaging/unknown' && 
          error?.message?.includes('aps-environment')) {
        console.error('❌ CRITICAL: Entitlements not configured in Xcode!');
        console.error('📋 Fix Steps:');
        console.error('1. Open ios/Astroself.xcworkspace in Xcode');
        console.error('2. Target → Build Settings → Search "Code Signing Entitlements"');
        console.error('3. Debug: Set to "Astroself/AstroselfDebug.entitlements"');
        console.error('4. Release: Set to "Astroself/AstroselfRelease.entitlements"');
        console.error('5. Target → Signing & Capabilities → Add "Push Notifications"');
        console.error('6. Clean build and run again');
        console.error('');
        console.error('📖 See IOS_ENTITLEMENTS_FIX.md for detailed steps');
        return false;
      }
      
      console.error('❌ Error registering iOS device for remote messages:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      return false;
    }
  }

  // Helper method to get FCM token with retries (for iOS)
  private async getFCMTokenWithRetry(maxRetries: number = 1, delay: number = 2000): Promise<string | null> {
    console.log(`🔄 Starting getToken() retry mechanism (${maxRetries} attempts, ${delay}ms delay)`);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📱 Attempt ${attempt}/${maxRetries}: Calling messaging().getToken()...`);
        const token = await messaging().getToken();
        
        if (token && token.length > 0) {
          console.log(`✅ FCM token retrieved successfully on attempt ${attempt}`);
          console.log(`📱 Token length: ${token.length}`);
          console.log(`📱 Token preview: ${token.substring(0, 20)}...`);
          return token;
        } else {
          console.warn(`⚠️ Attempt ${attempt}: Got empty token`);
        }
      } catch (error: any) {
        const isUnregisteredError = error?.code === 'messaging/unregistered' || 
                                   (error instanceof Error && error.message?.includes('unregistered'));
        
        console.log(`❌ Attempt ${attempt} failed:`);
        console.log(`   Error code: ${error?.code}`);
        console.log(`   Error message: ${error?.message}`);
        console.log(`   Is unregistered error: ${isUnregisteredError}`);
        
        if (isUnregisteredError && attempt < maxRetries) {
          const waitTime = delay;
          console.log(`⏳ Waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}...`);
          await new Promise<void>(resolve => setTimeout(() => resolve(), waitTime));
          continue;
        }
        
        // If it's not an unregistered error, log and continue
        if (!isUnregisteredError) {
          console.warn(`⚠️ Non-unregistered error on attempt ${attempt}, continuing...`);
          if (attempt < maxRetries) {
            const waitTime = delay;
            await new Promise<void>(resolve => setTimeout(() => resolve(), waitTime));
            continue;
          }
        }
        
        // If we've exhausted retries
        if (attempt === maxRetries) {
          console.warn(`⚠️ Max retries (${maxRetries}) reached. All getToken() attempts failed.`);
          return null;
        }
      }
    }
    
    console.error('❌ All retry attempts exhausted');
    return null;
  }

  // Initialize push notifications
  async initialize(): Promise<void> {
    try {
      await this.requestAndroidPostNotifications();

      try {
        await messaging().setForegroundNotificationPresentationOptions({
          alert: true,
          badge: true,
          sound: true,
        });
      } catch (error) {
        console.log('Foreground presentation options not available:', error);
      }

      // Request permission for notifications FIRST
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
        
        // IMPORTANT: Set up token refresh listener FIRST (before getting token)
        // This ensures the promise is ready when the callback fires
        this.setupTokenRefreshListener();
        
        // Set up message handlers
        this.setupMessageHandlers();
        
        // iOS: Register device for remote messages AFTER permission is granted
        // This is critical - registration must happen after permission
        if (Platform.OS === 'ios') {
          console.log('📱 Registering iOS device for remote messages (after permission granted)...');
          const registered = await this.ensureIOSRegistration();
          if (!registered) {
            console.warn('⚠️ iOS registration failed, but continuing...');
          }
          
          // Wait a bit for APNs token to be available (AppDelegate callback)
          console.log('⏳ Waiting for APNs token registration...');
          await new Promise<void>(resolve => setTimeout(() => resolve(), 2000));
        }
        
        // Try to get FCM token (after registration on iOS)
        // If direct call fails, the token refresh listener promise will catch it
        await this.getFCMToken();
        
        // Ensure Android notification channel exists for FCM default channel id.
        if (Platform.OS === 'android') {
          try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const PushNotification = require('react-native-push-notification');
            PushNotification.createChannel?.(
              {
                channelId: 'astrodha_default',
                channelName: 'Astrodha Alerts',
                channelDescription: 'Transit and planet alerts',
                importance: 4,
                vibrate: true,
              },
              () => undefined,
            );
          } catch (channelError) {
            console.log('Could not create notification channel', channelError);
          }
        }

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
    // If we already have a token, return it
    if (this.fcmToken) {
      console.log('✅ Returning cached FCM token');
      this.sendTokenToServer(this.fcmToken);
      return this.fcmToken;
    }

    // Check stored token first
    const storedToken = await this.getStoredFCMToken();
    if (storedToken) {
      console.log('✅ Returning stored FCM token');
      this.fcmToken = storedToken;
      this.sendTokenToServer(storedToken);
      return storedToken;
    }

    try {
      // iOS: Ensure registration and then try to get token
      if (Platform.OS === 'ios') {
        console.log('📱 iOS: Attempting to get FCM token...');
        
        // Step 1: Ensure device is registered
        console.log('📱 Step 1: Ensuring iOS device registration...');
        const registered = await this.ensureIOSRegistration();
        if (!registered) {
          console.warn('⚠️ iOS registration failed, but trying anyway...');
        }
        
        // Step 2: Wait a bit for APNs token
        console.log('📱 Step 2: Waiting for APNs token...');
        await new Promise<void>(resolve => setTimeout(() => resolve(), 3000));
        
        // Step 3: Try direct getToken() call with retries
        console.log('📱 Step 3: Calling messaging().getToken()...');
        const token = await this.getFCMTokenWithRetry(1, 2000);
        
        if (token) {
          console.log('✅ Got FCM token via retry mechanism:', token);
          await this.persistAndSyncToken(token);
          return token;
        }
        
        // Step 4: If retry failed, wait for callback
        console.log('📱 Step 4: Retry failed, setting up callback promise...');
        const tokenPromise = new Promise<string>((resolve, reject) => {
          this.tokenPromiseResolve = resolve;
          this.tokenPromiseReject = reject;
          
          setTimeout(() => {
            if (this.tokenPromiseResolve === resolve) {
              reject(new Error('Timeout waiting for FCM token via callback'));
            }
          }, 10000);
        });
        
        try {
          console.log('📱 Waiting for token via callback (max 20 seconds)...');
          const callbackToken = await tokenPromise;
          if (callbackToken) {
            console.log('✅ Got FCM token via callback:', callbackToken);
            await this.persistAndSyncToken(callbackToken);
            this.tokenPromiseResolve = null;
            this.tokenPromiseReject = null;
            return callbackToken;
          }
        } catch (callbackError) {
          console.error('❌ Callback timeout:', callbackError);
          this.tokenPromiseResolve = null;
          this.tokenPromiseReject = null;
        }
        
        console.error('❌ All methods failed to get FCM token');
        return null;
      } else {
        // Android: Direct call
        console.log('📱 Android: Calling messaging().getToken()...');
        const token = await messaging().getToken();
        await this.persistAndSyncToken(token);
        console.log('🔥 FCM Token Generated:', token);
        return token;
      }
    } catch (error: any) {
      console.error('❌ Error getting FCM token:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Full error:', JSON.stringify(error, null, 2));
      
      // Cleanup promise handlers
      this.tokenPromiseResolve = null;
      this.tokenPromiseReject = null;
      
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
      // iOS: Ensure device is registered first
      if (Platform.OS === 'ios') {
        await this.ensureIOSRegistration();
      }

      // First, try to get stored token
      let token = await this.getStoredFCMToken();
      
      if (token) {
        // Token exists in storage, use it (no need to generate new)
        console.log('✅ Using stored FCM token (no regeneration)');
        this.fcmToken = token;
        await this.sendTokenToServer(token);
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

  async sendTokenToServer(token: string): Promise<void> {
    try {
      if (!token) {
        return;
      }

      const userRaw = await AsyncStorage.getItem('USER_DATA');
      if (!userRaw) {
        return;
      }

      const user = JSON.parse(userRaw) as { email?: string };
      const email = String(user?.email || '');
      if (!email) {
        return;
      }

      const lastSent = await AsyncStorage.getItem('fcmTokenSentToServer');
      const stamp = `${email}:${token}`;
      if (lastSent === stamp) {
        return;
      }

      await new UserService().updateAstrologerFcmToken(email, token);
      await AsyncStorage.setItem('fcmTokenSentToServer', stamp);
      console.log('Token sent to server:', token);
    } catch (error) {
      console.error('Error sending token to server:', error);
    }
  }

  // Set up message handlers
  // NOTE: Background message handler MUST be registered in index.js at the top level
  // Do NOT register it here as it won't work for background/quit state
  private setupMessageHandlers(): void {
    if (this.handlersReady) {
      return;
    }
    this.handlersReady = true;

    messaging().onMessage(async remoteMessage => {
      console.log('📱 Foreground message received:', remoteMessage);
      this.handleForegroundMessage(remoteMessage);
    });

    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('📱 Notification opened app from background state:', remoteMessage);
      this.handleNotificationPress(remoteMessage);
    });

    // Some Android OEMs deliver the tap after JS is already running.
    AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        this.checkInitialNotification(true);
      }
    });
  }

  // Set up token refresh listener
  private setupTokenRefreshListener(): void {
    // Primary: Listen for token refresh (this will fire when token is available)
    messaging().onTokenRefresh(async (token) => {
      console.log('🔄 FCM Token refreshed/available via onTokenRefresh:', token);
      await this.persistAndSyncToken(token);
      
      // Resolve promise if waiting
      if (this.tokenPromiseResolve) {
        console.log('✅ Resolving token promise with token from onTokenRefresh');
        this.tokenPromiseResolve(token);
        this.tokenPromiseResolve = null;
        this.tokenPromiseReject = null;
      }
    });

    // iOS: Also listen for token via NotificationCenter (from AppDelegate)
    // This is important because AppDelegate receives the token via MessagingDelegate callback
    if (Platform.OS === 'ios') {
      try {
        const eventEmitter = new NativeEventEmitter();
        eventEmitter.addListener('FCMToken', (data: { token: string }) => {
          if (data?.token) {
            console.log('📱 FCM Token received via AppDelegate NotificationCenter:', data.token);
            
            if (!this.fcmToken) {
              this.persistAndSyncToken(data.token);
              console.log('✅ FCM Token stored from AppDelegate callback');
            }
            
            // Resolve promise if waiting
            if (this.tokenPromiseResolve) {
              console.log('✅ Resolving token promise with token from AppDelegate');
              this.tokenPromiseResolve(data.token);
              this.tokenPromiseResolve = null;
              this.tokenPromiseReject = null;
            }
          }
        });
        
        // Keep subscription alive (service is singleton, so this is fine)
        console.log('✅ FCMToken event listener set up for iOS');
      } catch (error) {
        // Event emitter might not be available, that's okay
        console.log('ℹ️ Could not set up FCMToken event listener (not critical)');
      }
    }
  }

  // Check for initial notification (when app is opened from notification)
  private async checkInitialNotification(fromResume = false): Promise<void> {
    if (this.checkingInitialNotification) {
      return;
    }
    this.checkingInitialNotification = true;

    try {
      const remoteMessage = await messaging().getInitialNotification();

      if (remoteMessage) {
        const messageId = String(
          remoteMessage.messageId ||
            remoteMessage.data?.notification_id ||
            remoteMessage.data?.title ||
            JSON.stringify(remoteMessage.data || {}),
        );
        if (this.handledInitialNotificationIds.has(messageId)) {
          return;
        }
        this.handledInitialNotificationIds.add(messageId);

        console.log(
          fromResume
            ? 'Notification open detected on resume:'
            : 'Notification caused app to open from quit state:',
          remoteMessage,
        );
        // Wait briefly so NavigationContainer / auth bootstrap can become ready.
        setTimeout(() => {
          this.handleNotificationPress(remoteMessage);
        }, fromResume ? 200 : 600);
      }
    } catch (error) {
      console.error('Error checking initial notification:', error);
    } finally {
      this.checkingInitialNotification = false;
    }
  }

  private handleForegroundMessage(remoteMessage: any): void {
    const notification = remoteMessage?.notification || {};
    const data = remoteMessage?.data || {};
    const title = String(notification.title || data.title || 'New Notification');
    const body = String(notification.body || data.body || data.message || '');

    store.dispatch(incrementUnreadCount());
    refreshAstrologerUnreadCount();
    setTimeout(() => {
      refreshAstrologerUnreadCount();
    }, 1500);

    if (Platform.OS === 'android') {
      DeviceEventEmitter.emit(FOREGROUND_PUSH_EVENT, {
        title,
        body,
        remoteMessage,
      } as ForegroundPushPayload);
    }
  }

  private handleNotificationPress(remoteMessage: any): void {
    const data = {
      ...((remoteMessage?.data || {}) as Record<string, unknown>),
    };

    const notification = remoteMessage?.notification || {};
    if (!data.title && notification.title) {
      data.title = notification.title;
    }
    if (!data.body && notification.body) {
      data.body = notification.body;
      data.message = data.message || notification.body;
    }

    const url = data.url ? String(data.url) : '';

    if (
      url &&
      !data.route &&
      !data.screen &&
      !data.notification_type &&
      !data.notification_id &&
      !data.notificationId &&
      !data.collection &&
      !data.pipeline
    ) {
      Linking.openURL(url).catch(error => {
        console.error('Error opening notification URL:', error);
      });
      return;
    }

    openAstrologerNotification(data);
  }

  openRemoteMessage(remoteMessage: any): void {
    this.handleNotificationPress(remoteMessage);
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
      if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
        const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
        if (permission) {
          const granted = await PermissionsAndroid.check(permission);
          if (!granted) {
            return false;
          }
        }
      }

      const authStatus = await messaging().hasPermission();
      return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
             authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    } catch (error) {
      console.error('Error checking notification permission:', error);
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      const androidGranted = await this.requestAndroidPostNotifications();
      if (!androidGranted) {
        return false;
      }

      if (Platform.OS === 'ios') {
        await this.ensureIOSRegistration();
      }

      const authStatus = await messaging().requestPermission({
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      });
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
