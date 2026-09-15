import { Api } from '../types/api';
import { sanitizeAnswerText } from './astrologerChatMarkdown';

type ChatHistoryItem = Api.User.Res.AstrologerChatHistoryItem;
type ChatHistoryMonth = Api.User.Res.AstrologerChatHistoryMonth;
type ChatHistoryThread = Api.User.Res.AstrologerChatHistoryThread;

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const toNumber = (value: unknown): number | null => {
  if (value == null || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getMonthName = (month: number) => {
  if (month >= 1 && month <= 12) {
    return MONTH_NAMES[month - 1];
  }
  return '';
};

export const formatChatHistoryMonthDisplay = (
  month: number,
  year: number,
  monthName?: string,
) => {
  const safeMonthName = String(monthName || '').trim() || getMonthName(month);
  if (safeMonthName && year) {
    return `${safeMonthName} ${year}`;
  }
  if (year) {
    return String(year);
  }
  if (safeMonthName) {
    return safeMonthName;
  }
  return 'Chat history';
};

export const formatChatHistoryEntryDate = (createdAt: string) => {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleDateString('en-GB', { month: 'short' });
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day} ${month} ${year} - ${hours}:${minutes}`;
};

const parseMonthYearFromDate = (value: unknown) => {
  const text = String(value || '').trim();
  if (!text) {
    return { month: null as number | null, year: null as number | null };
  }

  const iso = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) {
    return {
      year: Number(iso[1]),
      month: Number(iso[2]),
    };
  }

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    return { month: null, year: null };
  }

  return {
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
};

const parseMonthYearFromKey = (value: unknown) => {
  const text = String(value || '').trim();
  const match = text.match(/^(\d{4})[-/](\d{1,2})$/);
  if (!match) {
    return { month: null as number | null, year: null as number | null };
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
  };
};

const looksLikeHistoryItem = (value: unknown): boolean => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    item.question != null ||
    item.answer != null ||
    item.conversation_id != null ||
    item.conversationId != null ||
    item.message != null
  );
};

export const normalizeChatHistoryItem = (
  raw: unknown,
): ChatHistoryItem | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const item = raw as Record<string, unknown>;
  const question = String(
    item.question ?? item.message ?? item.user_message ?? item.query ?? '',
  ).trim();
  const answer = sanitizeAnswerText(
    String(item.answer ?? item.response ?? item.bot_message ?? item.reply ?? ''),
  );
  const conversation_id = String(
    item.conversation_id ?? item.conversationId ?? item.id ?? '',
  );
  const created_at = String(
    item.created_at ?? item.createdAt ?? item.timestamp ?? item.date ?? '',
  );

  if (!question && !answer) {
    return null;
  }

  return {
    created_at,
    question,
    answer,
    conversation_id,
  };
};

const pickConversationList = (item: Record<string, unknown>): unknown[] => {
  for (const key of ['conversations', 'chats', 'questions', 'history', 'items']) {
    const value = item[key];
    if (Array.isArray(value) && value.length > 0) {
      return value;
    }
  }

  if (Array.isArray(item.data) && item.data.some(looksLikeHistoryItem)) {
    return item.data;
  }

  return [];
};

const matchesMonthFilter = (
  item: ChatHistoryItem,
  filter?: { month: number; year: number },
) => {
  if (!filter) {
    return true;
  }

  const parsed = parseMonthYearFromDate(item.created_at);
  if (!parsed.month || !parsed.year) {
    return true;
  }

  return parsed.month === filter.month && parsed.year === filter.year;
};

const collectChatHistoryItems = (
  list: unknown[],
  filter?: { month: number; year: number },
): ChatHistoryItem[] => {
  const items: ChatHistoryItem[] = [];

  list.forEach(entry => {
    if (Array.isArray(entry)) {
      items.push(...collectChatHistoryItems(entry, filter));
      return;
    }

    if (!entry || typeof entry !== 'object') {
      return;
    }

    const record = entry as Record<string, unknown>;
    const nested = pickConversationList(record);
    if (nested.length > 0 && !looksLikeHistoryItem(entry)) {
      const nestedMonth =
        toNumber(record.month) ??
        toNumber(record.month_number) ??
        toNumber(record.monthNumber);
      const nestedYear =
        toNumber(record.year) ??
        toNumber(record.year_number) ??
        toNumber(record.yearNumber);

      if (
        filter &&
        nestedMonth &&
        nestedYear &&
        (nestedMonth !== filter.month || nestedYear !== filter.year)
      ) {
        return;
      }

      items.push(...collectChatHistoryItems(nested, filter));
      return;
    }

    const item = normalizeChatHistoryItem(entry);
    if (item && matchesMonthFilter(item, filter)) {
      items.push(item);
    }
  });

  return items;
};

export const extractChatHistoryItems = (
  raw: unknown,
  filter?: { month: number; year: number },
): ChatHistoryItem[] => {
  if (Array.isArray(raw)) {
    return collectChatHistoryItems(raw, filter);
  }

  if (!raw || typeof raw !== 'object') {
    return [];
  }

  const item = raw as Record<string, unknown>;

  for (const key of ['conversations', 'chats', 'questions', 'history', 'items']) {
    const value = item[key];
    if (Array.isArray(value) && value.length > 0) {
      const items = collectChatHistoryItems(value, filter);
      if (items.length > 0) {
        return items;
      }
    }
  }

  if (Array.isArray(item.data)) {
    return collectChatHistoryItems(item.data, filter);
  }

  if (item.data && typeof item.data === 'object') {
    return extractChatHistoryItems(item.data, filter);
  }

  const single = normalizeChatHistoryItem(item);
  return single && matchesMonthFilter(single, filter) ? [single] : [];
};

const getThreadSource = (raw: unknown): unknown[] => {
  if (Array.isArray(raw)) {
    return raw;
  }

  if (!raw || typeof raw !== 'object') {
    return [];
  }

  const item = raw as Record<string, unknown>;
  for (const key of ['conversations', 'chats', 'questions', 'history', 'items']) {
    if (Array.isArray(item[key])) {
      return item[key] as unknown[];
    }
  }

  if (Array.isArray(item.data)) {
    return item.data;
  }

  return [];
};

const toChatHistoryThread = (items: ChatHistoryItem[]): ChatHistoryThread | null => {
  if (!items.length) {
    return null;
  }

  const chronological = [...items].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
  const latest = chronological[chronological.length - 1];

  return {
    conversation_id: latest.conversation_id,
    created_at: latest.created_at,
    question: latest.question,
    items: chronological,
  };
};

export const extractChatHistoryThreads = (
  raw: unknown,
  filter?: { month: number; year: number },
): ChatHistoryThread[] => {
  const source = getThreadSource(raw);
  const hasNestedArrays = source.some(entry => Array.isArray(entry));

  let groups: ChatHistoryItem[][];

  if (hasNestedArrays) {
    groups = source
      .filter((entry): entry is unknown[] => Array.isArray(entry))
      .map(group => collectChatHistoryItems(group, filter));
  } else {
    const items = extractChatHistoryItems(raw, filter);
    const byId = new Map<string, ChatHistoryItem[]>();

    items.forEach(item => {
      const key =
        item.conversation_id || `solo-${item.created_at}-${item.question}`;
      const existing = byId.get(key);
      if (existing) {
        existing.push(item);
      } else {
        byId.set(key, [item]);
      }
    });

    groups = Array.from(byId.values());
  }

  return groups
    .map(toChatHistoryThread)
    .filter((thread): thread is ChatHistoryThread => thread != null)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
};

export const normalizeChatHistoryMonth = (
  raw: unknown,
): ChatHistoryMonth | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const item = raw as Record<string, unknown>;
  let month =
    toNumber(item.month) ??
    toNumber(item.month_number) ??
    toNumber(item.monthNumber) ??
    toNumber(item.month_num);
  let year =
    toNumber(item.year) ??
    toNumber(item.year_number) ??
    toNumber(item.yearNumber);

  if (!month || !year) {
    const fromLatest = parseMonthYearFromDate(
      item.latest_created_at ?? item.latestCreatedAt ?? item.created_at,
    );
    month = month || fromLatest.month;
    year = year || fromLatest.year;
  }

  if (!month || !year) {
    const fromKey = parseMonthYearFromKey(item._id ?? item.id ?? item.key);
    month = month || fromKey.month;
    year = year || fromKey.year;
  }

  if (!month || !year) {
    return null;
  }

  const month_name =
    String(item.month_name ?? item.monthName ?? '').trim() ||
    getMonthName(month);
  const display =
    String(item.display ?? item.label ?? '').trim() ||
    formatChatHistoryMonthDisplay(month, year, month_name);
  const threads = extractChatHistoryThreads(item, { month, year });
  const conversations = threads.flatMap(thread => thread.items);

  const reportedCount =
    toNumber(item.total_questions) ??
    toNumber(item.totalQuestions) ??
    toNumber(item.question_count) ??
    toNumber(item.questions_count) ??
    toNumber(item.questionCount);

  const total_questions = Math.max(reportedCount ?? 0, conversations.length);

  return {
    month,
    year,
    month_name,
    display,
    total_questions: Math.max(0, total_questions),
    latest_created_at:
      String(
        item.latest_created_at ?? item.latestCreatedAt ?? item.created_at ?? '',
      ) || undefined,
    conversations,
    threads,
  };
};

export const normalizeChatHistoryMonthsList = (
  raw: unknown,
): ChatHistoryMonth[] => {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as Record<string, unknown>)?.months)
      ? ((raw as Record<string, unknown>).months as unknown[])
      : Array.isArray((raw as Record<string, unknown>)?.data)
        ? ((raw as Record<string, unknown>).data as unknown[])
        : [];

  return list
    .map(normalizeChatHistoryMonth)
    .filter((item): item is ChatHistoryMonth => item != null)
    .sort((a, b) => b.year - a.year || b.month - a.month);
};

export const groupChatHistoryIntoMonths = (
  items: ChatHistoryItem[],
): ChatHistoryMonth[] => {
  const buckets = new Map<
    string,
    { month: number; year: number; items: ChatHistoryItem[] }
  >();

  items.forEach(item => {
    const parsed = parseMonthYearFromDate(item.created_at);
    if (!parsed.month || !parsed.year) {
      return;
    }

    const key = `${parsed.year}-${parsed.month}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.items.push(item);
      return;
    }

    buckets.set(key, {
      month: parsed.month,
      year: parsed.year,
      items: [item],
    });
  });

  return Array.from(buckets.values())
    .map(bucket => {
      const sorted = [...bucket.items].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      return normalizeChatHistoryMonth({
        month: bucket.month,
        year: bucket.year,
        total_questions: bucket.items.length,
        latest_created_at: sorted[0]?.created_at,
        conversations: sorted,
      });
    })
    .filter((item): item is ChatHistoryMonth => item != null)
    .sort((a, b) => b.year - a.year || b.month - a.month);
};

export const filterChatHistoryByMonthYear = (
  items: ChatHistoryItem[],
  month: number,
  year: number,
): ChatHistoryItem[] =>
  items.filter(item => {
    const parsed = parseMonthYearFromDate(item.created_at);
    return parsed.month === month && parsed.year === year;
  });

type ChatHistoryMonthsCache = {
  userId: string;
  months: ChatHistoryMonth[];
};

let chatHistoryMonthsCache: ChatHistoryMonthsCache | null = null;

export const setChatHistoryMonthsCache = (
  userId: string,
  months: ChatHistoryMonth[],
) => {
  chatHistoryMonthsCache = { userId, months };
};

export const getCachedChatHistoryMonths = (userId: string): ChatHistoryMonth[] =>
  chatHistoryMonthsCache?.userId === userId ? chatHistoryMonthsCache.months : [];

export const getCachedChatHistoryMonthConversations = (
  userId: string,
  month: number,
  year: number,
): ChatHistoryItem[] => {
  const match = getCachedChatHistoryMonths(userId).find(
    item => item.month === month && item.year === year,
  );
  return match?.conversations || [];
};

export const getCachedChatHistoryThread = (
  userId: string,
  month: number,
  year: number,
  conversationId: string,
): ChatHistoryItem[] => {
  const match = getCachedChatHistoryMonths(userId).find(
    item => item.month === month && item.year === year,
  );
  const thread = match?.threads?.find(
    item => item.conversation_id === conversationId,
  );
  if (thread?.items?.length) {
    return thread.items;
  }

  return (match?.conversations || []).filter(
    item => item.conversation_id === conversationId,
  );
};
