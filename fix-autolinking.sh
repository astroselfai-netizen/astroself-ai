#!/bin/bash

# Script to fix React Native autolinking package name mismatch
# This script should be run before building the Android app

AUTOLINKING_FILE="android/app/build/generated/autolinking/src/main/java/com/facebook/react/ReactNativeApplicationEntryPoint.java"

if [ -f "$AUTOLINKING_FILE" ]; then
    echo "🔧 Fixing autolinking package name..."
    sed -i '' 's/com\.astroself\.BuildConfig/com.astroself.ai.BuildConfig/g' "$AUTOLINKING_FILE"
    echo "✅ Autolinking file fixed!"
else
    echo "⚠️  Autolinking file not found. It will be generated during build."
fi
