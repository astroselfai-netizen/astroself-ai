export const DEFAULT_QUESTION_PRICE = 100;
export const DEFAULT_QUESTION_PRICE_TAG = '₹';

export type QuestionPriceInfo = {
  amount: number;
  tag: string;
  label: string;
};

type PlanLike = {
  title?: string;
  featuresTitle?: string;
  price?: unknown;
  usd_price?: unknown;
  currency?: unknown;
  pricePerQuestion?: unknown;
  price_tag?: unknown;
};

export const formatMoneyAmount = (amount: number) => {
  if (!Number.isFinite(amount)) {
    return '0';
  }
  if (Number.isInteger(amount)) {
    return String(amount);
  }
  return String(parseFloat(amount.toFixed(2)));
};

export const getPlanCurrencyTag = (plan?: PlanLike | null) => {
  const tag = String(plan?.price_tag || '').trim();
  if (tag) {
    return tag;
  }
  const currency = String(plan?.currency || '').toUpperCase();
  if (currency === 'USD') {
    return '$';
  }
  return DEFAULT_QUESTION_PRICE_TAG;
};

export const isUsdPlan = (plan?: PlanLike | null) => {
  const tag = getPlanCurrencyTag(plan);
  const currency = String(plan?.currency || '').toUpperCase();
  return currency === 'USD' || tag === '$';
};

export const getPlanDisplayPrice = (plan?: PlanLike | null) => {
  if (isUsdPlan(plan) && plan?.usd_price != null && String(plan.usd_price) !== '') {
    return String(plan.usd_price);
  }
  return String(plan?.price ?? '0');
};

export const resolveQuestionPrice = (
  plan?: PlanLike | null,
): QuestionPriceInfo => {
  const tag = getPlanCurrencyTag(plan);
  const amount = Number(plan?.pricePerQuestion);
  const safeAmount =
    Number.isFinite(amount) && amount >= 0 ? amount : DEFAULT_QUESTION_PRICE;

  return {
    amount: safeAmount,
    tag,
    label: `${tag}${formatMoneyAmount(safeAmount)}`,
  };
};

export const applyQuestionPriceToText = (text: string, priceLabel: string) =>
  text.replace(/(₹|Rs\.?\s*|INR\s*|\$)\s*\d+(?:\.\d+)?/g, () => priceLabel);

export const pickPlanForQuestionPrice = <T extends PlanLike>(
  plans: T[],
  currentPlan?: string,
): T | null => {
  if (!plans.length) {
    return null;
  }

  const needle = String(currentPlan || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .trim();

  if (needle) {
    const matched = plans.find(plan => {
      const title = `${plan.featuresTitle || ''} ${plan.title || ''}`.toLowerCase();
      const planTitle = String(plan.title || '').toLowerCase();
      return (
        title.includes(needle) ||
        needle.includes(planTitle) ||
        needle.replace(/\s+/g, '') === planTitle.replace(/\s+/g, '')
      );
    });
    if (matched) {
      return matched;
    }
  }

  return plans.find(plan => Number(plan.pricePerQuestion) > 0) || plans[0] || null;
};
