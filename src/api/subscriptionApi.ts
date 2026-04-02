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
};

