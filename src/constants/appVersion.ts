/**
 * Must match native marketing version:
 * - android/app/build.gradle versionName
 * - iOS MARKETING_VERSION (Xcode)
 * Fallback only — prefer VersionCheck.getCurrentVersion() at runtime.
 */
export const NATIVE_APP_VERSION = '1.29';

/** Android applicationId — Play Store listing */
export const ANDROID_PLAY_STORE_PACKAGE = 'com.astrodha.ai';
