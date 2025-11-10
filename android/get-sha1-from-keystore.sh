#!/bin/bash

# Script to extract SHA-1 fingerprint from release keystore
# Usage: ./get-sha1-from-keystore.sh

echo "=========================================="
echo "Extracting SHA-1 from Release Keystore"
echo "=========================================="
echo ""

KEYSTORE_FILE="releaes.jks"
KEYSTORE_PATH="android/$KEYSTORE_FILE"

if [ ! -f "$KEYSTORE_PATH" ]; then
    echo "❌ Error: Keystore file not found at: $KEYSTORE_PATH"
    exit 1
fi

echo "📁 Keystore file: $KEYSTORE_PATH"
echo ""

# Try to extract SHA-1 with common aliases
ALIASES=("astroself-key" "key0" "my-key-alias" "androidreleasekey" "release")

echo "Attempting to extract SHA-1..."
echo ""

for alias in "${ALIASES[@]}"; do
    echo "Trying alias: $alias"
    echo "Command: keytool -list -v -keystore $KEYSTORE_PATH -alias $alias"
    echo ""
    echo "Please enter keystore password when prompted:"
    echo ""
    
    keytool -list -v -keystore "$KEYSTORE_PATH" -alias "$alias" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Success! Found alias: $alias"
        echo ""
        echo "=========================================="
        echo "SHA-1 Fingerprint (copy this):"
        echo "=========================================="
        keytool -list -v -keystore "$KEYSTORE_PATH" -alias "$alias" 2>/dev/null | grep -A 1 "SHA1:" | grep -o "[0-9A-F:]\{47\}"
        echo ""
        echo "=========================================="
        echo "SHA-256 Fingerprint (optional):"
        echo "=========================================="
        keytool -list -v -keystore "$KEYSTORE_PATH" -alias "$alias" 2>/dev/null | grep -A 1 "SHA256:" | grep -o "[0-9A-F:]\{95\}"
        echo ""
        exit 0
    fi
done

echo ""
echo "❌ Could not extract with common aliases."
echo ""
echo "Please run manually with your keystore alias:"
echo ""
echo "  keytool -list -v -keystore android/releaes.jks -alias <YOUR_ALIAS>"
echo ""
echo "Or to list all aliases in the keystore:"
echo ""
echo "  keytool -list -keystore android/releaes.jks"
echo ""

