import { baseURL } from '../utils/http';

/**
 * Optional: extra rules + `message` when the Play Store check fails.
 * Primary force path: `react-native-version-check` when store listing is newer than installed.
 *
 * GET JSON: { latest_version, min_supported_version?, force_update?, message? }
 */
export const APP_VERSION_CHECK_URL = `${baseURL}/mobile/version-check`;

/**
 * When true and the API request fails, compare against embedded values (staging / no backend yet).
 */
export const APP_UPDATE_USE_EMBEDDED_WHEN_API_FAILS = false;

/** Used only when APP_UPDATE_USE_EMBEDDED_WHEN_API_FAILS is true */
export const EMBEDDED_LATEST_VERSION = '1.26';
export const EMBEDDED_MIN_SUPPORTED_VERSION = '1.0';
export const EMBEDDED_FORCE_UPDATE = false;
