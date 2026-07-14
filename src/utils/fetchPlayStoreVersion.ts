import { ANDROID_PLAY_STORE_PACKAGE } from '../constants/appVersion';

const VERSION_PATTERNS = [
  /\[\[\["([\d]+(?:\.[\d]+)+)"\]\]/,
  /Current Version.+?>([\d]+(?:\.[\d]+)+)<\/span>/i,
  /"softwareVersion"\s*:\s*"([\d]+(?:\.[\d]+)+)"/i,
];

type PlayStoreVersionResult = {
  version: string;
  storeUrl: string;
};

function extractVersion(html: string): string | null {
  for (const pattern of VERSION_PATTERNS) {
    const match = html.match(pattern);
    const version = match?.[1]?.trim();
    if (version) {
      return version;
    }
  }
  return null;
}

async function fetchWithTimeout(
  url: string,
  ms: number,
): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
        // Browser-like UA: some OEM stacks (Vivo etc.) get empty/partial Play Store HTML
        // with the default React Native user agent + sec-fetch-site header.
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      },
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Resolve Play Store "Current version" without relying solely on
 * react-native-version-check's provider (often fails on Vivo / Oppo / Xiaomi).
 */
export async function fetchPlayStoreLatestVersion(
  packageName: string = ANDROID_PLAY_STORE_PACKAGE,
): Promise<PlayStoreVersionResult | null> {
  const regions = ['IN', 'US'];

  for (const gl of regions) {
    const storeUrl = `https://play.google.com/store/apps/details?id=${packageName}&hl=en&gl=${gl}`;
    const res = await fetchWithTimeout(storeUrl, 12000);
    if (!res?.ok) {
      continue;
    }
    try {
      const html = await res.text();
      const version = extractVersion(html);
      if (version) {
        return { version, storeUrl };
      }
    } catch {
      // try next region
    }
  }

  return null;
}
