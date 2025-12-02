import { Service } from '../Service';
import http from '../../utils/http';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CreateOrderRequest {
  plan_id: string;
  user_id: string;
  receipt: string;
  members: number;
  notes?: Record<string, any>;
}

export interface CreateOrderResponse {
  order_id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  created_at: number;
}

export interface VerifyPaymentRequest {
  current_plan_id: string;
  user_id: string;
  user_name: string;
  email: string;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  members: number;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface CreateUserReportRequest {
  report_type: string;
  currency: string;
  receipt: string;
  user_id: string;
  notes: Record<string, any>;
}

export interface CreateUserReportResponse {
  order_id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  created_at: number;
}

export interface UserReportVerifyRequest {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface UserReportVerifyResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface PaymentDetailsResponse {
  status: boolean;
  data: {
    _id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    current_plan: string;
    complete_profile: boolean;
    members_allow: number;
    current_members: number;
    child_allow: number;
    current_child: number;
    created_date: string;
    phone: number;
    status: boolean;
    updated_at: string;
    reports: Array<{
      user_id: string;
      order_id: string;
      status: string;
      report_type: string;
      amount: number;
      currency: string;
      receipt: string;
      created_at: string;
      updated_at: string | null;
      payment_id: string | null;
    }>;
    subscription: {
      status: string;
      plan_name: string;
      members: number;
      amount: number;
      start_plan_time: string;
      end_plan_time: string;
      payment_id: string;
      updated_at: string | null;
    } | null;
  };
}

class PaymentService extends Service {


  async createOrder(orderData: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      const response = await http.post(`/payment/create-order`, orderData, {
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.data && response.data.order_id) {
        return response.data;
      } else {
        throw new Error('Invalid response from create order API');
      }
    } catch (error: any) {
      console.error('Error creating order:', error);
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to create order');
      } else if (error.request) {
        throw new Error('Network error. Please check your connection.');
      } else {
        throw new Error('Something went wrong while creating order');
      }
    }
  }

  async verifyPayment(paymentData: VerifyPaymentRequest): Promise<VerifyPaymentResponse> {
    try {
      const response = await http.post(`/payment/verify-payment`, paymentData, {
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to verify payment');
      } else if (error.request) {
        throw new Error('Network error. Please check your connection.');
      } else {
        throw new Error('Something went wrong while verifying payment');
      }
    }
  }

  generateReceipt(): string {
    return `receipt_${Date.now()}`;
  }

  async createUserReport(reportData: CreateUserReportRequest): Promise<CreateUserReportResponse> {
    try {
      const token = await AsyncStorage.getItem('USER_TOKEN');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Create user report reportData:--->', reportData);

      const response = await http.post(`/user_report`, reportData, {
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Create user report response:--->', response.data);

      if (response.data && response.data.order_id) {
        return response.data;
      } else {
        throw new Error('Invalid response from create user report API');
      }
    } catch (error: any) {
      console.error('Error creating user report order:', error);
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to create user report order');
      } else if (error.request) {
        throw new Error('Network error. Please check your connection.');
      } else {
        throw new Error('Something went wrong while creating user report order');
      }
    }
  }

  async userReportVerify(verifyData: UserReportVerifyRequest): Promise<UserReportVerifyResponse> {
    try {
      const token = await AsyncStorage.getItem('USER_TOKEN');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await http.post(`/user_report/verify-payment`, verifyData, {
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('User report verify response:--->', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error verifying user report payment:', error);
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to verify user report payment');
      } else if (error.request) {
        throw new Error('Network error. Please check your connection.');
      } else {
        throw new Error('Something went wrong while verifying user report payment');
      }
    }
  }

  async getPaymentDetails(userId: string): Promise<PaymentDetailsResponse> {
    try {
      const token = await AsyncStorage.getItem('USER_TOKEN');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await http.get(`/accountant/payment-details/${userId}`, {
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Payment details response:--->', response.data);
      
      if (response.data && response.data.status) {
        return response.data;
      } else {
        throw new Error('Invalid response from payment details API');
      }
    } catch (error: any) {
      console.error('Error fetching payment details:', error);
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to fetch payment details');
      } else if (error.request) {
        throw new Error('Network error. Please check your connection.');
      } else {
        throw new Error('Something went wrong while fetching payment details');
      }
    }
  }
}

export default PaymentService;
