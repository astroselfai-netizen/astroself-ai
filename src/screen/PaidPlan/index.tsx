// PaidPlanScreen.tsx

import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  ScrollView,
  StatusBar,
  Image,
} from 'react-native';
import {
  fontFamily,
  responsiveWidth,
  responsiveHeight,
} from '../../constant/theme';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainContainer } from '../../components/common/mainContainer';
import { useTheme } from '../../context/ThemeContext';
import { useProfileData } from '../../hooks/useProfileData';
import http from '../../utils/http';

const FREE_FEATURES = [
  'Major Life Cycle',
  'Current Chapter of Life',
  'Life Guidance',
  'Recent Experience',
  'Your Patterns',
  'Your Manifestations',
  'Your Personality',
  'About Your Partner',
];

const INDIVIDUAL_MONTHLY_UPDATES = [
  'Mahadasha updates',
  'Antardasha changes',
  'Transit-based predictions',
  "Monthly dos & don'ts",
  'Timely guidance based on planetary movement',
];

const INDIVIDUAL_HOUSE_BONUS = [
  'Strengths',
  'Advice',
  'Daily Tasks',
  'Think Twice (Things to be cautious about)',
  'What Combinations Are Active',
];

const INDIVIDUAL_ALSO_INCLUDES = [
  'Dynamic monthly insights',
  'Evolving predictions',
  'Guidance updated with every change',
];

const FAMILY_FEATURES = [
  'Separate monthly updates for each member',
  "Personalized dos & don'ts for each member",
  'Separate active combinations for each member',
  'Individual dynamic guidance for every member',
  'Full 12-house bonus analysis for every member',
];

const FAMILY_UPDATE_TRIGGERS = [
  { icon: '🔗', label: 'Mahadasha\nChange' },
  { icon: '🔗', label: 'Antardasha\nChange' },
  { icon: '✦', label: 'Transit\nChange' },
];

type CheckVariant = 'blue' | 'green' | 'orange';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  HomeScreen: undefined;
  ContinueWithOtp: undefined;
  ForgotPasswordOtp: undefined;
  AddNewMember: undefined;
  MemberPlanManagement: { planType?: 'individual' | 'family' };
  ProfileScreen: undefined;
};

type PaidPlanScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Login'
>;

type PlanApiItem = {
  id: number;
  title: string;
  price: string;
  priceMode?: string;
};

const getPriceUnit = (priceMode?: string) => {
  const mode = (priceMode ?? 'month').toLowerCase();
  return mode.includes('year') ? '/ year' : '/ month';
};

const PriceDisplay = ({
  price,
  priceMode,
  loading,
  color,
  size = 'large',
}: {
  price: string;
  priceMode?: string;
  loading: boolean;
  color: string;
  size?: 'large' | 'medium';
}) => {
  if (loading) {
    return <ActivityIndicator size="small" color={color} style={{ marginVertical: 8 }} />;
  }
  return (
    <View style={styles.priceRow}>
      <Text
        style={[
          size === 'large' ? styles.priceAmountLarge : styles.priceAmountMedium,
          { color },
        ]}
      >
        ₹ {price}
      </Text>
      <Text style={[styles.priceUnitText, { color }]}>{getPriceUnit(priceMode)}</Text>
    </View>
  );
};

type PlansApiResponse = {
  status: boolean;
  count?: number;
  data?: any[];
};

const PaidPlanScreen = () => {
  const { theme, colors } = useTheme();
  const navigation = useNavigation<PaidPlanScreenNavigationProp>();
  const { refreshProfileData } = useProfileData();

  const renderCircleCheck = (variant: CheckVariant) => {
    const bg =
      variant === 'blue' ? '#3B6FD4' : variant === 'green' ? '#22C55E' : '#F2994A';
    return (
      <View style={[styles.circleCheck, { backgroundColor: bg }]}>
        <Text style={styles.circleCheckMark}>✓</Text>
      </View>
    );
  };

  const renderFeatureList = (items: string[], variant: CheckVariant) =>
    items.map((item, i) => (
      <View key={`${item}-${i}`} style={styles.featureRow}>
        {renderCircleCheck(variant)}
        <Text
          style={[
            styles.featureText,
            variant !== 'blue'
              ? styles.featureTextLight
              : {
                  color: theme === 'dark' ? colors.white : '#1F2937',
                },
          ]}
        >
          {item}
        </Text>
      </View>
    ));

  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [plans, setPlans] = useState<PlanApiItem[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      if (refreshProfileData) refreshProfileData();
    }, [refreshProfileData]),
  );

  const fetchPlans = useCallback(async () => {
    setPlansLoading(true);
    setPlansError(null);
    try {
      const res = await http.get<PlansApiResponse>('/plans');
      const raw = Array.isArray(res.data?.data) ? res.data.data : [];
      const onlyCards: PlanApiItem[] = raw.filter(
        (x: any) => typeof x?.id === 'number' && typeof x?.title === 'string',
      );
      setPlans(onlyCards);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || 'Unable to load plans.';
      setPlansError(String(msg));
      setPlans([]);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPlans();
    }, [fetchPlans]),
  );

  const freePlan = useMemo(
    () => plans.find(p => p.title?.toLowerCase().includes('free')) || null,
    [plans],
  );
  const individualPlan = useMemo(
    () =>
      plans.find(p => p.title?.toLowerCase().includes('individual')) || null,
    [plans],
  );
  const familyPlan = useMemo(
    () => plans.find(p => p.title?.toLowerCase().includes('family')) || null,
    [plans],
  );

  const individualPrice = individualPlan?.price ?? '299';
  const familyPrice = familyPlan?.price ?? '999';

  const handleStartFree = () => {
    navigation.navigate('ProfileScreen');
  };

  const handleSelectPlan = (planType: 'individual' | 'family') => {
    const tabNav = navigation.getParent?.() ?? navigation;
    tabNav.navigate('ProfileTab', {
      screen: 'ProfileScreen',
      params: { planType },
    });
  };

  return (
    // <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
    <MainContainer>
      {/* Header */}
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent={true}
      />
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Image
            source={require('../../assets/icons/back.png')}
            style={[
              styles.backIcon,
              {
                tintColor:
                  theme === 'dark' ? colors.textPrimary : colors.DarkNavy,
              },
            ]}
          />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text
            style={[
              styles.headerTitle,
              {
                color: theme === 'dark' ? colors.white : colors.DarkNavy,
              },
            ]}
          >
            Choose a Plan
          </Text>
        </View>
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={require('../../assets/image/PaidPlanImage.png')}
          resizeMode="cover"
          style={styles.imagePaidPlan}
        />
      </View>

      {/* Top features banner */}
      <View style={[styles.topFeaturesRow, { backgroundColor: theme === 'dark' ? 'rgba(34,49,73,0.9)' : 'rgba(223,138,93,0.15)' }]}>
        <Text style={[styles.topFeatureItem, { color: theme === 'dark' ? colors.white : colors.DarkNavy }]}>✓ Personalized Insights</Text>
        <Text style={[styles.topFeatureItem, { color: theme === 'dark' ? colors.white : colors.DarkNavy }]}>✓ Dynamic Life Intelligence</Text>
        <Text style={[styles.topFeatureItem, { color: theme === 'dark' ? colors.white : colors.DarkNavy }]}>✓ Guidance + Tasks</Text>
      </View>

      {/* Main Content - 3 Plan Cards */}
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollIndicatorInsets={{ right: 1 }}
      >
        {plansError ? (
          <TouchableOpacity
            onPress={fetchPlans}
            activeOpacity={0.8}
            style={styles.plansErrorBanner}
          >
            <Text style={styles.plansErrorText}>{plansError} Tap to retry.</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.planCardsColumn}>
          {/* FREE PLAN */}
          <View
            style={[
              styles.planCard,
              styles.planCardFree,
              {
                backgroundColor: theme === 'dark' ? colors.cardBackground : '#F3F4F8',
                borderColor: theme === 'dark' ? colors.themeBorderDropdown : '#E5E7EB',
              },
            ]}
          >
            <Text
              style={[
                styles.planCardTitle,
                styles.planCardTitleCentered,
                { color: theme === 'dark' ? colors.white : '#111827' },
              ]}
            >
              FREE
            </Text>
            <PriceDisplay
              price={freePlan?.price ?? '0'}
              priceMode={freePlan?.priceMode}
              loading={plansLoading && !freePlan?.price}
              color="#2563EB"
            />
            <View style={styles.alwaysFreePill}>
              <Text style={styles.alwaysFreePillText}>Always Free</Text>
            </View>
            <Text
              style={[
                styles.planDescription,
                { color: theme === 'dark' ? colors.textSecondary : '#6B7280' },
              ]}
            >
              Get your core astrology insights at no cost.
            </Text>

            <Text style={styles.sectionHeaderPurple}>YOU GET (ALL FREE)</Text>
            {renderFeatureList(FREE_FEATURES, 'blue')}

            <View style={styles.freeHighlightBox}>
              <Text style={styles.freeHighlightIcon}>🎁</Text>
              <View style={styles.freeHighlightTextWrap}>
                <Text style={styles.freeHighlightTitle}>100% FREE FOR ALL USERS</Text>
                <Text style={styles.freeHighlightSub}>
                  No payment required.{'\n'}No credit card needed.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.ctaCurrentPlan}
              onPress={handleStartFree}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaCurrentPlanText}>Current Plan</Text>
            </TouchableOpacity>
          </View>

          {/* INDIVIDUAL PLAN */}
          <View style={styles.individualCardOuter}>
            <View style={styles.mostPopularBadge}>
              <Text style={styles.mostPopularBadgeText}>★ MOST POPULAR</Text>
            </View>
            <View style={[styles.planCard, styles.planCardIndividual]}>
              <Text style={[styles.planCardTitle, styles.planCardTitleCentered, styles.textWhite]}>
                INDIVIDUAL PLAN
              </Text>
              <PriceDisplay
                price={individualPrice}
                priceMode={individualPlan?.priceMode}
                loading={plansLoading && !individualPlan?.price}
                color="#FFFFFF"
              />

              <View style={styles.autoUpdateBox}>
                <Text style={styles.autoUpdateIcon}>↻</Text>
                <Text style={styles.autoUpdateText}>
                  Updates automatically as Mahadasha, Antardasha & Transits change.
                </Text>
              </View>

              <Text style={styles.sectionHeaderGreen}>MONTHLY DYNAMIC UPDATES</Text>
              {renderFeatureList(INDIVIDUAL_MONTHLY_UPDATES, 'green')}

              <Text style={styles.sectionHeaderOrange}>★ BONUS: FULL HOUSE ANALYSIS</Text>
              <Text style={styles.sectionSubtextWhite}>For all 12 houses, receive:</Text>
              {renderFeatureList(INDIVIDUAL_HOUSE_BONUS, 'orange')}

              <Text style={styles.sectionHeaderLight}>ALSO INCLUDES</Text>
              {renderFeatureList(INDIVIDUAL_ALSO_INCLUDES, 'green')}

              <View style={styles.individualHighlightBox}>
                <Text style={styles.individualHighlightIcon}>📅</Text>
                <Text style={styles.individualHighlightText}>
                  Always updated. Always relevant.{'\n'}No manual refresh needed.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.ctaOrange}
                onPress={() => handleSelectPlan('individual')}
                activeOpacity={0.85}
              >
                <Text style={styles.ctaOrangeText}>Start Individual →</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* FAMILY PLAN */}
          <View style={[styles.planCard, styles.planCardFamily]}>
            <Text style={[styles.planCardTitle, styles.planCardTitleCentered, styles.textWhite]}>
              FAMILY PLAN
            </Text>
            <PriceDisplay
              price={familyPrice}
              priceMode={familyPlan?.priceMode}
              loading={plansLoading && !familyPlan?.price}
              color="#FFFFFF"
            />

            <View style={styles.familySubtitleBox}>
              <Text style={styles.familySubtitleText}>
                Everything in Individual Plan for up to 5 members
              </Text>
            </View>

            <View style={styles.familyIconWrap}>
              <Image
                source={require('../../assets/icons/subscription.png')}
                style={styles.familyIcon}
                resizeMode="contain"
              />
            </View>

            {renderFeatureList(FAMILY_FEATURES, 'green')}

            <View style={styles.familyMembersBox}>
              <Text style={styles.familyMembersIcon}>👥</Text>
              <View style={styles.familyMembersTextWrap}>
                <Text style={styles.familyMembersTitle}>UP TO 5 MEMBERS</Text>
                <Text style={styles.familyMembersSub}>
                  Manage up to 5 profiles in one plan.
                </Text>
              </View>
            </View>

            <Text style={[styles.sectionHeaderLight, styles.updateTriggeredHeader]}>
              Update Triggered By
            </Text>
            <View style={styles.updateTriggersRow}>
              {FAMILY_UPDATE_TRIGGERS.map((item, i) => (
                <View key={i} style={styles.updateTriggerCol}>
                  <Text style={styles.updateTriggerIcon}>{item.icon}</Text>
                  <Text style={styles.updateTriggerLabel}>{item.label}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.ctaPurple}
              onPress={() => handleSelectPlan('family')}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaPurpleText}>Upgrade to Family →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </MainContainer>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'android' ? 90 : 90,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop:
      Platform.OS === 'android'
        ? responsiveHeight('0.5%')
        : responsiveWidth('12%'),
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
    position: 'relative',
    minHeight: 50,
  },
  imageContainer: {
    // width: '92%',
    // width:408,
    height:98,
    borderRadius: 8,
    // justifyContent: 'center',
    // alignItems: 'center',
    overflow: "hidden",
    marginBottom: responsiveWidth(4),
    marginHorizontal: responsiveWidth(4),
    // backgroundColor: colors.transparent,
  },
  imagePaidPlan: {
    width: '100%',
    height: "100%",
    borderRadius: 8,
    // marginHorizontal: responsiveWidth(4),
    // overflow: 'hidden',
    resizeMode: "cover",
  },
  backBtn: {
    // position: 'absolute',
    left: responsiveWidth('2'),
    // padding: 8,
    // top:
    //   Platform.OS === 'android'
    //     ? responsiveWidth('11.5%')
    //     : responsiveWidth('1.5%'),
    // zIndex: 1,
  },
  backIcon: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    resizeMode: 'contain',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginLeft: -responsiveWidth(5),
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  topFeaturesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: responsiveWidth(4),
    marginBottom: 12,
    borderRadius: 8,
    gap: 8,
  },
  topFeatureItem: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
  },
  plansErrorBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  plansErrorText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: '#B91C1C',
    textAlign: 'center',
  },
  planCardsColumn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 20,
  },
  planCard: {
    width: '100%',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  planCardFree: {},
  planCardIndividual: {
    backgroundColor: '#0F1A2E',
    borderColor: '#F2994A',
    borderWidth: 2,
    marginTop: 14,
  },
  planCardFamily: {
    backgroundColor: '#0F1A2E',
    borderColor: '#7C3AED',
    borderWidth: 1.5,
  },
  individualCardOuter: {
    position: 'relative',
    marginTop: 8,
  },
  mostPopularBadge: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    zIndex: 2,
    backgroundColor: '#F2994A',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#F2994A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 4,
  },
  mostPopularBadgeText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: '#0F1A2E',
    letterSpacing: 0.4,
  },
  planCardTitle: {
    fontSize: 20,
    fontFamily: fontFamily.bold,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  planCardTitleCentered: {
    textAlign: 'center',
  },
  textWhite: {
    color: '#FFFFFF',
  },
  planDescription: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 4,
  },
  priceAmountLarge: {
    fontSize: 32,
    fontFamily: fontFamily.bold,
  },
  priceAmountMedium: {
    fontSize: 28,
    fontFamily: fontFamily.bold,
  },
  priceUnitText: {
    fontSize: 15,
    fontFamily: fontFamily.regular,
    opacity: 0.9,
  },
  alwaysFreePill: {
    alignSelf: 'center',
    borderWidth: 1.5,
    borderColor: '#2563EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 5,
    marginBottom: 10,
  },
  alwaysFreePillText: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
    color: '#2563EB',
  },
  sectionHeaderPurple: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: '#7C3AED',
    letterSpacing: 0.3,
    marginTop: 6,
    marginBottom: 10,
  },
  sectionHeaderGreen: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: '#22C55E',
    letterSpacing: 0.3,
    marginTop: 14,
    marginBottom: 10,
  },
  sectionHeaderOrange: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: '#F2994A',
    letterSpacing: 0.3,
    marginTop: 14,
    marginBottom: 6,
  },
  sectionHeaderLight: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: 'rgba(255,255,255,0.95)',
    letterSpacing: 0.3,
    marginTop: 14,
    marginBottom: 10,
  },
  sectionSubtextWhite: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 8,
  },
  circleCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
    flexShrink: 0,
  },
  circleCheckMark: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: fontFamily.bold,
    lineHeight: 13,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 9,
    width: '100%',
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: '#1F2937',
    lineHeight: 19,
  },
  featureTextLight: {
    color: 'rgba(255,255,255,0.92)',
  },
  freeHighlightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(59, 111, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 111, 212, 0.25)',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    marginBottom: 14,
    gap: 10,
  },
  freeHighlightIcon: {
    fontSize: 22,
  },
  freeHighlightTextWrap: {
    flex: 1,
  },
  freeHighlightTitle: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: '#2563EB',
    marginBottom: 4,
  },
  freeHighlightSub: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: '#4B5563',
    lineHeight: 16,
  },
  ctaCurrentPlan: {
    backgroundColor: '#A5B4FC',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaCurrentPlanText: {
    fontSize: 15,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  autoUpdateBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 4,
    gap: 10,
  },
  autoUpdateIcon: {
    fontSize: 18,
    color: '#A78BFA',
  },
  autoUpdateText: {
    flex: 1,
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 17,
  },
  individualHighlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F2994A',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    marginBottom: 14,
    gap: 10,
    backgroundColor: 'rgba(242, 153, 74, 0.08)',
  },
  individualHighlightIcon: {
    fontSize: 20,
  },
  individualHighlightText: {
    flex: 1,
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
    color: '#F2994A',
    lineHeight: 17,
  },
  ctaOrange: {
    backgroundColor: '#F2994A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  ctaOrangeText: {
    fontSize: 15,
    fontFamily: fontFamily.bold,
    color: '#0F1A2E',
  },
  familySubtitleBox: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  familySubtitleText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 17,
  },
  familyIconWrap: {
    alignItems: 'center',
    marginBottom: 14,
  },
  familyIcon: {
    width: 56,
    height: 56,
    tintColor: '#A78BFA',
  },
  familyMembersBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    marginBottom: 8,
    gap: 10,
  },
  familyMembersIcon: {
    fontSize: 22,
  },
  familyMembersTextWrap: {
    flex: 1,
  },
  familyMembersTitle: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: '#A78BFA',
    marginBottom: 4,
  },
  familyMembersSub: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 16,
  },
  updateTriggeredHeader: {
    textAlign: 'center',
    marginTop: 16,
  },
  updateTriggersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  updateTriggerCol: {
    flex: 1,
    alignItems: 'center',
  },
  updateTriggerIcon: {
    fontSize: 20,
    color: '#A78BFA',
    marginBottom: 6,
  },
  updateTriggerLabel: {
    fontSize: 10,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 14,
  },
  ctaPurple: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  ctaPurpleText: {
    fontSize: 15,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  contentCard: {
    borderRadius: 12,
    marginHorizontal: responsiveWidth('4'),
    marginTop: responsiveWidth('2%'),
    borderWidth: 0.2,
    borderColor: '#EEE5CA',
    overflow: 'hidden',
    opacity: 0.9,
    // marginBottom: responsiveWidth('5%'),
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  // Tab Styles - Matching ChatScreen
  tabsContainer: {
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#EEE5CA',
    overflow: 'hidden',
    marginBottom: responsiveHeight(2),
    marginHorizontal: responsiveWidth(4),
  },
  tabsBgImage: {
    borderRadius: 10,
    opacity: 0.7,
  },
  tabsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabsScrollView: {
    position: 'relative',
    zIndex: 1,
  },
  tabsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(2),
  },
  tab: {
    paddingVertical: responsiveWidth(2),
    paddingHorizontal: responsiveWidth(1.5),
    alignItems: 'center',
    minWidth: responsiveWidth(43.5),
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#F2994A', // This will be overridden by theme colors
  },
  tabText: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    lineHeight: 27,
    letterSpacing: -0.45,
  },
  tabContentContainer: {
    // flex: 1,
    paddingTop: responsiveHeight(1),
  },
  // Plan Content Styles
  planContent: {
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  planHeader: {
    // marginBottom: 16,
  },
  planTitle: {
    fontSize: 18,
    fontFamily: fontFamily.regular,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  price: {
    fontSize: 36,
    fontFamily: fontFamily.bold,
    marginRight: 8,
  },
  // Features List Styles
  featuresList: {
    // marginBottom: responsiveWidth(2),
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: responsiveWidth(2),
  },
  checkIcon: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    resizeMode: 'contain',
    marginRight: responsiveWidth(2),
  },
  bulletPoint: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    marginRight: responsiveWidth(1.5),
    marginTop: responsiveWidth(0.5),
    lineHeight: 20,
    width: responsiveWidth(3),
    textAlign: 'left',
  },
  featureTextContainer: {
    flex: 1,
    flexShrink: 1,
    paddingLeft: 0,
  },
  featureTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    lineHeight: 18,
    marginTop: 2,
    paddingLeft: 0,
    textAlign: 'left',
    includeFontPadding: false,
    textAlignVertical: 'top',
  },
  bulletPointContainer: {
    marginTop: 4,
    marginBottom: 4,
  },
  subBulletPointContainer: {
    paddingLeft: responsiveWidth(4),
  },
  bulletPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  bulletSymbol: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    marginRight: responsiveWidth(1.5),
    marginTop: 0,
    lineHeight: 18,
    width: responsiveWidth(3),
  },
  bulletPointText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    lineHeight: 18,
    flex: 1,
    flexShrink: 1,
  },
  // Disclaimer Styles
  disclaimerContainer: {
    marginBottom: responsiveWidth(2),
  },
  separator: {
    height: 1,
    backgroundColor: '#333',
    marginBottom: 12,
  },
  disclaimerText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    fontStyle: 'italic',
  },
  // Member Management Styles - Matching ProfileScreen
  memberSection: {
    marginBottom: responsiveWidth(2),
    marginTop: responsiveWidth(1),
  },
  addMemberTitle: {
    fontSize: 18,
    fontFamily: fontFamily.regular,
    lineHeight: 24,
    // marginBottom: 16,
  },
  addMemberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // marginBottom: 12,
  },
  addMemberCardLeft: {
    flex: 1,
    paddingRight: 20,
  },
  addMemberCardRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  countButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2994A',
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  countButtonDisabled: {
    backgroundColor: '#666666',
    borderColor: 'transparent',
  },
  countButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
    fontFamily: fontFamily.regular,
  },
  countButtonTextDisabled: {
    color: 'rgba(255,255,255,0.3)',
  },
  memberCountDisplay: {
    alignItems: 'center',
    width: responsiveWidth('18'),
  },
  memberCountNumber: {
    color: '#fff',
    fontSize: 18,
    fontFamily: fontFamily.regular,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  memberCountLabel: {
    color: '#fff',
    fontSize: 12,
    fontFamily: fontFamily.regular,
  },
  addUserIcon3D: {
    width: responsiveWidth('27'),
    height: responsiveWidth('27'),
    resizeMode: 'contain',
  },
  remainingSlotsText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 16,
  },
  priceAndButtonWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priceContainerLeft: {
    flex: 1,
    paddingLeft: 8,
  },
  totalPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  totalPriceLabel: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    fontWeight: '600' as '600',
  },
  totalPriceValue: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '700' as '700',
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  originalPriceLabel: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    fontWeight: '400' as const,
    marginRight: 8,
  },
  originalPriceValue: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    fontWeight: '400' as const,
    textDecorationLine: 'line-through',
  },
  discountLabel: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    fontWeight: '600' as const,
    marginRight: 8,
  },
  discountValue: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    fontWeight: '600' as const,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  addButton: {
    // Styles applied via props
  },
  createButton: {
    // Styles applied via props
  },
  fullWidthButton: {
    flex: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '600' as const,
  },
  // Free Plan Styles
  freePlanHeader: {
    marginBottom: 16,
    alignItems: 'center',
  },
  freePlanTitle: {
    fontSize: 36,
    fontFamily: fontFamily.bold,
    textAlign: 'center',
  },
  freePlanSeparator: {
    height: 2,
   
    marginTop: responsiveWidth(2),
    marginBottom: responsiveWidth(2),
    borderRadius: 1,
  },
  mostPopularTag: {
    alignSelf: 'flex-end',
    backgroundColor: '#223149',
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveWidth(1),
    borderRadius: 4,
    marginBottom: responsiveWidth(2),
  },
  mostPopularText: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  buyPremiumButton: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: responsiveWidth(4),
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: responsiveHeight(3),
    marginBottom: responsiveHeight(2),
  },
  buyPremiumButtonText: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
});

export default PaidPlanScreen;
