import { Api } from '../types/api';

type ChatHistoryItem = Api.User.Res.AstrologerChatHistoryItem;
type ChatHistoryMonth = Api.User.Res.AstrologerChatHistoryMonth;

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
  const answer = String(
    item.answer ?? item.response ?? item.bot_message ?? item.reply ?? '',
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
  const conversations = extractChatHistoryItems(item, { month, year });

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
