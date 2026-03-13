import { Platform, Alert, Linking } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PermissionStatus {
  granted: boolean;
  denied: boolean;
  notDetermined: boolean;
  provisional: boolean;
}

class PermissionChecker {
  private static instance: PermissionChecker;
  private permissionChecked: boolean = false;

  static getInstance(): PermissionChecker {
    if (!PermissionChecker.instance) {
      PermissionChecker.instance = new PermissionChecker();
    }
    return PermissionChecker.instance;
  }

  // Check current permission status
  async checkPermissionStatus(): Promise<PermissionStatus> {
    try {
      const authStatus = await messaging().hasPermission();
      
      return {
        granted: authStatus === messaging.AuthorizationStatus.AUTHORIZED,
        denied: authStatus === messaging.AuthorizationStatus.DENIED,
        notDetermined: authStatus === messaging.AuthorizationStatus.NOT_DETERMINED,
        provisional: authStatus === messaging.AuthorizationStatus.PROVISIONAL,
      };
    } catch (error) {
      console.error('Error checking permission status:', error);
      return {
        granted: false,
        denied: true,
        notDetermined: false,
        provisional: false,
      };
    }
  }

  // Check if permission has been checked before
  async hasPermissionBeenChecked(): Promise<boolean> {
    try {
      const checked = await AsyncStorage.getItem('permission_checked');
      return checked === 'true';
    } catch (error) {
      console.error('Error checking permission status:', error);
      return false;
    }
  }

  // Mark permission as checked
  async markPermissionAsChecked(): Promise<void> {
    try {
      await AsyncStorage.setItem('permission_checked', 'true');
      this.permissionChecked = true;
    } catch (error) {
      console.error('Error marking permission as checked:', error);
    }
  }

  // Show permission request dialog
  async showPermissionRequest(): Promise<boolean> {
    try {
      const status = await this.checkPermissionStatus();
      
      if (status.granted) {
        return true;
      }

      if (status.denied) {
        this.showPermissionDeniedAlert();
        return false;
      }

      // Request permission
      const authStatus = await messaging().requestPermission({
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      });

      const granted = 
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (granted) {
        await this.markPermissionAsChecked();
        return true;
      } else {
        this.showPermissionDeniedAlert();
        return false;
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  }

  // Show permission denied alert
  private showPermissionDeniedAlert(): void {
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

  // Check if we should show permission request
  async shouldShowPermissionRequest(): Promise<boolean> {
    try {
      const status = await this.checkPermissionStatus();
      const hasBeenChecked = await this.hasPermissionBeenChecked();
      
      // Show if not granted and not been checked before
      return !status.granted && !hasBeenChecked;
    } catch (error) {
      console.error('Error checking if should show permission request:', error);
      return false;
    }
  }

  // Reset permission check status (for testing)
  async resetPermissionCheck(): Promise<void> {
    try {
      await AsyncStorage.removeItem('permission_checked');
      this.permissionChecked = false;
    } catch (error) {
      console.error('Error resetting permission check:', error);
    }
  }

  // Get permission status text
  getPermissionStatusText(status: PermissionStatus): string {
    if (status.granted) return 'Granted';
    if (status.denied) return 'Denied';
    if (status.notDetermined) return 'Not Determined';
    if (status.provisional) return 'Provisional';
    return 'Unknown';
  }

  // Check if device supports notifications
  isNotificationSupported(): boolean {
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }

  // Get device-specific permission info
  getDevicePermissionInfo(): string {
    if (Platform.OS === 'ios') {
      return 'Go to Settings > Notifications > Astrodha to enable notifications.';
    } else if (Platform.OS === 'android') {
      return 'Go to Settings > Apps > Astrodha > Notifications to enable notifications.';
    }
    return 'Please check your device settings to enable notifications.';
  }
}

export default PermissionChecker.getInstance();
