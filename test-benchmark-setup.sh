#!/bin/bash

echo "🔍 Checking Benchmark Setup..."
echo ""

# Check if in correct directory
if [ ! -d "android" ]; then
    echo "❌ Error: android/ directory not found"
    echo "   Run this script from project root: /Users/nikul/Documents/mobify/Astroself"
    exit 1
fi

cd android

echo "✅ 1. Checking benchmark module..."
if [ -d "benchmark" ]; then
    echo "   ✓ Benchmark module exists"
else
    echo "   ❌ Benchmark module not found"
    exit 1
fi

echo ""
echo "✅ 2. Checking AndroidManifest.xml..."
if grep -q "android:profileable=\"true\"" app/src/main/AndroidManifest.xml; then
    echo "   ✓ android:profileable=\"true\" found"
else
    echo "   ❌ android:profileable=\"true\" missing in AndroidManifest.xml"
    exit 1
fi

echo ""
echo "✅ 3. Checking build.gradle..."
if grep -q "benchmark" app/build.gradle; then
    echo "   ✓ Benchmark build type found"
else
    echo "   ❌ Benchmark build type missing in app/build.gradle"
    exit 1
fi

echo ""
echo "✅ 4. Checking settings.gradle..."
if grep -q ":benchmark" settings.gradle; then
    echo "   ✓ Benchmark module included in settings.gradle"
else
    echo "   ❌ Benchmark module not included in settings.gradle"
    exit 1
fi

echo ""
echo "✅ 5. Checking benchmark test files..."
if [ -f "benchmark/src/androidTest/kotlin/com/astroself/ai/benchmark/StartupBenchmark.kt" ]; then
    echo "   ✓ StartupBenchmark.kt found"
else
    echo "   ❌ StartupBenchmark.kt not found"
    exit 1
fi

if [ -f "benchmark/src/androidTest/kotlin/com/astroself/ai/benchmark/ScrollBenchmark.kt" ]; then
    echo "   ✓ ScrollBenchmark.kt found"
else
    echo "   ❌ ScrollBenchmark.kt not found"
    exit 1
fi

echo ""
echo "✅ 6. Checking connected devices..."
if command -v adb &> /dev/null; then
    DEVICES=$(adb devices | grep -v "List" | grep "device$" | wc -l | tr -d ' ')
    if [ "$DEVICES" -gt 0 ]; then
        echo "   ✓ $DEVICES device(s) connected"
        adb devices | grep "device$"
    else
        echo "   ⚠️  No devices connected (connect physical device for testing)"
    fi
else
    echo "   ⚠️  adb not found (install Android SDK platform-tools)"
fi

echo ""
echo "🎉 Setup looks good!"
echo ""
echo "📋 Next Steps:"
echo "   1. Open Android Studio"
echo "   2. Sync Project with Gradle Files"
echo "   3. Connect physical Android device"
echo "   4. Run StartupBenchmark.kt from Android Studio"
echo ""
echo "📖 Full guide: BENCHMARK_TESTING_GUIDE.md"

