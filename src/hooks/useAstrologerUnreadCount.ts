import { useCallback, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../state/store';
import { refreshAstrologerUnreadCount } from '../utils/astrologerUnreadCount';

export const useAstrologerUnreadCount = (enabled = true) => {
  const unreadCount = useSelector(
    (state: RootState) => state.notifications.unreadCount,
  );
  const userId = useSelector(
    (state: RootState) => state.app.user?._id || (state.app.user as { user_id?: string } | undefined)?.user_id,
  );

  useFocusEffect(
    useCallback(() => {
      if (enabled && userId) {
        refreshAstrologerUnreadCount();
      }
    }, [enabled, userId]),
  );

  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }

    const onChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        refreshAstrologerUnreadCount();
      }
    };

    const subscription = AppState.addEventListener('change', onChange);
    return () => subscription.remove();
  }, [enabled, userId]);

  return unreadCount;
};
