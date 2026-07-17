import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fontFamily, responsiveWidth } from '../constant/theme';
import {
  ChatSection,
  getStreamingDisplayText,
  parseMarkdownAnswer,
} from '../utils/astrologerChatMarkdown';
import FormattedMarkdownText from './FormattedMarkdownText';
import TypewriterText from './TypewriterText';

type StreamingMarkdownAnswerProps = {
  text: string;
  active?: boolean;
  textColor: string;
  onProgress?: () => void;
  onComplete?: () => void;
};

const MarkdownSection = ({
  section,
  textColor,
  sectionKey,
}: {
  section: ChatSection;
  textColor: string;
  sectionKey: string;
}) => (
  <View style={styles.sectionBlock}>
    {section.heading ? (
      <FormattedMarkdownText
        text={section.heading}
        color={textColor}
        style={styles.sectionHeading}
      />
    ) : null}
    {section.paragraph ? (
      <FormattedMarkdownText
        text={section.paragraph}
        color={textColor}
        style={styles.paragraphText}
      />
    ) : null}
    {section.bullets?.map((bullet, bulletIndex) => (
      <View key={`${sectionKey}-bullet-${bulletIndex}`} style={styles.bulletRow}>
        <Text style={[styles.bulletDot, { color: textColor }]}>•</Text>
        <FormattedMarkdownText
          text={bullet}
          color={textColor}
          style={styles.bulletText}
        />
      </View>
    ))}
  </View>
);

const MarkdownAnswerBody = ({
  source,
  textColor,
}: {
  source: string;
  textColor: string;
}) => {
  const parsed = useMemo(() => parseMarkdownAnswer(source, false), [source]);

  if (!source.trim()) {
    return null;
  }

  return (
    <View style={styles.bodyWrap}>
      {parsed.sections.map((section, index) => (
        <MarkdownSection
          key={`section-${index}`}
          section={section}
          textColor={textColor}
          sectionKey={`section-${index}`}
        />
      ))}
    </View>
  );
};

/** Static (non-streaming) markdown renderer for history / completed answers. */
export const MarkdownAnswer = ({
  text,
  textColor,
}: {
  text: string;
  textColor: string;
}) => <MarkdownAnswerBody source={text} textColor={textColor} />;

/**
 * Smooth typewriter while streaming.
 * Avoids full markdown re-parse on each tick (that caused blank/flicker).
 */
const StreamingMarkdownAnswer = ({
  text,
  active = true,
  textColor,
  onProgress,
  onComplete,
}: StreamingMarkdownAnswerProps) => (
  <TypewriterText
    text={text}
    active={active}
    onProgress={onProgress}
    onComplete={onComplete}
    renderContent={visibleText => {
      const display = getStreamingDisplayText(visibleText);
      const withCaret = active ? `${display}|` : display;
      if (!withCaret.trim() || withCaret === '|') {
        return (
          <Text style={[styles.streamingText, { color: textColor, opacity: 0.55 }]}>
            |
          </Text>
        );
      }

      return (
        <FormattedMarkdownText
          text={withCaret}
          color={textColor}
          style={styles.streamingText}
        />
      );
    }}
  />
);

const styles = StyleSheet.create({
  bodyWrap: {
    marginBottom: responsiveWidth('1.5'),
  },
  sectionBlock: {
    marginBottom: responsiveWidth('1.5'),
  },
  sectionHeading: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    lineHeight: 20,
    marginBottom: responsiveWidth('1'),
  },
  paragraphText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
    marginBottom: responsiveWidth('0.5'),
  },
  streamingText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 21,
    marginBottom: responsiveWidth('1.5'),
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  bulletDot: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 1,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
  },
});

export default StreamingMarkdownAnswer;
