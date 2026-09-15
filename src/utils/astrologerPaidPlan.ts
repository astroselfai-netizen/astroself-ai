const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
};

export const getAstrologerCurrentPlan = (source: unknown) => {
  const record = asRecord(source);
  return String(
    record?.current_plan || record?.plan_name || record?.plan || '',
  )
    .toLowerCase()
    .trim();
};

export const isAstrologerCosmicFoundationPlan = (source: unknown) =>
  getAstrologerCurrentPlan(source) === 'cosmic_foundation';

export const isAstrologerFreePlan = (source: unknown) => {
  const currentPlan = getAstrologerCurrentPlan(source);
  return (
    !currentPlan ||
    currentPlan === 'free' ||
    currentPlan === 'basic' ||
    currentPlan === 'cosmic_foundation' ||
    currentPlan.includes('free')
  );
};

export const isAstrologerPaidPlan = (source: unknown) => {
  const record = asRecord(source);
  if (isAstrologerFreePlan(record)) {
    return false;
  }

  const currentPlan = getAstrologerCurrentPlan(record);
  const isSubActive =
    record?.is_paid === true ||
    record?.plan_status === 'active' ||
    record?.is_subscribed === true ||
    Boolean(currentPlan);

  return Boolean(isSubActive);
};

/**
 * Personalized Predictions lock:
 * - cosmic_foundation => always locked (ignore personal_details)
 * - any other plan => locked only when personal_details is false
 */
export const shouldLockPersonalizedPredictions = (
  planSource: unknown,
  hasPersonalDetails: boolean,
) => {
  if (isAstrologerCosmicFoundationPlan(planSource)) {
    return true;
  }
  return !hasPersonalDetails;
};
