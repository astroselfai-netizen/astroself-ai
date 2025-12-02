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
  const { membersData, profileData } = useProfileData();
  const [activeTab, setActiveTab] = useState<'Reports' | 'Memberships'>(
    'Reports',
  );
  const [purchasedReportsData, setPurchasedReportsData] = useState<any[]>([]);
  const [purchasedMembershipsData, setPurchasedMembershipsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedUserIdRef = useRef<string | null>(null);

  // Map report types to display names
  const getReportTypeDisplayName = (reportType: string): string => {
    const reportTypeMap: { [key: string]: string } = {
      nakshatra: 'Nakshatra Report',
      adl: 'Antardasha Report',
      tarot: 'Tarot Card Reading',
      numerology: 'Numerology Insights',
      vedic: 'Vedic Astrology Chart',
      compatibility: 'Compatibility Analysis',
    };
    return reportTypeMap[reportType.toLowerCase()] || `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;
  };

  // Format date from API response
  const formatDate = useCallback((dateStr: string | null): string => {
    if (!dateStr) return 'N/A';
    
    // Handle format like "13-Nov-2025 09:56" or "13-Nov-2025"
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        // Try parsing with moment or manual parsing
        const parts = dateStr.split(' ');
        if (parts.length > 0) {
          return parts[0]; // Return "13-Nov-2025" format
        }
        return dateStr;
      }
      
      // Format as "DD MMM YYYY"
      const day = date.getDate();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (e) {
      return dateStr;
    }
  }, []);

  // Get member name from user_id
  const getMemberName = useCallback((userId: string): string => {
    if (!membersData || membersData.length === 0) {
      return 'User Report';
    }
    
    const member = membersData.find(
      (m: any) => (m.id || m._id) === userId
    );
    
    if (member) {
      const firstName = member.first_name || '';
      const lastName = member.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim();
      return fullName || member.full_name || 'User Report';
    }
    
    return 'User Report';
  }, [membersData]);

  // Fetch payment details
  const fetchPaymentDetails = useCallback(async () => {
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
      const response = await paymentService.getPaymentDetails(userId);

      if (response.status && response.data) {
        // Transform reports data
        const reports = response.data.reports || [];
        const transformedReports = reports.map((report: any, index: number) => ({
          id: report.order_id || report.payment_id || `report-${index}`,
          userReportName: getMemberName(report.user_id),
          title: getReportTypeDisplayName(report.report_type),
          date: formatDate(report.created_at),
          price: report.amount?.toString() || '0',
          status: report.status,
          orderId: report.order_id,
          paymentId: report.payment_id,
        }));

        setPurchasedReportsData(transformedReports);

        // Transform subscription data
        const subscription = response.data.subscription;
        if (subscription) {
          const transformedMemberships = [
            {
              id: subscription.payment_id || 'membership-1',
              membershipName: subscription.plan_name || 'Current Plan',
              membershipType: subscription.plan_name || 'Active Membership',
              dateRange: `${formatDate(
                subscription.start_plan_time,
              )} to ${formatDate(subscription.end_plan_time)}`,
              price: subscription.amount?.toString() || '0',
              status: subscription.status,
              paymentId: subscription.payment_id,
              members: subscription.members || 0,
              startPlanTime: subscription.start_plan_time,
              endPlanTime: subscription.end_plan_time,
              planName: subscription.plan_name,
              amount: subscription.amount,
            },
          ];
          setPurchasedMembershipsData(transformedMemberships);
        } else {
          setPurchasedMembershipsData([]);
        }
      }
    } catch (err: any) {
      console.error('Error fetching payment details:', err);
      setError(err.message || 'Failed to fetch payment details');
      Alert.alert('Error', err.message || 'Failed to fetch payment details', [
        { text: 'OK' },
        { text: 'Retry', onPress: fetchPaymentDetails },
      ]);
    } finally {
      setLoading(false);
    }
  }, [profileData?._id, getMemberName, formatDate]);

  // Fetch data when profileData becomes available or changes
  React.useEffect(() => {
    if (profileData?._id && fetchedUserIdRef.current !== profileData._id) {
      fetchPaymentDetails();
    }
  }, [profileData?._id, fetchPaymentDetails]);

  // Fetch data when screen comes into focus (only if profileData is available)
  useFocusEffect(
    React.useCallback(() => {
      console.log('Purchased History screen focused, fetching payment details...');
      if (profileData?._id) {
        // Reset the ref to allow refetch on focus
        if (fetchedUserIdRef.current !== profileData._id) {
          fetchPaymentDetails();
        }
      }
    }, [profileData?._id, fetchPaymentDetails]),
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
            Purchased History
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
              activeTab === 'Reports' && {
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
            onPress={() => setActiveTab('Reports')}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: theme === 'dark' ? colors.white : colors.DarkNavy,
                },
                activeTab === 'Reports' && {
                  color:
                    theme === 'dark' ? colors.accent : colors.Orangeaccentcolor,
                },
              ]}
            >
              Reports
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'Memberships' && {
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
            onPress={() => setActiveTab('Memberships')}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: theme === 'dark' ? colors.white : colors.DarkNavy,
                },
                activeTab === 'Memberships' && {
                  color:
                    theme === 'dark' ? colors.accent : colors.Orangeaccentcolor,
                },
              ]}
            >
              Memberships
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
              onPress={fetchPaymentDetails}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {activeTab === 'Reports' && (
              <View style={styles.purchasedReportsContainer}>
                {purchasedReportsData.length === 0 ? (
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
                      No purchased reports found
                    </Text>
                  </View>
                ) : (
                  purchasedReportsData.map(report => (
                    <ImageBackground
                      blurRadius={12}
                      key={report.id}
                      source={
                        theme === 'dark'
                          ? require('../../assets/image/DarkBackground.png')
                          : require('../../assets/image/LightBackground.png')
                      }
                      style={[
                        styles.purchasedReportCardImageBackground,
                        {
                          backgroundColor:
                            theme === 'dark'
                              ? colors.transparentBg
                              : colors.white,
                          borderColor:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.borderColor,
                        },
                      ]}
                      imageStyle={[
                        styles.purchasedReportCardImageStyle,
                        {
                          backgroundColor:
                            theme === 'dark'
                              ? colors.transparentBg
                              : colors.white,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.purchasedReportCard,
                          {
                            backgroundColor:
                              theme === 'dark'
                                ? colors.transparentBg
                                : colors.white,
                            borderColor:
                              theme === 'dark'
                                ? colors.themeTextWhite
                                : colors.borderColor,
                          },
                        ]}
                      >
                        {/* Top Row: User Name + Price */}
                        <View style={styles.purchasedReportTopRow}>
                          {/* Left: Checkmark Icon + User Report Name */}
                          <View style={styles.purchasedReportUserInfo}>
                            <View style={styles.checkmarkIconContainer}>
                              <Image
                                source={require('../../assets/icons/checkIcon.png')}
                                resizeMode="contain"
                                style={styles.checkmarkIcon}
                                tintColor={
                                  theme === 'dark'
                                    ? colors.Orangeaccentcolor
                                    : colors.Orangeaccentcolor
                                }
                              />
                            </View>
                            <Text
                              style={[
                                styles.purchasedReportUserName,
                                {
                                  color:
                                    theme === 'dark'
                                      ? colors.themeTextWhite
                                      : colors.DarkNavy,
                                },
                              ]}
                            >
                              {report.userReportName}
                            </Text>
                          </View>

                          {/* Right: Price */}
                          <Text
                            style={[
                              styles.purchasedReportPrice,
                              {
                                color:
                                  theme === 'dark'
                                    ? colors.themeTextWhite
                                    : colors.DarkNavy,
                              },
                            ]}
                          >
                            ₹ {report.price}
                          </Text>
                        </View>

                        {/* Middle Row: Report Title + Date (Left) and Download Button (Right) */}
                        <View style={styles.purchasedReportMiddleRow}>
                          {/* Left: Title and Date */}
                          <View style={styles.purchasedReportLeftSectionh}>
                            <Text
                              style={[
                                styles.purchasedReportTitle,
                                {
                                  color:
                                    theme === 'dark'
                                      ? colors.themeTextWhite
                                      : colors.DarkNavy,
                                },
                              ]}
                            >
                              {report.title}
                            </Text>
                            <Text
                              style={[
                                styles.purchasedReportDate,
                                {
                                  color:
                                    theme === 'dark'
                                      ? colors.themeTextWhite
                                      : colors.DarkNavy,
                                },
                              ]}
                            >
                              {report.date}
                            </Text>
                          </View>

                          {/* Right: Download Button */}
                          {/* <TouchableOpacity
                      style={styles.purchasedReportDownloadButton}
                      onPress={() => {
                        // Handle download
                        console.log('Download report:', report.id);
                      }}
                    >
                      <Text style={styles.purchasedReportDownloadButtonText}>
                        Download
                      </Text>
                    </TouchableOpacity> */}
                        </View>
                      </View>
                    </ImageBackground>
                  ))
                )}
              </View>
            )}

            {activeTab === 'Memberships' && (
              <View style={styles.purchasedReportsContainer}>
                {purchasedMembershipsData.length === 0 ? (
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
                      No active memberships found
                    </Text>
                  </View>
                ) : (
                  purchasedMembershipsData.map(membership => (
                    <ImageBackground
                      blurRadius={12}
                      key={membership.id}
                      source={
                        theme === 'dark'
                          ? require('../../assets/image/DarkBackground.png')
                          : require('../../assets/image/LightBackground.png')
                      }
                      style={[
                        styles.purchasedReportCardImageBackground,
                        {
                          backgroundColor:
                            theme === 'dark'
                              ? colors.transparentBg
                              : colors.white,
                          borderColor:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.borderColor,
                        },
                      ]}
                      imageStyle={[
                        styles.purchasedReportCardImageStyle,
                        {
                          backgroundColor:
                            theme === 'dark'
                              ? colors.transparentBg
                              : colors.white,
                          borderColor:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.borderColor,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.purchasedReportCard,
                          {
                            backgroundColor:
                              theme === 'dark'
                                ? colors.transparentBg
                                : colors.white,
                            borderColor:
                              theme === 'dark'
                                ? colors.themeTextWhite
                                : colors.borderColor,
                          },
                        ]}
                      >
                        {/* Top Row: Membership Name + Price */}
                        <View style={styles.purchasedReportTopRow}>
                          {/* Left: Checkmark Icon + Membership Name */}
                          <View style={styles.purchasedReportUserInfo}>
                            <View style={styles.checkmarkIconContainer}>
                              <Image
                                source={require('../../assets/icons/checkIcon.png')}
                                resizeMode="contain"
                                style={styles.checkmarkIcon}
                                tintColor={
                                  theme === 'dark'
                                    ? colors.Orangeaccentcolor
                                    : colors.Orangeaccentcolor
                                }
                              />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={[
                                  styles.purchasedReportUserName,
                                  {
                                    color:
                                      theme === 'dark'
                                        ? colors.themeTextWhite
                                        : colors.DarkNavy,
                                  },
                                ]}
                              >
                                payment id: {membership.paymentId}
                              </Text>
                            </View>
                          </View>

                          {/* Right: Price */}
                          <Text
                            style={[
                              styles.purchasedReportPrice,
                              {
                                color:
                                  theme === 'dark'
                                    ? colors.themeTextWhite
                                    : colors.DarkNavy,
                                fontSize: 20,
                              },
                            ]}
                          >
                            ₹ {membership.amount || membership.price}
                          </Text>
                        </View>

                        {/* Middle Row: Membership Details + Date Range (Left) and Renew Button (Right) */}
                        <View style={styles.purchasedReportMiddleRow}>
                          {/* Left: Details and Date Range */}
                          <View style={styles.purchasedReportLeftSection}>
                            <View style={styles.statusMembersRow}>
                              <Text
                                style={[
                                  styles.purchasedReportTitle,
                                  {
                                    color:
                                      theme === 'dark'
                                        ? colors.themeTextWhite
                                        : colors.DarkNavy,
                                  },
                                ]}
                              >
                                Status: {membership.status}
                              </Text>
                              <Text
                                style={[
                                  styles.purchasedReportTitle,
                                  {
                                    color:
                                      theme === 'dark'
                                        ? colors.themeTextWhite
                                        : colors.DarkNavy,
                                    marginLeft: responsiveWidth(25),
                                  },
                                ]}
                              >
                                Members: {membership.members || 0}
                              </Text>
                            </View>
                            <Text
                              style={[
                                styles.purchasedReportDate,
                                {
                                  color:
                                    theme === 'dark'
                                      ? colors.themeTextWhite
                                      : colors.DarkNavy,
                                },
                              ]}
                            >
                              Active from: {membership.dateRange}
                            </Text>
                          </View>

                          {/* Right: Renew Button */}
                          {/* <TouchableOpacity
                      style={styles.purchasedReportDownloadButton}
                      onPress={() => {
                        // Handle renew
                        console.log('Renew membership:', membership.id);
                      }}
                    >
                      <Text style={styles.purchasedReportDownloadButtonText}>
                        Renew
                      </Text>
                    </TouchableOpacity> */}
                        </View>
                      </View>
                    </ImageBackground>
                  ))
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
    paddingBottom: Platform.OS === 'android' ? 32 : 32,
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
