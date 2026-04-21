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
  useWindowDimensions,
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
import RenderHTML from 'react-native-render-html';
import http from '../../utils/http';

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

type PlanFeatureApi = {
  icon: any;
  title: string;
  richContent: string;
};

type PlanApiItem = {
  id: number;
  title: string;
  badge: string;
  price: string;
  priceMode: string; // yearly/monthly etc
  features: PlanFeatureApi[];
  featuresTitle: string;
  footerText: string;
  footerNote: string;
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
  useWindowDimensions();

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

  const htmlBaseStyle = useMemo(
    () => ({
      color: theme === 'dark' ? colors.white : colors.DarkNavy,
      fontSize: 13,
      fontFamily: fontFamily.regular,
      lineHeight: 18,
      flexShrink: 1,
    }),
    [colors.DarkNavy, colors.white, theme],
  );

  const htmlTagsStyles = useMemo(
    () => ({
      p: { marginTop: 0, marginBottom: 0 },
      ul: { marginTop: 6, marginBottom: 0, paddingLeft: 16, width: '100%' },
      ol: { marginTop: 6, marginBottom: 0, paddingLeft: 16, width: '100%' },
      li: { marginBottom: 4, width: '100%' },
      a: { color: colors.primary ?? colors.yellow },
      em: { fontStyle: 'italic' },
      span: { color: htmlBaseStyle.color },
    }),
    [colors.primary, colors.yellow, htmlBaseStyle.color],
  );

  const planCardContentWidth = useMemo(() => {
    // Keep HTML rendering constrained to the card width to avoid overflow/overlap
    const CARD_WIDTH = 280;
    const CARD_PADDING = 16 * 2;
    const ICON_AND_GAP = 18 + 8; // icon width + marginRight
    return CARD_WIDTH - CARD_PADDING - ICON_AND_GAP;
  }, []);

  const handleStartFree = () => {
    navigation.navigate('ProfileScreen');
  };

  const handleSelectPlan = (planType: 'individual' | 'family') => {
    navigation.navigate('MemberPlanManagement', { planType });
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
        <View style={styles.planCardsColumn}>
          {/* FREE PLAN CARD */}
          <View
            style={[
              styles.planCard,
              styles.planCardFree,
              {
                backgroundColor: theme === 'dark' ? colors.cardBackground : '#FFFFFF',
                borderColor: theme === 'dark' ? colors.themeBorderDropdown : '#E0E0E0',
              },
            ]}
          >
            <Text
              style={[
                styles.planCardTitle,
                styles.planCardTitleCentered,
                { color: theme === 'dark' ? colors.white : colors.DarkNavy },
              ]}
            >
              {freePlan?.title ?? 'Free'}
            </Text>
            <View style={[styles.priceBox, { borderColor: theme === 'dark' ? colors.themeBorderDropdown : '#DDD' }]}>
              <Text style={[styles.priceText, { color: theme === 'dark' ? colors.white : colors.DarkNavy }]}>Free</Text>
            </View>
            <TouchableOpacity
              style={[styles.planCtaButton, styles.ctaTealGreen]}
              onPress={handleStartFree}
            >
              <Text style={styles.planCtaButtonText}>Continue Free</Text>
            </TouchableOpacity>
            <Text
              style={[
                styles.planFeaturesHeader,
                { color: theme === 'dark' ? colors.white : colors.DarkNavy },
              ]}
            >
              {freePlan?.featuresTitle ?? 'Included in Free:'}
            </Text>
            {plansLoading && plans.length === 0 ? (
              <View style={styles.inlineLoaderRow}>
                <ActivityIndicator
                  size="small"
                  color={theme === 'dark' ? colors.white : colors.DarkNavy}
                />
                <Text
                  style={[
                    styles.inlineLoaderText,
                    { color: theme === 'dark' ? colors.white : colors.DarkNavy },
                  ]}
                >
                  Loading…
                </Text>
              </View>
            ) : plansError && plans.length === 0 ? (
              <TouchableOpacity onPress={fetchPlans} activeOpacity={0.8}>
                <Text
                  style={[
                    styles.inlineErrorText,
                    { color: theme === 'dark' ? colors.white : colors.DarkNavy },
                  ]}
                >
                  {plansError} Tap to retry.
                </Text>
              </TouchableOpacity>
            ) : (
              (freePlan?.features ?? []).map((f, i) => (
                <View key={i} style={styles.planFeatureRow}>
                  <Image
                    source={require('../../assets/icons/checkIcon.png')}
                    style={styles.planCheckIcon}
                  />
                  <Text
                    style={[
                      styles.planFeatureText,
                      {
                        color: theme === 'dark' ? colors.white : colors.DarkNavy,
                      },
                    ]}
                  >
                    {f.title}
                  </Text>
                </View>
              ))
            )}
            <View style={[styles.planFooterCapsule, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#F5F5F5' }]}>
              <Text
                style={[
                  styles.planFooterText,
                  { color: theme === 'dark' ? colors.white : colors.DarkNavy },
                ]}
              >
                {freePlan?.footerText ?? '1 profile included'}
              </Text>
            </View>
            <Text
              style={[
                styles.planSubtext,
                { color: theme === 'dark' ? colors.textSecondary : '#888' },
              ]}
            >
              {freePlan?.footerNote ?? 'Try the basics. Upgrade anytime for full access.'}
            </Text>
          </View>

          {/* INDIVIDUAL ANNUAL CARD */}
          <View
            style={[
              styles.planCard,
              styles.planCardIndividual,
              { backgroundColor: '#1A2744' },
            ]}
          >
            <View style={styles.planBanner}>
              <Text style={styles.planBannerText}>
                {individualPlan?.badge || 'MOST POPULAR'}
              </Text>
            </View>
            <Text style={[styles.planCardTitle, styles.planCardTitleCentered, { color: '#FFFFFF' }]}>
              {individualPlan?.title ?? 'Individual Annual'}
            </Text>
            <View style={[styles.priceBox, styles.priceBoxDark, { backgroundColor: '#0F1A2E' }]}>
              <Text style={[styles.priceText, { color: '#FFFFFF' }]}>
                ₹{individualPlan?.price ?? '999'}
              </Text>
              <Text style={[styles.priceUnit, { color: 'rgba(255,255,255,0.8)' }]}>/ year</Text>
            </View>
            <TouchableOpacity
              style={[styles.planCtaButton, styles.ctaGold]}
              onPress={() => handleSelectPlan('individual')}
            >
              <Text style={[styles.planCtaButtonText, { color: '#1A2744' }]}>Get Individual Plan →</Text>
            </TouchableOpacity>
            <Text style={[styles.planFeaturesHeader, { color: '#FFFFFF' }]}>
              {individualPlan?.featuresTitle ?? 'Everything in Free, plus:'}
            </Text>
            {(individualPlan?.features ?? []).map((f, i) => (
              <View key={i} style={styles.planFeatureRow}>
                <Image source={require('../../assets/icons/checkIcon.png')} style={[styles.planCheckIcon, { tintColor: '#E8B923' }]} />
                <View style={styles.planFeatureContent}>
                  <Text style={[styles.planFeatureText, { color: '#FFFFFF' }]}>{f.title}</Text>
                  {f.richContent ? (
                    <View style={styles.htmlWrap}>
                      <RenderHTML
                        contentWidth={Math.max(0, planCardContentWidth)}
                        source={{ html: f.richContent }}
                        baseStyle={{
                          ...htmlBaseStyle,
                          color: 'rgba(255,255,255,0.9)',
                        }}
                        tagsStyles={htmlTagsStyles as any}
                        defaultTextProps={{ selectable: false }}
                      />
                    </View>
                  ) : null}
                </View>
              </View>
            ))}
          </View>

          {/* FAMILY ANNUAL CARD */}
          <View
            style={[
              styles.planCard,
              styles.planCardFamily,
              { backgroundColor: '#2D1B4E' },
            ]}
          >
            <View style={styles.planBanner}>
              <Text style={styles.planBannerText}>
                {familyPlan?.badge || 'BEST VALUE'}
              </Text>
            </View>
            <Text style={[styles.planCardTitle, styles.planCardTitleCentered, { color: '#FFFFFF' }]}>
              {familyPlan?.title ?? 'Family Annual'}
            </Text>
            {familyPlan?.badge ? (
              <Text
                style={[
                  styles.planCardSubtitle,
                  styles.planCardTitleCentered,
                  { color: 'rgba(255,255,255,0.9)' },
                ]}
              >
                - {familyPlan.badge} -
              </Text>
            ) : (
              <Text
                style={[
                  styles.planCardSubtitle,
                  styles.planCardTitleCentered,
                  { color: 'rgba(255,255,255,0.9)' },
                ]}
              >
                - For families growing together -
              </Text>
            )}
            <View style={[styles.priceBox, styles.priceBoxDark, { backgroundColor: '#1E1335' }]}>
              <Text style={[styles.priceText, { color: '#FFFFFF' }]}>
                ₹{familyPlan?.price ?? '2499'}
              </Text>
              <Text style={[styles.priceUnit, { color: 'rgba(255,255,255,0.8)' }]}>/ year</Text>
            </View>
            <TouchableOpacity
              style={[styles.planCtaButton, styles.ctaPurple]}
              onPress={() => handleSelectPlan('family')}
            >
              <Text style={styles.planCtaButtonText}>Get Family Plan →</Text>
            </TouchableOpacity>
            <Text style={[styles.planFeaturesHeader, { color: '#FFFFFF' }]}>
              {familyPlan?.featuresTitle ?? 'Everything in Individual, plus:'}
            </Text>
            {(familyPlan?.features ?? []).map((f, i) => (
              <View key={i} style={styles.planFeatureRow}>
                <Image source={require('../../assets/icons/checkIcon.png')} style={[styles.planCheckIcon, { tintColor: '#E8B923' }]} />
                <View style={styles.planFeatureContent}>
                  <Text style={[styles.planFeatureText, { color: '#FFFFFF' }]}>{f.title}</Text>
                  {f.richContent ? (
                    <View style={styles.htmlWrap}>
                      <RenderHTML
                        contentWidth={Math.max(0, planCardContentWidth)}
                        source={{ html: f.richContent }}
                        baseStyle={{
                          ...htmlBaseStyle,
                          color: 'rgba(255,255,255,0.9)',
                        }}
                        tagsStyles={htmlTagsStyles as any}
                        defaultTextProps={{ selectable: false }}
                      />
                    </View>
                  ) : null}
                </View>
              </View>
            ))}
            {/* <View style={[styles.planFooterCapsule, styles.planFooterCapsulePurple]}>
              <Text style={[styles.planFooterText, { color: '#2D1B4E' }]}>Best for families who want structured life guidance together</Text>
            </View> */}
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
  planCardsColumn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  planCard: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  planCardFree: {},
  planCardIndividual: {},
  planCardFamily: {},
  planBanner: {
    alignSelf: 'center',
    backgroundColor: '#E8B923',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 12,
  },
  planBannerText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: '#1A2744',
    letterSpacing: 0.5,
  },
  planCardTitle: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
    marginBottom: 8,
  },
  planCardTitleCentered: {
    textAlign: 'center',
  },
  planCardSubtitle: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    marginBottom: 8,
  },
  priceBox: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    alignSelf: 'center',
    alignItems: 'center',
  },
  priceBoxDark: {
    borderWidth: 0,
  },
  priceText: {
    fontSize: 24,
    fontFamily: fontFamily.bold,
  },
  priceUnit: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
  },
  planCtaButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  ctaTealGreen: {
    backgroundColor: '#2DD4BF',
  },
  ctaGold: {
    backgroundColor: '#E8B923',
  },
  ctaPurple: {
    backgroundColor: '#7C3AED',
  },
  planCtaButtonText: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  planFeaturesHeader: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
    marginBottom: 8,
  },
  planFeatureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    width: '100%',
  },
  planCheckIcon: {
    width: 18,
    height: 18,
    marginRight: 8,
    marginTop: 2,
    flexShrink: 0,
  },
  planFeatureText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    flex: 1,
    flexShrink: 1,
    lineHeight: 18,
  },
  planFeatureContent: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    maxWidth: '100%',
  },
  htmlWrap: {
    width: '100%',
    flexShrink: 1,
  },
  planFeatureSub: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    marginTop: 2,
    marginLeft: 8,
  },
  planFooterCapsule: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 8,
  },
  planFooterCapsulePurple: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  planFooterText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
  },
  planSubtext: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    marginTop: 8,
  },
  inlineLoaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  inlineLoaderText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
  },
  inlineErrorText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    lineHeight: 18,
    marginTop: 6,
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
  planDescription: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
    marginBottom: responsiveWidth(3),
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
  featureText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    flex: 1,
    fontWeight: '500',
    lineHeight: 18,
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
