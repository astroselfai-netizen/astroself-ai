import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { fontFamily, responsiveWidth } from '../constant/theme';

type PersonalDetailsRequiredModalProps = {
  visible: boolean;
  onClose: () => void;
  isDark?: boolean;
};

const PersonalDetailsRequiredModal = ({
  visible,
  onClose,
  isDark = false,
}: PersonalDetailsRequiredModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[
            styles.container,
            {
              backgroundColor: isDark ? '#2A3F58' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#E5E7EB',
            },
          ]}
        >
          {/* Header with icon and title */}
          <View style={styles.headerRow}>
            <Text style={styles.icon}>💬</Text>
            <Text
              style={[
                styles.title,
                { color: isDark ? '#FFFFFF' : '#0B1B3D' },
              ]}
            >
              Personal Details Required
            </Text>
          </View>

          {/* Description */}
          <Text
            style={[
              styles.message,
              { color: isDark ? 'rgba(255,255,255,0.85)' : '#1E293B' },
            ]}
          >
            You have not yet shared your details and your predictions are not generated. Please submit your details for personalised predictions.
          </Text>

          {/* Close button (Blue pill) */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth('7'),
  },
  container: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: responsiveWidth('6'),
    paddingTop: responsiveWidth('7'),
    paddingBottom: responsiveWidth('6'),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: responsiveWidth('3.5'),
  },
  icon: {
    fontSize: 22,
  },
  title: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: responsiveWidth('6'),
    paddingHorizontal: responsiveWidth('2'),
  },
  closeBtn: {
    backgroundColor: '#0B1B3D',
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
  },
});

export default PersonalDetailsRequiredModal;
