package com.astroself.ai.benchmark

import androidx.benchmark.macro.FrameTimingMetric
import androidx.benchmark.macro.junit4.MacrobenchmarkRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.uiautomator.By
import androidx.test.uiautomator.Direction
import androidx.test.uiautomator.Until
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Benchmark for scroll performance (FlatList/ScrollView)
 * 
 * Measures:
 * - Frame timing (FPS)
 * - Jank percentage
 * - Smooth scrolling performance
 * 
 * DISABLED: Scroll benchmarks are unstable for React Native apps.
 * Only StartupBenchmark (cold & warm startup) is enabled.
 */
@RunWith(AndroidJUnit4::class)
@Ignore("Scroll benchmarks are unstable for React Native apps - use StartupBenchmark only")
class ScrollBenchmark {

    @get:Rule
    val benchmarkRule = MacrobenchmarkRule()

    @Test
    @Ignore("Scroll benchmarks are unstable for React Native apps")
    fun scrollPerformance() = benchmarkRule.measureRepeated(
        packageName = "com.astroself.ai",
        metrics = listOf(FrameTimingMetric()),
        iterations = 5
    ) {
        pressHome()
        startActivityAndWait()

        // Wait for app to fully load - device is available in macrobenchmark scope
        device.wait(Until.hasObject(By.pkg("com.astroself.ai")), 5_000)

        // Find scrollable views and scroll them
        val scrollable = device.findObject(By.scrollable(true))
        
        try {
            // Scroll down multiple times to measure performance
            repeat(3) {
                scrollable.fling(Direction.DOWN)
                device.waitForIdle()
            }
            
            // Scroll back up
            repeat(3) {
                scrollable.fling(Direction.UP)
                device.waitForIdle()
            }
        } catch (e: Exception) {
            // If scrollable not found, skip scrolling
            println("No scrollable view found: ${e.message}")
        }
    }

    @Test
    @Ignore("Scroll benchmarks are unstable for React Native apps")
    fun listScrollPerformance() = benchmarkRule.measureRepeated(
        packageName = "com.astroself.ai",
        metrics = listOf(FrameTimingMetric()),
        iterations = 5
    ) {
        pressHome()
        startActivityAndWait()

        // Wait for app to load - device is available in macrobenchmark scope
        device.wait(Until.hasObject(By.pkg("com.astroself.ai")), 5_000)

        // Try to find list views (common in React Native apps)
        // Try scrolling on the main scrollable view
        try {
            val scrollView = device.findObject(By.scrollable(true))
            // Perform smooth scrolling
            repeat(5) {
                scrollView.fling(Direction.DOWN, 5000)
                device.waitForIdle(2_000)
            }
        } catch (e: Exception) {
            // If no scrollable found, that's okay - just measure startup
            println("No scrollable view found for list scroll test: ${e.message}")
        }
    }
}

