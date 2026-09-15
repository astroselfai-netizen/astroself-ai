export const isHtmlContent = (value: string) =>
  /<\/?[a-z][\s\S]*>/i.test(value || '');

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const stripIncompleteTrailingTag = (html: string) => {
  const lastOpen = html.lastIndexOf('<');
  const lastClose = html.lastIndexOf('>');
  if (lastOpen > lastClose) {
    return html.slice(0, lastOpen);
  }
  return html;
};

const stripHeadingMarks = (line: string) =>
  line.replace(/^#{1,6}\s+/, '').trim();

const convertMarkdownHeadings = (html: string) =>
  html
    .replace(/^[ \t]*#{1,6}[ \t]+(.+?)\s*$/gm, (_match, title: string) => {
      const clean = String(title || '').trim();
      return clean ? `<h3>${escapeHtml(clean)}</h3>` : '';
    })
    .replace(/<(h[1-6])>\s*#{1,6}\s+/gi, '<$1>');

const wrapPrefixText = (html: string) => {
  const tagIndex = html.search(/<[a-z]/i);
  if (tagIndex <= 0) {
    return html;
  }

  const prefix = html.slice(0, tagIndex).trim();
  const rest = html.slice(tagIndex);
  if (!prefix) {
    return html;
  }

  const prefixHtml = prefix
    .split(/\n+/)
    .map(line => stripHeadingMarks(line.trim()))
    .filter(Boolean)
    .map((line, index) =>
      index === 0
        ? `<h3>${escapeHtml(line)}</h3>`
        : `<p><strong>${escapeHtml(line)}</strong></p>`,
    )
    .join('');

  return `${prefixHtml}${rest}`;
};

const convertNumberedParagraphs = (html: string) =>
  html.replace(/(?:<p\b[^>]*>\s*\d+\.\s*[\s\S]*?<\/p>\s*)+/gi, block => {
    const items = [
      ...block.matchAll(/<p\b[^>]*>\s*\d+\.\s*([\s\S]*?)<\/p>/gi),
    ].map(match => `<li>${String(match[1] || '').trim()}</li>`);
    return items.length > 1 ? `<ol>${items.join('')}</ol>` : block;
  });

const wrapOrphanListItems = (html: string) => {
  if (!/<li\b/i.test(html) || /<(ul|ol)\b/i.test(html)) {
    return html;
  }

  const first = html.search(/<li\b/i);
  const last = html.toLowerCase().lastIndexOf('</li>');
  if (first < 0 || last < first) {
    return html;
  }

  const end = last + 5;
  return `${html.slice(0, first)}<ul>${html.slice(first, end)}</ul>${html.slice(
    end,
  )}`;
};

export const prepareChatHtmlContent = (raw: string) => {
  if (!raw?.trim()) {
    return '';
  }

  let html = stripIncompleteTrailingTag(raw.trim());
  html = html.replace(/&lt;(\/?[a-z][^&]*?)&gt;/gi, '<$1>');
  html = convertMarkdownHeadings(html);
  html = wrapPrefixText(html);
  html = convertNumberedParagraphs(html);
  html = wrapOrphanListItems(html);
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  return html;
};
