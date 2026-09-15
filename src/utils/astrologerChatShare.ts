import { Platform, Share } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { ChatSection } from './astrologerChatMarkdown';
import { isHtmlContent, prepareChatHtmlContent } from './astrologerHtmlContent';

type AssistantShareSource = {
  title?: string;
  rawText?: string;
  streamingText?: string;
  sections?: ChatSection[];
};

const htmlToPlainText = (html: string) =>
  String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(h[1-6]|p|div|tr|li|blockquote|ol|ul)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^[ \t]*#{1,6}[ \t]+/gm, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const markdownToPlainText = (text: string) =>
  String(text || '')
    .replace(/^[ \t]*#{1,6}[ \t]+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^[ \t]*[-*•]\s+/gm, '• ')
    .trim();

const sectionsToPlainText = (title?: string, sections?: ChatSection[]) => {
  const parts: string[] = [];
  if (title?.trim()) {
    parts.push(title.trim());
  }
  sections?.forEach(section => {
    if (section.heading?.trim()) {
      parts.push(section.heading.trim());
    }
    if (section.paragraph?.trim()) {
      parts.push(section.paragraph.trim());
    }
    section.bullets?.forEach(bullet => {
      if (bullet?.trim()) {
        parts.push(`• ${bullet.trim()}`);
      }
    });
  });
  return parts.join('\n\n').trim();
};

export const getAssistantShareText = (source: AssistantShareSource) => {
  const raw = (source.rawText || source.streamingText || '').trim();
  if (raw) {
    return isHtmlContent(raw)
      ? htmlToPlainText(prepareChatHtmlContent(raw))
      : markdownToPlainText(raw);
  }
  return sectionsToPlainText(source.title, source.sections);
};

export const copyChatAnswer = async (text: string) => {
  Clipboard.setString(text);
};

export const shareChatAnswer = async (text: string) => {
  if (Platform.OS === 'android') {
    await Share.share({ message: text, title: 'Astrodha.Ai' });
    return;
  }
  await Share.share({ message: text });
};
