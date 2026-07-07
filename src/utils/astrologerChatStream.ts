import AsyncStorage from '@react-native-async-storage/async-storage';
import { baseURL } from './http';

export type AstrologerChatPayload = {
  user_id: string;
  astrologer_id: string;
  inr_budget: number;
  question: string;
  conversation_id: string;
};

export const getAstrologerInrBudget = (currentPlan?: string | null): number => {
  const normalized = String(currentPlan || 'cosmic_foundation').toLowerCase();

  if (
    normalized === 'premium' ||
    normalized === '4999_plan' ||
    normalized.includes('4999')
  ) {
    return 4999;
  }

  if (
    normalized === 'pro' ||
    normalized === '2999_plan' ||
    normalized.includes('2999')
  ) {
    return 2999;
  }

  return 60;
};

export const isAstrologerTokenLimitError = (message: string): boolean =>
  message.toLowerCase().includes('token limit');

export const getAstrologerPlanDisplayName = (currentPlan?: string | null): string => {
  const normalized = String(currentPlan || 'cosmic_foundation').toLowerCase();

  if (
    normalized === 'premium' ||
    normalized === '4999_plan' ||
    normalized.includes('4999')
  ) {
    return 'Premium Plan';
  }

  if (
    normalized === 'pro' ||
    normalized === '2999_plan' ||
    normalized.includes('2999')
  ) {
    return 'Pro Plan';
  }

  return 'Free Plan';
};

export type AstrologerChatFinalData = {
  conversation_id?: string;
  title?: string;
  original_question?: string;
  effective_question?: string;
  answer?: string;
  follow_up_questions?: string[];
};

export type AstrologerChatStreamCallbacks = {
  onNodeUpdate?: (node: string, status: string, data: Record<string, unknown>) => void;
  onAnswerToken?: (delta: string) => void;
  onFinal?: (data: AstrologerChatFinalData) => void;
  onError?: (error: Error) => void;
  onDone?: () => void;
};

type ParsedSSEEvent = {
  event: string;
  data: string;
};

export const parseAstrologerChatErrorMessage = (
  responseText: string,
  status?: number,
): string => {
  if (responseText?.trim()) {
    try {
      const body = JSON.parse(responseText) as {
        message?: string | { message?: string };
        detail?: string | { message?: string };
      };

      const nestedMessage = body.message;
      if (typeof nestedMessage === 'string' && nestedMessage.trim()) {
        return nestedMessage.trim();
      }
      if (
        nestedMessage &&
        typeof nestedMessage === 'object' &&
        typeof nestedMessage.message === 'string' &&
        nestedMessage.message.trim()
      ) {
        return nestedMessage.message.trim();
      }

      const nestedDetail = body.detail;
      if (typeof nestedDetail === 'string' && nestedDetail.trim()) {
        return nestedDetail.trim();
      }
      if (
        nestedDetail &&
        typeof nestedDetail === 'object' &&
        typeof nestedDetail.message === 'string' &&
        nestedDetail.message.trim()
      ) {
        return nestedDetail.message.trim();
      }
    } catch {
      // Fall through to generic message.
    }
  }

  return status ? `Chat request failed (${status})` : 'Chat request failed';
};

const parseSSEBuffer = (chunk: string): { events: ParsedSSEEvent[]; remainder: string } => {
  const events: ParsedSSEEvent[] = [];
  const parts = chunk.split('\n\n');
  const remainder = parts.pop() || '';

  parts.forEach(block => {
    const lines = block.split('\n');
    let event = 'message';
    const dataLines: string[] = [];

    lines.forEach(line => {
      if (line.startsWith('event:')) {
        const eventPart = line.slice(6).trim();
        event = eventPart.split(/\s+/)[0]?.replace(/\.$/, '') || 'message';
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trim());
      }
    });

    if (dataLines.length) {
      events.push({ event, data: dataLines.join('\n') });
    }
  });

  return { events, remainder };
};

const handleSSEEvent = (
  parsed: ParsedSSEEvent,
  callbacks: AstrologerChatStreamCallbacks,
) => {
  const { event, data } = parsed;

  try {
    if (event === 'answer_token') {
      const payload = JSON.parse(data) as { delta?: string };
      if (payload.delta) {
        callbacks.onAnswerToken?.(payload.delta);
      }
      return;
    }

    if (event === 'final') {
      const payload = JSON.parse(data) as AstrologerChatFinalData;
      callbacks.onFinal?.(payload);
      return;
    }

    if (event === 'node_update' || event.startsWith('node_update')) {
      const payload = JSON.parse(data) as {
        node?: string;
        status?: string;
        data?: Record<string, unknown>;
      };
      if (payload.node) {
        callbacks.onNodeUpdate?.(
          payload.node,
          payload.status || 'running',
          payload.data || {},
        );
      }
    }
  } catch {
    // Ignore malformed SSE chunks.
  }
};

const drainEventQueue = (
  queue: ParsedSSEEvent[],
  callbacks: AstrologerChatStreamCallbacks,
  onIdle: () => void,
) => {
  const batchSize = 12;
  const batch = queue.splice(0, batchSize);
  batch.forEach(event => handleSSEEvent(event, callbacks));

  if (queue.length > 0) {
    requestAnimationFrame(() => drainEventQueue(queue, callbacks, onIdle));
    return;
  }

  onIdle();
};

export const streamAstrologerChat = async (
  payload: AstrologerChatPayload,
  callbacks: AstrologerChatStreamCallbacks,
): Promise<() => void> => {
  const token = await AsyncStorage.getItem('USER_TOKEN');

  if (!token) {
    callbacks.onError?.(new Error('No authentication token found'));
    callbacks.onDone?.();
    return () => undefined;
  }

  const xhr = new XMLHttpRequest();
  let processedLength = 0;
  let parseRemainder = '';
  let settled = false;
  const eventQueue: ParsedSSEEvent[] = [];
  let draining = false;

  const enqueueEvents = (events: ParsedSSEEvent[]) => {
    if (!events.length) {
      return;
    }

    eventQueue.push(...events);

    if (draining) {
      return;
    }

    draining = true;
    drainEventQueue(eventQueue, callbacks, () => {
      draining = false;
      if (eventQueue.length > 0) {
        draining = true;
        requestAnimationFrame(() => {
          drainEventQueue(eventQueue, callbacks, () => {
            draining = false;
          });
        });
      }
    });
  };

  const processIncomingText = (incoming: string) => {
    if (!incoming) {
      return;
    }

    const toParse = `${parseRemainder}${incoming}`;
    const parsed = parseSSEBuffer(toParse);
    parseRemainder = parsed.remainder;
    enqueueEvents(parsed.events);
  };

  const finish = (error?: Error) => {
    if (settled) {
      return;
    }
    settled = true;
    if (error) {
      callbacks.onError?.(error);
    }
    callbacks.onDone?.();
  };

  xhr.open('POST', `${baseURL}/astrologer/chat`);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Authorization', `Bearer ${token}`);
  xhr.setRequestHeader('Accept', 'text/event-stream');

  xhr.onprogress = () => {
    const fullText = xhr.responseText;
    const chunk = fullText.slice(processedLength);
    processedLength = fullText.length;
    processIncomingText(chunk);
  };

  xhr.onload = () => {
    const tail = xhr.responseText.slice(processedLength);
    processedLength = xhr.responseText.length;
    processIncomingText(tail);

    if (parseRemainder.trim()) {
      const parsed = parseSSEBuffer(`${parseRemainder}\n\n`);
      parseRemainder = '';
      enqueueEvents(parsed.events);
    }

    if (xhr.status >= 400) {
      finish(
        new Error(parseAstrologerChatErrorMessage(xhr.responseText, xhr.status)),
      );
      return;
    }
    finish();
  };

  xhr.onerror = () => {
    finish(new Error('Network error while streaming chat response'));
  };

  xhr.onabort = () => {
    finish();
  };

  xhr.send(JSON.stringify(payload));

  return () => {
    xhr.abort();
  };
};
