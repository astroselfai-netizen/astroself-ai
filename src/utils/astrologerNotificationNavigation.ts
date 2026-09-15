import AsyncStorage from '@react-native-async-storage/async-storage';
import UserService from '../services/user/user.service';
import { Api } from '../types/api';
import { refreshAstrologerUnreadCount } from './astrologerUnreadCount';
import {
  navigateAstrologerScreenWhenReady,
  navigateWhenReady,
} from './navigationRef';

const asString = (value: unknown) =>
  value == null ? '' : String(value).trim();

const parseMaybeJson = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed || (trimmed[0] !== '{' && trimmed[0] !== '[')) {
    return value;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
};

const flattenNotificationData = (
  data?: Record<string, unknown> | null,
): Record<string, unknown> => {
  if (!data) {
    return {};
  }

  const root: Record<string, unknown> = {};
  Object.entries(data).forEach(([key, value]) => {
    root[key] = parseMaybeJson(value);
  });

  const nestedCandidates = [
    root.payload,
    root.data,
    root.notification,
    root.content,
  ];

  nestedCandidates.forEach(candidate => {
    const nested = asRecord(parseMaybeJson(candidate));
    if (!nested) {
      return;
    }
    Object.entries(nested).forEach(([key, value]) => {
      if (root[key] == null || root[key] === '') {
        root[key] = parseMaybeJson(value);
      }
    });
  });

  return root;
};

export type NotificationContentParams = {
  title: string;
  heading: string;
  collection: string;
  pipeline: Array<Record<string, unknown>>;
};

export const getNotificationNavPayload = (
  data?: Record<string, unknown> | null,
) => {
  const flat = flattenNotificationData(data);
  return {
    route: asString(flat.route || flat.screen),
    notificationType: asString(
      flat.notification_type || flat.notificationType || flat.type,
    ),
    // Prefer explicit notification ids only — generic FCM `id` is not the inbox id.
    notificationId: asString(flat.notification_id || flat.notificationId),
    title: asString(flat.title || flat.heading),
  };
};

export const getNotificationContentParams = (
  data?: Record<string, unknown> | null,
): NotificationContentParams | null => {
  if (!data) {
    return null;
  }

  const flat = flattenNotificationData(data);
  const nestedPipeline = parseMaybeJson(
    flat.pipeline || flat.pipeline_data || flat.get_content,
  );

  let collection = asString(flat.collection);
  let stages: Array<Record<string, unknown>> = [];
  let heading = asString(flat.heading || flat.title);

  if (nestedPipeline && typeof nestedPipeline === 'object' && !Array.isArray(nestedPipeline)) {
    const pipelineObj = nestedPipeline as Record<string, unknown>;
    collection = collection || asString(pipelineObj.collection);
    heading = heading || asString(pipelineObj.heading || pipelineObj.title);
    const nestedStages = parseMaybeJson(pipelineObj.pipeline);
    if (Array.isArray(nestedStages)) {
      stages = nestedStages as Array<Record<string, unknown>>;
    }
  } else if (Array.isArray(nestedPipeline)) {
    stages = nestedPipeline as Array<Record<string, unknown>>;
  }

  if (!collection || stages.length === 0) {
    return null;
  }

  return {
    title: heading,
    heading,
    collection,
    pipeline: JSON.parse(JSON.stringify(stages)) as Array<Record<string, unknown>>,
  };
};

const contentParamsFromListItem = (
  item: Api.User.Res.AstrologerMobileNotificationItem,
): NotificationContentParams | null =>
  getNotificationContentParams({
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

const findNotificationMatch = async (
  userId: string,
  flat: Record<string, unknown>,
): Promise<Api.User.Res.AstrologerMobileNotificationItem | null> => {
  if (!userId) {
    return null;
  }

  const notificationId = asString(
    flat.notification_id || flat.notificationId,
  );
  const title = asString(flat.title || flat.heading).toLowerCase();
  const planet = asString(flat.planet).toLowerCase();
  const sign = asString(flat.sign).toLowerCase();
  const body = asString(flat.body || flat.message).toLowerCase();

  try {
    const response = await new UserService().getAstrologerMobileNotifications(
      userId,
      1,
      50,
    );
    const items = response?.data?.items || [];

    if (notificationId) {
      const byId = items.find(
        item => String(item.notification_id) === String(notificationId),
      );
      if (byId) {
        return byId;
      }
    }

    const scored = items
      .map(item => {
        let score = 0;
        const itemTitle = asString(item.title).toLowerCase();
        const itemMessage = asString(item.message).toLowerCase();
        const itemPlanet = asString(item.payload?.planet).toLowerCase();
        const itemSign = asString(item.payload?.sign).toLowerCase();

        if (title && itemTitle === title) {
          score += 5;
        } else if (title && itemTitle.includes(title)) {
          score += 3;
        }
        if (planet && itemPlanet === planet) {
          score += 3;
        }
        if (sign && itemSign === sign) {
          score += 3;
        }
        if (
          body &&
          itemMessage &&
          (itemMessage.includes(body.slice(0, 40)) ||
            body.includes(itemMessage.slice(0, 40)))
        ) {
          score += 2;
        }
        return { item, score };
      })
      .filter(entry => entry.score >= 5)
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        // Prefer unread when multiple Mercury Transit (etc.) share the same title.
        const aUnread = a.item.is_open === false ? 1 : 0;
        const bUnread = b.item.is_open === false ? 1 : 0;
        if (bUnread !== aUnread) {
          return bUnread - aUnread;
        }
        return (
          new Date(b.item.created_at).getTime() -
          new Date(a.item.created_at).getTime()
        );
      });

    return scored[0]?.item || null;
  } catch (error) {
    console.log('Failed to resolve notification match', error);
    return null;
  }
};

const patchPipelineUserId = (
  stages: Array<Record<string, unknown>>,
  userId: string,
): Array<Record<string, unknown>> => {
  if (!userId) {
    return stages;
  }

  const cloned = JSON.parse(JSON.stringify(stages)) as Array<Record<string, unknown>>;

  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') {
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }

    const obj = node as Record<string, unknown>;
    const match = obj.$match;
    if (match && typeof match === 'object' && !Array.isArray(match)) {
      const matchObj = match as Record<string, unknown>;
      if ('user_id' in matchObj) {
        matchObj.user_id = userId;
      }
    }

    Object.values(obj).forEach(walk);
  };

  walk(cloned);
  return cloned;
};

export const markAstrologerNotificationOpen = async (
  notificationId?: string,
) => {
  if (!notificationId) {
    return;
  }

  try {
    const userRaw = await AsyncStorage.getItem('USER_DATA');
    const user = userRaw
      ? (JSON.parse(userRaw) as { _id?: string; user_id?: string })
      : null;
    const userId = String(user?._id || user?.user_id || '');
    if (!userId) {
      return;
    }

    await new UserService().markAstrologerMobileNotificationOpen(
      userId,
      notificationId,
    );
    await refreshAstrologerUnreadCount();
  } catch (error) {
    console.log('Failed to mark notification as open', error);
  }
};

const openDetailScreen = (
  content: NotificationContentParams,
  userId: string,
  fallbackTitle?: string,
) => {
  navigateAstrologerScreenWhenReady('AstrologerNotificationDetailScreen', {
    title: content.title || fallbackTitle || 'Notification',
    heading: content.heading,
    collection: content.collection,
    pipeline: patchPipelineUserId(content.pipeline, userId),
  });
};

export const openAstrologerNotification = async (
  data?: Record<string, unknown> | null,
) => {
  const authToken = await AsyncStorage.getItem('USER_TOKEN');
  if (!authToken) {
    navigateWhenReady('Login');
    return;
  }

  const flat = flattenNotificationData(data);
  const { notificationId: payloadNotificationId, title } =
    getNotificationNavPayload(flat);

  const userRaw = await AsyncStorage.getItem('USER_DATA');
  const storedUser = userRaw
    ? (JSON.parse(userRaw) as { _id?: string; user_id?: string })
    : null;
  const userId = String(
    storedUser?._id || storedUser?.user_id || flat.user_id || '',
  );

  let content = getNotificationContentParams(flat);
  let resolvedNotificationId = payloadNotificationId;

  // Push tray payloads often include collection/pipeline (so detail opens) but
  // omit notification_id. Resolve the inbox item so we can mark it read.
  if (!resolvedNotificationId || !content) {
    const listItem = await findNotificationMatch(userId, flat);
    if (listItem) {
      if (!resolvedNotificationId) {
        resolvedNotificationId = asString(listItem.notification_id);
      }
      if (!content) {
        content = contentParamsFromListItem(listItem);
      }
    }
  }

  if (resolvedNotificationId) {
    await markAstrologerNotificationOpen(resolvedNotificationId);
  }

  if (content) {
    openDetailScreen(content, userId, title);
    return;
  }

  // Still open the list so the user can tap the item there.
  navigateAstrologerScreenWhenReady('AstrologerNotificationsScreen');
};
