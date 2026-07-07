import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import RazorpayCheckout from 'react-native-razorpay';
import { MainContainer } from '../../components/common/mainContainer';
import { fontFamily, responsiveWidth } from '../../constant/theme';
import { useTheme } from '../../context/ThemeContext';
import { RootState } from '../../state/store';
import { setUser } from '../../state/slices/appSlice';
import http from '../../utils/http';
import UserService from '../../services/user/user.service';
import {
  AstrologerAutopayPlanType,
  subscriptionApi,
} from '../../api/subscriptionApi';
import { mergeUserProfile } from '../../utils/userRole';

type AstrologerRazorpayPaymentResponse = {
  razorpay_payment_id: string;
  razorpay_signature: string;
  razorpay_subscription_id?: string;
  razorpay_order_id?: string;
};

const RAZORPAY_CONFIG = {
  TEST_KEY: 'rzp_test_Rueu06YDULsQCD',
  LIVE_KEY: 'rzp_live_t11y7Cds0JWo47',
  PLAN_ID: 'd461266c-574b-4312-994a-ebd2b5cf6dc3',
  IS_TEST_MODE: true,
};

const isRazorpayPaymentCancelled = (paymentError: {
  code?: number | string;
  description?: string;
  message?: string;
  reason?: string;
  step?: string;
  details?: { error?: { reason?: string } };
  error?: { code?: string; reason?: string; step?: string };
}) => {
  if (
    paymentError.code === 0 &&
    paymentError.description === 'Payment processing cancelled by user' &&
    paymentError.details?.error?.reason === 'payment_cancelled'
  ) {
    return true;
  }

  if (
    paymentError.error?.code === 'BAD_REQUEST_ERROR' &&
    paymentError.error?.reason === 'payment_error' &&
    paymentError.error?.step === 'payment_authentication'
  ) {
    return true;
  }

  return (
    paymentError.code === 'PAYMENT_CANCELLED' ||
    paymentError.reason === 'payment_cancelled' ||
    paymentError.message?.toLowerCase().includes('cancelled') ||
    paymentError.description?.toLowerCase().includes('cancelled') ||
    false
  );
};

type PlanApiItem = {
  id: number;
  _id?: string;
  plan_id?: string;
  title: string;
  price: string;
  priceMode?: string;
};

type AstrologerPlanKey = 'free' | 'pro' | 'premium';

const sleep = (ms: number) =>
  new Promise<void>(resolve => {
    setTimeout(() => resolve(), ms);
  });

const resolveAstrologerBillingUserId = (userData: Record<string, unknown>) =>
  String(userData.user_id || userData._id || userData.id || '');

const resolvePlanMongoId = (plan: PlanApiItem | null) => {
  if (!plan) {
    return '';
  }
  return String(plan._id || plan.plan_id || plan.id || '');
};

const isPlanActive = (currentPlan: string, planKey: AstrologerPlanKey) => {
  const normalized = currentPlan.toLowerCase();
  if (planKey === 'free') {
    return normalized === 'free' || normalized === '';
  }
  if (planKey === 'pro') {
    return (
      normalized === 'pro' ||
      normalized === '2999_plan' ||
      normalized.includes('2999')
    );
  }
  return (
    normalized === 'premium' ||
    normalized === '4999_plan' ||
    normalized.includes('4999')
  );
};

type PlansApiResponse = {
  status: boolean;
  count?: number;
  data?: PlanApiItem[];
};

const FREE_FEATURES = [
  '1 chart is free',
  'Up to 5 questions on that chart',
  'Valid for 1 month',
  'Analyze all transits for the next 48 months',
  'All core astrology insights',
];

const PRO_FEATURES = [
  'Unlimited chats',
  'Transit search up to 48 months',
  'Search from Lagna, Moon & Dasha Lagna',
  'Combinations with repetition & higher probability',
  'Dignity analysis of planets with reasoning',
];

const PREMIUM_FEATURES = [
  'Unlimited chats',
  'Everything in Pro',
  'Transit search up to 48 months',
  'Deeper long-term analysis & timing insights',
];

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'You Ask',
    description: 'Find all connections between Saturn and the 10th lord',
  },
  {
    step: '2',
    title: 'System Checks',
    description:
      'Conjunctions, Aspects, Exchanges, Dispositors, Nakshatra Links, Dasha Activation, Transit Activation',
  },
  {
    step: '3',
    title: 'Answer Generated',
    description: 'Relevant astrological relationships returned instantly',
  },
];

const EXAMPLE_QUESTIONS = [
  'Find all connections between Jupiter and Venus',
  'Which transit is activating my Moon-Rahu combination?',
  'Show all dignity conditions affecting Mercury',
  'Find all combinations involving the 8th lord',
  'Show every planet influencing the 7th house',
  'List all sign exchanges in the chart',
];

const TRUST_BADGES = [
  { icon: '🔒', title: 'Secure & Private', subtitle: 'Your data is 100% secure' },
  { icon: '⚡', title: 'Lightning Fast', subtitle: 'Get answers in seconds' },
  { icon: '✦', title: 'Built for Astrologers', subtitle: 'Designed by astrologers, for astrologers' },
];

const getPriceUnit = (priceMode?: string) => {
  const mode = (priceMode ?? 'month').toLowerCase();
  return mode.includes('year') ? '/ year' : '/ month';
};

const AstrologerPlanScreen = () => {
  const dispatch = useDispatch();
  const { theme, colors } = useTheme();
  const user = useSelector((state: RootState) => state.app.user);
  const astrologerUser = user as Record<string, unknown> | null | undefined;
  const userService = useMemo(() => new UserService(), []);

  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [plans, setPlans] = useState<PlanApiItem[]>([]);
  const [subscribingPlan, setSubscribingPlan] = useState<AstrologerPlanKey | null>(
    null,
  );
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const isPollingRef = useRef(false);

  const currentPlan = String(astrologerUser?.current_plan || 'pro').toLowerCase();
  const startPlanTime = String(astrologerUser?.start_plan_time || '—');
  const endPlanTime = String(astrologerUser?.end_plan_time || '—');
  const membersAllow = Number(astrologerUser?.members_allow) || 0;
  const availableMembers = Number(astrologerUser?.available_members_allow) || 0;
  const currentMembers = Number(astrologerUser?.astrologer_current_members) || 0;

  const formatPlanName = (plan: string) =>
    plan
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const fetchPlans = useCallback(async () => {
    setPlansLoading(true);
    setPlansError(null);
    try {
      const res = await http.get<PlansApiResponse>('/plans');
      const raw = Array.isArray(res.data?.data) ? res.data.data : [];
      setPlans(
        raw.filter(
          (item: PlanApiItem) =>
            typeof item?.id === 'number' && typeof item?.title === 'string',
        ),
      );
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const msg =
        err?.response?.data?.message || err?.message || 'Unable to load plans.';
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
    () => plans.find(plan => plan.title?.toLowerCase().includes('free')) || null,
    [plans],
  );
  const proPlan = useMemo(
    () =>
      plans.find(
        plan =>
          (plan.title?.toLowerCase().includes('pro') &&
            !plan.title?.toLowerCase().includes('premium')) ||
          plan.price === '2999',
      ) || null,
    [plans],
  );
  const premiumPlan = useMemo(
    () =>
      plans.find(
        plan =>
          plan.title?.toLowerCase().includes('premium') || plan.price === '4999',
      ) || null,
    [plans],
  );

  const refreshAstrologerUser = useCallback(async () => {
    const userId = String(astrologerUser?._id || user?._id || '');
    if (!userId) {
      return;
    }

    try {
      const response = await userService.getAstrologerClients(userId, 0, 1);
      if (response.status && response.data?.user_details) {
        const mergedUser = mergeUserProfile(
          user,
          response.data.user_details as Record<string, unknown>,
        );
        dispatch(setUser(mergedUser as never));
        await AsyncStorage.setItem('USER_DATA', JSON.stringify(mergedUser));
      }
    } catch {
      // Keep existing user data if refresh fails.
    }
  }, [dispatch, astrologerUser?._id, user, userService]);

  const pollSubscriptionVerification = useCallback(
    async (
      subscriptionId: string,
      userId: string,
      planKey: AstrologerPlanKey,
      paymentResponse: AstrologerRazorpayPaymentResponse,
    ) => {
      if (isPollingRef.current) {
        return null;
      }

      isPollingRef.current = true;
      setVerifyingPayment(true);

      const resolvedSubscriptionId = String(
        paymentResponse.razorpay_subscription_id ||
          subscriptionId ||
          '',
      ).trim();

      if (!resolvedSubscriptionId) {
        throw new Error('Subscription ID missing from payment response.');
      }


      console.log('resolvedSubscriptionId', userId, resolvedSubscriptionId);

      try {
        for (let attempt = 0; attempt < 100; attempt += 1) {
          const verifyResponse =
            await subscriptionApi.verifyAstrologerAutopaySubscription({
              subscription_id: resolvedSubscriptionId,
              user_id: userId,
            });

          console.log('verifyResponse0000', verifyResponse);

          if (verifyResponse.status === 'success') {
            await refreshAstrologerUser();
            Toast.show({
              type: 'success',
              text1: 'Payment Successful',
              text2:
                planKey === 'premium'
                  ? 'Your Premium plan is now active.'
                  : 'Your Pro plan is now active.',
              position: 'top',
              topOffset: 60,
              visibilityTime: 3000,
            });
            return verifyResponse;
          }

          if (verifyResponse.status !== 'pending') {
            break;
          }

          await sleep(3000);
        }

        throw new Error('Payment verification failed. Please try again.');
      } finally {
        setVerifyingPayment(false);
        isPollingRef.current = false;
      }
    },
    [refreshAstrologerUser],
  );

  const handleSubscribe = useCallback(
    async (planKey: 'pro' | 'premium') => {
      try {
        setSubscribingPlan(planKey);

        const userDataString = await AsyncStorage.getItem('USER_DATA');
        if (!userDataString) {
          throw new Error('User data not found. Please login again.');
        }

        const currentUserData = JSON.parse(userDataString) as Record<
          string,
          unknown
        >;

        console.log('currentUserData', currentUserData);
        const userId = String(currentUserData._id || '');

        if (!userId) {
          throw new Error('User ID not found. Please login again.');
        }

        const planType: AstrologerAutopayPlanType =
          planKey === 'premium' ? '4999_plan' : '2999_plan';
        const selectedPlan = planKey === 'premium' ? premiumPlan : proPlan;
        const planId = resolvePlanMongoId(selectedPlan) || RAZORPAY_CONFIG.PLAN_ID;

        const subscriptionResponse =
          await subscriptionApi.createAstrologerAutopaySubscription({
            user_id: userId,
            plan_id: planId,
            plan_type: planType,
          });

        if (
          subscriptionResponse.status === false ||
          String(subscriptionResponse.status).toLowerCase() === 'false'
        ) {
          Toast.show({
            type: 'info',
            text1: 'Active Plan',
            text2:
              subscriptionResponse.message ||
              'You already have an active plan. Please upgrade your plan to continue.',
            position: 'top',
            topOffset: 60,
            visibilityTime: 3000,
          });
          return;
        }

        if (!subscriptionResponse.subscription_id) {
          throw new Error('Subscription ID not received from server');
        }

        const razorpayKey =
          subscriptionResponse.razorpay_key ||
          (RAZORPAY_CONFIG.IS_TEST_MODE
            ? RAZORPAY_CONFIG.TEST_KEY
            : RAZORPAY_CONFIG.LIVE_KEY);

        if (!razorpayKey) {
          throw new Error('Razorpay key not received from server');
        }

        const options = {
          key: String(razorpayKey),
          subscription_id: subscriptionResponse.subscription_id,
          // recurring: 1,
          name: 'Astrodha',
          description:
            planKey === 'premium'
              ? 'Astrologer Premium Subscription'
              : 'Astrologer Pro Subscription',
          currency: 'INR',
          prefill: {
            email: String(currentUserData.email || 'user@example.com'),
            contact: String(currentUserData.phone || '9999999999'),
            name:
              `${String(currentUserData.first_name || '')} ${String(currentUserData.last_name || '')}`.trim() ||
              'Astrologer',
          },
          config: {
            display: {
              blocks: {
                card: {
                  name: 'Pay with Card',
                  instruments: [{ method: 'card' }],
                },
              },
              sequence: ['block.card'],
              preferences: {
                show_default_blocks: false,
              },
            },
          },
          theme: { color: '#DF8A5D' },
        };

        console.log('options', options);

        const paymentResponse = await RazorpayCheckout.open(options);

        console.log('paymentResponse', paymentResponse);

        if (
          !paymentResponse?.razorpay_payment_id ||
          !paymentResponse?.razorpay_signature
        ) {
          throw new Error('Invalid payment response from Razorpay');
        }

        await pollSubscriptionVerification(
          String(paymentResponse.razorpay_subscription_id || ''),
          userId,
          planKey,
          paymentResponse,
        );
      } catch (paymentError: unknown) {
        const err = paymentError as {
          code?: number | string;
          description?: string;
          message?: string;
          reason?: string;
          step?: string;
          details?: { error?: { reason?: string } };
          error?: { code?: string; reason?: string; step?: string };
        };

        if (isRazorpayPaymentCancelled(err)) {
          Alert.alert('Payment Failed', 'Payment processing cancelled by user', [
            { text: 'OK', style: 'default' },
          ]);
          return;
        }

        const errorMessage =
          err.description || err.message || 'Payment failed. Please try again.';

        if (
          errorMessage.toLowerCase().includes('verified successfully') ||
          errorMessage.toLowerCase().includes('payment successful')
        ) {
          return;
        }

        const isVerificationError = errorMessage
          .toLowerCase()
          .includes('verification');

        Alert.alert(
          isVerificationError ? 'Verification Failed' : 'Payment Failed',
          errorMessage,
          [{ text: 'OK', style: 'default' }],
        );
      } finally {
        setSubscribingPlan(null);
      }
    },
    [astrologerUser, pollSubscriptionVerification, premiumPlan, proPlan],
  );

  const isDark = theme === 'dark';
  const textPrimary = isDark ? colors.themeTextWhite : colors.DarkNavy;
  const textMuted = isDark ? '#B8B0A0' : '#6B7280';
  const cardBg = isDark ? '#2A3F58' : colors.white;
  const borderColor = isDark ? 'rgba(238, 229, 202, 0.22)' : '#E5E7EB';

  const renderCheckRow = (text: string, light = false) => (
    <View key={text} style={styles.featureRow}>
      <View style={styles.circleCheck}>
        <Text style={styles.circleCheckMark}>✓</Text>
      </View>
      <Text style={[styles.featureText, light && styles.featureTextLight]}>{text}</Text>
    </View>
  );

  const renderPrice = (
    price: string,
    priceMode: string | undefined,
    color: string,
    loading: boolean,
  ) => {
    if (loading) {
      return <ActivityIndicator size="small" color={color} style={styles.loader} />;
    }
    return (
      <View style={styles.priceRow}>
        <Text style={[styles.priceAmount, { color }]}>₹ {price}</Text>
        <Text style={[styles.priceUnit, { color }]}>{getPriceUnit(priceMode)}</Text>
      </View>
    );
  };

  const renderPlanButton = (planKey: AstrologerPlanKey, label: string) => {
    const isActive = isPlanActive(currentPlan, planKey);
    const isLoading = subscribingPlan === planKey;
    const canUpgradeToPremium =
      planKey === 'premium' && isPlanActive(currentPlan, 'pro') && !isActive;
    const canSubscribe =
      (planKey === 'pro' && !isPlanActive(currentPlan, 'pro') && !isPlanActive(currentPlan, 'premium')) ||
      canUpgradeToPremium;

    if (planKey === 'free' && isActive) {
      return (
        <View style={styles.ctaCurrentPlan}>
          <Text style={styles.ctaCurrentPlanText}>Current Plan</Text>
        </View>
      );
    }

    if (planKey === 'pro' && isActive) {
      return (
        <View style={styles.ctaActivePlan}>
          <Text style={styles.ctaActivePlanText}>Active Plan</Text>
        </View>
      );
    }

    if (planKey === 'premium' && isActive) {
      return (
        <View style={styles.ctaActivePlan}>
          <Text style={styles.ctaActivePlanText}>Active Plan</Text>
        </View>
      );
    }

    if (planKey === 'pro' ) {
      return (
        <TouchableOpacity
          style={styles.ctaPremium}
          onPress={() => handleSubscribe('pro')}
          disabled={isLoading || verifyingPayment}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.ctaPremiumText}>{label}</Text>
          )}
        </TouchableOpacity>
      );
    }

    if (planKey === 'premium' ) {
      return (
        <TouchableOpacity
          style={styles.ctaPremium}
          onPress={() => handleSubscribe('premium')}
          disabled={isLoading || verifyingPayment}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.ctaPremiumText}>
              {canUpgradeToPremium ? 'Upgrade to Premium' : label}
            </Text>
          )}
        </TouchableOpacity>
      );
    }

    return null;
  };

  return (
    <MainContainer>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <ImageBackground
        source={
          isDark
            ? require('../../assets/image/DarkBackground.png')
            : require('../../assets/image/LightBackground.png')
        }
        style={[
          styles.stickyHeaderContainer,
          { backgroundColor: isDark ? colors.cardBackground : colors.white },
        ]}
        imageStyle={styles.stickyHeaderBgImage}
      >
        <View style={styles.stickyHeaderOverlay} />
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Plan</Text>
      </ImageBackground>

      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroCard}>
          <Image
            source={require('../../assets/image/PaidPlanImage.png')}
            resizeMode="cover"
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTitle}>Ask Technical Astrology Questions.</Text>
            <Text style={styles.heroSubtitle}>Get Answers Instantly.</Text>
          </View>
        </View>

        <View
          style={[
            styles.topFeaturesRow,
            {
              backgroundColor: isDark ? 'rgba(34,49,73,0.9)' : 'rgba(223,138,93,0.15)',
            },
          ]}
        >
          <Text style={[styles.topFeatureItem, { color: textPrimary }]}>
            ✓ Client Management
          </Text>
          <Text style={[styles.topFeatureItem, { color: textPrimary }]}>
            ✓ Professional Tools
          </Text>
          <Text style={[styles.topFeatureItem, { color: textPrimary }]}>
            ✓ Plan Tracking
          </Text>
        </View>

        {plansError ? (
          <TouchableOpacity onPress={fetchPlans} activeOpacity={0.8} style={styles.plansErrorBanner}>
            <Text style={styles.plansErrorText}>{plansError} Tap to retry.</Text>
          </TouchableOpacity>
        ) : null}

        {verifyingPayment ? (
          <View style={styles.verifyingBanner}>
            <ActivityIndicator size="small" color={colors.Orangeaccentcolor} />
            <Text style={[styles.verifyingText, { color: textPrimary }]}>
              Verifying your payment...
            </Text>
          </View>
        ) : null}

        {/* <View style={[styles.currentPlanCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.currentPlanLabel, { color: textMuted }]}>Current Plan</Text>
          <Text style={[styles.currentPlanName, { color: colors.Orangeaccentcolor }]}>
            {formatPlanName(currentPlan)}
          </Text>

          <View style={styles.planMetaRow}>
            <View style={styles.planMetaItem}>
              <Text style={[styles.planMetaLabel, { color: textMuted }]}>Start Date</Text>
              <Text style={[styles.planMetaValue, { color: textPrimary }]}>{startPlanTime}</Text>
            </View>
            <View style={styles.planMetaItem}>
              <Text style={[styles.planMetaLabel, { color: textMuted }]}>End Date</Text>
              <Text style={[styles.planMetaValue, { color: textPrimary }]}>{endPlanTime}</Text>
            </View>
          </View>

          <View style={styles.planMetaRow}>
            <View style={styles.planMetaItem}>
              <Text style={[styles.planMetaLabel, { color: textMuted }]}>Active Clients</Text>
              <Text style={[styles.planMetaValue, { color: textPrimary }]}>{currentMembers}</Text>
            </View>
            <View style={styles.planMetaItem}>
              <Text style={[styles.planMetaLabel, { color: textMuted }]}>Available Slots</Text>
              <Text style={[styles.planMetaValue, { color: textPrimary }]}>
                {availableMembers}/{membersAllow}
              </Text>
            </View>
          </View>
        </View> */}

        <View style={styles.planCardsColumn}>
          <View
            style={[
              styles.planCard,
              styles.planCardFree,
              { backgroundColor: cardBg, borderColor },
            ]}
          >
            <Text style={[styles.planCardTitle, { color: textPrimary }]}>FREE</Text>
            {renderPrice(
              freePlan?.price ?? '0',
              freePlan?.priceMode,
              '#2563EB',
              plansLoading && !freePlan?.price,
            )}
            <View style={styles.alwaysFreePill}>
              <Text style={styles.alwaysFreePillText}>Always Free</Text>
            </View>
            {FREE_FEATURES.map(feature => renderCheckRow(feature))}
            <View style={[styles.exampleBox, { borderColor }]}>
              <Text style={[styles.exampleLabel, { color: textMuted }]}>Example:</Text>
              <Text style={[styles.exampleText, { color: textPrimary }]}>
                Which planets are connected to the 10th lord?
              </Text>
            </View>
            {renderPlanButton('free', 'Current Plan')}
          </View>

          <View style={styles.popularWrap}>
            <View style={styles.mostPopularBadge}>
              <Text style={styles.mostPopularBadgeText}>★ MOST POPULAR</Text>
            </View>
            <View style={[styles.planCard, styles.planCardPro]}>
              <Text style={[styles.planCardTitle, styles.textWhite]}>PRO</Text>
              {renderPrice(
                proPlan?.price ?? '2999',
                proPlan?.priceMode,
                '#FFFFFF',
                plansLoading && !proPlan?.price,
              )}
              {PRO_FEATURES.map(feature => renderCheckRow(feature, true))}
              <View style={styles.exampleBoxDark}>
                <Text style={styles.exampleLabelDark}>Example:</Text>
                <Text style={styles.exampleTextDark}>
                  Which natal combinations are activated by transit Saturn?
                </Text>
              </View>
              {renderPlanButton('pro', 'Get Pro Plan')}
            </View>
          </View>

          <View style={[styles.planCard, styles.planCardPremium]}>
            <Text style={[styles.planCardTitle, styles.textWhite]}>PREMIUM</Text>
            {renderPrice(
              premiumPlan?.price ?? '4999',
              premiumPlan?.priceMode,
              '#FFFFFF',
              plansLoading && !premiumPlan?.price,
            )}
            {PREMIUM_FEATURES.map(feature => renderCheckRow(feature, true))}
            <View style={styles.exampleBoxDark}>
              <Text style={styles.exampleLabelDark}>Example:</Text>
              <Text style={styles.exampleTextDark}>
                Show all periods between 2024–2030 when Jupiter activates Venus combinations.
              </Text>
            </View>
            {renderPlanButton('premium', 'Get Premium Plan')}
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>How It Works</Text>
          {HOW_IT_WORKS.map(item => (
            <View key={item.step} style={styles.howItWorksRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{item.step}</Text>
              </View>
              <View style={styles.howItWorksTextWrap}>
                <Text style={[styles.howItWorksTitle, { color: textPrimary }]}>
                  {item.title}
                </Text>
                <Text style={[styles.howItWorksDesc, { color: textMuted }]}>
                  {item.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>
            Example Questions You Can Ask
          </Text>
          <View style={styles.exampleGrid}>
            {EXAMPLE_QUESTIONS.map(question => (
              <View
                key={question}
                style={[styles.exampleQuestionCard, { borderColor, backgroundColor: cardBg }]}
              >
                <Text style={[styles.exampleQuestionText, { color: textPrimary }]}>
                  {question}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.trustRow}>
          {TRUST_BADGES.map(badge => (
            <View
              key={badge.title}
              style={[styles.trustCard, { backgroundColor: cardBg, borderColor }]}
            >
              <Text style={styles.trustIcon}>{badge.icon}</Text>
              <Text style={[styles.trustTitle, { color: textPrimary }]}>{badge.title}</Text>
              <Text style={[styles.trustSubtitle, { color: textMuted }]}>{badge.subtitle}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </MainContainer>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
    paddingTop: responsiveWidth('19'),
    paddingBottom: Platform.OS === 'android' ? 90 : 90,
  },
  stickyHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: responsiveWidth('10'),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    minHeight: responsiveWidth('14'),
  },
  stickyHeaderBgImage: {},
  stickyHeaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: fontFamily.semiBold,
    textAlign: 'center',
  },
  heroCard: {
    marginHorizontal: responsiveWidth(4),
    marginBottom: responsiveWidth(3),
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 120,
    backgroundColor: '#0F1A2E',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.45,
  },
  heroOverlay: {
    padding: 18,
    justifyContent: 'center',
    minHeight: 120,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: fontFamily.bold,
    lineHeight: 26,
  },
  heroSubtitle: {
    color: '#F2994A',
    fontSize: 18,
    fontFamily: fontFamily.semiBold,
    marginTop: 4,
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
  verifyingBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(242, 153, 74, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  verifyingText: {
    fontSize: 13,
    fontFamily: fontFamily.medium,
  },
  currentPlanCard: {
    marginHorizontal: responsiveWidth(4),
    marginBottom: responsiveWidth(4),
    borderRadius: 16,
    borderWidth: 1,
    padding: responsiveWidth(4),
  },
  currentPlanLabel: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    marginBottom: 4,
  },
  currentPlanName: {
    fontSize: 24,
    fontFamily: fontFamily.bold,
    marginBottom: responsiveWidth(3),
  },
  planMetaRow: {
    flexDirection: 'row',
    marginBottom: responsiveWidth(2),
    gap: responsiveWidth(3),
  },
  planMetaItem: {
    flex: 1,
  },
  planMetaLabel: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    marginBottom: 2,
  },
  planMetaValue: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
  },
  planCardsColumn: {
    paddingHorizontal: responsiveWidth(4),
    gap: 18,
    marginBottom: 18,
  },
  planCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  planCardFree: {},
  planCardPro: {
    backgroundColor: '#0F1A2E',
    borderColor: '#F2994A',
  },
  planCardPremium: {
    backgroundColor: '#1A1033',
    borderColor: '#8B5CF6',
  },
  popularWrap: {
    position: 'relative',
    paddingTop: 14,
  },
  mostPopularBadge: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    zIndex: 2,
    backgroundColor: '#F2994A',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  mostPopularBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: fontFamily.bold,
    letterSpacing: 0.5,
  },
  planCardTitle: {
    fontSize: 22,
    fontFamily: fontFamily.bold,
    textAlign: 'center',
    marginBottom: 8,
  },
  textWhite: {
    color: '#FFFFFF',
  },
  loader: {
    marginVertical: 8,
  },
  priceRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  priceAmount: {
    fontSize: 32,
    fontFamily: fontFamily.bold,
  },
  priceUnit: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    marginTop: 2,
  },
  alwaysFreePill: {
    alignSelf: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 14,
  },
  alwaysFreePillText: {
    color: '#2563EB',
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  circleCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  circleCheckMark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: '#1F2937',
    lineHeight: 20,
  },
  featureTextLight: {
    color: '#FFFFFF',
  },
  exampleBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    marginBottom: 14,
  },
  exampleLabel: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    lineHeight: 18,
  },
  exampleBoxDark: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    marginBottom: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  exampleLabelDark: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
    color: '#F2994A',
    marginBottom: 4,
  },
  exampleTextDark: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
  ctaCurrentPlan: {
    alignSelf: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  ctaCurrentPlanText: {
    color: '#374151',
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
  },
  ctaActivePlan: {
    alignSelf: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  ctaActivePlanText: {
    color: '#22C55E',
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
  },
  ctaPremium: {
    alignSelf: 'center',
    backgroundColor: '#F2994A',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  ctaPremiumText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
  },
  sectionCard: {
    marginHorizontal: responsiveWidth(4),
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
    marginBottom: 14,
    textAlign: 'center',
  },
  howItWorksRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: fontFamily.bold,
  },
  howItWorksTextWrap: {
    flex: 1,
  },
  howItWorksTitle: {
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
    marginBottom: 4,
  },
  howItWorksDesc: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    lineHeight: 18,
  },
  exampleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  exampleQuestionCard: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    minHeight: 72,
  },
  exampleQuestionText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    lineHeight: 17,
  },
  trustRow: {
    paddingHorizontal: responsiveWidth(4),
    gap: 10,
    marginBottom: 8,
  },
  trustCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  trustIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  trustTitle: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    marginBottom: 4,
    textAlign: 'center',
  },
  trustSubtitle: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default AstrologerPlanScreen;
