import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';
import RNRestart from 'react-native-restart';
import { shouldSuppressHardRefresh } from '../utils/hardRefreshGate';

/**
 * Hard-refresh JS bundle when returning from background after a long absence.
 * Does NOT clear AsyncStorage — login token, USER_DATA, etc. stay intact.
 * Skipped during Google/Apple auth so OAuth is not killed mid-flow.
 */
export function useHardRefreshOnResume(options?: {
  /** Minimum time in background before refresh on resume. Default 30 minutes. */
  minBackgroundMs?: number;
}) {
  const minBackgroundMs = options?.minBackgroundMs ?? 30 * 60 * 1000;
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const backgroundAtRef = useRef<number | null>(null);
  const restartingRef = useRef(false);

  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      const prev = appStateRef.current;

      if (next === 'background') {
        backgroundAtRef.current = Date.now();
      }

      if (prev === 'background' && next === 'active') {
        const startedAt = backgroundAtRef.current;
        backgroundAtRef.current = null;
        const elapsed = startedAt != null ? Date.now() - startedAt : 0;

        if (shouldSuppressHardRefresh()) {
          appStateRef.current = next;
          return;
        }

        if (!restartingRef.current && elapsed >= minBackgroundMs) {
          restartingRef.current = true;
          try {
            if (typeof RNRestart.restart === 'function') {
              RNRestart.restart();
            } else {
              RNRestart.Restart();
            }
          } catch (error) {
            restartingRef.current = false;
            console.warn(
              `[useHardRefreshOnResume] restart failed (${Platform.OS}):`,
              error,
            );
          }
        }
      }

      if (next === 'active' && prev !== 'background') {
        backgroundAtRef.current = null;
      }

      appStateRef.current = next;
    };

    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [minBackgroundMs]);
}
