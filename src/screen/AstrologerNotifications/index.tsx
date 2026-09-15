import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { MainContainer } from '../../components/common/mainContainer';
import AstrologerScreenHeader from '../../components/AstrologerScreenHeader';
import { fontFamily, responsiveWidth } from '../../constant/theme';
import { useTheme } from '../../context/ThemeContext';
import UserService from '../../services/user/user.service';
import { RootState } from '../../state/store';
import { Api } from '../../types/api';
import { openAstrologerNotification } from '../../utils/astrologerNotificationNavigation';

const NAVY = '#1A3673';
const GOLD = '#C5A370';

const fullScreenContainerStyle = {
  backgroundColor: 'transparent' as const,
};

const fullScreenSubContainerStyle = {
  backgroundColor: 'transparent' as const,
  marginBottom: 0,
  borderBottomLeftRadius: 0,
  borderBottomRightRadius: 0,
  overflow: 'visible' as const,
};

type NotificationItem = Api.User.Res.AstrologerMobileNotificationItem;

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const formatNotificationDate = (raw?: string) => {
  if (!raw) {
    return '';
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return 'Today';
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();
  if (isYesterday) {
    return 'Yesterday';
  }

  return `${date.getDate()} ${MONTH_LABELS[date.getMonth()]}`;
};

const AstrologerNotificationsScreen = () => {
  const { colors, theme } = useTheme();
  const user = useSelector((state: RootState) => state.app.user);
  const userService = useMemo(() => new UserService(), []);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const isDark = theme === 'dark';
  const textPrimary = isDark ? colors.themeTextWhite : NAVY;
  const textMuted = isDark ? 'rgba(255,255,255,0.65)' : '#6B7280';
  const cardBg = isDark ? colors.cardBackground : colors.white;
  const cardBorder = isDark ? 'rgba(255,255,255,0.18)' : '#E2E8F0';
  const userId = String(user?._id || '');

  const loadNotifications = useCallback(
    async (nextPage = 1, mode: 'replace' | 'append' = 'replace') => {
      if (!userId) {
        setItems([]);
        setLoading(false);
        setErrorText('User not found. Please login again.');
        return;
      }

      if (mode === 'replace' && nextPage === 1) {
        setLoading(true);
      }
      setErrorText('');

      try {
        const response = await userService.getAstrologerMobileNotifications(
          userId,
          nextPage,
          20,
        );
        const nextItems = Array.isArray(response?.data?.items)
          ? response.data.items
          : [];
        setPage(response?.data?.page || nextPage);
        setTotalPages(response?.data?.total_pages || 1);
        setItems(prev => (mode === 'append' ? [...prev, ...nextItems] : nextItems));
      } catch (error: unknown) {
        const err = error as { message?: string };
        if (mode !== 'append') {
          setItems([]);
        }
        setErrorText(err.message || 'Failed to load notifications');
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [userId, userService],
  );

  useFocusEffect(
    useCallback(() => {
      loadNotifications(1, 'replace');
    }, [loadNotifications]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications(1, 'replace');
  };

  const handleLoadMore = () => {
    if (loading || loadingMore || refreshing || page >= totalPages) {
      return;
    }
    setLoadingMore(true);
    loadNotifications(page + 1, 'append');
  };

  const handleNotificationPress = (item: NotificationItem) => {
    if (item.is_open === false) {
      setItems(prev =>
        prev.map(entry =>
          entry.notification_id === item.notification_id
            ? { ...entry, is_open: true, opened_at: new Date().toISOString() }
            : entry,
        ),
      );
    }

    openAstrologerNotification({
      notification_id: item.notification_id,
      user_id: item.user_id,
      title: item.title,
      message: item.message,
      notification_type: item.notification_type,
      route: item.route,
      payload: item.payload,
      heading: item.heading || item.pipeline?.heading || item.title,
      collection: item.collection || item.pipeline?.collection,
      pipeline: item.pipeline,
    });
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const unread = item.is_open === false;
    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: cardBg,
            borderColor: unread ? GOLD : cardBorder,
          },
        ]}
        activeOpacity={0.85}
        onPress={() => handleNotificationPress(item)}
      >
        <View
          style={[
            styles.unreadDot,
            { backgroundColor: unread ? GOLD : 'transparent' },
          ]}
        />
        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <Text
              style={[
                styles.cardTitle,
                { color: textPrimary },
                unread ? styles.cardTitleUnread : null,
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text style={[styles.cardDate, { color: textMuted }]}>
              {formatNotificationDate(item.created_at)}
            </Text>
          </View>
          <Text style={[styles.cardMessage, { color: textMuted }]}>
            {item.message}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.flex}>
      <AstrologerScreenHeader title="Notifications" showBack />
      <MainContainer
        safeBottom
        containerStyle={fullScreenContainerStyle}
        subContainerStyle={fullScreenSubContainerStyle}
      >
        {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={textPrimary} />
        </View>
      ) : errorText && items.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={[styles.emptyText, { color: textMuted }]}>{errorText}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => loadNotifications(1, 'replace')}
            activeOpacity={0.85}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, index) =>
            `${item.notification_id || item.created_at}-${index}`
          }
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            items.length === 0 ? styles.listEmpty : null,
          ]}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={textPrimary}
              colors={[GOLD]}
            />
          }
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: textMuted }]}>
              No notifications yet
            </Text>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                style={styles.footerLoader}
                size="small"
                color={textPrimary}
              />
            ) : null
          }
        />
      )}
      </MainContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: responsiveWidth('4'),
    paddingTop: responsiveWidth('5'),
    paddingBottom: 32,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
    gap: 10,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 7,
  },
  cardBody: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
  },
  cardTitleUnread: {
    fontFamily: fontFamily.bold,
  },
  cardDate: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
  },
  cardMessage: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    lineHeight: 19,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: responsiveWidth('8'),
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 14,
    backgroundColor: NAVY,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
  },
  footerLoader: {
    marginVertical: 16,
  },
});

export default AstrologerNotificationsScreen;
