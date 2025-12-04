# Background/Quit State Push Notification Fix

## Issues Fixed

### 1. ✅ Background Message Handler
**Problem**: Background handler was being registered in `notificationService.ts` inside a method, which doesn't work for background/quit state.

**Fix**: 
- Removed duplicate background handler from `notificationService.ts`
- Background handler is correctly registered in `index.js` at the top level
- Added better logging for debugging

### 2. ✅ Android Notification Channel
**Problem**: Android 8.0+ requires a notification channel to display notifications, but it wasn't being created.

**Fix**:
- Added notification channel creation in `MainApplication.kt`
- Channel is created automatically when app starts
- Channel ID: `"default"` (Firebase will use this automatically)

### 3. ✅ Firebase Messaging Dependency
**Problem**: Firebase Messaging dependency wasn't explicitly declared in `build.gradle`.

**Fix**:
- Added `implementation 'com.google.firebase:firebase-messaging'` to `build.gradle`

## Files Modified

1. **`src/services/notificationService.ts`**
   - Removed duplicate background handler registration
   - Added comments explaining why background handler must be in index.js

2. **`android/app/src/main/java/com/astroself/ai/MainApplication.kt`**
   - Added `createNotificationChannel()` method
   - Creates notification channel on app startup

3. **`android/app/build.gradle`**
   - Added Firebase Messaging dependency

4. **`index.js`**
   - Improved background handler logging

5. **`src/utils/notificationUtils.ts`**
   - Updated comments about notification channel creation

## Next Steps - Server Side

⚠️ **IMPORTANT**: The most common reason notifications don't work in background/quit state is **incorrect server payload structure**.

### Check Your Server Payload

Your server MUST send notifications with this structure:

```json
{
  "to": "FCM_TOKEN",
  "notification": {
    "title": "Title",
    "body": "Body"
  },
  "data": {
    "screen": "HomeScreen",
    "customData": "value"
  },
  "priority": "high"
}
```

**Key Points:**
- ✅ **MUST have `notification` field** - This makes the OS show notification in tray
- ✅ **MUST have `data` field** - This allows app to navigate when user taps
- ✅ **MUST set `priority: "high"`** - Ensures reliable delivery

See `PUSH_NOTIFICATION_SERVER_PAYLOAD.md` for complete details.

## Testing

1. **Rebuild the app**:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   npx react-native run-android
   ```

2. **Test scenarios**:
   - ✅ App in foreground - should receive via `onMessage`
   - ✅ App in background - should show in notification tray
   - ✅ App quit/killed - should show in notification tray
   - ✅ Tap notification - should open app and navigate

3. **Check logs**:
   - Look for: `📱 Background message received:` in logs
   - Look for: `📱 Notification opened app from background state:`
   - Look for: `Notification caused app to open from quit state:`

## Common Issues

### Still not working?

1. **Check server payload** - Most common issue!
   - Does it have `notification` field?
   - Does it have `data` field?
   - Is `priority` set to `high`?

2. **Check permissions**:
   - Android 13+: App needs `POST_NOTIFICATIONS` permission
   - iOS: App needs notification permission

3. **Check FCM token**:
   - Is token valid?
   - Is token sent to server correctly?

4. **Check Firebase setup**:
   - Is `google-services.json` in `android/app/`?
   - Is Firebase project configured correctly?

5. **Rebuild app**:
   - Clean build: `cd android && ./gradlew clean && cd ..`
   - Rebuild: `npx react-native run-android`

## How It Works Now

1. **Foreground**: `onMessage` handler in `notificationService.ts`
2. **Background**: System shows notification → User taps → `onNotificationOpenedApp` handler
3. **Quit**: System shows notification → User taps → App starts → `getInitialNotification()` returns notification

All handlers are properly set up and will log to console for debugging.

