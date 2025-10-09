// HomeScreen.tsx

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ImageBackground,
  TouchableOpacity,
  Alert,
  RefreshControl,
  FlatList,
  Modal,
  TextInput,
} from 'react-native';
import LottieView from 'lottie-react-native';

import { MainContainer } from '../../components/common/mainContainer';
import { responsiveWidth, font, fontFamily, color } from '../../constant/theme';
import ChartsScreen from '../../components/ChartsScreen/ChartsScreen';
import DashaScreen from '../../components/DashaScreen/DashaScreen';
import moment from 'moment';

import { useProfileData } from '../../hooks/useProfileData';
import serviceFactory from '../../services/serviceFactory';
import UserService from '../../services/user/user.service';
import {
  useRoute,
  RouteProp,
  useNavigation,
  useFocusEffect,
} from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../../context/ThemeContext';
import { baseURL } from '../../utils/http';

type RootStackParamList = {
  NakshatraScreen: { userId: string };
  AddNewMember: undefined;
  ChatScreen: undefined;
};

type NakshatraScreenRouteProp = RouteProp<
  RootStackParamList,
  'NakshatraScreen'
>;
type NakshatraScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const NakshatraScreen = () => {
  const route = useRoute<NakshatraScreenRouteProp>();
  const navigation = useNavigation<NakshatraScreenNavigationProp>();
  const userService = serviceFactory.get<UserService>('UserService');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const { theme, colors } = useTheme();

  const [chartDetails, setChartDetails] = useState<any>(null);
  const [dashaData, setDashaData] = useState<any[]>([]);
  const [_currentDashaGroup, setCurrentDashaGroup] = useState(0);
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const dashaScrollRef = useRef<ScrollView>(null);
  const mainScrollRef = useRef<ScrollView>(null);

  const { membersData, loading, error, refreshProfileData } = useProfileData();

  // Filter members based on search query
  const filteredMembers =
    membersData?.filter((member: any) =>
      member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  // Helper function to get primary member ID
  const getPrimaryMemberId = () => {
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
  };

  // Show error alert if there's an error
  React.useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [
        { text: 'OK' },
        { text: 'Retry', onPress: refreshProfileData },
      ]);
    }
  }, [error, refreshProfileData]);

  // Set selectedMemberId based on route params or primary member from membersData
  useEffect(() => {
    // If userId is passed via route params, use that
    if (route.params?.userId) {
      console.log('Setting member from route params:', route.params.userId);
      setSelectedMemberId(route.params.userId);
    } else if (
      membersData &&
      Array.isArray(membersData) &&
      membersData.length > 0 &&
      !selectedMemberId
    ) {
      // Get primary member ID
      const primaryMemberId = getPrimaryMemberId();
      console.log('Setting primary member as default:', primaryMemberId);
      setSelectedMemberId(primaryMemberId);
    }
  }, [membersData, route.params?.userId]);

  const fetchChartDetails = useCallback(
    async (memberId: string) => {
      try {
        const res = await userService.getChartDetails(memberId);

        console.log('res0000====>83', res);

        setChartDetails(res.data);
      } catch (err) {
        setChartDetails(null);
        // handle error
      }
    },
    [userService],
  );

  useEffect(() => {
    if (selectedMemberId) {
      fetchChartDetails(selectedMemberId);
    }
  }, [selectedMemberId, fetchChartDetails]);

  const [selectedTab, setSelectedTab] = useState<'Charts' | 'Dasha'>('Charts');

  // Function to handle tab change and reset scroll position
  const handleTabChange = (tab: 'Charts' | 'Dasha') => {
    setSelectedTab(tab);
    // Reset scroll position to top when switching tabs
    mainScrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  // Function to parse date string from dasha data using moment.js
  const parseDashaDate = useCallback((dateStr: string) => {
    // Parse date format like "22-4-1973  0:1" or "21-4-2016  18:1"
    const [datePart, timePart] = dateStr.split('  ');
    const [day, month, year] = datePart.split('-');
    const [hour, minute] = timePart.split(':');

    // Create moment object (month is 0-indexed in moment)
    return moment(`${year}-${month}-${day} ${hour}:${minute}`, 'YYYY-M-D H:m');
  }, []);

  // Function to check if current time is within dasha period using moment.js
  const isCurrentPeriod = useCallback(
    (startDate: string, endDate: string) => {
      const now = moment();
      const start = parseDashaDate(startDate);
      const end = parseDashaDate(endDate);

      // Check if current time is between start and end (inclusive)
      return now.isBetween(start, end, null, '[]'); // '[]' includes the boundary dates
    },
    [parseDashaDate],
  );

  // Function to format date for display using moment.js
  const formatDateForDisplay = useCallback(
    (dateStr: string) => {
      const date = parseDashaDate(dateStr);
      return date.format('MMM DD, YYYY');
    },
    [parseDashaDate],
  );

  // Function to get planet icon from chartDetails.planets_icon array
  const getPlanetIconFromAPI = (planetName: string) => {
    console.log('planetName===>getPlanetIconFromAPI', chartDetails);

    if (
      !chartDetails?.planets_icon ||
      !Array.isArray(chartDetails.planets_icon)
    ) {
      return require('../../assets/icons/Moon.png'); // Fallback icon
    }

    const planetIcon = chartDetails.planets_icon.find(
      (icon: any) => icon.name.toLowerCase() === planetName.toLowerCase(),
    );

    if (planetIcon && planetIcon.path) {
      // Return the path as a URI for remote images
      return { uri: `${baseURL}/${planetIcon.path}` };
    }

    return require('../../assets/icons/Saturn.png'); // Fallback icon
  };

  // Function to get planet icon based on planet name (keeping as fallback)
  const getPlanetIcon = (planetName: string) => {
    console.log('planetName===>getPlanetIcon', planetName);

    // Try to get icon from API first
    const apiIcon = getPlanetIconFromAPI(planetName);

    console.log('apiIcon===>getPlanetIcon190', apiIcon);
    if (apiIcon.uri) {
      return apiIcon;
    }
  };

  // Get currently active dasha periods for overview
  const getCurrentDashaOverview = useCallback(() => {
    if (!chartDetails?.all_dasha) return [];

    const overview = [];

    // Mapping for display names
    const dashaDisplayNames: { [key: string]: string } = {
      MahaDasha: 'Maha dasha',
      AntarDasha: 'Antar dasha',
      PratyantarDasha: 'Pratyantar dasha',
      SookshmaDasha: 'Sookshma dasha',
      PranDasha: 'Pran dasha',
    };

    // Check MahaDasha (major)
    if (chartDetails.all_dasha.major?.dasha_period) {
      const activeMajor = chartDetails.all_dasha.major.dasha_period.find(
        (period: any) => isCurrentPeriod(period.start, period.end),
      );
      if (activeMajor) {
        console.log(
          'getPlanetIcon(activeMajor.planet)',
          getPlanetIcon(activeMajor.planet),
        );
        overview.push({
          id: 1,
          type: dashaDisplayNames['MahaDasha'],
          planet: activeMajor.planet,
          icon: getPlanetIcon(activeMajor.planet),
          startDate: formatDateForDisplay(activeMajor.start),
          endDate: formatDateForDisplay(activeMajor.end),
        });
      }
    }

    // Check AntarDasha (minor)
    if (chartDetails.all_dasha.minor?.dasha_period) {
      const activeMinor = chartDetails.all_dasha.minor.dasha_period.find(
        (period: any) => isCurrentPeriod(period.start, period.end),
      );
      if (activeMinor) {
        overview.push({
          id: 2,
          type: dashaDisplayNames['AntarDasha'],
          planet: activeMinor.planet,
          icon: getPlanetIcon(activeMinor.planet),
          startDate: formatDateForDisplay(activeMinor.start),
          endDate: formatDateForDisplay(activeMinor.end),
        });
      }
    }

    // Check PratyantarDasha (sub_minor)
    if (chartDetails.all_dasha.sub_minor?.dasha_period) {
      const activeSubMinor = chartDetails.all_dasha.sub_minor.dasha_period.find(
        (period: any) => isCurrentPeriod(period.start, period.end),
      );
      if (activeSubMinor) {
        overview.push({
          id: 3,
          type: dashaDisplayNames['PratyantarDasha'],
          planet: activeSubMinor.planet,
          icon: getPlanetIcon(activeSubMinor.planet),
          startDate: formatDateForDisplay(activeSubMinor.start),
          endDate: formatDateForDisplay(activeSubMinor.end),
        });
      }
    }

    // Check SookshmaDasha (sub_sub_minor)
    if (chartDetails.all_dasha.sub_sub_minor?.dasha_period) {
      const activeSubSubMinor =
        chartDetails.all_dasha.sub_sub_minor.dasha_period.find((period: any) =>
          isCurrentPeriod(period.start, period.end),
        );
      if (activeSubSubMinor) {
        overview.push({
          id: 4,
          type: dashaDisplayNames['SookshmaDasha'],
          planet: activeSubSubMinor.planet,
          icon: getPlanetIcon(activeSubSubMinor.planet),
          startDate: formatDateForDisplay(activeSubSubMinor.start),
          endDate: formatDateForDisplay(activeSubSubMinor.end),
        });
      }
    }

    // Check PranDasha (sub_sub_sub_minor)
    if (chartDetails.all_dasha.sub_sub_sub_minor?.dasha_period) {
      const activeSubSubSubMinor =
        chartDetails.all_dasha.sub_sub_sub_minor.dasha_period.find(
          (period: any) => isCurrentPeriod(period.start, period.end),
        );
      if (activeSubSubSubMinor) {
        overview.push({
          id: 5,
          type: dashaDisplayNames['PranDasha'],
          planet: activeSubSubSubMinor.planet,
          icon: getPlanetIcon(activeSubSubSubMinor.planet),
          startDate: formatDateForDisplay(activeSubSubSubMinor.start),
          endDate: formatDateForDisplay(activeSubSubSubMinor.end),
        });
      }
    }

    return overview;
  }, [chartDetails, isCurrentPeriod, formatDateForDisplay]);

  const handleDashaScroll = (event: any) => {
    const x = event.nativeEvent.contentOffset.x;
    const cardWidth = 120 + 16; // card width + marginRight
    const groupWidth = cardWidth * 3; // 3 cards per group
    const group = Math.round(x / groupWidth);
    setCurrentDashaGroup(group);
  };

  const _numDashaGroups = Math.ceil(dashaData.length / 3);

  // Update dashaData when chartDetails changes
  useEffect(() => {
    if (chartDetails) {
      const overview = getCurrentDashaOverview();
      setDashaData(overview);
    }
  }, [getCurrentDashaOverview]);

  // Refresh data every time the Nakshatra screen is focused
  useFocusEffect(
    React.useCallback(() => {
      console.log('Nakshatra screen focused - refreshing data');
      // Refresh profile data (which includes members data)
      refreshProfileData();
    }, [refreshProfileData]),
  );

  if (loading) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        style={{ flex: 1, backgroundColor: colors.background }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -84}
      >
        <MainContainer>
          <View style={styles.loadingContainer}>
            <LottieView
              source={require('../../assets/lottie/loader-Animation-1.json')}
              autoPlay
              loop
              style={styles.lottieAnimation}
            />
            {/* <Text style={[styles.loadingText, { color: colors.textPrimary }]}>
              Loading Nakshatra...
            </Text> */}
          </View>
        </MainContainer>
      </KeyboardAvoidingView>
    );
  }

  // Show empty state if no members data
  if (!membersData || membersData.length === 0) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        style={{ flex: 1, backgroundColor: colors.background }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -84}
      >
        <MainContainer>
          {/* Header */}
          <View style={styles.headerContainer}>
            {/* <Image
              source={colors.subtractIcon}
              style={styles.headerIcon}
            /> */}
            <Text
              style={[
                styles.headerText,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              Charts
            </Text>
          </View>

          {/* Empty State Card */}
          <ImageBackground
            source={
              theme === 'dark'
                ? require('../../assets/image/DarkBackground.png')
                : require('../../assets/image/LightBackground.png')
            }
            blurRadius={12}
            style={[
              styles.membersCard,
              {
                backgroundColor:
                  theme === 'dark' ? colors.surface : colors.white,
                borderColor:
                  theme === 'dark'
                    ? colors.themeBorderDropdown
                    : colors.borderColor,
              },
            ]}
            imageStyle={[
              styles.membersBgImage,
              {
                backgroundColor:
                  theme === 'dark' ? colors.surface : colors.white,
                borderColor:
                  theme === 'dark'
                    ? colors.themeBorderDropdown
                    : colors.borderColor,
              },
            ]}
          >
            <View
              style={[
                styles.membersOverlay,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.transparent : colors.white,
                },
              ]}
            />
            <View style={styles.emptyStateContainer}>
              <View
                style={[
                  styles.emptyStateContent,
                  {
                    backgroundColor:
                      theme === 'dark' ? colors.surface : colors.white,
                    borderColor:
                      theme === 'dark'
                        ? colors.themeBorderDropdown
                        : colors.borderColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.emptyStateTitle,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
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
                  activeOpacity={0.7}
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
          </ImageBackground>
        </MainContainer>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -84}
    >
      <MainContainer>
        {/* Header */}
        <View style={styles.headerContainer}>
          {/* <Image
            source={colors.subtractIcon}
            style={styles.headerIcon}
          /> */}
          <Text style={[styles.headerText, { color: colors.textPrimary }]}>
            Charts
          </Text>
        </View>

        {/* Profile member dropdown */}
        <View
          style={[
            styles.profileCard,
            {
              position: 'relative',
              zIndex: 99999,
              backgroundColor:
                theme === 'dark' ? colors.DarkNavy : colors.white,
              borderColor:
                theme === 'dark'
                  ? colors.themeBorderDropdown
                  : colors.borderColor,
            },
          ]}
        >
          <Image
            source={require('../../assets/icons/profile-icons.png')}
            style={styles.profileIcon}
          />
          <View style={{ zIndex: 999, flex: 1 }}>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setIsMemberDropdownOpen(!isMemberDropdownOpen)}
            >
              <Text
                style={[
                  styles.selectedMemberText,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              >
                {selectedMemberId
                  ? membersData?.find((m: any) => m.id === selectedMemberId)
                      ?.full_name || 'Select Member'
                  : 'Select Member'}
              </Text>
            </TouchableOpacity>

            <Modal
              visible={isMemberDropdownOpen}
              transparent={true}
              animationType="none"
              onRequestClose={() => {
                setIsMemberDropdownOpen(false);
                setSearchQuery('');
              }}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => {
                  setIsMemberDropdownOpen(false);
                  setSearchQuery('');
                }}
              >
                <View
                  style={[
                    styles.modalDropdownContainer,
                    {
                      backgroundColor:
                        theme === 'dark' ? colors.DarkNavy : colors.white,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.dropdownContainer,
                      {
                        backgroundColor:
                          theme === 'dark' ? colors.DarkNavy : colors.white,
                        borderColor: colors.borderColor,
                      },
                    ]}
                  >
                    {/* Search Input */}
                    <View
                      style={[
                        styles.searchContainer,
                        {
                          backgroundColor:
                            theme === 'dark' ? colors.DarkNavy : colors.white,
                        },
                      ]}
                    >
                      <TextInput
                        style={[
                          styles.searchInput,
                          {
                            backgroundColor: colors.cardBackground,
                            color: colors.textPrimary,
                            borderColor: colors.borderColor,
                          },
                        ]}
                        placeholder="Search members..."
                        placeholderTextColor={colors.grayText}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus={true}
                      />
                    </View>

                    {filteredMembers && filteredMembers.length > 0 ? (
                      <FlatList
                        data={filteredMembers}
                        keyExtractor={item => item.id.toString()}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={[
                              styles.dropdownItem,
                              { borderBottomColor: colors.borderColor },
                            ]}
                            onPress={() => {
                              setSelectedMemberId(item.id);
                              setIsMemberDropdownOpen(false);
                              setSearchQuery('');
                            }}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.dropdownItemText,
                                { color: colors.textPrimary },
                              ]}
                            >
                              {item.full_name}
                            </Text>
                          </TouchableOpacity>
                        )}
                        showsVerticalScrollIndicator={true}
                        bounces={false}
                        keyboardShouldPersistTaps="handled"
                        style={styles.flatListStyle}
                        removeClippedSubviews={false}
                        scrollEventThrottle={16}
                      />
                    ) : (
                      <Text
                        style={[
                          styles.noResultsText,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {searchQuery
                          ? 'No members found matching your search'
                          : 'No members found'}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
          {/* <Text style={styles.arrowIcon}>{'>'}</Text> */}
          <TouchableOpacity
            style={styles.arrowIconContainer}
            onPress={() => setIsMemberDropdownOpen(!isMemberDropdownOpen)}
          >
            <Image
              source={require('../../assets/icons/Dropdown.png')}
              style={[
                styles.arrowIcon,
                {
                  tintColor:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                  transform: [
                    { rotate: isMemberDropdownOpen ? '180deg' : '0deg' },
                  ],
                },
              ]}
            />
          </TouchableOpacity>
        </View>

        {/* Tab Button Section */}
        <View style={styles.tabContainer}>
          <View
            style={[
              styles.tabButtonWrapper,
              {
                backgroundColor: colors.cardBackground,
                borderColor:
                  theme === 'dark'
                    ? colors.themeBorderDropdown
                    : colors.borderColor,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.tabButton,
                selectedTab === 'Charts' && styles.tabButtonActive,
                {
                  borderBottomColor:
                    theme === 'dark' ? colors.accent : colors.Orangeaccentcolor,
                },
              ]}
              onPress={() => handleTabChange('Charts')}
              activeOpacity={0.8}
            >
              <Text
                style={
                  selectedTab === 'Charts'
                    ? [
                        styles.tabButtonTextActive,
                        {
                          color:
                            theme === 'dark'
                              ? colors.accent
                              : colors.Orangeaccentcolor,
                        },
                      ]
                    : [styles.tabButtonText, { color: colors.textPrimary }]
                }
              >
                Charts
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                selectedTab === 'Dasha' && styles.tabButtonActive,
                {
                  borderBottomColor:
                    theme === 'dark' ? colors.accent : colors.Orangeaccentcolor,
                },
              ]}
              onPress={() => handleTabChange('Dasha')}
              activeOpacity={0.8}
            >
              <Text
                style={
                  selectedTab === 'Dasha'
                    ? [
                        styles.tabButtonTextActive,
                        {
                          color:
                            theme === 'dark'
                              ? colors.accent
                              : colors.Orangeaccentcolor,
                        },
                      ]
                    : [styles.tabButtonText, { color: colors.textPrimary }]
                }
              >
                Dasha
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Tab Content Placeholder */}
        <ScrollView
          ref={mainScrollRef}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refreshProfileData}
              tintColor="#F6EFD9"
              colors={['#F6EFD9']}
            />
          }
          style={styles.tabContentContainer}
        >
          {/* Dasha Overview */}
          {/* Astro AI Chat Card */}
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
                Ask questions about your life, career, relationships
              </Text>
              <TouchableOpacity
                style={[
                  styles.astroButton,
                  { backgroundColor: colors.Orangeaccentcolor },
                ]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('ChatScreen')}
              >
                <Text
                  style={[styles.astroButtonText, { color: colors.white }]}
                >
                  Chat with Astro AI
                </Text>
              </TouchableOpacity>
            </View>
            <Image
              source={require('../../assets/image/Ai-robot.png')}
              style={styles.astroImage}
            />
          </View>
          


          {selectedTab === 'Dasha' && (
            <ImageBackground
              source={
                theme === 'dark'
                  ? require('../../assets/image/DarkBackground.png')
                  : require('../../assets/image/LightBackground.png')
              }
              blurRadius={12}
              style={[
                styles.membersCard,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.transparent : colors.white,
                  borderColor: colors.borderColor,
                },
              ]}
              imageStyle={styles.membersBgImage}
            >
              <View style={styles.membersOverlay} />
              <View
                style={[
                  styles.dashaContainer,
                  {
                    backgroundColor:
                      theme === 'dark' ? colors.transparent : colors.white,
                    borderColor: colors.borderColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dashaTitle,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  Current Dasha Overview
                </Text>
                <View style={styles.dashaCardsRow}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled={false}
                    contentContainerStyle={styles.scrollContent}
                    onScroll={handleDashaScroll}
                    ref={dashaScrollRef}
                  >
                    {dashaData.map(dasha => (
                      <View
                        key={dasha.id}
                        style={[
                          styles.dashaCard,
                          {
                            backgroundColor:
                              theme === 'dark'
                                ? colors.DarkNavyBlue
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
                          },
                        ]}
                      >
                        <Image source={dasha.icon} style={styles.dashaIcon} />
                        <Text
                          style={[
                            styles.dashaType,
                            {
                              color:
                                theme === 'dark'
                                  ? colors.themeTextWhite
                                  : colors.DarkNavy,
                            },
                          ]}
                        >
                          {dasha.type}
                        </Text>
                        <Text
                          style={[
                            styles.dashaPlanet,
                            {
                              color:
                                theme === 'dark'
                                  ? colors.themeTextWhite
                                  : colors.DarkNavy,
                            },
                          ]}
                        >
                          {dasha.planet}
                        </Text>
                        <Text
                          style={[
                            styles.dashaDates,
                            {
                              color:
                                theme === 'dark'
                                  ? colors.themeTextWhite
                                  : colors.DarkNavy,
                            },
                          ]}
                        >
                          {dasha.startDate}
                          {'\n'}
                          {dasha.endDate}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
                {/* Pagination Dots */}
                {/* {dashaData.length > 0 && (
              <View style={styles.paginationDots}>
                {Array.from({ length: numDashaGroups }).map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      const newGroup = index * 3;
                      dashaScrollRef.current?.scrollTo({
                        x: newGroup * (120 + 16) * 3, // Scroll to the start of the new group
                        animated: true,
                      });
                    }}
                    style={[
                      styles.paginationDot,
                      index === currentDashaGroup &&
                        styles.paginationDotActive, // Only one dot active
                    ]}
                  />
                ))}
              </View>
            )} */}
              </View>
            </ImageBackground>
          )}
          {selectedTab === 'Charts' && (
            // <View>
            <ChartsScreen
              chartDetails={{
                D1: chartDetails?.D1,
                D9: chartDetails?.D9,
                D10: chartDetails?.D10,
                D60: chartDetails?.D60,
                planets_positions: chartDetails?.planets_positions,
              }}
            />
            // </View>
          )}
          {selectedTab === 'Dasha' && (
            // <View> {/* Dasha Content */}
            <DashaScreen
              dashaDetails={chartDetails?.all_dasha}
              planets_icon={chartDetails?.planets_icon}
            />
            // </View>
          )}
        </ScrollView>

        {/* Dasha Overview Table (always visible below tab content) */}
      </MainContainer>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
    minHeight: '100%',
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: color.DarkNavy,
  },
  lottieAnimation: {
    width: 264,
    height: 264,
    marginBottom: 20,
  },
  loadingText: {
    ...font.buttonLarge,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: responsiveWidth('15%'),
    paddingHorizontal: 16,
  },
  backBtn: {
    marginRight: 8,
  },
  backIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
    tintColor: '#F6EFD9',
  },
  topBarText: {
    color: '#F6EFD9',
    fontSize: 20,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
    marginLeft: 4,
  },
  centeredHeader: {
    alignItems: 'center',
    marginTop: responsiveWidth('2%'),
    // marginBottom: 16,
  },
  sunIcon: {
    width: responsiveWidth('100%'),
    height: responsiveWidth('20%'),
    resizeMode: 'contain',
    marginTop: responsiveWidth('5%'),
  },
  astroselfText: {
    color: '#F6EFD9',
    fontSize: 40,
    fontWeight: '700',
    fontFamily: fontFamily.regular,
  },
  lockKeyContainer: {
    alignItems: 'center',
    marginTop: -responsiveWidth('2%'),
    marginBottom: responsiveWidth('15%'),
  },
  lockKeyImage: {
    width: responsiveWidth('100%'),
    height: responsiveWidth('90%'),
    resizeMode: 'contain',
  },
  formContainer: {
    paddingHorizontal: 24,
    marginTop: 16,
  },
  input: {
    // borderRadius: 12,
    // paddingHorizontal: 16,
    // paddingVertical: 14,
    fontSize: 16,
    fontFamily: fontFamily.regular,
    // marginBottom: 16,
    // borderWidth: 1,
  },
  selectedMemberText: {
    // ...font.bodySmall,
    // fontSize: 18,
    // fontWeight: '500',
    fontSize: 16,
    fontFamily: fontFamily.regular,
  },
  headerIcon: {
    width: responsiveWidth('35%'),
    height: responsiveWidth('10%'),
    marginTop: responsiveWidth('10'),
    // marginRight: 8,
    resizeMode: 'contain',
  },
  sendOtpButton: {
    backgroundColor: '#DF8A5D',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  sendOtpButtonText: {
    color: '#EEE5CA',
    fontFamily: fontFamily.regular,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: responsiveWidth('3'),
    // marginBottom: responsiveWidth('2'),
  },
  logoIcon: {
    fontSize: 36,
    fontFamily: fontFamily.regular,
    color: '#F6EFD9',
    marginBottom: 4,
  },
  headerText: {
    fontSize: 24,
    marginTop: responsiveWidth('10'),
    fontFamily: fontFamily.regular,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: responsiveWidth('2'),
    marginTop: responsiveWidth('1.5'),
    marginHorizontal: responsiveWidth('3'),
    marginBottom: 24,
    borderWidth: 2,
  },
  profileIcon: {
    width: responsiveWidth('7%'),
    height: responsiveWidth('7%'),
    // borderRadius: 18,
    // marginLeft: responsiveWidth('2'),
    marginRight: responsiveWidth('3'),
  },
  profileName: {
    flex: 1,
    color: '#F6EFD9',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: fontFamily.regular,
  },
  arrowIcon: {
    width: responsiveWidth(7),
    height: responsiveWidth(7),
    marginRight: -responsiveWidth(1),
    resizeMode: 'contain',
    tintColor: color.themeTextWhite,
    transform: [{ rotate: '270deg' }],
  },
  dashaContainer: {
    // backgroundColor: 'rgba(34, 49, 73, 0.2)',
    padding:
      Platform.OS === 'android' ? responsiveWidth('2%') : responsiveWidth('2'),
    // borderWidth: 0.2,
    // borderColor: '#EEE5CA',
    // borderRadius: 10,
    // padding: responsiveWidth('2%'),
    // marginHorizontal: responsiveWidth('3'),
    // marginBottom: 24,
  },

  membersCard: {
    borderRadius: 16,
    // paddingVertical:
    //   Platform.OS === 'android' ? 0  : responsiveWidth('0'),
    justifyContent: 'center',
    alignItems: 'center',
    // paddingVertical: responsiveWidth('4%'),
    marginTop: responsiveWidth('2%'),
    marginHorizontal: responsiveWidth('3'),
    marginBottom: 24,
    borderWidth: 0.2,
    borderColor: '#EEE5CA',
    overflow: 'hidden',
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
  dashaTitle: {
    fontFamily: fontFamily.regular,
    fontWeight: '500',
    fontSize: 18,
    // lineHeight: 30,
    letterSpacing: -0.14,
    // textAlignVertical: 'center',
    textAlignVertical: 'center',
    // marginTop: responsiveWidth('2'),
  },
  dashaCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth('2'),
    paddingVertical: responsiveWidth('2'),
  },
  dashaCard: {
    alignItems: 'center',
    borderRadius: 16,
    padding: responsiveWidth('1'),
    paddingVertical: responsiveWidth('3'),
    marginRight: 16,
    width: responsiveWidth('37%'),
    // borderWidth: 0.2,
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.4,
    // shadowRadius: 3,
    // elevation: 3,
  },
  dashaIcon: {
    width: responsiveWidth('10'),
    height: responsiveWidth('10'),
    marginBottom: 8,
    resizeMode: 'contain',
    borderRadius: 100,
  },
  dashaType: {
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    // ...font.mini,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  dashaPlanet: {
    // fontWeight: '600',
    // ...font.mini,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  dashaDates: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 23,
  },
  tabContainer: {
    // marginTop: responsiveWidth('1'),
    marginHorizontal: responsiveWidth('3'),
    marginBottom: responsiveWidth('2'),
  },
  tabButtonWrapper: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 2,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveWidth('1.5'),
  },
  tabButtonActive: {
    // backgroundColor: 'transparent',
    borderBottomWidth: 3,
    // borderBottomColor: colors.Orangeaccentcolor,
  },
  tabButtonText: {
    fontFamily: fontFamily.regular,
    // fontWeight: '600',
    fontSize: 16,
    lineHeight: 27,
    letterSpacing: -0.45,
    textAlignVertical: 'center',
  },
  tabButtonTextActive: {
    fontFamily: fontFamily.regular,
    // fontWeight: '600',
    fontSize: 16,
    lineHeight: 27,
    letterSpacing: -0.45,
    textAlignVertical: 'center',
  },
  tabContentContainer: {
    flex: 1,
    // backgroundColor: '#F6EFD9',
    // borderRadius: 20,
    // margin: 16,
    // padding: responsiveWidth("2"),
    marginBottom: responsiveWidth('22%'),
    marginTop: responsiveWidth('2'),
    // minHeight: 400,
  },
  chartsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  chartCard: {
    width: '47%',
    backgroundColor: '#223149',
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
    resizeMode: 'contain',
    backgroundColor: '#fff',
  },
  chartLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: fontFamily.regular,
    marginTop: 4,
    marginBottom: 2,
  },
  dashaTabContent: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
    fontFamily: fontFamily.regular,
    marginTop: 20,
  },
  dashaTableContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 32,
  },
  dashaTableTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: fontFamily.regular,
    marginBottom: 10,
  },
  dashaTableBox: {
    backgroundColor: '#F6E0A9',
    borderRadius: 14,
    padding: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5D3A1',
  },
  dashaTableRowHeader: {
    flexDirection: 'row',
    backgroundColor: '#E5D3A1',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  dashaTableHeaderCell: {
    flex: 1,
    color: '#223149',
    fontWeight: '700',
    fontSize: 16,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  dashaTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5D3A1',
    backgroundColor: '#F6E0A9',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  dashaTableCell: {
    flex: 1,
    color: '#223149',
    fontSize: 15,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  dashaTableSignIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
    flex: 1,
    alignSelf: 'center',
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
    // marginBottom: 10,
  },
  paginationDot: {
    width: 7,
    height: 7,
    borderRadius: 6,
    backgroundColor: '#496CA8',
    marginHorizontal: responsiveWidth('1'),
    opacity: 0.6,
  },
  paginationDotActive: {
    backgroundColor: '#F6EFD9',
    opacity: 1,
    transform: [{ scale: 1.2 }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop:
      Platform.OS === 'ios' ? responsiveWidth('40') : responsiveWidth('30'), // Adjust this value to position below the button
  },
  modalDropdownContainer: {
    width: '92%',
    maxWidth: responsiveWidth('92'),
    alignSelf: 'center',
  },
  dropdownContainer: {
    borderRadius: 10,
    borderWidth: 1,
    maxHeight: 230,
    elevation: 10, // For Android shadow
    shadowColor: '#000', // For iOS shadow
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: fontFamily.regular,
    borderWidth: 1,
  },
  flatListStyle: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  dropdownItemText: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
  },
  noResultsText: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    paddingVertical: 10,
  },
  // Empty state styles
  emptyStateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: responsiveWidth(4),
    // paddingRight: responsiveWidth(2),
    justifyContent: 'space-between',
  },
  emptyStateContent: {
    flex: 1,
  },
  emptyStateTitle: {
    fontFamily: fontFamily.regular,
    // fontWeight: '500',
    fontSize: 14,
    // lineHeight: 30,
    letterSpacing: -0.14,
    textAlignVertical: 'center',
  },
  emptyStateButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginTop: responsiveWidth('2'),
    alignSelf: 'flex-start',
  },
  emptyStateButtonText: {
    fontFamily: fontFamily.regular,
    // fontWeight: '600',
    fontSize: 12,
  },
  emptyStateImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginLeft: 10,
    marginRight: 10,
  },
  arrowIconContainer: {
    // flex: 1,
    alignSelf: 'center',
  },
  astroCard: {
    borderRadius: 16,
    marginHorizontal: responsiveWidth('3'),
    marginTop: responsiveWidth('1.5'),
    marginBottom: responsiveWidth('4'),
    flexDirection: 'row',
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 3,
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
});

export default NakshatraScreen;
