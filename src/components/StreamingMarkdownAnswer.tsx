import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fontFamily, responsiveWidth } from '../constant/theme';
import {
  ChatSection,
  getStreamingDisplayText,
  parseMarkdownAnswer,
} from '../utils/astrologerChatMarkdown';
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
      <Text style={[styles.sectionHeading, { color: textColor }]}>{section.heading}</Text>
    ) : null}
    {section.paragraph ? (
      <Text style={[styles.paragraphText, { color: textColor }]}>{section.paragraph}</Text>
    ) : null}
    {section.bullets?.map((bullet, bulletIndex) => (
      <View key={`${sectionKey}-bullet-${bulletIndex}`} style={styles.bulletRow}>
        <Text style={[styles.bulletDot, { color: textColor }]}>•</Text>
        <Text style={[styles.bulletText, { color: textColor }]}>{bullet}</Text>
      </View>
    ))}
  </View>
);

const MarkdownAnswerBody = ({
  source,
  textColor,
  forStreaming = false,
}: {
  source: string;
  textColor: string;
  forStreaming?: boolean;
}) => {
  const parsed = useMemo(
    () => parseMarkdownAnswer(source, forStreaming),
    [forStreaming, source],
  );

  if (!source.trim()) {
    return null;
  }

  return (
    <View style={styles.bodyWrap}>
      {parsed.title ? (
        <Text style={[styles.answerTitle, { color: textColor }]}>{parsed.title}</Text>
      ) : null}
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
    renderContent={visibleText => (
      <MarkdownAnswerBody
        source={getStreamingDisplayText(visibleText)}
        textColor={textColor}
        forStreaming
      />
    )}
  />
);

const styles = StyleSheet.create({
  bodyWrap: {
    marginBottom: responsiveWidth('1.5'),
  },
  answerTitle: {
    fontSize: 15,
    fontFamily: fontFamily.bold,
    lineHeight: 22,
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
