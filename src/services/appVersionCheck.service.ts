import {
  APP_UPDATE_USE_EMBEDDED_WHEN_API_FAILS,
  APP_VERSION_CHECK_URL,
  EMBEDDED_FORCE_UPDATE,
  EMBEDDED_LATEST_VERSION,
  EMBEDDED_MIN_SUPPORTED_VERSION,
} from '../config/appUpdate';

export type AppVersionCheckResult = {
  latest_version: string;
  min_supported_version?: string;
  force_update?: boolean;
  message?: string;
};

function parseBody(data: unknown): AppVersionCheckResult | null {
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  const latest = o.latest_version ?? o.latestVersion;
  if (typeof latest !== 'string' || !latest.trim()) return null;
  const minRaw = o.min_supported_version ?? o.minSupportedVersion;
  const min =
    typeof minRaw === 'string' && minRaw.trim() ? minRaw : undefined;
  const forceRaw = o.force_update ?? o.forceUpdate;
  const force_update = typeof forceRaw === 'boolean' ? forceRaw : undefined;
  const message = typeof o.message === 'string' ? o.message : undefined;
  return {
    latest_version: latest.trim(),
    min_supported_version: min,
    force_update,
    message,
  };
}

export async function fetchAppVersionConfig(): Promise<AppVersionCheckResult | null> {
  try {
    const res = await fetch(APP_VERSION_CHECK_URL, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      if (APP_UPDATE_USE_EMBEDDED_WHEN_API_FAILS) {
        return {
          latest_version: EMBEDDED_LATEST_VERSION,
          min_supported_version: EMBEDDED_MIN_SUPPORTED_VERSION,
          force_update: EMBEDDED_FORCE_UPDATE,
        };
      }
      return null;
    }
    const json: unknown = await res.json();
    const parsed = parseBody(json);
    if (parsed) return parsed;
  } catch {
    if (APP_UPDATE_USE_EMBEDDED_WHEN_API_FAILS) {
      return {
        latest_version: EMBEDDED_LATEST_VERSION,
        min_supported_version: EMBEDDED_MIN_SUPPORTED_VERSION,
        force_update: EMBEDDED_FORCE_UPDATE,
      };
    }
  }
  return null;
}
