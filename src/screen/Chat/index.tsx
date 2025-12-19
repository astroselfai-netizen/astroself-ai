// ChatScreen.tsx

import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Image,
  StatusBar,
  Platform,
  Modal,
  FlatList,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
} from 'react-native';
import {font, responsiveHeight, responsiveWidth, fontFamily, color, fontSize} from '../../constant/theme';
import { MainContainer } from '../../components/common/mainContainer';
import { useProfileData } from '../../hooks/useProfileData';
import CurrentSituation from '../../components/CurrentSituation';
import GeneralAnalysis from '../../components/GeneralAnalysis';
import SnapshotPredictions from '../../components/SnapshotPredictions';
import { useNavigation, useFocusEffect, useRoute, RouteProp,  } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import LottieView from 'lottie-react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';


type RootStackParamList = {
  ChatScreen: { userId: string };
};

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'ChatScreen'>;

const ChatScreen = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const [activeTab, setActiveTab] = useState('Current Situation');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const showInfoContainer = useSelector((state: RootState) => state.app.showInfoContainer);
  const navigation = useNavigation<any>();
  const { theme ,colors} = useTheme();
  const {profileData, membersData, loading, error, refreshProfileData } = useProfileData();

  console.log('profileData===>39', membersData);

  // Check if selected member is a child (age between 15-18 years)
  const isSelectedMemberChild = React.useMemo(() => {
    if (!selectedMemberId || !membersData || !Array.isArray(membersData)) {
      return false;
    }
    
    const selectedMember = membersData.find(
      (m: any) => (m.id || m._id) === selectedMemberId
    );
    
    if (!selectedMember || !selectedMember.birth_data) {
      return false;
    }
    
    const { year, month, day } = selectedMember.birth_data;
    if (!year || !month || !day) {
      return false;
    }
    
    // Calculate age
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    // Check if age is between 15 and 18 (inclusive)
    return age >= 15 && age <= 18;
  }, [selectedMemberId, membersData]);

  // Switch to Current Situation tab if General Analysis is active when showInfoContainer becomes true or if member is child
  useEffect(() => {
    if (showInfoContainer && activeTab === 'General Analysis') {
      setActiveTab('Current Situation');
    }
    // If selected member is a child and General Analysis tab is active, switch to Current Situation
    if (isSelectedMemberChild && activeTab === 'General Analysis') {
      setActiveTab('Current Situation');
    }
  }, [showInfoContainer, activeTab, isSelectedMemberChild]);

  // Refresh data every time user comes to this screen
  useFocusEffect(
    React.useCallback(() => {
      console.log('Chat screen focused, refreshing data...');
      if (refreshProfileData) {
        refreshProfileData();
      }
    }, [refreshProfileData]),
  );

  // Set selectedMemberId only when userId comes from route params
  useEffect(() => {
    if (route.params?.userId && route.params.userId.trim() !== '') {
      console.log('Setting member from route params:', route.params.userId);
      setSelectedMemberId(route.params.userId);
    }
  }, [route.params?.userId]);

  // Show error alert if there's an error
  React.useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [
        { text: 'OK' },
        { text: 'Retry', onPress: refreshProfileData },
      ]);
    }
  }, [error, refreshProfileData]);

  // Show loading state
  // if (loading) {
  //   return (
  //     <MainContainer>
  //       <StatusBar barStyle="light-content" backgroundColor="#202945" />
  //       <View style={styles.loadingContainer}>
  //         <Text style={styles.loadingText}>Loading Predictions...</Text>
  //       </View>
  //     </MainContainer>
  //   );
  // }

  // Set selectedMemberId based on primary member from membersData (only initially)
  useEffect(() => {
    if (
      membersData &&
      Array.isArray(membersData) &&
      membersData.length > 0 &&
      // !hasUserSelectedMember && // Only set initial selection if user hasn't manually selected
      !selectedMemberId // Only set if no member is currently selected
    ) {
      // Function to get primary member ID
      const getPrimaryMemberId = () => {
        console.log('Looking for primary member in membersData:', membersData);

        // Look for a member with primary_mamber field set to "True"
        const primaryMember = membersData.find((member: any) => {
          console.log(
            'Checking member:',
            member.full_name,
            'primary_mamber:',
            member.primary_mamber,
          );
          return member.primary_mamber === 'True';
        });

        if (primaryMember) {
          console.log('Found primary member:', primaryMember);
          return primaryMember.id || primaryMember._id;
        }

        // If no primary_mamber == "True" found, use first member
        const firstMember = membersData[0];
        console.log(
          'No primary member found, using first member:',
          firstMember,
        );
        return firstMember?.id || firstMember?._id || null;
      };

      const primaryMemberId = getPrimaryMemberId();
      console.log(
        'Setting initial selection to primary member:',
        primaryMemberId,
      );
      setSelectedMemberId(primaryMemberId);
    }
  }, [membersData]);

  // Navigate to Nakshatra screen
  const handleNakshatraNavigation = () => {
    if (selectedMemberId) {
      navigation.navigate('NakshatraScreen', {
        screen: 'NakshatraScreen',
        params: {
          userId: selectedMemberId,
        },
      });
    } else {
      Alert.alert('Error', 'Please select a member first');
    }
  };


 if (loading) {
   return (
     <KeyboardAvoidingView
       behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
       style={{ flex: 1, backgroundColor: '#202945' }}
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
           {/* <Text style={[styles.loadingText,{
              color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
            }]}>Loading profile...</Text> */}
         </View>
       </MainContainer>
     </KeyboardAvoidingView>
   );
 }


  // Show empty state if no members data
  if (!membersData || membersData.length === 0) {
    return (
      <MainContainer>
        <StatusBar barStyle="light-content" backgroundColor="#202945" />

        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerCenter}>
              <Text
                style={[
                  styles.headerTitle,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              >
                Predictions
              </Text>
            </View>
          </View>
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
            styles.emptyStateCardContainer,
            {
              backgroundColor: theme === 'dark' ? colors.surface : colors.white,
              borderColor:
                theme === 'dark'
                  ? colors.themeBorderDropdown
                  : colors.borderColor,
            },
          ]}
          imageStyle={[
            styles.emptyStateCard,
            {
              backgroundColor: theme === 'dark' ? colors.surface : colors.white,
              borderColor:
                theme === 'dark'
                  ? colors.themeBorderDropdown
                  : colors.borderColor,
            },
          ]}
        >
          {/* <View style={[{backgroundColor: theme === 'dark' ? colors.transparent : colors.white}]} /> */}
          <View
            style={[
              styles.emptyStateContainer,
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
              {/* <Text
                style={[
                  styles.mahadashaTitle,
                  {
                    color:
                      theme === 'dark' ? colors.textPrimary : colors.DarkNavy,
                  },
                ]}
              >
                Current Dasha Overview
              </Text> */}
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
                Add your details to generate your predictions
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
              style={styles.emptyStateImage as any}
            />
          </View>
        </ImageBackground>
      </MainContainer>
    );
  }

  return (
    <MainContainer>
      <StatusBar barStyle="light-content" backgroundColor="#202945" />

      <View style={styles.header}>
        <View style={styles.headerRow}>
          {/* <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Image source={icons.Icback} style={styles.backIcon} />
          </TouchableOpacity> */}
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
              Predictions
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile member dropdown */}
        <View
          style={[
            styles.profileCardContainer,
            {
              backgroundColor:
                theme === 'dark' ? colors.DarkNavy : colors.white,
              borderColor:
                theme === 'dark' ? colors.themeBorderDropdown : colors.white,
            },
          ]}
        >
          <Image
            source={require('../../assets/icons/profile-icons.png')}
            style={styles.profileIcon as any}
          />
          <View
            style={[
              styles.dropdownWrapper,
              {
                backgroundColor:
                  theme === 'dark' ? colors.DarkNavy : colors.white,
                borderColor:
                  theme === 'dark'
                    ? colors.themeBorderDropdown
                    : colors.borderColor,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.input,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.DarkNavy : colors.surfaceOpacity,
                  borderColor:
                    theme === 'dark'
                      ? colors.themeBorderDropdown
                      : colors.borderColor,
                },
              ]}
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
                  ? membersData?.find(
                      (m: any) => (m.id || m._id) == selectedMemberId,
                    )?.full_name || 'Select Member'
                  : 'Select Member'}
              </Text>
            </TouchableOpacity>

            <Modal
              visible={isMemberDropdownOpen}
              transparent={true}
              animationType="none"
              onRequestClose={() => setIsMemberDropdownOpen(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setIsMemberDropdownOpen(false)}
              >
                <View style={styles.modalDropdownContainer}>
                  <View
                    style={[
                      styles.dropdownContainer,
                      {
                        backgroundColor:
                          theme === 'dark' ? colors.DarkNavy : colors.white,
                        borderColor:
                          theme === 'dark'
                            ? colors.themeBorderDropdown
                            : colors.borderColor,
                      },
                    ]}
                  >
                    {membersData && membersData.length > 0 ? (
                      <FlatList
                        data={membersData}
                        keyExtractor={item => (item.id || item._id).toString()}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={styles.dropdownItem}
                            onPress={() => {
                              setSelectedMemberId(item.id || item._id);
                              setIsMemberDropdownOpen(false);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.dropdownItemText,
                                {
                                  color:
                                    theme === 'dark'
                                      ? colors.themeTextWhite
                                      : colors.DarkNavy,
                                },
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
                      <Text style={styles.noResultsText}>No members found</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
          <TouchableOpacity
            style={styles.arrowIconContainer}
            onPress={() => setIsMemberDropdownOpen(!isMemberDropdownOpen)}
          >
            <Image
              source={require('../../assets/icons/Dropdown.png')}
              style={[
                styles.arrowIcon as any,
                {
                  transform: [
                    { rotate: isMemberDropdownOpen ? '180deg' : '0deg' },
                  ],
                  marginRight: -responsiveWidth('1.5%'),
                  tintColor:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            />
          </TouchableOpacity>
        </View>

        {showInfoContainer && (
          <View
            style={[
              styles.infoContainer,
              {
                backgroundColor:
                  theme === 'dark'
                    ? colors.Orangeaccentcolor
                    : colors.Orangeaccentcolor,
              },
            ]}
          >
            <Text
              style={[
                styles.infoText,
                {
                  color:
                    theme === 'dark'
                      ? colors.themeTextWhite
                      : colors.transparentWhite,
                },
              ]}
            >
              Enjoy your snapshot predictions while we get your chart analysed.
            </Text>
          </View>
        )}

        {/* Greeting Section Card */}
        <ImageBackground
          source={
            theme === 'dark'
              ? require('../../assets/image/DarkBackground.png')
              : require('../../assets/image/LightBackground.png')
          }
          blurRadius={12}
          style={[
            styles.greetingCard as any,
            {
              backgroundColor:
                theme === 'dark' ? colors.transparent : colors.white,
              borderColor:
                theme === 'dark'
                  ? colors.themeBorderDropdown
                  : colors.borderColor,
            },
          ]}
          imageStyle={[
            styles.greetingCardBgImage,
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
          <View style={styles.greetingOverlay} />
          <View
            style={[
              styles.greetingContent,
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
            {/* <View style={styles.greetingSection}>
              <Text style={styles.greetingText}>
                Hello{' '}
                <Text style={styles.highlightedName}>
                  {selectedMemberId
                    ? membersData?.find((m: any) => m.id === selectedMemberId)
                        ?.full_name || 'Member'
                    : 'Member'}
                </Text>{' '}
                👋, how can I guide you today?
              </Text>
              <Text style={styles.instructionText}>
                Tap a house to explore deeper insights
              </Text>
            </View> */}

            {/* Separator Line */}
            {/* <View style={styles.separatorLine} /> */}

            {/* User Details */}
            <View
              style={[
                styles.userDetailsContainer,
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
              <View
                style={[
                  styles.detailItem,
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
                <Text
                  style={[
                    styles.detailLabel,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  Date of Birth
                </Text>
                <View>
                  {selectedMemberId &&
                  membersData?.find(
                    (m: any) => (m.id || m._id) == selectedMemberId,
                  )?.birth_data ? (
                    (() => {
                      const member = membersData.find(
                        (m: any) => (m.id || m._id) == selectedMemberId,
                      );
                      const { day, month, year, hour, min } = member.birth_data;
                      const dateStr = new Date(
                        year,
                        month - 1,
                        day,
                      ).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      });

                      // Format time in 12-hour format with AM/PM
                      let timeStr = '';
                      if (hour !== undefined && min !== undefined) {
                        const hour12 = hour % 12 || 12;
                        const minute = min < 10 ? `0${min}` : min;
                        const ampm = hour >= 12 ? 'PM' : 'AM';
                        timeStr = `${hour12}:${minute} ${ampm}`;
                      }

                      return (
                        <>
                          <Text
                            style={[
                              styles.detailValue,
                              {
                                color:
                                  theme === 'dark'
                                    ? colors.themeTextWhite
                                    : colors.DarkNavy,
                              },
                            ]}
                          >
                            {dateStr}
                          </Text>
                          {timeStr ? (
                            <Text
                              style={[
                                styles.detailValue,
                                {
                                  color:
                                    theme === 'dark'
                                      ? colors.themeTextWhite
                                      : colors.DarkNavy,
                                },
                              ]}
                            >
                              {timeStr}
                            </Text>
                          ) : null}
                        </>
                      );
                    })()
                  ) : (
                    <Text
                      style={[
                        styles.detailValue,
                        {
                          color:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.DarkNavy,
                        },
                      ]}
                    >
                      Not Available
                    </Text>
                  )}
                </View>
              </View>
              <View
                style={[
                  styles.detailSeparator,
                  {
                    backgroundColor:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              />
              <View style={styles.detailItem}>
                <Text
                  style={[
                    styles.detailLabel,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  Place of Birth
                </Text>
                <Text
                  style={[
                    styles.detailValue,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  {selectedMemberId &&
                  membersData?.find(
                    (m: any) => (m.id || m._id) == selectedMemberId,
                  )?.birthplace
                    ? membersData.find(
                        (m: any) => (m.id || m._id) == selectedMemberId,
                      ).birthplace
                    : 'Not Available'}
                </Text>
              </View>
            </View>

            {/* Nakshatra & Dasha Button */}
            <View style={styles.nakshatraButtonContainer}>
              <TouchableOpacity
                style={styles.nakshatraButton}
                onPress={handleNakshatraNavigation}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.nakshatraButtonText,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.surface,
                    },
                  ]}
                >
                  Charts
                </Text>
              </TouchableOpacity>

              {/* <TouchableOpacity
                style={styles.nakshatraButton}
                onPress={() => {
                  navigation.navigate('DashboardTasksScreen', {
                    userId: selectedMemberId,
                  });
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.nakshatraButtonText,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.surface,
                    },
                  ]}
                >
                  Tasks
                </Text>
              </TouchableOpacity> */}
              <TouchableOpacity
                style={styles.nakshatraButton}
                onPress={() => {
                  navigation.navigate('ReportScreen', {
                    userId: selectedMemberId,
                  });
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.nakshatraButtonText,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.surface,
                    },
                  ]}
                >
                  Report
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>

        {/* Analysis Tabs */}
        <ImageBackground
          source={
            theme === 'dark'
              ? require('../../assets/image/DarkBackground.png')
              : require('../../assets/image/LightBackground.png')
          }
          blurRadius={12}
          style={[
            styles.tabsContainer as any,
            {
              backgroundColor:
                theme === 'dark' ? colors.transparent : colors.white,
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
            {/* <TouchableOpacity
               style={[
                 styles.tab,
                 activeTab === 'Snapshot Predictions' && {
                   ...styles.activeTab,
                   borderBottomColor: theme === 'dark' ? colors.accent : colors.Orangeaccentcolor,
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
               onPress={() => setActiveTab('Snapshot Predictions')}
             >
               <Text
                 style={[
                   styles.tabText,
                   {
                     color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                   },
                   activeTab === 'Snapshot Predictions' && {
                     color: theme === 'dark' ? colors.accent : colors.Orangeaccentcolor,
                   },
                 ]}
               >
                 Snap cast
               </Text>
             </TouchableOpacity> */}

            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'Current Situation' && {
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
              onPress={() => setActiveTab('Current Situation')}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                  activeTab === 'Current Situation' && {
                    color:
                      theme === 'dark'
                        ? colors.accent
                        : colors.Orangeaccentcolor,
                  },
                ]}
              >
                Life now
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'General Analysis' && {
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
                  opacity: showInfoContainer || isSelectedMemberChild ? 0.5 : 1,
                },
              ]}
              onPress={() => {
                if (!showInfoContainer && !isSelectedMemberChild) {
                  setActiveTab('General Analysis');
                }
              }}
              disabled={showInfoContainer || isSelectedMemberChild}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                  activeTab === 'General Analysis' && {
                    color:
                      theme === 'dark'
                        ? colors.accent
                        : colors.Orangeaccentcolor,
                  },
                  (showInfoContainer || isSelectedMemberChild) && {
                    opacity: 0.5,
                  },
                ]}
              >
                Life view
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </ImageBackground>

        {/* Tab Content */}
        <View style={styles.tabContentContainer}>
          {activeTab === 'Snapshot Predictions' ? (
            <SnapshotPredictions selectedMemberId={selectedMemberId || ''} />
          ) : activeTab === 'Current Situation' ? (
            <CurrentSituation
              selectedMemberId={selectedMemberId || ''}
              isChild={isSelectedMemberChild}
            />
          ) : (
            <GeneralAnalysis selectedMemberId={selectedMemberId || ''} />
          )}
        </View>
        {/* {activeTab === 'General Analysis' ? (
          <GeneralAnalysis selectedMemberId={selectedMemberId} />
        )} */}
        {/* {activeTab === 'General Analysis' && (
          <GeneralAnalysis selectedMemberId={selectedMemberId} />
        )} */}
      </ScrollView>
    </MainContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202945',
  },
  header: {
    alignItems: 'center',
    // paddingTop: responsiveHeight(2),
    paddingBottom: responsiveHeight(1),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    textAlign: 'center',
    marginTop:
      Platform.OS === 'android'
        ? responsiveHeight('0.5%')
        : responsiveWidth('13%'),
    // marginBottom: responsiveWidth('5%'),
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  headerTitle: {
    color: color.themeTextWhite,
    fontSize: 24,
    fontFamily: fontFamily.regular,
  },
  headerCenter: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  profileCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 49, 73, 0.9)',
    borderRadius: 10,
    padding: responsiveWidth('2'),
    // marginTop: responsiveWidth('1'),
    // marginHorizontal: responsiveWidth('3'),
    marginBottom: 24,
    borderWidth: 2,
    borderColor: color.themeBorderDropdown,
    position: 'relative',
    zIndex: 99999,
  },
  dropdownWrapper: {
    zIndex: 999,
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: responsiveWidth(4),
    paddingBottom: responsiveHeight(15), // Space for bottom navigation
  },
  profileIcon: {
    width: responsiveWidth('7%'),
    height: responsiveWidth('7%'),
    // marginLeft: responsiveWidth('1'),
    marginRight: responsiveWidth('3'),
  },
  input: {
    backgroundColor: '#223149',
    color: '#fff',
    fontSize: 16,
    fontFamily: fontFamily.regular,
    borderColor: '#496CA8',
  },
  selectedMemberText: {
    color: color.themeTextWhite,
    // ...font.input,
    // fontWeight: '500',
    fontSize: 16,
    fontFamily: fontFamily.regular,
  },
  arrowIcon: {
    width: responsiveWidth('7%'),
    height: responsiveWidth('7%'),
    resizeMode: 'contain',

    tintColor: color.themeTextWhite,
    // transform: [{ rotate: '270deg' }],
  },
  infoContainer: {
    padding: responsiveWidth(2),
    borderRadius: 8,
    marginBottom: responsiveHeight(2),
  },
  infoText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop:
      Platform.OS === 'ios' ? responsiveWidth('42') : responsiveWidth('29'),
  },
  modalDropdownContainer: {
    width: '90%',
    maxWidth: responsiveWidth('90'),
    alignSelf: 'center',
  },
  dropdownContainer: {
    backgroundColor: '#223149',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#496CA8',
    maxHeight: 200,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  flatListStyle: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#496CA8',
  },
  dropdownItemText: {
    color: color.themeTextWhite,
    fontSize: 16,
    fontFamily: fontFamily.regular,
  },
  noResultsText: {
    color: color.themeTextWhite,
    fontSize: 16,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    paddingVertical: 10,
  },
  greetingCard: {
    borderRadius: 16,

    marginBottom: 24,
    borderWidth: 0.2,
    borderColor: '#EEE5CA',
    overflow: 'hidden',
  },
  greetingCardBgImage: {
    borderRadius: 16,
    opacity: 0.7,
  },
  greetingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  greetingContent: {
    position: 'relative',
    zIndex: 1,
    padding: responsiveWidth('2%'),
    paddingVertical: responsiveWidth('3%'),
    // marginHorizontal: responsiveWidth('1'),
  },
  greetingSection: {
    marginBottom: responsiveHeight(1),
  },
  greetingText: {
    color: color.themeTextWhite,
    ...font.body,
    marginBottom: responsiveHeight(0.5),
    lineHeight: 24,
  },
  highlightedName: {
    color: '#F2994A',
    fontWeight: '600',
  },
  instructionText: {
    color: '#F6EFD9',
    ...font.bodySmall,
    opacity: 0.8,
  },
  separatorLine: {
    height: 1,
    backgroundColor: '#F6EFD9',
    opacity: 0.3,
    // marginVertical: responsiveHeight(1.5),
  },
  userDetailsContainer: {
    flexDirection: 'row',
    // marginBottom: responsiveHeight(2),
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    color: color.themeTextWhite,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    // fontWeight: '400',
    marginBottom: responsiveHeight(0.5),
  },
  detailValue: {
    color: color.themeTextWhite,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    // textTransform: 'capitalize',
    textAlign: 'center',
    // fontWeight: '500',
  },
  detailSeparator: {
    width: 1,
    backgroundColor: '#F6EFD9',
    opacity: 0.3,
    marginHorizontal: responsiveWidth(2),
  },
  nakshatraButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // gap: responsiveWidth(10),
    justifyContent: 'space-around',
    // marginBottom: responsiveHeight(2),
  },
  nakshatraButton: {
    backgroundColor: '#DF8A5D',
    borderRadius: 10,
    // width: responsiveWidth('40%'),
    // flex: 1,
    // marginHorizontal: responsiveWidth('20'),
    paddingVertical: 14,
    paddingHorizontal: 34,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: responsiveHeight(1),
  },
  nakshatraButtonText: {
    color: color.themeTextWhite,
    fontSize: 12,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
    lineHeight: 18, // 150% of 12px = 18px
    letterSpacing: 0.6,
    // paddingHorizontal: responsiveWidth('2%'),
    textAlign: 'center',
  },
  tabsContainer: {
    borderRadius: 10,
    borderWidth: 2,
    borderColor: color.themeBorderDropdown,
    overflow: 'hidden',
    marginBottom: responsiveHeight(2),
    // marginHorizontal: responsiveWidth(3),
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
    // backgroundColor: 'rgba(32, 41, 69, 0.7)',
  },
  tabsScrollView: {
    position: 'relative',
    zIndex: 1,
  },
  tabsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: "space-between",
    paddingHorizontal: responsiveWidth(2),
  },
  tab: {
    paddingVertical: responsiveWidth(2),
    paddingHorizontal: responsiveWidth(1.5),
    alignItems: 'center',
    // justifyContent: "space-between",
    minWidth: responsiveWidth(43.5),
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#F2994A', // This will be overridden by theme colors
  },
  tabText: {
    color: color.themeTextWhite,
    // ...font.button,
    fontSize: 16,
    // fontWeight: '500',
    fontFamily: fontFamily.regular,
    lineHeight: 27,
    letterSpacing: -0.45,
    // textAlign: 'center',
  },
  activeTabText: {
    color: '#F2994A',
    fontFamily: fontFamily.regular,
    // ...font.button,
    fontSize: 16,
    // fontWeight: '500',
    lineHeight: 27,
    letterSpacing: -0.45,
    textAlign: 'center',
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#223149',
    paddingVertical: responsiveHeight(1),
    paddingHorizontal: responsiveWidth(2),
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF',
    opacity: 0.1,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: responsiveHeight(0.5),
  },
  navIcon: {
    width: 24,
    height: 24,
    marginBottom: responsiveHeight(0.5),
  },
  navText: {
    color: '#FFFFFF',
    fontSize: fontSize.xxsmall,
    fontFamily: fontFamily.regular,
    fontWeight: '400' as const,
  },
  activeNavText: {
    color: '#DF8A5D',
    fontWeight: '600' as const,
  },
  tabContentContainer: {
    flex: 1,
    paddingTop: responsiveHeight(1),
  },
  // Loading state styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieAnimation: {
    width: 264,
    height: 264,
    // marginBottom: 20,
  },
  loadingText: {
    color: '#F6EFD9',
    fontSize: fontSize.mediumx,
    fontWeight: '600' as const,
  },
  // Empty state styles
  emptyStateCardContainer: {
    marginTop: responsiveWidth('2%'),
    marginHorizontal: responsiveWidth('4'),
    // paddingHorizontal: responsiveWidth('4'),
    borderRadius: 16,
    // paddingVertical: Platform.OS === 'android' ? 10 : responsiveWidth('2'),
    paddingTop: Platform.OS === 'android' ? 10 : responsiveWidth('2'),
    paddingBottom: Platform.OS === 'android' ? 10 : responsiveWidth('4'),
    marginBottom: 24,
  },
  emptyStateCard: {
    borderRadius: 16,
    // padding: responsiveWidth('2%'),
    // paddingVertical: responsiveWidth('2%'),
    // padding: responsiveWidth('2%'),
    borderWidth: 0.2,
    borderColor: '#EEE5CA',
    // opacity: 0.7,
  },
  emptyStateOverlay: {
    // position: 'absolute',
    // top: 0,
    // padding: responsiveWidth('2%'),
    // left: 0,
    // right: 0,
    // bottom: 0,
  },
  emptyStateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'space-between',
    borderRadius: 16,
    // borderWidth: 0.2,
    // borderColor: '#EEE5CA',
    paddingLeft: responsiveWidth(4),
    // paddingRight: responsiveWidth(4),
    // paddingRight: responsiveWidth(2),
    // paddingVertical: Platform.OS === 'android' ? responsiveHeight('1') : responsiveWidth('0'),
    paddingTop:
      Platform.OS === 'android'
        ? responsiveHeight('0.5')
        : responsiveWidth('0'),
    paddingBottom:
      Platform.OS === 'android'
        ? responsiveHeight('1.5')
        : responsiveWidth('0'),
    // justifyContent: 'space-between',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContent: {
    flex: 1,
    // justifyContent: 'center',
    // alignItems: 'center',
  },
  mahadashaTitle: {
    // ...font.label,
    fontSize: 18,
    fontFamily: fontFamily.regular,
    // marginBottom: 12,
  },
  emptyStateTitle: {
    fontFamily: fontFamily.regular,
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 30,
    // textAlign: 'left',
    // textAlign: 'center',
    // width: '100%',
    letterSpacing: -0.14,
    color: color.themeTextWhite,
    // textAlignVertical: 'center',
    // textAlignVertical: 'center',
  },
  emptyStateButton: {
    borderColor: color.themeTextWhite,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginTop: 5,
    // marginTop: responsiveWidth('5'),
    alignSelf: 'flex-start',
  },
  emptyStateButtonText: {
    fontFamily: fontFamily.regular,
    color: color.themeTextWhite,
    // fontWeight: '600' as const,
    fontSize: 12,
  },
  emptyStateImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginLeft: 10,
    marginRight: 10,
  },
});

export default ChatScreen;
