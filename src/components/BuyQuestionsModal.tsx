import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { fontFamily, responsiveWidth } from '../constant/theme';
import UserService from '../services/user/user.service';
import { RootState } from '../state/store';
import {
  getRazorpayUpiEnabledFields,
  withUpiPrefill,
} from '../utils/razorpayUpiOptions';

const GOLD = '#C5A370';
const NAVY = '#223149';
const PRICE_PER_QUESTION = 100;
const MAX_QUESTIONS = 20;
const PRESET_PACKS = [1, 3, 5, 10] as const;
const POPULAR_COUNT = 5;

const RAZORPAY_CONFIG = {
  TEST_KEY: 'rzp_test_Rueu06YDULsQCD',
  LIVE_KEY: 'rzp_live_t11y7Cds0JWo47',
  IS_TEST_MODE: true,
};

type PackSelection = number | 'custom';

type BuyQuestionsModalProps = {
  visible: boolean;
  onClose: () => void;
  questionBalance: number;
  onPurchaseSuccess?: () => void;
};

const isRazorpayCancelled = (error: any): boolean => {
  const description = String(error?.description || error?.message || '').toLowerCase();
  const reason = String(error?.reason || error?.error?.reason || '').toLowerCase();
  return (
    error?.code === 0 ||
    error?.code === 'PAYMENT_CANCELLED' ||
    reason.includes('cancel') ||
    description.includes('cancel') ||
    error?.step === 'payment_cancelled' ||
    error?.error?.step === 'payment_authentication'
  );
};

const BuyQuestionsModal = ({
  visible,
  onClose,
  questionBalance,
  onPurchaseSuccess,
}: BuyQuestionsModalProps) => {
  const user = useSelector((state: RootState) => state.app.user);
  const userService = useMemo(() => new UserService(), []);
  const [selectedPack, setSelectedPack] = useState<PackSelection>(1);
  const [customCount, setCustomCount] = useState(2);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedPack(1);
      setCustomCount(2);
      setPaying(false);
    }
  }, [visible]);

  const questionCount =
    selectedPack === 'custom'
      ? Math.min(MAX_QUESTIONS, Math.max(1, customCount))
      : selectedPack;

  const totalAmount = questionCount * PRICE_PER_QUESTION;

  const adjustCustom = useCallback((delta: number) => {
    setCustomCount(prev => {
      const next = prev + delta;
      return Math.min(MAX_QUESTIONS, Math.max(1, next));
    });
  }, []);

  const handlePay = useCallback(async () => {
    const userId = String(user?._id || '');
    if (!userId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'User ID not found.',
      });
      return;
    }

    if (questionCount < 1 || questionCount > MAX_QUESTIONS) {
      Toast.show({
        type: 'error',
        text1: 'Invalid quantity',
        text2: `You can buy between 1 and ${MAX_QUESTIONS} questions.`,
      });
      return;
    }

    try {
      setPaying(true);

      const orderResponse = await userService.createAstrologerQuestionsOrder({
        user_id: userId,
        question_count: questionCount,
        currency: 'INR',
        receipt: `questions_${Date.now()}`,
        notes: {
          action: 'buy_questions',
          question_count: questionCount,
        },
      });

      if (!orderResponse.order_id || !orderResponse.amount) {
        throw new Error('Invalid order response from server');
      }

      const razorpayKey =
        orderResponse.razorpay_key ||
        (RAZORPAY_CONFIG.IS_TEST_MODE
          ? RAZORPAY_CONFIG.TEST_KEY
          : RAZORPAY_CONFIG.LIVE_KEY);

      console.log('Razorpay Key:', orderResponse);
      console.log(
        'Order ID:',
        orderResponse.order_id
      );

      const paymentResponse = await RazorpayCheckout.open({
        description: `Buy ${questionCount} question${questionCount > 1 ? 's' : ''}`,
        currency: orderResponse.currency || 'INR',
        key: String(razorpayKey),
        amount: orderResponse.amount,
        order_id: orderResponse.order_id,
        name: 'Astrodha',
        ...getRazorpayUpiEnabledFields(),
        prefill: withUpiPrefill({
          email: String(user?.email || 'user@example.com'),
          contact: String((user as any)?.phone || '9999999999'),
          name:
            `${String((user as any)?.first_name || '')} ${String(
              (user as any)?.last_name || '',
            )}`.trim() || 'Astrologer',
        }),
        theme: { color: GOLD },
      });

      if (
        !paymentResponse?.razorpay_payment_id ||
        !paymentResponse?.razorpay_order_id ||
        !paymentResponse?.razorpay_signature
      ) {
        throw new Error('Invalid payment response from Razorpay');
      }

      const verifyResponse = await userService.verifyAstrologerQuestionsPayment({
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_signature: paymentResponse.razorpay_signature,
      });

      const isSuccess =
        verifyResponse.success === true ||
        String(verifyResponse.success) === 'true' ||
        verifyResponse.status === 'success' ||
        String(verifyResponse.message || '')
          .toLowerCase()
          .includes('success') ||
        String(verifyResponse.message || '')
          .toLowerCase()
          .includes('verified');

      if (!isSuccess) {
        throw new Error(verifyResponse.message || 'Payment verification failed');
      }

      Toast.show({
        type: 'success',
        text1: 'Purchase Successful',
        text2: `${questionCount} question${questionCount > 1 ? 's' : ''} added to your balance.`,
      });
      onPurchaseSuccess?.();
      onClose();
    } catch (error: any) {
      if (isRazorpayCancelled(error)) {
        Toast.show({
          type: 'info',
          text1: 'Payment Cancelled',
          text2: 'You cancelled the payment.',
        });
        return;
      }

      Toast.show({
        type: 'error',
        text1: 'Payment Failed',
        text2: error?.message || error?.description || 'Please try again.',
      });
    } finally {
      setPaying(false);
    }
  }, [user, questionCount, userService, onPurchaseSuccess, onClose]);

  const renderPackCard = (count: number) => {
    const selected = selectedPack === count;
    const isPopular = count === POPULAR_COUNT;
    return (
      <TouchableOpacity
        key={count}
        style={[styles.packCard, selected && styles.packCardSelected]}
        onPress={() => setSelectedPack(count)}
        activeOpacity={0.85}
        disabled={paying}
      >
        {isPopular ? (
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>POPULAR</Text>
          </View>
        ) : null}
        {selected ? (
          <View style={styles.checkBadge}>
            <Text style={styles.checkBadgeText}>✓</Text>
          </View>
        ) : null}
        <Text style={styles.packCount}>
          {count}{' '}
          <Text style={styles.packCountLabel}>
            question{count > 1 ? 's' : ''}
          </Text>
        </Text>
        <Text style={styles.packPrice}>₹{count * PRICE_PER_QUESTION}</Text>
      </TouchableOpacity>
    );
  };

  const customSelected = selectedPack === 'custom';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={paying ? undefined : onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <ImageBackground
            source={require('../assets/image/DarkBackground.png')}
            style={styles.header}
            imageStyle={styles.headerImage}
          >
            <View style={styles.headerTopRow}>
              <View style={styles.headerTitles}>
                <Text style={styles.headerEyebrow}>QUESTION CREDITS</Text>
                <Text style={styles.headerTitle}>Buy questions</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                disabled={paying}
                activeOpacity={0.85}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.balanceBar}>
              <Text style={styles.balanceLabel}>YOUR BALANCE</Text>
              <Text style={styles.balanceValue}>
                <Text style={styles.balanceValueNumber}>{questionBalance}</Text>
                {' '}
                question{questionBalance === 1 ? '' : 's'}
              </Text>
            </View>
          </ImageBackground>

          <View style={styles.body}>
            <Text style={styles.instruction}>
              Pick a pack. Each question costs ₹{PRICE_PER_QUESTION}.
            </Text>

            <View style={styles.packsGrid}>
              {PRESET_PACKS.map(renderPackCard)}
              <TouchableOpacity
                style={[
                  styles.packCard,
                  styles.customPackCard,
                  customSelected && styles.packCardSelected,
                ]}
                onPress={() => setSelectedPack('custom')}
                activeOpacity={0.85}
                disabled={paying}
              >
                {customSelected ? (
                  <View style={styles.checkBadge}>
                    <Text style={styles.checkBadgeText}>✓</Text>
                  </View>
                ) : null}
                <Text style={styles.customPlus}>+</Text>
                <Text style={styles.customTitle}>Custom</Text>
                <Text style={styles.customSub}>up to {MAX_QUESTIONS}</Text>
              </TouchableOpacity>
            </View>

            {customSelected ? (
              <View style={styles.customStepperBox}>
                <Text style={styles.customStepperLabel}>How many questions?</Text>
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => adjustCustom(-1)}
                    disabled={paying || customCount <= 1}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.stepperBtnText}>−</Text>
                  </TouchableOpacity>
                  <View style={styles.stepperValueBox}>
                    <Text style={styles.stepperValue}>{customCount}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => adjustCustom(1)}
                    disabled={paying || customCount >= MAX_QUESTIONS}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>ⓘ</Text>
              <Text style={styles.infoText}>
                Questions are valid during your active plan period and expire when
                it ends.
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <View>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalAmount}>₹{totalAmount}</Text>
            </View>
            <TouchableOpacity
              style={[styles.payBtn, paying && styles.payBtnDisabled]}
              onPress={handlePay}
              disabled={paying}
              activeOpacity={0.85}
            >
              {paying ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.payBtnText}>Pay ₹{totalAmount}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth('5'),
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: responsiveWidth('4.5'),
    paddingTop: responsiveWidth('4.5'),
    paddingBottom: responsiveWidth('4'),
  },
  headerImage: {
    resizeMode: 'cover',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: responsiveWidth('3.5'),
  },
  headerTitles: {
    flex: 1,
    paddingRight: 12,
  },
  headerEyebrow: {
    color: GOLD,
    fontSize: 10,
    fontFamily: fontFamily.medium,
    letterSpacing: 1,
    marginBottom: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: fontFamily.bold,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fontFamily.medium,
  },
  balanceBar: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontFamily: fontFamily.medium,
    letterSpacing: 0.6,
  },
  balanceValue: {
    color: GOLD,
    fontSize: 14,
    fontFamily: fontFamily.medium,
  },
  balanceValueNumber: {
    color: GOLD,
    fontFamily: fontFamily.bold,
    fontSize: 16,
  },
  body: {
    paddingHorizontal: responsiveWidth('4.5'),
    paddingTop: responsiveWidth('4'),
    paddingBottom: responsiveWidth('2'),
    backgroundColor: '#FFFFFF',
  },
  instruction: {
    color: '#8B95A8',
    fontSize: 13,
    fontFamily: fontFamily.regular,
    marginBottom: responsiveWidth('3.5'),
  },
  packsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  packCard: {
    width: '30.5%',
    minHeight: 78,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customPackCard: {
    width: '47%',
  },
  packCardSelected: {
    borderColor: GOLD,
    borderWidth: 2,
    backgroundColor: '#FFFBF5',
  },
  popularBadge: {
    position: 'absolute',
    top: -9,
    alignSelf: 'center',
    backgroundColor: GOLD,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: fontFamily.bold,
    letterSpacing: 0.4,
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: fontFamily.bold,
  },
  packCount: {
    color: NAVY,
    fontSize: 16,
    fontFamily: fontFamily.bold,
    textAlign: 'center',
  },
  packCountLabel: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: '#6B7280',
  },
  packPrice: {
    marginTop: 4,
    color: '#6B7280',
    fontSize: 12,
    fontFamily: fontFamily.medium,
  },
  customPlus: {
    color: GOLD,
    fontSize: 18,
    fontFamily: fontFamily.bold,
    lineHeight: 20,
  },
  customTitle: {
    color: NAVY,
    fontSize: 15,
    fontFamily: fontFamily.bold,
  },
  customSub: {
    color: '#6B7280',
    fontSize: 11,
    fontFamily: fontFamily.regular,
  },
  customStepperBox: {
    marginTop: 14,
    backgroundColor: '#F5F6F8',
    borderRadius: 12,
    padding: 14,
  },
  customStepperLabel: {
    color: NAVY,
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    marginBottom: 10,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    color: NAVY,
    fontSize: 22,
    fontFamily: fontFamily.medium,
    lineHeight: 24,
  },
  stepperValueBox: {
    minWidth: 72,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    color: NAVY,
    fontSize: 18,
    fontFamily: fontFamily.bold,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 14,
  },
  infoIcon: {
    color: GOLD,
    fontSize: 14,
    marginTop: Platform.OS === 'ios' ? 1 : 0,
  },
  infoText: {
    flex: 1,
    color: '#8B95A8',
    fontSize: 12,
    fontFamily: fontFamily.regular,
    lineHeight: 17,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: responsiveWidth('4.5'),
    paddingVertical: responsiveWidth('4'),
    borderTopWidth: 1,
    borderTopColor: '#F0F1F3',
    backgroundColor: '#FFFFFF',
  },
  totalLabel: {
    color: '#8B95A8',
    fontSize: 11,
    fontFamily: fontFamily.medium,
    letterSpacing: 0.5,
  },
  totalAmount: {
    color: NAVY,
    fontSize: 24,
    fontFamily: fontFamily.bold,
    marginTop: 2,
  },
  payBtn: {
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnDisabled: {
    opacity: 0.7,
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
  },
});

export default BuyQuestionsModal;
