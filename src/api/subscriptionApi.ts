import http from '../utils/http';
import AsyncStorage from '@react-native-async-storage/async-storage';

async function authHeaders() {
  const token = await AsyncStorage.getItem('USER_TOKEN');
  if (!token) throw new Error('No authentication token found');
  return {
    accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export type UserPlanDetailsResponse = {
  current_plan: string;
  members_allow: number;
  available_members_allow: number;
  email: string;
};

export type CreateAutopaySubscriptionRequest = {
  plan_id: string;
  user_id: string;
  member_user_id: string;
  plan_type: 'eternal_path' | 'family_plan';
};

export type AstrologerAutopayPlanType = string;

export type CreateAstrologerAutopaySubscriptionRequest = {
  user_id: string;
  plan_id: string;
  plan_type: AstrologerAutopayPlanType;
};

export type CreateAstrologerAutopaySubscriptionResponse = {
  status?: string | boolean;
  plan_type?: string;
  subscription_id?: string;
  razorpay_key?: string;
  payment_url?: string;
  short_url?: string;
  sub_status?: string;
  message?: string;
};

export type VerifyAutopaySubscriptionRequest = {
  subscription_id: string;
  user_id: string;
};

export type VerifyAstrologerAutopaySubscriptionRequest = {
  subscription_id: string;
  user_id: string;
};

export type VerifyAutopaySubscriptionResponse = {
  status: 'success' | 'pending' | string;
  start_plan?: string;
  end_plan?: string;
  card?: {
    name?: string;
    network?: string;
    last4?: string;
    type?: string;
    issuer?: string;
    international?: boolean;
  };
  verified_at?: string;
  message?: string;
};

export type CreateAutopaySubscriptionResponse = {
  subscription_id?: string;
  razorpay_key?: string;
  short_url?: string;
  payment_url?: string;
  status?: string;
  success?: boolean;
  message?: string;
  data?: any;
};

export type UpgradeInitiateRequest = {
  user_id: string;
  member_user_id: string;
  family_plan_id: string;
};

export type UpgradeInitiateResponse = {
  order_id?: string;
  amount?: number | string;
  currency?: string;
  razorpay_key?: string;
  success?: boolean;
  message?: string;
  data?: any;
};

export type UpgradeConfirmRequest = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type UpgradeConfirmResponse = {
  success?: boolean;
  message?: string;
  status?: string;
  data?: any;
};

export type AstrologerDowngradeInitiateRequest = {
  user_id: string;
  plan_id: string;
  plan_type: string;
  country_code: string;
};

export type AstrologerDowngradeInitiateResponse = {
  status?: boolean | string;
  message?: string;
  subscription_id?: string;
  renewal_subscription_id?: string;
  razorpay_subscription_id?: string;
  razorpay_key?: string;
  payment_url?: string;
  short_url?: string;
  amount?: number | string;
  currency?: string;
  data?: Record<string, unknown>;
};

export type AstrologerDowngradeConfirmRequest = {
  user_id: string;
  renewal_subscription_id: string;
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
};

export type AstrologerDowngradeConfirmResponse = {
  status?: boolean | string;
  success?: boolean;
  message?: string;
  data?: Record<string, unknown>;
};

const pickNestedValue = (
  payload: Record<string, unknown> | undefined,
  keys: string[],
): string => {
  if (!payload) {
    return '';
  }

  for (const key of keys) {
    const value = payload[key];
    if (value != null && String(value).trim()) {
      return String(value).trim();
    }
  }

  const nested =
    payload.data && typeof payload.data === 'object'
      ? (payload.data as Record<string, unknown>)
      : null;

  if (nested) {
    for (const key of keys) {
      const value = nested[key];
      if (value != null && String(value).trim()) {
        return String(value).trim();
      }
    }
  }

  return '';
};

export const subscriptionApi = {
  async getUserPlanDetails(userId: string): Promise<UserPlanDetailsResponse> {
    const headers = await authHeaders();
    const res = await http.get<UserPlanDetailsResponse>(
      `user-plan-details/${userId}`,
      { headers, timeout: 60000 },
    );
    return res.data;
  },

  async createAutopaySubscription(
    payload: CreateAutopaySubscriptionRequest,
  ): Promise<CreateAutopaySubscriptionResponse> {
    const headers = await authHeaders();
    const res = await http.post<CreateAutopaySubscriptionResponse>(
      'mobile/autopay/create-subscription',
      payload,
      { headers, timeout: 60000 },
    );
    return res.data;
  },

  async createAstrologerAutopaySubscription(
    payload: CreateAstrologerAutopaySubscriptionRequest,
  ): Promise<CreateAstrologerAutopaySubscriptionResponse> {
    const headers = await authHeaders();

    console.log('payload---?>', payload);

    
    const res = await http.post<CreateAstrologerAutopaySubscriptionResponse>(
      'astrologer/mobile/autopay/create-subscription',
      payload,
      { headers, timeout: 60000 },
    );
    console.log('res---?>', res.data);
    return res.data;
  },

  async verifyAutopaySubscription(
    payload: VerifyAutopaySubscriptionRequest,
  ): Promise<VerifyAutopaySubscriptionResponse> {
    const headers = await authHeaders();
    const res = await http.post<VerifyAutopaySubscriptionResponse>(
      '/autopay/verify-subscription',
      payload,
      { headers, timeout: 60000 },
    );
    return res.data;
  },

  async verifyAstrologerAutopaySubscription(
    payload: VerifyAstrologerAutopaySubscriptionRequest,
  ): Promise<VerifyAutopaySubscriptionResponse> {
    const headers = await authHeaders();
    try {
      const res = await http.post<VerifyAutopaySubscriptionResponse>(
        '/astrologer/autopay/verify-subscription',
        payload,
        { headers, timeout: 60000 },
      );
      return res.data;
    } catch (error: unknown) {
      const axiosError = error as {
        response?: {
          status?: number;
          data?: { message?: string; status?: string };
        };
        message?: string;
      };
      const status = axiosError.response?.status;
      const data = axiosError.response?.data;

      // Right after Razorpay payment the subscription may not be synced yet.
      if (status === 404) {
        return { status: 'pending' };
      }

      const message =
        (typeof data === 'object' && data?.message) ||
        axiosError.message ||
        'Subscription verification failed';

      throw new Error(message);
    }
  },

  async upgradeInitiate(
    payload: UpgradeInitiateRequest,
  ): Promise<UpgradeInitiateResponse> {
    const headers = await authHeaders();
    const res = await http.post<UpgradeInitiateResponse>(
      'upgrade/initiate',
      payload,
      { headers, timeout: 60000 },
    );
    return res.data;
  },

  async upgradeConfirm(
    payload: UpgradeConfirmRequest,
  ): Promise<UpgradeConfirmResponse> {
    const headers = await authHeaders();
    const res = await http.post<UpgradeConfirmResponse>('upgrade/confirm', payload, {
      headers,
      timeout: 60000,
    });
    return res.data;
  },

  async astrologerDowngradeInitiate(
    payload: AstrologerDowngradeInitiateRequest,
  ): Promise<AstrologerDowngradeInitiateResponse> {
    const headers = await authHeaders();
    const res = await http.post<AstrologerDowngradeInitiateResponse>(
      'astrologer/downgrade/user/initiate',
      payload,
      { headers, timeout: 60000 },
    );
    const data = (res.data || {}) as AstrologerDowngradeInitiateResponse;
    const nested =
      data.data && typeof data.data === 'object'
        ? (data.data as Record<string, unknown>)
        : undefined;

    return {
      ...data,
      subscription_id:
        pickNestedValue(data as Record<string, unknown>, [
          'subscription_id',
          'razorpay_subscription_id',
        ]) || data.subscription_id,
      renewal_subscription_id:
        pickNestedValue(data as Record<string, unknown>, [
          'renewal_subscription_id',
          'renewalSubscriptionId',
        ]) || data.renewal_subscription_id,
      razorpay_subscription_id:
        pickNestedValue(data as Record<string, unknown>, [
          'razorpay_subscription_id',
          'subscription_id',
        ]) || data.razorpay_subscription_id,
      razorpay_key:
        pickNestedValue(data as Record<string, unknown>, [
          'razorpay_key',
          'key',
        ]) || data.razorpay_key,
      amount:
        data.amount ??
        (nested?.amount as number | string | undefined) ??
        (nested?.amount_paise as number | string | undefined),
    };
  },

  async astrologerDowngradeConfirm(
    payload: AstrologerDowngradeConfirmRequest,
  ): Promise<AstrologerDowngradeConfirmResponse> {
    const headers = await authHeaders();
    const res = await http.post<AstrologerDowngradeConfirmResponse>(
      'astrologer/downgrade/user/confirm',
      payload,
      { headers, timeout: 60000 },
    );
    return res.data;
  },
};

