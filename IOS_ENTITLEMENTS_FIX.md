# iOS Entitlements Fix - "aps-environment" Error

## 🚨 Error
```
[messaging/unknown] no valid "aps-environment" entitlement string found for application
```

## ✅ Solution: Xcode में Entitlements Configure करें

### Step 1: Xcode Project खोलें
```bash
open ios/Astroself.xcworkspace
```
**Important**: `.xcworkspace` खोलें, `.xcodeproj` नहीं!

---

### Step 2: Build Settings में Entitlements Set करें

1. **Project Navigator** में project select करें (top पर "Astroself")
2. **Target "Astroself"** select करें
3. **Build Settings** tab पर जाएं
4. Search bar में "Code Signing Entitlements" type करें
5. **CODE_SIGN_ENTITLEMENTS** setting find करें

**Debug Configuration के लिए**:
- **Debug** configuration select करें (dropdown से)
- **CODE_SIGN_ENTITLEMENTS** value set करें:
  ```
  Astroself/AstroselfDebug.entitlements
  ```

**Release Configuration के लिए**:
- **Release** configuration select करें (dropdown से)
- **CODE_SIGN_ENTITLEMENTS** value set करें:
  ```
  Astroself/AstroselfRelease.entitlements
  ```

---

### Step 3: Entitlements Files को Project में Add करें (अगर नहीं हैं)

1. **Project Navigator** में right-click करें
2. **Add Files to "Astroself"...** select करें
3. Navigate करें: `ios/Astroself/AstroselfDebug.entitlements`
4. Select करें और **Add** click करें
5. **"Copy items if needed"** check करें
6. **"Add to targets: Astroself"** check करें
7. Same process `AstroselfRelease.entitlements` के लिए repeat करें

---

### Step 4: Signing & Capabilities में Push Notifications Add करें

1. **Target "Astroself"** select करें
2. **Signing & Capabilities** tab पर जाएं
3. **+ Capability** button click करें
4. **Push Notifications** search करें और add करें
5. Verify करें कि Push Notifications capability visible है

---

### Step 5: Background Modes Add करें

1. Same **Signing & Capabilities** tab में
2. **+ Capability** button click करें
3. **Background Modes** search करें और add करें
4. **Remote notifications** checkbox check करें

---

### Step 6: Verify Entitlements Files Content

**AstroselfDebug.entitlements** में होना चाहिए:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>aps-environment</key>
	<string>development</string>
</dict>
</plist>
```

**AstroselfRelease.entitlements** में होना चाहिए:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>aps-environment</key>
	<string>production</string>
</dict>
</plist>
```

---

### Step 7: Clean Build करें

1. **Product** → **Clean Build Folder** (Shift + Cmd + K)
2. **Product** → **Build** (Cmd + B)
3. Errors check करें

---

### Step 8: Verify करें

Build successful होने के बाद, app run करें:
```bash
npx react-native run-ios
```

Logs में check करें:
- ✅ `✅ iOS device registered for remote messages` (error नहीं आना चाहिए)
- ✅ `APNs token registered`
- ✅ `FCM Token Generated`

---

## 🔍 Quick Verification Checklist

- [ ] Entitlements files project में हैं
- [ ] Build Settings में CODE_SIGN_ENTITLEMENTS set है
- [ ] Debug: `Astroself/AstroselfDebug.entitlements`
- [ ] Release: `Astroself/AstroselfRelease.entitlements`
- [ ] Signing & Capabilities में Push Notifications है
- [ ] Signing & Capabilities में Background Modes है
- [ ] Remote notifications checked है
- [ ] Clean build successful है

---

## 🚨 अगर अभी भी Error आ रहा है

### Option 1: Manual Entitlements Add करें

1. Xcode → Target → Signing & Capabilities
2. **+ Capability** → **Push Notifications** add करें
3. Xcode automatically entitlements file में `aps-environment` add कर देगा

### Option 2: Info.plist में Check करें

`Info.plist` में verify करें:
```xml
<key>UIBackgroundModes</key>
<array>
    <string>remote-notification</string>
</array>
```

### Option 3: Provisioning Profile Check करें

1. Apple Developer Portal जाएं
2. Your App ID (`com.astroself.ai`) select करें
3. **Push Notifications** capability enabled है verify करें
4. New provisioning profile generate करें
5. Xcode में download करें

---

## 📝 Screenshots Guide (Visual Steps)

### Build Settings में Entitlements:
```
1. Project → Target "Astroself"
2. Build Settings tab
3. Search: "Code Signing Entitlements"
4. Debug: Astroself/AstroselfDebug.entitlements
5. Release: Astroself/AstroselfRelease.entitlements
```

### Signing & Capabilities:
```
1. Target "Astroself"
2. Signing & Capabilities tab
3. + Capability → Push Notifications
4. + Capability → Background Modes
5. Check "Remote notifications"
```

---

## ✅ Final Steps

1. Xcode में entitlements configure करें (ऊपर steps follow करें)
2. Clean build करें
3. App run करें
4. Error check करें - अब error नहीं आना चाहिए

---

## 🎯 Expected Result

After fixing, you should see:
- ✅ No "aps-environment" error
- ✅ `registerDeviceForRemoteMessages()` successful
- ✅ FCM token generated
- ✅ Push notifications working

