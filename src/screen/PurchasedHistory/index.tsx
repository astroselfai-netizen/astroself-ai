// ReportScreen.tsx

import React, { useState } from 'react';
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
} from 'react-native';
import {
  fontFamily,
  responsiveWidth,
  responsiveHeight,
} from '../../constant/theme';
import {
  useNavigation,
  useFocusEffect,
  RouteProp,
} from '@react-navigation/native';
import { MainContainer } from '../../components/common/mainContainer';
import { useTheme } from '../../context/ThemeContext';
import { useProfileData } from '../../hooks/useProfileData';

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

type PurchasedHistoryScreenNavigationProp = RouteProp<RootStackParamList, 'PurchasedHistoryScreen'>;

const PurchasedHistoryScreen = () => {
  const { theme, colors } = useTheme();
  const navigation = useNavigation<PurchasedHistoryScreenNavigationProp>();
  const { refreshProfileData } = useProfileData();
  const [activeTab, setActiveTab] = useState<'Reports' | 'Memberships'>(
    'Reports',
  );


  // Purchased reports data array (for Reports tab)
  const purchasedReportsData = [
    {
      id: '1',
      userReportName: 'User Report Name',
      title: 'Antardasha Report',
      date: '08 Oct 2025',
      price: '699',
    },
    {
      id: '2',
      userReportName: 'User Report Name',
      title: 'Tarot Card Reading',
      date: '15 Oct 2025',
      price: '499',
    },
    {
      id: '3',
      userReportName: 'User Report Name',
      title: 'Numerology Insights',
      date: '22 Oct 2025',
      price: '599',
    },
    {
      id: '4',
      userReportName: 'User Report Name',
      title: 'Vedic Astrology Chart',
      date: '30 Oct 2025',
      price: '799',
    },
    {
      id: '5',
      userReportName: 'User Report Name',
      title: 'Compatibility Analysis',
      date: '05 Nov 2025',
      price: '399',
    },
    {
      id: '6',
      userReportName: 'User Report Name',
      title: 'Compatibility Analysis',
      date: '05 Nov 2025',
      price: '399',
    },
  ];

  // Purchased memberships data array (for Memberships tab)
  const purchasedMembershipsData = [
    {
      id: '1',
      membershipName: 'Memberships Name',
      membershipType: 'Memberships Type',
      dateRange: '08 Oct 2025 to 07 Oct 2026',
      price: '699',
    },
    {
      id: '2',
      membershipName: 'Memberships Name',
      membershipType: 'Memberships Type',
      dateRange: '08 Oct 2025 to 07 Oct 2026',
      price: '499',
    },
    {
      id: '3',
      membershipName: 'Memberships Name',
      membershipType: 'Memberships Type',
      dateRange: '08 Oct 2025 to 07 Oct 2026',
      price: '4999',
    },
    {
      id: '4',
      membershipName: 'Memberships Name',
      membershipType: 'Memberships Type',
      dateRange: '08 Oct 2025 to 07 Oct 2026',
      price: '1200',
    },
    {
      id: '5',
      membershipName: 'Memberships Name',
      membershipType: 'Memberships Type',
      dateRange: '08 Oct 2025 to 07 Oct 2026',
      price: '2500',
    },
    {
      id: '6',
      membershipName: 'Memberships Name',
      membershipType: 'Memberships Type',
      dateRange: '08 Oct 2025 to 07 Oct 2026',
      price: '750',
    },
  ];

  // Refresh profile data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Report screen focused, refreshing profile data...');
      if (refreshProfileData) {
        refreshProfileData();
      }
    }, [refreshProfileData]),
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
        {activeTab === 'Reports' && (
          <View style={styles.purchasedReportsContainer}>
            {purchasedReportsData.map(report => (
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
                      theme === 'dark' ? colors.transparentBg : colors.white,
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
                      theme === 'dark' ? colors.transparentBg : colors.white,
                  },
                ]}
              >
                <View
                  style={[
                    styles.purchasedReportCard,
                    {
                      backgroundColor:
                        theme === 'dark' ? colors.transparentBg : colors.white,
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
                    <View style={styles.purchasedReportLeftSection}>
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
                    <TouchableOpacity
                      style={styles.purchasedReportDownloadButton}
                      onPress={() => {
                        // Handle download
                        console.log('Download report:', report.id);
                      }}
                    >
                      <Text style={styles.purchasedReportDownloadButtonText}>
                        Download
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ImageBackground>
            ))}
          </View>
        )}

        {activeTab === 'Memberships' && (
          <View style={styles.purchasedReportsContainer}>
            {purchasedMembershipsData.map(membership => (
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
                      theme === 'dark' ? colors.transparentBg : colors.white,
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
                      theme === 'dark' ? colors.transparentBg : colors.white,
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
                        theme === 'dark' ? colors.transparentBg : colors.white,
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
                        {membership.membershipName}
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
                      ₹ {membership.price}
                    </Text>
                  </View>

                  {/* Middle Row: Membership Type + Date Range (Left) and Renew Button (Right) */}
                  <View style={styles.purchasedReportMiddleRow}>
                    {/* Left: Type and Date Range */}
                    <View style={styles.purchasedReportLeftSection}>
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
                        {membership.membershipType}
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
                        {membership.dateRange}
                      </Text>
                    </View>

                    {/* Right: Renew Button */}
                    <TouchableOpacity
                      style={styles.purchasedReportDownloadButton}
                      onPress={() => {
                        // Handle renew
                        console.log('Renew membership:', membership.id);
                      }}
                    >
                      <Text style={styles.purchasedReportDownloadButtonText}>
                        Renew
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ImageBackground>
            ))}
          </View>
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
    marginBottom: responsiveWidth(1),
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
    fontSize: 16,
    fontFamily: fontFamily.bold,
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
    marginRight: responsiveWidth(3),
  },
  purchasedReportTitle: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    marginBottom: responsiveWidth(1),
  },
  purchasedReportDate: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    opacity: 0.8,
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
  }
});

export default PurchasedHistoryScreen;
