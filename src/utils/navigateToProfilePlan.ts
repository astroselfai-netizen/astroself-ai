export type ProfilePlanNavigationParams = {
  planType?: 'individual' | 'family';
  memberId?: string;
};

type NavigationLike = {
  navigate: (...args: unknown[]) => void;
  getParent?: () => NavigationLike | undefined;
};

/** Navigate to Profile tab; MemberPlanManagement runs the plan action for the member. */
export function navigateToProfilePlan(
  navigation: NavigationLike,
  params: ProfilePlanNavigationParams,
) {
  const tabNav = navigation.getParent?.() ?? navigation;
  tabNav.navigate('ProfileTab', {
    screen: 'ProfileScreen',
    params,
  });
}

export function navigateToProfileTab(navigation: NavigationLike) {
  const tabNav = navigation.getParent?.() ?? navigation;
  tabNav.navigate('ProfileTab', { screen: 'ProfileScreen' });
}
