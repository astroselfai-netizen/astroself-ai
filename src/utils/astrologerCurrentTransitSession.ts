import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_PREFIX = 'ASTROLOGER_CURRENT_TRANSIT';

export type AstrologerCurrentTransitChartData = Record<string, unknown>;

export type AstrologerCurrentTransitSession = {
  chartData: AstrologerCurrentTransitChartData;
  savedAt: string;
};

const getStorageKey = (userId: string) => `${STORAGE_PREFIX}_${userId}`;

export const saveAstrologerCurrentTransitSession = async (
  userId: string,
  chartData: AstrologerCurrentTransitChartData,
) => {
  if (!userId) {
    return;
  }

  const session: AstrologerCurrentTransitSession = {
    chartData,
    savedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(getStorageKey(userId), JSON.stringify(session));
};

export const getAstrologerCurrentTransitSession = async (
  userId: string,
): Promise<AstrologerCurrentTransitSession | null> => {
  if (!userId) {
    return null;
  }

  try {
    const raw = await AsyncStorage.getItem(getStorageKey(userId));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as AstrologerCurrentTransitSession;
    if (!parsed?.chartData) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

export const clearAstrologerCurrentTransitSession = async (userId: string) => {
  if (!userId) {
    return;
  }

  await AsyncStorage.removeItem(getStorageKey(userId));
};
