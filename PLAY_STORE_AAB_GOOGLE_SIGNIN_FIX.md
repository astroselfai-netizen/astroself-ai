# Play Store AAB Google Sign-In Fix Guide

## 🚨 Problem
Google Sign-In works with APK but not with AAB (Android App Bundle) uploaded to Play Store.

## 🔍 Root Cause
When you upload an AAB to Google Play Store, Google Play signs it with **their own certificate**, not your local `.jks` file. The SHA-1 fingerprint of this Play Store certificate needs to be added to Firebase Console.

## ✅ Solution Steps

### Step 1: Get Play Store Signing Certificate SHA-1

#### Method 1: From Google Play Console (Recommended)

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app
3. Go to **Release** → **Setup** → **App signing**
4. Scroll down to **App signing key certificate** section
5. Copy the **SHA-1 certificate fingerprint** (it looks like: `AA:BB:CC:DD:EE:FF:...`)
6. Also copy the **SHA-256 certificate fingerprint** (optional but recommended)

#### Method 2: Using Play App Signing Certificate (If you have access)

If you have the Play App Signing certificate, you can extract SHA-1 using:
```bash
keytool -list -v -keystore play-app-signing-certificate.pem -alias play -storepass <password>
```

### Step 2: Add SHA-1 to Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **astroself-b6835**
3. Click on the **gear icon** (⚙️) → **Project settings**
4. Scroll down to **Your apps** section
5. Find your Android app with package name: **com.astroself.ai**
6. Click **Add fingerprint** button
7. Paste the Play Store SHA-1 certificate fingerprint
8. Click **Save**

### Step 3: Add SHA-1 to Google Cloud Console (OAuth Client)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **astroself-b6835**
3. Go to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID for Android (package: `com.astroself.ai`)
5. Click **Edit** (pencil icon)
6. Click **Add SHA-1 certificate fingerprint**
7. Paste the Play Store SHA-1 certificate fingerprint
8. Click **Save**

### Step 4: Download Updated google-services.json

1. Go back to Firebase Console → Project Settings
2. Scroll to **Your apps** → Android app (`com.astroself.ai`)
3. Click **Download google-services.json**
4. Replace the file at: `android/app/google-services.json`

### Step 5: Verify Configuration

After downloading the new `google-services.json`, verify it contains:
- Package name: `com.astroself.ai`
- At least one OAuth client with `certificate_hash` matching your Play Store SHA-1 (without colons)

Example:
```json
{
  "client_id": "1061722426474-xxxxx.apps.googleusercontent.com",
  "client_type": 1,
  "android_info": {
    "package_name": "com.astroself.ai",
    "certificate_hash": "aabbccddeeff..." // Play Store SHA-1 (lowercase, no colons)
  }
}
```

### Step 6: Rebuild and Test

1. Clean your project:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   ```

2. Build a new AAB:
   ```bash
   cd android
   ./gradlew bundleRelease
   ```

3. Upload the new AAB to Play Store Internal Testing track
4. Test Google Sign-In with the downloaded app from Play Store

## 📝 Important Notes

1. **Keep Both Certificates**: You should have SHA-1 fingerprints for:
   - Your local `.jks` file (for local APK testing)
   - Play Store signing certificate (for AAB from Play Store)

2. **Package Name**: Make sure you're adding SHA-1 to the correct package name:
   - Current package: `com.astroself.ai`
   - Not: `com.astroself` (old package name)

3. **Web Client ID**: The `webClientId` in `googleAuthService.ts` should remain the same (it's the Web client, not Android client).

4. **Testing**: Always test with an app downloaded from Play Store, not a locally installed APK, because they use different certificates.

## 🔧 Current Configuration

- **Package Name**: `com.astroself.ai`
- **Web Client ID**: `1061722426474-3aivdpu11tr8i1h52a54ovkrv8ls021p.apps.googleusercontent.com`
- **Firebase Project**: `astroself-b6835`
- **Project Number**: `1061722426474`

## 🆘 Troubleshooting

### Issue: Still not working after adding SHA-1

1. **Wait 5-10 minutes** after adding SHA-1 (Firebase needs time to propagate)
2. **Verify** the SHA-1 was added correctly (no extra spaces, correct format)
3. **Check** you downloaded the updated `google-services.json` after adding SHA-1
4. **Ensure** you're testing with an app downloaded from Play Store, not a local APK

### Issue: Can't find App Signing section in Play Console

- Make sure you've uploaded at least one AAB to Play Store
- The App Signing section appears after the first upload

### Issue: Multiple SHA-1 fingerprints

- You can add multiple SHA-1 fingerprints in Firebase Console
- This allows both local APK and Play Store AAB to work
- Keep all your SHA-1 fingerprints (debug, release, Play Store)

## 📚 Additional Resources

- [Firebase Android Setup](https://firebase.google.com/docs/android/setup)
- [Google Sign-In for Android](https://developers.google.com/identity/sign-in/android/start)
- [Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756)

