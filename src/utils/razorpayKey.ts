const TEST_KEY = 'rzp_test_Rueu06YDULsQCD';
const LIVE_KEY = 'rzp_live_t11y7Cds0JWo47';
const KEY_PATTERN = /^rzp_(test|live)_[A-Za-z0-9]+$/;

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
};

const normalizeKey = (value: unknown): string => {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
};

const isValidRazorpayKey = (key: string): boolean => KEY_PATTERN.test(key);

const isUsableRazorpayKey = (key: string): boolean => {
  if (!isValidRazorpayKey(key)) {
    return false;
  }
  // Production builds must never open checkout with a test key.
  if (!__DEV__ && key.startsWith('rzp_test_')) {
    return false;
  }
  return true;
};

export const getFallbackRazorpayKey = () => (__DEV__ ? TEST_KEY : LIVE_KEY);

export const pickRazorpayKeyFromPayload = (payload: unknown): string => {
  const sources: unknown[] = [payload];
  const root = asRecord(payload);
  if (root?.data) {
    sources.push(root.data);
  }

  for (const source of sources) {
    const record = asRecord(source);
    if (!record) {
      continue;
    }
    const candidates = [
      record.razorpay_key,
      record.razorpayKey,
      record.key_id,
      record.keyId,
      record.key,
    ];
    for (const candidate of candidates) {
      const key = normalizeKey(candidate);
      if (isUsableRazorpayKey(key)) {
        return key;
      }
    }
  }

  return '';
};

export const resolveRazorpayKey = (...payloads: unknown[]): string => {
  for (const payload of payloads) {
    if (typeof payload === 'string') {
      const key = normalizeKey(payload);
      if (isUsableRazorpayKey(key)) {
        return key;
      }
      continue;
    }
    const key = pickRazorpayKeyFromPayload(payload);
    if (key) {
      return key;
    }
  }
  return getFallbackRazorpayKey();
};
