# 🚀 Benchmark Test Run Commands

## ⚠️ Important: zsh Shell Issue

zsh me `#` character comment ke liye use hota hai, isliye command ko **quotes** me wrap karna padta hai.

## ✅ Correct Commands

### Run All Tests
```bash
cd android

./gradlew :benchmark:connectedDebugAndroidTest \
  -Pandroid.testInstrumentationRunnerArguments.class=com.astroself.ai.benchmark.StartupBenchmark
```

### Run Single Test (with quotes)
```bash
cd android

# coldStartup
./gradlew :benchmark:connectedDebugAndroidTest \
  "-Pandroid.testInstrumentationRunnerArguments.class=com.astroself.ai.benchmark.StartupBenchmark#coldStartup"

# warmStartup
./gradlew :benchmark:connectedDebugAndroidTest \
  "-Pandroid.testInstrumentationRunnerArguments.class=com.astroself.ai.benchmark.StartupBenchmark#warmStartup"

# hotStartup
./gradlew :benchmark:connectedDebugAndroidTest \
  "-Pandroid.testInstrumentationRunnerArguments.class=com.astroself.ai.benchmark.StartupBenchmark#hotStartup"
```

## 🔧 Alternative: Use Single Line (No Backslash)

```bash
cd android

# All tests
./gradlew :benchmark:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.astroself.ai.benchmark.StartupBenchmark

# Single test (with quotes)
./gradlew :benchmark:connectedDebugAndroidTest "-Pandroid.testInstrumentationRunnerArguments.class=com.astroself.ai.benchmark.StartupBenchmark#hotStartup"
```

## 📝 Quick Reference

**Wrong (zsh error):**
```bash
./gradlew :benchmark:connectedDebugAndroidTest \
  -Pandroid.testInstrumentationRunnerArguments.class=com.astroself.ai.benchmark.StartupBenchmark#hotStartup
```

**Correct (with quotes):**
```bash
./gradlew :benchmark:connectedDebugAndroidTest \
  "-Pandroid.testInstrumentationRunnerArguments.class=com.astroself.ai.benchmark.StartupBenchmark#hotStartup"
```

## 🎯 One-Liner Commands

```bash
# All tests
cd android && ./gradlew :benchmark:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.astroself.ai.benchmark.StartupBenchmark

# hotStartup only
cd android && ./gradlew :benchmark:connectedDebugAndroidTest "-Pandroid.testInstrumentationRunnerArguments.class=com.astroself.ai.benchmark.StartupBenchmark#hotStartup"
```

---

**Remember:** zsh me `#` ke saath commands ko **quotes** me wrap karo! ✅

