import React from 'react';
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { icons } from '../assets';
import { fontFamily, responsiveWidth } from '../constant/theme';

const NAVY = '#1A3673';

type ReportPurchaseConfirmModalProps = {
  visible: boolean;
  isDark?: boolean;
  onConfirmBuy: () => void;
  onWishToChange: () => void;
  onClose: () => void;
};

const ReportPurchaseConfirmModal = ({
  visible,
  isDark = false,
  onConfirmBuy,
  onWishToChange,
  onClose,
}: ReportPurchaseConfirmModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#2A3F58' : '#F7F4EE',
              borderColor: isDark ? 'rgba(255,255,255,0.14)' : '#E6DCCB',
            },
          ]}
        >
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Image
              source={icons.Icclose}
              style={[
                styles.closeIcon,
                { tintColor: isDark ? '#FFFFFF' : NAVY },
              ]}
            />
          </TouchableOpacity>

          <Text
            style={[
              styles.message,
              { color: isDark ? '#FFFFFF' : '#1A2B4A' },
            ]}
          >
            Predictions will be generated based on your personal details. Please
            update them now in case you wish to change.
          </Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={onConfirmBuy}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Ok, I will buy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              {
                borderColor: isDark ? 'rgba(197,163,112,0.7)' : '#7C6BA8',
                backgroundColor: isDark ? 'transparent' : '#FFFFFF',
              },
            ]}
            onPress={onWishToChange}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.secondaryBtnText,
                { color: isDark ? '#E8D7A8' : '#5B4B8A' },
              ]}
            >
              I wish to change
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth('8'),
  },
  card: {
    width: '100%',
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: responsiveWidth('6'),
    paddingTop: responsiveWidth('7'),
    paddingBottom: responsiveWidth('5'),
    alignItems: 'center',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  closeIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  message: {
    fontSize: 15,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: responsiveWidth('6'),
    paddingHorizontal: 12,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: NAVY,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
  },
  secondaryBtn: {
    width: '100%',
    borderRadius: 999,
    borderWidth: 1.4,
    paddingVertical: 11,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
  },
});

export default ReportPurchaseConfirmModal;
