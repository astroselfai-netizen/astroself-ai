import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NotificationData, NotificationSettings } from '../../types/notifications';

interface NotificationState {
  fcmToken: string | null;
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  notifications: NotificationData[];
  unreadCount: number;
  settings: NotificationSettings;
  topics: string[];
}

const initialState: NotificationState = {
  fcmToken: null,
  isEnabled: false,
  isLoading: false,
  error: null,
  notifications: [],
  unreadCount: 0,
  settings: {
    fcmToken: null,
    isEnabled: false,
    topics: [],
    lastUpdated: new Date(),
  },
  topics: [],
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setFCMToken: (state, action: PayloadAction<string | null>) => {
      state.fcmToken = action.payload;
      state.settings.fcmToken = action.payload;
    },
    setNotificationEnabled: (state, action: PayloadAction<boolean>) => {
      state.isEnabled = action.payload;
      state.settings.isEnabled = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    addNotification: (state, action: PayloadAction<NotificationData>) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = Math.max(0, action.payload);
    },
    incrementUnreadCount: state => {
      state.unreadCount += 1;
    },
    markNotificationAsRead: (state, _action: PayloadAction<number>) => {
      if (state.unreadCount > 0) {
        state.unreadCount -= 1;
      }
    },
    markAllNotificationsAsRead: (state) => {
      state.unreadCount = 0;
    },
    removeNotification: (state, action: PayloadAction<number>) => {
      state.notifications.splice(action.payload, 1);
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
    addTopic: (state, action: PayloadAction<string>) => {
      if (!state.topics.includes(action.payload)) {
        state.topics.push(action.payload);
        state.settings.topics = state.topics;
      }
    },
    removeTopic: (state, action: PayloadAction<string>) => {
      state.topics = state.topics.filter(topic => topic !== action.payload);
      state.settings.topics = state.topics;
    },
    updateSettings: (state, action: PayloadAction<Partial<NotificationSettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    resetNotificationState: (_state) => {
      return initialState;
    },
  },
});

export const {
  setFCMToken,
  setNotificationEnabled,
  setLoading,
  setError,
  addNotification,
  setUnreadCount,
  incrementUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  removeNotification,
  clearAllNotifications,
  addTopic,
  removeTopic,
  updateSettings,
  resetNotificationState,
} = notificationSlice.actions;

export default notificationSlice.reducer;
