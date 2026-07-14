import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
  Platform,
} from 'react-native';
import { openStoreListing } from '../utils/openStore';
import { color } from '../constant/theme';

type Props = {
  visible: boolean;
  forceUpdate: boolean;
  latestVersion: string;
  currentVersion: string;
  message?: string;
  storeUrl?: string;
  onDismissOptional: () => void;
};

const StoreUpdateModal: React.FC<Props> = ({
  visible,
  forceUpdate,
  latestVersion,
  currentVersion,
  message,
  storeUrl,
  onDismissOptional,
}) => {
  useEffect(() => {
    if (!visible || !forceUpdate) {
      return;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [visible, forceUpdate]);

  const handleUpdate = async () => {
    await openStoreListing(storeUrl);
  };

  if (!visible) {
    return null;
  }

  const storeLabel = Platform.OS === 'ios' ? 'App Store' : 'Play Store';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      // Vivo / FunTouch: overFullScreen + statusBarTranslucent avoid blank/hidden modals
      presentationStyle="overFullScreen"
      statusBarTranslucent
      hardwareAccelerated
      onRequestClose={forceUpdate ? () => {} : onDismissOptional}
    >
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.card}>
          <Text style={styles.title}>Update available</Text>
          <Text style={styles.body}>
            {message?.trim()
              ? message
              : `A new version (${latestVersion}) is on the ${storeLabel}. You are on ${currentVersion}.`}
          </Text>
          {forceUpdate ? (
            <Text style={styles.hint}>
              Please update to continue using the app.
            </Text>
          ) : null}
          <TouchableOpacity style={styles.primary} onPress={handleUpdate}>
            <Text style={styles.primaryText}>Update</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 9999,
    elevation: 9999,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    color: '#444',
    lineHeight: 22,
    textAlign: 'center',
  },
  hint: {
    fontSize: 14,
    color: '#c62828',
    marginTop: 12,
    textAlign: 'center',
  },
  primary: {
    backgroundColor: color.Orangeaccentcolor,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  primaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondary: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  secondaryText: {
    color: '#888',
    fontSize: 16,
  },
});

export default StoreUpdateModal;
