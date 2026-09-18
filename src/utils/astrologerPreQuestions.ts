export type PreQuestionChildContent = {
  heading: string;
  description: string;
};

export type PreQuestionItem = {
  id: string;
  heading: string;
  collection: string;
  pipeline: Array<Record<string, unknown>>;
  description?: string;
  source?: string;
  children?: PreQuestionChildContent[];
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
};

const asString = (value: unknown) =>
  value == null ? '' : String(value).trim();

const normalizeDetails = (details: unknown): string => {
  if (details == null) {
    return '';
  }
  if (typeof details === 'string') {
    return details.trim();
  }
  if (Array.isArray(details)) {
    return details
      .map(item => {
        if (typeof item === 'string') {
          return item.trim();
        }
        const record = asRecord(item);
        if (!record) {
          return '';
        }
        const heading = asString(record.heading || record.title);
        const nested =
          normalizeDetails(record.details) ||
          asString(record.content || record.answer || record.insights);
        if (heading && nested) {
          return `**${heading}**\n${nested}`;
        }
        return nested || heading;
      })
      .filter(Boolean)
      .join('\n\n');
  }
  const record = asRecord(details);
  if (!record) {
    return String(details).trim();
  }
  if ('details' in record) {
    return normalizeDetails(record.details);
  }
  return asString(record.content || record.answer || record.insights);
};

export const extractGetContentAnswer = (payload: unknown): string => {
  if (!payload) {
    return '';
  }
  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    if (!trimmed) {
      return '';
    }
    try {
      return extractGetContentAnswer(JSON.parse(trimmed));
    } catch {
      return trimmed;
    }
  }
  if (Array.isArray(payload)) {
    return normalizeDetails(payload);
  }

  const obj = asRecord(payload);
  if (!obj) {
    return '';
  }

  const direct =
    asString(obj.answer) ||
    asString(obj.insights) ||
    asString(obj.description) ||
    asString(obj.content) ||
    asString(obj.text);
  if (direct) {
    return direct;
  }

  if ('details' in obj) {
    const fromDetails = normalizeDetails(obj.details);
    if (fromDetails) {
      return fromDetails;
    }
  }

  if ('data' in obj) {
    const fromData = extractGetContentAnswer(obj.data);
    if (fromData) {
      return fromData;
    }
  }

  return '';
};

export const extractGetContentStreamDelta = (payload: unknown): string => {
  if (payload == null) {
    return '';
  }
  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    if (!trimmed || trimmed === '[DONE]') {
      return '';
    }
    try {
      return extractGetContentStreamDelta(JSON.parse(trimmed));
    } catch {
      return trimmed;
    }
  }
  if (Array.isArray(payload)) {
    return normalizeDetails(payload);
  }

  const obj = asRecord(payload);
  if (!obj) {
    return '';
  }

  const nestedData = asRecord(obj.data);
  const chunk = asRecord(obj.chunk) || asRecord(nestedData?.chunk);
  if (typeof chunk?.content === 'string' && chunk.content) {
    return chunk.content;
  }
  if (typeof nestedData?.delta === 'string' && nestedData.delta) {
    return nestedData.delta;
  }
  if (typeof nestedData?.content === 'string' && nestedData.content) {
    return nestedData.content;
  }

  if (typeof obj.delta === 'string' && obj.delta) {
    return obj.delta;
  }
  if (typeof obj.token === 'string' && obj.token) {
    return obj.token;
  }
  if (typeof obj.chunk === 'string' && obj.chunk) {
    return obj.chunk;
  }

  const heading = asString(obj.heading || obj.title);
  const body =
    normalizeDetails(obj.details) ||
    asString(obj.answer) ||
    asString(obj.insights) ||
    asString(obj.content) ||
    asString(obj.text);

  if (body) {
    if (heading && !body.includes(heading)) {
      return `**${heading}**\n\n${body}`;
    }
    return body;
  }

  if (nestedData) {
    const fromData = extractGetContentStreamDelta(nestedData);
    if (fromData) {
      return fromData;
    }
  }

  return '';
};

const extractList = (response: unknown): Array<Record<string, unknown>> => {
  const root = asRecord(response);
  const payload = root?.data ?? response;

  if (Array.isArray(payload)) {
    return payload.filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === 'object' && !Array.isArray(item),
    );
  }

  const nested = asRecord(payload);
  if (nested && Array.isArray(nested.data)) {
    return nested.data.filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === 'object' && !Array.isArray(item),
    );
  }

  return [];
};

const getHeading = (item: Record<string, unknown>) => {
  const nestedPipeline = Array.isArray(item.pipeline) ? item.pipeline[0] : null;
  const nested = asRecord(nestedPipeline);
  return asString(
    item.heading ||
      item.title ||
      item.name ||
      nested?.heading ||
      nested?.title,
  );
};

const patchPipelineUserId = (value: unknown, userId: string): unknown => {
  if (!userId) {
    return value;
  }
  const cloned = JSON.parse(JSON.stringify(value));

  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') {
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }

    const obj = node as Record<string, unknown>;
    const match = obj.$match;
    if (match && typeof match === 'object' && !Array.isArray(match)) {
      const matchObj = match as Record<string, unknown>;
      if ('user_id' in matchObj) {
        matchObj.user_id = userId;
      }
    }
    Object.values(obj).forEach(walk);
  };

  walk(cloned);
  return cloned;
};

const isMongoStage = (value: unknown) => {
  const record = asRecord(value);
  if (!record) {
    return false;
  }
  return (
    '$match' in record ||
    '$unwind' in record ||
    '$project' in record ||
    '$group' in record ||
    '$sort' in record
  );
};

const isCompositeNode = (value: unknown) => {
  const record = asRecord(value);
  if (!record) {
    return false;
  }
  return Boolean(
    asString(record.heading || record.title) ||
      (typeof record.collection === 'string' && Array.isArray(record.pipeline)),
  );
};

const extractChildContents = (
  pipeline: Array<Record<string, unknown>>,
): PreQuestionChildContent[] =>
  pipeline
    .map(node => {
      if (!isCompositeNode(node) || isMongoStage(node)) {
        return null;
      }
      const record = asRecord(node);
      if (!record) {
        return null;
      }
      const heading = asString(record.heading || record.title);
      const description =
        asString(record.description) || normalizeDetails(record.details);
      if (!heading || !description) {
        return null;
      }
      return { heading, description };
    })
    .filter((item): item is PreQuestionChildContent => Boolean(item));

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Backend composite get-content sometimes returns "No matching data found." for a
 * nested section even when suggested_questions already has that section's HTML
 * description. Prefer the description so mobile matches web/history content.
 */
export const fillMissingGetContentSections = (
  answer: string,
  item: PreQuestionItem,
): string => {
  if (!answer?.trim()) {
    return item.description || '';
  }

  if (!/no matching data found/i.test(answer)) {
    return answer;
  }

  let result = answer;
  const children =
    item.children ||
    extractChildContents(
      Array.isArray(item.pipeline)
        ? (item.pipeline as Array<Record<string, unknown>>)
        : [],
    );

  children.forEach(child => {
    const heading = escapeRegExp(child.heading);
    const patterns = [
      new RegExp(
        `(##\\s*\\*{0,2}\\s*${heading}\\s*\\*{0,2}\\s*\\n+)(?:<p[^>]*>\\s*)?No matching data found\\.?\\s*(?:</p>)?`,
        'i',
      ),
      new RegExp(
        `(<h[1-6][^>]*>\\s*${heading}\\s*</h[1-6]>\\s*)(?:<p[^>]*>\\s*)?No matching data found\\.?\\s*(?:</p>)?`,
        'i',
      ),
    ];

    for (const pattern of patterns) {
      if (pattern.test(result)) {
        result = result.replace(pattern, `$1${child.description}\n\n`);
        break;
      }
    }
  });

  // If still only missing placeholders and we have a top-level description, use it.
  if (
    /no matching data found/i.test(result) &&
    item.description &&
    result.replace(/no matching data found\.?/gi, '').trim().length < 40
  ) {
    return item.description;
  }

  return result;
};

export const buildAnswerFromPreQuestionDescriptions = (
  item: PreQuestionItem,
): string => {
  const children =
    item.children ||
    extractChildContents(
      Array.isArray(item.pipeline)
        ? (item.pipeline as Array<Record<string, unknown>>)
        : [],
    );

  if (children.length > 0) {
    const parts = [`## **${item.heading}**`];
    children.forEach(child => {
      parts.push(`## **${child.heading}**\n${child.description}`);
    });
    return parts.join('\n\n');
  }

  return item.description || '';
};

export const extractPreQuestionItems = (response: unknown): PreQuestionItem[] =>
  extractList(response)
    .map((item, index) => {
      const heading = getHeading(item);
      const nested = asRecord(
        Array.isArray(item.pipeline) ? item.pipeline[0] : null,
      );
      const collection =
        asString(item.collection) || asString(nested?.collection);
      const pipeline = Array.isArray(item.pipeline)
        ? (item.pipeline as Array<Record<string, unknown>>)
        : [];
      if (!heading || !collection || pipeline.length === 0) {
        return null;
      }
      const description =
        asString(item.description) ||
        asString(nested?.description) ||
        normalizeDetails(item.details) ||
        normalizeDetails(nested?.details);
      const children = extractChildContents(pipeline);
      return {
        id: `${collection}-${heading}-${index}`,
        heading,
        collection,
        pipeline,
        description: description || undefined,
        source: asString(item.source) || undefined,
        children: children.length > 0 ? children : undefined,
      };
    })
    .filter((item): item is PreQuestionItem => Boolean(item));

export const buildPreQuestionStreamPayload = (
  item: PreQuestionItem,
  clientId: string,
  options?: {
    astrologerId?: string;
    conversationId?: string;
  },
): {
  collection: string;
  pipeline: Array<Record<string, unknown>>;
  user_id: string;
  heading: string;
  source: string;
  conversation_id: string;
  astrologer_id: string;
} => {
  const patched = patchPipelineUserId(
    {
      heading: item.heading,
      collection: item.collection,
      pipeline: item.pipeline,
    },
    clientId,
  ) as {
    heading: string;
    collection: string;
    pipeline: Array<Record<string, unknown>>;
  };

  const first = patched.pipeline[0];
  const alreadyWrapped =
    patched.pipeline.length === 1 &&
    isCompositeNode(first) &&
    !isMongoStage(first) &&
    asString(asRecord(first)?.heading) === patched.heading;

  const collection = patched.collection;
  const pipeline = alreadyWrapped ? patched.pipeline : [patched];

  return {
    collection,
    pipeline,
    user_id: clientId,
    heading: patched.heading,
    source: item.source || 'pre_question',
    conversation_id: options?.conversationId || '',
    astrologer_id: options?.astrologerId || '',
  };
};
