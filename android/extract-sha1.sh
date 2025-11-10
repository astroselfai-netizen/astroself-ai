#!/bin/bash

# Script to extract SHA-1 from releaes.jks keystore
# Alias found: key0

echo "=========================================="
echo "Extracting SHA-1 from releaes.jks"
echo "=========================================="
echo ""
echo "Keystore: android/releaes.jks"
echo "Alias: key0"
echo ""
echo "Please enter your keystore password when prompted:"
echo ""

keytool -list -v -keystore android/releaes.jks -alias key0

echo ""
echo "=========================================="
echo "To extract only SHA-1 (without password prompt):"
echo "=========================================="
echo ""
echo "keytool -list -v -keystore android/releaes.jks -alias key0 -storepass <YOUR_PASSWORD> | grep SHA1"
echo ""

