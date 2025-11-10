#!/bin/bash

# Script to help get Play Store signing certificate SHA-1
# This script provides instructions and commands to extract SHA-1

echo "=========================================="
echo "Play Store Certificate SHA-1 Extractor"
echo "=========================================="
echo ""

echo "Method 1: Get SHA-1 from Google Play Console (Easiest)"
echo "--------------------------------------------------------"
echo "1. Go to: https://play.google.com/console"
echo "2. Select your app"
echo "3. Go to: Release → Setup → App signing"
echo "4. Find 'App signing key certificate' section"
echo "5. Copy the SHA-1 certificate fingerprint"
echo ""

echo "Method 2: Extract from Play App Signing Certificate (If you have it)"
echo "----------------------------------------------------------------------"
echo "If you downloaded the Play App Signing certificate (.pem file):"
echo ""
echo "  keytool -list -v -keystore play-app-signing-certificate.pem -alias play"
echo ""

echo "Method 3: Get SHA-1 from your local .jks file (For reference)"
echo "---------------------------------------------------------------"
echo "To see your local release keystore SHA-1:"
echo ""
echo "  keytool -list -v -keystore android/app/release.keystore -alias <your-alias>"
echo ""

echo "Method 4: Extract SHA-1 from installed APK (If downloaded from Play Store)"
echo "---------------------------------------------------------------------------"
echo "If you have an APK downloaded from Play Store:"
echo ""
echo "  # Extract certificate"
echo "  unzip -p app.apk META-INF/*.RSA | keytool -printcert"
echo ""
echo "  # Or using apksigner (Android SDK)"
echo "  apksigner verify --print-certs app.apk"
echo ""

echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo "1. Copy the SHA-1 fingerprint (format: AA:BB:CC:DD:EE:FF:...)"

echo "2. Add it to Firebase Console:"
echo "   - Go to: https://console.firebase.google.com/"
echo "   - Project: astroself-b6835"
echo "   - Settings → Your apps → com.astroself.ai"
echo "   - Click 'Add fingerprint'"
echo "   - Paste SHA-1 and save"

echo "3. Add it to Google Cloud Console:"
echo "   - Go to: https://console.cloud.google.com/"
echo "   - Project: astroself-b6835"
echo "   - APIs & Services → Credentials"
echo "   - Edit OAuth 2.0 Client ID for Android"
echo "   - Add SHA-1 certificate fingerprint"

echo "4. Download updated google-services.json from Firebase"
echo "5. Replace: android/app/google-services.json"
echo "6. Rebuild AAB and upload to Play Store"
echo ""

echo "=========================================="
echo "Current App Configuration:"
echo "=========================================="
echo "Package Name: com.astroself.ai"
echo "Firebase Project: astroself-b6835"
echo "Web Client ID: 1061722426474-3aivdpu11tr8i1h52a54ovkrv8ls021p.apps.googleusercontent.com"
echo ""

