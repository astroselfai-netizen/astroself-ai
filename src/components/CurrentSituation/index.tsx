import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  responsiveWidth,
  responsiveHeight,
  fontFamily,
} from '../../constant/theme';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HouseService, {
  AnalysisTabSection,
  SubTab,
} from '../../services/house/house.service';
import { useTheme } from '../../context/ThemeContext';
import { getCardIcon } from '../../utils/cardIconMapper';

interface CurrentSituationProps {
  selectedMemberId?: string;
  isChild?: boolean;
  current_plan?: string;
  first_user?: boolean;
  isPrimaryMember?: boolean;
  isProcessingPending?: boolean;
  onShowBuyMembershipModal?: (featureName?: string) => void;
}

const CARD_THEMES = [
  { lightBg: '#FFF9F1', darkBg: '#3D4F63', accent: '#F27420' },
  { lightBg: '#F5F8FF', darkBg: '#3A4A62', accent: '#3B66F5' },
  { lightBg: '#F4FAF6', darkBg: '#3A4E56', accent: '#4CAF50' },
];

const is360ViewOfLifeTab = (tabType: string) => {
  const lower = tabType.toLowerCase();
  return lower.includes('360') && lower.includes('view of life');
};

const getActiveTabStorageKey = (memberId: string) =>
  `CURRENT_SITUATION_ACTIVE_TAB_${memberId}`;

const CurrentSituation: React.FC<CurrentSituationProps> = ({
  selectedMemberId,
  isChild = false,
  current_plan,
  first_user = false,
  isPrimaryMember = false,
  isProcessingPending = false,
  onShowBuyMembershipModal,
}) => {
  const navigation = useNavigation<any>();
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';

  const [sections, setSections] = useState<AnalysisTabSection[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const openedUpgradeModalRef = useRef('');

  const persistActiveTabIndex = useCallback(
    async (index: number) => {
      if (!selectedMemberId) {
        return;
      }
      try {
        await AsyncStorage.setItem(
          getActiveTabStorageKey(selectedMemberId),
          String(index),
        );
      } catch (err) {
        console.error('Failed to persist active tab index:', err);
      }
    },
    [selectedMemberId],
  );

  const restoreActiveTabIndex = useCallback(
    async (headingsLength: number) => {
      if (!selectedMemberId || headingsLength === 0) {
        return 0;
      }
      try {
        const saved = await AsyncStorage.getItem(
          getActiveTabStorageKey(selectedMemberId),
        );
        if (saved != null) {
          const index = parseInt(saved, 10);
          if (!Number.isNaN(index) && index >= 0 && index < headingsLength) {
            return index;
          }
        }
      } catch (err) {
        console.error('Failed to restore active tab index:', err);
      }
      return 0;
    },
    [selectedMemberId],
  );

  const fetchPredictionHeadings = useCallback(async () => {
    if (!selectedMemberId) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const headings = await HouseService.getAnalysisPredictionHeadings(
        selectedMemberId,
      );
      const restoredIndex = await restoreActiveTabIndex(headings.length);
      setSections(headings);
      setActiveTabIndex(restoredIndex);
    } catch (err: any) {
      const message = String(err.message || '').toLowerCase();
      const isSubscriptionError =
        message.includes('subscription') ||
        message.includes('no active') ||
        message.includes('plan');

      if (isSubscriptionError && onShowBuyMembershipModal) {
        onShowBuyMembershipModal('Predictions');
        setError(null);
      } else {
        setError(err.message || 'Failed to fetch prediction headings');
      }
      setSections([]);
      setActiveTabIndex(0);
    } finally {
      setLoading(false);
    }
  }, [selectedMemberId, restoreActiveTabIndex, onShowBuyMembershipModal]);

  useEffect(() => {
    if (selectedMemberId) {
      fetchPredictionHeadings();
    } else {
      setSections([]);
      setActiveTabIndex(0);
    }
  }, [selectedMemberId, fetchPredictionHeadings]);

  const hasPremiumPlanAccess =
    current_plan === 'family_plan' || current_plan === 'eternal_path';

  // primary_mamber === 'True' && first_user === true && cosmic_foundation
  const isPrimaryFirstUser = isPrimaryMember && first_user;
  const isPrimaryFirstCosmicFoundation =
    isPrimaryFirstUser && current_plan === 'cosmic_foundation';

  const hasAnalysisTabAccess =
    hasPremiumPlanAccess || isPrimaryFirstCosmicFoundation;

  const canUseTab = (tabType: string) => {
    if (!hasAnalysisTabAccess) {
      return false;
    }
    if (is360ViewOfLifeTab(tabType) && isPrimaryFirstCosmicFoundation) {
      return false;
    }
    return true;
  };

  const activeSection = useMemo(
    () => sections[activeTabIndex] ?? null,
    [sections, activeTabIndex],
  );

  const subTabs: SubTab[] = useMemo(() => {
    const list = activeSection?.sub_tab;
    return Array.isArray(list) ? list : [];
  }, [activeSection]);

  useFocusEffect(
    useCallback(() => {
      if (!selectedMemberId || sections.length === 0) {
        return;
      }
      restoreActiveTabIndex(sections.length).then(index => {
        setActiveTabIndex(index);
      });
    }, [selectedMemberId, sections.length, restoreActiveTabIndex]),
  );

  useEffect(() => {
    openedUpgradeModalRef.current = '';
  }, [selectedMemberId]);

  useEffect(() => {
    const tabType = activeSection?.tab_type;
    if (!tabType || loading || error || !onShowBuyMembershipModal) {
      return;
    }
    const isTabLocked =
      !hasAnalysisTabAccess ||
      (is360ViewOfLifeTab(tabType) && isPrimaryFirstCosmicFoundation);

    if (!isTabLocked) {
      return;
    }

    const modalKey = `${selectedMemberId}:${tabType}`;
    if (openedUpgradeModalRef.current === modalKey) {
      return;
    }
    openedUpgradeModalRef.current = modalKey;

    onShowBuyMembershipModal(
      is360ViewOfLifeTab(tabType) && isPrimaryFirstCosmicFoundation
        ? '360° View of Life'
        : tabType,
    );
  }, [
    activeSection,
    loading,
    error,
    selectedMemberId,
    onShowBuyMembershipModal,
    isPrimaryFirstCosmicFoundation,
    hasAnalysisTabAccess,
  ]);

  const handleTabPress = (index: number, section: AnalysisTabSection) => {
    setActiveTabIndex(index);
    persistActiveTabIndex(index);

    if (!canUseTab(section.tab_type) && onShowBuyMembershipModal) {
      onShowBuyMembershipModal(
        is360ViewOfLifeTab(section.tab_type) && isPrimaryFirstCosmicFoundation
          ? '360° View of Life'
          : section.tab_type,
      );
    }
  };

  const isSubTabDisabled = (title: string) => {
    const parentTabType = activeSection?.tab_type || '';
    if (!canUseTab(parentTabType)) {
      return true;
    }

    const lower = title.toLowerCase();
    const isPersonality =
      lower.includes('personality') && lower.includes('your');
    const isLifeAtMoment = lower.includes('birth chart');
    const isAntardasha =
      lower.includes('antardasha') || lower.includes('active planet');

    const isDisabledByInfoContainer =
      isProcessingPending &&
      (isPersonality || isLifeAtMoment || isAntardasha);
    const isDisabledByChild =
      isChild && (isLifeAtMoment || isAntardasha);

    return isDisabledByInfoContainer || isDisabledByChild;
  };

  const handleSubTabPress = (subTab: SubTab) => {
    if (isSubTabDisabled(subTab.title)) {
      return;
    }

    const parentTabType = activeSection?.tab_type || '';

    if (!canUseTab(parentTabType)) {
      if (is360ViewOfLifeTab(parentTabType) && isPrimaryFirstCosmicFoundation) {
        onShowBuyMembershipModal?.('360° View of Life');
      } else {
        onShowBuyMembershipModal?.(parentTabType || 'Predictions');
      }
      return;
    }

    const parentLower = parentTabType.toLowerCase();
    const titleLower = subTab.title.toLowerCase();
    const isNatalChartInsights =
      parentLower.includes('birth chart') ||
      parentLower.includes('natal chart') ||
      titleLower.includes('birth chart');
    const isPaidPlanForPrimaryBirthChart =
      current_plan === 'family_plan' || current_plan === 'eternal_path';

    if (
      isNatalChartInsights &&
      isPrimaryMember &&
      !isPaidPlanForPrimaryBirthChart &&
      !isPrimaryFirstCosmicFoundation &&
      onShowBuyMembershipModal
    ) {
      onShowBuyMembershipModal('Birth Chart Insights');
      return;
    }
    if (
      isNatalChartInsights &&
      current_plan === 'cosmic_foundation' &&
      !first_user &&
      onShowBuyMembershipModal
    ) {
      onShowBuyMembershipModal('Birth Chart Insights');
      return;
    }


    console.log('subTab---->', {
      userId: selectedMemberId,
      cardTitles: subTab.title,
      tab: parentTabType,
      current_plan,
      subCards: subTabs,
    });

    persistActiveTabIndex(activeTabIndex);

    navigation.navigate('ChatWithPrompts', {
      userId: selectedMemberId,
      cardTitles: subTab.title,
      tab: parentTabType,
      current_plan,
      subCards: subTabs,
    });
  };

  const cardBg = isDark ? '#2A3F58' : colors.white;
  const borderSubtle = isDark ? 'rgba(238, 229, 202, 0.22)' : '#E8E4DC';
  const textPrimary = isDark ? colors.themeTextWhite : colors.DarkNavy;
  const textMuted = isDark ? colors.textSecondary || '#B8B0A0' : '#6B7280';

  const renderSubTabCard = (
    subTab: SubTab,
    index: number,
    layout: 'grid' | 'full',
  ) => {
    const themeIdx = index % CARD_THEMES.length;
    const cardTheme = CARD_THEMES[themeIdx];
    const disabled = isSubTabDisabled(subTab.title);
    const icon = getCardIcon(subTab.title, subTab.title);

    if (layout === 'full') {
      return (
        <TouchableOpacity
          key={`${activeTabIndex}-${subTab.id}-${subTab.title}-full`}
          activeOpacity={0.85}
          disabled={disabled}
          onPress={() => handleSubTabPress(subTab)}
          style={[
            styles.fullWidthCard,
            {
              backgroundColor: isDark ? cardTheme.darkBg : cardTheme.lightBg,
              opacity: disabled ? 0.5 : 1,
            },
          ]}
        >
          <View style={styles.fullWidthIconWrap}>
            <Image source={icon} style={styles.fullWidthIcon} />
          </View>
          <View style={styles.fullWidthTextWrap}>
            <Text
              style={[styles.cardTitle, { color: textPrimary }]}
              numberOfLines={3}
            >
              {subTab.title}
            </Text>
          </View>
          <View
            style={[styles.chevronCircle, { backgroundColor: colors.white }]}
          >
            <Text style={[styles.chevron, { color: cardTheme.accent }]}>›</Text>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={`${activeTabIndex}-${subTab.id}-${subTab.title}`}
        activeOpacity={0.85}
        disabled={disabled}
        onPress={() => handleSubTabPress(subTab)}
        style={[
          styles.gridCard,
          {
            backgroundColor: isDark ? cardTheme.darkBg : cardTheme.lightBg,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <View style={styles.gridIconWrap}>
          <Image source={icon} style={styles.gridIcon} />
        </View>
        <Text
          style={[styles.cardTitle, styles.gridCardTitle, { color: textPrimary }]}
          numberOfLines={4}
        >
          {subTab.title}
        </Text>
        <View
          style={[
            styles.chevronCircle,
            styles.gridChevron,
            { backgroundColor: colors.white },
          ]}
        >
          <Text style={[styles.chevron, { color: cardTheme.accent }]}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTabContent = () => {
    const activeTabType = activeSection?.tab_type || '';

    if (!canUseTab(activeTabType)) {
      return null;
    }

    if (subTabs.length === 0) {
      return (
        <Text style={[styles.emptyText, { color: textMuted }]}>
          No items in this category.
        </Text>
      );
    }

    const rows: React.ReactNode[] = [];
    let i = 0;
    let rowKey = 0;

    while (i < subTabs.length) {
      const remaining = subTabs.length - i;
      if (remaining === 1) {
        rows.push(
          <View key={`row-${activeTabIndex}-${rowKey++}`}>
            {renderSubTabCard(subTabs[i], i, 'full')}
          </View>,
        );
        i += 1;
      } else {
        rows.push(
          <View key={`row-${activeTabIndex}-${rowKey++}`} style={styles.gridRow}>
            {renderSubTabCard(subTabs[i], i, 'grid')}
            {renderSubTabCard(subTabs[i + 1], i + 1, 'grid')}
          </View>,
        );
        i += 2;
      }
    }

    return <View style={styles.cardsWrap}>{rows}</View>;
  };

  const panelStyle = {
    backgroundColor: cardBg,
    borderColor: borderSubtle,
  };

  return (
    <View style={styles.wrapper}>
      {sections.length > 0 && !loading && !error && (
        <View style={[styles.tabsPanel, panelStyle]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScroll}
          >
            {sections.map((section, index) => {
              const isActive = index === activeTabIndex;
              const isTabLocked = !canUseTab(section.tab_type);
              return (
                <TouchableOpacity
                  key={`${section.tab_type}-${index}`}
                  style={[styles.tabItem, isTabLocked && styles.tabItemLocked]}
                  onPress={() => handleTabPress(index, section)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color: isActive ? colors.Orangeaccentcolor : textMuted,
                      },
                      isActive && styles.tabTextActive,
                      isTabLocked && !isActive && styles.tabTextLocked,
                    ]}
                    numberOfLines={2}
                  >
                    {section.tab_type}
                  </Text>
                  {isActive && (
                    <View
                      style={[
                        styles.tabIndicator,
                        { backgroundColor: colors.Orangeaccentcolor },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <View style={[styles.contentPanel, panelStyle]}>
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.Orangeaccentcolor} />
            <Text style={[styles.stateText, { color: textMuted }]}>
              Loading predictions...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <Text style={[styles.stateText, { color: textMuted }]}>{error}</Text>
            <TouchableOpacity
              onPress={fetchPredictionHeadings}
              style={styles.retryBtn}
            >
              <Text style={[styles.retryText, { color: colors.Orangeaccentcolor }]}>
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        ) : sections.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={[styles.stateText, { color: textMuted }]}>
              No prediction categories available.
            </Text>
          </View>
        ) : (
          renderTabContent()
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: responsiveWidth(3),
    gap: responsiveWidth(2.5),
  },
  tabsPanel: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    paddingVertical: responsiveWidth(1),
  },
  contentPanel: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    padding: responsiveWidth(3),
    minHeight: responsiveHeight(20),
  },
  tabsScroll: {
    paddingHorizontal: responsiveWidth(2),
    paddingVertical: responsiveWidth(1.5),
  },
  tabItem: {
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(2),
    // paddingVertical: responsiveWidth(1),
    minWidth: responsiveWidth(28),
  },
  tabItemLocked: {
    opacity: 0.55,
  },
  tabTextLocked: {
    opacity: 0.7,
   },
  tabText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '600',
  },
  tabTextActive: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '700',
  },
  tabIndicator: {
    width: '70%',
    height: 3,
    borderRadius: 2,
    marginTop: responsiveWidth(1.5),
  },
  cardsWrap: {
    gap: responsiveWidth(2.5),
  },
  gridRow: {
    flexDirection: 'row',
    gap: responsiveWidth(2.5),
  },
  gridCard: {
    flex: 1,
    borderRadius: 16,
    padding: responsiveWidth(3),
    minHeight: responsiveHeight(16),
    position: 'relative',
  },
  gridIconWrap: {
    alignItems: 'center',
    marginBottom: responsiveWidth(2),
  },
  gridIcon: {
    width: responsiveWidth(14),
    height: responsiveWidth(14),
    resizeMode: 'contain',
  },
  gridCardTitle: {
    textAlign: 'center',
    paddingBottom: responsiveWidth(6),
  },
  gridChevron: {
    position: 'absolute',
    right: responsiveWidth(2),
    bottom: responsiveWidth(2),
  },
  fullWidthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: responsiveWidth(3),
    minHeight: responsiveHeight(10),
  },
  fullWidthIconWrap: {
    marginRight: responsiveWidth(2.5),
  },
  fullWidthIcon: {
    width: responsiveWidth(12),
    height: responsiveWidth(12),
    resizeMode: 'contain',
  },
  fullWidthTextWrap: {
    flex: 1,
    paddingRight: responsiveWidth(2),
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    fontWeight: '700',
    lineHeight: 19,
  },
  chevronCircle: {
    width: responsiveWidth(7),
    height: responsiveWidth(7),
    borderRadius: responsiveWidth(3.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: -2,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveHeight(4),
    gap: responsiveHeight(1),
  },
  stateText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    paddingVertical: responsiveHeight(3),
  },
  retryBtn: {
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveWidth(2),
  },
  retryText: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
  },
});

export default CurrentSituation;
