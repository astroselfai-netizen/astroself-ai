/**
 * Gate hard-refresh-on-resume while external auth / browser sheets are open
 * (Google Sign-In, Apple Sign-In, etc.). Returning from those flows puts the
 * app briefly in background — restarting would cancel login.
 */

let suppressCount = 0;
let graceUntilMs = 0;

/** Call when starting Google/Apple (or other) external auth. Always release in finally. */
export function beginExternalAuthSession(graceMsAfterEnd = 2500): () => void {
  suppressCount += 1;
  let released = false;

  return () => {
    if (released) {
      return;
    }
    released = true;
    suppressCount = Math.max(0, suppressCount - 1);
    graceUntilMs = Date.now() + graceMsAfterEnd;
  };
}

export function shouldSuppressHardRefresh(): boolean {
  return suppressCount > 0 || Date.now() < graceUntilMs;
}
