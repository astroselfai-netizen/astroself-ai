// ReportScreen.tsx

import React, { useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  ScrollView,
  StatusBar,
  Image,
  ImageBackground,
  Alert,
  Modal,
} from 'react-native';
import {
  fontFamily,
  responsiveWidth,
  responsiveHeight,
} from '../../constant/theme';
import {
  useNavigation,
  useFocusEffect,
  NavigationProp,
} from '@react-navigation/native';
import { MainContainer } from '../../components/common/mainContainer';
import { useTheme } from '../../context/ThemeContext';
import { useProfileData } from '../../hooks/useProfileData';
import PaymentService from '../../services/payment/payment.service';
import LottieView from 'lottie-react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import { isAstrologerUser } from '../../utils/userRole';

type CancelAutopayResultModal =
  | { kind: 'success' }
  | { kind: 'error'; message: string };

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  HomeScreen: undefined;
  ContinueWithOtp: undefined;
  ForgotPasswordOtp: undefined;
  AddNewMember: undefined;
  ReportScreen: { userId: string };
  PurchasedHistoryScreen: undefined;
};

type PurchasedHistoryScreenNavigationProp = NavigationProp<RootStackParamList, 'PurchasedHistoryScreen'>;

const AUTO_PAY_PLACEHOLDER = '—';

function formatAutoPayField(value: string | null | undefined): string {
  if (value == null) {
    return AUTO_PAY_PLACEHOLDER;
  }
  const v = String(value).trim();
  if (!v || v === 'N/A' || v.toLowerCase() === 'n/a') {
    return AUTO_PAY_PLACEHOLDER;
  }
  return v;
}

const PurchasedHistoryScreen = () => {
  const { theme, colors } = useTheme();
  const navigation = useNavigation<PurchasedHistoryScreenNavigationProp>();
  const { profileData } = useProfileData();
  const user = useSelector((state: RootState) => state.app.user);
  const isAstrologer = isAstrologerUser(user);
  const activeUserId = isAstrologer ? user?._id : profileData?._id;
  const [activeTab, setActiveTab] = useState<'Purchase History' | 'Auto Payment'>(
    'Purchase History',
  );
  const [purchaseHistoryData, setPurchaseHistoryData] = useState<any[]>([]);
  const [autoPayData, setAutoPayData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingSubscription, setCancellingSubscription] = useState<string | null>(null);
  const [cancelAutopayModalSub, setCancelAutopayModalSub] = useState<any | null>(
    null,
  );
  const [cancelAutopayResultModal, setCancelAutopayResultModal] =
    useState<CancelAutopayResultModal | null>(null);
  const fetchedUserIdRef = useRef<string | null>(null);

  // Format date and time from API response - "12 Nov 2025 10:30 AM"
  const formatDateTime = useCallback((dateStr: string | null): string => {
    if (!dateStr) return 'N/A';
    
    try {
      // Handle format like "24-Dec-2025 05:43" or "29-Dec-2025 13:39"
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        // Try manual parsing for "DD-MMM-YYYY HH:MM" format
        const parts = dateStr.split(' ');
        if (parts.length >= 2) {
          const datePart = parts[0]; // "24-Dec-2025"
          const timePart = parts[1]; // "05:43"
          
          const [day, monthName, year] = datePart.split('-');
          const monthNames: { [key: string]: string } = {
            'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
            'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
            'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
          };
          const month = monthNames[monthName] || '01';
          
          const [hour, minute] = timePart.split(':');
          const hourNum = parseInt(hour, 10);
          const ampm = hourNum >= 12 ? 'PM' : 'AM';
          const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
          const displayMinute = minute.padStart(2, '0');
          
          const monthDisplayNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthDisplay = monthDisplayNames[parseInt(month, 10) - 1];
          
          return `${day} ${monthDisplay} ${year}`;
        }
        return dateStr;
      }
      
      // Format as "DD MMM YYYY HH:MM AM/PM"
      const day = date.getDate();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      const hour = date.getHours();
      const minute = date.getMinutes();
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const displayMinute = minute.toString().padStart(2, '0');
      
      return `${day} ${month} ${year} ${displayHour}:${displayMinute} ${ampm}`;
    } catch (e) {
      return dateStr;
    }
  }, []);

  // Format date only - "12 Nov 2025"
  const formatDate = useCallback((dateStr: string | null): string => {
    if (!dateStr) return 'N/A';
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        const parts = dateStr.split(' ');
        if (parts.length > 0) {
          const datePart = parts[0]; // "24-Dec-2025"
          const [day, monthName, year] = datePart.split('-');
          const monthNames: { [key: string]: string } = {
            'Jan': 'Jan', 'Feb': 'Feb', 'Mar': 'Mar', 'Apr': 'Apr',
            'May': 'May', 'Jun': 'Jun', 'Jul': 'Jul', 'Aug': 'Aug',
            'Sep': 'Sep', 'Oct': 'Oct', 'Nov': 'Nov', 'Dec': 'Dec'
          };
          return `${day} ${monthNames[monthName] || monthName} ${year}`;
        }
        return dateStr;
      }
      
      const day = date.getDate();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (e) {
      return dateStr;
    }
  }, []);

  // Format amount
  const formatAmount = useCallback((amount: any): string => {
    if (!amount) return 'N/A';
    if (Array.isArray(amount)) {
      return amount[0]?.toString() || 'N/A';
    }
    return amount.toString();
  }, []);

  // Format card info - "ICIC - Visa •••• 8242"
  const formatCardInfo = useCallback((card: any): string => {
    if (!card) return 'N/A';
    // Map issuer to bank name
    const bankMap: { [key: string]: string } = {
      'UTIB': 'ICIC',
      'HDFC': 'HDFC',
      'SBIN': 'SBI',
    };
    const bankName = bankMap[card.issuer] || card.issuer || '';
    const network = card.network || '';
    const last4 = card.last4 || '';
    return bankName && network ? `${bankName} - ${network} •••• ${last4}` : `•••• ${last4}`;
  }, []);

  const fetchPaymentData = useCallback(async () => {
    try {
      const userId = activeUserId;

      if (!userId) {
        setLoading(false);
        return;
      }

      // Prevent duplicate calls for the same user ID
      if (fetchedUserIdRef.current === userId) {
        return;
      }

      setLoading(true);
      setError(null);
      fetchedUserIdRef.current = userId;

      const paymentService = new PaymentService();

      const transformCombinedItems = (combinedItems: any[]) =>
        combinedItems.map((item: any, index: number) => {
          const planName = item.plan_name || '';
          const formattedPlanName = planName
            .split('_')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          let description = '';
          if (item.type === 'subscription') {
            if (planName === 'eternal_path' || planName.includes('premium')) {
              description = 'Annual Membership Renewal - Premium Plan';
            } else if (planName === '2999_plan' || planName === 'pro') {
              description = 'Astrologer Pro Subscription';
            } else if (planName === '4999_plan' || planName === 'premium') {
              description = 'Astrologer Premium Subscription';
            } else {
              description = `${formattedPlanName} Subscription`;
            }
          } else {
            const reportType = item.report_type || '';
            const reportTypeMap: { [key: string]: string } = {
              nakshatra: 'Nakshatra Report',
              adl: 'Antardasha Report',
              tarot: 'Tarot Card Reading',
              numerology: 'Numerology Insights',
              vedic: 'Vedic Astrology Chart',
              compatibility: 'Compatibility Analysis',
            };
            const reportDisplayName =
              reportTypeMap[reportType.toLowerCase()] || formattedPlanName || 'Report';
            description = `Purchased ${reportDisplayName}`;
          }

          const dateTime = item.verified_at || item.activated_at || null;

          return {
            id: item.unique_code || `history-${index}`,
            dateTime: formatDateTime(dateTime),
            description,
            amount: formatAmount(item.amount),
            currency: item.currency || 'INR',
            uniqueCode: item.unique_code || 'N/A',
            verifiedAt: item.verified_at,
            activatedAt: item.activated_at,
            card: item.card ? formatCardInfo(item.card) : null,
            type: item.type || 'subscription',
            planName,
            status: item.status || 'N/A',
          };
        });

      const transformSubscriptions = (subscriptions: any[]) =>
        subscriptions.map((sub: any, index: number) => ({
          id: sub.subscription_id || sub.unique_code || `autopay-${index}`,
          subscriptionId: sub.subscription_id || 'N/A',
          planName: sub.plan_name || 'N/A',
          memberName: sub.name || 'N/A',
          memberUserId: sub.member_user_id || userId,
          status: sub.status || 'N/A',
          startPlan: sub.start_plan ? formatDate(sub.start_plan) : null,
          endPlan: sub.end_plan ? formatDate(sub.end_plan) : null,
          nextRenewalDate: sub.end_plan ? formatDate(sub.end_plan) : null,
          uniqueCode: sub.unique_code || 'N/A',
          verifiedAt: sub.verified_at,
          activatedAt: sub.activated_at,
          card: sub.card ? formatCardInfo(sub.card) : null,
          type: sub.type || 'subscription',
        }));

      // Fetch Payment History
      try {
        const paymentHistoryResponse = isAstrologer
          ? await paymentService.getAstrologerPaymentHistory(userId)
          : await paymentService.getPaymentHistory(userId);

        if (paymentHistoryResponse.status === 'success' && paymentHistoryResponse.data) {
          const combinedItems = paymentHistoryResponse.data.combined_items || [];
          setPurchaseHistoryData(transformCombinedItems(combinedItems));
        } else {
          setPurchaseHistoryData([]);
        }
      } catch (err: any) {
        console.error('Error fetching payment history:', err);
        setPurchaseHistoryData([]);
      }

      // Fetch Auto Pay
      try {
        const autoPayResponse = isAstrologer
          ? await paymentService.getAstrologerAutoPay(userId)
          : await paymentService.getAutoPay(userId);

        if (autoPayResponse.status === 'success' && autoPayResponse.data) {
          const subscriptions = autoPayResponse.data.subscriptions || [];
          setAutoPayData(transformSubscriptions(subscriptions));
        } else {
          setAutoPayData([]);
        }
      } catch (err: any) {
        console.error('Error fetching auto pay:', err);
        setAutoPayData([]);
      }
    } catch (err: any) {
      console.error('Error fetching payment data:', err);
      setError(err.message || 'Failed to fetch payment data');
      Alert.alert('Error', err.message || 'Failed to fetch payment data', [
        { text: 'OK' },
        { text: 'Retry', onPress: fetchPaymentData },
      ]);
    } finally {
      setLoading(false);
    }
  }, [
    activeUserId,
    formatDate,
    formatDateTime,
    formatAmount,
    formatCardInfo,
    isAstrologer,
  ]);

  const handleCancelAutopay = useCallback((subscription: any) => {
    setCancelAutopayModalSub(subscription);
  }, []);

  const confirmCancelAutopay = useCallback(async () => {
    const subscription = cancelAutopayModalSub;
    if (!subscription) {
      return;
    }
    setCancelAutopayModalSub(null);
    try {
      setCancellingSubscription(subscription.id);
      const paymentService = new PaymentService();

      await paymentService.cancelSubscription(
        subscription.subscriptionId,
        subscription.memberUserId,
        true,
      );

      fetchedUserIdRef.current = null;
      await fetchPaymentData();
      setCancelAutopayResultModal({ kind: 'success' });
    } catch (err: any) {
      console.error('Error cancelling subscription:', err);
      setCancelAutopayResultModal({
        kind: 'error',
        message: err?.message || 'Failed to cancel subscription',
      });
    } finally {
      setCancellingSubscription(null);
    }
  }, [cancelAutopayModalSub, fetchPaymentData]);

  React.useEffect(() => {
    if (activeUserId && fetchedUserIdRef.current !== activeUserId) {
      fetchPaymentData();
    }
  }, [activeUserId, fetchPaymentData]);

  useFocusEffect(
    React.useCallback(() => {
      if (activeUserId) {
        fetchedUserIdRef.current = null;
        fetchPaymentData();
      }
    }, [activeUserId, fetchPaymentData]),
  );

  return (
    // <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
    <MainContainer>
      {/* Header */}
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent={true}
      />
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Image
            source={require('../../assets/icons/back.png')}
            style={[
              styles.backIcon,
              {
                tintColor:
                  theme === 'dark' ? colors.textPrimary : colors.DarkNavy,
              },
            ]}
          />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text
            style={[
              styles.headerTitle,
              {
                color:
                  theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
              },
            ]}
          >
            Purchase History
          </Text>
        </View>
      </View>

      <ImageBackground
        source={
          theme === 'dark'
            ? require('../../assets/image/DarkBackground.png')
            : require('../../assets/image/LightBackground.png')
        }
        blurRadius={12}
        style={[
          styles.tabsContainer,
          {
            backgroundColor:
              theme === 'dark' ? colors.transparentBg : colors.white,
            borderColor:
              theme === 'dark'
                ? colors.themeBorderDropdown
                : colors.borderColor,
          },
        ]}
        imageStyle={[
          styles.tabsBgImage,
          {
            backgroundColor:
              theme === 'dark' ? colors.transparent : colors.white,
            borderColor:
              theme === 'dark'
                ? colors.themeBorderDropdown
                : colors.borderColor,
          },
        ]}
      >
        <View style={styles.tabsOverlay} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.tabsScrollContent,
            {
              backgroundColor:
                theme === 'dark' ? colors.transparent : colors.white,
              borderColor:
                theme === 'dark'
                  ? colors.themeBorderDropdown
                  : colors.borderColor,
            },
          ]}
          style={styles.tabsScrollView}
        >
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'Purchase History' && {
                ...styles.activeTab,
                borderBottomColor:
                  theme === 'dark' ? colors.accent : colors.Orangeaccentcolor,
              },
              {
                backgroundColor:
                  theme === 'dark' ? colors.transparent : colors.white,
                borderColor:
                  theme === 'dark'
                    ? colors.themeBorderDropdown
                    : colors.borderColor,
              },
            ]}
            onPress={() => setActiveTab('Purchase History')}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: theme === 'dark' ? colors.white : colors.DarkNavy,
                },
                activeTab === 'Purchase History' && {
                  color:
                    theme === 'dark' ? colors.accent : colors.Orangeaccentcolor,
                },
              ]}
            >
              Purchase History
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'Auto Payment' && {
                ...styles.activeTab,
                borderBottomColor:
                  theme === 'dark' ? colors.accent : colors.Orangeaccentcolor,
              },
              {
                backgroundColor:
                  theme === 'dark' ? colors.transparent : colors.white,
                borderColor:
                  theme === 'dark'
                    ? colors.themeBorderDropdown
                    : colors.borderColor,
              },
            ]}
            onPress={() => setActiveTab('Auto Payment')}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: theme === 'dark' ? colors.white : colors.DarkNavy,
                },
                activeTab === 'Auto Payment' && {
                  color:
                    theme === 'dark' ? colors.accent : colors.Orangeaccentcolor,
                },
              ]}
            >
              Auto Payment
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </ImageBackground>

      {/* Main Content Card */}
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollIndicatorInsets={{ right: 1 }}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <LottieView
              source={require('../../assets/lottie/loader-Animation-1.json')}
              autoPlay
              loop
              style={styles.lottieAnimation}
            />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text
              style={[
                styles.errorText,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              {error}
            </Text>
            <TouchableOpacity
              style={[
                styles.retryButton,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.accent : colors.Orangeaccentcolor,
                },
              ]}
              onPress={fetchPaymentData}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {activeTab === 'Purchase History' && (
              <View style={[styles.tableContainer,{borderColor:
                theme === 'dark'
                  ? colors.themeBorderDropdown
                  : colors.borderColor,}]}>
                {purchaseHistoryData.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text
                      style={[
                        styles.emptyText,
                        {
                          color:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.DarkNavy,
                        },
                      ]}
                    >
                      No purchase history found
                    </Text>
                  </View>
                ) : (
                  <>
                    {/* Table Header */}
                    <View
                      style={[
                        styles.tableHeader,
                        {
                          backgroundColor: colors.DarkNavy || '#1A1F3A',
                          borderBottomWidth: 1,
                          borderBottomColor:
                            theme === 'dark'
                              ? colors.themeBorderDropdown
                              : colors.borderColor,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tableHeaderText,
                          styles.phColDate,
                          styles.phHeaderDate,
                        ]}
                      >
                        DATE & TIME
                      </Text>
                      <Text
                        style={[
                          styles.tableHeaderText,
                          styles.phColDesc,
                          styles.phHeaderDesc,
                        ]}
                      >
                        DESCRIPTION
                      </Text>
                      <Text
                        style={[
                          styles.tableHeaderText,
                          styles.phColAmount,
                          styles.phHeaderAmount,
                        ]}
                      >
                        AMOUNT
                      </Text>
                    </View>

                    {/* Table Rows */}
                    {purchaseHistoryData.map((item, index) => (
                      <View
                        key={item.id || index}
                        style={[
                          styles.tableRow,
                          {
                            backgroundColor:
                              theme === 'dark'
                                ? colors.DarkNavy
                                : colors.white,
                            borderBottomColor:
                              theme === 'dark'
                                ? colors.themeBorderDropdown
                                : colors.borderColor,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.tableCellText,
                            styles.phColDate,
                            styles.phCellDate,
                            {
                              color:
                                theme === 'dark'
                                  ? colors.themeTextWhite
                                  : colors.DarkNavy,
                            },
                          ]}
                        >
                          {item.dateTime}
                        </Text>
                        <Text
                          style={[
                            styles.tableCellText,
                            styles.phColDesc,
                            styles.phCellDesc,
                            {
                              color:
                                theme === 'dark'
                                  ? colors.themeTextWhite
                                  : colors.DarkNavy,
                            },
                          ]}
                        >
                          {item.description}
                        </Text>
                        <Text
                          style={[
                            styles.tableCellAmount,
                            styles.phColAmount,
                            styles.phCellAmount,
                            {
                              color: '#4CAF50',
                            },
                          ]}
                        >
                          {item.amount !== 'N/A' ? `₹${item.amount}` : 'N/A'}
                        </Text>
                      </View>
                    ))}
                  </>
                )}
              </View>
            )}

            {activeTab === 'Auto Payment' && (
              <View style={[styles.tableContainer,{borderColor:
                theme === 'dark'
                  ? colors.themeBorderDropdown
                  : colors.borderColor,}]}>
                {/* Filter Section */}
                {/* <View
                  style={[
                    styles.filterContainer,
                    {
                      backgroundColor:
                        theme === 'dark'
                          ? colors.transparentBg
                          : colors.white,
                      borderColor:
                        theme === 'dark'
                          ? colors.themeBorderDropdown
                          : colors.borderColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterLabel,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    Filter:
                  </Text>
                  <View style={styles.filterInputsContainer}>
                    <View
                      style={[
                        styles.filterInput,
                        {
                          backgroundColor:
                            theme === 'dark'
                              ? colors.DarkNavy
                              : colors.white,
                          borderColor:
                            theme === 'dark'
                              ? colors.themeBorderDropdown
                              : colors.borderColor,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterInputText,
                          {
                            color:
                              theme === 'dark'
                                ? colors.textSecondary || '#999'
                                : colors.textSecondary || '#666',
                          },
                        ]}
                      >
                        From Date
                      </Text>
                      <Text
                        style={[
                          styles.filterInputText,
                          {
                            color:
                              theme === 'dark'
                                ? colors.textSecondary || '#999'
                                : colors.textSecondary || '#666',
                          },
                        ]}
                      >
                        📅
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.filterInput,
                        {
                          backgroundColor:
                            theme === 'dark'
                              ? colors.DarkNavy
                              : colors.white,
                          borderColor:
                            theme === 'dark'
                              ? colors.themeBorderDropdown
                              : colors.borderColor,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterInputText,
                          {
                            color:
                              theme === 'dark'
                                ? colors.textSecondary || '#999'
                                : colors.textSecondary || '#666',
                          },
                        ]}
                      >
                        End Date
                      </Text>
                      <Text
                        style={[
                          styles.filterInputText,
                          {
                            color:
                              theme === 'dark'
                                ? colors.textSecondary || '#999'
                                : colors.textSecondary || '#666',
                          },
                        ]}
                      >
                        📅
                      </Text>
                    </View>
                  </View>
                </View> */}

                {autoPayData.length === 0 ? (
                  <View style={[styles.emptyContainer]}>
                    <Text
                      style={[
                        styles.emptyText,
                        {
                          color:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.DarkNavy,
                        },
                      ]}
                    >
                      No auto payment subscriptions found
                    </Text>
                  </View>
                ) : (
                  <>
                    {/* Table Header */}
                    <View
                      style={[
                        styles.tableHeader,
                        {
                          backgroundColor: colors.DarkNavy || '#1A1F3A',
                          borderBottomWidth: 1,
                          borderBottomColor:
                            theme === 'dark'
                              ? colors.themeBorderDropdown
                              : colors.borderColor,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tableHeaderText,
                          styles.apColName,
                          styles.apHeaderName,
                        ]}
                      >
                        NAME
                      </Text>
                      <Text
                        style={[
                          styles.tableHeaderText,
                          styles.apColRenewal,
                          styles.apHeaderRenewal,
                        ]}
                      >
                        NEXT RENEWAL
                      </Text>
                      <Text
                        style={[
                          styles.tableHeaderText,
                          styles.apColManage,
                          styles.apHeaderManage,
                        ]}
                      >
                        MANAGE
                      </Text>
                    </View>

                    {/* Table Rows */}
                    {autoPayData.map((subscription, index) => {
                      const nameDisplay = formatAutoPayField(subscription.memberName);
                      const renewalDisplay = formatAutoPayField(
                        subscription.nextRenewalDate,
                      );
                      const nameIsPlaceholder =
                        nameDisplay === AUTO_PAY_PLACEHOLDER;
                      const renewalIsPlaceholder =
                        renewalDisplay === AUTO_PAY_PLACEHOLDER;

                      return (
                        <View
                          key={subscription.id || index}
                          style={[
                            styles.tableRow,
                            styles.autoPayTableRow,
                            {
                              backgroundColor:
                                theme === 'dark'
                                  ? colors.DarkNavy
                                  : colors.white,
                              borderBottomColor:
                                theme === 'dark'
                                  ? colors.themeBorderDropdown
                                  : colors.borderColor,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.tableCellText,
                              styles.apColName,
                              styles.apCellName,
                              nameIsPlaceholder && styles.apCellMuted,
                              {
                                color: nameIsPlaceholder
                                  ? theme === 'dark'
                                    ? colors.textSecondary || '#999'
                                    : colors.textSecondary || '#666'
                                  : theme === 'dark'
                                    ? colors.themeTextWhite
                                    : colors.DarkNavy,
                              },
                            ]}
                          >
                            {nameDisplay}
                          </Text>
                          <Text
                            style={[
                              styles.tableCellText,
                              styles.apColRenewal,
                              styles.apCellRenewal,
                              renewalIsPlaceholder && styles.apCellMuted,
                              {
                                color: renewalIsPlaceholder
                                  ? theme === 'dark'
                                    ? colors.textSecondary || '#999'
                                    : colors.textSecondary || '#666'
                                  : theme === 'dark'
                                    ? colors.themeTextWhite
                                    : colors.DarkNavy,
                              },
                            ]}
                          >
                            {renewalDisplay}
                          </Text>
                          <View style={styles.autoPayActionWrap}>
                            <TouchableOpacity
                              style={[
                                styles.autoPayCancelButton,
                                {
                                  backgroundColor:
                                    String(subscription?.status || '')
                                      .trim()
                                      .toLowerCase() === 'active'
                                      ? colors.Orangeaccentcolor
                                      : theme === 'dark'
                                        ? colors.surface
                                        : colors.borderColor,
                                  borderColor:
                                    theme === 'dark'
                                      ? colors.themeBorderDropdown
                                      : colors.borderColor,
                                },
                                cancellingSubscription === subscription.id && {
                                  opacity: 0.6,
                                },
                                String(subscription?.status || '')
                                  .trim()
                                  .toLowerCase() !== 'active' && {
                                  opacity: 0.55,
                                },
                              ]}
                              onPress={() => handleCancelAutopay(subscription)}
                              disabled={
                                cancellingSubscription === subscription.id ||
                                String(subscription?.status || '')
                                  .trim()
                                  .toLowerCase() !== 'active'
                              }
                            >
                              {cancellingSubscription === subscription.id ? (
                                <LottieView
                                  source={require('../../assets/lottie/loader-Animation-1.json')}
                                  autoPlay
                                  loop
                                  style={styles.buttonLoader}
                                />
                              ) : (
                                <Text
                                  style={[
                                    styles.cancelButtonText,
                                    {
                                      color:
                                        String(subscription?.status || '')
                                          .trim()
                                          .toLowerCase() === 'active'
                                          ? colors.white
                                          : theme === 'dark'
                                            ? colors.themeTextWhite
                                            : colors.DarkNavy,
                                    },
                                  ]}
                                  numberOfLines={2}
                                >
                                  Cancel Autopay
                                </Text>
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={cancelAutopayModalSub != null}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelAutopayModalSub(null)}
      >
        <View style={styles.cancelAutopayModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setCancelAutopayModalSub(null)}
          />
          <View
            style={[
              styles.cancelAutopayModalCard,
              {
                backgroundColor:
                  theme === 'dark' ? colors.DarkNavy : colors.white,
              },
            ]}
          >
            <Text
              style={[
                styles.cancelAutopayModalTitle,
                {
                  color:
                    theme === 'dark'
                      ? colors.themeTextWhite
                      : colors.DarkNavy,
                },
              ]}
            >
              Cancel Autopay
            </Text>
            <Text
              style={[
                styles.cancelAutopayModalMessage,
                {
                  color:
                    theme === 'dark'
                      ? colors.themeTextWhite
                      : colors.DarkNavy,
                },
              ]}
            >
              Are you sure you want to cancel the autopay subscription for{' '}
              {cancelAutopayModalSub &&
              formatAutoPayField(cancelAutopayModalSub.memberName) !==
                AUTO_PAY_PLACEHOLDER
                ? formatAutoPayField(cancelAutopayModalSub.memberName)
                : 'this subscription'}
              ?
            </Text>
            <View style={styles.cancelAutopayModalButtons}>
              <TouchableOpacity
                style={[
                  styles.cancelAutopayModalBtn,
                  styles.cancelAutopayModalBtnSecondary,
                  {
                    borderColor:
                      theme === 'dark'
                        ? colors.themeBorderDropdown
                        : colors.borderColor,
                  },
                ]}
                onPress={() => setCancelAutopayModalSub(null)}
              >
                <Text
                  style={[
                    styles.cancelAutopayModalBtnText,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  No
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.cancelAutopayModalBtn,
                  styles.cancelAutopayModalBtnPrimary,
                  { backgroundColor: colors.Orangeaccentcolor },
                ]}
                onPress={confirmCancelAutopay}
              >
                <Text
                  style={[
                    styles.cancelAutopayModalBtnText,
                    { color: '#FFFFFF' },
                  ]}
                >
                  Yes, Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={cancelAutopayResultModal != null}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelAutopayResultModal(null)}
      >
        <View style={styles.cancelAutopayModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setCancelAutopayResultModal(null)}
          />
          <View
            style={[
              styles.cancelAutopayModalCard,
              {
                backgroundColor:
                  theme === 'dark' ? colors.DarkNavy : colors.white,
              },
            ]}
          >
            <Text
              style={[
                styles.cancelAutopayModalTitle,
                {
                  color:
                    cancelAutopayResultModal?.kind === 'error'
                      ? colors.Orangeaccentcolor
                      : theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                },
              ]}
            >
              {cancelAutopayResultModal?.kind === 'error' ? 'Error' : 'Success'}
            </Text>
            <Text
              style={[
                styles.cancelAutopayModalMessage,
                {
                  color:
                    theme === 'dark'
                      ? colors.themeTextWhite
                      : colors.DarkNavy,
                },
              ]}
            >
              {cancelAutopayResultModal?.kind === 'success'
                ? 'Autopay subscription cancelled successfully.'
                : cancelAutopayResultModal?.kind === 'error'
                  ? cancelAutopayResultModal.message
                  : ''}
            </Text>
            <TouchableOpacity
              style={[
                styles.cancelAutopayModalBtn,
                styles.cancelAutopayModalBtnPrimary,
                styles.cancelAutopayModalBtnFullWidth,
                { backgroundColor: colors.Orangeaccentcolor },
              ]}
              onPress={() => setCancelAutopayResultModal(null)}
            >
              <Text
                style={[
                  styles.cancelAutopayModalBtnText,
                  { color: '#FFFFFF' },
                ]}
              >
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </MainContainer>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'android' ? 60 : 60,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop:
      Platform.OS === 'android'
        ? responsiveHeight('0.5%')
        : responsiveWidth('12%'),
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
    position: 'relative',
    minHeight: 50,
  },
  backBtn: {
    // position: 'absolute',
    left: responsiveWidth('2'),
    // padding: 8,
    // top:
    //   Platform.OS === 'android'
    //     ? responsiveWidth('11.5%')
    //     : responsiveWidth('1.5%'),
    // zIndex: 1,
  },
  backIcon: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    resizeMode: 'contain',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  // Tab Styles - Matching ChatScreen
  tabsContainer: {
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#EEE5CA',
    overflow: 'hidden',
    marginBottom: responsiveHeight(2),
    marginHorizontal: responsiveWidth(3),
  },
  tabsBgImage: {
    borderRadius: 10,
    opacity: 0.7,
  },
  tabsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabsScrollView: {
    position: 'relative',
    zIndex: 1,
  },
  tabsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(3),
  },
  tab: {
    paddingVertical: responsiveWidth(2),
    paddingHorizontal: responsiveWidth(1.5),
    alignItems: 'center',
    minWidth: responsiveWidth(43.5),
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#F2994A', // This will be overridden by theme colors
  },
  tabText: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    lineHeight: 27,
    letterSpacing: -0.45,
  },
  price: {
    fontSize: 36,
    fontFamily: fontFamily.bold,
    marginRight: 8,
  },

  modalOverlay: {
    flex: 1,
    // backgroundColor: 'transparent',
    justifyContent: 'flex-start',
    overflow: 'hidden',
    alignItems: 'center',
    paddingTop:
      Platform.OS === 'ios' ? responsiveWidth('40') : responsiveHeight('12'),
  },
  // Purchased Report cards styles (matching image design)
  purchasedReportsContainer: {
    marginHorizontal: responsiveWidth(3),
    paddingVertical: responsiveWidth(2),
  },
  purchasedReportCardImageBackground: {
    borderRadius: 10,
    marginBottom: responsiveWidth(4),
    overflow: 'hidden',
  },
  purchasedReportCardImageStyle: {
    borderRadius: 10,
    opacity: 0.2,
  },
  purchasedReportCard: {
    borderRadius: 10,
    padding: responsiveWidth(3),
    borderWidth: 0.2,
    // minHeight: responsiveWidth(35),
  },
  purchasedReportTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    // marginBottom: responsiveWidth(1),
  },
  purchasedReportUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkmarkIconContainer: {
    width: responsiveWidth(6),
    height: responsiveWidth(6),
    borderRadius: responsiveWidth(3),
    // backgroundColor: '#DF8A5D',
    // alignItems: 'center',
    justifyContent: 'center',
    // marginRight: responsiveWidth(2),
  },
  checkmarkIcon: {
    width: responsiveWidth(3.5),
    height: responsiveWidth(3.5),
    tintColor: '#FFFFFF',
  },
  purchasedReportUserName: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '700',
    flex: 1,
  },
  purchasedReportPrice: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    fontWeight: '500',
  },
  purchasedReportMiddleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    // marginTop: responsiveWidth(2),
  },
  purchasedReportLeftSection: {
    flex: 1,
    marginLeft: responsiveWidth(6),
    // flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: responsiveWidth(1),
  },

  purchasedReportLeftSectionh: {
    flex: 1,
    marginLeft: responsiveWidth(6),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: responsiveWidth(2),
  },
  statusMembersRow: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  purchasedReportTitle: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    // marginBottom: responsiveWidth(1),
  },
  purchasedReportDate: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
  },
  purchasedReportDownloadButton: {
    backgroundColor: '#DF8A5D',
    borderRadius: 8,
    paddingVertical: responsiveWidth(2),
    paddingHorizontal: responsiveWidth(3),
    alignSelf: 'flex-start',
  },
  purchasedReportDownloadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
  },
  // Report cards styles (available reports)
  reportsContainer: {
    marginHorizontal: responsiveWidth(3),
    paddingVertical: responsiveWidth(2),
  },
  reportsContainerpurchased: {
    // flex: 1,
    marginTop: responsiveWidth(30),
    justifyContent: 'center',
    alignItems: 'center',
    // marginHorizontal: responsiveWidth(3),
    // paddingVertical: responsiveWidth(2),
  },
  reportCardImageBackground: {
    borderRadius: 16,
    marginBottom: responsiveWidth(5),
    overflow: 'hidden',
    // opacity: 0.6,
  },
  reportCardImageStyle: {
    borderRadius: 16,
    opacity: 0.2,
  },
  reportCard: {
    borderRadius: 16,
    padding: responsiveWidth(4),
    borderWidth: 0.2,
    // opacity: 0.6,
    // borderColor: 'rgba(255, 255, 255, 0.1)',
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 4,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 8,
    // elevation: 8,
  },
  reportTitle: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
    marginBottom: responsiveWidth(1),
    fontWeight: '700',
  },
  // Table Styles
  tableContainer: {
    marginHorizontal: responsiveWidth(3),
    marginTop: responsiveWidth(2),
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    overflow: 'hidden',
    paddingVertical: responsiveWidth(3),
    paddingHorizontal: responsiveWidth(3),
    backgroundColor: '#1A1F3A',
  },
  tableHeaderText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: responsiveWidth(3),
    paddingHorizontal: responsiveWidth(3),
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  tableCellText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
  },
  tableCellAmount: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
  },
  /** Purchase History table — same flex + padding on header and rows */
  phColDate: {
    flex: 1.2,
    minWidth: 0,
    paddingRight: responsiveWidth(2),
  },
  phColDesc: {
    flex: 2,
    minWidth: 0,
    paddingRight: responsiveWidth(2),
  },
  phColAmount: {
    flex: 1,
    minWidth: 0,
  },
  phHeaderDate: {
    textAlign: 'left',
  },
  phHeaderDesc: {
    textAlign: 'left',
  },
  phHeaderAmount: {
    textAlign: 'right',
    width: '100%',
  },
  phCellDate: {
    textAlign: 'left',
  },
  phCellDesc: {
    textAlign: 'left',
  },
  phCellAmount: {
    textAlign: 'right',
    width: '100%',
  },
  /** Auto Payment table (3 columns: name, next renewal, manage) */
  autoPayTableRow: {
    alignItems: 'flex-start',
  },
  apColName: {
    flex: 1.15,
    minWidth: 0,
    paddingRight: responsiveWidth(2),
  },
  apColRenewal: {
    flex: 1.25,
    minWidth: 0,
    paddingRight: responsiveWidth(2),
  },
  apColManage: {
    flex: 1,
    minWidth: 0,
  },
  apHeaderName: {
    textAlign: 'left',
  },
  apHeaderRenewal: {
    textAlign: 'left',
  },
  apHeaderManage: {
    textAlign: 'right',
    width: '100%',
  },
  apCellName: {
    textAlign: 'left',
  },
  apCellRenewal: {
    textAlign: 'left',
  },
  apCellMuted: {
    fontStyle: 'italic',
  },
  autoPayActionWrap: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  autoPayCancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveWidth(1.5),
    paddingHorizontal: responsiveWidth(2),
    borderRadius: 6,
    borderWidth: 1,
    minWidth: responsiveWidth(28),
    alignSelf: 'flex-end',
    maxWidth: '100%',
  },
  // Filter Styles
  filterContainer: {
    marginHorizontal: responsiveWidth(3),
    marginTop: responsiveWidth(2),
    marginBottom: responsiveWidth(3),
    padding: responsiveWidth(3),
    borderRadius: 12,
    borderWidth: 1,
  },
  filterLabel: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    marginBottom: responsiveWidth(2),
  },
  filterInputsContainer: {
    flexDirection: 'row',
    gap: responsiveWidth(2),
  },
  filterInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: responsiveWidth(2.5),
    paddingHorizontal: responsiveWidth(3),
    borderRadius: 8,
    borderWidth: 1,
  },
  filterInputText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
  },
  // Action Button Styles
  actionButtonsContainer: {
    flexDirection: 'column',
    gap: responsiveWidth(2),
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveWidth(1.5),
    paddingHorizontal: responsiveWidth(2),
    borderRadius: 6,
    borderWidth: 1,
    minWidth: responsiveWidth(25),
    width: '100%',
  },
  changeCardButton: {
    // Grey button
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  actionButtonText: {
    fontSize: 10,
    fontFamily: fontFamily.regular,
    fontWeight: '500',
    textAlign: 'center',
  },
  cancelButtonText: {
    fontSize: 10,
    fontFamily: fontFamily.regular,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  buttonLoader: {
    width: responsiveWidth(6),
    height: responsiveWidth(6),
  },
  checkIcon: {
    width: responsiveWidth(4),
    height: responsiveWidth(4),
    marginTop: responsiveWidth(1),
    resizeMode: 'contain',
    marginRight: responsiveWidth(2),
  },
  buyNowButton: {
    borderRadius: 10,
    paddingVertical: responsiveWidth(3),
    paddingHorizontal: responsiveWidth(6),
    marginHorizontal: responsiveWidth(15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: responsiveHeight(10),
  },
  lottieAnimation: {
    width: responsiveWidth('70'),
    height: responsiveWidth('70'),
  },
  loadingText: {
    marginTop: responsiveWidth(3),
    fontSize: 16,
    fontFamily: fontFamily.regular,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: responsiveHeight(10),
    paddingHorizontal: responsiveWidth(5),
  },
  errorText: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    marginBottom: responsiveWidth(4),
  },
  retryButton: {
    borderRadius: 8,
    paddingVertical: responsiveWidth(2.5),
    paddingHorizontal: responsiveWidth(6),
    minWidth: responsiveWidth(20),
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: responsiveHeight(10),
  },
  emptyText: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  cancelAutopayModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: responsiveWidth(5),
  },
  cancelAutopayModalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: responsiveWidth(5),
  },
  cancelAutopayModalTitle: {
    fontSize: 18,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    marginBottom: responsiveWidth(3),
    textAlign: 'center',
  },
  cancelAutopayModalMessage: {
    fontSize: 15,
    fontFamily: fontFamily.regular,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: responsiveWidth(5),
  },
  cancelAutopayModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: responsiveWidth(3),
  },
  cancelAutopayModalBtn: {
    // flex: 1,
    flexGrow: 1,
    paddingVertical: responsiveWidth(2.5),
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelAutopayModalBtnSecondary: {
    borderWidth: 1,
  },
  cancelAutopayModalBtnPrimary: {},
  cancelAutopayModalBtnFullWidth: {
    width: '100%',
  },
  cancelAutopayModalBtnText: {
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
  },
});

export default PurchasedHistoryScreen;
