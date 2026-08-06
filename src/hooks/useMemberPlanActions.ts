import { useCallback, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RazorpayCheckout from 'react-native-razorpay';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import {
  useIAP,
  ErrorCode,
  type PurchaseError,
  clearTransactionIOS,
  deepLinkToSubscriptions,
  getAvailablePurchases as getAvailablePurchasesNative,
  fetchProducts as fetchStoreKitProducts,
} from 'react-native-iap';
import type { Purchase } from 'react-native-iap';
import planService from '../services/plan/plan.service';
import { subscriptionApi } from '../api/subscriptionApi';
import serviceFactory from '../services/serviceFactory';
import PaymentService from '../services/payment/payment.service';
import { getPlanIdForPlatform, getIapProductId, type PlanType } from '../constant/subscriptionPlans';
import { RootState } from '../state/store';
import {
  getRazorpaySubscriptionPaymentFields,
  getRazorpayUpiEnabledFields,
  withUpiPrefill,
} from '../utils/razorpayUpiOptions';

type FamilyPlanAction = 'assign' | 'purchase' | 'upgrade' | 'no_slots';

type PurchaseSubscriptionResult = {
  success: boolean;
  message: string;
  purchase?: Purchase;
  code?: string;
  requestedProductId?: string;
  receivedProductId?: string;
  isPendingUpgrade?: boolean;
  pendingUpgradeProductId?: string;
};

type Options = {
  refreshProfileData?: () => Promise<void> | void;
  onAfterPurchase?: () => void;
  onAfterAssign?: () => void;
};

export function useMemberPlanActions({
  refreshProfileData,
  onAfterPurchase,
  onAfterAssign,
}: Options = {}) {
  const user = useSelector((state: RootState) => state.app.user);
  const paymentService = serviceFactory.get<PaymentService>('PaymentService');
  const [creatingSubscription, setCreatingSubscription] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [_pendingIosUpgrade, setPendingIosUpgrade] = useState<{
    sku: string;
    planType: PlanType;
    planId: string;
    userId: string;
    memberUserId: string;
  } | null>(null);

  const IOS_INDIVIDUAL_PRODUCT_ID = 'com.astroself.subscription.individual_annual';
  const IOS_FAMILY_PRODUCT_ID = 'com.astroself.subscription.family_annual';
  const pendingPurchaseResolveRef = useRef<((value: PurchaseSubscriptionResult) => void) | null>(null);
  const pendingPurchaseRejectRef = useRef<((reason?: any) => void) | null>(null);
  const pendingPurchaseSkuRef = useRef<string | null>(null);
  const pendingPurchaseStartedAtRef = useRef<number>(0);

  const {
    connected,
    requestPurchase: requestIapPurchase,
    finishTransaction: finishIapTransaction,
  } = useIAP({
    onPurchaseSuccess: (purchase: Purchase) => {
      const resolve = pendingPurchaseResolveRef.current;
      if (!resolve) return;

      const requestedSku = String(pendingPurchaseSkuRef.current || '');
      const pid = String((purchase as any)?.productId || '');
      const txDate = Number((purchase as any)?.transactionDate || 0);
      const startedAtMs = pendingPurchaseStartedAtRef.current || 0;

      if (
        Number.isFinite(txDate) &&
        txDate > 0 &&
        startedAtMs > 0 &&
        txDate < startedAtMs - 2 * 60 * 1000
      ) {
        return;
      }

      if (!IOS_KNOWN_PRODUCT_IDS.includes(pid as (typeof IOS_KNOWN_PRODUCT_IDS)[number])) {
        return;
      }

      const pendingUpgradeProductId = String(
        (purchase as any)?.renewalInfoIOS?.pendingUpgradeProductId ||
          (purchase as any)?.renewalInfoIOS?.autoRenewPreference ||
          '',
      );
      const isFamilyRequested = requestedSku === IOS_FAMILY_PRODUCT_ID;
      const isPendingUpgrade =
        isFamilyRequested &&
        pid !== IOS_FAMILY_PRODUCT_ID &&
        pendingUpgradeProductId === IOS_FAMILY_PRODUCT_ID;

      if (pid !== requestedSku && !isPendingUpgrade) {
        return;
      }

      pendingPurchaseResolveRef.current = null;
      pendingPurchaseRejectRef.current = null;
      pendingPurchaseSkuRef.current = null;

      resolve({
        success: true,
        message: isPendingUpgrade
          ? 'Upgrade pending in App Store'
          : 'Subscription purchase completed successfully',
        purchase,
        requestedProductId: requestedSku,
        receivedProductId: pid,
        isPendingUpgrade,
        pendingUpgradeProductId: pendingUpgradeProductId || undefined,
      });
    },
    onPurchaseError: (error: PurchaseError) => {
      const resolve = pendingPurchaseResolveRef.current;
      const reject = pendingPurchaseRejectRef.current;
      if (!resolve && !reject) return;

      const code = String((error as any)?.code || '').toLowerCase();
      const message = String((error as any)?.message || '');
      const lowerMessage = message.toLowerCase();
      const isCancelled =
        code.includes('cancel') ||
        code === String(ErrorCode.UserCancelled).toLowerCase() ||
        lowerMessage.includes('cancel');
      const isAlreadyOwned =
        code === 'already-owned' ||
        code.includes('already') ||
        code.includes('owned') ||
        lowerMessage.includes('already subscribed') ||
        lowerMessage.includes('already purchased');

      pendingPurchaseResolveRef.current = null;
      pendingPurchaseRejectRef.current = null;
      pendingPurchaseSkuRef.current = null;

      if (resolve && isCancelled) {
        resolve({ success: false, code, message: 'Purchase cancelled by user' });
        return;
      }
      if (resolve && isAlreadyOwned) {
        resolve({ success: true, code, message: 'Item already owned' });
        return;
      }
      if (reject) reject(error);
    },
  });
  const IOS_KNOWN_PRODUCT_IDS = useMemo(
    () => [IOS_INDIVIDUAL_PRODUCT_ID, IOS_FAMILY_PRODUCT_ID] as const,
    [],
  );

  const withTimeout = useCallback(async <T,>(promise: Promise<T>, ms: number): Promise<T> => {
    return (await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error('timeout')), ms);
      }),
    ])) as T;
  }, []);

  const getPurchaseReceipt = useCallback((purchase: any): string => {
    return String(
      purchase?.purchaseToken ||
      purchase?.transactionReceipt ||
      purchase?.originalJson ||
      purchase?.dataAndroid ||
      '',
    );
  }, []);

  const getPurchaseDateValue = useCallback((purchase: any): number => {
    const raw =
      purchase?.transactionDate ||
      purchase?.purchaseTime ||
      purchase?.originalPurchaseDateIOS ||
      purchase?.purchaseDate;

    if (typeof raw === 'number') {
      return raw;
    }

    if (typeof raw === 'string') {
      const asNumber = Number(raw);
      if (!Number.isNaN(asNumber) && asNumber > 0) {
        return asNumber;
      }
      const asDate = new Date(raw).getTime();
      return Number.isNaN(asDate) ? 0 : asDate;
    }

    return 0;
  }, []);

  const getLatestKnownIosPurchase = useCallback((purchases: any[]): Purchase | null => {
    const filtered = (purchases || []).filter((purchase: any) =>
      IOS_KNOWN_PRODUCT_IDS.includes(purchase?.productId),
    );

    if (!filtered.length) {
      return null;
    }

    filtered.sort(
      (a: any, b: any) => getPurchaseDateValue(b) - getPurchaseDateValue(a),
    );

    return filtered[0] as Purchase;
  }, [getPurchaseDateValue, IOS_KNOWN_PRODUCT_IDS]);

  const verifyExistingIosSubscription = useCallback(
    async ({
      purchases,
      preferredProductId,
      userId,
      memberUserId,
      fallbackPlanId,
    }: {
      purchases: any[];
      preferredProductId?: string;
      userId: string;
      memberUserId: string;
      fallbackPlanId: string;
    }): Promise<{ success: boolean; productId?: string; message?: string }> => {
      const sortedPurchases = [...(purchases || [])].sort(
        (a: any, b: any) => getPurchaseDateValue(b) - getPurchaseDateValue(a),
      );

      const matchingPurchase =
        (preferredProductId
          ? sortedPurchases.find((purchase: any) => purchase?.productId === preferredProductId)
          : undefined) || getLatestKnownIosPurchase(sortedPurchases);

      if (!matchingPurchase) {
        return { success: false, message: 'No existing subscription found on this Apple ID' };
      }

      const productId = String((matchingPurchase as any)?.productId || '');
      const receipt = getPurchaseReceipt(matchingPurchase);

      if (!receipt) {
        return { success: false, message: 'Receipt not found for existing subscription' };
      }

      const verifyResponse = await paymentService.verifySubscriptionIAP({
        user_id: userId,
        member_user_id: memberUserId,
        plan_id:
          productId === IOS_FAMILY_PRODUCT_ID
            ? getPlanIdForPlatform('family')
            : fallbackPlanId,
        receipt,
        transaction_id: String((matchingPurchase as any)?.transactionId || ''),
        product_id: productId,
        plan_type:
          productId === IOS_FAMILY_PRODUCT_ID ? 'family_plan' : 'eternal_path',
        currency: 'INR',
      });

      const isSuccess =
        (verifyResponse as any)?.success === true ||
        (verifyResponse as any)?.status === true ||
        (verifyResponse as any)?.status === 'success' ||
        String((verifyResponse as any)?.success) === 'true' ||
        String((verifyResponse as any)?.status) === 'true';

      return {
        success: isSuccess,
        productId,
        message: (verifyResponse as any)?.message,
      };
    },
    [getLatestKnownIosPurchase, getPurchaseDateValue, getPurchaseReceipt, paymentService],
  );

  const finishIosTransactionSafely = useCallback(
    async (purchase?: Purchase | null) => {
      if (!purchase) {
        return;
      }

      try {
        await withTimeout(
          finishIapTransaction({ purchase, isConsumable: false }),
          5000,
        );
      } catch (finishError) {
        console.log('finishTransaction ignored error:', finishError);
      }

      try {
        await withTimeout(clearTransactionIOS(), 5000);
      } catch (clearError) {
        console.log('clearTransactionIOS ignored error:', clearError);
      }
    },
    [withTimeout, finishIapTransaction],
  );

  const openIosSubscriptionManagement = useCallback(
    async (message?: string) => {
      try {
        await deepLinkToSubscriptions();
      } catch (linkError) {
        console.log('deepLinkToSubscriptions error:', linkError);
      }

      if (message) {
        Toast.show({
          type: 'info',
          text1: 'Manage Subscription',
          text2: message,
          position: 'top',
          topOffset: 60,
          visibilityTime: 3000,
        });
      }
    },
    [],
  );

  const getIosProductsForPlan = useCallback(async (iapProductId: string) => {
    console.log('iapProductId------1378', iapProductId);
    // useIAP().fetchProducts returns void and only updates hook state; use the
    // module-level API when we need the loaded products array.
    return await fetchStoreKitProducts({
      skus: [iapProductId],
      type: 'subs',
    });
  }, []);

  // Helper: iOS IAP subscription purchase
  const purchaseSubscriptionViaIAP = async (
    productId: string,
  ): Promise<PurchaseSubscriptionResult> => {
    return new Promise((resolve, reject) => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      pendingPurchaseResolveRef.current = (result) => {
        if (timeoutId) clearTimeout(timeoutId);
        resolve(result);
      };
      pendingPurchaseRejectRef.current = (err) => {
        if (timeoutId) clearTimeout(timeoutId);
        reject(err);
      };
      pendingPurchaseSkuRef.current = productId;
      pendingPurchaseStartedAtRef.current = Date.now();

      timeoutId = setTimeout(() => {
        const pendingResolve = pendingPurchaseResolveRef.current;
        pendingPurchaseResolveRef.current = null;
        pendingPurchaseRejectRef.current = null;
        pendingPurchaseSkuRef.current = null;
        if (pendingResolve) {
          pendingResolve({
            success: false,
            code: 'timeout',
            message: 'Purchase is taking longer than expected',
            requestedProductId: String(productId),
          });
        }
      }, 45000);

      requestIapPurchase({
        request: { ios: { sku: productId } },
        type: 'subs',
      }).catch((err) => {
        const pendingReject = pendingPurchaseRejectRef.current;
        pendingPurchaseResolveRef.current = null;
        pendingPurchaseRejectRef.current = null;
        pendingPurchaseSkuRef.current = null;
        if (timeoutId) clearTimeout(timeoutId);
        if (pendingReject) pendingReject(err);
      });
    });
  };

  const runPurchase = async (member: any, planType: PlanType) => {
    if (!member || !user) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Member or user information not found',
        position: 'top',
        topOffset: 60,
        visibilityTime: 3000,
      });
      return;
    }

    const planTypeResolved = planType;
    const planId = getPlanIdForPlatform(planTypeResolved);
    const userId = user?._id || (user as any)?.id || '';
    const memberUserId =
      member.id ||
      member._id ||
      '';

    let verifiedThisAttempt = false;

    try {
      setCreatingSubscription(true);

      // ---------- iOS: StoreKit IAP flow ----------
      if (Platform.OS === 'ios') {
        console.log('planType------', planType);
        const iapProductId = getIapProductId(planType);

        console.log('productId------1492', iapProductId);

        if (!iapProductId) {
          throw new Error('Subscription not available on this device');
        }

        if (!connected) {
          throw new Error('IAP connection is not ready yet. Please try again.');
        }
        try {
          await clearTransactionIOS();
        } catch (clearError) {
          console.log('initial clearTransactionIOS ignored error:', clearError);
        }

          const owned = await withTimeout(getAvailablePurchasesNative(), 5000).catch(() => []);
          const hasIndividual = owned.some(
            (purchase: any) => purchase?.productId === IOS_INDIVIDUAL_PRODUCT_ID,
          );
          const hasFamily = owned.some(
            (purchase: any) => purchase?.productId === IOS_FAMILY_PRODUCT_ID,
          );

          if (planTypeResolved === 'individual' && hasIndividual) {
            const verifyExisting = await verifyExistingIosSubscription({
              purchases: owned,
              preferredProductId: IOS_INDIVIDUAL_PRODUCT_ID,
              userId,
              memberUserId,
              fallbackPlanId: planId,
            });

            if (verifyExisting.success) {
              verifiedThisAttempt = true;
              onAfterPurchase?.();
              if (refreshProfileData) await refreshProfileData();
              // fetchUserPlanDetails optional;
              Toast.show({
                type: 'success',
                text1: 'Already Active',
                text2: 'Your Individual plan is already active',
                position: 'top',
                topOffset: 60,
                visibilityTime: 2500,
              });
              return;
            }

            await openIosSubscriptionManagement(
              'This Apple ID already has an Individual subscription. Manage it from App Store subscriptions.',
            );
            return;
          }

          if (planTypeResolved === 'family' && hasFamily) {
            const verifyExisting = await verifyExistingIosSubscription({
              purchases: owned,
              preferredProductId: IOS_FAMILY_PRODUCT_ID,
              userId,
              memberUserId,
              fallbackPlanId: getPlanIdForPlatform('family'),
            });

            if (verifyExisting.success) {
              verifiedThisAttempt = true;
              onAfterPurchase?.();
              if (refreshProfileData) await refreshProfileData();
              // fetchUserPlanDetails optional;
              Toast.show({
                type: 'success',
                text1: 'Already Active',
                text2: 'Your Family plan is already active',
                position: 'top',
                topOffset: 60,
                visibilityTime: 2500,
              });
              return;
            }
          }

          if (planTypeResolved === 'family' && hasIndividual && !hasFamily) {
            // Don't force-open the App Store subscriptions screen here; requestPurchase will
            // show Apple's upgrade UI. If Apple still keeps the user on Individual, we'll
            // guide them to manage subscriptions after the purchase callback.
            setPendingIosUpgrade({
              sku: IOS_FAMILY_PRODUCT_ID,
              planType: 'family',
              planId,
              userId,
              memberUserId,
            });
            Toast.show({
              type: 'info',
              text1: 'Upgrade to Family',
              text2: 'Apple will ask you to confirm the upgrade.',
              position: 'top',
              topOffset: 60,
              visibilityTime: 2500,
            });
          }
          console.log('iapProductId------1592', iapProductId);

          const products = await getIosProductsForPlan(iapProductId);
          console.log('iapProductId------1595', iapProductId);
          console.log('products------', products);

          if (!products || products.length === 0) {
            throw new Error('Subscription not available. Please try again later.');
          }

          let purchase: Purchase | null = null;
          let purchaseCode: string | undefined;
          let purchaseMessage = '';

          try {
            console.log('iapProductId------1607', iapProductId);
            const purchaseResult = await purchaseSubscriptionViaIAP(iapProductId);
            console.log('purchaseResult------', purchaseResult);

            // Also log the latest known Apple subscription after this attempt.
            const ownedAfter = await withTimeout(getAvailablePurchasesNative(), 5000).catch(() => []);
            const latestAfter = getLatestKnownIosPurchase(ownedAfter);
            console.log('currentAppleSubscription------', latestAfter);

            purchase = purchaseResult.purchase || null;
            purchaseCode = purchaseResult.code;
            purchaseMessage = purchaseResult.message || '';
          } catch (listenerError) {
            console.log('purchaseSubscriptionViaIAP error------', listenerError);
            purchase = null;
          }

          if (!purchase) {
            const messageLower = purchaseMessage.toLowerCase();
            const codeLower = String(purchaseCode || '').toLowerCase();
            const isCancelled =
              messageLower.includes('cancel') || codeLower.includes('cancel');
            const isAlreadyOwned =
              messageLower.includes('owned') || codeLower.includes('own');
            const isTimeout =
              messageLower.includes('timeout') || codeLower.includes('timeout');

            if (isCancelled) {
              Toast.show({
                type: 'info',
                text1: 'Payment Cancelled',
                text2: 'You can try again later',
                position: 'top',
                topOffset: 60,
                visibilityTime: 2500,
              });
              return;
            }

            if (isAlreadyOwned || isTimeout) {
              const latestOwned = await withTimeout(getAvailablePurchasesNative(), 5000).catch(() => []);
              const verifyExisting = await verifyExistingIosSubscription({
                purchases: latestOwned,
                preferredProductId:
                  planTypeResolved === 'family'
                    ? IOS_FAMILY_PRODUCT_ID
                    : IOS_INDIVIDUAL_PRODUCT_ID,
                userId,
                memberUserId,
                fallbackPlanId:
                  planTypeResolved === 'family'
                    ? getPlanIdForPlatform('family')
                    : getPlanIdForPlatform('individual'),
              });

              if (verifyExisting.success) {
                verifiedThisAttempt = true;
                onAfterPurchase?.();
                if (refreshProfileData) await refreshProfileData();
                // fetchUserPlanDetails optional;
                Toast.show({
                  type: 'success',
                  text1: 'Subscription Active',
                  text2:
                    planTypeResolved === 'family'
                      ? 'Your Family subscription has been activated'
                      : 'Your Individual subscription has been activated',
                  position: 'top',
                  topOffset: 60,
                  visibilityTime: 3000,
                });
                return;
              }

              if (planTypeResolved === 'family') {
                await openIosSubscriptionManagement(
                  'Family upgrade was not completed by Apple. Please confirm the upgrade in App Store subscriptions and try again.',
                );
                return;
              }

              await openIosSubscriptionManagement(
                'This subscription already exists on your Apple ID. Please manage it in App Store subscriptions.',
              );
              return;
            }

            throw new Error('Purchase not received. Please try again.');
          }

          const normalizedPurchase: Purchase =
            (purchase as any)?.purchase != null
              ? (purchase as any).purchase
              : purchase;

          console.log('purchase------', normalizedPurchase);

          const receivedSku = String((normalizedPurchase as any)?.productId || '');
          const receipt = getPurchaseReceipt(normalizedPurchase);

          if (!receipt) {
            throw new Error('Receipt not found for this purchase');
          }

          let purchaseForVerify: Purchase = normalizedPurchase;
          let productIdForVerify = receivedSku || iapProductId;

          if (planTypeResolved === 'family' && productIdForVerify !== IOS_FAMILY_PRODUCT_ID) {
            const latestOwned = await withTimeout(getAvailablePurchasesNative(), 5000).catch(() => []);
            const matchingFamilyPurchase = [...latestOwned]
              .filter((item: any) => item?.productId === IOS_FAMILY_PRODUCT_ID)
              .sort((a: any, b: any) => getPurchaseDateValue(b) - getPurchaseDateValue(a))[0] as Purchase | undefined;

            if (matchingFamilyPurchase) {
              purchaseForVerify = matchingFamilyPurchase;
              productIdForVerify = IOS_FAMILY_PRODUCT_ID;
            } else {
              await finishIosTransactionSafely(normalizedPurchase);
              await openIosSubscriptionManagement(
                'Apple returned your existing Individual subscription instead of the Family upgrade. Please confirm the Family upgrade in App Store subscriptions and try again.',
              );
              return;
            }
          }

          const receiptForVerify = getPurchaseReceipt(purchaseForVerify);
          if (!receiptForVerify) {
            throw new Error('Receipt not found for this purchase');
          }

          const resolvedPlanType =
            productIdForVerify === IOS_FAMILY_PRODUCT_ID
              ? 'family_plan'
              : 'eternal_path';
          const resolvedPlanId =
            productIdForVerify === IOS_FAMILY_PRODUCT_ID
              ? getPlanIdForPlatform('family')
              : getPlanIdForPlatform('individual');

          const verifyResponse = await paymentService.verifySubscriptionIAP({
            user_id: userId,
            member_user_id: memberUserId,
            plan_id: resolvedPlanId,
            receipt: receiptForVerify,
            transaction_id: String((purchaseForVerify as any)?.transactionId || ''),
            product_id: productIdForVerify,
            plan_type: resolvedPlanType,
            currency: 'INR',
          });

          console.log('verifyResponse------', verifyResponse);

          const isSuccess =
            (verifyResponse as any)?.success === true ||
            (verifyResponse as any)?.status === true ||
            verifyResponse?.status === 'success' ||
            String((verifyResponse as any)?.success) === 'true' ||
            String((verifyResponse as any)?.status) === 'true';

          if (isSuccess) {
            verifiedThisAttempt = true;
            await finishIosTransactionSafely(normalizedPurchase);
            onAfterPurchase?.();
            if (refreshProfileData) await refreshProfileData();
            // fetchUserPlanDetails optional;
            Toast.show({
              type: 'success',
              text1: 'Payment Successful',
              text2:
                resolvedPlanType === 'family_plan'
                  ? 'Your Family subscription has been activated'
                  : 'Your Individual subscription has been activated',
              position: 'top',
              topOffset: 60,
              visibilityTime: 3000,
            });
          } else {
            throw new Error(
              (verifyResponse as any)?.message || 'Payment verification failed',
            );
          }
        return;
      }

      // ---------- Android: Razorpay flow (unchanged) ----------

      console.log('creating subscription------',);
      console.log('planId------', planId);
      console.log('userId------', userId);
      console.log('memberUserId------', memberUserId);
      console.log('planType------', planType);
      console.log('member------', member);
      const subscriptionResponse = await subscriptionApi.createAutopaySubscription({
        plan_id: planId,
        user_id: userId,
        member_user_id: memberUserId,
        plan_type: planTypeResolved === 'family' ? 'family_plan' : 'eternal_path',
      });

      console.log('subscriptionResponse------', subscriptionResponse);

      if (!subscriptionResponse.subscription_id) {
        throw new Error('Subscription ID not received from server');
      }

      if (!subscriptionResponse.razorpay_key) {
        throw new Error('Razorpay key not received from server');
      }

      // Get user data for prefill
      const userDataString = await AsyncStorage.getItem('USER_DATA');
      let currentUserData: any = {};
      if (userDataString) {
        currentUserData = JSON.parse(String(userDataString));
      }

      // Close the premium modal before opening Razorpay
      onAfterPurchase?.();

      // Razorpay payment options for subscription
      const options = {
        key: String(subscriptionResponse.razorpay_key),
        subscription_id: subscriptionResponse.subscription_id,
        name: 'Astrodha',
        description: 'Premium Plan Subscription - Astrodha',
        currency: 'INR',
        ...getRazorpaySubscriptionPaymentFields(),
        prefill: withUpiPrefill({
          email:
            currentUserData.email || (user as any)?.email || 'user@example.com',
          contact:
            currentUserData.phone || (user as any)?.phone || '9999999999',
          name:
            `${currentUserData.first_name || (user as any)?.first_name || ''} ${currentUserData.last_name || (user as any)?.last_name || ''
              }`.trim() || 'User',
        }),
        notes: {
          source: 'react_native',
          user_id: userId,
          member_user_id: memberUserId,
          plan_id: planId,
        },
        // theme: { color: '#DF8A5D' },
      };

      try {
        // Open Razorpay checkout modal (Android only)
        console.log('Razorpay options:', options);
        const paymentData = await RazorpayCheckout.open(options);

        console.log('Payment response:', paymentData);

        // Payment successful
        if (paymentData) {
          Toast.show({
            type: 'success',
            text1: 'Payment Successful',
            text2: 'Your premium subscription has been activated',
            position: 'top',
            topOffset: 60,
            visibilityTime: 3000,
          });
        }

        if (refreshProfileData) {
          await refreshProfileData();
        }
      } catch (razorpayError: any) {
        console.error('Razorpay error:', razorpayError);

        // Check if it's a cancellation
        const isCancelled =
          razorpayError?.code === 'BAD_REQUEST_ERROR' ||
          razorpayError?.code === 'NETWORK_ERROR' ||
          razorpayError?.description?.toLowerCase().includes('cancelled') ||
          razorpayError?.reason?.toLowerCase().includes('cancelled') ||
          razorpayError?.step === 'payment_cancelled';

        if (isCancelled) {
          // User cancelled, don't show error
          console.log('Payment cancelled by user');
          Toast.show({
            type: 'info',
            text1: 'Payment Cancelled',
            text2: 'You can try again later',
            position: 'top',
            topOffset: 60,
            visibilityTime: 2000,
          });
        } else {
          // Show error for other cases
          Toast.show({
            type: 'error',
            text1: 'Payment Error',
            text2:
              razorpayError?.description ||
              razorpayError?.message ||
              'Payment failed. Please try again.',
            position: 'top',
            topOffset: 60,
            visibilityTime: 3000,
          });
        }
      }
    } catch (subscriptionError: any) {
      if (verifiedThisAttempt) {
        // If we already verified successfully, ignore any late iOS errors
        // (e.g. already-owned / duplicate callbacks).
        console.log('Ignoring post-verify error:', subscriptionError?.message);
        return;
      }
      console.error('Error creating subscription:', subscriptionError);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: subscriptionError.message || 'Failed to create subscription',
        position: 'top',
        topOffset: 60,
        visibilityTime: 3000,
      });
    } finally {
      setCreatingSubscription(false);
    }
  };

  const runFamilyUpgrade = async (member: any) => {
    if (Platform.OS !== 'android') {
      // iOS must not use Razorpay; upgrade happens via iOS subscription purchase
      await runPurchase(member, 'family');
      return;
    }

    const uid = user?._id || (user as any)?.id || '';
    const memberUserId = member?.id || member?._id || '';
    const familyPlanId = getPlanIdForPlatform('family');

    if (!uid || !memberUserId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'User or member not found',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    try {
      setCreatingSubscription(true);

      console.log('initiating upgrade------');
      const initRes = await subscriptionApi.upgradeInitiate({
        user_id: uid,
        member_user_id: memberUserId,
        family_plan_id: familyPlanId,
      });

      console.log('initRes------', initRes);

      const userDataString = await AsyncStorage.getItem('USER_DATA');
      const currentUserData: any = userDataString ? JSON.parse(userDataString) : {};

      // Backend returns: razorpay_order_id, amount_paise, currency
      const orderId =
        (initRes as any)?.razorpay_order_id ||
        (initRes as any)?.order_id ||
        (initRes as any)?.data?.razorpay_order_id ||
        (initRes as any)?.data?.order_id;
      const amountPaise =
        (initRes as any)?.amount_paise ||
        (initRes as any)?.amount ||
        (initRes as any)?.data?.amount_paise ||
        (initRes as any)?.data?.amount;
      const currency =
        (initRes as any)?.currency || (initRes as any)?.data?.currency || 'INR';

      // Upgrade initiate may not return key; use stored/app key
      const key =
        (initRes as any)?.razorpay_key ||
        (initRes as any)?.data?.razorpay_key ||
        currentUserData?.razorpay_key ||
        'rzp_test_Rueu06YDULsQCD';

      if (!orderId || !amountPaise || !key) {
        throw new Error((initRes as any)?.message || 'Upgrade initiate failed');
      }

      const options = {
        key,
        order_id: orderId,
        amount: Number(amountPaise),
        currency,
        
        name: 'Astrodha',
        description: 'Upgrade to Family Plan',
        ...getRazorpayUpiEnabledFields(),
        prefill: withUpiPrefill({
          email:
            currentUserData.email || (user as any)?.email || 'user@example.com',
          contact:
            currentUserData.phone || (user as any)?.phone || '9999999999',
          name:
            `${currentUserData.first_name || (user as any)?.first_name || ''} ${currentUserData.last_name || (user as any)?.last_name || ''
              }`.trim() || 'User',
        }),
        theme: { color: '#DF8A5D' },
      };

      const payRes: any = await RazorpayCheckout.open(options as any);
      console.log('payRes------', payRes);

      const confirmRes = await subscriptionApi.upgradeConfirm({
        razorpay_order_id: payRes.razorpay_order_id,
        razorpay_payment_id: payRes.razorpay_payment_id,
        razorpay_signature: payRes.razorpay_signature,
      });
      console.log('confirmRes------', confirmRes);

      const ok =
        (confirmRes as any)?.success === true ||
        (confirmRes as any)?.status === 'success' ||
        (confirmRes as any)?.status === 'completed' ||
        String((confirmRes as any)?.success) === 'true';

      if (!ok) throw new Error((confirmRes as any)?.message || 'Upgrade failed');

      Toast.show({
        type: 'success',
        text1: 'Upgrade Successful',
        text2: (confirmRes as any)?.message || 'Family plan has been activated',
        position: 'top',
        topOffset: 60,
      });

      onAfterPurchase?.();
      if (refreshProfileData) await refreshProfileData();
    } catch (e: any) {
      const msg = e?.description || e?.message || 'Upgrade cancelled';
      const isCancel = String(msg).toLowerCase().includes('cancel');
      Toast.show({
        type: isCancel ? 'info' : 'error',
        text1: isCancel ? 'Cancelled' : 'Error',
        text2: isCancel ? 'Upgrade cancelled' : msg,
        position: 'top',
        topOffset: 60,
      });
    } finally {
      setCreatingSubscription(false);
    }
  };

  const runAssignFamily = async (member: any) => {
    if (!member || !user) return;

    const userId = user._id || (user as any).id;
    const birthInputId =
      member.birth_input_id ||
      member.id ||
      member._id;

    if (!birthInputId) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Member ID not found', position: 'top', topOffset: 60 });
      return;
    }

    try {
      setIsAssigning(true);
      const res = await planService.assignFamilyPlan(userId, birthInputId);

      console.log('res------', res);

      if (res.success) {
        Toast.show({
          type: 'success',
          text1: 'Plan Assigned',
          text2: 'Family plan assigned successfully',
          position: 'top',
          topOffset: 60,
        });
        onAfterAssign?.();
        ;
        if (refreshProfileData) await refreshProfileData();
      } else {
        const msg = res.message || 'Assign failed';
        const isAlreadyHad = msg.toLowerCase().includes('already had a plan') || msg.toLowerCase().includes('already had');
        Toast.show({
          type: isAlreadyHad ? 'info' : 'error',
          text1: isAlreadyHad ? 'Already Assigned' : 'Unable to Assign',
          text2: isAlreadyHad ? 'This member already has a plan' : msg,
          position: 'top',
          topOffset: 60,
        });
        onAfterAssign?.();
        ;
        if (refreshProfileData) await refreshProfileData();
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to assign plan';
      const isAlreadyHad = msg.toLowerCase().includes('already had');
      Toast.show({
        type: isAlreadyHad ? 'info' : 'error',
        text1: isAlreadyHad ? 'Already Assigned' : 'Error',
        text2: msg,
        position: 'top',
        topOffset: 60,
      });
      onAfterAssign?.();
      if (refreshProfileData) await refreshProfileData();
    } finally {
      setIsAssigning(false);
    }
  };

  const resolveFamilyPlanAction = useCallback(
    async (member: any): Promise<FamilyPlanAction> => {
      const uid = user?._id || (user as any)?.id || '';
      if (!uid || !member) return 'purchase';
      const details = await planService.getUserPlanDetails(uid);
      if (details.current_plan === 'family_plan') {
        if (Number(details.available_members_allow) <= 0) return 'no_slots';
        return 'assign';
      }
      if (details.current_plan === 'eternal_path') {
        return Platform.OS === 'android' ? 'upgrade' : 'purchase';
      }
      return 'purchase';
    },
    [user],
  );

  const purchaseForMember = useCallback(
    async (member: any, planType: PlanType) => runPurchase(member, planType),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, connected],
  );

  const assignFamilyToMember = useCallback(
    async (member: any) => runAssignFamily(member),
  // eslint-disable-next-line react-hooks/exhaustive-deps
    [user],
  );

  const handleFamilyPlanForMember = useCallback(
    async (member: any) => {
      const action = await resolveFamilyPlanAction(member);
      if (action === 'no_slots') {
        Toast.show({
          type: 'info',
          text1: 'No Slots Available',
          text2: 'All family plan slots are already assigned.',
          position: 'top',
          topOffset: 60,
        });
        return;
      }
      if (action === 'assign') {
        await runAssignFamily(member);
        return;
      }
      if (action === 'upgrade') {
        await runFamilyUpgrade(member);
        return;
      }
      await runPurchase(member, 'family');
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, connected],
  );

  const upgradeFamilyForMember = useCallback(
    async (member: any) => runFamilyUpgrade(member),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user],
  );

  return {
    creatingSubscription,
    isAssigning,
    purchaseForMember,
    assignFamilyToMember,
    upgradeFamilyForMember,
    handleFamilyPlanForMember,
    resolveFamilyPlanAction,
  };
}
