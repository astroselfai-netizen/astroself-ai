import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import RenderHTML from 'react-native-render-html';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainContainer } from '../../components/common/mainContainer';
import { fontFamily, responsiveWidth } from '../../constant/theme';
import { useTheme } from '../../context/ThemeContext';
import UserService from '../../services/user/user.service';
import { goToAstrologerHome } from '../../utils/navigationRef';

const NAVY = '#1A3673';

type RootStackParamList = {
  AstrologerNotificationDetailScreen: {
    title: string;
    heading?: string;
    collection: string;
    pipeline: Array<Record<string, unknown>>;
  };
};

const fullScreenContainerStyle = {
  backgroundColor: 'transparent' as const,
  overflow: 'hidden' as const,
};

const fullScreenSubContainerStyle = {
  backgroundColor: 'transparent' as const,
  marginBottom: 0,
  borderBottomLeftRadius: 0,
  borderBottomRightRadius: 0,
  overflow: 'hidden' as const,
};

const isHtmlContent = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value);

type HtmlBlock =
  | { type: 'html'; html: string }
  | { type: 'ol'; items: string[]; start: number };

const stripHtmlWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

const extractListItems = (listInnerHtml: string): string[] =>
  [...listInnerHtml.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map(match =>
    stripHtmlWhitespace(match[1] || ''),
  );

const parseOlStart = (olAttributes: string): number => {
  const startMatch = olAttributes.match(/\bstart\s*=\s*["']?(\d+)/i);
  const parsed = startMatch ? Number(startMatch[1]) : 1;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

const splitHtmlOrderedLists = (html: string): HtmlBlock[] => {
  if (!html) {
    return [];
  }

  const blocks: HtmlBlock[] = [];
  const olRegex = /<ol\b([^>]*)>([\s\S]*?)<\/ol>/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = olRegex.exec(html)) !== null) {
    const before = html.slice(lastIndex, match.index).trim();
    if (before) {
      blocks.push({ type: 'html', html: before });
    }

    const items = extractListItems(match[2] || '');
    if (items.length > 0) {
      blocks.push({
        type: 'ol',
        items,
        start: parseOlStart(match[1] || ''),
      });
    } else if (match[0].trim()) {
      blocks.push({ type: 'html', html: match[0] });
    }

    lastIndex = match.index + match[0].length;
  }

  const rest = html.slice(lastIndex).trim();
  if (rest) {
    blocks.push({ type: 'html', html: rest });
  }

  return blocks.length > 0 ? blocks : [{ type: 'html', html }];
};

const preprocessMarkdownAnswer = (raw: string): string => {
  if (!raw) {
    return '';
  }

  if (
    /<(p|div|ul|ol|h[1-6]|table|strong|span)[^>]*>/i.test(raw) &&
    !raw.includes('## ') &&
    !raw.includes('### ') &&
    !/^[\s]*[-*•]\s+/m.test(raw)
  ) {
    return raw;
  }

  let text = raw;
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  text = text.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  text = text.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  const lines = text.split('\n');
  const resultLines: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const bulletMatch = line.match(/^[\s]*[-*•]\s+(.*)$/);

    if (bulletMatch) {
      if (!inList) {
        resultLines.push('<ul>');
        inList = true;
      }
      resultLines.push(`<li>${bulletMatch[1]}</li>`);
    } else {
      if (inList) {
        resultLines.push('</ul>');
        inList = false;
      }
      const trimmed = line.trim();
      if (trimmed.length > 0) {
        if (!/^<h[1-6]>.*<\/h[1-6]>$/.test(trimmed)) {
          resultLines.push(`<p>${trimmed}</p>`);
        } else {
          resultLines.push(trimmed);
        }
      }
    }
  }

  if (inList) {
    resultLines.push('</ul>');
  }

  return resultLines.join('\n');
};

const normalizeDetails = (details: unknown): string => {
  if (details == null) {
    return '';
  }

  if (typeof details === 'string') {
    const trimmed = details.trim();
    if (!trimmed) {
      return '';
    }
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        return normalizeDetails(JSON.parse(trimmed));
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }

  if (Array.isArray(details)) {
    const items = details
      .map(entry => normalizeDetails(entry))
      .filter(Boolean);
    if (!items.length) {
      return '';
    }
    const alreadyHtml = items.some(item => /<\/?[a-z][\s\S]*>/i.test(item));
    if (alreadyHtml) {
      return `<ol>${items
        .map(item => (item.includes('<li') ? item : `<li>${item}</li>`))
        .join('')}</ol>`;
    }
    return `<ol>${items.map(item => `<li>${item}</li>`).join('')}</ol>`;
  }

  if (typeof details === 'object') {
    const obj = details as Record<string, unknown>;
    if ('details' in obj) {
      return normalizeDetails(obj.details);
    }
    if (typeof obj.text === 'string' && obj.text.trim()) {
      return obj.text.trim();
    }
    if (typeof obj.content === 'string' && obj.content.trim()) {
      return obj.content.trim();
    }
  }

  return String(details).trim();
};

const extractNotificationContent = (payload: unknown): string => {
  if (!payload) {
    return '';
  }

  if (typeof payload === 'string') {
    return payload.trim();
  }

  if (typeof payload !== 'object') {
    return String(payload).trim();
  }

  const obj = payload as Record<string, unknown>;
  if ('details' in obj) {
    const fromDetails = normalizeDetails(obj.details);
    if (fromDetails) {
      return fromDetails;
    }
  }

  const data = obj.data;
  if (typeof data === 'string' && data.trim()) {
    return data.trim();
  }

  if (Array.isArray(data)) {
    const parts = data
      .map(item => {
        if (typeof item === 'string') {
          return item.trim();
        }
        if (item && typeof item === 'object') {
          const itemObj = item as Record<string, unknown>;
          if ('details' in itemObj) {
            return normalizeDetails(itemObj.details);
          }
          if (typeof itemObj.insights === 'string' && itemObj.insights.trim()) {
            return itemObj.insights.trim();
          }
          if (typeof itemObj.answer === 'string' && itemObj.answer.trim()) {
            return itemObj.answer.trim();
          }
          if (typeof itemObj.content === 'string' && itemObj.content.trim()) {
            return itemObj.content.trim();
          }
        }
        return '';
      })
      .filter(Boolean);

    if (parts.length > 0) {
      return parts.join('\n\n').trim();
    }
  }

  if (data && typeof data === 'object') {
    const dataObj = data as Record<string, unknown>;
    if ('details' in dataObj) {
      const nestedDetails = normalizeDetails(dataObj.details);
      if (nestedDetails) {
        return nestedDetails;
      }
    }
    if (typeof dataObj.insights === 'string' && dataObj.insights.trim()) {
      return dataObj.insights.trim();
    }
    if (typeof dataObj.answer === 'string' && dataObj.answer.trim()) {
      return dataObj.answer.trim();
    }
    if (typeof dataObj.content === 'string' && dataObj.content.trim()) {
      return dataObj.content.trim();
    }
  }

  if (typeof obj.insights === 'string' && obj.insights.trim()) {
    return obj.insights.trim();
  }
  if (typeof obj.answer === 'string' && obj.answer.trim()) {
    return obj.answer.trim();
  }
  if (typeof obj.content === 'string' && obj.content.trim()) {
    return obj.content.trim();
  }

  return '';
};

const AstrologerNotificationDetailScreen = () => {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList>>();
  const route =
    useRoute<RouteProp<RootStackParamList, 'AstrologerNotificationDetailScreen'>>();
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const userService = useMemo(() => new UserService(), []);

  const {
    title,
    heading = '',
    collection,
    pipeline,
  } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [errorText, setErrorText] = useState('');

  const isDark = theme === 'dark';
  const textPrimary = isDark ? colors.themeTextWhite : NAVY;
  const textMuted = isDark ? 'rgba(255,255,255,0.65)' : '#6B7280';
  const cardBg = isDark ? colors.cardBackground : colors.white;
  const cardBorder = isDark ? 'rgba(255,255,255,0.18)' : '#C5D3EA';
  const headerControlBg = 'rgba(255, 255, 255, 0.12)';
  const contentWidth = Math.max(0, windowWidth - responsiveWidth('14'));

  const htmlBaseStyle = useMemo(
    () => ({
      color: textPrimary,
      fontSize: 13,
      lineHeight: 21,
      fontFamily: fontFamily.regular,
      maxWidth: '100%' as const,
    }),
    [textPrimary],
  );

  const htmlTagsStyles = useMemo(
    () => ({
      body: { color: textPrimary },
      h1: {
        color: NAVY,
        fontSize: 16,
        fontFamily: fontFamily.semiBold,
        marginBottom: 10,
      },
      h2: {
        color: NAVY,
        fontSize: 14,
        fontFamily: fontFamily.semiBold,
        marginTop: 10,
        marginBottom: 6,
      },
      h3: {
        color: NAVY,
        fontSize: 13,
        fontFamily: fontFamily.semiBold,
        marginTop: 6,
        marginBottom: 4,
      },
      ol: { marginTop: 4, marginBottom: 6, paddingLeft: 36 },
      ul: { marginTop: 4, marginBottom: 6, paddingLeft: 22 },
      li: {
        marginBottom: 8,
        color: textPrimary,
        fontSize: 13,
        lineHeight: 20,
        fontFamily: fontFamily.regular,
      },
      p: {
        marginTop: 0,
        marginBottom: 8,
        color: textPrimary,
        fontSize: 13,
        lineHeight: 20,
        fontFamily: fontFamily.regular,
      },
      strong: {
        fontFamily: fontFamily.semiBold,
        color: textPrimary,
      },
    }),
    [textPrimary],
  );

  const htmlListItemTagsStyles = useMemo(
    () => ({
      ...htmlTagsStyles,
      p: {
        ...htmlTagsStyles.p,
        marginTop: 0,
        marginBottom: 0,
      },
    }),
    [htmlTagsStyles],
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
          fontSize: 13,
          lineHeight: 20,
          fontFamily: fontFamily.regular,
          color: textPrimary,
        },
      },
      ul: {
        enableDynamicMarkerBoxWidth: true,
      },
    }),
    [textPrimary],
  );

  const loadContent = useCallback(async () => {
    if (!collection || !pipeline?.length) {
      setErrorText('Details not available for this notification.');
      setContent('');
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorText('');
    try {
      const response = await userService.getAstrologerComboContent(
        collection,
        pipeline,
      );
      const extracted = extractNotificationContent(response);
      setContent(extracted || 'No details available.');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to load details.';
      setErrorText(message);
      setContent('');
    } finally {
      setLoading(false);
    }
  }, [collection, pipeline, userService]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const handleBack = () => {
    const state = navigation.getState();
    const routes = state?.routes || [];
    const previous = routes[routes.length - 2];
    const previousName = previous?.name;

    if (
      !navigation.canGoBack() ||
      previousName === 'SplashScreen' ||
      previousName === 'Login'
    ) {
      goToAstrologerHome();
      return;
    }

    navigation.goBack();
  };

  const renderBody = () => {
    if (!content) {
      return (
        <Text style={[styles.emptyText, { color: textMuted }]}>
          No details available.
        </Text>
      );
    }

    const preparedContent = preprocessMarkdownAnswer(content);
    const blocks = splitHtmlOrderedLists(
      isHtmlContent(preparedContent)
        ? preparedContent
        : `<p>${preparedContent}</p>`,
    );

    const renderHtml = (html: string, width: number, isListItem = false) => (
      <RenderHTML
        contentWidth={width}
        source={{ html }}
        baseStyle={htmlBaseStyle}
        tagsStyles={isListItem ? htmlListItemTagsStyles : htmlTagsStyles}
        renderersProps={htmlRenderersProps}
        defaultTextProps={{ selectable: false }}
        systemFonts={[fontFamily.regular, fontFamily.bold, fontFamily.semiBold]}
      />
    );

    return blocks.map((block, blockIndex) => {
      if (block.type !== 'ol') {
        return (
          <View key={`html-${blockIndex}`}>
            {renderHtml(block.html, contentWidth)}
          </View>
        );
      }

      const lastNumber = block.start + block.items.length - 1;
      const numberWidth = Math.max(28, String(lastNumber).length * 10 + 8);

      return (
        <View key={`ol-${blockIndex}`} style={styles.olWrap}>
          {block.items.map((item, itemIndex) => (
            <View key={`ol-${blockIndex}-${itemIndex}`} style={styles.olRow}>
              <Text
                style={[
                  styles.olNumber,
                  { color: textPrimary, width: numberWidth },
                ]}
              >
                {block.start + itemIndex}.
              </Text>
              <View style={styles.olBody}>
                {isHtmlContent(item) ? (
                  renderHtml(
                    item,
                    Math.max(0, contentWidth - numberWidth - 8),
                    true,
                  )
                ) : (
                  <Text style={[styles.bodyText, { color: textPrimary }]}>
                    {item}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      );
    });
  };

  return (
    <MainContainer
      safeBottom
      containerStyle={fullScreenContainerStyle}
      subContainerStyle={fullScreenSubContainerStyle}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <ImageBackground
        source={require('../../assets/image/DarkBackground.png')}
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 12) + 8,
            width: windowWidth,
          },
        ]}
        imageStyle={styles.headerImage}
      >
        <TouchableOpacity
          onPress={handleBack}
          style={[styles.backBtn, { backgroundColor: headerControlBg }]}
          activeOpacity={0.8}
        >
          <Image
            source={require('../../assets/icons/back.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle} numberOfLines={3}>
            {heading || title || 'Notification'}
          </Text>
        </View>
        <View style={styles.headerRightSpacer} />
      </ImageBackground>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={textPrimary} />
        </View>
      ) : errorText ? (
        <View style={styles.centerState}>
          <Text style={[styles.emptyText, { color: textMuted }]}>{errorText}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={loadContent}
            activeOpacity={0.85}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.contentCard,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            {renderBody()}
          </View>
        </ScrollView>
      )}
    </MainContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    alignSelf: 'stretch',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: responsiveWidth('4'),
    paddingBottom: responsiveWidth('3.5'),
    gap: 12,
  },
  headerImage: {
    resizeMode: 'cover',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  backIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
    tintColor: '#FFFFFF',
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    paddingRight: 8,
    paddingTop: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
    lineHeight: 22,
    color: '#FFFFFF',
  },
  headerRightSpacer: {
    width: 40,
    height: 40,
    flexShrink: 0,
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: responsiveWidth('4'),
    paddingTop: responsiveWidth('4'),
    paddingBottom: responsiveWidth('6'),
  },
  contentCard: {
    alignSelf: 'stretch',
    width: '100%',
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: responsiveWidth('8'),
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  bodyText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
  },
  olWrap: {
    width: '100%',
  },
  olRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  olNumber: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fontFamily.regular,
    textAlign: 'right',
    marginRight: 8,
  },
  olBody: {
    flex: 1,
    minWidth: 0,
  },
  retryBtn: {
    backgroundColor: NAVY,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
  },
});

export default AstrologerNotificationDetailScreen;
