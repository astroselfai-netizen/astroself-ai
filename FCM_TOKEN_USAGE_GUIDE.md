# FCM Token Usage Guide - Complete Guide

## 📱 FCM Token कैसे Get करें और Use करें

### 1. **Hook से Token Get करना** (Recommended)

```typescript
import { useNotifications } from '../hooks/useNotifications';

function MyComponent() {
  const { fcmToken, isLoading, error } = useNotifications();

  useEffect(() => {
    if (fcmToken) {
      console.log('FCM Token:', fcmToken);
      // Token को server पर भेजें
      sendTokenToServer(fcmToken);
    }
  }, [fcmToken]);

  return (
    <View>
      {isLoading && <Text>Loading token...</Text>}
      {error && <Text>Error: {error}</Text>}
      {fcmToken && <Text>Token: {fcmToken}</Text>}
    </View>
  );
}
```

---

### 2. **Service से Direct Token Get करना**

```typescript
import notificationService from '../services/notificationService';

// Get token
const token = await notificationService.getFCMToken();
console.log('FCM Token:', token);

// Get stored token (if available)
const storedToken = await notificationService.getStoredFCMToken();

// Get or create token (optimized)
const token = await notificationService.getOrCreateFCMToken();
```

---

### 3. **Token को Server पर भेजना**

#### Option A: Login/Register के समय

```typescript
import { useNotifications } from '../hooks/useNotifications';
import UserService from '../services/user/user.service';

function LoginScreen() {
  const { fcmToken } = useNotifications();
  const userService = new UserService();

  const handleLogin = async (email: string, password: string) => {
    try {
      // FCM token के साथ login
      const response = await userService.login(email, password, fcmToken || undefined);
      console.log('Login successful');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    // Your login form
  );
}
```

#### Option B: Separate API Call

```typescript
import notificationService from '../services/notificationService';
import { useSelector } from 'react-redux';

async function sendFCMTokenToServer() {
  try {
    const token = await notificationService.getFCMToken();
    const userToken = useSelector(state => state.user.token); // Your auth token
    
    if (!token) {
      console.warn('FCM token not available');
      return;
    }

    const response = await fetch('YOUR_API_ENDPOINT/fcm-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        fcm_token: token,
        platform: Platform.OS, // 'ios' or 'android'
        device_id: DeviceInfo.getUniqueId() // Optional
      })
    });

    if (response.ok) {
      console.log('✅ FCM token sent to server successfully');
    } else {
      console.error('❌ Failed to send token to server');
    }
  } catch (error) {
    console.error('Error sending FCM token:', error);
  }
}
```

---

### 4. **Token Refresh Handle करना**

Token automatically refresh होता है, लेकिन आप manually भी refresh कर सकते हैं:

```typescript
import { useNotifications } from '../hooks/useNotifications';

function MyComponent() {
  const { fcmToken, refreshToken } = useNotifications();

  const handleRefreshToken = async () => {
    await refreshToken();
    // New token automatically update हो जाएगा
  };

  return (
    <Button onPress={handleRefreshToken}>
      Refresh Token
    </Button>
  );
}
```

---

### 5. **Token को AsyncStorage में Store करना**

Token automatically AsyncStorage में store होता है, लेकिन आप manually भी check कर सकते हैं:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get stored token
const storedToken = await AsyncStorage.getItem('fcmToken');
console.log('Stored token:', storedToken);
```

---

### 6. **Complete Example - Token को Server पर भेजना**

```typescript
import React, { useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useSelector } from 'react-redux';
import axios from 'axios';

function App() {
  const { fcmToken, isLoading } = useNotifications();
  const userToken = useSelector(state => state.user.token);
  const userId = useSelector(state => state.user.id);

  useEffect(() => {
    const sendTokenToServer = async () => {
      if (!fcmToken || !userToken) {
        return; // Wait for token and user login
      }

      try {
        await axios.post(
          'https://your-api.com/api/users/fcm-token',
          {
            fcm_token: fcmToken,
            platform: Platform.OS,
            user_id: userId
          },
          {
            headers: {
              'Authorization': `Bearer ${userToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('✅ FCM token sent to server');
      } catch (error) {
        console.error('❌ Error sending FCM token:', error);
      }
    };

    sendTokenToServer();
  }, [fcmToken, userToken, userId]);

  return (
    // Your app content
  );
}
```

---

### 7. **Token को Console में Print करना** (Debugging)

```typescript
import { useNotifications } from '../hooks/useNotifications';

function DebugComponent() {
  const { fcmToken } = useNotifications();

  useEffect(() => {
    if (fcmToken) {
      console.log('=====================================');
      console.log('📱 FCM TOKEN FOR TESTING:');
      console.log('=====================================');
      console.log(fcmToken);
      console.log('=====================================');
      console.log('Platform:', Platform.OS);
      console.log('Token Length:', fcmToken.length);
      console.log('=====================================');
    }
  }, [fcmToken]);

  return null;
}
```

---

### 8. **Token को Clipboard में Copy करना** (Testing के लिए)

```typescript
import Clipboard from '@react-native-clipboard/clipboard';
import { useNotifications } from '../hooks/useNotifications';

function CopyTokenButton() {
  const { fcmToken } = useNotifications();

  const copyToken = () => {
    if (fcmToken) {
      Clipboard.setString(fcmToken);
      Alert.alert('Copied!', 'FCM token copied to clipboard');
    }
  };

  return (
    <Button onPress={copyToken}>
      Copy FCM Token
    </Button>
  );
}
```

---

## 🔍 Token Check करने के तरीके

### 1. **Console Logs में Check करें**
```bash
# iOS
npx react-native log-ios

# Android
npx react-native log-android
```

Look for:
- `🔥 FCM Token Generated:`
- `FCM Token---->`
- `✅ FCM Token stored`

### 2. **AsyncStorage में Check करें**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const token = await AsyncStorage.getItem('fcmToken');
console.log('Stored token:', token);
```

### 3. **React DevTools में Check करें**
- `useNotifications` hook का state check करें
- `fcmToken` value देखें

---

## 🚨 Common Issues

### Issue 1: Token `null` है
**Solution**:
- Permission check करें
- iOS: `registerDeviceForRemoteMessages()` call हुआ है या नहीं
- Firebase configuration check करें
- Logs में error देखें

### Issue 2: Token Server पर नहीं जा रहा
**Solution**:
- Network request check करें
- API endpoint सही है या नहीं
- Authorization token सही है या नहीं
- Server logs check करें

### Issue 3: Token Refresh नहीं हो रहा
**Solution**:
- `onTokenRefresh` listener setup है या नहीं
- Token change होने पर automatically update होगा
- Manual refresh करने के लिए `refreshToken()` call करें

---

## 📝 Best Practices

1. **Token को User Login के बाद ही Server पर भेजें**
   - User authenticated होने के बाद token send करें
   - Token को user_id के साथ associate करें

2. **Token Refresh Handle करें**
   - Token automatically refresh होता है
   - Refresh होने पर server को update भेजें

3. **Error Handling**
   - Token null होने की condition handle करें
   - Network errors handle करें
   - Retry mechanism add करें

4. **Security**
   - Token को secure storage में store करें
   - HTTPS use करें server communication के लिए
   - Token को logs में expose न करें (production में)

---

## 🎯 Quick Reference

```typescript
// Get token from hook
const { fcmToken } = useNotifications();

// Get token from service
const token = await notificationService.getFCMToken();

// Send to server
await fetch('/api/fcm-token', {
  method: 'POST',
  body: JSON.stringify({ fcm_token: token })
});

// Refresh token
await notificationService.refreshToken();
```

---

## ✅ Checklist

- [ ] Token properly generate हो रहा है
- [ ] Token AsyncStorage में store हो रहा है
- [ ] Token server पर send हो रहा है
- [ ] Token refresh properly handle हो रहा है
- [ ] Error handling properly implement है
- [ ] Token को user login के बाद send कर रहे हैं

