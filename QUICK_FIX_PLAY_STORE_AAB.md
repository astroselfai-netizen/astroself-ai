# Quick Fix: Play Store AAB Google Sign-In

## 🎯 Problem
Google Sign-In works with APK but fails with AAB from Play Store.

## ⚡ Quick Solution (5 Steps)

### 1️⃣ Get Play Store SHA-1
- Go to: [Play Console](https://play.google.com/console) → Your App → **Release** → **Setup** → **App signing**
- Copy **SHA-1 certificate fingerprint** from "App signing key certificate" section

### 2️⃣ Add to Firebase
- Go to: [Firebase Console](https://console.firebase.google.com/) → Project: **astroself-b6835**
- **Settings** (⚙️) → **Your apps** → Android app: **com.astroself.ai**
- Click **Add fingerprint** → Paste SHA-1 → **Save**

### 3️⃣ Add to Google Cloud Console
- Go to: [Google Cloud Console](https://console.cloud.google.com/) → Project: **astroself-b6835**
- **APIs & Services** → **Credentials**
- Edit OAuth 2.0 Client ID (Android, package: `com.astroself.ai`)
- **Add SHA-1 certificate fingerprint** → Paste SHA-1 → **Save**

### 4️⃣ Download Updated google-services.json
- Firebase Console → **Settings** → **Your apps** → **com.astroself.ai**
- Click **Download google-services.json**
- Replace: `android/app/google-services.json`

### 5️⃣ Rebuild & Test
```bash
cd android
./gradlew clean
./gradlew bundleRelease
```
- Upload new AAB to Play Store
- Test with app downloaded from Play Store (not local APK)

## ⏱️ Wait Time
After adding SHA-1, wait **5-10 minutes** for Firebase to propagate changes.

## ✅ Verification
New `google-services.json` should contain an OAuth client with:
- `package_name`: `com.astroself.ai`
- `certificate_hash`: Play Store SHA-1 (lowercase, no colons)

## 📋 Current Config
- **Package**: `com.astroself.ai`
- **Web Client ID**: `1061722426474-3aivdpu11tr8i1h52a54ovkrv8ls021p.apps.googleusercontent.com`
- **Firebase Project**: `astroself-b6835`

---
📖 **Detailed Guide**: See `PLAY_STORE_AAB_GOOGLE_SIGNIN_FIX.md`

