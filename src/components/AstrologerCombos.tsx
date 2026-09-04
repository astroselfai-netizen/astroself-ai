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
  makeComboDetailCacheKey,
  setComboDetailCache,
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
  { tab: 'next_week', label: 'Next 7 Days', icon: '📅' },
  { tab: 'antar_dasha', label: 'Current Phase of Life', icon: '⚡' },
  { tab: 'transit_analysis', label: 'Transit Predictions', icon: '▦' },
  { tab: 'dos_donts', label: "Do's and Don'ts", icon: '✓' },
];

type CombinationListItem = {
  id: string;
  heading: string;
  collection?: string;
  pipeline?: Array<Record<string, unknown>>;
  insights?: string;
  details?: unknown[];
  week_start?: string;
  week_end?: string;
};

type DashaPeriodInfo = {
  planet: string;
  dateRange: string;
  from?: string;
  to?: string;
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
    | 'transit'
    | 'transit_analysis'
    | 'antar_dasha'
    | 'dos_donts'
    | 'the_inner_you'
    | 'combinations';
  clientId?: string;
  heading?: string;
  bullets?: string[];
  collection?: string;
  pipeline?: Array<Record<string, unknown>>;
  mode?: PredictionMode;
  insights?: string;
  dataType?: string;
};

type RootStackParamList = {
  AstrologerComboDetailScreen: ComboDetailParams;
};

const formatLongDate = (raw?: string, fallback?: Date) => {
  const datePart = String(raw || '')
    .trim()
    .split(/\s+/)[0];
  if (datePart) {
    const formatted = formatDashaDateToken(datePart);
    if (formatted) {
      return formatted;
    }
  }
  if (fallback && !Number.isNaN(fallback.getTime())) {
    return `${fallback.getDate()} ${MONTH_LABELS[fallback.getMonth()]} ${fallback.getFullYear()}`;
  }
  return '';
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

const formatDashaRangeForIntro = (dateRange?: string) => {
  if (!dateRange || typeof dateRange !== 'string') {
    return '';
  }
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

const pickCurrentDate = (response: unknown): string | undefined => {
  if (!response || typeof response !== 'object') {
    return undefined;
  }

  const record = response as Record<string, unknown>;
  const value = record.current_date ?? record.currentDate;
  const text = String(value || '').trim();
  return text || undefined;
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
    insights: typeof record.insights === 'string' ? record.insights : undefined,
    details: Array.isArray(record.details) ? record.details : undefined,
    week_start: typeof record.week_start === 'string' ? record.week_start : undefined,
    week_end: typeof record.week_end === 'string' ? record.week_end : undefined,
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
  const [activityCurrentDate, setActivityCurrentDate] = useState(
    cachedList?.activityCurrentDate || '',
  );
  const [transitCurrentDate, setTransitCurrentDate] = useState(
    cachedList?.transitCurrentDate || '',
  );
  const [phaseCurrentDate, setPhaseCurrentDate] = useState(
    cachedList?.phaseCurrentDate || '',
  );
  const comboDatesRef = useRef({
    activity: cachedList?.activityCurrentDate || '',
    transit: cachedList?.transitCurrentDate || '',
    phase: cachedList?.phaseCurrentDate || '',
  });
  const [showPhaseIntroModal, setShowPhaseIntroModal] = useState(false);

  const tabLabels = useMemo(
    () => ({
      next_week: `Next 7 Days (${nextWeekItems.length})`,
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
      setActivityCurrentDate(cache.activityCurrentDate || '');
      setTransitCurrentDate(cache.transitCurrentDate || '');
      setPhaseCurrentDate(cache.phaseCurrentDate || '');
      comboDatesRef.current = {
        activity: cache.activityCurrentDate || '',
        transit: cache.transitCurrentDate || '',
        phase: cache.phaseCurrentDate || '',
      };
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
      const currentDate = pickCurrentDate(response) || '';
      comboDatesRef.current.transit = currentDate;
      setTransitCurrentDate(currentDate);
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
      const currentDate = pickCurrentDate(response) || '';
      comboDatesRef.current.phase = currentDate;
      setPhaseCurrentDate(currentDate);
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
      const currentDate = pickCurrentDate(response) || '';
      comboDatesRef.current.activity = currentDate;
      setActivityCurrentDate(currentDate);
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
          activityCurrentDate: comboDatesRef.current.activity,
          transitCurrentDate: comboDatesRef.current.transit,
          phaseCurrentDate: comboDatesRef.current.phase,
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
        nextWeekItems: overrides?.nextWeekItems || nextWeekItems,
        combosAsOfDate: overrides?.combosAsOfDate || combosAsOfDate.toISOString(),
        activityCurrentDate:
          overrides?.activityCurrentDate ?? comboDatesRef.current.activity,
        transitCurrentDate:
          overrides?.transitCurrentDate ?? comboDatesRef.current.transit,
        phaseCurrentDate:
          overrides?.phaseCurrentDate ?? comboDatesRef.current.phase,
      });
    },
    [
      activityItems,
      clientId,
      combinationItems,
      combosAsOfDate,
      innerYouItems,
      nextWeekItems,
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
        const response = await userService.generateAstrologerCustomCombination(
          clientId,
          dataType,
          item.heading,
          true,
        );

        let newInsights: string | undefined;
        if (response?.data && Array.isArray(response.data) && response.data[0]?.insights) {
          newInsights = String(response.data[0].insights);
        } else if (typeof response?.data === 'string') {
          newInsights = response.data;
        }

        if (newInsights) {
          const nextNextWeekItems =
            tab === 'next_week'
              ? nextWeekItems.map(it =>
                  it.id === item.id ? { ...it, insights: newInsights } : it,
                )
              : nextWeekItems;
          const nextActiveComboItems =
            tab === 'antar_dasha'
              ? activeComboItems.map(it =>
                  it.id === item.id ? { ...it, insights: newInsights } : it,
                )
              : activeComboItems;
          const nextTransitDetailItems =
            tab === 'transit_analysis'
              ? transitDetailItems.map(it =>
                  it.id === item.id ? { ...it, insights: newInsights } : it,
                )
              : transitDetailItems;
          const nextActivityItems =
            tab === 'dos_donts'
              ? activityItems.map(it =>
                  it.id === item.id ? { ...it, insights: newInsights } : it,
                )
              : activityItems;
          const nextInnerYouItems =
            tab === 'the_inner_you'
              ? innerYouItems.map(it =>
                  it.id === item.id ? { ...it, insights: newInsights } : it,
                )
              : innerYouItems;

          if (tab === 'next_week') {
            setNextWeekItems(nextNextWeekItems);
          } else if (tab === 'antar_dasha') {
            setActiveComboItems(nextActiveComboItems);
          } else if (tab === 'transit_analysis') {
            setTransitDetailItems(nextTransitDetailItems);
          } else if (tab === 'dos_donts') {
            setActivityItems(nextActivityItems);
          } else if (tab === 'the_inner_you') {
            setInnerYouItems(nextInnerYouItems);
          }

          const cacheKey = makeComboDetailCacheKey({
            kind: tab,
            mode: predictionMode,
            dataType,
            clientId,
            heading: item.heading,
            title: item.heading,
            collection: item.collection,
            pipeline: item.pipeline,
          });
          await setComboDetailCache(cacheKey, newInsights);
          await persistCombosCache({
            nextWeekItems: nextNextWeekItems,
            activeComboItems: nextActiveComboItems,
            transitDetailItems: nextTransitDetailItems,
            activityItems: nextActivityItems,
            innerYouItems: nextInnerYouItems,
          });
        }

        const apiMessage = String(response?.message || '').trim();
        Toast.show({
          type: 'success',
          text1: apiMessage || 'Prediction Refreshed',
          text2: apiMessage ? undefined : `Refreshed "${item.heading}"`,
          position: 'top',
          topOffset: 60,
          visibilityTime: apiMessage ? 3500 : 2500,
          text1NumberOfLines: 3,
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
    [clientId, predictionMode, persistCombosCache, userService, nextWeekItems, activeComboItems, transitDetailItems, activityItems, innerYouItems],
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
        const currentDate = pickCurrentDate(response) || comboDatesRef.current.transit;
        comboDatesRef.current.transit = currentDate;
        setTransitCurrentDate(currentDate);
        setTransitDetailItems(items);
        await persistCombosCache({
          transitDetailItems: items,
          transitCurrentDate: currentDate,
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
        const currentDate = pickCurrentDate(response) || comboDatesRef.current.activity;
        comboDatesRef.current.activity = currentDate;
        setActivityCurrentDate(currentDate);
        setActivityItems(items);
        await persistCombosCache({
          activityItems: items,
          activityCurrentDate: currentDate,
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

  const phaseOfLifeIntro = useMemo(() => {
    if (!mahadasha?.planet || !antardasha?.planet) {
      return null;
    }

    const mdRange =
      mahadasha.dateRange ||
      ((mahadasha as any).from && (mahadasha as any).to
        ? `${(mahadasha as any).from} to ${(mahadasha as any).to}`
        : (mahadasha as any).from || (mahadasha as any).to || '');

    const adRange =
      antardasha.dateRange ||
      ((antardasha as any).from && (antardasha as any).to
        ? `${(antardasha as any).from} to ${(antardasha as any).to}`
        : (antardasha as any).from || (antardasha as any).to || '');

    return {
      mdPlanet: mahadasha.planet,
      mdRange: formatDashaRangeForIntro(mdRange),
      adPlanet: antardasha.planet,
      adRange: formatDashaRangeForIntro(adRange),
    };
  }, [antardasha, mahadasha]);

  useEffect(() => {
    if (comboTab === 'antar_dasha' && phaseOfLifeIntro) {
      setShowPhaseIntroModal(true);
      return;
    }
    if (comboTab === 'transit_analysis' && phaseOfLifeIntro) {
      setShowPhaseIntroModal(true);
      return;
    }
    setShowPhaseIntroModal(false);
  }, [comboTab, phaseOfLifeIntro, clientId]);

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
            No Next 7 Days predictions found
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
              clientId,
              heading: item.heading,
              mode: predictionMode,
              insights: item.insights,
              dataType: 'next_week',
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
              mode: predictionMode,
              insights: item.insights,
              dataType: 'transit_details_list',
              collection: item.collection,
              pipeline: item.pipeline,
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
              clientId,
              heading: item.heading,
              mode: predictionMode,
              insights: item.insights,
              dataType: 'current_activity',
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
              clientId,
              heading: item.heading,
              mode: predictionMode,
              insights: item.insights,
              dataType: 'the_inner_you',
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
            clientId,
            heading: item.heading,
            mode: predictionMode,
            insights: item.insights,
            dataType: 'active_combinations',
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
      ? 'Next 7 Days'
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

  const phaseDateLabel = formatLongDate(
    phaseCurrentDate ||
      activityCurrentDate ||
      antardasha?.from ||
      antardasha?.dateRange?.split(/\s*(?:→|->|to)\s*/i)[0],
  );
  const transitDateLabel = formatLongDate(
    transitCurrentDate || activityCurrentDate,
  );
  const activityDateLabel = formatLongDate(activityCurrentDate);

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
          {comboTab === 'antar_dasha' && phaseDateLabel ? (
            <Text style={[styles.asOf, { color: textMuted }]}>
              Predictions from {phaseDateLabel}
            </Text>
          ) : comboTab === 'transit_analysis' && transitDateLabel ? (
            <Text style={[styles.asOf, { color: textPrimary }]}>
              Predictions As On {transitDateLabel}
            </Text>
          ) : comboTab === 'dos_donts' && activityDateLabel ? (
            <Text style={[styles.asOf, { color: textMuted }]}>
              Predictions As On {activityDateLabel}
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
                numberOfLines={1}
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
              {comboTab === 'transit_analysis'
                ? 'Transit Predictions'
                : 'Current Phase of Life'}
            </Text>
            {phaseOfLifeIntro ? (
              <ScrollView
                style={styles.phaseIntroScroll}
                showsVerticalScrollIndicator={false}
              >
                {comboTab === 'transit_analysis' ? (
                  <Text style={[styles.phaseIntroText, { color: textPrimary }]}>
                    Pay close attention to: A. Connections made by{' '}
                    <Text style={[styles.phaseIntroHighlight, { color: GOLD }]}>
                      {phaseOfLifeIntro.adPlanet}
                    </Text>{' '}
                    in transit and connections made by other planets in transit
                    with Natal chart{' '}
                    <Text style={[styles.phaseIntroHighlight, { color: GOLD }]}>
                      {phaseOfLifeIntro.adPlanet}
                    </Text>
                    . Combinations marked as Natal, as they exist in your birth
                    chart as well. You may experience them more vividly. B.
                    Connections made by{' '}
                    <Text style={[styles.phaseIntroHighlight, { color: GOLD }]}>
                      {phaseOfLifeIntro.mdPlanet}
                    </Text>{' '}
                    in transit and connections made by other planets in transit
                    with Natal chart{' '}
                    <Text style={[styles.phaseIntroHighlight, { color: GOLD }]}>
                      {phaseOfLifeIntro.mdPlanet}
                    </Text>
                    . C. Connections made between{' '}
                    <Text style={[styles.phaseIntroHighlight, { color: GOLD }]}>
                      {phaseOfLifeIntro.mdPlanet}
                    </Text>{' '}
                    and{' '}
                    <Text style={[styles.phaseIntroHighlight, { color: GOLD }]}>
                      {phaseOfLifeIntro.adPlanet}
                    </Text>{' '}
                    as they both are active for you.
                  </Text>
                ) : (
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
                )}
              </ScrollView>
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
    fontFamily: fontFamily.semiBold,
    marginBottom: 10,
  },
  phaseIntroScroll: {
    maxHeight: 280,
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
    fontFamily: fontFamily.semiBold,
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
    fontFamily: fontFamily.semiBold,
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
    fontFamily: fontFamily.regular,
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
    fontFamily: fontFamily.semiBold,
  },
  numberedTitle: {
    flex: 1,
    flexShrink: 1,
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
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
