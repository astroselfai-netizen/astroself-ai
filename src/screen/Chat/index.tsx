// ChatScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
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
import {
  font,
  responsiveHeight,
  responsiveWidth,
  fontFamily,
  color,
  fontSize,
} from '../../constant/theme';
import { MainContainer } from '../../components/common/mainContainer';
import { useProfileData } from '../../hooks/useProfileData';
import CurrentSituation from '../../components/CurrentSituation';
import {
  useNavigation,
  useFocusEffect,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import LottieView from 'lottie-react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import PremiumPlansModal from '../../components/PremiumPlansModal';
import FamilyUpgradeModal from '../../components/FamilyUpgradeModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useMemberPlanActions } from '../../hooks/useMemberPlanActions';
import planService from '../../services/plan/plan.service';

type RootStackParamList = {
  ChatScreen: { userId: string; tab?: string };
};

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'ChatScreen'>;

const ChatScreen = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const [showBuyMembershipModal, setShowBuyMembershipModal] = useState(false);
  const [modalFeatureName, setModalFeatureName] = useState<string>('Dynamic Predictions');
  const [_membersShownModal, setMembersShownModal] = useState<Set<string>>(new Set());
  // const [showFreePointsModal, setShowFreePointsModal] = useState(false);
  const navigation = useNavigation<any>();
  const { theme, colors } = useTheme();
  const { membersData, loading, error, refreshProfileData } =
    useProfileData();
  const user = useSelector((state: RootState) => state.app.user);
  const {
    creatingSubscription,
    isAssigning,
    purchaseForMember,
    assignFamilyToMember,
  } =
    useMemberPlanActions({ refreshProfileData });
  const [showAssignFamilyModal, setShowAssignFamilyModal] = useState(false);
  const [assignMember, setAssignMember] = useState<any>(null);
  const [showFamilyUpgradeModal, setShowFamilyUpgradeModal] = useState(false);
  const [familyUpgradeMember, setFamilyUpgradeMember] = useState<any>(null);
  const [familyUpgradeCreating, setFamilyUpgradeCreating] = useState(false);
  const [userPlanDetails, setUserPlanDetails] = useState<{
    current_plan: string;
    available_members_allow: number;
  } | null>(null);

  console.log('profileData===>39', membersData);

  // Get selected member
  const selectedMember = React.useMemo(() => {
    if (!selectedMemberId || !membersData || !Array.isArray(membersData)) {
      return false;
    }
    return membersData.find(
      (m: any) => (m.id || m._id) === selectedMemberId,
    );
  }, [selectedMemberId, membersData]);

  const isProcessingPending =
    selectedMember?.processing_data === false ||
    selectedMember?.processing_data === 'false' ||
    selectedMember?.processing_data === 0 ||
    selectedMember?.processing_data === '0';

  // Check if selected member is a child (age between 15-18 years)
  const isSelectedMemberChild = React.useMemo(() => {
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

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    // Check if age is between 15 and 18 (inclusive)
    return age >= 15 && age <= 18;
  }, [selectedMember]);

  const memberDisplayInfo = React.useMemo(() => {
    const member =
      selectedMember && typeof selectedMember === 'object'
        ? selectedMember
        : null;
    const name = member?.full_name || 'Select Member';

    let birthDateTime = 'Not Available';
    if (member?.birth_data) {
      const { day, month, year, hour, min } = member.birth_data;
      const dateStr = new Date(year, month - 1, day).toLocaleDateString(
        'en-US',
        {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        },
      );
      let timeStr = '';
      if (hour !== undefined && min !== undefined) {
        const hour12 = hour % 12 || 12;
        const minute = min < 10 ? `0${min}` : min;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        timeStr = ` ${hour12}:${minute} ${ampm}`;
      }
      birthDateTime = `${dateStr}${timeStr}`;
    }

    return {
      name,
      birthDateTime,
      birthplace: member?.birthplace || 'Not Available',
    };
  }, [selectedMember]);

  // Reset modal state when member changes (but don't clear the Set - we want to remember which members have seen it)
  useEffect(() => {
    setShowBuyMembershipModal(false);
  }, [selectedMemberId]);

  // Check if free points modal should be shown after login
  // useEffect(() => {
  //   const checkAndShowFreePointsModal = async () => {
  //     try {
  //       const shouldShow = await AsyncStorage.getItem('SHOW_FREE_POINTS_MODAL');
  //       if (shouldShow === 'true') {
  //         // Get current user ID
  //         const userDataStr = await AsyncStorage.getItem('USER_DATA');
  //         if (userDataStr) {
  //           const userData = JSON.parse(userDataStr);
  //           const userId = userData._id || userData.user_id || userData.id;
  //           if (userId) {
  //             // Mark this user as having seen the modal
  //             await AsyncStorage.setItem(
  //               `FREE_POINTS_MODAL_SEEN_${userId}`,
  //               'true',
  //             );

  //             // Show modal after a short delay to let the screen load
  //             setTimeout(() => {
  //               setShowFreePointsModal(true);
  //             }, 500);

  //             // Remove the temporary flag
  //             await AsyncStorage.removeItem('SHOW_FREE_POINTS_MODAL');
  //           }
  //         }
  //       }
  //     } catch (error) {
  //       console.error('Error checking free points modal flag:', error);
  //     }
  //   };
  //   checkAndShowFreePointsModal();
  // }, []);

  // Refresh data every time user comes to this screen
  useFocusEffect(
    React.useCallback(() => {
      console.log('Chat screen focused, refreshing data...');
      if (refreshProfileData) {
        refreshProfileData();
      }
    }, [refreshProfileData]),
  );

  // Set selectedMemberId when userId comes from route params
  useEffect(() => {
    if (route.params?.userId && route.params.userId.trim() !== '') {
      console.log('Setting member from route params:', route.params.userId);
      setSelectedMemberId(route.params.userId);
    }
  }, [route.params?.userId]);


  useEffect(() => {
    const checkAndNavigate = async () => {
      try {
        const navParamsStr = await AsyncStorage.getItem(
          'NAVIGATE_TO_CHAT_WITH_PROMPTS',
        );

        console.log('navParamsStr===>220', navParamsStr);
        if (navParamsStr) {
          let navParams = JSON.parse(navParamsStr);

          console.log(
            'Navigating to ChatWithPrompts with params:',
            membersData,
          );
          navParams = { ...navParams, userId: membersData[0]?.id };
          console.log('Navigating to ChatWithPrompts with params:', navParams);

          navParams = {
            "userId": membersData[0]?.id,
            "cardTitles": navParams.cardTitles,
            "tab": navParams.tab,
            "current_plan": navParams.current_plan,
            "subCards": navParams.subCards,
            "planet": navParams.planet,
            "onOpen": true,
          }

          // Clear the flag
          await AsyncStorage.removeItem('NAVIGATE_TO_CHAT_WITH_PROMPTS');

          // Navigate to ChatTab with ChatWithPrompts
          setTimeout(() => {
            const rootNavigation = navigation.getParent();
            if (rootNavigation) {
              (rootNavigation as any).navigate('ChatTab', {
                screen: 'ChatWithPrompts',
                params: navParams,
              });
            } else {
              navigation.navigate('ChatWithPrompts' as any, navParams);
            }
          }, 10);
        }
      } catch (errNav) {
        console.error('Error checking navigation flag:', errNav);
      }
    };

    checkAndNavigate();

    console.log('membersData===>252', membersData);
  }, [navigation, membersData, selectedMemberId]);


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
  }, [membersData, selectedMemberId]);

  // Navigate to Nakshatra screen
  const handleNakshatraNavigation = () => {
    if (selectedMemberId) {
      // navigation.navigate('NakshatraScreen', {
      //   screen: 'NakshatraScreen',
      //   params: {
      //     userId: selectedMemberId,
      //   },
      // });

      navigation.navigate('NakshatraScreen', {
        userId: selectedMemberId,
      });
    } else {
      Alert.alert('Error', 'Please select a member first');
    }
  };

  const handleCloseBuyMembershipModal = () => {
    setShowBuyMembershipModal(false);
    setModalFeatureName('Dynamic Predictions');
    if (selectedMemberId) {
      setMembersShownModal(prev => new Set(prev).add(selectedMemberId));
    }
  };

  const getSelectedMemberOrWarn = () => {
    if (!selectedMember || selectedMember === false) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select a member first',
        position: 'top',
        topOffset: 60,
        visibilityTime: 3000,
      });
      return null;
    }
    return selectedMember;
  };

  const getAccountPlanForMember = useCallback(async (userId: string) => {
    try {
      return await planService.getUserPlanDetails(userId);
    } catch (err: any) {
      const message = String(err.message || '').toLowerCase();
      const hasIndividualOnAccount =
        String(user?.current_plan || '') === 'eternal_path' ||
        membersData?.some(
          (m: { current_plan?: string }) => String(m.current_plan) === 'eternal_path',
        );
      const hasFamilyOnAccount =
        String(user?.current_plan || '') === 'family_plan' ||
        membersData?.some(
          (m: { current_plan?: string }) => String(m.current_plan) === 'family_plan',
        );

      if (
        message.includes('no active subscription') ||
        message.includes('subscription not found') ||
        message.includes('subscription')
      ) {
        if (hasIndividualOnAccount) {
          return {
            current_plan: 'eternal_path',
            members_allow: 1,
            available_members_allow: 0,
            email: '',
          };
        }
        if (hasFamilyOnAccount) {
          return {
            current_plan: 'family_plan',
            members_allow: 5,
            available_members_allow: 1,
            email: '',
          };
        }
      }

      throw err;
    }
  }, [user, membersData]);

  const openFamilyUpgradeForMember = useCallback((member: any) => {
    setFamilyUpgradeMember(member);
    setShowFamilyUpgradeModal(true);
  }, []);

  const applyMemberPlanFlow = useCallback(
    async (
      member: any,
      options?: { planType?: 'individual' | 'family'; featureName?: string },
    ) => {
      if (options?.featureName) {
        setModalFeatureName(options.featureName);
      }

      const memberPlan = String(member.current_plan || '');
      if (memberPlan === 'family_plan' || memberPlan === 'eternal_path') {
        return;
      }

      const userId = user?._id || (user as any)?.id;
      if (!userId) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'User not found',
          position: 'top',
          topOffset: 60,
          visibilityTime: 3000,
        });
        return;
      }

      try {
        const planDetails = await getAccountPlanForMember(userId);
        setUserPlanDetails({
          current_plan: planDetails.current_plan,
          available_members_allow: Number(planDetails.available_members_allow),
        });

        if (options?.planType === 'individual') {
          if (
            planDetails.current_plan === 'eternal_path' ||
            planDetails.current_plan === 'family_plan'
          ) {
            Toast.show({
              type: 'info',
              text1: 'Already Subscribed',
              text2: 'You already have an active plan',
              position: 'top',
              topOffset: 60,
              visibilityTime: 3000,
            });
            return;
          }
          await purchaseForMember(member, 'individual');
          return;
        }

        if (planDetails.current_plan === 'family_plan') {
          if (Number(planDetails.available_members_allow) <= 0) {
            Toast.show({
              type: 'info',
              text1: 'No Slots Available',
              text2: 'All family plan slots are already assigned.',
              position: 'top',
              topOffset: 60,
              visibilityTime: 3000,
            });
            return;
          }
          setAssignMember(member);
          setShowAssignFamilyModal(true);
          return;
        }

        if (planDetails.current_plan === 'eternal_path') {
          openFamilyUpgradeForMember(member);
          return;
        }

        if (options?.planType === 'family') {
          await purchaseForMember(member, 'family');
          return;
        }

        setShowBuyMembershipModal(true);
      } catch (err: any) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: err.message || 'Failed to load plan details',
          position: 'top',
          topOffset: 60,
          visibilityTime: 3000,
        });
      }
    },
    [user, getAccountPlanForMember, openFamilyUpgradeForMember, purchaseForMember],
  );

  const handleShowBuyMembershipModal = useCallback(
    async (featureName?: string) => {
      if (!selectedMember || selectedMember === false) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Please select a member first',
          position: 'top',
          topOffset: 60,
          visibilityTime: 3000,
        });
        return;
      }

      await applyMemberPlanFlow(selectedMember, { featureName });
    },
    [selectedMember, applyMemberPlanFlow],
  );

  const navigateToProfileForPlan = async (planType: 'individual' | 'family') => {
    const member = getSelectedMemberOrWarn();
    if (!member) return;
    handleCloseBuyMembershipModal();
    await applyMemberPlanFlow(member, { planType });
  };

  const handleSelectIndividualPlan = () => {
    navigateToProfileForPlan('individual');
  };

  const handleSelectFamilyPlan = () => {
    navigateToProfileForPlan('family');
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
                    (m: any) => (m.id || m._id) === selectedMemberId,
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

        {isProcessingPending && (
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

        {/* Birth details + Charts / Reports */}
        {(() => {
          const isDark = theme === 'dark';
          const cardBg = isDark ? '#2A3F58' : colors.white;
          const textPrimary = isDark ? colors.themeTextWhite : colors.DarkNavy;
          const textMuted = isDark ? colors.textSecondary || '#B8B0A0' : '#6B7280';
          const borderSubtle = isDark ? 'rgba(238, 229, 202, 0.22)' : '#E8E4DC';
          const iconBoxBg = isDark ? '#3F5570' : '#FFF0E6';

          return (
            <View
              style={[
                styles.chatDetailsCard,
                { backgroundColor: cardBg, borderColor: borderSubtle },
              ]}
            >
              <View style={styles.chatDetailRow}>
                <View style={[styles.chatIconBox, { backgroundColor: iconBoxBg }]}>
                  <Text style={[styles.chatIconEmoji, { color: colors.Orangeaccentcolor }]}>
                    📅
                  </Text>
                </View>
                <View style={styles.chatDetailTextWrap}>
                  <Text style={[styles.chatDetailLabel, { color: textMuted }]}>
                    Date Of Birth
                  </Text>
                  <Text style={[styles.chatDetailValue, { color: textPrimary }]}>
                    {memberDisplayInfo.birthDateTime}
                  </Text>
                </View>
              </View>

              <View
                style={[styles.chatDetailDivider, { backgroundColor: borderSubtle }]}
              />

              <View style={styles.chatDetailRow}>
                <View style={[styles.chatIconBox, { backgroundColor: iconBoxBg }]}>
                  <Text style={[styles.chatIconEmoji, { color: colors.Orangeaccentcolor }]}>
                    📍
                  </Text>
                </View>
                <View style={styles.chatDetailTextWrap}>
                  <Text style={[styles.chatDetailLabel, { color: textMuted }]}>
                    Place Of Birth
                  </Text>
                  <Text
                    style={[styles.chatDetailValue, { color: textPrimary }]}
                    numberOfLines={3}
                  >
                    {memberDisplayInfo.birthplace}
                  </Text>
                </View>
              </View>

              <View
                style={[styles.chatDetailDivider, { backgroundColor: borderSubtle }]}
              />

              <View style={styles.chatActionRow}>
                <TouchableOpacity
                  style={[
                    styles.chatOutlineButton,
                    { backgroundColor: cardBg, borderColor: colors.Orangeaccentcolor },
                  ]}
                  onPress={handleNakshatraNavigation}
                  activeOpacity={0.8}
                >
                  <Image
                    source={require('../../assets/icons/home/Chart.png')}
                    style={[
                      styles.chatOutlineButtonIcon,
                      { tintColor: colors.Orangeaccentcolor },
                    ]}
                  />
                  <Text
                    style={[
                      styles.chatOutlineButtonText,
                      { color: colors.Orangeaccentcolor },
                    ]}
                  >
                    Charts
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.chatOutlineButton,
                    { backgroundColor: cardBg, borderColor: colors.Orangeaccentcolor },
                  ]}
                  onPress={() => {
                    navigation.navigate('ReportScreen', {
                      userId: selectedMemberId,
                    });
                  }}
                  activeOpacity={0.8}
                >
                  <Image
                    source={require('../../assets/icons/home/Report.png')}
                    style={[
                      styles.chatOutlineButtonIcon,
                      { tintColor: colors.Orangeaccentcolor },
                    ]}
                  />
                  <Text
                    style={[
                      styles.chatOutlineButtonText,
                      { color: colors.Orangeaccentcolor },
                    ]}
                  >
                    Reports
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })()}

        {/* Analysis: card_type = tabs, sub_card = tab content */}
        <CurrentSituation
          key={`predictions-${selectedMemberId}`}
          selectedMemberId={selectedMemberId || ''}
          current_plan={
            selectedMember && typeof selectedMember === 'object'
              ? selectedMember.current_plan
              : undefined
          }
          first_user={
            selectedMember && typeof selectedMember === 'object'
              ? !!selectedMember.first_user
              : false
          }
          isPrimaryMember={
            selectedMember && typeof selectedMember === 'object'
              ? selectedMember.primary_mamber === 'True'
              : false
          }
          isChild={isSelectedMemberChild}
          isProcessingPending={isProcessingPending}
          onShowBuyMembershipModal={handleShowBuyMembershipModal}
        />

        <View style={styles.bottomNavigation}>
          <TouchableOpacity
            style={[
              styles.bottomNavigationButton,
              { backgroundColor: theme === 'dark' ? colors.cardBackground : '#FFFFFF',
                borderColor: colors.Orangeaccentcolor,
               },
            ]}
            onPress={() => {
              navigation.navigate('AddNewMember', { fromMemberPlanManagement: true });
            }}
          >
            <Text
              style={[
                styles.bottomNavigationButtonText,
                { color:colors.Orangeaccentcolor },
              ]}
            >
              Create New Chart
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <PremiumPlansModal
        visible={showBuyMembershipModal}
        onClose={handleCloseBuyMembershipModal}
        title="Choose Your Plan"
        subtitle={`To access ${modalFeatureName}, please upgrade your plan.`}
        creatingSubscription={creatingSubscription}
        individualDisabled={
          userPlanDetails?.current_plan === 'eternal_path' ||
          userPlanDetails?.current_plan === 'family_plan'
        }
        onSelectIndividual={handleSelectIndividualPlan}
        onSelectFamily={handleSelectFamilyPlan}
      />

      <Modal
        visible={showAssignFamilyModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isAssigning) setShowAssignFamilyModal(false);
        }}
      >
        <View style={styles.confirmModalOverlay}>
          <View
            style={[
              styles.confirmModalContainer,
              {
                backgroundColor: theme === 'dark' ? colors.DarkNavy : colors.white,
                borderColor:
                  theme === 'dark' ? colors.themeBorderDropdown : colors.borderColor,
              },
            ]}
          >
            <Text
              style={[
                styles.confirmModalTitle,
                { color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy },
              ]}
            >
              Assign Family Plan
            </Text>
            <Text
              style={[
                styles.confirmModalMessage,
                { color: theme === 'dark' ? colors.textSecondary : '#6B7280' },
              ]}
            >
              {`Assign a family plan slot to ${assignMember?.full_name || 'this member'}?`}
            </Text>

            <View style={styles.confirmModalButtonsRow}>
              <TouchableOpacity
                style={[styles.confirmModalButton, styles.confirmModalCancelButton]}
                onPress={() => setShowAssignFamilyModal(false)}
                disabled={isAssigning}
              >
                <Text style={styles.confirmModalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmModalButton,
                  {
                    backgroundColor: colors.Orangeaccentcolor,
                    opacity: isAssigning ? 0.7 : 1,
                  },
                ]}
                onPress={async () => {
                  if (!assignMember) return;
                  await assignFamilyToMember(assignMember);
                  setShowAssignFamilyModal(false);
                  setAssignMember(null);
                }}
                disabled={isAssigning}
              >
                <Text style={[styles.confirmModalButtonText, { color: '#FFFFFF' }]}>
                  {isAssigning ? 'Assigning...' : 'Assign'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <FamilyUpgradeModal
        visible={showFamilyUpgradeModal}
        onClose={() => {
          setShowFamilyUpgradeModal(false);
          setFamilyUpgradeMember(null);
        }}
        member={familyUpgradeMember}
        membersData={membersData}
        user={user}
        creatingSubscription={familyUpgradeCreating}
        onCreatingChange={setFamilyUpgradeCreating}
        onSuccess={() => {
          if (refreshProfileData) {
            refreshProfileData();
          }
        }}
        onIosFamilyPurchase={async billingMember => {
          await purchaseForMember(billingMember, 'family');
        }}
      />

      {/* Free Points Modal */}
      {/* <FreePointsModal
        visible={showFreePointsModal}
        onClose={async () => {
          setShowFreePointsModal(false);
        }}
      /> */}
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
    paddingBottom: responsiveHeight(13), // Space for bottom navigation
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
  arrowIconContainer: {
    alignSelf: 'center',
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
  userDetailsCard: {
    borderRadius: 12,
    paddingHorizontal: responsiveWidth(4),
    // paddingVertical: responsiveWidth(2),
    // marginBottom: responsiveWidth(3),
    // borderWidth: 1,
  },
  birthInfoRow: {
    flexDirection: 'row',
    // marginBottom: responsiveHeight(1.5),
    flexWrap: 'wrap',
    paddingTop: responsiveHeight(0.5),
  },
  birthInfoLabel: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    marginBottom: responsiveHeight(0.5),
  },
  birthInfoValue: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    flex: 1,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: responsiveWidth(3),
    marginTop: responsiveHeight(1),
    paddingHorizontal: responsiveWidth(3),
    paddingBottom: responsiveHeight(0.5),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: responsiveWidth(2),
    paddingHorizontal: responsiveWidth(4),
    gap: responsiveWidth(2),
  },
  actionButtonIcon: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    resizeMode: 'contain',
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
    fontWeight: '500',
  },
  bottomNavigation: {
    // backgroundColor: '#223149',
    // paddingVertical: responsiveHeight(1),
    // paddingHorizontal: responsiveWidth(2),
    // marginBottom: responsiveHeight(2),
    // marginTop: responsiveHeight(2),
  },
  bottomNavigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: responsiveWidth(2),
  },
  bottomNavigationButtonText: {
    color: color.themeTextWhite,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '600' as const,
  },
  chatDetailsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: responsiveWidth(3.5),
    marginBottom: responsiveWidth(3),
  },
  chatDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  chatIconBox: {
    width: responsiveWidth(9),
    height: responsiveWidth(9),
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: responsiveWidth(2.5),
  },
  chatIconEmoji: {
    fontSize: 16,
  },
  chatDetailTextWrap: {
    flex: 1,
  },
  chatDetailLabel: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    marginBottom: 4,
  },
  chatDetailValue: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    lineHeight: 20,
  },
  chatDetailDivider: {
    height: 1,
    marginVertical: responsiveWidth(2.5),
    opacity: 0.55,
  },
  chatActionRow: {
    flexDirection: 'row',
    gap: responsiveWidth(2.5),
    marginTop: responsiveWidth(0.5),
  },
  chatOutlineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveWidth(2.8),
    borderRadius: 12,
    borderWidth: 1.5,
    gap: responsiveWidth(2),
  },
  chatOutlineButtonIcon: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    resizeMode: 'contain',
  },
  chatOutlineButtonText: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
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
    justifyContent: 'center',
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
  // Buy Memberships Modal styles
  buyMembershipModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(4),
  },
  buyMembershipModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: responsiveHeight(3),
    paddingHorizontal: responsiveWidth(5),
    width: '100%',
    maxWidth: responsiveWidth(85),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(4),
  },
  confirmModalContainer: {
    width: '100%',
    maxWidth: responsiveWidth(85),
    borderRadius: 16,
    padding: responsiveWidth(5),
    alignItems: 'center',
  },
  confirmModalTitle: {
    fontSize: 22,
    fontFamily: fontFamily.bold,
    marginBottom: responsiveWidth(3),
    textAlign: 'center',
  },
  confirmModalMessage: {
    fontSize: 15,
    fontFamily: fontFamily.regular,
    marginBottom: responsiveWidth(5),
    textAlign: 'center',
    lineHeight: 22,
  },
  confirmModalButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: responsiveWidth(3),
  },
  confirmModalButton: {
    flex: 1,
    paddingVertical: responsiveWidth(3),
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmModalCancelButton: {
    borderWidth: 1,
  },
  confirmModalButtonText: {
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
  },
  modalIconContainer: {
    marginBottom: responsiveHeight(2),
    alignItems: 'center',
  },
  modalIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DF8A5D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#DF8A5D',
  },
  modalIconText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: fontFamily.bold,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#223149',
    fontFamily: fontFamily.bold,
    marginBottom: responsiveHeight(1.5),
    textAlign: 'center',
  },
  modalBodyText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: responsiveHeight(3),
    paddingHorizontal: responsiveWidth(2),
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: responsiveWidth(3),
  },
  modalButton: {
    flex: 1,
    paddingVertical: responsiveHeight(1.5),
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyButton: {
    backgroundColor: '#DF8A5D',
  },
  cancelButton: {
    backgroundColor: '#223149',
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: fontFamily.bold,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: fontFamily.bold,
  },
  // Premium Plan Modal styles
  premiumModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumModalContainer: {
    width: '90%',
    maxWidth: responsiveWidth(90),
    borderRadius: 20,
    padding: responsiveWidth(5),
    maxHeight: '90%',
  },
  premiumModalCloseButton: {
    position: 'absolute',
    top: responsiveWidth(3),
    right: responsiveWidth(3),
    width: responsiveWidth(8),
    height: responsiveWidth(8),
    borderRadius: responsiveWidth(4),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  premiumModalCloseText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  premiumModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: responsiveWidth(2),
    marginBottom: responsiveWidth(3),
  },
  premiumModalCrownIcon: {
    fontSize: 24,
    marginRight: responsiveWidth(2),
  },
  premiumModalTitle: {
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
    flex: 1,
  },
  premiumModalPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: responsiveWidth(3),
  },
  premiumModalPrice: {
    fontSize: 36,
    fontFamily: fontFamily.bold,
    marginRight: responsiveWidth(1),
  },
  premiumModalPriceUnit: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
  },
  premiumModalDescription: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
    marginBottom: responsiveWidth(4),
  },
  premiumModalBoldText: {
    fontWeight: 'bold',
    fontFamily: fontFamily.semiBold,
  },
  premiumModalFeaturesContainer: {
    marginBottom: responsiveWidth(4),
  },
  premiumModalFeatureItem: {
    flexDirection: 'row',
    marginBottom: responsiveWidth(3),
    alignItems: 'flex-start',
  },
  premiumModalCheckIcon: {
    fontSize: 20,
    color: '#DF8A5D',
    marginRight: responsiveWidth(2),
    marginTop: responsiveWidth(0.5),
  },
  premiumModalFeatureTextContainer: {
    flex: 1,
  },
  premiumModalFeatureTitle: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    marginBottom: responsiveWidth(1),
  },
  premiumModalFeatureDescription: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    lineHeight: 18,
  },
  premiumModalBuyButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveWidth(3),
    borderRadius: 12,
    marginTop: responsiveWidth(2),
  },
  premiumModalBuyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
  },
  // Payment Success Loader Modal styles
  paymentLoaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentLoaderContainer: {
    borderRadius: 20,
    padding: responsiveWidth(8),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: responsiveWidth(60),
  },
  paymentLoaderText: {
    marginTop: responsiveWidth(4),
    fontSize: 16,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
});

export default ChatScreen;
