import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  DeviceEventEmitter,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontFamily } from '../constant/theme';
import notificationService, {
  FOREGROUND_PUSH_EVENT,
  ForegroundPushPayload,
} from '../services/notificationService';

const NAVY = '#1A3673';
const GOLD = '#C5A370';

const ForegroundPushBanner = () => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-140)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [payload, setPayload] = useState<ForegroundPushPayload | null>(null);

  const hide = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    Animated.timing(slideAnim, {
      toValue: -140,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setPayload(null));
  };

  const show = (next: ForegroundPushPayload) => {
    setPayload(next);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 240,
      useNativeDriver: true,
    }).start();
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    hideTimer.current = setTimeout(hide, 5000);
  };

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const subscription = DeviceEventEmitter.addListener(
      FOREGROUND_PUSH_EVENT,
      (next: ForegroundPushPayload) => {
        if (!next?.title && !next?.body) {
          return;
        }
        show(next);
      },
    );

    return () => {
      subscription.remove();
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    };
  }, []);

  if (!payload) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          paddingTop: Math.max(insets.top, 12),
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.card}
        onPress={() => {
          hide();
          notificationService.openRemoteMessage(payload.remoteMessage);
        }}
      >
        <Text style={styles.appName} numberOfLines={1}>
          Astrodha.AI
        </Text>
        <Text style={styles.title} numberOfLines={1}>
          {payload.title}
        </Text>
        {payload.body ? (
          <Text style={styles.body} numberOfLines={2}>
            {payload.body}
          </Text>
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    zIndex: 9999,
  },
  card: {
    backgroundColor: NAVY,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: GOLD,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  appName: {
    color: GOLD,
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    marginBottom: 2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
  },
  body: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    fontFamily: fontFamily.regular,
    marginTop: 4,
    lineHeight: 18,
  },
});

export default ForegroundPushBanner;
