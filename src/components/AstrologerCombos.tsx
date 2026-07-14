import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import RenderHTML from 'react-native-render-html';
import { fontFamily, responsiveWidth } from '../constant/theme';
import UserService from '../services/user/user.service';

const NAVY = '#1A3673';
const GOLD = '#C5A370';

type ComboTab = 'transit' | 'transit_analysis' | 'combinations' | 'antar_dasha';

const COMBO_TAB_ORDER: ComboTab[] = [
  'combinations',
  'antar_dasha',
  'transit_analysis',
  'transit',
];

export const CLIENT_COMBO_SHORTCUTS: {
  tab: ComboTab;
  label: string;
  icon: string;
}[] = [
  { tab: 'antar_dasha', label: 'Antardasha Analysis/Report', icon: '⚡' },
  { tab: 'transit_analysis', label: 'Transit Analysis', icon: '▦' },
  { tab: 'transit', label: 'Transit Combinations', icon: '⬡' },
  { tab: 'combinations', label: 'Chart Combinations', icon: '◎' },
];

type TransitComboItem = {
  id: string;
  heading: string;
  subheading: string[];
};

type CombinationListItem = {
  id: string;
  heading: string;
  collection?: string;
  pipeline?: Array<Record<string, unknown>>;
};

type AstrologerCombosProps = {
  clientId: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textMuted: string;
  initialTab?: ComboTab;
  useParentScroll?: boolean;
};

const formatAsOfDate = (date: Date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${date.getFullYear()}`;
};

const getComboHeading = (item: Record<string, unknown>) =>
  String(item.heading ?? item.Heading ?? item.title ?? item.name ?? '').trim();

const extractComboListFromResponse = (
  response: { data?: unknown } | null | undefined,
): Array<Record<string, unknown>> => {
  if (!response) {
    return [];
  }

  const payload = response.data;
  if (Array.isArray(payload)) {
    return payload as Array<Record<string, unknown>>;
  }

  if (
    payload &&
    typeof payload === 'object' &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return (payload as { data: Array<Record<string, unknown>> }).data;
  }

  return [];
};

const mapComboListItem = (
  item: unknown,
  index: number,
  prefix: string,
): CombinationListItem => {
  if (typeof item === 'string') {
    return { id: `${prefix}-${index}`, heading: item.trim() };
  }

  if (!item || typeof item !== 'object') {
    return { id: `${prefix}-${index}`, heading: '' };
  }

  const record = item as Record<string, unknown>;
  return {
    id: `${prefix}-${index}`,
    heading: getComboHeading(record),
    collection: typeof record.collection === 'string' ? record.collection : undefined,
    pipeline: Array.isArray(record.pipeline)
      ? (JSON.parse(JSON.stringify(record.pipeline)) as Array<Record<string, unknown>>)
      : undefined,
  };
};

const isHtmlContent = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value);

const preprocessTransitAnswer = (answer: string) =>
  answer
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

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

const getTransitAnalysisContentId = (id: string) => `analysis-${id}`;

const AstrologerCombos = ({
  clientId,
  cardBg,
  cardBorder,
  textPrimary,
  textMuted,
  initialTab = 'combinations',
  useParentScroll = false,
}: AstrologerCombosProps) => {
  const { width: windowWidth } = useWindowDimensions();
  const userService = useMemo(() => new UserService(), []);
  const [comboTab, setComboTab] = useState<ComboTab>(initialTab);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [transitItems, setTransitItems] = useState<TransitComboItem[]>([]);
  const [combinationItems, setCombinationItems] = useState<CombinationListItem[]>([]);
  const [activeComboItems, setActiveComboItems] = useState<CombinationListItem[]>([]);
  const [expandedComboId, setExpandedComboId] = useState<string | null>(null);
  const [combosAsOfDate, setCombosAsOfDate] = useState(new Date());
  const [contentById, setContentById] = useState<Record<string, string>>({});
  const [contentLoadingId, setContentLoadingId] = useState<string | null>(null);

  const tabLabels = useMemo(
    () => ({
      combinations: `Combinations (${combinationItems.length})`,
      antar_dasha: `Antardasha Analysis (${activeComboItems.length})`,
      transit_analysis: `Transit Analysis (${transitItems.length})`,
      transit: 'Transit combinations',
    }),
    [transitItems.length, combinationItems.length, activeComboItems.length],
  );

  const contentWidth = Math.max(0, windowWidth - responsiveWidth('14'));
  const expandedContentColor = textPrimary;

  const htmlBaseStyle = useMemo(
    () => ({
      color: expandedContentColor,
      fontSize: 13,
      lineHeight: 20,
      fontFamily: fontFamily.regular,
    }),
    [expandedContentColor],
  );

  const htmlTagsStyles = useMemo(
    () => ({
      body: { color: expandedContentColor },
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
      li: { marginBottom: 8, color: expandedContentColor },
      p: {
        marginTop: 0,
        marginBottom: 3,
        color: expandedContentColor,
        fontSize: 13,
        lineHeight: 20,
      },
      strong: {
        fontFamily: fontFamily.bold,
        color: expandedContentColor,
      },
    }),
    [expandedContentColor],
  );

  const loadTransitCombos = useCallback(async (): Promise<TransitComboItem[]> => {
    try {
      const response = await userService.getAstrologerTransitResult(clientId);
      const items = extractComboListFromResponse(response).map((item, index) => ({
        id: `transit-${index}`,
        heading: getComboHeading(item),
        subheading: Array.isArray(item.subheading)
          ? (item.subheading as string[])
          : [],
      }));
      setTransitItems(items);
      if (response?.current_date) {
        const [day, month, year] = response.current_date.split('-').map(Number);
        if (day && month && year) {
          setCombosAsOfDate(new Date(year, month - 1, day));
        }
      }
      setExpandedComboId(prev => prev ?? items[0]?.id ?? null);
      return items;
    } catch {
      setTransitItems([]);
      return [];
    }
  }, [clientId, userService]);

  const loadCombinations = useCallback(async () => {
    try {
      const response = await userService.getAstrologerCombinations(clientId, 'combinations');
      setCombinationItems(
        extractComboListFromResponse(response).map((item, index) =>
          mapComboListItem(item, index, 'combo'),
        ),
      );
    } catch {
      setCombinationItems([]);
    }
  }, [clientId, userService]);

  const loadActiveCombinations = useCallback(async (): Promise<CombinationListItem[]> => {
    try {
      const response = await userService.getAstrologerCombinations(
        clientId,
        'active_combinations',
      );
      const items = extractComboListFromResponse(response).map((item, index) =>
        mapComboListItem(item, index, 'active'),
      );
      setActiveComboItems(items);
      return items;
    } catch {
      setActiveComboItems([]);
      return [];
    }
  }, [clientId, userService]);

  const loadAllCombos = useCallback(
    async (options?: { isRefresh?: boolean }) => {
      if (!clientId) {
        return { transitItems: [], activeComboItems: [] };
      }

      if (options?.isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const [loadedTransitItems, , loadedActiveComboItems] = await Promise.all([
          loadTransitCombos(),
          loadCombinations(),
          loadActiveCombinations(),
        ]);
        setCombosAsOfDate(new Date());
        return {
          transitItems: loadedTransitItems,
          activeComboItems: loadedActiveComboItems,
        };
      } catch {
        return { transitItems: [], activeComboItems: [] };
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [clientId, loadActiveCombinations, loadCombinations, loadTransitCombos],
  );

  useEffect(() => {
    setComboTab(initialTab);
    setExpandedComboId(null);
    setContentById({});
  }, [clientId, initialTab]);

  useEffect(() => {
    loadAllCombos();
  }, [loadAllCombos]);

  const handleTabChange = (tab: ComboTab) => {
    setComboTab(tab);
    setExpandedComboId(null);
  };

  const toggleTransitItem = (id: string) => {
    setExpandedComboId(prev => (prev === id ? null : id));
  };

  const toggleTransitAnalysisItem = async (item: TransitComboItem) => {
    const contentId = getTransitAnalysisContentId(item.id);
    const willExpand = expandedComboId !== contentId;
    setExpandedComboId(willExpand ? contentId : null);

    if (!willExpand || contentById[contentId]) {
      return;
    }

    setContentLoadingId(contentId);
    try {
      const response = await userService.getAstrologerTransitHeadingReport(
        clientId,
        item.heading,
      );
      const content = response?.answer?.trim() || 'No details available.';
      setContentById(prev => ({
        ...prev,
        [contentId]: content,
      }));
    } catch {
      setContentById(prev => ({
        ...prev,
        [contentId]: 'Failed to load details.',
      }));
    } finally {
      setContentLoadingId(null);
    }
  };

  const fetchActiveComboContent = useCallback(
    async (item: CombinationListItem): Promise<string> => {
      if (!item.collection || !item.pipeline?.length) {
        return 'Details not available for this combination.';
      }

      const response = await userService.getAstrologerComboContent(
        item.collection,
        item.pipeline,
      );
      const content = extractComboContent(response);
      return content || 'No details available.';
    },
    [userService],
  );

  const fetchComboContentById = useCallback(
    async (
      tab: ComboTab,
      expandedId: string,
      transitList: TransitComboItem[],
      activeList: CombinationListItem[],
    ) => {
      if (tab === 'transit_analysis') {
        const item = transitList.find(
          entry => getTransitAnalysisContentId(entry.id) === expandedId,
        );
        if (!item) {
          return;
        }

        setContentLoadingId(expandedId);
        try {
          const response = await userService.getAstrologerTransitHeadingReport(
            clientId,
            item.heading,
          );
          const content = response?.answer?.trim() || 'No details available.';
          setContentById(prev => ({
            ...prev,
            [expandedId]: content,
          }));
        } catch {
          setContentById(prev => ({
            ...prev,
            [expandedId]: 'Failed to load details.',
          }));
        } finally {
          setContentLoadingId(null);
        }
        return;
      }

      if (tab === 'antar_dasha') {
        const item = activeList.find(entry => entry.id === expandedId);
        if (!item) {
          return;
        }

        setContentLoadingId(expandedId);
        try {
          const content = await fetchActiveComboContent(item);
          setContentById(prev => ({
            ...prev,
            [expandedId]: content,
          }));
        } catch {
          setContentById(prev => ({
            ...prev,
            [expandedId]: 'Failed to load details.',
          }));
        } finally {
          setContentLoadingId(null);
        }
      }
    },
    [clientId, fetchActiveComboContent, userService],
  );

  const handleRefresh = useCallback(async () => {
    const expandedId = expandedComboId;
    const currentTab = comboTab;
    const shouldReloadExpandedContent =
      Boolean(expandedId) &&
      (currentTab === 'antar_dasha' || currentTab === 'transit_analysis');

    if (shouldReloadExpandedContent && expandedId) {
      setContentLoadingId(expandedId);
    } else {
      setContentById({});
    }

    const { transitItems: freshTransitItems, activeComboItems: freshActiveItems } =
      await loadAllCombos({ isRefresh: true });

    if (shouldReloadExpandedContent && expandedId) {
      await fetchComboContentById(
        currentTab,
        expandedId,
        freshTransitItems,
        freshActiveItems,
      );
      return;
    }

    setContentById({});
  }, [comboTab, expandedComboId, fetchComboContentById, loadAllCombos]);

  const toggleActiveComboItem = async (item: CombinationListItem) => {
    const willExpand = expandedComboId !== item.id;
    setExpandedComboId(willExpand ? item.id : null);

    if (!willExpand || contentById[item.id]) {
      return;
    }

    setContentLoadingId(item.id);
    try {
      const content = await fetchActiveComboContent(item);
      setContentById(prev => ({
        ...prev,
        [item.id]: content,
      }));
    } catch {
      setContentById(prev => ({
        ...prev,
        [item.id]: 'Failed to load details.',
      }));
    } finally {
      setContentLoadingId(null);
    }
  };

  const renderComboContent = (content: string, isTransitAnalysis = false) => {
    if (!content) {
      return (
        <Text style={[styles.comboContentText, { color: expandedContentColor }]}>
          No details available.
        </Text>
      );
    }

    const preparedContent = isTransitAnalysis
      ? preprocessTransitAnswer(content)
      : content;

    if (isHtmlContent(preparedContent) || isTransitAnalysis) {
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
      <Text style={[styles.comboContentText, { color: expandedContentColor }]}>
        {content}
      </Text>
    );
  };

  const renderCombinationsList = () => {
    if (!combinationItems.length) {
      return (
        <Text style={[styles.emptyText, { color: textMuted }]}>
          No combinations found
        </Text>
      );
    }

    return combinationItems.map((item, index) => (
      <View
        key={item.id}
        style={[styles.numberedRow, { borderColor: cardBorder }]}
      >
        <View style={styles.numberBadge}>
          <Text style={styles.numberBadgeText}>{index + 1}</Text>
        </View>
        <Text style={styles.numberedTitle} numberOfLines={4}>
          {item.heading}
        </Text>
      </View>
    ));
  };

  type ExpandableEntry = {
    key: string;
    title: string;
    isExpanded: boolean;
    onToggle: () => void;
    body: React.ReactNode;
  };

  const buildExpandableNodes = (entries: ExpandableEntry[]) => {
    const nodes: React.ReactNode[] = [];
    const stickyIndices: number[] = [];

    entries.forEach(entry => {
      // Every header is sticky so that, while scrolling long expanded content,
      // the next header pushes the current one out instead of letting other
      // items slide underneath the expanded header.
      stickyIndices.push(nodes.length);

      nodes.push(
        <TouchableOpacity
          key={`${entry.key}-header`}
          style={[
            styles.stickyHeader,
            { backgroundColor: cardBg, borderColor: cardBorder },
            entry.isExpanded
              ? styles.stickyHeaderExpanded
              : styles.stickyHeaderCollapsed,
          ]}
          onPress={entry.onToggle}
          activeOpacity={0.85}
        >
          <View style={styles.comboCardTitleWrap}>
            <Text style={styles.comboCardTitle} numberOfLines={4}>
              {entry.title}
            </Text>
          </View>
          <View style={styles.comboChevronBox}>
            <Text style={[styles.comboChevron, { color: textMuted }]}>
              {entry.isExpanded ? '▲' : '▼'}
            </Text>
          </View>
        </TouchableOpacity>,
      );

      if (entry.isExpanded) {
        nodes.push(
          <View
            key={`${entry.key}-body`}
            style={[
              styles.stickyBody,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            {entry.body}
          </View>,
        );
      }
    });

    return { nodes, stickyIndices };
  };

  const getExpandableListData = (): {
    empty?: string;
    nodes?: React.ReactNode[];
    stickyIndices?: number[];
  } => {
    if (comboTab === 'transit') {
      if (!transitItems.length) {
        return { empty: 'No transit combinations found' };
      }
      return buildExpandableNodes(
        transitItems.map(item => ({
          key: item.id,
          title: item.heading,
          isExpanded: expandedComboId === item.id,
          onToggle: () => toggleTransitItem(item.id),
          body: (
            <View>
              {item.subheading.map((bullet, index) => (
                <View
                  key={`${item.id}-bullet-${index}`}
                  style={styles.comboBulletRow}
                >
                  <Text style={[styles.comboBulletDot, { color: textMuted }]}>
                    •
                  </Text>
                  <Text style={[styles.comboBulletText, { color: textMuted }]}>
                    {bullet}
                  </Text>
                </View>
              ))}
            </View>
          ),
        })),
      );
    }

    if (comboTab === 'transit_analysis') {
      if (!transitItems.length) {
        return { empty: 'No transit analysis found' };
      }
      return buildExpandableNodes(
        transitItems.map(item => {
          const contentId = getTransitAnalysisContentId(item.id);
          return {
            key: contentId,
            title: item.heading,
            isExpanded: expandedComboId === contentId,
            onToggle: () => toggleTransitAnalysisItem(item),
            body:
              contentLoadingId === contentId ? (
                <ActivityIndicator size="small" color={NAVY} />
              ) : (
                renderComboContent(contentById[contentId], true)
              ),
          };
        }),
      );
    }

    if (!activeComboItems.length) {
      return { empty: 'No antardasha analysis found' };
    }
    return buildExpandableNodes(
      activeComboItems.map(item => ({
        key: item.id,
        title: item.heading,
        isExpanded: expandedComboId === item.id,
        onToggle: () => toggleActiveComboItem(item),
        body:
          contentLoadingId === item.id ? (
            <ActivityIndicator size="small" color={NAVY} />
          ) : (
            renderComboContent(contentById[item.id])
          ),
      })),
    );
  };

  const expandableListData =
    comboTab === 'combinations' ? null : getExpandableListData();

  const headerTitle =
    comboTab === 'transit'
      ? 'Combinations activated by Transit planets'
      : comboTab === 'transit_analysis'
        ? 'Transit Analysis'
        : comboTab === 'combinations'
          ? 'Combinations'
          : 'Antardasha Analysis';

  const renderListContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={NAVY} />
        </View>
      );
    }

    if (comboTab === 'combinations') {
      return (
        <View style={styles.listScrollContent}>{renderCombinationsList()}</View>
      );
    }

    if (expandableListData?.empty) {
      return (
        <Text style={[styles.emptyText, { color: textMuted }]}>
          {expandableListData.empty}
        </Text>
      );
    }

    return (
      <View style={styles.listScrollContent}>{expandableListData?.nodes}</View>
    );
  };

  return (
    <View
      style={[
        styles.card,
        useParentScroll ? styles.cardInParentScroll : null,
        { backgroundColor: cardBg, borderColor: cardBorder },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.title, { color: textPrimary }]}>{headerTitle}</Text>
          {comboTab === 'transit' || comboTab === 'transit_analysis' ? (
            <Text style={[styles.asOf, { color: textMuted }]}>
              As of: {formatAsOfDate(combosAsOfDate)}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={handleRefresh}
          activeOpacity={0.85}
          disabled={refreshing || loading}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={NAVY} />
          ) : (
            <Text style={styles.refreshIcon}>↻</Text>
          )}
          <Text style={styles.refreshText}>{refreshing ? 'Refreshing' : 'Refresh'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabRow}
      >
        {COMBO_TAB_ORDER.map(tab => {
          const isActive = comboTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabBtn,
                isActive
                  ? [styles.tabBtnActive, { backgroundColor: NAVY }]
                  : [styles.tabBtnInactive, { borderColor: cardBorder }],
              ]}
              onPress={() => handleTabChange(tab)}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isActive ? '#FFFFFF' : textPrimary },
                ]}
              >
                {tabLabels[tab]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {useParentScroll ? (
        renderListContent()
      ) : loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={NAVY} />
        </View>
      ) : comboTab === 'combinations' ? (
        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={styles.listScrollContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {renderCombinationsList()}
        </ScrollView>
      ) : expandableListData?.empty ? (
        <Text style={[styles.emptyText, { color: textMuted }]}>
          {expandableListData.empty}
        </Text>
      ) : (
        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={styles.listScrollContent}
          stickyHeaderIndices={expandableListData?.stickyIndices}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {expandableListData?.nodes}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: responsiveWidth('2'),
    overflow: 'hidden',
  },
  cardInParentScroll: {
    flex: 0,
    flexGrow: 0,
  },
  listScroll: {
    flex: 1,
  },
  listScrollContent: {
    paddingBottom: responsiveWidth('4'),
  },
  stickyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingLeft: 12,
    paddingRight: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 10,
    gap: 8,
  },
  stickyHeaderCollapsed: {
    marginBottom: 10,
  },
  stickyHeaderExpanded: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  stickyBody: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: responsiveWidth('3'),
  },
  headerTextWrap: { flex: 1 },
  title: {
    fontSize: 15,
    fontFamily: fontFamily.bold,
    lineHeight: 20,
  },
  asOf: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: fontFamily.regular,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  refreshIcon: {
    color: GOLD,
    fontSize: 14,
  },
  refreshText: {
    color: GOLD,
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
  },
  tabScroll: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: responsiveWidth('3'),
  },
  tabRow: {
    gap: 8,
    paddingRight: 8,
    alignItems: 'center',
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  tabBtnActive: {},
  tabBtnInactive: {
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
  },
  loadingWrap: {
    minHeight: responsiveWidth('40'),
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveWidth('8'),
  },
  listWrap: {
    gap: 10,
  },
  comboCard: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  comboCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  comboCardTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  comboCardTitle: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    lineHeight: 18,
    color: NAVY,
  },
  comboChevronBox: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  comboChevron: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    lineHeight: 14,
  },
  comboCardBody: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 2,
  },
  comboBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingRight: 4,
  },
  comboBulletDot: {
    fontSize: 14,
    lineHeight: 20,
    marginRight: 8,
  },
  comboBulletText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
  },
  comboContentText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
  },
  numberedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    width: '100%',
    marginBottom: 10,
  },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F4E4CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberBadgeText: {
    color: NAVY,
    fontSize: 12,
    fontFamily: fontFamily.bold,
  },
  numberedTitle: {
    flex: 1,
    flexShrink: 1,
    fontSize: 13,
    fontFamily: fontFamily.bold,
    lineHeight: 18,
    color: NAVY,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    paddingVertical: responsiveWidth('8'),
  },
});

export default AstrologerCombos;
export type { ComboTab };
