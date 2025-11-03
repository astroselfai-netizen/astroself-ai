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
}

export default PaymentService;
