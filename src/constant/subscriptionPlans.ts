import { Platform } from 'react-native';

/**
 * Backend plan IDs - used for Razorpay (Android) and subscription verification
 * Each plan must exist in backend/Razorpay with the correct amount
 */
export const SUBSCRIPTION_PLAN_IDS = {
  /** Individual Annual - ₹999/year */
  INDIVIDUAL: 'd461266c-574b-4312-994a-ebd2b5cf6dc3',
  /** Family Annual - ₹2499/year - use same as individual until backend has separate ID */
  FAMILY: 'd461266c-574b-4312-994a-ebd2b5cf6dc3',
} as const;

/**
 * iOS StoreKit product IDs - must match App Store Connect
 * Create these in App Store Connect and configure here
 */
export const IAP_SUBSCRIPTION_PRODUCT_IDS = {
  INDIVIDUAL_ANNUAL: 'com.astroself.subscription.individual_annual',
  FAMILY_ANNUAL: 'com.astroself.subscription.family_annual',
} as const;

export type PlanType = 'individual' | 'family' | 'eternal_path' | 'family_plan';

export const getPlanIdForPlatform = (planType: PlanType): string => {
  if (planType === 'individual') return SUBSCRIPTION_PLAN_IDS.INDIVIDUAL;
  if (planType === 'family') return SUBSCRIPTION_PLAN_IDS.FAMILY;
  if (planType === 'eternal_path') return SUBSCRIPTION_PLAN_IDS.INDIVIDUAL;
  if (planType === 'family_plan') return SUBSCRIPTION_PLAN_IDS.FAMILY;
  return '';
};

export const getIapProductId = (planType: PlanType): string | null => {
  if (Platform.OS !== 'ios') return null;
  if (planType === 'individual') return IAP_SUBSCRIPTION_PRODUCT_IDS.INDIVIDUAL_ANNUAL;
  return IAP_SUBSCRIPTION_PRODUCT_IDS.FAMILY_ANNUAL;
};
