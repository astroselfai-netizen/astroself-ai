import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { fontFamily, responsiveWidth } from '../constant/theme';

type PaidPlanRequiredModalProps = {
  visible: boolean;
  onClose: () => void;
  onViewPlans: () => void;
  isDark?: boolean;
  message?: string;
};

const PaidPlanRequiredModal = ({
  visible,
  onClose,
  onViewPlans,
  isDark = false,
  message = 'Personalised Predictions is available only with a paid plan. Please upgrade your plan to access this feature.',
}: PaidPlanRequiredModalProps) => {
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
            <Text style={styles.icon}>👑</Text>
            <Text
              style={[
                styles.title,
                { color: isDark ? '#FFFFFF' : '#0B1B3D' },
              ]}
            >
              Paid Plan Required
            </Text>
          </View>

          {/* Description */}
          <Text
            style={[
              styles.message,
              { color: isDark ? 'rgba(255,255,255,0.85)' : '#1E293B' },
            ]}
          >
            {message}
          </Text>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.viewPlansBtn}
              onPress={onViewPlans}
              activeOpacity={0.85}
            >
              <Text style={styles.viewPlansBtnText}>View Plans</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.cancelBtn,
                {
                  borderColor: isDark ? 'rgba(255,255,255,0.3)' : '#0B1B3D',
                },
              ]}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.cancelBtnText,
                  { color: isDark ? '#FFFFFF' : '#0B1B3D' },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
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
  actionsRow: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
  },
  viewPlansBtn: {
    width: '100%',
    backgroundColor: '#0B1B3D',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewPlansBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
  },
  cancelBtn: {
    width: '100%',
    borderWidth: 1.5,
    borderRadius: 999,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
  },
});

export default PaidPlanRequiredModal;
