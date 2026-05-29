import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { fontFamily, responsiveWidth } from '../../constant/theme';
import { useTheme } from '../../context/ThemeContext';
import http from '../../utils/http';

const PREMIUM_FREE_FEATURES = [
  'Major Life Cycle',
  'Current Chapter of Life',
  'Life Guidance',
  'Recent Experience',
  'Your Patterns',
  'Your Manifestations',
  'Your Personality',
  'About Your Partner',
];

const PREMIUM_INDIVIDUAL_MONTHLY_UPDATES = [
  'Mahadasha updates',
  'Antardasha changes',
  'Transit-based predictions',
  "Monthly dos & don'ts",
  'Timely guidance based on planetary movement',
];

const PREMIUM_INDIVIDUAL_HOUSE_BONUS = [
  'Strengths',
  'Advice',
  'Daily Tasks',
  'Think Twice (Things to be cautious about)',
  'What Combinations Are Active',
];

const PREMIUM_INDIVIDUAL_ALSO_INCLUDES = [
  'Dynamic monthly insights',
  'Evolving predictions',
  'Guidance updated with every change',
];

const PREMIUM_FAMILY_FEATURES = [
  'Separate monthly updates for each member',
  "Personalized dos & don'ts for each member",
  'Separate active combinations for each member',
  'Individual dynamic guidance for every member',
  'Full 12-house bonus analysis for every member',
];

const PREMIUM_FAMILY_UPDATE_TRIGGERS = [
  { icon: '🔗', label: 'Mahadasha\nChange' },
  { icon: '🔗', label: 'Antardasha\nChange' },
  { icon: '✦', label: 'Transit\nChange' },
];

type CheckVariant = 'blue' | 'green' | 'orange';

type SubscriptionPlanApiItem = {
  title?: string;
  price?: string;
  priceMode?: string;
};

const getPriceUnit = (priceMode?: string) => {
  const mode = (priceMode ?? 'month').toLowerCase();
  return mode.includes('year') ? '/ year' : '/ month';
};

export type PremiumPlansModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelectIndividual: () => void;
  onSelectFamily: () => void;
  creatingSubscription?: boolean;
  individualDisabled?: boolean;
  title?: string;
  subtitle?: string;
};

const PremiumPlansModal = ({
  visible,
  onClose,
  onSelectIndividual,
  onSelectFamily,
  creatingSubscription = false,
  individualDisabled = false,
  title = 'Choose Your Plan',
  subtitle,
}: PremiumPlansModalProps) => {
  const { theme, colors } = useTheme();
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlanApiItem[]>([]);
  const [subscriptionPlansLoading, setSubscriptionPlansLoading] = useState(false);

  const fetchSubscriptionPlans = useCallback(async () => {
    setSubscriptionPlansLoading(true);
    try {
      const res = await http.get<{ status: boolean; data?: SubscriptionPlanApiItem[] }>('/plans');
      const raw = Array.isArray(res.data?.data) ? res.data.data : [];
      setSubscriptionPlans(raw);
    } catch (err) {
      console.error('Failed to fetch subscription plans:', err);
      setSubscriptionPlans([]);
    } finally {
      setSubscriptionPlansLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      fetchSubscriptionPlans();
    }
  }, [visible, fetchSubscriptionPlans]);

  const freePlanFromApi = useMemo(
    () => subscriptionPlans.find(p => p.title?.toLowerCase().includes('free')) || null,
    [subscriptionPlans],
  );
  const individualPlanFromApi = useMemo(
    () => subscriptionPlans.find(p => p.title?.toLowerCase().includes('individual')) || null,
    [subscriptionPlans],
  );
  const familyPlanFromApi = useMemo(
    () => subscriptionPlans.find(p => p.title?.toLowerCase().includes('family')) || null,
    [subscriptionPlans],
  );

  const freePrice = freePlanFromApi?.price ?? '0';
  const individualPrice = individualPlanFromApi?.price ?? '299';
  const familyPrice = familyPlanFromApi?.price ?? '999';

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
          style={
            variant === 'blue'
              ? [
                  styles.featureTextDark,
                  { color: theme === 'dark' ? colors.white : '#1F2937' },
                ]
              : styles.featureTextLight
          }
        >
          {item}
        </Text>
      </View>
    ));

  const renderPrice = (price: string, priceMode?: string, priceColor = '#FFFFFF') => {
    if (subscriptionPlansLoading) {
      return (
        <ActivityIndicator
          size="small"
          color={priceColor}
          style={styles.priceLoader}
        />
      );
    }
    return (
      <View style={styles.priceRow}>
        <Text style={[styles.priceAmount, { color: priceColor }]}>₹ {price}</Text>
        <Text style={[styles.priceUnit, { color: priceColor }]}>
          {getPriceUnit(priceMode)}
        </Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View
          style={[
            styles.container,
            { backgroundColor: theme === 'dark' ? colors.DarkNavy : colors.white },
          ]}
        >
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text
              style={[
                styles.closeText,
                { color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy },
              ]}
            >
              ✕
            </Text>
          </TouchableOpacity>

          <Text
            style={[
              styles.title,
              { color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy },
            ]}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[
                styles.subtitle,
                { color: theme === 'dark' ? colors.textSecondary : '#6B7280' },
              ]}
            >
              {subtitle}
            </Text>
          ) : null}

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.cardsRow}
            style={styles.cardsScroll}
          >
            {/* Free */}
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
                  styles.planTitle,
                  { color: theme === 'dark' ? colors.white : '#111827' },
                ]}
              >
                FREE
              </Text>
              {renderPrice(freePrice, freePlanFromApi?.priceMode, '#2563EB')}
              <View style={styles.alwaysFreePill}>
                <Text style={styles.alwaysFreePillText}>Always Free</Text>
              </View>
              <Text
                style={[
                  styles.freeDescription,
                  { color: theme === 'dark' ? colors.textSecondary : '#6B7280' },
                ]}
              >
                Get your core astrology insights at no cost.
              </Text>
              <Text style={styles.sectionHeaderPurple}>YOU GET (ALL FREE)</Text>
              {renderFeatureList(PREMIUM_FREE_FEATURES, 'blue')}
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
                style={[styles.cta, styles.ctaCurrentPlan, styles.ctaDisabled]}
                disabled
                activeOpacity={1}
              >
                <Text style={styles.ctaCurrentPlanText}>Current Plan</Text>
              </TouchableOpacity>
            </View>

            {/* Individual */}
            <View style={styles.individualOuter}>
              <View style={styles.mostPopularBadge}>
                <Text style={styles.mostPopularBadgeText}>★ MOST POPULAR</Text>
              </View>
              <View style={[styles.planCard, styles.planCardIndividual]}>
                <Text style={[styles.planTitle, styles.textWhite]}>INDIVIDUAL PLAN</Text>
                {renderPrice(individualPrice, individualPlanFromApi?.priceMode)}
                <View style={styles.autoUpdateBox}>
                  <Text style={styles.autoUpdateIcon}>↻</Text>
                  <Text style={styles.autoUpdateText}>
                    Updates automatically as Mahadasha, Antardasha & Transits change.
                  </Text>
                </View>
                <Text style={styles.sectionHeaderGreen}>MONTHLY DYNAMIC UPDATES</Text>
                {renderFeatureList(PREMIUM_INDIVIDUAL_MONTHLY_UPDATES, 'green')}
                <Text style={styles.sectionHeaderOrange}>★ BONUS: FULL HOUSE ANALYSIS</Text>
                <Text style={styles.sectionSubtext}>For all 12 houses, receive:</Text>
                {renderFeatureList(PREMIUM_INDIVIDUAL_HOUSE_BONUS, 'orange')}
                <Text style={styles.sectionHeaderLight}>ALSO INCLUDES</Text>
                {renderFeatureList(PREMIUM_INDIVIDUAL_ALSO_INCLUDES, 'green')}
                <View style={styles.individualHighlightBox}>
                  <Text style={styles.individualHighlightIcon}>📅</Text>
                  <Text style={styles.individualHighlightText}>
                    Always updated. Always relevant.{'\n'}No manual refresh needed.
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.cta,
                    styles.ctaOrange,
                    (creatingSubscription || individualDisabled) && { opacity: 0.5 },
                  ]}
                  onPress={onSelectIndividual}
                  disabled={creatingSubscription || individualDisabled}
                >
                  {creatingSubscription ? (
                    <ActivityIndicator color="#0F1A2E" size="small" />
                  ) : (
                    <Text style={[styles.ctaText, { color: '#0F1A2E' }]}>
                      Start Individual →
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Family */}
            <View style={[styles.planCard, styles.planCardFamily]}>
              <Text style={[styles.planTitle, styles.textWhite]}>FAMILY PLAN</Text>
              {renderPrice(familyPrice, familyPlanFromApi?.priceMode)}
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
              {renderFeatureList(PREMIUM_FAMILY_FEATURES, 'green')}
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
                {PREMIUM_FAMILY_UPDATE_TRIGGERS.map((item, i) => (
                  <View key={i} style={styles.updateTriggerCol}>
                    <Text style={styles.updateTriggerIcon}>{item.icon}</Text>
                    <Text style={styles.updateTriggerLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.cta, styles.ctaPurple]}
                onPress={onSelectFamily}
                disabled={creatingSubscription}
              >
                {creatingSubscription ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={[styles.ctaText, { color: '#FFFFFF' }]}>
                    Upgrade to Family →
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: responsiveWidth(90),
    borderRadius: 20,
    padding: responsiveWidth(5),
    maxHeight: '85%',
  },
  closeButton: {
    position: 'absolute',
    top: responsiveWidth(2),
    right: responsiveWidth(2),
    width: responsiveWidth(7),
    height: responsiveWidth(7),
    borderRadius: responsiveWidth(4),
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 17,
    paddingHorizontal: 8,
  },
  cardsScroll: {
    width: '100%',
    maxHeight: Dimensions.get('window').height * 0.65,
  },
  cardsRow: {
    paddingHorizontal: 4,
    paddingBottom: 16,
    gap: 16,
  },
  planCard: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  planCardFree: {
    marginBottom: 4,
  },
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
  individualOuter: {
    position: 'relative',
    marginTop: 4,
  },
  mostPopularBadge: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    zIndex: 2,
    backgroundColor: '#F2994A',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    elevation: 4,
  },
  mostPopularBadgeText: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    color: '#0F1A2E',
    letterSpacing: 0.3,
  },
  planTitle: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    textAlign: 'center',
    marginBottom: 4,
  },
  textWhite: {
    color: '#FFFFFF',
  },
  priceLoader: {
    marginVertical: 8,
    alignSelf: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 4,
  },
  priceAmount: {
    fontSize: 28,
    fontFamily: fontFamily.bold,
  },
  priceUnit: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    opacity: 0.9,
  },
  alwaysFreePill: {
    alignSelf: 'center',
    borderWidth: 1.5,
    borderColor: '#2563EB',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 8,
  },
  alwaysFreePillText: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    color: '#2563EB',
  },
  freeDescription: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 17,
  },
  sectionHeaderPurple: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: '#7C3AED',
    marginBottom: 8,
  },
  sectionHeaderGreen: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: '#22C55E',
    marginTop: 12,
    marginBottom: 8,
  },
  sectionHeaderOrange: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: '#F2994A',
    marginTop: 12,
    marginBottom: 4,
  },
  sectionHeaderLight: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: 'rgba(255,255,255,0.95)',
    marginTop: 12,
    marginBottom: 8,
  },
  sectionSubtext: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 6,
  },
  circleCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 1,
    flexShrink: 0,
  },
  circleCheckMark: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: fontFamily.bold,
    lineHeight: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 9,
  },
  featureTextLight: {
    flex: 1,
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 17,
  },
  featureTextDark: {
    flex: 1,
    fontSize: 12,
    fontFamily: fontFamily.regular,
    lineHeight: 17,
  },
  freeHighlightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(59, 111, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 111, 212, 0.25)',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    marginBottom: 12,
    gap: 8,
  },
  freeHighlightIcon: {
    fontSize: 20,
  },
  freeHighlightTextWrap: {
    flex: 1,
  },
  freeHighlightTitle: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: '#2563EB',
    marginBottom: 3,
  },
  freeHighlightSub: {
    fontSize: 10,
    fontFamily: fontFamily.regular,
    color: '#4B5563',
    lineHeight: 14,
  },
  cta: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  ctaCurrentPlan: {
    backgroundColor: '#A5B4FC',
  },
  ctaCurrentPlanText: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  ctaDisabled: {
    opacity: 0.55,
  },
  ctaOrange: {
    backgroundColor: '#F2994A',
  },
  ctaPurple: {
    backgroundColor: '#7C3AED',
  },
  ctaText: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
  },
  autoUpdateBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 4,
    gap: 8,
  },
  autoUpdateIcon: {
    fontSize: 16,
    color: '#A78BFA',
  },
  autoUpdateText: {
    flex: 1,
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 16,
  },
  individualHighlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F2994A',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    marginBottom: 12,
    gap: 8,
    backgroundColor: 'rgba(242, 153, 74, 0.08)',
  },
  individualHighlightIcon: {
    fontSize: 18,
  },
  individualHighlightText: {
    flex: 1,
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    color: '#F2994A',
    lineHeight: 16,
  },
  familySubtitleBox: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  familySubtitleText: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 16,
  },
  familyIconWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  familyIcon: {
    width: 48,
    height: 48,
    tintColor: '#A78BFA',
  },
  familyMembersBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    marginBottom: 6,
    gap: 8,
  },
  familyMembersIcon: {
    fontSize: 20,
  },
  familyMembersTextWrap: {
    flex: 1,
  },
  familyMembersTitle: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: '#A78BFA',
    marginBottom: 3,
  },
  familyMembersSub: {
    fontSize: 10,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 14,
  },
  updateTriggeredHeader: {
    textAlign: 'center',
    marginTop: 12,
  },
  updateTriggersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 6,
  },
  updateTriggerCol: {
    flex: 1,
    alignItems: 'center',
  },
  updateTriggerIcon: {
    fontSize: 18,
    color: '#A78BFA',
    marginBottom: 4,
  },
  updateTriggerLabel: {
    fontSize: 9,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 13,
  },
});

export default PremiumPlansModal;
