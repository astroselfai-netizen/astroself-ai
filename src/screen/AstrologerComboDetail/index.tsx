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
import Toast from 'react-native-toast-message';
import { MainContainer } from '../../components/common/mainContainer';
import { fontFamily, responsiveWidth } from '../../constant/theme';
import { useTheme } from '../../context/ThemeContext';
import UserService from '../../services/user/user.service';
import {
  getComboDetailCache,
  getComboDetailCacheSync,
  makeComboDetailCacheKey,
  setComboDetailCache,
} from '../../utils/astrologerCombosCache';

const NAVY = '#1A3673';

type ComboDetailKind =
  | 'next_week'
  | 'transit'
  | 'transit_analysis'
  | 'antar_dasha'
  | 'dos_donts'
  | 'the_inner_you'
  | 'combinations';

type RootStackParamList = {
  AstrologerComboDetailScreen: {
    title: string;
    kind: ComboDetailKind;
    clientId?: string;
    heading?: string;
    bullets?: string[];
    collection?: string;
    pipeline?: Array<Record<string, unknown>>;
    mode?: 'general' | 'personalized';
    insights?: string;
    dataType?: string;
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

const preprocessMarkdownAnswer = (raw: string): string => {
  if (!raw) {
    return '';
  }

  // If it's already structured HTML without raw markdown headings/bullets
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
    return details.trim();
  }

  if (Array.isArray(details)) {
    return details
      .map(entry => normalizeDetails(entry))
      .filter(Boolean)
      .join('\n\n')
      .trim();
  }

  if (typeof details === 'object' && 'details' in details) {
    return normalizeDetails((details as { details?: unknown }).details);
  }

  return String(details).trim();
};

const extractComboContent = (payload: unknown): string => {
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

  if (typeof obj.insights === 'string' && obj.insights.trim()) {
    return obj.insights.trim();
  }
  if (typeof obj.answer === 'string' && obj.answer.trim()) {
    return obj.answer.trim();
  }
  if (typeof obj.content === 'string' && obj.content.trim()) {
    return obj.content.trim();
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
          if (typeof itemObj.insights === 'string' && itemObj.insights.trim()) {
            return itemObj.insights.trim();
          }
          if (typeof itemObj.answer === 'string' && itemObj.answer.trim()) {
            return itemObj.answer.trim();
          }
          if (typeof itemObj.content === 'string' && itemObj.content.trim()) {
            return itemObj.content.trim();
          }
          if ('details' in itemObj) {
            return normalizeDetails(itemObj.details);
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
    if (typeof dataObj.insights === 'string' && dataObj.insights.trim()) {
      return dataObj.insights.trim();
    }
    if (typeof dataObj.answer === 'string' && dataObj.answer.trim()) {
      return dataObj.answer.trim();
    }
    if (typeof dataObj.content === 'string' && dataObj.content.trim()) {
      return dataObj.content.trim();
    }
    if ('details' in dataObj) {
      return normalizeDetails(dataObj.details);
    }
  }

  if ('details' in obj) {
    return normalizeDetails(obj.details);
  }

  return '';
};

const AstrologerComboDetailScreen = () => {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList>>();
  const route =
    useRoute<RouteProp<RootStackParamList, 'AstrologerComboDetailScreen'>>();
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const userService = useMemo(() => new UserService(), []);

  const {
    title,
    kind,
    clientId = '',
    heading = '',
    bullets = [],
    collection,
    pipeline,
    mode,
    insights,
    dataType,
  } = route.params || {};

  const detailCacheKey = useMemo(
    () =>
      makeComboDetailCacheKey({
        kind,
        clientId,
        heading,
        title,
        collection,
        pipeline,
        mode,
        dataType,
      }),
    [clientId, collection, dataType, heading, kind, mode, pipeline, title],
  );

  const cachedDetail =
    kind === 'transit' ? null : getComboDetailCacheSync(detailCacheKey);

  const initialContent = insights || cachedDetail?.content || '';

  const [loading, setLoading] = useState(
    kind !== 'transit' && !initialContent,
  );
  const [refreshing, setRefreshing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [errorText, setErrorText] = useState('');

  const isDark = theme === 'dark';
  const textPrimary = isDark ? colors.themeTextWhite : NAVY;
  const textMuted = isDark ? 'rgba(255,255,255,0.65)' : '#6B7280';
  const cardBg = isDark ? colors.cardBackground : colors.white;
  const cardBorder = isDark ? 'rgba(255,255,255,0.18)' : '#C5D3EA';
  const contentColor = textPrimary;
  const headerControlBg = 'rgba(255, 255, 255, 0.12)';
  const contentWidth = Math.max(0, windowWidth - responsiveWidth('14'));

  const htmlBaseStyle = useMemo(
    () => ({
      color: contentColor,
      fontSize: 13,
      lineHeight: 21,
      fontFamily: fontFamily.regular,
      maxWidth: '100%' as const,
    }),
    [contentColor],
  );

  const htmlTagsStyles = useMemo(
    () => ({
      body: { color: contentColor },
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
      ol: { marginTop: 4, marginBottom: 6, paddingLeft: 18 },
      ul: { marginTop: 4, marginBottom: 6, paddingLeft: 18 },
      li: {
        marginBottom: 8,
        color: contentColor,
        fontSize: 13,
        lineHeight: 20,
        fontFamily: fontFamily.regular,
      },
      p: {
        marginTop: 0,
        marginBottom: 8,
        color: contentColor,
        fontSize: 13,
        lineHeight: 20,
        fontFamily: fontFamily.regular,
      },
      strong: {
        fontFamily: fontFamily.semiBold,
        color: contentColor,
      },
    }),
    [contentColor],
  );

  const loadContent = useCallback(
    async (options?: { silent?: boolean; force?: boolean }) => {
      if (kind === 'transit') {
        setLoading(false);
        setErrorText('');
        setContent('');
        return;
      }

      if (options?.force) {
        setRefreshing(true);
      } else if (!options?.silent) {
        setLoading(true);
      }
      setErrorText('');
      try {
        let nextContent = '';
        let refreshMessage = '';

        const isPersonalized = mode === 'personalized' || kind === 'next_week';

        if (isPersonalized && clientId) {
          const effectiveDataType =
            dataType ||
            (kind === 'next_week'
              ? 'next_week'
              : kind === 'antar_dasha'
              ? 'active_combinations'
              : kind === 'transit_analysis'
              ? 'transit_details_list'
              : kind === 'dos_donts'
              ? 'current_activity'
              : kind === 'the_inner_you'
              ? 'the_inner_you'
              : 'active_combinations');

          const response = await userService.generateAstrologerCustomCombination(
            clientId,
            effectiveDataType,
            heading || title,
            options?.force || false,
          );
          refreshMessage = String(response?.message || '').trim();

          const extracted = extractComboContent(response);
          nextContent = extracted || 'No details available.';
        } else if (kind === 'transit_analysis') {
          const response = await userService.getAstrologerTransitHeadingReport(
            clientId,
            heading || title,
          );
          nextContent = response?.answer?.trim() || 'No details available.';
        } else if (collection && pipeline?.length) {
          const response = await userService.getAstrologerComboContent(
            collection,
            pipeline,
          );
          const extracted = extractComboContent(response);
          nextContent = extracted || 'No details available.';
        } else if (clientId && (heading || title)) {
          const effectiveDataType =
            dataType || (kind === 'next_week' ? 'next_week' : 'active_combinations');
          const response = await userService.generateAstrologerCustomCombination(
            clientId,
            effectiveDataType,
            heading || title,
            options?.force || false,
          );
          refreshMessage = String(response?.message || '').trim();
          const extracted = extractComboContent(response);
          nextContent = extracted || 'No details available.';
        } else {
          nextContent = 'Details not available for this combination.';
        }

        setContent(nextContent);
        if (
          nextContent &&
          nextContent !== 'No details available.' &&
          nextContent !== 'Details not available for this combination.'
        ) {
          await setComboDetailCache(detailCacheKey, nextContent);
        }
        if (options?.force) {
          Toast.show({
            type: 'success',
            text1: refreshMessage || 'Prediction Refreshed',
            position: 'top',
            topOffset: 60,
            visibilityTime: refreshMessage ? 3500 : 2500,
            text1NumberOfLines: 3,
          });
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Failed to load details.';
        if (!options?.silent) {
          setErrorText(message);
          setContent('');
        }
        if (options?.force) {
          Toast.show({
            type: 'error',
            text1: 'Refresh Failed',
            text2: message,
            position: 'top',
            topOffset: 60,
            visibilityTime: 3000,
          });
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      clientId,
      collection,
      dataType,
      detailCacheKey,
      heading,
      kind,
      mode,
      pipeline,
      title,
      userService,
    ],
  );

  useEffect(() => {
    let cancelled = false;

    const hydrateAndLoad = async () => {
      if (kind === 'transit') {
        setLoading(false);
        setContent('');
        setErrorText('');
        return;
      }

      if (insights) {
        setContent(insights);
        setLoading(false);
        void setComboDetailCache(detailCacheKey, insights);
        void loadContent({ silent: true });
        return;
      }

      const memoryHit = getComboDetailCacheSync(detailCacheKey);
      if (memoryHit?.content) {
        setContent(memoryHit.content);
        setLoading(false);
        void loadContent({ silent: true });
        return;
      }

      const stored = await getComboDetailCache(detailCacheKey);
      if (cancelled) {
        return;
      }

      if (stored?.content) {
        setContent(stored.content);
        setLoading(false);
        void loadContent({ silent: true });
        return;
      }

      await loadContent();
    };

    void hydrateAndLoad();

    return () => {
      cancelled = true;
    };
  }, [detailCacheKey, insights, kind, loadContent]);

  const renderBody = () => {
    if (kind === 'transit') {
      if (!bullets.length) {
        return (
          <Text style={[styles.emptyText, { color: textMuted }]}>
            No details available.
          </Text>
        );
      }

      return bullets.map((bullet, index) => (
        <View key={`bullet-${index}`} style={styles.bulletRow}>
          <Text style={[styles.bulletDot, { color: textPrimary }]}>•</Text>
          <Text style={[styles.bulletText, { color: textPrimary }]}>{bullet}</Text>
        </View>
      ));
    }

    if (!content) {
      return (
        <Text style={[styles.emptyText, { color: textMuted }]}>
          No details available.
        </Text>
      );
    }

    const preparedContent = preprocessMarkdownAnswer(content);

    if (
      isHtmlContent(preparedContent) ||
      kind === 'transit_analysis' ||
      kind === 'next_week' ||
      mode === 'personalized'
    ) {
      return (
        <RenderHTML
          contentWidth={contentWidth}
          source={{ html: preparedContent }}
          baseStyle={htmlBaseStyle}
          tagsStyles={htmlTagsStyles}
          defaultTextProps={{ selectable: false }}
          systemFonts={[fontFamily.regular, fontFamily.bold, fontFamily.semiBold]}
        />
      );
    }

    return (
      <Text style={[styles.bodyText, { color: contentColor }]}>{content}</Text>
    );
  };

  const showRefreshButton =
    !!clientId && (mode === 'personalized' || kind === 'next_week');

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
          onPress={() => navigation.goBack()}
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
            {title || 'Details'}
          </Text>
        </View>
        {showRefreshButton ? (
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: headerControlBg }]}
            onPress={() => loadContent({ force: true })}
            disabled={refreshing || loading}
            activeOpacity={0.8}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Image
                source={require('../../assets/icons/recycle.png')}
                style={styles.refreshIcon}
              />
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.headerRightSpacer} />
        )}
      </ImageBackground>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={textPrimary} />
        </View>
      ) : errorText ? (
        <View style={styles.centerState}>
          <Text style={[styles.emptyText, { color: textMuted }]}>{errorText}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadContent()} activeOpacity={0.85}>
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
  refreshIcon: {
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
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingRight: 4,
  },
  bulletDot: {
    fontSize: 14,
    lineHeight: 20,
    marginRight: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
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

export default AstrologerComboDetailScreen;
