// HomeScreen.tsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ImageBackground,
  StatusBar,
} from 'react-native';
import {
  responsiveHeight,
  responsiveWidth,
  font,
  fontFamily,
  color,
} from '../../constant/theme';
import { MainContainer } from '../../components/common/mainContainer';
import { Header } from '../../components/common/header';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
// import MapView, { Marker } from 'react-native-maps';
// import { Dimensions } from 'react-native';
import serviceFactory from '../../services/serviceFactory';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import UserService from '../../services/user/user.service';
import { useProfileData } from '../../hooks/useProfileData';
import { useTheme } from '../../context/ThemeContext';
import HomeImageSlider from '../../components/HomeImageSlider';
import { baseURL } from '../../utils/http';
// Removed BlurView to avoid external dependency for blur

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  HomeScreen: undefined;
  ContinueWithOtp: undefined;
  BasicDeatil: undefined;
  MemberManagement: undefined;
  ChatScreen: undefined;
  NotificationScreen: undefined;
  AddNewMember: undefined;
  ProfileScreen: undefined;
  ReportScreen: undefined;
  DashboardTasksScreen: undefined;
};

type HomeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Register'
>;

// const PLANET_ICONS: { [key: string]: any } = {
//   Sun: require('../../assets/icons/Sun.png'),
//   Saturn: require('../../assets/icons/Saturn.png'),
//   Moon: require('../../assets/icons/Moon.png'),
//   Mercury: require('../../assets/icons/Moon.png'), // fallback, update as needed
//   Mars: require('../../assets/icons/Sun.png'), // fallback, update as needed
//   Jupiter: require('../../assets/icons/Sun.png'), // fallback, update as needed
//   Rahu: require('../../assets/icons/Saturn.png'), // fallback, update as needed
//   Ketu: require('../../assets/icons/Saturn.png'), // fallback, update as needed
// };

const CARDS_PER_GROUP = 3;

// Helper to format date as 'MMM D, YYYY' (e.g., Jun 6, 2020) using moment.js
function formatDashaDate(dateStr: string) {
  if (!dateStr) return '';
  // Try both 'DD-MM-YYYY' and 'YYYY-MM-DD' formats
  let m = moment(dateStr, [
    'DD-MM-YYYY',
    'YYYY-MM-DD',
    'DD/MM/YYYY',
    'YYYY/MM/DD',
  ]);
  if (!m.isValid()) {
    // Try to extract and format if range is not standard
    return dateStr;
  }
  return m.format('MMM D, YYYY');
}

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const userService = serviceFactory.get<UserService>('UserService');
  const [_currentGroup, setCurrentGroup] = useState(0);
  const { membersData, loading, refreshProfileData } = useProfileData();
  const { theme, colors } = useTheme();

  // Debug membersData whenever it changes
  useEffect(() => {
    console.log('membersData updated:', membersData);
    if (membersData && membersData.length > 0) {
      console.log('First member details:', membersData[0]);
      console.log(
        'All member names:',
        membersData.map((member: any) => ({
          name: member.name,
          first_name: member.first_name,
          full_name: member.full_name,
          primary_member: member.primary_member,
        })),
      );
    }
  }, [membersData]);

  // Get current user data as fallback
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const getUserData = async () => {
      try {
        const userDataStr = await AsyncStorage.getItem('USER_DATA');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          setCurrentUser(userData);
          console.log('Current user data:', userData);
        }
      } catch (error) {
        console.error('Error getting user data:', error);
      }
    };
    getUserData();
  }, []);
  const [dashaData, setDashaData] = useState<any[]>([]);
  const [_dashaLoading, setDashaLoading] = useState(false);
  const [_dashaError, setDashaError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Helper function to get primary member ID
  const getPrimaryMemberId = useCallback(() => {
    if (!membersData || membersData.length === 0) {
      return null;
    }

    // Look for a member with primary_member field set to true
    const primaryMember = membersData.find(
      (member: any) =>
        member.primary_mamber === 'True' || member.primary_mamber === true,
    );

    if (primaryMember) {
      return primaryMember.id || primaryMember._id;
    }

    // If no primary_member field found, assume first member is primary
    const firstMember = membersData[0];

    console.log('primaryMember===>123', firstMember);
    return firstMember?.id || firstMember?._id || null;
  }, [membersData]);

  // Helper function to get primary member name
  const getPrimaryMemberName = useCallback(() => {
    console.log('getPrimaryMemberName called with membersData:', membersData);
    console.log('Current user data:', currentUser);

    if (!membersData || membersData.length === 0) {
      console.log('No members data available, using current user');
      // Fallback to current user data
      if (currentUser) {
        const name =
          currentUser.name ||
          currentUser.first_name ||
          currentUser.full_name ||
          'User';
        console.log('Using current user name:', name);
        return name;
      }
      return 'User';
    }

    console.log('membersData===>123', membersData);

    // Look for a member with primary_member field set to true
    const primaryMember = membersData.find(
      (member: any) =>
        member.primary_mamber === 'True' || member.primary_mamber === true,
    );

    if (primaryMember) {
      const name =
        primaryMember.name ||
        primaryMember.first_name ||
        primaryMember.full_name ||
        'User';
      console.log('Using primary member name:', name);
      return name;
    }

    // If no primary_member field found, assume first member is primary
    const firstMember = membersData[0];
    console.log('Using first member as primary:', firstMember);
    const name =
      firstMember?.name ||
      firstMember?.first_name ||
      firstMember?.full_name ||
      'User';
    console.log('Using first member name:', name);
    return name;
  }, [membersData, currentUser]);

  // Function to fetch dasha data
  const fetchDasha = useCallback(async () => {
    try {
      setDashaLoading(true);
      setDashaError(null);

      const userDataStr = await AsyncStorage.getItem('USER_DATA');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;

      console.log('userData===>123', membersData);

      // Get primary member ID from membersData
      const primaryMemberId = getPrimaryMemberId();
      const memberId = primaryMemberId || userData?._id || userData?.user_id;

      console.log('Primary member ID:', primaryMemberId);
      console.log('Using member ID for dasha:', memberId);

      if (!memberId) {
        setDashaError('No member ID found');
        return;
      }

      const apiRes = await userService.getDashaData(memberId);

      console.log('apiRes===>123', apiRes);

      // Parse new API response format to UI format
      const parsed: any[] = [];

      // Handle new flat structure with direct dasha types
      const dashaTypes = [
        'MahaDasha',
        'AntarDasha',
        'PratyantarDasha',
        'SookshmaDasha',
        'PranDasha',
      ];

      // Mapping for display names
      const dashaDisplayNames: { [key: string]: string } = {
        MahaDasha: 'Maha Dasha',
        AntarDasha: 'Antar Dasha',
        PratyantarDasha: 'Pratyantar Dasha',
        SookshmaDasha: 'Sookshma Dasha',
        PranDasha: 'Pran Dasha',
      };

      dashaTypes.forEach(dashaType => {
        if (apiRes[dashaType]) {
          const dashaInfo = apiRes[dashaType];
          parsed.push({
            icon: `${baseURL}/${dashaInfo.path}`,
            dashaname: dashaDisplayNames[dashaType] || dashaType,
            planetname: dashaInfo.planet,
            start: formatDashaDate(dashaInfo.start),
            end: formatDashaDate(dashaInfo.end),
          });
        }
      });

      setDashaData(parsed);
    } catch (e: any) {
      console.error('Error fetching dasha data:', e);
      setDashaError(e.message || 'Failed to fetch dasha data');
    } finally {
      setDashaLoading(false);
    }
  }, [membersData, userService, getPrimaryMemberId]);

  useEffect(() => {
    // Only fetch dasha if membersData is loaded and not in loading state
    if (!loading && membersData) {
      fetchDasha();
    }
  }, [membersData, userService, loading, fetchDasha]);

  // Refresh data every time the Home screen is focused
  useFocusEffect(
    React.useCallback(() => {
      console.log('Home screen focused - refreshing data');
      // Refresh profile data (which includes members data)
      refreshProfileData();

      // Also refresh current user data
      const getUserData = async () => {
        try {
          const userDataStr = await AsyncStorage.getItem('USER_DATA');
          if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            setCurrentUser(userData);
            console.log('Refreshed current user data:', userData);
          }
        } catch (error) {
          console.error('Error refreshing user data:', error);
        }
      };
      getUserData();
    }, [refreshProfileData]),
  );

  // Refresh function to reload both profile and dasha data
  // const handleRefresh = async () => {
  //   try {
  //     await refreshProfileData();
  //   } catch (error) {
  //     console.error('Error refreshing profile data:', error);
  //   }
  // };

  const handleScroll = (event: any) => {
    const x = event.nativeEvent.contentOffset.x;
    const cardWidth = 120 + 16; // card width + marginRight
    const groupWidth = cardWidth * CARDS_PER_GROUP;
    const group = Math.round(x / groupWidth);
    setCurrentGroup(group);
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent={true}
      /> */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -84}
      >
        <MainContainer>
          {/* Sticky Header */}
          <View style={styles.headerContainer}>
            <ImageBackground
              source={colors.backgroundImage}
              // blurRadius={12}
              style={{}}
              imageStyle={{}}
            >
              <View style={{}} />
              <View style={{}}>
                <Header
                  title=""
                  rightIconContainerStyle={{}}
                  // rightIcon={require('../../assets/icons/Ic-ball.png')}
                  LeftIcon={colors.subtractIcon}
                  // onPressRight={() => navigation.navigate('NotificationScreen')}
                />
              </View>
            </ImageBackground>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Greeting Section */}
            <View style={styles.greetingContainer}>
              <Text
                style={[
                  styles.greetingText,
                  {
                    color:
                      theme === 'dark' ? colors.textPrimary : colors.DarkNavy,
                  },
                ]}
              >
                Good Morning,{' '}
              </Text>
              <TouchableOpacity
                style={styles.memberNameContainer}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('ProfileScreen')}
              >
                <Text style={[styles.memberNameText, { color: colors.accent }]}>
                  {getPrimaryMemberName()}
                </Text>
              </TouchableOpacity>
            </View>

            {/* image slider section */}
            <View style={styles.imageSliderContainer}>
              <HomeImageSlider />
            </View>

            {/* Mahadasha Card */}
            <ImageBackground
              source={
                theme === 'dark'
                  ? require('../../assets/image/DarkBackground.png')
                  : require('../../assets/image/LightBackground.png')
              }
              blurRadius={12}
              style={[
                styles.mahadashaCard,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.cardBackground : colors.white,
                  borderColor:
                    theme === 'dark'
                      ? colors.borderColor
                      : colors.surfaceOpacity,
                },
              ]}
              imageStyle={[
                styles.mahadashaBgImage,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.DarkNavy : colors.white,
                  borderColor:
                    theme === 'dark'
                      ? colors.borderColor
                      : colors.surfaceOpacity,
                },
              ]}
            >
              <View
                style={[
                  styles.mahadashaOverlay,
                  {
                    backgroundColor:
                      theme === 'dark' ? colors.transparent : colors.white,
                  },
                ]}
              />
              <View
                style={[
                  styles.mahadashaInner,
                  {
                    backgroundColor:
                      theme === 'dark' ? colors.surface : colors.white,
                    borderColor:
                      theme === 'dark'
                        ? colors.borderColor
                        : colors.surfaceOpacity,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.mahadashaTitle,
                    {
                      color:
                        theme === 'dark' ? colors.textPrimary : colors.DarkNavy,
                    },
                  ]}
                >
                  Current Dasha Overview
                </Text>

                {/* Dasha Data */}
                {membersData?.length > 0 ? (
                  <>
                    <ScrollView
                      ref={scrollRef}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.carouselContainer}
                      pagingEnabled={false}
                      onScroll={handleScroll}
                      scrollEventThrottle={16}
                    >
                      {dashaData.map((item, idx) => (
                        <View
                          key={item?.planetname + idx}
                          style={[
                            styles.carouselCard,
                            {
                              backgroundColor:
                                theme === 'dark'
                                  ? colors.DarkNavy
                                  : colors.white,
                              boxShadow:
                                theme === 'dark' ? '' : '0px 0px 5px #DF8A5D',

                              shadowColor: theme === 'dark' ? '#000' : '',
                              shadowOffset: {
                                width: theme === 'dark' ? 0 : 0,
                                height: theme === 'dark' ? 2 : 0,
                              },
                              shadowOpacity: theme === 'dark' ? 0.4 : 0,
                              shadowRadius: theme === 'dark' ? 3 : 0,
                              elevation: theme === 'dark' ? 3 : 0,
                              // borderColor:
                              //   theme === 'dark'
                              //     ? colors.themeBorderDropdown
                              //     : colors.borderColor,
                            },
                          ]}
                        >
                          <Image
                            source={{ uri: item.icon }}
                            style={styles.planetIcon}
                          />
                          <Text
                            style={[
                              styles.planetName,
                              {
                                color:
                                  theme === 'dark'
                                    ? colors.textPrimary
                                    : colors.DarkNavy,
                              },
                            ]}
                          >
                            {item.dashaname}
                          </Text>
                          <Text
                            style={[
                              styles.planetName,
                              {
                                fontWeight: '400',
                                color:
                                  theme === 'dark'
                                    ? colors.textPrimary
                                    : colors.DarkNavy,
                              },
                            ]}
                          >
                            {item.planetname}
                          </Text>
                          <Text
                            style={[
                              styles.planetDate,
                              {
                                color:
                                  theme === 'dark'
                                    ? colors.textPrimary
                                    : colors.DarkNavy,
                              },
                            ]}
                          >
                            {item.start}
                          </Text>
                          <Text
                            style={[
                              styles.planetDate,
                              {
                                color:
                                  theme === 'dark'
                                    ? colors.textPrimary
                                    : colors.DarkNavy,
                              },
                            ]}
                          >
                            {item.end}
                          </Text>
                        </View>
                      ))}
                    </ScrollView>
                    {/* Dots indicator (grouped by 3) */}
                    {/* <View style={styles.dotsContainer}>
                      {Array.from({ length: numGroups }).map((_, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.dot,
                            { opacity: currentGroup === idx ? 1 : 0.4 },
                          ]}
                        />
                      ))}
                    </View> */}
                  </>
                ) : (
                  <View style={styles.emptyStateContainer}>
                    <View style={styles.emptyStateContent}>
                      <Text
                        style={[
                          styles.emptyStateTitle,
                          {
                            textAlign: 'left' as const,
                            marginTop: -responsiveWidth('4'),
                            color:
                              theme === 'dark'
                                ? colors.textPrimary
                                : colors.DarkNavy,
                          },
                        ]}
                      >
                        Add your details to generate your charts
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.emptyStateButton,
                          {
                            borderColor:
                              theme === 'dark'
                                ? colors.borderColor
                                : colors.primaryBlue,
                          },
                        ]}
                        // activeOpacity={0.7}
                        onPress={() => navigation.navigate('AddNewMember')}
                      >
                        <Text
                          style={[
                            styles.emptyStateButtonText,
                            {
                              color:
                                theme === 'dark'
                                  ? colors.borderColor
                                  : colors.primaryBlue,
                            },
                          ]}
                        >
                          Add New Member
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Image
                      source={require('../../assets/image/emptyStateImage.png')}
                      style={styles.emptyStateImage}
                    />
                  </View>
                )}
              </View>
            </ImageBackground>

            {/* daily actions Card */}
            <View
              style={[
                styles.astroCard,
                {
                  borderWidth: 0.2,
                  backgroundColor:
                    theme === 'dark' ? colors.DarkNavy : colors.white,
                  borderColor:
                    theme === 'dark'
                      ? colors.borderColor
                      : colors.surfaceOpacity,
                },
              ]}
            >
              <View style={[styles.astroContent,{
                backgroundColor:
                  theme === 'dark' ? colors.transparentBg : colors.white,
                borderColor:
                  theme === 'dark'
                    ? colors.borderColor
                    : colors.surfaceOpacity,
              }]}>
                <Text
                  style={[
                    styles.astroTitle,
                    {
                      color:
                        theme === 'dark' ? colors.textPrimary : colors.DarkNavy,
                    },
                  ]}
                >
                  Level up your Karma with simple daily actions.
                </Text>
                <TouchableOpacity
                  style={[
                    styles.astroButton,
                    { backgroundColor: colors.Orangeaccentcolor },
                  ]}
                  // activeOpacity={0.7}
                  onPress={() => navigation.navigate('DashboardTasksScreen')}
                >
                  <Text
                    style={[styles.astroButtonText, { color: colors.white }]}
                  >
                    Dashboard
                  </Text>
                </TouchableOpacity>
              </View>
              <Image
                source={require('../../assets/icons/Dashboard-daliy-action.png')}
                style={styles.astroImage}
              />
            </View>

            {/* Report Card */}
            <View
              style={[
                styles.astroCard,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.primary : colors.DarkNavy,
                },
              ]}
            >
              <View style={styles.astroContent}>
                <Text
                  style={[
                    styles.astroTitle,
                    {
                      color:
                        theme === 'dark' ? colors.DarkNavy : colors.surface,
                    },
                  ]}
                >
                  Buy and Download your personalized report today.
                </Text>
                <TouchableOpacity
                  style={[
                    styles.astroButton,
                    { backgroundColor: colors.Orangeaccentcolor },
                  ]}
                  // activeOpacity={0.7}
                  onPress={() => navigation.navigate('ReportScreen')}
                >
                  <Text
                    style={[styles.astroButtonText, { color: colors.white }]}
                  >
                    Buy Now
                  </Text>
                </TouchableOpacity>
              </View>
              <Image
                source={require('../../assets/image/report-icon.png')}
                style={styles.reportImage}
              />
            </View>

            {/* Astro AI Chat Card */}
            <View
              style={[
                styles.astroCard,

                {
                  backgroundColor:
                    theme === 'dark' ? colors.DarkNavy : colors.white,
                  borderColor:
                    theme === 'dark'
                      ? colors.borderColor
                      : colors.surfaceOpacity,
                  borderWidth: 0.2,
                },
              ]}
            >
              <View style={styles.astroContent}>
                <Text
                  style={[
                    styles.astroTitle,
                    {
                      color:
                        theme === 'dark' ? colors.textPrimary : colors.DarkNavy,
                    },
                  ]}
                >
                  Gain clarity on your life, career & relationships
                </Text>
                <TouchableOpacity
                  style={[
                    styles.astroButton,
                    { backgroundColor: colors.Orangeaccentcolor },
                  ]}
                  // activeOpacity={0.7}
                  onPress={() => navigation.navigate('ChatScreen')}
                >
                  <Text
                    style={[styles.astroButtonText, { color: colors.white }]}
                  >
                    See Predictions
                  </Text>
                </TouchableOpacity>
              </View>
              <Image
                source={require('../../assets/image/Ai-robot.png')}
                style={styles.astroImage}
              />
            </View>
            {/* Manage Members Card */}
            <View
              style={[
                styles.membersCard,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.primary : colors.DarkNavy,
                },
              ]}
            >
              <View style={styles.membersInner}>
                <View style={styles.membersContent}>
                  <Text
                    style={[
                      styles.membersTitle,
                      {
                        color:
                          theme === 'dark' ? colors.DarkNavy : colors.surface,
                      },
                    ]}
                  >
                    Add your loved ones to generate their charts
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.membersButton,
                      {
                        backgroundColor: colors.Orangeaccentcolor,
                        // borderColor:
                        //   theme === 'dark' ? colors.surface : colors.surface,
                      },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('MemberManagement')}
                  >
                    <Text
                      style={[
                        styles.membersButtonText,
                        {
                          color: colors.white,
                        },
                      ]}
                    >
                      Manage Members
                    </Text>
                  </TouchableOpacity>
                </View>
                <Image
                  source={require('../../assets/image/Manage-Members.png')}
                  style={styles.membersImage}
                />
              </View>
            </View>
            {/* Example MapView (add inside your main render/return, adjust as needed) */}
            {/*
            <MapView
              style={{ width: Dimensions.get('window').width, height: 300 }}
              initialRegion={{
                latitude: 28.6139, // Example: New Delhi
                longitude: 77.209,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
            >
              <Marker
                coordinate={{ latitude: 28.6139, longitude: 77.209 }}
                title={'New Delhi'}
                description={'Marker in New Delhi'}
              />
            </MapView>
            */}
          </ScrollView>
        </MainContainer>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    minHeight: '100%',
    // backgroundColor: '#202945',
    // paddingTop: Platform.OS === 'android' ? 0 : 70, // Add padding for sticky header
    paddingBottom: Platform.OS === 'android' ? 35 : 32,
  },
  headerContainer: {
    // position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
    // backgroundColor: '#202945',
    // backgroundColor:  color.DarkNavy,
  },
  greetingContainer: {
    marginLeft: responsiveWidth('3%'),
    flexDirection: 'row',
    // marginTop:
    //   Platform.OS === 'android'
    //     ? responsiveHeight('0%')
    //     : responsiveWidth('0%'),
  },
  greetingText: {
    // ...font.labelLarge,
    fontSize: 18,
    fontFamily: fontFamily.regular,
    fontWeight: '600' as const,
    fontStyle: 'normal' as const,

    lineHeight: 30,

    letterSpacing: -0.14,
    textAlignVertical: 'center' as const,
  },
  memberNameContainer: {
    // Inline style for text within text
  },
  memberNameText: {
    // ...font.labelLarge,
    fontSize: 18,
    fontFamily: fontFamily.regular,

    fontWeight: '600' as const,
    fontStyle: 'normal' as const,

    lineHeight: 30,
    letterSpacing: -0.14,
    textAlignVertical: 'center' as const,
  },
  imageSliderContainer: {
    marginTop: responsiveHeight('1.5%'),
    marginHorizontal: responsiveWidth('2%'),
  },
  mahadashaCard: {
    borderRadius: 20,
    marginHorizontal: 8,
    marginTop: responsiveWidth('3%'),
    borderWidth: 0.2,
    // opacity: 0.7,
    borderColor: '#EEE5CA',
    overflow: 'hidden',
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 3,
    // },
    // shadowOpacity: 0.3,
    // shadowRadius: 4,
    // elevation: 5,
  },
  mahadashaCardHeder: {
    // borderRadius: 20,
    // marginHorizontal: 8,
    // marginTop: responsiveWidth('3%'),
    // borderWidth: 0.2,
    // borderColor: '#EEE5CA',
    // overflow: 'hidden',
  },
  mahadashaBgImage: {
    borderRadius: 20,
    opacity: 0.7,
  },
  mahadashaBgImageHeder: {
    // borderRadius: 20,
    // opacity: 0.7,
  },
  mahadashaOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.7,
    // backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  mahadashaInner: {
    padding: responsiveWidth('3'),
  },
  mahadashaTitle: {
    // ...font.label,
    fontSize: 18,
    fontFamily: fontFamily.regular,
    marginBottom: 12,
  },
  // absolute: {
  //   position: 'absolute',
  //   height:responsiveWidth("100%"),
  //   width:responsiveWidth("100%"),
  //   top: 0,
  //   left: 0,
  //   bottom: 0,
  //   right: 0,
  // },
  carouselContainer: {
    flexDirection: 'row',
    // overflow: 'hidden',
    padding: responsiveWidth('1'),
    // borderWidth: 1,
    // paddingVertical: responsiveWidth('5'),
  },
  carouselCard: {
    alignItems: 'center',
    borderRadius: 16,
    padding: responsiveWidth('1'),
    paddingVertical: responsiveWidth('3'),
    marginRight: 16,
    width: responsiveWidth('37%'),

    // shadowColor: '#ff0000',
    // borderWidth: 1,
    // shadowOffset: {
    //   width: 0,

    //   height: 0,
    // },

    // shadowOpacity: 0.3,
    // shadowRadius: 16,
    // elevation: 16,
  },
  planetIcon: {
    width: responsiveWidth('10'),
    height: responsiveWidth('10'),
    resizeMode: 'contain',
    borderRadius: 100,
    marginBottom: responsiveWidth('2'),
  },
  planetName: {
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    // ...font.mini,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  planetDate: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    marginTop: 4,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginHorizontal: 2,
  },
  astroCard: {
    borderRadius: 16,
    marginHorizontal: 8,
    overflow: 'hidden',
    marginTop: 20,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  astroContent: {
    flex: 1,

    padding: responsiveWidth('3'),
    // paddingBottom: responsiveWidth('2'),
  },
  astroTitle: {
    // ...font.subtitleLarge,
    fontSize: 18,
    fontFamily: fontFamily.regular,
    lineHeight: 30,
    marginBottom: responsiveWidth('2'),
    // paddingBottom: responsiveWidth('2'),
    // letterSpacing: -0.14,
    textAlignVertical: 'center',
  },
  astroButton: {
    borderRadius: 10,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    // width: responsiveHeight('15'),
    paddingHorizontal: 14,
    marginTop: responsiveWidth('1'),
    alignSelf: 'flex-start',
  },
  astroButtonText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    fontWeight: '600' as const,
  },
  astroImage: {
    width: responsiveWidth('30%'),
    height: responsiveWidth('30%'),
    resizeMode: 'contain',
    // marginLeft: responsiveWidth('4'),
    marginRight: responsiveWidth('2'),
  },
  reportImage: {
    width: responsiveWidth('32%'),
    height: responsiveWidth('32%'),
    resizeMode: 'contain',
    // marginLeft: responsiveWidth('4'),
    // marginRight: responsiveWidth('2'),
  },

  membersCard: {
    borderRadius: 16,
    marginHorizontal: 8,
    marginTop: responsiveWidth('5%'),
    borderWidth: 0.2,
    borderColor: '#EEE5CA',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: responsiveWidth('15%'),
    paddingVertical: Platform.OS === 'android' ? 10 : responsiveWidth('1'),
    paddingHorizontal: responsiveWidth('3'),
    // paddingTop:  Platform.OS === 'android' ? responsiveWidth('1') : responsiveWidth('0'),
    // paddingVertical:
    //   Platform.OS === 'android' ? responsiveWidth('0') : responsiveWidth('0'),
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 3,
  },
  membersBgImage: {
    borderRadius: 16,
    opacity: 0.7,
  },
  membersOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  membersInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'android' ? 10 : 7,

    // justifyContent: 'space-between',
    // alignSelf: 'center',
    // paddingTop: Platform.OS === 'android' ? responsiveWidth('0.5') : responsiveWidth('0'),
    // paddingVertical:
    //   Platform.OS === 'android' ? responsiveWidth('0') : responsiveWidth('0'),
    // paddingHorizontal: responsiveWidth('3'),
  },
  membersContent: {
    flex: 1,
    // width: '70%',

    // justifyContent: 'center',
    // alignItems: 'center',
  },
  membersTitle: {
    // ...font.subtitleLarge,
    fontSize: 18,
    fontFamily: fontFamily.regular,
    // lineHeight: 32,
    letterSpacing: -0.14,
    marginTop: -10,
    marginBottom: 10,
    textAlignVertical: 'center',
  },
  membersButton: {
    // borderWidth: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    // width: responsiveHeight('15'),
    paddingVertical: 14,
    paddingHorizontal: 14,
    // marginTop: responsiveWidth('0.5'),
    alignSelf: 'flex-start',
  },
  membersButtonText: {
    fontFamily: fontFamily.regular,
    fontWeight: '600' as const,
    fontSize: 12,
  },
  membersImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    // marginLeft: responsiveWidth('5'),
    // marginRight: 5,
  },
  // Empty state styles
  emptyStateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // paddingVertical: responsiveWidth('1'),
  },
  emptyStateContent: {
    flex: 1,
  },
  emptyStateTitle: {
    fontFamily: fontFamily.regular,
    fontWeight: '500',
    // ...font.h6,
    fontSize: 14,
    lineHeight: 30,
    letterSpacing: -0.14,
    textAlignVertical: 'center',
  },
  emptyStateSubtitle: {
    fontFamily: fontFamily.regular,
    fontWeight: '500',
    fontSize: 18,
    // fontFamily: fontFamily.regular,
    lineHeight: 30,
    letterSpacing: -0.14,
    color: color.themeTextWhite,
    textAlignVertical: 'center',
  },
  emptyStateButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginTop:
      Platform.OS === 'android' ? responsiveWidth('2') : responsiveWidth('1'),
    alignSelf: 'flex-start',
  },
  emptyStateButtonText: {
    fontFamily: fontFamily.regular,
    fontWeight: '600' as const,
    fontSize: 12,
  },
  emptyStateImage: {
    width: responsiveWidth('27%'),
    height: responsiveWidth('27%'),
    resizeMode: 'contain',
    marginLeft: 10,
  },
  // Loading and Error states
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: responsiveWidth('5'),
  },
  loadingText: {
    color: '#F6EFD9',
    ...font.labelLarge,
    fontFamily: fontFamily.regular,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: responsiveWidth('5'),
  },
  errorText: {
    color: '#FF6B6B',
    ...font.bodySmall,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    marginBottom: responsiveWidth('3'),
  },
  retryButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderColor: '#FF6B6B',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
});

export default HomeScreen;
