# iOS Firebase Setup Guide - Complete Checklist

## ✅ Required Setup Steps for iOS Firebase Push Notifications

### 1. **GoogleService-Info.plist** ✅
**Location**: `ios/GoogleService-Info.plist`

**Status**: ✅ File exists

**Check**:
- [x] File is in `ios/` folder
- [x] Contains `BUNDLE_ID`: `com.astroself.ai`
- [x] Contains `PROJECT_ID`: `astroself-b6835`
- [x] Contains `GCM_SENDER_ID`: `1061722426474`
- [ ] **IMPORTANT**: File should be added to Xcode project with correct target membership

**How to verify in Xcode**:
1. Open `ios/Astroself.xcworkspace` in Xcode
2. Check if `GoogleService-Info.plist` is in project navigator
3. Select file → Check "Target Membership" → Should be checked for "Astroself" target

---

### 2. **Podfile Configuration** ✅
**Location**: `ios/Podfile`

**Current Status**: 
```ruby
pod 'Firebase/Crashlytics'  # ✅ Present
```

**Required**: Firebase Messaging should be auto-linked via `@react-native-firebase/messaging`

**Check**:
- [x] `use_frameworks! :linkage => :static` is set
- [x] `platform :ios, '15.1'` is set
- [ ] Run `pod install` to ensure Firebase Messaging is installed

**Commands**:
```bash
cd ios
pod install
cd ..
```

---

### 3. **AppDelegate.swift** ✅
**Location**: `ios/Astroself/AppDelegate.swift`

**Status**: ✅ Properly configured

**Check**:
- [x] `import Firebase` ✅
- [x] `import FirebaseMessaging` ✅
- [x] `import UserNotifications` ✅
- [x] `FirebaseApp.configure()` ✅
- [x] `Messaging.messaging().delegate = self` ✅
- [x] `UNUserNotificationCenter.current().delegate = self` ✅
- [x] `application.registerForRemoteNotifications()` ✅
- [x] `didRegisterForRemoteNotificationsWithDeviceToken` ✅
- [x] `MessagingDelegate` methods ✅

---

### 4. **Info.plist** ✅
**Location**: `ios/Astroself/Info.plist`

**Status**: ✅ Properly configured

**Check**:
- [x] `NSUserNotificationsUsageDescription` ✅
- [x] `UIBackgroundModes` with `remote-notification` ✅

**Current Configuration**:
```xml
<key>NSUserNotificationsUsageDescription</key>
<string>This app needs notification permission to send you important updates and alerts.</string>

<key>UIBackgroundModes</key>
<array>
    <string>remote-notification</string>
    <string>background-processing</string>
</array>
```

---

### 5. **Entitlements Files** ✅
**Location**: 
- `ios/Astroself/AstroselfDebug.entitlements`
- `ios/Astroself/AstroselfRelease.entitlements`

**Status**: ✅ Properly configured

**Check**:
- [x] Debug: `aps-environment` = `development` ✅
- [x] Release: `aps-environment` = `production` ✅

---

### 6. **Xcode Project Settings** ⚠️
**IMPORTANT**: These must be checked in Xcode

#### A. **Push Notifications Capability**
1. Open `ios/Astroself.xcworkspace` in Xcode
2. Select project → Target "Astroself"
3. Go to "Signing & Capabilities" tab
4. Click "+ Capability"
5. Add "Push Notifications"
6. Verify it's enabled

#### B. **Background Modes Capability**
1. In same "Signing & Capabilities" tab
2. Add "Background Modes" if not present
3. Check "Remote notifications"

#### C. **Code Signing**
1. Select your Team
2. Bundle Identifier: `com.astroself.ai`
3. Provisioning Profile should have Push Notifications enabled

#### D. **GoogleService-Info.plist Target Membership**
1. Select `GoogleService-Info.plist` in project navigator
2. Check "Target Membership" → "Astroself" should be checked

---

### 7. **Firebase Console Setup** ⚠️
**IMPORTANT**: These must be done in Firebase Console

#### A. **APNs Certificate Upload**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `astroself-b6835`
3. Go to Project Settings → Cloud Messaging
4. Under "Apple app configuration":
   - Upload APNs Authentication Key (recommended) OR
   - Upload APNs Certificate (Development/Production)
5. Bundle ID should match: `com.astroself.ai`

**How to get APNs Key**:
1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Certificates, Identifiers & Profiles → Keys
3. Create new key with "Apple Push Notifications service (APNs)"
4. Download `.p8` file
5. Upload to Firebase Console

#### B. **Verify Bundle ID**
1. Firebase Console → Project Settings → General
2. Under "Your apps" → iOS app
3. Bundle ID should be: `com.astroself.ai`

---

### 8. **Apple Developer Portal Setup** ⚠️
**IMPORTANT**: These must be done in Apple Developer Portal

#### A. **App ID Configuration**
1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Certificates, Identifiers & Profiles → Identifiers
3. Select your App ID: `com.astroself.ai`
4. Enable "Push Notifications" capability
5. Save changes

#### B. **Provisioning Profile**
1. Certificates, Identifiers & Profiles → Profiles
2. Create/Edit provisioning profile for your app
3. Ensure "Push Notifications" is enabled
4. Download and install in Xcode

---

## 🔍 Verification Checklist

### Step 1: Check Pods Installation
```bash
cd ios
pod install
cd ..
```

### Step 2: Check Xcode Project
1. Open `ios/Astroself.xcworkspace` (NOT .xcodeproj)
2. Build project (Cmd+B)
3. Check for any errors

### Step 3: Check Capabilities
In Xcode → Target → Signing & Capabilities:
- [ ] Push Notifications enabled
- [ ] Background Modes enabled
- [ ] Remote notifications checked

### Step 4: Check Entitlements
- [ ] Debug entitlements: `aps-environment` = `development`
- [ ] Release entitlements: `aps-environment` = `production`

### Step 5: Run App and Check Logs
```bash
npx react-native run-ios
```

**Look for in logs**:
- ✅ `FirebaseApp.configure()` called
- ✅ `APNs token registered`
- ✅ `Firebase registration token: ...`
- ✅ `FCM Token Generated: ...`

---

## 🚨 Common Issues & Solutions

### Issue 1: "GoogleService-Info.plist not found"
**Solution**:
1. Ensure file is in `ios/` folder
2. Add to Xcode project: Right-click project → Add Files → Select file
3. Check "Copy items if needed" and "Add to targets: Astroself"

### Issue 2: "Push Notifications capability not enabled"
**Solution**:
1. Xcode → Target → Signing & Capabilities
2. Click "+ Capability" → Add "Push Notifications"
3. Rebuild project

### Issue 3: "APNs certificate not uploaded"
**Solution**:
1. Generate APNs key in Apple Developer Portal
2. Upload to Firebase Console → Project Settings → Cloud Messaging
3. Ensure Bundle ID matches

### Issue 4: "Token not generating"
**Solution**:
1. Check if `registerDeviceForRemoteMessages()` is called
2. Check if permission is granted
3. Check Xcode console for APNs token registration
4. Verify Firebase configuration

### Issue 5: "Notifications not received"
**Solution**:
1. Check server payload structure (must have `notification` field)
2. Verify APNs certificate is uploaded
3. Check device notification settings
4. Verify FCM token is correct

---

## 📝 Quick Setup Commands

```bash
# 1. Install pods
cd ios
pod install
cd ..

# 2. Clean build
cd ios
rm -rf build
rm -rf Pods
rm Podfile.lock
pod install
cd ..

# 3. Run app
npx react-native run-ios

# 4. Check logs
npx react-native log-ios
```

---

## ✅ Final Checklist

Before testing push notifications, ensure:

- [ ] `GoogleService-Info.plist` is in Xcode project
- [ ] Push Notifications capability enabled in Xcode
- [ ] Background Modes capability enabled in Xcode
- [ ] APNs certificate/key uploaded to Firebase Console
- [ ] App ID has Push Notifications enabled in Apple Developer Portal
- [ ] Provisioning profile has Push Notifications enabled
- [ ] Entitlements files are correct (development/production)
- [ ] App builds without errors
- [ ] FCM token is generated in logs
- [ ] APNs token is registered in logs

---

## 🎯 Next Steps

1. **Open Xcode** and verify all capabilities
2. **Check Firebase Console** for APNs certificate
3. **Test on real device** (not simulator for push notifications)
4. **Check logs** for token generation
5. **Send test notification** from Firebase Console

---

## 📚 Additional Resources

- [Firebase iOS Setup](https://firebase.google.com/docs/ios/setup)
- [React Native Firebase Messaging](https://rnfirebase.io/messaging/usage)
- [Apple Push Notifications](https://developer.apple.com/documentation/usernotifications)

