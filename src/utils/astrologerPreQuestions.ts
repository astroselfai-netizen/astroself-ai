export type PreQuestionItem = {
  id: string;
  heading: string;
  collection: string;
  pipeline: Array<Record<string, unknown>>;
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
      return {
        id: `${collection}-${heading}-${index}`,
        heading,
        collection,
        pipeline,
      };
    })
    .filter((item): item is PreQuestionItem => Boolean(item));

export const buildPreQuestionStreamPayload = (
  item: PreQuestionItem,
  clientId: string,
): { collection: string; pipeline: Array<Record<string, unknown>> } => {
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

  if (alreadyWrapped) {
    return {
      collection: patched.collection,
      pipeline: patched.pipeline,
    };
  }

  return {
    collection: patched.collection,
    pipeline: [patched],
  };
};
