import { Linking, Platform } from 'react-native';
import { ANDROID_PLAY_STORE_PACKAGE } from '../constants/appVersion';

const PLAY_STORE_WEB = `https://play.google.com/store/apps/details?id=${ANDROID_PLAY_STORE_PACKAGE}`;
const PLAY_STORE_MARKET = `market://details?id=${ANDROID_PLAY_STORE_PACKAGE}`;

export async function openAndroidPlayStore(): Promise<void> {
  const canMarket = await Linking.canOpenURL(PLAY_STORE_MARKET);
  if (canMarket) {
    await Linking.openURL(PLAY_STORE_MARKET);
    return;
  }
  await Linking.openURL(PLAY_STORE_WEB);
}

/**
 * Prefer URL from react-native-version-check (Play / App Store); fallback on Android only.
 */
export async function openStoreListing(storeUrl?: string | null): Promise<void> {
  const url = storeUrl?.trim();
  if (url) {
    await Linking.openURL(url);
    return;
  }
  if (Platform.OS === 'android') {
    await openAndroidPlayStore();
  }
}
