import { Dimensions, Platform, StatusBar } from 'react-native';

/** Typical Android 3-button navigation bar height when insets report 0. */
export const ANDROID_NAV_BAR_FALLBACK = 48;

/**
 * Bottom inset for full-screen stack routes (no in-app tab bar).
 *
 * - Prefer real safe-area insets when available.
 * - On Android, insets often report 0 even while the window is edge-to-edge
 *   under a translucent 3-button nav — use a fallback only then.
 * - If the window is already shorter than the screen by ~nav height,
 *   do not add fallback padding (that creates a large empty gap).
 */
export const resolveBottomSafeInset = (
  insetsBottom: number,
  options?: { keyboardVisible?: boolean },
) => {
  if (options?.keyboardVisible) {
    return 0;
  }

  if (Platform.OS === 'ios') {
    return Math.max(insetsBottom, 0);
  }

  if (insetsBottom > 0) {
    return insetsBottom;
  }

  const screen = Dimensions.get('screen');
  const window = Dimensions.get('window');
  const statusBar = StatusBar.currentHeight || 0;
  const systemReserved = Math.max(0, screen.height - window.height - statusBar);

  // Window already excludes the system nav — extra padding would lift UI too high.
  if (systemReserved >= 24) {
    return 0;
  }

  // Full-bleed / translucent nav: content draws under system buttons.
  return ANDROID_NAV_BAR_FALLBACK;
};
