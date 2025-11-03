#!/bin/bash

# Build script for Astroself Android app
# This script handles the package name mismatch issue

echo "🚀 Building Astroself Android App..."

# Clean build directory
echo "🧹 Cleaning build directory..."
rm -rf android/app/build

# Build the app first (this will generate the autolinking file)
echo "📱 Building app..."
cd android && ./gradlew assembleDebug

# Fix autolinking package name after generation
echo "🔧 Fixing autolinking package name..."
cd ..
AUTOLINKING_FILE="android/app/build/generated/autolinking/src/main/java/com/facebook/react/ReactNativeApplicationEntryPoint.java"

if [ -f "$AUTOLINKING_FILE" ]; then
    echo "🔧 Fixing autolinking package name..."
    sed -i '' 's/com\.astroself\.BuildConfig/com.astroself.ai.BuildConfig/g' "$AUTOLINKING_FILE"
    echo "✅ Autolinking file fixed!"
else
    echo "⚠️  Autolinking file not found. It will be generated during build."
fi

# Install the app
echo "📱 Installing app..."
npx react-native run-android

echo "✅ Build complete!"
