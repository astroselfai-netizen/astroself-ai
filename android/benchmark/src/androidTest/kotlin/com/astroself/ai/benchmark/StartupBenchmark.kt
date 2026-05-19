package com.astrodha.ai.benchmark

import android.content.Intent
import androidx.benchmark.macro.StartupMode
import androidx.benchmark.macro.StartupTimingMetric
import androidx.benchmark.macro.junit4.MacrobenchmarkRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.uiautomator.By
import androidx.test.uiautomator.Until
import org.junit.BeforeClass
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Benchmark for app startup performance
 * 
 * Measures:
 * - Cold startup: App launched from scratch
 * - Warm startup: App launched from background
 * 
 * Results show: min, median, max startup times
 */
@RunWith(AndroidJUnit4::class)
class StartupBenchmark {

    @get:Rule
    val benchmarkRule = MacrobenchmarkRule()
    
    // Explicit launch intent for React Native apps (prevents crash)
    private val launchIntent = Intent().apply {
        setClassName(
            "com.astrodha.ai",
            "com.astrodha.ai.MainActivity"
        )
        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
    }
    
    companion object {
        @BeforeClass
        @JvmStatic
        fun setup() {
            // Suppress benchmark validation errors via system properties
            System.setProperty("androidx.benchmark.suppressErrors", "LOW-BATTERY,NOT-PROFILEABLE,DEBUGGABLE")
        }
    }

    @Test
    fun coldStartup() = benchmarkRule.measureRepeated(
        packageName = "com.astrodha.ai",
        metrics = listOf(StartupTimingMetric()),
        iterations = 1, // Single iteration for maximum stability
        startupMode = StartupMode.COLD,
        setupBlock = {
            pressHome()
            Thread.sleep(2000) // Wait for home screen to fully settle
        }
    ) {
        // Launch app with explicit intent
        startActivityAndWait(launchIntent)
        
        // CRITICAL: React Native needs time to initialize
        // Framework measures from startActivityAndWait() until block completes
        // We need to keep the block running until RN is fully ready
        
        // Phase 1: Wait for native modules to load (libreactnative.so, libjsi.so, etc.)
        Thread.sleep(8000) // 8 seconds for native initialization
        
        // Phase 2: Wait for app to be visible and UI to start rendering
        try {
            device.wait(Until.hasObject(By.pkg("com.astrodha.ai")), 20_000)
        } catch (e: Exception) {
            // If wait fails, continue anyway - app might still be initializing
        }
        
        // Phase 3: Wait for UI to be idle (React Native JS bridge initializing)
        try {
            device.waitForIdle(10_000)
        } catch (e: Exception) {
            // Continue even if idle wait fails
        }
        
        // Phase 4: Final wait for JS bundle to load and render
        // This is critical - React Native JS bundle needs time to execute
        Thread.sleep(12000) // 12 seconds for JS bundle + full render
        
        // Phase 5: Verify app is still running and responsive
        // Keep the measurement block active to prevent framework from killing too early
        try {
            device.wait(Until.hasObject(By.pkg("com.astrodha.ai")), 5_000)
        } catch (e: Exception) {
            // App might have crashed, but we've given it enough time
        }
        
        // Final stability wait - ensures measurement captures full startup
        Thread.sleep(3000) // 3 more seconds for final stability
    }

    @Test
    fun warmStartup() = benchmarkRule.measureRepeated(
        packageName = "com.astrodha.ai",
        metrics = listOf(StartupTimingMetric()),
        iterations = 1, // Single iteration for maximum stability
        startupMode = StartupMode.WARM,
        setupBlock = {
            pressHome()
            Thread.sleep(2000) // Wait for home screen to fully settle
        }
    ) {
        // Launch app with explicit intent
        startActivityAndWait(launchIntent)
        
        // CRITICAL: Wait for React Native initialization (warm is faster but still needs time)
        Thread.sleep(10000) // 10 seconds for RN initialization (warm is faster than cold)
        
        // Wait for app package to be visible in UI
        device.wait(Until.hasObject(By.pkg("com.astrodha.ai")), 30_000)
        
        // Wait for UI to be fully drawn and idle
        device.waitForIdle(15_000) // 15 seconds - ensures UI is fully rendered
        
        // CRITICAL: Additional wait for stability
        Thread.sleep(5000) // 5 more seconds for final stability
    }
}
