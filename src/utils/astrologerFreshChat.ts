import AsyncStorage from '@react-native-async-storage/async-storage';

const FRESH_CHAT_SESSIONS_KEY = 'ASTROLOGER_FRESH_CHAT_SESSIONS';
const LEGACY_FRESH_CHAT_CLIENTS_KEY = 'ASTROLOGER_FRESH_CHAT_CLIENT_IDS';

type FreshChatSessionsMap = Record<string, string>;

const readFreshChatSessions = async (): Promise<FreshChatSessionsMap> => {
  try {
    const raw = await AsyncStorage.getItem(FRESH_CHAT_SESSIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return Object.entries(parsed as Record<string, unknown>).reduce<FreshChatSessionsMap>(
          (acc, [clientId, conversationId]) => {
            if (clientId) {
              acc[clientId] = String(conversationId || '');
            }
            return acc;
          },
          {},
        );
      }
    }

    // Migrate legacy "client ids only" storage once.
    const legacyRaw = await AsyncStorage.getItem(LEGACY_FRESH_CHAT_CLIENTS_KEY);
    if (legacyRaw) {
      const legacyIds = JSON.parse(legacyRaw);
      if (Array.isArray(legacyIds)) {
        const migrated = legacyIds.reduce<FreshChatSessionsMap>((acc, id) => {
          const clientId = String(id || '');
          if (clientId) {
            acc[clientId] = '';
          }
          return acc;
        }, {});
        await AsyncStorage.setItem(FRESH_CHAT_SESSIONS_KEY, JSON.stringify(migrated));
        await AsyncStorage.removeItem(LEGACY_FRESH_CHAT_CLIENTS_KEY);
        return migrated;
      }
    }

    return {};
  } catch {
    return {};
  }
};

const writeFreshChatSessions = async (sessions: FreshChatSessionsMap) => {
  await AsyncStorage.setItem(FRESH_CHAT_SESSIONS_KEY, JSON.stringify(sessions));
};

export const getAstrologerFreshChatSession = async (
  clientId: string,
): Promise<{ isFresh: boolean; conversationId: string } | null> => {
  if (!clientId) {
    return null;
  }
  const sessions = await readFreshChatSessions();
  if (!(clientId in sessions)) {
    return null;
  }
  return {
    isFresh: true,
    conversationId: String(sessions[clientId] || ''),
  };
};

export const startAstrologerFreshChatSession = async (
  clientId: string,
): Promise<void> => {
  if (!clientId) {
    return;
  }
  const sessions = await readFreshChatSessions();
  sessions[clientId] = '';
  await writeFreshChatSessions(sessions);
};

export const setAstrologerFreshChatConversationId = async (
  clientId: string,
  conversationId: string,
): Promise<void> => {
  if (!clientId || !conversationId) {
    return;
  }
  const sessions = await readFreshChatSessions();
  if (!(clientId in sessions)) {
    return;
  }
  sessions[clientId] = conversationId;
  await writeFreshChatSessions(sessions);
};

export const clearAstrologerFreshChatSession = async (
  clientId: string,
): Promise<void> => {
  if (!clientId) {
    return;
  }
  const sessions = await readFreshChatSessions();
  if (!(clientId in sessions)) {
    return;
  }
  delete sessions[clientId];
  await writeFreshChatSessions(sessions);
};
