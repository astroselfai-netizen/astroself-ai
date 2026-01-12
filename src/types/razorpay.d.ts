declare module 'react-native-razorpay' {
  interface RazorpayOptions {
    description?: string;
    image?: string;
    currency?: string;
    key: string;
    amount?: number;
    order_id?: string;
    subscription_id?: string;
    name?: string;
    prefill?: {
      email?: string;
      contact?: string;
      name?: string;
    };
    notes?: Record<string, any>;
    theme?: {
      color?: string;
    };
  }

  interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }

  interface RazorpayError {
    code?: string;
    description?: string;
    source?: string;
    step?: string;
    reason?: string;
  }

  class RazorpayCheckout {
    static open(options: RazorpayOptions): Promise<RazorpayResponse>;
  }

  export default RazorpayCheckout;
}
