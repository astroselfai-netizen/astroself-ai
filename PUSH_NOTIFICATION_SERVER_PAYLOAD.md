# Push Notification Server Payload Guide

## Important: Correct Payload Structure for Background/Quit State

For push notifications to work when the app is in **background** or **quit** state, your server MUST send the notification with the correct structure.

## ✅ Correct Payload Structure

### Option 1: Notification + Data (Recommended)
This will show a notification in the system tray AND allow the app to handle it:

```json
{
  "to": "FCM_TOKEN_HERE",
  "notification": {
    "title": "Notification Title",
    "body": "Notification body text",
    "sound": "default",
    "badge": "1"
  },
  "data": {
    "screen": "HomeScreen",
    "userId": "123",
    "action": "view_profile",
    "customData": "any custom data"
  },
  "priority": "high",
  "android": {
    "priority": "high"
  },
  "apns": {
    "headers": {
      "apns-priority": "10"
    },
    "payload": {
      "aps": {
        "sound": "default",
        "badge": 1
      }
    }
  }
}
```

### Option 2: Data-Only Message (For Silent Notifications)
If you only want to send data without showing a notification:

```json
{
  "to": "FCM_TOKEN_HERE",
  "data": {
    "title": "Silent Notification",
    "body": "This won't show in tray",
    "screen": "HomeScreen",
    "userId": "123"
  },
  "priority": "high"
}
```

## ❌ Common Mistakes

### Wrong: Missing `notification` field
```json
{
  "to": "FCM_TOKEN_HERE",
  "data": {
    "title": "This won't show in background!",
    "body": "Missing notification field"
  }
}
```
**Problem**: Without the `notification` field, Android/iOS won't show a notification in the tray when app is backgrounded/quit.

### Wrong: Only `notification` without `data`
```json
{
  "to": "FCM_TOKEN_HERE",
  "notification": {
    "title": "Title",
    "body": "Body"
  }
}
```
**Problem**: App can't access custom data for navigation when user taps notification.

## How It Works

1. **App in Foreground**: 
   - `onMessage` handler receives the notification
   - You can show custom UI

2. **App in Background**:
   - System shows notification in tray (if `notification` field exists)
   - When user taps: `onNotificationOpenedApp` is called
   - App can read `data` field for navigation

3. **App Quit/Killed**:
   - System shows notification in tray (if `notification` field exists)
   - When user taps: App starts → `getInitialNotification()` returns the notification
   - App can read `data` field for navigation

## Testing

### Using Firebase Console
1. Go to Firebase Console → Cloud Messaging
2. Send test notification
3. Make sure to include both `notification` and `data` fields

### Using cURL
```bash
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: key=YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "FCM_TOKEN_HERE",
    "notification": {
      "title": "Test Notification",
      "body": "Testing background notifications"
    },
    "data": {
      "screen": "HomeScreen",
      "test": "true"
    },
    "priority": "high"
  }'
```

### Using Node.js
```javascript
const admin = require('firebase-admin');

const message = {
  notification: {
    title: 'Test Notification',
    body: 'Testing background notifications',
  },
  data: {
    screen: 'HomeScreen',
    test: 'true',
  },
  token: 'FCM_TOKEN_HERE',
  android: {
    priority: 'high',
  },
  apns: {
    headers: {
      'apns-priority': '10',
    },
  },
};

admin.messaging().send(message)
  .then((response) => {
    console.log('Successfully sent message:', response);
  })
  .catch((error) => {
    console.log('Error sending message:', error);
  });
```

## Key Points

1. ✅ **Always include `notification` field** for background/quit state
2. ✅ **Always include `data` field** for app navigation
3. ✅ **Set `priority: "high"`** for reliable delivery
4. ✅ **Use both fields together** for best experience
5. ❌ **Don't send only `data`** if you want notification in tray
6. ❌ **Don't send only `notification`** if you need custom navigation

## Troubleshooting

### Notifications not showing in background/quit state?
- ✅ Check if payload has `notification` field
- ✅ Check if `priority` is set to `high`
- ✅ Verify FCM token is correct
- ✅ Check Android notification channel is created (done in MainApplication.kt)
- ✅ Check app has notification permissions

### App not navigating when notification is tapped?
- ✅ Check if payload has `data` field
- ✅ Verify `onNotificationOpenedApp` or `getInitialNotification` is working
- ✅ Check logs for notification data

### Notifications work in foreground but not background?
- ✅ This is usually a payload structure issue
- ✅ Make sure `notification` field is present
- ✅ Verify server is sending correct format

