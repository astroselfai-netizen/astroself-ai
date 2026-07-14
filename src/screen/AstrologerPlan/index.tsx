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

type PlanFeature = {
  icon?: string | null;
  title: string;
  richContent?: string;
};

type PlanApiItem = {
  id: number;
  _id?: string;
  plan_id?: string;
  plan_name?: string;
  plan_type?: string;
  title: string;
  badge?: string;
  price: string;
  priceMode?: string;
  features?: PlanFeature[];
  featuresTitle?: string;
  footerText?: string;
  footerNote?: string;
  [key: string]: unknown;
};

const sleep = (ms: number) =>
  new Promise<void>(resolve => {
    setTimeout(() => resolve(), ms);
  });

const getNormalizedPlanLabel = (plan: PlanApiItem | null) =>
  `${plan?.featuresTitle || ''} ${plan?.title || ''}`.toLowerCase().trim();

const isAstrologerBillingConfig = (plan: PlanApiItem) =>
  Boolean(plan.plan_name && (!plan.features || plan.features.length === 0));

const isFreePlan = (plan: PlanApiItem) => {
  const label = getNormalizedPlanLabel(plan);
  return label.includes('free') || Number(plan.price || 0) <= 0;
};

const isPaidPlan = (plan: PlanApiItem) => !isFreePlan(plan);

const resolveBillingPlanId = (billingConfig: PlanApiItem | null) =>
  String(billingConfig?._id || billingConfig?.plan_id || RAZORPAY_CONFIG.PLAN_ID);

const getPlanIdentityTokens = (plan: PlanApiItem) => {
  const normalizedTitle = plan.title?.toLowerCase().trim();
  const normalizedFeatureTitle = plan.featuresTitle?.toLowerCase().trim();
  const normalizedPrice = String(plan.price || '').trim();
  const normalizedPlanId = String(plan.plan_id || plan._id || plan.id || '').trim();

  return [normalizedTitle, normalizedFeatureTitle, normalizedPrice, normalizedPlanId].filter(
    Boolean,
  ) as string[];
};

const resolveBillingPlanTypeFromConfig = (
  plan: PlanApiItem,
  billingConfig: PlanApiItem | null,
) => {
  if (!billingConfig) {
    return '';
  }

  const planTokens = getPlanIdentityTokens(plan);
  if (planTokens.length === 0) {
    return '';
  }

  const matchingEntry = Object.entries(billingConfig).find(([key, rawValue]) => {
    if (!key.endsWith('_plan')) {
      return false;
    }

    const value = String(rawValue || '').toLowerCase().trim();
    if (!value) {
      return false;
    }

    return planTokens.some(token => value === token || value.includes(token) || token.includes(value));
  });

  return matchingEntry?.[0]?.trim() || '';
};

const resolveBillingPlanType = (
  plan: PlanApiItem,
  billingConfig: PlanApiItem | null = null,
) => {
  if (plan.plan_type?.trim()) {
    return plan.plan_type.trim();
  }

  const configuredPlanType = resolveBillingPlanTypeFromConfig(plan, billingConfig);
  if (configuredPlanType) {
    return configuredPlanType;
  }

  const price = Number(plan.price || 0);
  if (price > 0) {
    return `${price}_plan`;
  }

  return '';
};

const getPlanMatchers = (plan: PlanApiItem, billingConfig: PlanApiItem | null = null) => {
  const billingType = resolveBillingPlanType(plan, billingConfig);
  const label = getNormalizedPlanLabel(plan);

  return [
    billingType,
    label,
    plan.title?.toLowerCase().trim(),
    plan.featuresTitle?.toLowerCase().trim(),
    String(plan.price || ''),
  ].filter(Boolean) as string[];
};

const isPlanItemActive = (
  currentPlan: string,
  plan: PlanApiItem,
  billingConfig: PlanApiItem | null = null,
) => {
  const normalized = currentPlan.toLowerCase().trim();

  if (!normalized && isFreePlan(plan)) {
    return true;
  }

  if (!normalized) {
    return false;
  }

  return getPlanMatchers(plan, billingConfig).some(token => {
    if (!token) {
      return false;
    }

    return normalized.includes(token) || token.includes(normalized);
  });
};

const getPlanSubscriptionKey = (plan: PlanApiItem) => String(plan.id);

type PlansApiResponse = {
  status: boolean;
  count?: number;
  data?: PlanApiItem[];
};

const SUBSCRIPTION_EXPIRES = [
  {
    step: '1',
    icon: '👁',
    description: 'You can continue viewing previously created charts',
  },
  {
    step: '2',
    icon: '⊕',
    description: 'You cannot create new charts',
  },
  {
    step: '3',
    icon: '↻',
    description: 'You cannot refresh transit combinations',
  },
  {
    step: '4',
    icon: '⏱',
    description: 'You cannot generate new analyses until subscription is renewed',
  },
];

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'ASK',
    description: 'Find all connections between Saturn and the 10th lord.',
  },
  {
    step: '2',
    title: 'SYSTEM CHECKS',
    description:
      'Conjunctions • Exchanges • Nakshatra Links • Transit Activation • Aspects • Dispositors • Dasha Activation',
  },
  {
    step: '3',
    title: 'ANSWER GENERATED',
    description: 'All relevant astrological relationships are returned instantly.',
  },
];

const TOP_FEATURE_BADGES = [
  'Natural Language Queries',
  'Transit & Dasha Activation',
  'Active Combination Search',
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

const decodeHtmlEntities = (text: string) =>
  text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

const stripHtmlTags = (html: string) =>
  decodeHtmlEntities(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());

const extractListItemsFromHtml = (html: string): string[] => {
  if (!html) {
    return [];
  }

  const items: string[] = [];
  const liRegex = /<li[^>]*>(.*?)<\/li>/gis;
  let match = liRegex.exec(html);

  while (match) {
    const text = stripHtmlTags(match[1]);
    if (text) {
      items.push(text);
    }
    match = liRegex.exec(html);
  }

  if (items.length === 0) {
    const plain = stripHtmlTags(html);
    if (plain) {
      items.push(plain);
    }
  }

  return items;
};

const isAstrologerDisplayPlan = (item: unknown): item is PlanApiItem => {
  if (!item || typeof item !== 'object') {
    return false;
  }

  const plan = item as PlanApiItem;

  if (isAstrologerBillingConfig(plan)) {
    return false;
  }

  if (!plan.title?.trim()) {
    return false;
  }

  return Array.isArray(plan.features) && plan.features.length > 0;
};

const getPlanLabel = (plan: PlanApiItem | null, fallback: string) =>
  (plan?.featuresTitle || plan?.title || fallback).toUpperCase();

const getPlanFeatureItems = (
  plan: PlanApiItem | null,
  fallback: string[],
): string[] => {
  if (!plan?.features?.length) {
    return fallback;
  }

  const items: string[] = [];

  plan.features.forEach(feature => {
    const title = feature.title?.trim().toUpperCase() || '';
    if (title === 'NOTE' || title.includes('EXAMPLE')) {
      return;
    }

    const listItems = extractListItemsFromHtml(feature.richContent || '');
    if (listItems.length > 0) {
      items.push(...listItems);
      return;
    }

    if (feature.title?.trim()) {
      items.push(feature.title.trim());
    }
  });

  return items.length > 0 ? items : fallback;
};

const getPlanExampleText = (plan: PlanApiItem | null): string | null => {
  const exampleFeature = plan?.features?.find(feature =>
    feature.title?.toLowerCase().includes('example'),
  );

  if (!exampleFeature?.richContent) {
    return null;
  }

  return stripHtmlTags(exampleFeature.richContent) || null;
};

const getPlanNoteText = (plan: PlanApiItem | null): string | null => {
  const noteFeature = plan?.features?.find(
    feature => feature.title?.trim().toUpperCase() === 'NOTE',
  );

  if (!noteFeature?.richContent) {
    return plan?.footerNote?.trim() || plan?.footerText?.trim() || null;
  }

  return stripHtmlTags(noteFeature.richContent) || null;
};

const AstrologerPlanScreen = () => {
  const dispatch = useDispatch();
  const { theme, colors } = useTheme();
  const user = useSelector((state: RootState) => state.app.user);
  const astrologerUser = user as Record<string, unknown> | null | undefined;
  const userService = useMemo(() => new UserService(), []);

  const [plansLoading, setPlansLoading] = useState(false);
  const [_plansError, setPlansError] = useState<string | null>(null);
  const [plans, setPlans] = useState<PlanApiItem[]>([]);
  const [billingConfig, setBillingConfig] = useState<PlanApiItem | null>(null);
  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const isPollingRef = useRef(false);

  const currentPlan = String(astrologerUser?.current_plan || '').toLowerCase();
  const fetchPlans = useCallback(async () => {

    console.log('fetchPlans401');
    setPlansLoading(true);
    setPlansError(null);
    try {

      console.log('fetchPlans406');
      const res = await http.get<PlansApiResponse>('/astrologer/plans');
      console.log('fetchPlans407');

      console.log('res---?>405', res);
      const raw = Array.isArray(res.data?.data) ? res.data.data : [];
      const billingRow =
        raw.find(item => isAstrologerBillingConfig(item as PlanApiItem)) || null;
      setBillingConfig(billingRow);
      setPlans(raw.filter(isAstrologerDisplayPlan));
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

      console.log('fetchPlans');
      fetchPlans();
    }, [fetchPlans]),
  );

  const displayPlans = useMemo(() => {
    return [...plans].sort((a, b) => {
      const freeDiff = Number(isFreePlan(b)) - Number(isFreePlan(a));
      if (freeDiff !== 0) {
        return freeDiff;
      }

      const priceDiff = Number(a.price || 0) - Number(b.price || 0);
      if (priceDiff !== 0) {
        return priceDiff;
      }

      return a.title.localeCompare(b.title);
    });
  }, [plans]);

  const activePlanPrice = useMemo(() => {
    const activePlan = displayPlans.find(plan =>
      isPlanItemActive(currentPlan, plan, billingConfig),
    );
    return activePlan ? Number(activePlan.price || 0) : 0;
  }, [billingConfig, currentPlan, displayPlans]);

  const highestPaidPrice = useMemo(
    () =>
      displayPlans.reduce((max, plan) => {
        if (!isPaidPlan(plan)) {
          return max;
        }
        return Math.max(max, Number(plan.price || 0));
      }, 0),
    [displayPlans],
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
      planTitle: string,
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
              text2: `Your ${planTitle} is now active.`,
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
    async (plan: PlanApiItem) => {
      try {
        
        console.log('plan---?>', plan);
        
        setSubscribingPlanId(getPlanSubscriptionKey(plan));

        const userDataString = await AsyncStorage.getItem('USER_DATA');
        if (!userDataString) {
          throw new Error('User data not found. Please login again.');
        }

        const currentUserData = JSON.parse(userDataString) as Record<
          string,
          unknown
        >;

        const userId = String(currentUserData._id || '');

        if (!userId) {
          throw new Error('User ID not found. Please login again.');
        }

        const planType = resolveBillingPlanType(plan, billingConfig);
        if (!planType) {
          throw new Error('Plan type not available for this subscription.');
        }

        console.log('planType---?>', planType);

        const planId = resolveBillingPlanId(billingConfig);

          console.log('planId---?>', planId);

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
          description: `${plan.title} Subscription`,
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
          plan.title,
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
        setSubscribingPlanId(null);
      }
    },
    [billingConfig, pollSubscriptionVerification],
  );

  const isDark = theme === 'dark';
  const textPrimary = isDark ? colors.themeTextWhite : colors.DarkNavy;
  const textMuted = isDark ? '#B8B0A0' : '#6B7280';
  const cardBg = isDark ? '#2A3F58' : colors.white;
  const borderColor = isDark ? 'rgba(238, 229, 202, 0.22)' : '#E5E7EB';
  const topFeaturesBg = isDark ? 'rgba(34,49,73,0.9)' : 'rgba(223,138,93,0.15)';

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

  const renderPlanNoteSection = (
    note: string | null,
    variant: 'pro' | 'premium',
  ) => {
    if (!note) {
      return null;
    }

    const isPro = variant === 'pro';
    const noteBorderColor = isPro ? '#8B5CF6' : '#F2994A';
    const noteIconBg = isPro ? 'rgba(139, 92, 246, 0.2)' : 'rgba(242, 153, 74, 0.2)';
    const noteIconColor = isPro ? '#C4B5FD' : '#F2994A';

    return (
      <View style={[styles.planNoteBox, { borderColor: noteBorderColor }]}>
        <View style={styles.planNoteHeader}>
          <View style={[styles.planNoteIcon, { backgroundColor: noteIconBg }]}>
            <Text style={[styles.planNoteIconText, { color: noteIconColor }]}>i</Text>
          </View>
          <Text style={styles.planNoteTitle}>NOTE</Text>
        </View>
        <Text style={styles.planNoteBody}>{note}</Text>
      </View>
    );
  };

  const renderPlanButton = (plan: PlanApiItem) => {
    const planKey = getPlanSubscriptionKey(plan);
    const isActive = isPlanItemActive(currentPlan, plan, billingConfig);
    const isLoading = subscribingPlanId === planKey;
    const planPrice = Number(plan.price || 0);
    const isUpgrade =
      isPaidPlan(plan) &&
      activePlanPrice > 0 &&
      planPrice > activePlanPrice &&
      !isActive;

    if (isFreePlan(plan) && isActive) {
      return (
        <View style={styles.ctaCurrentPlan}>
          <Text style={styles.ctaCurrentPlanText}>Current Plan</Text>
        </View>
      );
    }

    if (isPaidPlan(plan) && isActive) {
      return (
        <View style={styles.ctaActivePlan}>
          <Text style={styles.ctaActivePlanText}>Active Plan</Text>
        </View>
      );
    }

    if (isPaidPlan(plan)) {
      const buttonLabel = isUpgrade
        ? `Upgrade to ${plan.title}`
        : `Get ${plan.title}`;

      return (
        <TouchableOpacity
          style={styles.ctaPremium}
          onPress={() => handleSubscribe(plan)}
          disabled={isLoading || verifyingPayment}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.ctaPremiumText}>{buttonLabel}</Text>
          )}
        </TouchableOpacity>
      );
    }

    return null;
  };

  const renderPlanCard = (plan: PlanApiItem, index: number) => {
    const isFree = isFreePlan(plan);
    const isTopTier =
      isPaidPlan(plan) &&
      highestPaidPrice > 0 &&
      Number(plan.price || 0) === highestPaidPrice;
    const isLightCard = isFree;
    const features = getPlanFeatureItems(plan, []);
    const example = getPlanExampleText(plan);
    const note = getPlanNoteText(plan);
    const titleColor = isLightCard ? textPrimary : '#FFFFFF';
    const priceColor = isLightCard ? '#2563EB' : '#FFFFFF';
    const noteVariant = isTopTier ? 'premium' : 'pro';

    const card = (
      <View
        style={
          isFree
            ? [styles.planCard, styles.planCardFree, { backgroundColor: cardBg, borderColor }]
            : isTopTier
              ? [styles.planCard, styles.planCardPremium]
              : [styles.planCard, styles.planCardPro]
        }
      >
        <Text style={[styles.planCardTitle, { color: titleColor }]}>
          {getPlanLabel(plan, plan.title)}
        </Text>
        {renderPrice(
          plan.price ?? '0',
          plan.priceMode,
          priceColor,
          plansLoading && !plan.price,
        )}
        {isFree ? (
          <View style={styles.alwaysFreePill}>
            <Text style={styles.alwaysFreePillText}>Always Free</Text>
          </View>
        ) : null}
        {features.map(feature => renderCheckRow(feature, !isLightCard))}
        {!isFree ? renderPlanNoteSection(note, noteVariant) : null}
        {example ? (
          <View
            style={
              isLightCard ? [styles.exampleBox, { borderColor }] : styles.exampleBoxDark
            }
          >
            <Text
              style={
                isLightCard
                  ? [styles.exampleLabel, { color: textMuted }]
                  : styles.exampleLabelDark
              }
            >
              Example:
            </Text>
            <Text
              style={
                isLightCard
                  ? [styles.exampleText, { color: textPrimary }]
                  : styles.exampleTextDark
              }
            >
              {example}
            </Text>
          </View>
        ) : null}
        {renderPlanButton(plan)}
      </View>
    );

    if (plan.badge?.trim()) {
      return (
        <View key={`${plan.id}-${index}`} style={styles.popularWrap}>
          <View style={styles.mostPopularBadge}>
            <Text style={styles.mostPopularBadgeText}>
              ★ {plan.badge.trim().toUpperCase()}
            </Text>
          </View>
          {card}
        </View>
      );
    }

    return <View key={`${plan.id}-${index}`}>{card}</View>;
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
            <Text style={styles.heroDescription}>
              Query planetary relationships, house lord interactions, transit
              triggers, dignities, nakshatra connections, and active combinations
              using natural language.
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.topFeaturesRow,
            { backgroundColor: topFeaturesBg },
          ]}
        >
          {TOP_FEATURE_BADGES.map(badge => (
            <Text
              key={badge}
              style={[styles.topFeatureItem, { color: textPrimary }]}
            >
              ✓ {badge}
            </Text>
          ))}
        </View>

        {/* {plansError ? (
          <TouchableOpacity onPress={fetchPlans} activeOpacity={0.8} style={styles.plansErrorBanner}>
            <Text style={styles.plansErrorText}>{plansError} Tap to retry.</Text>
          </TouchableOpacity>
        ) : null} */}

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
          {displayPlans.map((plan, index) => renderPlanCard(plan, index))}
        </View>

        <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>
            When your subscription expires:
          </Text>
          {SUBSCRIPTION_EXPIRES.map(item => (
            <View key={item.step} style={styles.howItWorksRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{item.icon}</Text>
              </View>
              <View style={styles.howItWorksTextWrap}>
                <Text style={[styles.howItWorksDesc, { color: textMuted }]}>
                  {item.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>HOW IT WORKS</Text>
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
    paddingBottom: Platform.OS === 'android' ? 140 : 120,
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
    minHeight: 160,
    backgroundColor: '#0F1A2E',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.45,
  },
  heroOverlay: {
    padding: 18,
    justifyContent: 'center',
    minHeight: 160,
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
  heroDescription: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontFamily: fontFamily.regular,
    lineHeight: 18,
    marginTop: 10,
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
  planNoteBox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 6,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  planNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  planNoteIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planNoteIconText: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  planNoteTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: fontFamily.bold,
    letterSpacing: 0.4,
  },
  planNoteBody: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    fontFamily: fontFamily.regular,
    fontStyle: 'italic',
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
