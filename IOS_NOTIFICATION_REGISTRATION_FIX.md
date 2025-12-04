# iOS Push Notification Registration Fix

## Issue
iOS requires explicit device registration for remote messages before getting the FCM token. Error:
```
[messaging/unregistered] You must be registered for remote messages before calling getToken, 
see messaging().registerDeviceForRemoteMessages().
```

## Fix Applied

### 1. ✅ Added iOS Registration in `initialize()`
- Registers device for remote messages BEFORE requesting permission
- Ensures device is ready before getting FCM token

### 2. ✅ Added iOS Registration in `getFCMToken()`
- Registers device before getting token (if not already registered)
- Includes retry logic if registration fails initially
- Handles the case where device might already be registered

### 3. ✅ Added iOS Registration in `getOrCreateFCMToken()`
- Ensures registration before token operations

### 4. ✅ Added iOS Registration in `requestPermission()`
- Registers device before requesting permission

## How It Works

1. **On iOS**: `messaging().registerDeviceForRemoteMessages()` is called before any token operations
2. **Error Handling**: If device is already registered, the error is caught and ignored
3. **Retry Logic**: If getting token fails due to unregistered device, it registers and retries

## Code Changes

### Before:
```typescript
async getFCMToken(): Promise<string | null> {
  const token = await messaging().getToken(); // ❌ Fails on iOS
  return token;
}
```

### After:
```typescript
async getFCMToken(): Promise<string | null> {
  // iOS: Register device first
  if (Platform.OS === 'ios') {
    await messaging().registerDeviceForRemoteMessages();
  }
  const token = await messaging().getToken(); // ✅ Works on iOS
  return token;
}
```

## Testing

1. **Clean build**:
   ```bash
   cd ios
   pod install
   cd ..
   npx react-native run-ios
   ```

2. **Check logs**:
   - Look for: `✅ iOS device registered for remote messages`
   - Look for: `🔥 FCM Token Generated:`
   - Should NOT see: `[messaging/unregistered]` error

3. **Verify token**:
   - Token should be generated successfully
   - Token should be stored in AsyncStorage
   - Token should be logged to console

## Notes

- Registration is idempotent - calling it multiple times is safe
- If device is already registered, it will throw an error which we catch and ignore
- Registration must happen BEFORE `getToken()` on iOS
- Android doesn't require this registration (handled automatically)

## Related Files

- `src/services/notificationService.ts` - Main fix location
- `ios/Astroself/AppDelegate.swift` - Native iOS configuration (already correct)

