import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RazorpayCheckout from 'react-native-razorpay';
import Toast from 'react-native-toast-message';
import { fontFamily, responsiveWidth } from '../../constant/theme';
import { useTheme } from '../../context/ThemeContext';
import { subscriptionApi } from '../../api/subscriptionApi';
import { getPlanIdForPlatform } from '../../constant/subscriptionPlans';
import http from '../../utils/http';
import {
  getMemberUserId,
  resolveBillingMemberForFamilyUpgrade,
} from '../../utils/resolveBillingMemberForUpgrade';

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

type SubscriptionPlanApiItem = {
  title?: string;
  price?: string;
  priceMode?: string;
};

const getPriceUnit = (priceMode?: string) => {
  const mode = (priceMode ?? 'month').toLowerCase();
  return mode.includes('year') ? '/ year' : '/ month';
};

export type FamilyUpgradeModalProps = {
  visible: boolean;
  onClose: () => void;
  member: any;
  membersData?: any[];
  user: any;
  creatingSubscription?: boolean;
  onCreatingChange?: (creating: boolean) => void;
  onSuccess?: () => void;
  onIosFamilyPurchase?: (billingMember: any) => Promise<void>;
};

const FamilyUpgradeModal = ({
  visible,
  onClose,
  member,
  membersData,
  user,
  creatingSubscription = false,
  onCreatingChange,
  onSuccess,
  onIosFamilyPurchase,
}: FamilyUpgradeModalProps) => {
  const { theme, colors } = useTheme();

  const billingMember = useMemo(
    () => resolveBillingMemberForFamilyUpgrade(member, membersData),
    [member, membersData],
  );
  const [subscriptionPlansLoading, setSubscriptionPlansLoading] = useState(false);
  const [familyPlanFromApi, setFamilyPlanFromApi] = useState<SubscriptionPlanApiItem | null>(
    null,
  );
  const [preview, setPreview] = useState<{
    loading: boolean;
    orderId?: string;
    amountPaise?: number;
    currency?: string;
    key?: string;
    originalAmountPaise?: number;
    walletUsedPaise?: number;
  }>({ loading: false });

  const fetchSubscriptionPlans = useCallback(async () => {
    setSubscriptionPlansLoading(true);
    try {
      const res = await http.get<{ status: boolean; data?: SubscriptionPlanApiItem[] }>('/plans');
      const raw = Array.isArray(res.data?.data) ? res.data.data : [];
      const familyPlan =
        raw.find(p => p.title?.toLowerCase().includes('family')) || null;
      setFamilyPlanFromApi(familyPlan);
    } catch (err) {
      console.error('Failed to fetch subscription plans:', err);
      setFamilyPlanFromApi(null);
    } finally {
      setSubscriptionPlansLoading(false);
    }
  }, []);

  const loadPreview = useCallback(async () => {
    const userId = user?._id || (user as any)?.id;
    const memberUserId = getMemberUserId(billingMember);
    if (!userId || !memberUserId) return;

    setPreview({ loading: true });
    try {
      const familyPlanId = getPlanIdForPlatform('family');
      const initRes = await subscriptionApi.upgradeInitiate({
        user_id: userId,
        member_user_id: memberUserId,
        family_plan_id: familyPlanId,
      });

      const orderId =
        (initRes as any)?.razorpay_order_id ||
        (initRes as any)?.order_id ||
        (initRes as any)?.data?.razorpay_order_id ||
        (initRes as any)?.data?.order_id;
      const amountPaiseRaw =
        (initRes as any)?.amount_paise ||
        (initRes as any)?.amount ||
        (initRes as any)?.data?.amount_paise ||
        (initRes as any)?.data?.amount;
      const amountPaise = amountPaiseRaw != null ? Number(amountPaiseRaw) : undefined;
      const currency =
        (initRes as any)?.currency || (initRes as any)?.data?.currency || 'INR';
      const userDataString = await AsyncStorage.getItem('USER_DATA');
      const currentUserData: any = userDataString ? JSON.parse(userDataString) : {};
      const key =
        (initRes as any)?.razorpay_key ||
        (initRes as any)?.data?.razorpay_key ||
        currentUserData?.razorpay_key ||
        'rzp_test_Rueu06YDULsQCD';

      const originalAmountPaiseRaw =
        (initRes as any)?.original_amount_paise ||
        (initRes as any)?.data?.original_amount_paise ||
        (initRes as any)?.original_price_paise ||
        (initRes as any)?.data?.original_price_paise;
      const originalAmountPaise =
        originalAmountPaiseRaw != null ? Number(originalAmountPaiseRaw) : 2499 * 100;

      const walletUsedPaiseRaw =
        (initRes as any)?.wallet_used_paise ||
        (initRes as any)?.data?.wallet_used_paise ||
        (initRes as any)?.balance_used_paise ||
        (initRes as any)?.data?.balance_used_paise;
      const walletUsedPaise =
        walletUsedPaiseRaw != null
          ? Number(walletUsedPaiseRaw)
          : amountPaise != null
            ? Math.max(0, originalAmountPaise - amountPaise)
            : undefined;

      setPreview({
        loading: false,
        orderId,
        amountPaise,
        currency,
        key,
        originalAmountPaise,
        walletUsedPaise,
      });
    } catch {
      setPreview({ loading: false });
    }
  }, [billingMember, user]);

  useEffect(() => {
    if (visible) {
      fetchSubscriptionPlans();
      if (member) {
        loadPreview();
      }
    } else {
      setPreview({ loading: false });
    }
  }, [visible, member, fetchSubscriptionPlans, loadPreview]);

  const familyPrice = familyPlanFromApi?.price ?? '999';
  const priceUnit = getPriceUnit(familyPlanFromApi?.priceMode);

  const displayPrice = useMemo(() => {
    if (preview.amountPaise != null) {
      return String(Math.round(preview.amountPaise / 100));
    }
    return familyPrice;
  }, [preview.amountPaise, familyPrice]);

  const renderCircleCheck = () => (
    <View style={[styles.circleCheck, { backgroundColor: '#22C55E' }]}>
      <Text style={styles.circleCheckMark}>✓</Text>
    </View>
  );

  const renderFeatureList = () =>
    PREMIUM_FAMILY_FEATURES.map((item, i) => (
      <View key={`${item}-${i}`} style={styles.featureRow}>
        {renderCircleCheck()}
        <Text style={styles.featureTextLight}>{item}</Text>
      </View>
    ));

  const renderPrice = () => {
    if (subscriptionPlansLoading || preview.loading) {
      return (
        <ActivityIndicator
          size="small"
          color="#FFFFFF"
          style={styles.priceLoader}
        />
      );
    }

    return (
      <View style={styles.priceRow}>
        {!!preview.originalAmountPaise &&
          !!preview.amountPaise &&
          preview.amountPaise < preview.originalAmountPaise && (
            <Text style={styles.strikePrice}>
              ₹{Math.round(preview.originalAmountPaise / 100)}
            </Text>
          )}
        <Text style={[styles.priceAmount, styles.textWhite]}>₹ {displayPrice}</Text>
        <Text style={[styles.priceUnit, styles.textWhite]}>{priceUnit}</Text>
      </View>
    );
  };

  const handleUpgradePress = async () => {
    if (Platform.OS === 'ios') {
      onClose();
      await onIosFamilyPurchase?.(billingMember);
      return;
    }

    const userId = user?._id || (user as any)?.id || '';
    const memberUserId = getMemberUserId(billingMember);
    if (!userId || !memberUserId) return;

    let orderId = preview.orderId;
    let amountPaise = preview.amountPaise;
    let key = preview.key;

    try {
      onCreatingChange?.(true);

      if (!orderId || !amountPaise || !key) {
        const familyPlanId = getPlanIdForPlatform('family');
        const initRes = await subscriptionApi.upgradeInitiate({
          user_id: userId,
          member_user_id: getMemberUserId(billingMember),
          family_plan_id: familyPlanId,
        });

        orderId =
          (initRes as any)?.razorpay_order_id ||
          (initRes as any)?.order_id ||
          (initRes as any)?.data?.razorpay_order_id ||
          (initRes as any)?.data?.order_id;
        amountPaise =
          (initRes as any)?.amount_paise ||
          (initRes as any)?.amount ||
          (initRes as any)?.data?.amount_paise ||
          (initRes as any)?.data?.amount;
        key =
          (initRes as any)?.razorpay_key ||
          (initRes as any)?.data?.razorpay_key ||
          key;

        if (!orderId || !amountPaise || !key) {
          throw new Error((initRes as any)?.message || 'Upgrade initiate failed');
        }

        amountPaise = Number(amountPaise);
      }

      const userDataString = await AsyncStorage.getItem('USER_DATA');
      const currentUserData: any = userDataString ? JSON.parse(userDataString) : {};

      const options = {
        key,
        order_id: orderId,
        amount: Number(amountPaise),
        currency: preview.currency || 'INR',
        method: {
          card: true,
          netbanking: false,
          wallet: false,
          upi: false,
          emi: false,
          paylater: false,
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
        name: 'Astrodha',
        description: 'Upgrade to Family Plan',
        prefill: {
          email: currentUserData.email || (user as any)?.email || 'user@example.com',
          contact: currentUserData.phone || (user as any)?.phone || '9999999999',
          name:
            `${currentUserData.first_name || (user as any)?.first_name || ''} ${currentUserData.last_name || (user as any)?.last_name || ''}`.trim() ||
            'User',
        },
        theme: { color: '#DF8A5D' },
      };

      const payRes: any = await RazorpayCheckout.open(options as any);
      const confirmRes = await subscriptionApi.upgradeConfirm({
        razorpay_order_id: payRes.razorpay_order_id,
        razorpay_payment_id: payRes.razorpay_payment_id,
        razorpay_signature: payRes.razorpay_signature,
      });

      const ok =
        (confirmRes as any)?.success === true ||
        (confirmRes as any)?.status === 'success' ||
        (confirmRes as any)?.status === 'completed' ||
        String((confirmRes as any)?.success) === 'true';

      if (!ok) {
        throw new Error((confirmRes as any)?.message || 'Upgrade failed');
      }

      Toast.show({
        type: 'success',
        text1: 'Upgrade Successful',
        text2: 'Family plan has been activated',
        position: 'top',
        topOffset: 60,
        visibilityTime: 3000,
      });
      onClose();
      onSuccess?.();
    } catch (err: any) {
      const msg = String(err?.description || err?.message || '').toLowerCase();
      if (!msg.includes('cancel')) {
        Toast.show({
          type: 'error',
          text1: 'Upgrade Failed',
          text2: err?.description || err?.message || 'Could not upgrade plan',
          position: 'top',
          topOffset: 60,
          visibilityTime: 3000,
        });
      }
    } finally {
      onCreatingChange?.(false);
    }
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

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.cardsRow}
            style={styles.cardsScroll}
          >
            <View style={[styles.planCard, styles.planCardFamily]}>
              <Text style={[styles.planTitle, styles.textWhite]}>FAMILY PLAN</Text>
              {renderPrice()}
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
              {renderFeatureList()}
              <View style={styles.familyMembersBox}>
                <Text style={styles.familyMembersIcon}>👥</Text>
                <View style={styles.familyMembersTextWrap}>
                  <Text style={styles.familyMembersTitle}>UP TO 5 MEMBERS</Text>
                  <Text style={styles.familyMembersSub}>
                    Manage up to 5 profiles in one plan.
                  </Text>
                </View>
              </View>
              {!!preview.walletUsedPaise && preview.walletUsedPaise > 0 && (
                <View style={styles.walletPill}>
                  <Text style={styles.walletText}>
                    Using ₹{Math.round(preview.walletUsedPaise / 100)} from your balance
                  </Text>
                </View>
              )}
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
                style={[styles.cta, styles.ctaPurple, creatingSubscription && styles.ctaDisabled]}
                onPress={handleUpgradePress}
                disabled={creatingSubscription}
              >
                {creatingSubscription ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={[styles.ctaText, { color: '#FFFFFF' }]}>Get Family Plan</Text>
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
  cardsScroll: {
    width: '100%',
    maxHeight: Dimensions.get('window').height * 0.65,
  },
  cardsRow: {
    paddingHorizontal: 4,
    paddingBottom: 8,
    paddingTop: responsiveWidth(4),
  },
  planCard: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  planCardFamily: {
    backgroundColor: '#0F1A2E',
    borderColor: '#7C3AED',
    borderWidth: 1.5,
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
    flexWrap: 'wrap',
  },
  strikePrice: {
    color: 'rgba(255,255,255,0.7)',
    textDecorationLine: 'line-through',
    fontSize: 14,
    fontFamily: fontFamily.regular,
    marginRight: 6,
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
  walletPill: {
    alignSelf: 'center',
    marginTop: 4,
    marginBottom: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  walletText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontFamily: fontFamily.regular,
  },
  sectionHeaderLight: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: 'rgba(255,255,255,0.95)',
    marginTop: 12,
    marginBottom: 8,
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
  cta: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  ctaPurple: {
    backgroundColor: '#7C3AED',
  },
  ctaDisabled: {
    opacity: 0.55,
  },
  ctaText: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
  },
});

export default FamilyUpgradeModal;
