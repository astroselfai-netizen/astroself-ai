import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import {
  getComboDetailCache,
  getComboDetailCacheSync,
  makeComboDetailCacheKey,
  setComboDetailCache,
} from '../../utils/astrologerCombosCache';

const NAVY = '#1A3673';

type ComboDetailKind =
  | 'transit'
  | 'transit_analysis'
  | 'antar_dasha'
  | 'dos_donts'
  | 'the_inner_you';

type RootStackParamList = {
  AstrologerComboDetailScreen: {
    title: string;
    kind: ComboDetailKind;
    clientId?: string;
    heading?: string;
    bullets?: string[];
    collection?: string;
    pipeline?: Array<Record<string, unknown>>;
  };
};

const fullScreenContainerStyle = {
  backgroundColor: 'transparent' as const,
};

const fullScreenSubContainerStyle = {
  backgroundColor: 'transparent' as const,
  marginBottom: 0,
  borderBottomLeftRadius: 0,
  borderBottomRightRadius: 0,
  overflow: 'visible' as const,
};

const isHtmlContent = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value);

const preprocessMarkdownAnswer = (answer: string) =>
  answer
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>');

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

  const body = payload as { data?: unknown };
  const data = body.data;

  if (Array.isArray(data)) {
    const parts = data
      .map(item => {
        if (typeof item === 'string') {
          return item.trim();
        }
        if (item && typeof item === 'object' && 'details' in item) {
          return normalizeDetails((item as { details?: unknown }).details);
        }
        return '';
      })
      .filter(Boolean);

    return parts.join('\n\n').trim();
  }

  if (data && typeof data === 'object' && 'details' in data) {
    return normalizeDetails((data as { details?: unknown }).details);
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
      }),
    [clientId, collection, heading, kind, pipeline, title],
  );
  const cachedDetail =
    kind === 'transit' ? null : getComboDetailCacheSync(detailCacheKey);

  const [loading, setLoading] = useState(
    kind !== 'transit' && !cachedDetail?.content,
  );
  const [content, setContent] = useState(cachedDetail?.content || '');
  const [errorText, setErrorText] = useState('');

  const isDark = theme === 'dark';
  const textPrimary = isDark ? colors.themeTextWhite : NAVY;
  const textMuted = isDark ? 'rgba(255,255,255,0.65)' : '#6B7280';
  const cardBg = isDark ? colors.cardBackground : colors.white;
  const cardBorder = isDark ? 'rgba(255,255,255,0.18)' : '#C5D3EA';
  const contentColor = textPrimary;
  const backBtnBg = isDark ? 'rgba(255,255,255,0.12)' : '#E8EEF7';
  const contentWidth = Math.max(0, windowWidth - responsiveWidth('14'));

  const htmlBaseStyle = useMemo(
    () => ({
      color: contentColor,
      fontSize: 13,
      lineHeight: 20,
      fontFamily: fontFamily.regular,
    }),
    [contentColor],
  );

  const htmlTagsStyles = useMemo(
    () => ({
      body: { color: contentColor },
      h1: {
        color: NAVY,
        fontSize: 15,
        fontFamily: fontFamily.bold,
        marginBottom: 8,
      },
      h2: {
        color: NAVY,
        fontSize: 14,
        fontFamily: fontFamily.bold,
        marginTop: 10,
        marginBottom: 2,
      },
      h3: {
        color: NAVY,
        fontSize: 13,
        fontFamily: fontFamily.semiBold,
        marginTop: 4,
        marginBottom: 4,
      },
      ol: { marginTop: 0, marginBottom: 0, paddingLeft: 18 },
      ul: { marginTop: 0, marginBottom: 0, paddingLeft: 18 },
      li: { marginBottom: 8, color: contentColor },
      p: {
        marginTop: 0,
        marginBottom: 3,
        color: contentColor,
        fontSize: 13,
        lineHeight: 20,
      },
      strong: {
        fontFamily: fontFamily.bold,
        color: contentColor,
      },
    }),
    [contentColor],
  );

  const loadContent = useCallback(
    async (options?: { silent?: boolean }) => {
      if (kind === 'transit') {
        setLoading(false);
        setErrorText('');
        setContent('');
        return;
      }

      if (!options?.silent) {
        setLoading(true);
      }
      setErrorText('');
      try {
        let nextContent = '';

        if (kind === 'transit_analysis') {
          const response = await userService.getAstrologerTransitHeadingReport(
            clientId,
            heading || title,
          );
          nextContent = response?.answer?.trim() || 'No details available.';
        } else if (!collection || !pipeline?.length) {
          nextContent = 'Details not available for this combination.';
        } else {
          const response = await userService.getAstrologerComboContent(
            collection,
            pipeline,
          );
          const extracted = extractComboContent(response);
          nextContent = extracted || 'No details available.';
        }

        setContent(nextContent);
        if (nextContent) {
          await setComboDetailCache(detailCacheKey, nextContent);
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Failed to load details.';
        if (!options?.silent) {
          setErrorText(message);
          setContent('');
        }
      } finally {
        setLoading(false);
      }
    },
    [
      clientId,
      collection,
      detailCacheKey,
      heading,
      kind,
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
  }, [detailCacheKey, kind, loadContent]);

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

    if (isHtmlContent(preparedContent) || kind === 'transit_analysis') {
      return (
        <RenderHTML
          contentWidth={contentWidth}
          source={{ html: preparedContent }}
          baseStyle={htmlBaseStyle}
          tagsStyles={htmlTagsStyles}
          defaultTextProps={{ selectable: false }}
          systemFonts={[fontFamily.regular, fontFamily.bold]}
        />
      );
    }

    return (
      <Text style={[styles.bodyText, { color: contentColor }]}>{content}</Text>
    );
  };

  return (
    <MainContainer
      safeBottom
      containerStyle={fullScreenContainerStyle}
      subContainerStyle={fullScreenSubContainerStyle}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: backBtnBg }]}
          activeOpacity={0.8}
        >
          <Image
            source={require('../../assets/icons/back.png')}
            style={[styles.backIcon, { tintColor: textPrimary }]}
          />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.headerTitle, { color: textPrimary }]} numberOfLines={3}>
            {title || 'Details'}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={textPrimary} />
        </View>
      ) : errorText ? (
        <View style={styles.centerState}>
          <Text style={[styles.emptyText, { color: textMuted }]}>{errorText}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadContent} activeOpacity={0.85}>
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: responsiveWidth('4'),
    paddingBottom: responsiveWidth('3'),
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: 8,
    paddingTop: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    lineHeight: 22,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: responsiveWidth('4'),
    paddingBottom: responsiveWidth('6'),
  },
  contentCard: {
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
