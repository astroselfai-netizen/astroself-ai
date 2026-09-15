import { Api } from '../types/api';

const PERSONAL_FLAG_KEYS = [
  'personal_details',
  'personalizedDetails',
  'personalized_details',
  'is_personalized',
  'isPersonalized',
] as const;

const PERSONAL_CONTENT_KEYS = [
  'what_do_you_do',
  'whatDoYouDo',
  'marital_status',
  'maritalStatus',
  'children',
  'current_future_plans',
  'currentFuturePlans',
  'current_challenges',
  'currentChallenges',
  'any_other_details',
  'anyOtherDetails',
  'about_client',
  'aboutClient',
] as const;

const PERSONAL_SYNC_KEYS = [
  ...PERSONAL_FLAG_KEYS,
  ...PERSONAL_CONTENT_KEYS,
] as const;

const EMPTY_FLAG_VALUES = new Set(['', 'false', '0', 'no', 'not mentioned']);

const isFilledValue = (value: unknown): boolean => {
  if (value === true || value === 1) {
    return true;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return false;
    }
    return !EMPTY_FLAG_VALUES.has(trimmed.toLowerCase());
  }
  if (Array.isArray(value)) {
    return value.some(isFilledValue);
  }
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).some(isFilledValue);
  }
  return false;
};

const isTruthyFlag = (value: unknown): boolean => {
  if (value === true || value === 1) {
    return true;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }
  if (value && typeof value === 'object') {
    return isFilledValue(value);
  }
  return false;
};

const isExplicitFalseFlag = (value: unknown): boolean => {
  if (value === false || value === 0) {
    return true;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'false' || normalized === '0' || normalized === 'no';
  }
  return false;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
};

const collectSources = (source: unknown): Record<string, unknown>[] => {
  const root = asRecord(source);
  if (!root) {
    return [];
  }

  const nestedBirthDetails = asRecord(root.birth_details);
  const nestedBirthData = asRecord(root.birth_data);
  const nestedBirthDetailsData = asRecord(nestedBirthDetails?.birth_data);

  return [root, nestedBirthDetails, nestedBirthData, nestedBirthDetailsData].filter(
    (item): item is Record<string, unknown> => Boolean(item),
  );
};

/**
 * Prefer API `personal_details` when present.
 * Explicit false keeps the lock even if some optional fields are filled.
 */
export const hasAstrologerPersonalDetails = (source: unknown): boolean => {
  const sources = collectSources(source);
  if (!sources.length) {
    return false;
  }

  for (const record of sources) {
    for (const key of PERSONAL_FLAG_KEYS) {
      if (!(key in record)) {
        continue;
      }
      if (isTruthyFlag(record[key])) {
        return true;
      }
      if (isExplicitFalseFlag(record[key])) {
        return false;
      }
    }
  }

  return sources.some(record =>
    PERSONAL_CONTENT_KEYS.some(key => isFilledValue(record[key])),
  );
};

export const pickAstrologerPersonalDetails = (
  source: unknown,
): Record<string, unknown> => {
  const sources = collectSources(source);
  const picked: Record<string, unknown> = {};

  sources.forEach(record => {
    PERSONAL_SYNC_KEYS.forEach(key => {
      if (record[key] !== undefined && picked[key] === undefined) {
        picked[key] = record[key];
      }
    });
  });

  return picked;
};

export const mergeAstrologerClientsWithPersonalDetails = (
  incoming: Api.User.Res.AstrologerClient[],
  previous: Api.User.Res.AstrologerClient[],
): Api.User.Res.AstrologerClient[] => {
  const previousById = new Map(previous.map(client => [client.id, client]));

  return incoming.map(client => {
    if (hasAstrologerPersonalDetails(client)) {
      return {
        ...client,
        personalizedDetails: true,
        personal_details: true,
        is_personalized: true,
      } as Api.User.Res.AstrologerClient;
    }

    const previousClient = previousById.get(client.id);
    if (!previousClient || !hasAstrologerPersonalDetails(previousClient)) {
      return client;
    }

    return {
      ...client,
      ...pickAstrologerPersonalDetails(previousClient),
      personalizedDetails: true,
      personal_details: true,
      is_personalized: true,
    } as Api.User.Res.AstrologerClient;
  });
};
