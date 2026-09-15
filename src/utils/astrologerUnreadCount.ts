import AsyncStorage from '@react-native-async-storage/async-storage';
import UserService from '../services/user/user.service';
import { store } from '../state/store';
import { setUnreadCount } from '../state/slices/notificationSlice';

export const refreshAstrologerUnreadCount = async () => {
  try {
    const userRaw = await AsyncStorage.getItem('USER_DATA');
    if (!userRaw) {
      store.dispatch(setUnreadCount(0));
      return 0;
    }

    const user = JSON.parse(userRaw) as { _id?: string; user_id?: string };
    const userId = String(user?._id || user?.user_id || '');
    if (!userId) {
      store.dispatch(setUnreadCount(0));
      return 0;
    }

    const response = await new UserService().getAstrologerMobileNotifications(
      userId,
      1,
      1,
      false,
    );
    const total = Number(response?.data?.total || 0);
    store.dispatch(setUnreadCount(total));
    return total;
  } catch (error) {
    console.log('Failed to refresh unread notifications', error);
    return store.getState().notifications.unreadCount;
  }
};
