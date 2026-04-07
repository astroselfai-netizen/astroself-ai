import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import VersionCheck from 'react-native-version-check';
import { ANDROID_PLAY_STORE_PACKAGE, NATIVE_APP_VERSION } from '../constants/appVersion';
import { fetchAppVersionConfig } from '../services/appVersionCheck.service';
import { compareVersion } from '../utils/versionCompare';

export type PlayStoreUpdateState = {
  visible: boolean;
  forceUpdate: boolean;
  latestVersion: string;
  currentVersion: string;
  message?: string;
  storeUrl: string;
};

const initial: PlayStoreUpdateState = {
  visible: false,
  forceUpdate: false,
  latestVersion: '',
  currentVersion: NATIVE_APP_VERSION,
  storeUrl: '',
};

function getCurrentAppVersion(): string {
  try {
    return VersionCheck.getCurrentVersion();
  } catch {
    return NATIVE_APP_VERSION;
  }
}

async function resolvePlayStoreUrl(fallbackFromVc?: string): Promise<string> {
  const trimmed = fallbackFromVc?.trim();
  if (trimmed) {
    return trimmed;
  }
  if (Platform.OS === 'android') {
    try {
      const url = await VersionCheck.getPlayStoreUrl({
        packageName: ANDROID_PLAY_STORE_PACKAGE,
      });
      return url ?? '';
    } catch {
      return '';
    }
  }
  return '';
}

export function usePlayStoreUpdate() {
  const [state, setState] = useState<PlayStoreUpdateState>(initial);

  const runCheck = useCallback(async () => {
    const [vcRaw, api] = await Promise.all([
      VersionCheck.needUpdate(
        Platform.OS === 'android'
          ? { packageName: ANDROID_PLAY_STORE_PACKAGE }
          : {}
      ).catch(() => null as null),
      fetchAppVersionConfig(),
    ]);

    const vc =
      vcRaw && typeof vcRaw === 'object' && 'isNeeded' in vcRaw
        ? vcRaw
        : null;

    const current = vc?.currentVersion ?? getCurrentAppVersion();

    let shouldShow = false;
    let latestVersion = '';
    let message: string | undefined;
    let storeUrl = '';

    const outdatedVsApi =
      api != null && compareVersion(current, api.latest_version) < 0;
    const minSupported = api?.min_supported_version?.trim();
    const belowMin =
      Boolean(minSupported) &&
      compareVersion(current, minSupported as string) < 0;

    // Play / App Store: newer listing than installed → block app until update
    if (vc?.isNeeded && vc) {
      shouldShow = true;
      latestVersion = vc.latestVersion;
      storeUrl = vc.storeUrl ?? '';
      const apiMsg = api?.message?.trim();
      if (apiMsg) {
        message = apiMsg;
      }
    } else if (belowMin && api) {
      shouldShow = true;
      latestVersion = api.latest_version;
      message = api.message;
    } else if (api && outdatedVsApi) {
      // Backend says a newer target exists (e.g. store check failed)
      shouldShow = true;
      latestVersion = api.latest_version;
      message = api.message;
    }

    if (!shouldShow) {
      setState((prev) => ({ ...prev, visible: false }));
      return;
    }

    if (!storeUrl) {
      storeUrl = await resolvePlayStoreUrl(vc?.storeUrl);
    }

    setState({
      visible: true,
      forceUpdate: true,
      latestVersion,
      currentVersion: current,
      message,
      storeUrl,
    });
  }, []);

  useEffect(() => {
    runCheck();
  }, [runCheck]);

  /** No-op: update is mandatory; modal has no "Later". */
  const dismissOptional = useCallback(async () => {}, []);

  return {
    ...state,
    dismissOptional,
    recheck: runCheck,
  };
}
