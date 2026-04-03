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
import Toast from 'react-native-toast-message';

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

const PurchasedHistoryScreen = () => {
  const { theme, colors } = useTheme();
  const navigation = useNavigation<PurchasedHistoryScreenNavigationProp>();
  const { profileData } = useProfileData();
  const [activeTab, setActiveTab] = useState<'Purchase History' | 'Auto Payment'>(
    'Purchase History',
  );
  const [purchaseHistoryData, setPurchaseHistoryData] = useState<any[]>([]);
  const [autoPayData, setAutoPayData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingSubscription, setCancellingSubscription] = useState<string | null>(null);
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
          
          return `${day} ${monthDisplay} ${year} ${displayHour}:${displayMinute} ${ampm}`;
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

  // Fetch payment history and auto pay
  const fetchPaymentData = useCallback(async () => {
    try {
      // Get user ID from profileData
      const userId = profileData?._id;
      
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

      // Fetch Payment History
      try {
        const paymentHistoryResponse = await paymentService.getPaymentHistory(userId);

        console.log('paymentHistoryResponse--?>', paymentHistoryResponse);
        if (paymentHistoryResponse.status === 'success' && paymentHistoryResponse.data) {
          const combinedItems = paymentHistoryResponse.data.combined_items || [];
          const transformedHistory = combinedItems.map((item: any, index: number) => {
            // Format plan name for display
            const planName = item.plan_name || '';
            const formattedPlanName = planName
              .split('_')
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            
            // Generate description - for subscriptions show "Annual Membership Renewal - Premium Plan"
            // For reports show "Purchased Nakshatra Report for Member Name"
            let description = '';
            if (item.type === 'subscription') {
              if (planName === 'eternal_path' || planName.includes('premium')) {
                description = `Annual Membership Renewal - Premium Plan`;
              } else {
                description = `${formattedPlanName} Subscription`;
              }
            } else {
              // For reports, we need to check if there's a report_type or similar
              const reportType = item.report_type || '';
              const reportTypeMap: { [key: string]: string } = {
                'nakshatra': 'Nakshatra Report',
                'adl': 'Antardasha Report',
                'tarot': 'Tarot Card Reading',
                'numerology': 'Numerology Insights',
                'vedic': 'Vedic Astrology Chart',
                'compatibility': 'Compatibility Analysis',
              };
              const reportDisplayName = reportTypeMap[reportType.toLowerCase()] || formattedPlanName || 'Report';
              description = `Purchased ${reportDisplayName}`;
            }
            
            // Get date time - prefer verified_at, then activated_at
            const dateTime = item.verified_at || item.activated_at || null;
            
            return {
              id: item.unique_code || `history-${index}`,
              dateTime: formatDateTime(dateTime),
              description: description,
              amount: formatAmount(item.amount),
              currency: item.currency || 'INR',
              uniqueCode: item.unique_code || 'N/A',
              verifiedAt: item.verified_at,
              activatedAt: item.activated_at,
              card: item.card ? formatCardInfo(item.card) : null,
              type: item.type || 'subscription',
              planName: planName,
              status: item.status || 'N/A',
            };
          });
          setPurchaseHistoryData(transformedHistory);
        }
      } catch (err: any) {
        console.error('Error fetching payment history:', err);
        setPurchaseHistoryData([]);
      }

      // Fetch Auto Pay
      try {
        const autoPayResponse = await paymentService.getAutoPay(userId);
        if (autoPayResponse.status === 'success' && autoPayResponse.data) {
          const subscriptions = autoPayResponse.data.subscriptions || [];
          const transformedAutoPay = subscriptions.map((sub: any, index: number) => ({
            id: sub.subscription_id || sub.unique_code || `autopay-${index}`,
            subscriptionId: sub.subscription_id || 'N/A',
            planName: sub.plan_name || 'N/A',
            memberName: sub.name || 'N/A',
            memberUserId: sub.member_user_id || 'N/A',
            status: sub.status || 'N/A',
            startPlan: formatDate(sub.start_plan),
            endPlan: formatDate(sub.end_plan),
            validityDate: `${formatDate(sub.start_plan)} - ${formatDate(sub.end_plan)}`,
            uniqueCode: sub.unique_code || 'N/A',
            verifiedAt: sub.verified_at,
            activatedAt: sub.activated_at,
            card: sub.card ? formatCardInfo(sub.card) : null,
            type: sub.type || 'subscription',
          }));
          setAutoPayData(transformedAutoPay);
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
  }, [profileData?._id, formatDate, formatDateTime, formatAmount, formatCardInfo]);

  // Handle Cancel Autopay
  const handleCancelAutopay = useCallback(async (subscription: any) => {
    Alert.alert(
      'Cancel Autopay',
      `Are you sure you want to cancel the autopay subscription for ${subscription.memberName}?`,
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancellingSubscription(subscription.id);
              const paymentService = new PaymentService();
              
              await paymentService.cancelSubscription(
                subscription.subscriptionId,
                subscription.memberUserId,
                true, // cancel_immediately
              );

              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Autopay subscription cancelled successfully',
                position: 'top',
                topOffset: 60,
                visibilityTime: 3000,
              });

              // Refresh data
              fetchedUserIdRef.current = null;
              await fetchPaymentData();
            } catch (err: any) {
              console.error('Error cancelling subscription:', err);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: err.message || 'Failed to cancel subscription',
                position: 'top',
                topOffset: 60,
                visibilityTime: 3000,
              });
            } finally {
              setCancellingSubscription(null);
            }
          },
        },
      ],
    );
  }, [fetchPaymentData]);

  // Fetch data when profileData becomes available or changes
  React.useEffect(() => {
    if (profileData?._id && fetchedUserIdRef.current !== profileData._id) {
      fetchPaymentData();
    }
  }, [profileData?._id, fetchPaymentData]);

  // Fetch data when screen comes into focus (only if profileData is available)
  useFocusEffect(
    React.useCallback(() => {
      console.log('Purchased History screen focused, fetching payment data...');
      if (profileData?._id) {
        // Reset the ref to allow refetch on focus
        fetchedUserIdRef.current = null;
        fetchPaymentData();
      }
    }, [profileData?._id, fetchPaymentData]),
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
                      <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>
                        DATE & TIME
                      </Text>
                      <Text style={[styles.tableHeaderText, { flex: 2 }]}>
                        DESCRIPTION
                      </Text>
                      <Text
                        style={[
                          styles.tableHeaderText,
                          { flex: 1, textAlign: 'right' },
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
                            {
                              flex: 1,
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
                            {
                              flex: 2,
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
                            {
                              flex: 1,
                              textAlign: 'right',
                              color: '#4CAF50', // Green color for amount
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
                      <Text style={[styles.tableHeaderText, { flex: 1 }]}>
                        NAME
                      </Text>
                      <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>
                        VALIDITY DATE
                      </Text>
                      <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>
                        LINKED CARD
                      </Text>
                      <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>
                        ACTION
                      </Text>
                    </View>

                    {/* Table Rows */}
                    {autoPayData.map((subscription, index) => (
                      <View
                        key={subscription.id || index}
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
                            {
                              flex: 1,
                              color:
                                theme === 'dark'
                                  ? colors.themeTextWhite
                                  : colors.DarkNavy,
                            },
                          ]}
                        >
                          {subscription.memberName}
                        </Text>
                        <Text
                          style={[
                            styles.tableCellText,
                            {
                              flex: 1.5,
                              color:
                                theme === 'dark'
                                  ? colors.themeTextWhite
                                  : colors.DarkNavy,
                            },
                          ]}
                        >
                          {subscription.validityDate}
                        </Text>
                        <View
                          style={{
                            flex: 1.5,
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}
                        >
                          {subscription.card && subscription.card !== 'N/A' ? (
                            <>
                              <Text
                                style={[
                                  styles.tableCellText,
                                  {
                                    color:
                                      theme === 'dark'
                                        ? colors.themeTextWhite
                                        : colors.DarkNavy,
                                  },
                                ]}
                              >
                                💳 {subscription.card}
                              </Text>
                            </>
                          ) : (
                            <Text
                              style={[
                                styles.tableCellText,
                                {
                                  color:
                                    theme === 'dark'
                                      ? colors.textSecondary || '#999'
                                      : colors.textSecondary || '#666',
                                },
                              ]}
                            >
                              N/A
                            </Text>
                          )}
                        </View>
                        <View
                          style={[
                            styles.actionButtonsContainer,
                            {
                              flex: 1.5,
                            },
                          ]}
                        >
                          {/* <TouchableOpacity
                            style={[
                              styles.actionButton,
                              styles.changeCardButton,
                              {
                                backgroundColor:
                                  theme === 'dark'
                                    ? colors.transparentBg
                                    : '#F5F5F5',
                                borderColor:
                                  theme === 'dark'
                                    ? colors.themeBorderDropdown
                                    : colors.borderColor,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.actionButtonText,
                                {
                                  color:
                                    theme === 'dark'
                                      ? colors.themeTextWhite
                                      : colors.DarkNavy,
                                },
                              ]}
                              numberOfLines={2}
                            >
                              Change Card
                            </Text>
                          </TouchableOpacity> */}
                          <TouchableOpacity
                            style={[
                              styles.actionButton,
                              // styles.cancelButton,
                              {
                                backgroundColor:
                                  theme === 'dark'
                                    ? colors.Orangeaccentcolor
                                    : colors.Orangeaccentcolor,
                                borderColor:
                                  theme === 'dark'
                                    ? colors.themeBorderDropdown
                                    : colors.borderColor,
                              },

                              cancellingSubscription === subscription.id && {
                                opacity: 0.6,
                              },
                            ]}
                            onPress={() => handleCancelAutopay(subscription)}
                            disabled={
                              cancellingSubscription === subscription.id
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
                                style={styles.cancelButtonText}
                                numberOfLines={2}
                              >
                                Cancel Autopay
                              </Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
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
});

export default PurchasedHistoryScreen;
