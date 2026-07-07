export const ASTROLOGER_ROLE = 'astrologer';

type UserWithRole = { role?: string } | null | undefined;

export const isAstrologerUser = (user?: UserWithRole): boolean =>
  user?.role === ASTROLOGER_ROLE;

export const mergeUserProfile = <T extends Record<string, unknown>>(
  existing: UserWithRole,
  incoming: T,
): T => {
  const preservedRole = existing?.role || (incoming.role as string | undefined);

  if (!preservedRole) {
    return incoming;
  }

  return {
    ...incoming,
    role: preservedRole,
  };
};

export const getStoredUserRole = async (): Promise<string | undefined> => {
  try {
    const AsyncStorage = (
      await import('@react-native-async-storage/async-storage')
    ).default;
    const userDataString = await AsyncStorage.getItem('USER_DATA');
    if (!userDataString) {
      return undefined;
    }
    const userData = JSON.parse(userDataString);
    return userData?.role;
  } catch {
    return undefined;
  }
};
