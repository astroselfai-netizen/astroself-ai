import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import VersionCheck from 'react-native-version-check';
import { ANDROID_PLAY_STORE_PACKAGE, NATIVE_APP_VERSION } from '../constants/appVersion';
import { fetchPlayStoreLatestVersion } from '../utils/fetchPlayStoreVersion';
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

/** Cold-start retries help Vivo/Oppo where network is blocked briefly after launch. */
const RETRY_DELAYS_MS = [0, 2500, 6000, 12000];

function getCurrentAppVersion(): string {
  try {
    const fromNative = VersionCheck.getCurrentVersion();
    if (fromNative && String(fromNative).trim()) {
      return String(fromNative).trim();
    }
  } catch {
    // fall through
  }
  return NATIVE_APP_VERSION;
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
      return `https://play.google.com/store/apps/details?id=${ANDROID_PLAY_STORE_PACKAGE}&hl=en`;
    }
  }
  return '';
}

type StoreLatest = {
  version: string;
  storeUrl: string;
  isNeeded: boolean;
};

/**
 * Frontend-only: compare installed version vs Play Store / App Store listing.
 * No backend API required. Runs custom scrape + library in parallel for OEM reliability.
 */
async function resolveStoreLatest(current: string): Promise<StoreLatest | null> {
  if (Platform.OS === 'android') {
    const [custom, vcRaw] = await Promise.all([
      fetchPlayStoreLatestVersion(ANDROID_PLAY_STORE_PACKAGE),
      VersionCheck.needUpdate({
        packageName: ANDROID_PLAY_STORE_PACKAGE,
        ignoreErrors: true,
      }).catch(() => null),
    ]);

    if (custom?.version) {
      return {
        version: custom.version,
        storeUrl: custom.storeUrl,
        isNeeded: compareVersion(current, custom.version) < 0,
      };
    }

    if (vcRaw && typeof vcRaw === 'object' && 'isNeeded' in vcRaw && vcRaw.latestVersion) {
      return {
        version: vcRaw.latestVersion,
        storeUrl: vcRaw.storeUrl ?? '',
        isNeeded: Boolean(vcRaw.isNeeded),
      };
    }

    return null;
  }

  try {
    const vcRaw = await VersionCheck.needUpdate({ ignoreErrors: true });
    if (vcRaw && typeof vcRaw === 'object' && 'isNeeded' in vcRaw && vcRaw.latestVersion) {
      return {
        version: vcRaw.latestVersion,
        storeUrl: vcRaw.storeUrl ?? '',
        isNeeded: Boolean(vcRaw.isNeeded),
      };
    }
  } catch {
    // continue
  }

  return null;
}

export function usePlayStoreUpdate() {
  const [state, setState] = useState<PlayStoreUpdateState>(initial);
  const checkingRef = useRef(false);
  const upToDateRef = useRef(false);

  const runCheck = useCallback(async () => {
    if (checkingRef.current || upToDateRef.current) {
      return;
    }
    checkingRef.current = true;

    try {
      const current = getCurrentAppVersion();
      const store = await resolveStoreLatest(current);

      if (!store) {
        // Network / scrape failed — keep modal if already shown; retry later
        return;
      }

      if (!store.isNeeded) {
        upToDateRef.current = true;
        setState((prev) => ({
          ...prev,
          visible: false,
          currentVersion: current,
          latestVersion: store.version,
        }));
        return;
      }

      const storeUrl =
        store.storeUrl || (await resolvePlayStoreUrl(store.storeUrl));

      setState({
        visible: true,
        forceUpdate: true,
        latestVersion: store.version,
        currentVersion: current,
        storeUrl,
      });
    } finally {
      checkingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const timers = RETRY_DELAYS_MS.map((delay) =>
      setTimeout(() => {
        runCheck().catch(() => undefined);
      }, delay),
    );

    const onAppState = (next: AppStateStatus) => {
      if (next === 'active') {
        runCheck().catch(() => undefined);
      }
    };
    const appSub = AppState.addEventListener('change', onAppState);

    // Vivo/Oppo often report offline at cold start; recheck when internet is back.
    const netSub = NetInfo.addEventListener((netState) => {
      const online =
        netState.isConnected === true && netState.isInternetReachable !== false;
      if (online) {
        runCheck().catch(() => undefined);
      }
    });

    return () => {
      timers.forEach(clearTimeout);
      appSub.remove();
      netSub();
    };
  }, [runCheck]);

  /** No-op: update is mandatory; modal has no "Later". */
  const dismissOptional = useCallback(async () => {}, []);

  return {
    ...state,
    dismissOptional,
    recheck: runCheck,
  };
}
