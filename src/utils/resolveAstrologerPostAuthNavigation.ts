import UserService from '../services/user/user.service';

export type AstrologerPostAuthScreen =
  | 'AstrologerHome'
  | 'AstrologerCreateClientScreen';

export type AstrologerCreateClientNavParams = {
  fromRegistration?: boolean;
  fromLoginNoClients?: boolean;
};

export async function resolveAstrologerPostAuthScreen(
  userService: UserService,
  userId: string,
  userData?: Record<string, unknown> | null,
): Promise<{
  screen: AstrologerPostAuthScreen;
  params?: AstrologerCreateClientNavParams;
}> {
  const cachedCount = Number(
    userData?.astrologer_current_members ?? userData?.current_members,
  );

  if (cachedCount > 0) {
    return { screen: 'AstrologerHome' };
  }

  try {
    const response = await userService.getAstrologerClients(userId, 0, 1);
    const clients = response?.data?.data ?? [];
    const apiCount = Number(
      (response?.data?.user_details as Record<string, unknown> | undefined)
        ?.astrologer_current_members,
    );

    if (clients.length === 0 && (Number.isNaN(apiCount) || apiCount <= 0)) {
      return {
        screen: 'AstrologerCreateClientScreen',
        params: { fromLoginNoClients: true },
      };
    }
  } catch (error) {
    console.error('Failed to resolve astrologer post-auth screen:', error);
  }

  return { screen: 'AstrologerHome' };
}
