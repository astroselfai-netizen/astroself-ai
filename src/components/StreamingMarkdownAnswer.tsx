import React, { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { fontFamily, responsiveWidth } from '../constant/theme';
import {
  ChatSection,
  getStreamingDisplayText,
  parseMarkdownAnswer,
} from '../utils/astrologerChatMarkdown';
import {
  isHtmlContent,
  prepareChatHtmlContent,
} from '../utils/astrologerHtmlContent';
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

const HtmlAnswerBody = ({
  source,
  textColor,
}: {
  source: string;
  textColor: string;
}) => {
  const { width } = useWindowDimensions();
  const html = useMemo(() => prepareChatHtmlContent(source), [source]);
  const contentWidth = Math.max(0, width - responsiveWidth('22'));

  const htmlBaseStyle = useMemo(
    () => ({
      color: textColor,
      fontSize: 14,
      lineHeight: 21,
      fontFamily: fontFamily.regular,
    }),
    [textColor],
  );

  const htmlTagsStyles = useMemo(
    () => ({
      h1: {
        color: textColor,
        fontSize: 16,
        fontFamily: fontFamily.bold,
        marginTop: 0,
        marginBottom: 8,
      },
      h2: {
        color: textColor,
        fontSize: 15,
        fontFamily: fontFamily.bold,
        marginTop: 8,
        marginBottom: 6,
      },
      h3: {
        color: textColor,
        fontSize: 14,
        fontFamily: fontFamily.bold,
        marginTop: 0,
        marginBottom: 8,
      },
      p: {
        color: textColor,
        fontSize: 14,
        lineHeight: 21,
        fontFamily: fontFamily.regular,
        marginTop: 0,
        marginBottom: 8,
      },
      strong: {
        color: textColor,
        fontFamily: fontFamily.bold,
      },
      ol: {
        marginTop: 4,
        marginBottom: 8,
        paddingLeft: 8,
      },
      ul: {
        marginTop: 4,
        marginBottom: 8,
        paddingLeft: 8,
      },
      li: {
        color: textColor,
        fontSize: 14,
        lineHeight: 21,
        fontFamily: fontFamily.regular,
        marginBottom: 6,
      },
    }),
    [textColor],
  );

  const htmlRenderersProps = useMemo(
    () => ({
      ol: {
        enableDynamicMarkerBoxWidth: true,
        markerBoxStyle: {
          paddingRight: 8,
          alignItems: 'flex-end' as const,
        },
        markerTextStyle: {
          fontSize: 14,
          lineHeight: 21,
          fontFamily: fontFamily.regular,
          color: textColor,
        },
      },
      ul: {
        enableDynamicMarkerBoxWidth: true,
      },
    }),
    [textColor],
  );

  if (!html) {
    return null;
  }

  return (
    <View style={styles.bodyWrap}>
      <RenderHTML
        contentWidth={contentWidth}
        source={{ html }}
        baseStyle={htmlBaseStyle}
        tagsStyles={htmlTagsStyles as any}
        renderersProps={htmlRenderersProps}
        defaultTextProps={{ selectable: false }}
        systemFonts={[fontFamily.regular, fontFamily.bold, fontFamily.semiBold]}
      />
    </View>
  );
};

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

  if (isHtmlContent(source)) {
    return <HtmlAnswerBody source={source} textColor={textColor} />;
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

const StreamingMarkdownAnswer = ({
  text,
  active = true,
  textColor,
  onProgress,
  onComplete,
}: StreamingMarkdownAnswerProps) => {
  const htmlSource = isHtmlContent(text);

  if (htmlSource) {
    return <HtmlAnswerBody source={text} textColor={textColor} />;
  }

  return (
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
};

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
