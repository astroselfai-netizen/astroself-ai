# 🚀 Android Macrobenchmark Testing Guide

## ✅ Prerequisites

1. **Physical Android Device** (Emulator ❌ nahi chalega)
   - USB Debugging ON
   - Developer Options enabled
   - Minimum Android 7.0 (API 24+)

2. **Android Studio** (Latest version recommended)

---

## 📋 Step-by-Step Testing

### Step 1: Android Studio Sync

1. Android Studio kholo
2. Project open karo: `/Users/nikul/Documents/mobify/Astroself/android`
3. **File → Sync Project with Gradle Files** (ya top bar me sync icon)
4. Wait karo - dependencies download hongi

### Step 2: Device Connect

1. Physical Android phone USB se connect karo
2. USB Debugging ON hona chahiye
3. Android Studio me device dikhna chahiye (top bar me device name)

**Check karne ke liye:**
```bash
adb devices
```
Device list me dikhna chahiye.

### Step 3: Build Benchmark APK

1. Android Studio me **Build → Make Project** (Ctrl+F9 / Cmd+F9)
2. Ya terminal me:
```bash
cd android
./gradlew :benchmark:assembleBenchmark
```

### Step 4: Run Startup Benchmark

**Method 1: Android Studio GUI (Easiest)**

1. Left panel me expand karo:
   ```
   benchmark/
     └── src/
         └── androidTest/
             └── kotlin/
                 └── com/
                     └── astroself/
                         └── ai/
                             └── benchmark/
                                 ├── StartupBenchmark.kt  ← Yaha
                                 └── ScrollBenchmark.kt
   ```

2. `StartupBenchmark.kt` file kholo

3. File me koi bhi test function ke left side **green ▶️** button dikhega:
   - `coldStartup()` ke paas
   - `warmStartup()` ke paas
   - `hotStartup()` ke paas

4. **Right-click** on test function name → **Run 'coldStartup()'**

   Ya directly **green ▶️** button click karo

**Method 2: Terminal (Command Line)**

**Step 1: Setup (build app + test APK)**
```bash
cd android
./gradlew :benchmark:connectedBenchmarkAndroidTest
```
Ye command app ko benchmark build type me build karega aur test APK install karega.

**Step 2: Run Tests**

**Option A: Using connectedDebugAndroidTest (Recommended)**
```bash
# Single test run
./gradlew :benchmark:connectedDebugAndroidTest \
  -Pandroid.testInstrumentationRunnerArguments.class=com.astroself.ai.benchmark.StartupBenchmark#coldStartup

# All startup tests
./gradlew :benchmark:connectedDebugAndroidTest \
  -Pandroid.testInstrumentationRunnerArguments.class=com.astroself.ai.benchmark.StartupBenchmark

# All scroll tests
./gradlew :benchmark:connectedDebugAndroidTest \
  -Pandroid.testInstrumentationRunnerArguments.class=com.astroself.ai.benchmark.ScrollBenchmark
```

**Option B: Using ADB directly**
```bash
# Single test
adb shell am instrument -w \
  -e class com.astroself.ai.benchmark.StartupBenchmark#coldStartup \
  com.astroself.ai.benchmark.test/androidx.test.runner.AndroidJUnitRunner

# All tests in class
adb shell am instrument -w \
  -e class com.astroself.ai.benchmark.StartupBenchmark \
  com.astroself.ai.benchmark.test/androidx.test.runner.AndroidJUnitRunner
```

### Step 5: View Results

**Android Studio Run Console me:**

```
StartupTimingMetric:
  min = 412 ms
  median = 445 ms
  max = 480 ms
```

**Detailed Report:**
- Bottom panel → **Run** tab
- Ya **View → Tool Windows → Run**

---

## 🎯 What Each Test Does

### StartupBenchmark

1. **coldStartup()** - App completely closed se launch
2. **warmStartup()** - App background me ho, phir launch
3. **hotStartup()** - App already memory me ho, phir launch

### ScrollBenchmark

1. **scrollPerformance()** - General scroll performance
2. **listScrollPerformance()** - FlatList/ScrollView specific

---

## ⚠️ Troubleshooting

### Error: "Benchmark module not found"
```bash
cd android
./gradlew :benchmark:assembleBenchmark
```

### Error: "No devices found"
1. USB Debugging check karo
2. `adb devices` run karo
3. Device authorize karo (phone pe popup aayega)

### Error: "android:profileable not found"
- `android/app/src/main/AndroidManifest.xml` check karo
- Line 19 pe `android:profileable="true"` hona chahiye

### Error: "Build failed"
```bash
cd android
./gradlew clean
./gradlew :benchmark:assembleBenchmark
```

### Test runs but no results
- Physical device use karo (emulator ❌)
- Release build type check karo
- Wait karo - tests 5 iterations chalti hain (2-3 min lag sakta hai)

---

## 📊 Understanding Results

### StartupTimingMetric
- **min**: Best case startup time
- **median**: Average startup time (most reliable)
- **max**: Worst case startup time

**Good Performance:**
- Cold: < 500ms
- Warm: < 300ms
- Hot: < 200ms

### FrameTimingMetric (Scroll)
- **Frame time**: Time per frame (lower = better)
- **Jank**: Frames > 16ms (should be < 5%)

---

## 🚀 Quick Test Commands

```bash
# All benchmarks run karo
cd android
./gradlew :benchmark:connectedBenchmarkAndroidTest

# Specific test
./gradlew :benchmark:connectedBenchmarkAndroidTest \
  -Pandroid.testInstrumentationRunnerArguments.class=com.astroself.ai.benchmark.StartupBenchmark#coldStartup
```

---

## ✅ Success Checklist

- [ ] Android Studio sync ho gaya
- [ ] Physical device connected hai
- [ ] Benchmark module build ho gaya
- [ ] Test run ho raha hai
- [ ] Results console me dikh rahe hain

---

## 📝 Notes

- **First run slow hoga** (app install + compilation)
- **5 iterations** automatically chalti hain
- **Results** console me automatically aayenge
- **No manual intervention** needed - fully automatic!

---

**Agar koi issue aaye to batao! 🚀**

