// ChatScreen.tsx

import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
  Linking,
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
import GeneralAnalysis from '../../components/GeneralAnalysis';
import SnapshotPredictions from '../../components/SnapshotPredictions';
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
import FreePointsModal from '../../components/FreePointsModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RazorpayCheckout from 'react-native-razorpay';
import serviceFactory from '../../services/serviceFactory';
import PaymentService from '../../services/payment/payment.service';
import Toast from 'react-native-toast-message';

type RootStackParamList = {
  ChatScreen: { userId: string; tab?: string };
};

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'ChatScreen'>;

const ChatScreen = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const [activeTab, setActiveTab] = useState('Current Situation');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const [showBuyMembershipModal, setShowBuyMembershipModal] = useState(false);
  const [modalFeatureName, setModalFeatureName] = useState<string>('Dynamic Predictions');
  const [membersShownModal, setMembersShownModal] = useState<Set<string>>(new Set());
  // const [showFreePointsModal, setShowFreePointsModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [creatingSubscription, setCreatingSubscription] = useState(false);
  const [showPaymentSuccessLoader, setShowPaymentSuccessLoader] = useState(false);
  const showInfoContainer = useSelector(
    (state: RootState) => state.app.showInfoContainer,
  );
  const navigation = useNavigation<any>();
  const { theme, colors } = useTheme();
  const { profileData, membersData, loading, error, refreshProfileData } =
    useProfileData();
  const user = useSelector((state: RootState) => state.app.user);
  const paymentService = serviceFactory.get<PaymentService>('PaymentService');

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

  // Check if selected member has cosmic_foundation plan
  const isCosmicFoundationPlan = React.useMemo(() => {
    const isCosmic = selectedMember?.current_plan === 'cosmic_foundation';
    console.log('isCosmicFoundationPlan check:', {
      selectedMemberId,
      current_plan: selectedMember?.current_plan,
      isCosmic,
      selectedMember: selectedMember ? 'exists' : 'null',
    });
    return isCosmic;
  }, [selectedMember, selectedMemberId]);

  // Reset modal state when member changes (but don't clear the Set - we want to remember which members have seen it)
  useEffect(() => {
    setShowBuyMembershipModal(false);
  }, [selectedMemberId]);

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

  // Set selectedMemberId and activeTab only when userId comes from route params
  useEffect(() => {
    if (route.params?.userId && route.params.userId.trim() !== '') {
      console.log('Setting member from route params:', route.params.userId);
      setSelectedMemberId(route.params.userId);
    }
    // Set activeTab if tab parameter is provided
    if (route.params?.tab) {
      const tabParam = route.params.tab;
      // Map tab values to actual tab names
      if (tabParam === 'Static Predictions' || tabParam === 'staticpredictions' || tabParam === 'LifeNow') {
        setActiveTab('Current Situation');
      } else if (tabParam === 'Dynamic Predictions' || tabParam === 'dynamicpredictions' || tabParam === 'LifeView') {
        setActiveTab('General Analysis');
      }
    }
  }, [route.params?.userId, route.params?.tab]);

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

  // Handle opening premium modal
  const handleOpenPremiumModal = () => {
    setShowPremiumModal(true);
  };

  // Handle closing premium modal
  const handleClosePremiumModal = () => {
    setShowPremiumModal(false);
  };

  // Handle Buy Premium Access
  const handleBuyPremiumAccess = async () => {
    if (!selectedMember || !user) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Member or user information not found',
        position: 'top',
        topOffset: 60,
        visibilityTime: 3000,
      });
      return;
    }

    try {
      setCreatingSubscription(true);

      const planId = 'd461266c-574b-4312-994a-ebd2b5cf6dc3'; // Premium plan ID
      const userId = user?._id || (user as any)?.id || '';
      const memberUserId =
        selectedMember.id ||
        selectedMember._id ||
        '';

      // First create subscription
      const subscriptionResponse = await paymentService.createSubscription({
        plan_id: planId,
        user_id: userId,
        member_user_id: memberUserId,
        notes: {
          action: 'premium_subscription',
          member_name: selectedMember.full_name || 'Member',
        },
      });

      console.log('Subscription created:', subscriptionResponse);

      // Check if subscription was created
      if (!subscriptionResponse.subscription_id) {
        throw new Error('Subscription ID not received from server');
      }

      // iOS: open short_url / payment_url in browser instead of Razorpay SDK
      if (Platform.OS === 'ios') {
        const paymentUrl =
          subscriptionResponse.short_url || subscriptionResponse.payment_url;

        if (!paymentUrl) {
          throw new Error('Payment URL not received from server');
        }

        // Close modals before opening browser
        handleClosePremiumModal();
        setShowBuyMembershipModal(false);

        const supported = await Linking.canOpenURL(paymentUrl);
        if (!supported) {
          throw new Error('Unable to open payment URL');
        }

        Toast.show({
          type: 'info',
          text1: 'Redirecting to Payment',
          text2: 'Opening secure payment page in your browser',
          position: 'top',
          topOffset: 60,
          visibilityTime: 2000,
        });

        await Linking.openURL(paymentUrl);

        // For iOS browser flow, server/webhook will update subscription.
        // App can refresh profile data when user returns (handled via focus).
        return;
      }

      // Android: use Razorpay SDK as before
      if (!subscriptionResponse.razorpay_key) {
        throw new Error('Razorpay key not received from server');
      }

      // Get user data for prefill
      const userDataString = await AsyncStorage.getItem('USER_DATA');
      let currentUserData: any = {};
      if (userDataString) {
        currentUserData = JSON.parse(userDataString);
      }

      // Close the premium modal before opening Razorpay
      handleClosePremiumModal();
      setShowBuyMembershipModal(false);

      // Razorpay payment options for subscription
      const options = {
        key: subscriptionResponse.razorpay_key,
        amount: (subscriptionResponse as any).amount || 99900, // Amount in paise (999 INR)
        currency: (subscriptionResponse as any).currency || 'INR',
        name: 'Astrodha',
        description: 'Premium Subscription',
        subscription_id: subscriptionResponse.subscription_id,
        prefill: {
          email: currentUserData.email || '',
          contact: currentUserData.phone || '',
          name: currentUserData.full_name || currentUserData.name || '',
        },
        theme: { color: '#DF8A5D' },
      };

      try {
        // Open Razorpay checkout modal (Android only)
        const paymentData = await RazorpayCheckout.open(options);

        console.log('Payment response:', paymentData);

        // Payment successful
        if (paymentData) {
          // Show progress loader for 5 seconds
          setShowPaymentSuccessLoader(true);
          
          // Wait for 5 seconds
          setTimeout(() => {
            setShowPaymentSuccessLoader(false);
            
            // Show success toast
            Toast.show({
              type: 'success',
              text1: 'Payment Successful',
              text2: 'Your premium subscription has been activated',
              position: 'top',
              topOffset: 60,
              visibilityTime: 3000,
              onHide: async () => {
                // Refresh profile data after toast is dismissed
                await refreshProfileData();
              },
            });
          }, 5000);
        }
      } catch (razorpayError: any) {
        console.error('Razorpay error:', razorpayError);

        // Check if it's a cancellation
        const isCancelled =
          razorpayError?.code === 'BAD_REQUEST_ERROR' ||
          razorpayError?.code === 'NETWORK_ERROR' ||
          razorpayError?.description?.toLowerCase().includes('cancelled') ||
          razorpayError?.reason?.toLowerCase().includes('cancelled') ||
          razorpayError?.step === 'payment_cancelled';

        if (isCancelled) {
          // User cancelled, don't show error
          console.log('Payment cancelled by user');
          Toast.show({
            type: 'info',
            text1: 'Payment Cancelled',
            text2: 'You can try again later',
            position: 'top',
            topOffset: 60,
            visibilityTime: 2000,
          });
        } else {
          // Show error for other cases
          Toast.show({
            type: 'error',
            text1: 'Payment Error',
            text2:
              razorpayError?.description ||
              razorpayError?.message ||
              'Payment failed. Please try again.',
            position: 'top',
            topOffset: 60,
            visibilityTime: 3000,
          });
        }
      }
    } catch (subscriptionError: any) {
      console.error('Error creating subscription:', subscriptionError);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: subscriptionError.message || 'Failed to create subscription',
        position: 'top',
        topOffset: 60,
        visibilityTime: 3000,
      });
    } finally {
      setCreatingSubscription(false);
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
                              setActiveTab('Current Situation');
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
                styles.userDetailsCard,
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
              {/* Date of Birth */}
              <View style={styles.birthInfoRow}>
                <Text
                  style={[
                    styles.birthInfoLabel,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  Date Of Birth :{' '}
                </Text>
                <Text
                  style={[
                    styles.birthInfoValue,
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
                  )?.birth_data
                    ? (() => {
                        const member = membersData.find(
                          (m: any) => (m.id || m._id) == selectedMemberId,
                        );
                        const { day, month, year, hour, min } =
                          member.birth_data;
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
                          timeStr = ` ${hour12}:${minute} ${ampm}`;
                        }

                        return `${dateStr}${timeStr}`;
                      })()
                    : 'Not Available'}
                </Text>
              </View>

              {/* Place of Birth */}
              <View style={styles.birthInfoRow}>
                <Text
                  style={[
                    styles.birthInfoLabel,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  Place Of Birth :{' '}
                </Text>
                <Text
                  style={[
                    styles.birthInfoValue,
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

            {/* Charts & Report Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    borderColor: colors.Orangeaccentcolor,
                  },
                ]}
                onPress={handleNakshatraNavigation}
                activeOpacity={0.8}
              >
                <Image
                  source={require('../../assets/icons/home/Chart.png')}
                  style={[
                    styles.actionButtonIcon,
                    {
                      tintColor:
                        theme === 'dark'
                          ? colors.Orangeaccentcolor
                          : colors.Orangeaccentcolor,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.actionButtonText,
                    {
                      color: colors.Orangeaccentcolor,
                    },
                  ]}
                >
                  Charts
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    borderColor: colors.Orangeaccentcolor,
                  },
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
                    styles.actionButtonIcon,
                    {
                      tintColor:
                        theme === 'dark'
                          ? colors.Orangeaccentcolor
                          : colors.Orangeaccentcolor,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.actionButtonText,
                    {
                      color: colors.Orangeaccentcolor,
                    },
                  ]}
                >
                  Reports
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
                Birth Chart Prediction
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
                  // Check if member has cosmic_foundation plan
                  if (isCosmicFoundationPlan) {
                    // Check if modal was already shown for this member
                    setModalFeatureName('Dynamic Predictions');
                    setShowBuyMembershipModal(true);
                    // Mark this member as having seen t
                  } else {
                    setActiveTab('General Analysis');
                  }
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
                Dynamic Predictions
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
              current_plan={selectedMember?.current_plan}
              isChild={isSelectedMemberChild}
              onShowBuyMembershipModal={featureName => {
                setModalFeatureName(featureName || 'Dynamic Predictions');
                setShowBuyMembershipModal(true);
              }}
            />
          ) : (
            <GeneralAnalysis
              current_plan={selectedMember?.current_plan}
              selectedMemberId={selectedMemberId || ''}
            />
          )}
        </View>
        {/* {activeTab === 'General Analysis' ? (
          <GeneralAnalysis selectedMemberId={selectedMemberId} />
        )} */}
        {/* {activeTab === 'General Analysis' && (
          <GeneralAnalysis selectedMemberId={selectedMemberId} />
        )} */}

        <View style={styles.bottomNavigation}>
          <TouchableOpacity
            style={[
              styles.bottomNavigationButton,
              { backgroundColor: colors.Orangeaccentcolor },
            ]}
            onPress={() => {
              navigation.navigate('AddNewMember', { fromMemberPlanManagement: true });
            }}
          >
            <Text
              style={[
                styles.bottomNavigationButtonText,
                { color: colors.white },
              ]}
            >
              Create New Chart
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Buy Memberships Modal */}
      <Modal
        visible={showBuyMembershipModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowBuyMembershipModal(false);
          setModalFeatureName('Dynamic Predictions'); // Reset to default
          // Mark member as having seen the modal when closed
          if (selectedMemberId) {
            setMembersShownModal(prev => new Set(prev).add(selectedMemberId));
          }
        }}
      >
        <View style={styles.buyMembershipModalOverlay}>
          <View style={styles.buyMembershipModalContainer}>
            {/* Icon */}

            {/* Title */}
            <Text style={styles.modalTitle}>Upgrade Plan</Text>

            {/* Body Text */}
            <Text style={styles.modalBodyText}>
              To Access {modalFeatureName}, Please Upgrade Your Plan.
            </Text>

            {/* Action Buttons */}
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.buyButton]}
                onPress={() => {
                  // Mark member as having seen the modal
                  if (selectedMemberId) {
                    setMembersShownModal(prev =>
                      new Set(prev).add(selectedMemberId),
                    );
                  }
                  setShowBuyMembershipModal(false);
                  setModalFeatureName('Dynamic Predictions'); // Reset to default
                  // Open Premium Plan Modal instead of navigating
                  handleOpenPremiumModal();
                }}
              >
                <Text style={styles.buyButtonText}>Buy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  // Mark member as having seen the modal
                  if (selectedMemberId) {
                    setMembersShownModal(prev =>
                      new Set(prev).add(selectedMemberId),
                    );
                  }
                  setShowBuyMembershipModal(false);
                  setModalFeatureName('Dynamic Predictions'); // Reset to default
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Premium Plan Modal */}
      <Modal
        visible={showPremiumModal}
        transparent
        animationType="fade"
        onRequestClose={handleClosePremiumModal}
      >
        <TouchableOpacity
          style={styles.premiumModalOverlay}
          activeOpacity={1}
          onPress={handleClosePremiumModal}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={e => e.stopPropagation()}
            style={[
              styles.premiumModalContainer,
              {
                backgroundColor:
                  theme === 'dark' ? colors.DarkNavy : colors.white,
              },
            ]}
          >
            {/* Close Button */}
            <TouchableOpacity
              style={styles.premiumModalCloseButton}
              onPress={handleClosePremiumModal}
            >
              <Text
                style={[
                  styles.premiumModalCloseText,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              >
                ✕
              </Text>
            </TouchableOpacity>

            {/* Header with Crown Icon */}
            <View style={styles.premiumModalHeader}>
              <Text style={styles.premiumModalCrownIcon}>👑</Text>
              <Text
                style={[
                  styles.premiumModalTitle,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              >
                Annual Plan – What You Unlock
              </Text>
            </View>

            {/* Price */}
            <View style={styles.premiumModalPriceContainer}>
              <Text
                style={[
                  styles.premiumModalPrice,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              >
                999
              </Text>
              <Text
                style={[
                  styles.premiumModalPriceUnit,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              >
                INR/year
              </Text>
            </View>

            {/* Description */}
            <Text
              style={[
                styles.premiumModalDescription,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              Experience the full power of{' '}
              <Text style={styles.premiumModalBoldText}>
                Natal Insights + Dynamic Planetary Insights + Action Alignment
              </Text>{' '}
              in one seamless journey.
            </Text>

            {/* Features List */}
            <View style={styles.premiumModalFeaturesContainer}>
              {/* Feature 1 */}
              <View style={styles.premiumModalFeatureItem}>
                <Text style={styles.premiumModalCheckIcon}>✓</Text>
                <View style={styles.premiumModalFeatureTextContainer}>
                  <Text
                    style={[
                      styles.premiumModalFeatureTitle,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    Natal Chart-Based Insights:
                  </Text>
                  <Text
                    style={[
                      styles.premiumModalFeatureDescription,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    Deep interpretations of core personality, soul desires, &
                    blended predictions for all 12 houses. Includes 100 BNN
                    snapshot predictions, planetary strength/weakness, &
                    hyper-personalisation.
                  </Text>
                </View>
              </View>

              {/* Feature 2 */}
              <View style={styles.premiumModalFeatureItem}>
                <Text style={styles.premiumModalCheckIcon}>✓</Text>
                <View style={styles.premiumModalFeatureTextContainer}>
                  <Text
                    style={[
                      styles.premiumModalFeatureTitle,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    Dynamic Insights (Active Planet + Transits):
                  </Text>
                  <Text
                    style={[
                      styles.premiumModalFeatureDescription,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    Guidance that evolves: your most active planet, transit
                    influences, and refreshed updates every 15 days with new
                    planetary movements.
                  </Text>
                </View>
              </View>

              {/* Feature 3 */}
              <View style={styles.premiumModalFeatureItem}>
                <Text style={styles.premiumModalCheckIcon}>✓</Text>
                <View style={styles.premiumModalFeatureTextContainer}>
                  <Text
                    style={[
                      styles.premiumModalFeatureTitle,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    Dynamic Task Module (Mobile App Only):
                  </Text>
                  <Text
                    style={[
                      styles.premiumModalFeatureDescription,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    Karma-Aligned Action: Turn insights into momentum with
                    personalised Do's & Don'ts, track progress, and build habits
                    aligned with your planetary phase.
                  </Text>
                </View>
              </View>
            </View>

            {/* Buy Premium Access Button */}
            <TouchableOpacity
              style={[
                styles.premiumModalBuyButton,
                {
                  backgroundColor: colors.Orangeaccentcolor,
                  opacity: creatingSubscription ? 0.6 : 1,
                },
              ]}
              onPress={handleBuyPremiumAccess}
              disabled={creatingSubscription}
            >
              {creatingSubscription ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Text style={styles.premiumModalBuyButtonText}>
                    Buy an Annual Plan
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Payment Success Progress Loader Modal */}
      <Modal
        visible={showPaymentSuccessLoader}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.paymentLoaderOverlay}>
          <View
            style={[
              styles.paymentLoaderContainer,
              {
                backgroundColor:
                  theme === 'dark' ? colors.DarkNavy : colors.white,
              },
            ]}
          >
            <ActivityIndicator size="large" color={colors.Orangeaccentcolor} />
            <Text
              style={[
                styles.paymentLoaderText,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              Verifying your payment... Please wait
            </Text>
          </View>
        </View>
      </Modal>

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
    // backgroundColor: '#223149',
    // paddingVertical: responsiveHeight(1),
    // paddingHorizontal: responsiveWidth(2),
    // marginBottom: responsiveHeight(2),
    marginTop: responsiveHeight(2),
  },
  bottomNavigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: responsiveWidth(2),
  },
  bottomNavigationButtonText: {
    color: color.themeTextWhite,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '400' as const,
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
