import AsyncStorage from '@react-native-async-storage/async-storage';

const LIST_PREFIX = 'ASTROLOGER_COMBOS_LIST_V4';
const DETAIL_PREFIX = 'ASTROLOGER_COMBO_DETAIL_V1';

export type CachedTransitComboItem = {
  id: string;
  heading: string;
  subheading: string[];
};

export type CachedCombinationListItem = {
  id: string;
  heading: string;
  collection?: string;
  pipeline?: Array<Record<string, unknown>>;
  insights?: string;
  details?: unknown[];
  week_start?: string;
  week_end?: string;
};

export type AstrologerCombosListCache = {
  transitItems?: CachedTransitComboItem[];
  transitDetailItems: CachedCombinationListItem[];
  combinationItems: CachedCombinationListItem[];
  activeComboItems: CachedCombinationListItem[];
  activityItems: CachedCombinationListItem[];
  innerYouItems?: CachedCombinationListItem[];
  nextWeekItems?: CachedCombinationListItem[];
  combosAsOfDate: string;
  savedAt: string;
};

export type AstrologerComboDetailCache = {
  content: string;
  savedAt: string;
};

const listMemory = new Map<string, AstrologerCombosListCache>();
const detailMemory = new Map<string, AstrologerComboDetailCache>();

const listStorageKey = (clientId: string) => `${LIST_PREFIX}_${clientId}`;

const stableStringify = (value: unknown): string => {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

export const makeComboDetailCacheKey = (params: {
  kind: string;
  clientId?: string;
  heading?: string;
  title?: string;
  collection?: string;
  pipeline?: Array<Record<string, unknown>>;
  mode?: string;
  dataType?: string;
}) => {
  const parts = [
    params.kind,
    params.mode || '',
    params.dataType || '',
    params.clientId || '',
    params.heading || params.title || '',
    params.collection || '',
    stableStringify(params.pipeline || []),
  ];
  return `${DETAIL_PREFIX}_${parts.join('::')}`;
};

export const getCombosListCacheSync = (
  clientId: string,
): AstrologerCombosListCache | null => {
  if (!clientId) {
    return null;
  }
  return listMemory.get(clientId) || null;
};

export const getCombosListCache = async (
  clientId: string,
): Promise<AstrologerCombosListCache | null> => {
  if (!clientId) {
    return null;
  }

  const memoryHit = listMemory.get(clientId);
  if (memoryHit) {
    return memoryHit;
  }

  try {
    const raw = await AsyncStorage.getItem(listStorageKey(clientId));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as AstrologerCombosListCache;
    if (!parsed?.savedAt) {
      return null;
    }
    listMemory.set(clientId, parsed);
    return parsed;
  } catch {
    return null;
  }
};

export const setCombosListCache = async (
  clientId: string,
  payload: Omit<AstrologerCombosListCache, 'savedAt'> & { savedAt?: string },
) => {
  if (!clientId) {
    return;
  }

  const next: AstrologerCombosListCache = {
    transitItems: payload.transitItems || [],
    transitDetailItems: payload.transitDetailItems || [],
    combinationItems: payload.combinationItems || [],
    activeComboItems: payload.activeComboItems || [],
    activityItems: payload.activityItems || [],
    innerYouItems: payload.innerYouItems || [],
    nextWeekItems: payload.nextWeekItems || [],
    combosAsOfDate: payload.combosAsOfDate || new Date().toISOString(),
    savedAt: payload.savedAt || new Date().toISOString(),
  };

  listMemory.set(clientId, next);

  try {
    await AsyncStorage.setItem(listStorageKey(clientId), JSON.stringify(next));
  } catch {
    // Ignore persistence failures; memory cache still helps in-session.
  }
};

export const getComboDetailCacheSync = (
  cacheKey: string,
): AstrologerComboDetailCache | null => {
  if (!cacheKey) {
    return null;
  }
  return detailMemory.get(cacheKey) || null;
};

export const getComboDetailCache = async (
  cacheKey: string,
): Promise<AstrologerComboDetailCache | null> => {
  if (!cacheKey) {
    return null;
  }

  const memoryHit = detailMemory.get(cacheKey);
  if (memoryHit) {
    return memoryHit;
  }

  try {
    const raw = await AsyncStorage.getItem(cacheKey);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as AstrologerComboDetailCache;
    if (!parsed?.content) {
      return null;
    }
    detailMemory.set(cacheKey, parsed);
    return parsed;
  } catch {
    return null;
  }
};

export const setComboDetailCache = async (
  cacheKey: string,
  content: string,
) => {
  if (!cacheKey || !content) {
    return;
  }

  const next: AstrologerComboDetailCache = {
    content,
    savedAt: new Date().toISOString(),
  };

  detailMemory.set(cacheKey, next);

  try {
    await AsyncStorage.setItem(cacheKey, JSON.stringify(next));
  } catch {
    // Ignore persistence failures; memory cache still helps in-session.
  }
};
