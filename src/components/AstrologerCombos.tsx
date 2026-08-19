import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { fontFamily, responsiveWidth } from '../constant/theme';
import UserService from '../services/user/user.service';
import {
  getCombosListCache,
  getCombosListCacheSync,
  setCombosListCache,
} from '../utils/astrologerCombosCache';

const NAVY = '#1A3673';
const GOLD = '#C5A370';

type ComboTab =
  | 'transit'
  | 'transit_analysis'
  | 'combinations'
  | 'antar_dasha'
  | 'dos_donts';

const COMBO_TAB_ORDER: ComboTab[] = [
  'antar_dasha',
  'transit_analysis',
  'dos_donts',
  'transit',
  'combinations',
];

export const CLIENT_COMBO_SHORTCUTS: {
  tab: ComboTab;
  label: string;
  icon: string;
}[] = [
  { tab: 'antar_dasha', label: 'Current Dasha (Life Phase)', icon: '⚡' },
  { tab: 'transit_analysis', label: 'Transit Predictions', icon: '▦' },
  { tab: 'dos_donts', label: "Do's and Don'ts", icon: '✓' },
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

type ComboDetailParams = {
  title: string;
  kind: 'transit' | 'transit_analysis' | 'antar_dasha' | 'dos_donts';
  clientId?: string;
  heading?: string;
  bullets?: string[];
  collection?: string;
  pipeline?: Array<Record<string, unknown>>;
};

type RootStackParamList = {
  AstrologerComboDetailScreen: ComboDetailParams;
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

const AstrologerCombos = ({
  clientId,
  cardBg,
  cardBorder,
  textPrimary,
  textMuted,
  initialTab = 'antar_dasha',
  useParentScroll = false,
}: AstrologerCombosProps) => {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList>>();
  const userService = useMemo(() => new UserService(), []);
  const tabsScrollRef = useRef<ScrollView | null>(null);
  const tabPositionsRef = useRef<Partial<Record<ComboTab, number>>>({});
  const cachedList = clientId ? getCombosListCacheSync(clientId) : null;
  const [comboTab, setComboTab] = useState<ComboTab>(initialTab);
  const [loading, setLoading] = useState(!cachedList);
  const [refreshing, setRefreshing] = useState(false);
  const [transitItems, setTransitItems] = useState<TransitComboItem[]>(
    cachedList?.transitItems || [],
  );
  const [transitDetailItems, setTransitDetailItems] = useState<CombinationListItem[]>(
    cachedList?.transitDetailItems || [],
  );
  const [combinationItems, setCombinationItems] = useState<CombinationListItem[]>(
    cachedList?.combinationItems || [],
  );
  const [activeComboItems, setActiveComboItems] = useState<CombinationListItem[]>(
    cachedList?.activeComboItems || [],
  );
  const [activityItems, setActivityItems] = useState<CombinationListItem[]>(
    cachedList?.activityItems || [],
  );
  const [combosAsOfDate, setCombosAsOfDate] = useState(
    cachedList?.combosAsOfDate ? new Date(cachedList.combosAsOfDate) : new Date(),
  );

  const tabLabels = useMemo(
    () => ({
      combinations: `Combinations (${combinationItems.length})`,
      antar_dasha: `Current Dasha (Life Phase) (${activeComboItems.length})`,
      dos_donts: `Do's and Don'ts (${activityItems.length})`,
      transit_analysis: `Transit Predictions (${transitDetailItems.length})`,
      transit: `Transit combinations (${transitItems.length})`,
    }),
    [
      transitItems.length,
      transitDetailItems.length,
      combinationItems.length,
      activeComboItems.length,
      activityItems.length,
    ],
  );

  const applyListCache = useCallback(
    (cache: NonNullable<ReturnType<typeof getCombosListCacheSync>>) => {
      setTransitItems(cache.transitItems || []);
      setTransitDetailItems(cache.transitDetailItems || []);
      setCombinationItems(cache.combinationItems || []);
      setActiveComboItems(cache.activeComboItems || []);
      setActivityItems(cache.activityItems || []);
      if (cache.combosAsOfDate) {
        setCombosAsOfDate(new Date(cache.combosAsOfDate));
      }
      setLoading(false);
    },
    [],
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
      return items;
    } catch {
      setTransitItems([]);
      return [];
    }
  }, [clientId, userService]);

  const loadCombinations = useCallback(async (): Promise<CombinationListItem[]> => {
    try {
      const response = await userService.getAstrologerCombinations(clientId, 'combinations');
      const items = extractComboListFromResponse(response).map((item, index) =>
        mapComboListItem(item, index, 'combo'),
      );
      setCombinationItems(items);
      return items;
    } catch {
      setCombinationItems([]);
      return [];
    }
  }, [clientId, userService]);

  const loadTransitDetailItems = useCallback(async (): Promise<CombinationListItem[]> => {
    try {
      const response = await userService.getAstrologerCombinations(
        clientId,
        'transit_details_list',
      );
      const items = extractComboListFromResponse(response).map((item, index) =>
        mapComboListItem(item, index, 'transit-detail'),
      );
      setTransitDetailItems(items);
      return items;
    } catch {
      setTransitDetailItems([]);
      return [];
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

  const loadActivityCombinations = useCallback(async (): Promise<CombinationListItem[]> => {
    try {
      const response = await userService.getAstrologerCombinations(
        clientId,
        'current_activity',
      );
      const items = extractComboListFromResponse(response).map((item, index) =>
        mapComboListItem(item, index, 'activity'),
      );
      setActivityItems(items);
      return items;
    } catch {
      setActivityItems([]);
      return [];
    }
  }, [clientId, userService]);

  const loadAllCombos = useCallback(
    async (options?: { isRefresh?: boolean; silent?: boolean }) => {
      if (!clientId) {
        return;
      }

      if (options?.isRefresh) {
        setRefreshing(true);
      } else if (!options?.silent) {
        setLoading(true);
      }

      try {
        const [
          nextTransit,
          nextTransitDetails,
          nextCombinations,
          nextActive,
          nextActivity,
        ] =
          await Promise.all([
            loadTransitCombos(),
            loadTransitDetailItems(),
            loadCombinations(),
            loadActiveCombinations(),
            loadActivityCombinations(),
          ]);
        const asOf = new Date();
        setCombosAsOfDate(asOf);
        await setCombosListCache(clientId, {
          transitItems: nextTransit,
          transitDetailItems: nextTransitDetails,
          combinationItems: nextCombinations,
          activeComboItems: nextActive,
          activityItems: nextActivity,
          combosAsOfDate: asOf.toISOString(),
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      clientId,
      loadActiveCombinations,
      loadActivityCombinations,
      loadCombinations,
      loadTransitDetailItems,
      loadTransitCombos,
    ],
  );

  const persistCombosCache = useCallback(
    async (overrides?: Partial<Awaited<ReturnType<typeof getCombosListCache>>>) => {
      if (!clientId) {
        return;
      }

      await setCombosListCache(clientId, {
        transitItems: overrides?.transitItems || transitItems,
        transitDetailItems: overrides?.transitDetailItems || transitDetailItems,
        combinationItems: overrides?.combinationItems || combinationItems,
        activeComboItems: overrides?.activeComboItems || activeComboItems,
        activityItems: overrides?.activityItems || activityItems,
        combosAsOfDate: overrides?.combosAsOfDate || combosAsOfDate.toISOString(),
      });
    },
    [
      activityItems,
      clientId,
      combinationItems,
      combosAsOfDate,
      transitDetailItems,
      transitItems,
      activeComboItems,
    ],
  );

  useEffect(() => {
    setComboTab(initialTab);
  }, [clientId, initialTab]);

  useEffect(() => {
    let cancelled = false;

    const hydrateAndLoad = async () => {
      if (!clientId) {
        return;
      }

      const memoryHit = getCombosListCacheSync(clientId);
      if (memoryHit) {
        applyListCache(memoryHit);
        // Keep data fresh in background without blocking UI.
        void loadAllCombos({ silent: true });
        return;
      }

      const stored = await getCombosListCache(clientId);
      if (cancelled) {
        return;
      }

      if (stored) {
        applyListCache(stored);
        void loadAllCombos({ silent: true });
        return;
      }

      await loadAllCombos();
    };

    void hydrateAndLoad();

    return () => {
      cancelled = true;
    };
  }, [applyListCache, clientId, loadAllCombos]);

  const handleTabChange = (tab: ComboTab) => {
    setComboTab(tab);
  };

  const scrollSelectedTabIntoView = useCallback((tab: ComboTab) => {
    const tabX = tabPositionsRef.current[tab];
    if (tabX == null) {
      return;
    }
    tabsScrollRef.current?.scrollTo({
      x: Math.max(0, tabX - 8),
      animated: true,
    });
  }, []);

  useEffect(() => {
    scrollSelectedTabIntoView(comboTab);
  }, [comboTab, scrollSelectedTabIntoView]);

  const openDetail = (params: ComboDetailParams) => {
    navigation.navigate('AstrologerComboDetailScreen', params);
  };

  const handleRefresh = useCallback(async () => {
    if (!clientId) {
      return;
    }

    setRefreshing(true);
    try {
      if (comboTab === 'transit_analysis') {
        const response = await userService.refreshAstrologerCombinations(
          clientId,
          'transit_details_list',
        );
        const items = extractComboListFromResponse(response).map((item, index) =>
          mapComboListItem(item, index, 'transit-detail'),
        );
        setTransitDetailItems(items);
        await persistCombosCache({
          transitDetailItems: items,
          combosAsOfDate: new Date().toISOString(),
        });
        return;
      }

      if (comboTab === 'dos_donts') {
        const response = await userService.refreshAstrologerCombinations(
          clientId,
          'current_activity',
        );
        const items = extractComboListFromResponse(response).map((item, index) =>
          mapComboListItem(item, index, 'activity'),
        );
        setActivityItems(items);
        await persistCombosCache({
          activityItems: items,
          combosAsOfDate: new Date().toISOString(),
        });
        return;
      }

      if (comboTab === 'transit') {
        const response = await userService.getAstrologerTransitConnectionList(clientId);
        const items = extractComboListFromResponse(response).map((item, index) => ({
          id: `transit-${index}`,
          heading: getComboHeading(item),
          subheading: Array.isArray(item.subheading)
            ? (item.subheading as string[])
            : [],
        }));
        setTransitItems(items);
        const asOf = new Date();
        setCombosAsOfDate(asOf);
        await persistCombosCache({
          transitItems: items,
          combosAsOfDate: asOf.toISOString(),
        });
        return;
      }

      await loadAllCombos({ isRefresh: true });
    } finally {
      setRefreshing(false);
    }
  }, [
    clientId,
    comboTab,
    loadAllCombos,
    persistCombosCache,
    userService,
  ]);

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

  const renderDetailRow = (key: string, title: string, onPress: () => void) => (
    <TouchableOpacity
      key={key}
      style={[
        styles.detailRow,
        { backgroundColor: cardBg, borderColor: cardBorder },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.comboCardTitleWrap}>
        <Text style={[styles.comboCardTitle, { color: textPrimary }]} numberOfLines={4}>
          {title}
        </Text>
      </View>
      <View style={styles.comboChevronBox}>
        <Text style={[styles.comboChevron, { color: textPrimary }]}>›</Text>
      </View>
    </TouchableOpacity>
  );

  const renderExpandableList = () => {
    if (comboTab === 'transit') {
      if (!transitItems.length) {
        return (
          <Text style={[styles.emptyText, { color: textMuted }]}>
            No transit combinations found
          </Text>
        );
      }

      return transitItems.map(item =>
        renderDetailRow(item.id, item.heading, () =>
          openDetail({
            title: item.heading,
            kind: 'transit',
            bullets: item.subheading,
          }),
        ),
      );
    }

    if (comboTab === 'transit_analysis') {
      if (!transitDetailItems.length) {
        return (
          <Text style={[styles.emptyText, { color: textMuted }]}>
            No transit predictions found
          </Text>
        );
      }

      return transitDetailItems.map(item =>
        renderDetailRow(item.id, item.heading, () =>
          openDetail({
            title: item.heading,
            kind: 'transit_analysis',
            clientId,
            heading: item.heading,
          }),
        ),
      );
    }

    if (comboTab === 'dos_donts') {
      if (!activityItems.length) {
        return (
          <Text style={[styles.emptyText, { color: textMuted }]}>
            No do's and don'ts found
          </Text>
        );
      }

      return activityItems.map(item =>
        renderDetailRow(item.id, item.heading, () =>
          openDetail({
            title: item.heading,
            kind: 'dos_donts',
            collection: item.collection,
            pipeline: item.pipeline,
          }),
        ),
      );
    }

    if (!activeComboItems.length) {
      return (
        <Text style={[styles.emptyText, { color: textMuted }]}>
          No antardasha analysis found
        </Text>
      );
    }

    return activeComboItems.map(item =>
      renderDetailRow(item.id, item.heading, () =>
        openDetail({
          title: item.heading,
          kind: 'antar_dasha',
          collection: item.collection,
          pipeline: item.pipeline,
        }),
      ),
    );
  };

  const headerTitle =
    comboTab === 'transit'
      ? 'Combinations activated by Transit planets'
      : comboTab === 'transit_analysis'
        ? 'Transit Predictions'
        : comboTab === 'combinations'
          ? 'Combinations'
          : comboTab === 'dos_donts'
            ? "Do's and Don'ts"
            : comboTab === 'antar_dasha'
              ? 'Current Dasha (Life Phase)'
              : 'Generic Prediction';

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

    return <View style={styles.listScrollContent}>{renderExpandableList()}</View>;
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
            <Text style={[styles.asOf, { color: textPrimary }]}>
              As of: {formatAsOfDate(combosAsOfDate)}
            </Text>
          ) : null}
        </View>
        {comboTab === 'transit' ||
        comboTab === 'transit_analysis' ||
        comboTab === 'dos_donts' ? (
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
        ) : null}
      </View>

      <ScrollView
        ref={tabsScrollRef}
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
              onLayout={event => {
                tabPositionsRef.current[tab] = event.nativeEvent.layout.x;
                if (tab === comboTab) {
                  scrollSelectedTabIntoView(tab);
                }
              }}
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
      ) : (
        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={styles.listScrollContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {comboTab === 'combinations'
            ? renderCombinationsList()
            : renderExpandableList()}
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
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingLeft: 12,
    paddingRight: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 10,
    gap: 8,
    marginBottom: 10,
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
  comboCardTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  comboCardTitle: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    lineHeight: 18,
  },
  comboChevronBox: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  comboChevron: {
    fontSize: 22,
    fontFamily: fontFamily.bold,
    lineHeight: 24,
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
