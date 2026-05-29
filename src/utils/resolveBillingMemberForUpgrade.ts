/** Member id sent to upgrade/payment APIs (matches MemberPlanManagement). */
export function getMemberUserId(member: any): string {
  return String(member?.id || member?._id || member?.birth_input_id || '');
}

/**
 * Individual → Family upgrade must use the member who already has an active
 * subscription (eternal_path), not the profile selected in Chat without a plan.
 */
export function resolveBillingMemberForFamilyUpgrade(
  targetMember: any,
  allMembers?: any[] | null,
): any {
  const pool = Array.isArray(allMembers) ? allMembers : [];
  const subscribed = pool.find(
    (m: any) =>
      String(m?.current_plan || '') === 'eternal_path' ||
      String(m?.current_plan || '') === 'family_plan',
  );
  if (subscribed) {
    return subscribed;
  }

  const targetPlan = String(targetMember?.current_plan || '');
  if (targetPlan === 'eternal_path' || targetPlan === 'family_plan') {
    return targetMember;
  }

  return targetMember;
}
