/**
 * Shared Razorpay options for UPI.
 *
 * One-time payments (orders): GPay / PhonePe Intent can show when UPI is
 * enabled on the Razorpay account and apps are installed on a real device.
 *
 * Subscriptions (subscription_id / autopay): Razorpay only supports
 * Cards, EMandate, and UPI Autopay. Standard UPI Intent (GPay/PhonePe list)
 * will NOT appear for subscription_id checkouts. Enable "UPI Autopay" in
 * Razorpay Dashboard for the same key, or switch Plan billing to order_id.
 */

export const RAZORPAY_UPI_METHODS = {
  upi: true,
  card: true,
  netbanking: true,
  wallet: true,
  emi: false,
  paylater: false,
} as const;

export const RAZORPAY_UPI_APPS = [
  'google_pay',
  'phonepe',
  'paytm',
  'bhim',
] as const;

/** One-time order checkout (Buy Questions, Report, Add Member, etc.). */
export const getRazorpayUpiEnabledFields = () => ({
  method: { ...RAZORPAY_UPI_METHODS },
  external: {
    wallets: ['paytm'],
  },
  config: {
    display: {
      blocks: {
        upi_apps: {
          name: 'Pay using UPI',
          instruments: [
            {
              method: 'upi',
              flows: ['intent', 'collect', 'qr'],
              apps: [...RAZORPAY_UPI_APPS],
            },
          ],
        },
      },
      sequence: ['block.upi_apps'],
      preferences: {
        show_default_blocks: true,
      },
    },
  },
});

/**
 * Recurring / autopay subscription checkout (Plan screen).
 * Do not force method filters or one-time UPI Intent blocks —
 * Razorpay will only show methods enabled for Subscriptions on the account.
 */
export const getRazorpaySubscriptionPaymentFields = () => ({
  // Intentionally empty: subscription_id checkout methods come from Razorpay account.
});

export const withUpiPrefill = <T extends Record<string, unknown>>(prefill: T) => ({
  method: 'upi' as const,
  ...prefill,
});
