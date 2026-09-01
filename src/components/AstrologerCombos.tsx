import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
import { icons } from '../assets';
import { fontFamily, responsiveWidth } from '../constant/theme';
import UserService from '../services/user/user.service';
import {
  getCombosListCache,
  getCombosListCacheSync,
  setCombosListCache,
} from '../utils/astrologerCombosCache';

const NAVY = '#1A3673';
const GOLD = '#C5A370';

export type PredictionMode = 'general' | 'personalized';

export type ComboTab =
  | 'next_week'
  | 'transit_analysis'
  | 'combinations'
  | 'antar_dasha'
  | 'dos_donts'
  | 'the_inner_you';

export const GENERAL_COMBO_TAB_ORDER: ComboTab[] = [
  'antar_dasha',
  'transit_analysis',
  'dos_donts',
  'the_inner_you',
  'combinations',
];

export const PERSONALIZED_COMBO_TAB_ORDER: ComboTab[] = [
  'next_week',
  'antar_dasha',
  'transit_analysis',
  'dos_donts',
];

const COMBO_TAB_ORDER = GENERAL_COMBO_TAB_ORDER;

export const CLIENT_COMBO_SHORTCUTS: {
  tab: ComboTab;
  label: string;
  icon: string;
}[] = [
  { tab: 'next_week', label: 'Next Week', icon: '📅' },
  { tab: 'antar_dasha', label: 'Current Phase of Life', icon: '⚡' },
  { tab: 'transit_analysis', label: 'Transit Predictions', icon: '▦' },
  { tab: 'dos_donts', label: "Do's and Don'ts", icon: '✓' },
];

type CombinationListItem = {
  id: string;
  heading: string;
  collection?: string;
  pipeline?: Array<Record<string, unknown>>;
};

type DashaPeriodInfo = {
  planet: string;
  dateRange: string;
};

type AstrologerCombosProps = {
  clientId: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textMuted: string;
  initialTab?: ComboTab;
  initialMode?: PredictionMode;
  mode?: PredictionMode;
  onModeChange?: (mode: PredictionMode) => void;
  useParentScroll?: boolean;
  mahadasha?: DashaPeriodInfo | null;
  antardasha?: DashaPeriodInfo | null;
};

type ComboDetailParams = {
  title: string;
  kind:
    | 'next_week'
    | 'transit_analysis'
    | 'antar_dasha'
    | 'dos_donts'
    | 'the_inner_you';
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

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const formatDashaDateToken = (raw: string) => {
  const match = raw.trim().match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (!match) {
    return raw.trim();
  }
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = match[3];
  const monthLabel = MONTH_LABELS[month - 1];
  if (!monthLabel) {
    return raw.trim();
  }
  return `${day} ${monthLabel} ${year}`;
};

const formatDashaRangeForIntro = (dateRange: string) => {
  const parts = dateRange.split(/\s*(?:→|->|to)\s*/i).filter(Boolean);
  if (parts.length >= 2) {
    return `${formatDashaDateToken(parts[0])} to ${formatDashaDateToken(parts[1])}`;
  }
  return dateRange.trim();
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
  initialMode = 'general',
  mode,
  onModeChange,
  useParentScroll = false,
  mahadasha = null,
  antardasha = null,
}: AstrologerCombosProps) => {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList>>();
  const userService = useMemo(() => new UserService(), []);
  const tabsScrollRef = useRef<ScrollView | null>(null);
  const tabPositionsRef = useRef<Partial<Record<ComboTab, number>>>({});
  const cachedList = clientId ? getCombosListCacheSync(clientId) : null;
  const internalCurrentMode = mode || initialMode;
  const [internalMode, setInternalMode] = useState<PredictionMode>(
    mode || initialMode || 'general',
  );
  const predictionMode = mode || internalMode || 'general';
  const [comboTab, setComboTab] = useState<ComboTab>(
    initialTab || (predictionMode === 'personalized' ? 'next_week' : 'antar_dasha'),
  );

  useEffect(() => {
    if (initialTab) {
      setComboTab(initialTab);
    } else if (predictionMode === 'personalized') {
      setComboTab('next_week');
    }
  }, [initialTab, predictionMode]);

  useEffect(() => {
    if (mode && mode !== internalMode) {
      setInternalMode(mode);
      if (mode === 'personalized') {
        setComboTab('next_week');
      } else if (mode === 'general' && comboTab === 'next_week') {
        setComboTab('antar_dasha');
      }
    }
  }, [mode, internalMode, comboTab]);

  const activeTabOrder = useMemo(
    () =>
      (mode || internalMode) === 'personalized'
        ? PERSONALIZED_COMBO_TAB_ORDER
        : GENERAL_COMBO_TAB_ORDER,
    [mode, internalMode],
  );

  const handleModeChange = useCallback(
    (newMode: PredictionMode) => {
      setInternalMode(newMode);
      onModeChange?.(newMode);
      if (newMode === 'personalized') {
        if (comboTab === 'the_inner_you' || comboTab === 'combinations') {
          setComboTab('next_week');
        }
      } else if (newMode === 'general') {
        if (comboTab === 'next_week') {
          setComboTab('antar_dasha');
        }
      }
    },
    [comboTab, onModeChange],
  );

  const [loading, setLoading] = useState(!cachedList);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingItemId, setRefreshingItemId] = useState<string | null>(null);
  const [nextWeekItems, setNextWeekItems] = useState<CombinationListItem[]>(
    cachedList?.nextWeekItems || [],
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
  const [innerYouItems, setInnerYouItems] = useState<CombinationListItem[]>(
    cachedList?.innerYouItems || [],
  );
  const [combosAsOfDate, setCombosAsOfDate] = useState(
    cachedList?.combosAsOfDate ? new Date(cachedList.combosAsOfDate) : new Date(),
  );
  const [showPhaseIntroModal, setShowPhaseIntroModal] = useState(false);

  const tabLabels = useMemo(
    () => ({
      next_week: `Next Week (${nextWeekItems.length})`,
      combinations: `Combinations (${combinationItems.length})`,
      antar_dasha: `Current Phase of Life (${activeComboItems.length})`,
      dos_donts: `Do's and Don'ts (${activityItems.length})`,
      transit_analysis: `Transit Predictions (${transitDetailItems.length})`,
      the_inner_you: `The Inner You (${innerYouItems.length})`,
    }),
    [
      nextWeekItems.length,
      transitDetailItems.length,
      combinationItems.length,
      activeComboItems.length,
      activityItems.length,
      innerYouItems.length,
    ],
  );

  const applyListCache = useCallback(
    (cache: NonNullable<ReturnType<typeof getCombosListCacheSync>>) => {
      setNextWeekItems(cache.nextWeekItems || []);
      setTransitDetailItems(cache.transitDetailItems || []);
      setCombinationItems(cache.combinationItems || []);
      setActiveComboItems(cache.activeComboItems || []);
      setActivityItems(cache.activityItems || []);
      setInnerYouItems(cache.innerYouItems || []);
      if (cache.combosAsOfDate) {
        setCombosAsOfDate(new Date(cache.combosAsOfDate));
      }
      setLoading(false);
    },
    [],
  );

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

  const loadInnerYouCombinations = useCallback(async (): Promise<CombinationListItem[]> => {
    try {
      const response = await userService.getAstrologerCombinations(
        clientId,
        'the_inner_you',
      );
      const items = extractComboListFromResponse(response).map((item, index) =>
        mapComboListItem(item, index, 'inner-you'),
      );
      setInnerYouItems(items);
      return items;
    } catch {
      setInnerYouItems([]);
      return [];
    }
  }, [clientId, userService]);

  const loadNextWeekCombinations = useCallback(async (): Promise<CombinationListItem[]> => {
    try {
      const response = await userService.getAstrologerCombinations(
        clientId,
        'next_week',
      );
      const items = extractComboListFromResponse(response).map((item, index) =>
        mapComboListItem(item, index, 'next-week'),
      );
      setNextWeekItems(items);
      return items;
    } catch {
      setNextWeekItems([]);
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
          nextTransitDetails,
          nextCombinations,
          nextActive,
          nextActivity,
          nextInnerYou,
          nextWeek,
        ] =
          await Promise.all([
            loadTransitDetailItems(),
            loadCombinations(),
            loadActiveCombinations(),
            loadActivityCombinations(),
            loadInnerYouCombinations(),
            loadNextWeekCombinations(),
          ]);
        const asOf = new Date();
        setCombosAsOfDate(asOf);
        await setCombosListCache(clientId, {
          transitItems: [],
          transitDetailItems: nextTransitDetails,
          combinationItems: nextCombinations,
          activeComboItems: nextActive,
          activityItems: nextActivity,
          innerYouItems: nextInnerYou,
          nextWeekItems: nextWeek,
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
      loadInnerYouCombinations,
      loadNextWeekCombinations,
      loadTransitDetailItems,
    ],
  );

  const persistCombosCache = useCallback(
    async (overrides?: Partial<Awaited<ReturnType<typeof getCombosListCache>>>) => {
      if (!clientId) {
        return;
      }

      await setCombosListCache(clientId, {
        transitItems: overrides?.transitItems || [],
        transitDetailItems: overrides?.transitDetailItems || transitDetailItems,
        combinationItems: overrides?.combinationItems || combinationItems,
        activeComboItems: overrides?.activeComboItems || activeComboItems,
        activityItems: overrides?.activityItems || activityItems,
        innerYouItems: overrides?.innerYouItems || innerYouItems,
        combosAsOfDate: overrides?.combosAsOfDate || combosAsOfDate.toISOString(),
      });
    },
    [
      activityItems,
      clientId,
      combinationItems,
      combosAsOfDate,
      innerYouItems,
      transitDetailItems,
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

  const getDataTypeForTab = (tab: ComboTab): string => {
    switch (tab) {
      case 'next_week':
        return 'next_week';
      case 'antar_dasha':
        return 'active_combinations';
      case 'transit_analysis':
        return 'transit_details_list';
      case 'dos_donts':
        return 'current_activity';
      case 'the_inner_you':
        return 'the_inner_you';
      case 'combinations':
        return 'combinations';
      default:
        return 'active_combinations';
    }
  };

  const handleRefreshItem = useCallback(
    async (item: CombinationListItem, tab: ComboTab) => {
      if (!clientId || !item.heading) {
        return;
      }

      setRefreshingItemId(item.id);
      try {
        const dataType = getDataTypeForTab(tab);
        const isPersonalized = predictionMode === 'personalized';
        await userService.generateAstrologerCustomCombination(
          clientId,
          dataType,
          item.heading,
          isPersonalized,
        );

        Toast.show({
          type: 'success',
          text1: 'Prediction Refreshed',
          text2: `Refreshed "${item.heading}"`,
          position: 'top',
          topOffset: 60,
          visibilityTime: 2500,
        });
      } catch (err: any) {
        Toast.show({
          type: 'error',
          text1: 'Refresh Failed',
          text2: err?.message || 'Could not refresh prediction',
          position: 'top',
          topOffset: 60,
          visibilityTime: 3000,
        });
      } finally {
        setRefreshingItemId(null);
      }
    },
    [clientId, predictionMode, userService],
  );

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

  const renderDetailRow = (
    key: string,
    title: string,
    onPress: () => void,
    onRefresh?: () => void,
    isRefreshingItem?: boolean,
  ) => {
    const isPersonalized = predictionMode === 'personalized';

    return (
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
        <View style={styles.detailRowRight}>
          {isPersonalized && onRefresh ? (
            <TouchableOpacity
              style={styles.rowRefreshBtn}
              onPress={onRefresh}
              disabled={isRefreshingItem}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              {isRefreshingItem ? (
                <ActivityIndicator size="small" color={NAVY} />
              ) : (
                <Image
                  source={icons.icRecycle}
                  style={[styles.rowRefreshIcon, { tintColor: NAVY }]}
                  resizeMode="contain"
                />
              )}
            </TouchableOpacity>
          ) : null}
          <View style={styles.comboChevronBox}>
            <Text style={[styles.comboChevron, { color: textPrimary }]}>›</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderExpandableList = () => {
    if (comboTab === 'next_week') {
      if (!nextWeekItems.length) {
        return (
          <Text style={[styles.emptyText, { color: textMuted }]}>
            No Next Week predictions found
          </Text>
        );
      }

      return nextWeekItems.map(item =>
        renderDetailRow(
          item.id,
          item.heading,
          () =>
            openDetail({
              title: item.heading,
              kind: 'next_week',
              collection: item.collection,
              pipeline: item.pipeline,
            }),
          () => handleRefreshItem(item, 'next_week'),
          refreshingItemId === item.id,
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
        renderDetailRow(
          item.id,
          item.heading,
          () =>
            openDetail({
              title: item.heading,
              kind: 'transit_analysis',
              clientId,
              heading: item.heading,
            }),
          () => handleRefreshItem(item, 'transit_analysis'),
          refreshingItemId === item.id,
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
        renderDetailRow(
          item.id,
          item.heading,
          () =>
            openDetail({
              title: item.heading,
              kind: 'dos_donts',
              collection: item.collection,
              pipeline: item.pipeline,
            }),
          () => handleRefreshItem(item, 'dos_donts'),
          refreshingItemId === item.id,
        ),
      );
    }

    if (comboTab === 'the_inner_you') {
      if (!innerYouItems.length) {
        return (
          <Text style={[styles.emptyText, { color: textMuted }]}>
            No Inner You insights found
          </Text>
        );
      }

      return innerYouItems.map(item =>
        renderDetailRow(
          item.id,
          item.heading,
          () =>
            openDetail({
              title: item.heading,
              kind: 'the_inner_you',
              collection: item.collection,
              pipeline: item.pipeline,
            }),
          () => handleRefreshItem(item, 'the_inner_you'),
          refreshingItemId === item.id,
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
      renderDetailRow(
        item.id,
        item.heading,
        () =>
          openDetail({
            title: item.heading,
            kind: 'antar_dasha',
            collection: item.collection,
            pipeline: item.pipeline,
          }),
        () => handleRefreshItem(item, 'antar_dasha'),
        refreshingItemId === item.id,
      ),
    );
  };

  const headerTitle =
    comboTab === 'next_week'
      ? 'Next Week'
      : comboTab === 'transit_analysis'
      ? 'Transit Predictions'
      : comboTab === 'combinations'
        ? 'Combinations'
        : comboTab === 'dos_donts'
          ? "Do's and Don'ts"
          : comboTab === 'the_inner_you'
            ? 'The Inner You'
            : comboTab === 'antar_dasha'
              ? 'Current Phase of Life'
              : 'Generic Prediction';

  const phaseOfLifeIntro = useMemo(() => {
    if (!mahadasha?.planet || !antardasha?.planet) {
      return null;
    }

    return {
      mdPlanet: mahadasha.planet,
      mdRange: formatDashaRangeForIntro(mahadasha.dateRange),
      adPlanet: antardasha.planet,
      adRange: formatDashaRangeForIntro(antardasha.dateRange),
    };
  }, [antardasha, mahadasha]);

  useEffect(() => {
    if (comboTab === 'antar_dasha' && phaseOfLifeIntro) {
      setShowPhaseIntroModal(true);
      return;
    }
    setShowPhaseIntroModal(false);
  }, [comboTab, phaseOfLifeIntro, clientId]);

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

    return (
      <View style={styles.listScrollContent}>{renderExpandableList()}</View>
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
          {comboTab === 'transit_analysis' ? (
            <Text style={[styles.asOf, { color: textPrimary }]}>
              As of: {formatAsOfDate(combosAsOfDate)}
            </Text>
          ) : null}
        </View>
        {comboTab === 'transit_analysis' || comboTab === 'dos_donts' ? (
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
        {activeTabOrder.map(tab => {
          const isActive = comboTab === tab;
          const activeBg = NAVY;
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
                  ? [styles.tabBtnActive, { backgroundColor: activeBg }]
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
          {comboTab === 'combinations' ? (
            renderCombinationsList()
          ) : (
            renderExpandableList()
          )}
        </ScrollView>
      )}

      <Modal
        visible={showPhaseIntroModal && !!phaseOfLifeIntro}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPhaseIntroModal(false)}
      >
        <View style={styles.phaseModalOverlay}>
          <View
            style={[
              styles.phaseModalCard,
              {
                backgroundColor: cardBg === '#FFFFFF' ? '#FFFFFF' : cardBg,
                borderColor: cardBorder,
              },
            ]}
          >
            <Text style={[styles.phaseModalTitle, { color: textPrimary }]}>
              Current Phase of Life
            </Text>
            {phaseOfLifeIntro ? (
              <Text style={[styles.phaseIntroText, { color: textPrimary }]}>
                The longer life direction is largely indicated by{' '}
                <Text style={[styles.phaseIntroHighlight, { color: GOLD }]}>
                  {phaseOfLifeIntro.mdPlanet} Mahadasha
                </Text>{' '}
                from{' '}
                <Text style={[styles.phaseIntroHighlight, { color: GOLD }]}>
                  {phaseOfLifeIntro.mdRange}
                </Text>
                , while your current phase of life is indicated by{' '}
                <Text style={[styles.phaseIntroHighlight, { color: GOLD }]}>
                  {phaseOfLifeIntro.adPlanet}
                </Text>{' '}
                from{' '}
                <Text style={[styles.phaseIntroHighlight, { color: GOLD }]}>
                  {phaseOfLifeIntro.adRange}
                </Text>
                . This planet makes some connections with other planets. Possible
                experiences of such connections are listed below. You are
                suggested to go through it to see how life is unfolding for you
                and align your energies accordingly.
              </Text>
            ) : null}
            <TouchableOpacity
              style={styles.phaseModalBtn}
              onPress={() => setShowPhaseIntroModal(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.phaseModalBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  phaseModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth('6'),
  },
  phaseModalCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
  },
  phaseModalTitle: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    marginBottom: 10,
  },
  phaseIntroText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fontFamily.regular,
  },
  phaseIntroHighlight: {
    fontFamily: fontFamily.semiBold,
  },
  phaseModalBtn: {
    marginTop: 16,
    backgroundColor: NAVY,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  phaseModalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
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
    borderColor: NAVY,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  refreshIcon: {
    color: NAVY,
    fontSize: 14,
  },
  refreshText: {
    color: NAVY,
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
  detailRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowRefreshBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowRefreshIcon: {
    width: 17,
    height: 17,
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
