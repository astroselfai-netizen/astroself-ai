export type ChatSection = {
  heading?: string;
  bullets?: string[];
  paragraph?: string;
};

export type ParsedChatAnswer = {
  title: string;
  sections: ChatSection[];
};

const HEADING_REGEX = /^(#{1,6})\s+(.+)$/;
const BULLET_REGEX = /^[-*•]\s+(.+)$/;

const sanitizeText = (text: string) =>
  text
    .replace(/\s+/g, ' ')
    .replace(/#{1,6}\s+/g, '')
    .trim();

const sanitizeBullet = (text: string) => {
  const hashIndex = text.search(/#{1,6}\s+/);
  if (hashIndex >= 0) {
    return text.slice(0, hashIndex).trim();
  }
  return text.trim();
};

export const stripPartialTrailingMarkdown = (text: string) => {
  if (!text) {
    return '';
  }

  let cleaned = text.replace(/\r\n/g, '\n');

  const lines = cleaned.split('\n');
  const lastLine = lines[lines.length - 1] ?? '';

  if (/^#{0,6}$/.test(lastLine.trim())) {
    cleaned = lines.slice(0, -1).join('\n');
  } else if (/^#{1,6}(\s*[^\s]*)?$/.test(lastLine.trim())) {
    cleaned = lines.slice(0, -1).join('\n');
  } else {
    const trailingHashMatch = lastLine.match(/^(.*?)(#{1,6}\s*[^\n]*)$/);
    if (trailingHashMatch && trailingHashMatch[2] && !/^#{1,6}\s+\S/.test(trailingHashMatch[2])) {
      lines[lines.length - 1] = trailingHashMatch[1];
      cleaned = lines.join('\n');
    }
  }

  return cleaned.trimEnd();
};

export const parseMarkdownAnswer = (
  answer: string,
  forStreaming = false,
): ParsedChatAnswer => {
  const source = forStreaming ? stripPartialTrailingMarkdown(answer) : answer;
  const lines = source
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  const sections: ChatSection[] = [];
  let title = '';
  let currentSection: ChatSection | null = null;

  const pushCurrentSection = () => {
    if (!currentSection) {
      return;
    }

    const hasContent =
      Boolean(currentSection.heading) ||
      Boolean(currentSection.paragraph) ||
      Boolean(currentSection.bullets?.length);

    if (hasContent) {
      sections.push(currentSection);
    }
    currentSection = null;
  };

  lines.forEach(rawLine => {
    const headingMatch = rawLine.match(HEADING_REGEX);
    if (headingMatch) {
      const heading = sanitizeText(headingMatch[2]);
      if (!heading) {
        return;
      }

      if (!title) {
        title = heading;
        return;
      }

      pushCurrentSection();
      currentSection = { heading, bullets: [] };
      return;
    }

    const bulletMatch = rawLine.match(BULLET_REGEX);
    if (bulletMatch) {
      const bullet = sanitizeBullet(bulletMatch[1]);
      if (!bullet) {
        return;
      }

      if (!currentSection) {
        currentSection = { bullets: [] };
      }
      if (!currentSection.bullets) {
        currentSection.bullets = [];
      }
      currentSection.bullets.push(bullet);
      return;
    }

    const paragraph = sanitizeText(rawLine);
    if (!paragraph) {
      return;
    }

    if (!currentSection) {
      currentSection = { paragraph };
      return;
    }

    currentSection.paragraph = currentSection.paragraph
      ? `${currentSection.paragraph}\n${paragraph}`
      : paragraph;
  });

  pushCurrentSection();

  if (!title && sections[0]?.heading) {
    title = sections[0].heading;
    sections[0] = {
      ...sections[0],
      heading: undefined,
    };
  }

  if (!sections.length && source.trim()) {
    return {
      title: title || 'Response',
      sections: [{ paragraph: sanitizeText(source) }],
    };
  }

  return {
    title: title || 'Response',
    sections,
  };
};

export const getStreamingDisplayText = (text: string) =>
  stripPartialTrailingMarkdown(text)
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/#{1,6}/g, '');
