import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { fontFamily, responsiveWidth } from '../constant/theme';
import { useTheme } from '../context/ThemeContext';
import UserService from '../services/user/user.service';
import { RootState } from '../state/store';
import { getAstrologerInrBudget } from '../utils/astrologerChatStream';

const GOLD = '#C5A370';
const NAVY = '#223149';

type ThemePalette = {
  isDark: boolean;
  cardBg: string;
  statsBg: string;
  textPrimary: string;
  textMuted: string;
  borderColor: string;
  emailPillBg: string;
  creditTrackBg: string;
  secondaryButtonBorder: string;
  secondaryButtonText: string;
  gold: string;
  white: string;
};

const getThemePalette = (
  theme: string,
  colors: ReturnType<typeof useTheme>['colors'],
): ThemePalette => {
  const isDark = theme === 'dark';
  return {
    isDark,
    cardBg: isDark ? '#2A3F58' : colors.white,
    statsBg: isDark ? '#354D6A' : '#FFF8F0',
    textPrimary: isDark ? colors.themeTextWhite : colors.DarkNavy,
    textMuted: isDark ? '#B8B0A0' : '#8B95A8',
    borderColor: isDark ? 'rgba(238, 229, 202, 0.22)' : colors.Orangeaccentcolor,
    emailPillBg: isDark ? '#354D6A' : '#F3F4F6',
    creditTrackBg: isDark ? 'rgba(255,255,255,0.15)' : '#E8DFD2',
    secondaryButtonBorder: isDark ? 'rgba(238, 229, 202, 0.35)' : NAVY,
    secondaryButtonText: isDark ? colors.themeTextWhite : NAVY,
    gold: GOLD,
    white: colors.white,
  };
};

const getOutlinedButtonStyle = (palette: ThemePalette) => ({
  backgroundColor: 'transparent',
  borderWidth: 1,
  borderColor: palette.secondaryButtonBorder,
});

const getGoldOutlinedButtonStyle = (palette: ThemePalette) => ({
  backgroundColor: 'transparent',
  borderWidth: 1,
  borderColor: palette.gold,
});

const AstrologerProfileSection = () => {
  const navigation = useNavigation<any>();
  const { colors, theme } = useTheme();
  const user = useSelector((state: RootState) => state.app.user);
  const userService = useMemo(() => new UserService(), []);
  const [creditPercent, setCreditPercent] = useState('0.00');
  const [usageLoading, setUsageLoading] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  const astrologerUser = user as Record<string, unknown> | undefined;
  const astrologerUserId = String(user?._id || '');

  console.log('astrologerUser', astrologerUser);
  const currentPlan = String(astrologerUser?.current_plan || 'Free Plan');
  const astrologerInrBudget = useMemo(
    () => getAstrologerInrBudget(currentPlan),
    [currentPlan],
  );

  const fetchUsage = useCallback(async () => {
    if (!astrologerUserId) {
      return;
    }

    setUsageLoading(true);
    try {
      const usage = await userService.getAstrologerUsage(
        astrologerUserId,
        astrologerInrBudget,
      );
      setCreditPercent(Number(usage.percent_remaining || 0).toFixed(2));
    } catch {
      setCreditPercent('0.00');
    } finally {
      setUsageLoading(false);
    }
  }, [astrologerUserId, astrologerInrBudget, userService]);

  useFocusEffect(
    useCallback(() => {
      fetchUsage();
    }, [fetchUsage]),
  );

  const getDisplayName = () => {
    const firstName = String(astrologerUser?.first_name || '');
    const lastName = String(astrologerUser?.last_name || '');
    return `${firstName} ${lastName}`.trim() || 'Astrologer';
  };

  const planBadgeLabel =
    currentPlan.toLowerCase() === 'cosmic_foundation'
      ? 'Free Plan'
      : currentPlan
          .split('_')
          .map(word => word.toUpperCase())
          .join(' ');

  const handleUpgrade = useCallback(() => {
    navigation.getParent()?.navigate('PlanTab');
  }, [navigation]);

  const handlePaymentHistory = useCallback(() => {
    navigation.navigate('PurchasedHistoryScreen');
  }, [navigation]);

  const handleDeleteAccount = useCallback(() => {
    setShowDeleteAccountModal(true);
  }, []);

  const handleCloseDeleteAccountModal = useCallback(() => {
    if (!isDeletingAccount) {
      setShowDeleteAccountModal(false);
    }
  }, [isDeletingAccount]);

  const handleConfirmDeleteAccount = useCallback(async () => {
    const userId = String(astrologerUser?._id || user?._id || '');
    if (!userId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'User ID not found.',
      });
      return;
    }

    try {
      setIsDeletingAccount(true);
      await userService.deleteAstrologerUser(userId);
      await AsyncStorage.multiRemove(['USER_TOKEN', 'USER_DATA']);
      setShowDeleteAccountModal(false);
      Toast.show({
        type: 'success',
        text1: 'Account Deleted',
        text2: 'Your account has been deleted successfully.',
      });
      const rootNavigation = navigation.getParent()?.getParent();
      rootNavigation?.reset?.({ index: 0, routes: [{ name: 'Login' }] });
    } catch (error: unknown) {
      const err = error as { message?: string };
      Toast.show({
        type: 'error',
        text1: 'Delete Failed',
        text2: err.message || 'Failed to delete account.',
      });
    } finally {
      setIsDeletingAccount(false);
    }
  }, [astrologerUser?._id, user?._id, userService, navigation]);

  const palette = useMemo(() => getThemePalette(theme, colors), [theme, colors]);

  return (
    <>
      <View
        style={[
          styles.profileCard,
          {
            backgroundColor: palette.cardBg,
            borderWidth: 1,
            borderColor: palette.borderColor,
          },
        ]}
      >
        <View style={styles.profileNameRow}>
          <Text style={[styles.profileName, { color: palette.textPrimary }]}>
            {getDisplayName()}
          </Text>
          <View style={[styles.emailPill, { backgroundColor: palette.emailPillBg }]}>
            <Text style={[styles.emailPillIcon, { color: palette.textMuted }]}>✉</Text>
            <Text
              style={[styles.emailPillText, { color: palette.textMuted }]}
              numberOfLines={1}
            >
              {String(astrologerUser?.email || 'No email')}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.creditBalanceBox,
            {
              backgroundColor: palette.statsBg,
              borderColor: palette.isDark ? palette.borderColor : '#F0E2CF',
            },
          ]}
        >
          <View style={styles.creditBalanceTopRow}>
            <View style={styles.creditBalanceLeft}>
              <View style={[styles.crownIconBox, { backgroundColor: palette.gold }]}>
                <Text style={styles.crownIcon}>👑</Text>
              </View>
              <View>
                <Text style={[styles.creditBalanceLabel, { color: palette.textMuted }]}>
                  CREDIT BALANCE
                </Text>
                <View style={styles.creditBalanceValueRow}>
                  {usageLoading ? (
                    <ActivityIndicator size="small" color={palette.gold} />
                  ) : (
                    <Text style={[styles.creditBalancePercent, { color: palette.textPrimary }]}>
                      {creditPercent}%
                    </Text>
                  )}
                  <Text style={[styles.creditBalanceRemaining, { color: palette.textMuted }]}>
                    Remaining
                  </Text>
                </View>
              </View>
            </View>
            <View
              style={[
                styles.planBadge,
                {
                  borderColor: palette.gold,
                  backgroundColor: palette.isDark ? palette.cardBg : palette.white,
                },
              ]}
            >
              <Text style={[styles.planBadgeText, { color: palette.gold }]}>
                {planBadgeLabel}
              </Text>
            </View>
          </View>

          <View style={[styles.creditProgressTrack, { backgroundColor: palette.creditTrackBg }]}>
            <View
              style={[
                styles.creditProgressFill,
                {
                  width: `${Math.min(Number(creditPercent), 100)}%`,
                  backgroundColor: palette.gold,
                },
              ]}
            />
          </View>

          <TouchableOpacity
            style={[styles.upgradeButton, getGoldOutlinedButtonStyle(palette)]}
            onPress={handleUpgrade}
            activeOpacity={0.85}
          >
            <Text style={[styles.upgradeButtonIcon, { color: palette.gold }]}>👑</Text>
            <Text style={[styles.upgradeButtonText, { color: palette.gold }]}>Upgrade</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.profileActionRow}>
          <TouchableOpacity
            style={[styles.paymentHistoryButton, getOutlinedButtonStyle(palette)]}
            onPress={handlePaymentHistory}
            activeOpacity={0.85}
          >
            <Image
              source={require('../assets/icons/Purchased-History.png')}
              style={[
                styles.paymentHistoryIcon,
                { tintColor: palette.secondaryButtonText },
              ]}
            />
            <Text style={[styles.paymentHistoryText, { color: palette.secondaryButtonText }]}>
              Payment History
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.deleteAccountButton,
              {
                backgroundColor: palette.isDark ? palette.cardBg : palette.white,
                borderColor: '#EF4444',
              },
            ]}
            onPress={handleDeleteAccount}
            disabled={isDeletingAccount}
            activeOpacity={0.85}
          >
            <Image
              source={require('../assets/icons/trash.png')}
              style={styles.deleteAccountIcon}
            />
            <Text style={styles.deleteAccountText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showDeleteAccountModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseDeleteAccountModal}
      >
        <View style={styles.deleteModalOverlay}>
          <LinearGradient
            colors={['#E8F4FC', '#FDF3EA', '#FCE8D8']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.deleteModalContainer}
          >
            <Text style={styles.deleteModalTitle}>Are You Sure?</Text>
            <Text style={styles.deleteModalMessage}>
              Note that Once Account is Deleted, all data of all clients will be
              deleted. Action once done can not be undone. You will not be able
              to create account with this id on this app.
            </Text>

            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={styles.deleteModalYesButton}
                onPress={handleConfirmDeleteAccount}
                disabled={isDeletingAccount}
                activeOpacity={0.85}
              >
                {isDeletingAccount ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.deleteModalYesText}>Yes</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteModalNoButton}
                onPress={handleCloseDeleteAccountModal}
                disabled={isDeletingAccount}
                activeOpacity={0.85}
              >
                <Text style={styles.deleteModalNoText}>No</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  profileCard: {
    borderRadius: 16,
    padding: responsiveWidth('4'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: responsiveWidth('2'),
    marginBottom: responsiveWidth('3.5'),
  },
  profileName: {
    flex: 1,
    fontSize: 20,
    fontFamily: fontFamily.bold,
  },
  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    // maxWidth: '52%',
    gap: 4,
  },
  emailPillIcon: {
    fontSize: 12,
  },
  emailPillText: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    flexShrink: 1,
  },
  creditBalanceBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: responsiveWidth('3.5'),
    marginBottom: responsiveWidth('3.5'),
  },
  creditBalanceTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: responsiveWidth('2.5'),
  },
  creditBalanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: responsiveWidth('2.5'),
  },
  crownIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownIcon: {
    fontSize: 20,
  },
  creditBalanceLabel: {
    fontSize: 9,
    fontFamily: fontFamily.regular,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  creditBalanceValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  creditBalancePercent: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
  },
  creditBalanceRemaining: {
    fontSize: 10,
    fontFamily: fontFamily.regular,
  },
  planBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  planBadgeText: {
    fontSize: 9,
    fontFamily: fontFamily.bold,
    letterSpacing: 0.4,
  },
  creditProgressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: responsiveWidth('3'),
  },
  creditProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: responsiveWidth('2'),
    gap: 8,
  },
  upgradeButtonIcon: {
    fontSize: 16,
  },
  upgradeButtonText: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
  },
  profileActionRow: {
    flexDirection: 'row',
    gap: responsiveWidth('2.5'),
  },
  paymentHistoryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: responsiveWidth('2.8'),
    gap: 8,
  },
  paymentHistoryIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  paymentHistoryText: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
  },
  deleteAccountButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: responsiveWidth('2'),
    gap: 8,
  },
  deleteAccountIcon: {
    width: 16,
    height: 16,
    tintColor: '#EF4444',
    resizeMode: 'contain',
  },
  deleteAccountText: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: '#EF4444',
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth('6'),
  },
  deleteModalContainer: {
    width: '100%',
    borderRadius: 18,
    paddingHorizontal: responsiveWidth('5'),
    paddingVertical: responsiveWidth('6'),
    alignItems: 'center',
  },
  deleteModalTitle: {
    fontSize: 20,
    fontFamily: fontFamily.bold,
    color: NAVY,
    textAlign: 'center',
    marginBottom: responsiveWidth('3'),
  },
  deleteModalMessage: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: NAVY,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: responsiveWidth('5'),
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteModalYesButton: {
    flex: 1,
    backgroundColor: NAVY,
    borderRadius: 999,
    paddingVertical: responsiveWidth('3.2'),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  deleteModalYesText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
  },
  deleteModalNoButton: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: NAVY,
    paddingVertical: responsiveWidth('3.2'),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    backgroundColor: 'transparent',
  },
  deleteModalNoText: {
    color: NAVY,
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
  },
});

export default AstrologerProfileSection;
