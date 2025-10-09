// HomeScreen.tsx

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  Alert,
  RefreshControl,
} from 'react-native';
import { MainContainer } from '../../components/common/mainContainer';
import { responsiveWidth, font, fontFamily, color } from '../../constant/theme';
import { useTheme } from '../../context/ThemeContext';
import { useProfileData } from '../../hooks/useProfileData';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../state/store';
import { setMembersUpdated } from '../../state/slices/appSlice';
import PaymentService from '../../services/payment/payment.service';
import serviceFactory from '../../services/serviceFactory';
import RazorpayCheckout from 'react-native-razorpay';
import Toast from 'react-native-toast-message';
import LottieView from 'lottie-react-native';
// Removed BlurView to avoid external dependency for blur

// Razorpay Configuration
const RAZORPAY_CONFIG = {
  TEST_KEY: 'rzp_test_GIgkz0qhMQzJxv',
  LIVE_KEY: 'rzp_live_t11y7Cds0JWo47',
  PLAN_ID: 'd461266c-574b-4312-994a-ebd2b5cf6dc3',
  IS_TEST_MODE: true, // Set to false for production
};

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  HomeScreen: undefined;
  ContinueWithOtp: undefined;
  BasicDeatil: undefined;
  AddNewMember: undefined;
  MemberManagement: undefined;
  NakshatraScreen: { userId: string };
};

type ProfileScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Register'
>;


const ProfileScreen = () => {
    const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { profileData, membersData, loading, error, refreshProfileData } = useProfileData();
  const { colors, theme } = useTheme();
  // const dispatch = useDispatch();
  // const membersUpdated = useSelector((state: RootState) => state.app.membersUpdated);
  const paymentService = serviceFactory.get<PaymentService>('PaymentService');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedMemberCount, setSelectedMemberCount] = useState(1);

  // Refresh profile data when screen comes into focus and members data has been updated
  useFocusEffect(
    React.useCallback(() => {
      // if (membersUpdated) {
        refreshProfileData();
        // Reset the flag after refreshing
        // dispatch(setMembersUpdated(false));
      // }
    }, [refreshProfileData]),
  );

  // Helper function to get primary member data
  const getPrimaryMemberData = () => {
    if (!membersData || membersData.length === 0) {
      return null;
    }

    console.log('membersData===>123', membersData);
    
    // Look for a member with primary_member field set to true
    const primaryMember = membersData.find(
      (member: any) =>
        member.primary_mamber === 'True' || member.primary_mamber === true,
    );
    

    console.log('primaryMember===>123', primaryMember);
    if (primaryMember) {
      return primaryMember;
    }
    
    // If no primary_member field found, assume first member is primary
    return membersData[0];
  };

  // Helper function to format date of birth from birth_data
  const getFormattedDateOfBirth = () => {
    const primaryMember = getPrimaryMemberData();
    if (primaryMember?.birth_data) {
      const { day, month, year } = primaryMember.birth_data;
      if (day && month && year) {
        const date = new Date(year, month - 1, day); // month is 0-indexed in Date constructor
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    }
    return (profileData as any)?.date_of_birth || 'Not specified';
  };

  // Helper function to format time of birth from birth_data
  const getFormattedTimeOfBirth = () => {
    const primaryMember = getPrimaryMemberData();
    if (primaryMember?.birth_data) {
      const { hour, min } = primaryMember.birth_data;
      if (hour !== undefined && min !== undefined) {
        const date = new Date();
        date.setHours(hour, min, 0, 0);
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      }
    }
    return (profileData as any)?.time_of_birth || 'Not specified';
  };

  // Show error alert if there's an error
  React.useEffect(() => {
    if (error) {
      Alert.alert(
        'Error',
        error,
        [
          { text: 'OK' },
          { text: 'Retry', onPress: refreshProfileData }
        ]
      );
    }
  }, [error, refreshProfileData]);

  const getDisplayName = () => {
    const primaryMember = getPrimaryMemberData();
    if (primaryMember) {
      const firstName = primaryMember.first_name || '';
      const lastName = primaryMember.last_name || '';
      return `${firstName} ${lastName}`.trim() || primaryMember.full_name || 'User';
    }
    if (profileData) {
      const firstName = profileData.first_name || '';
      const lastName = profileData.last_name || '';
      return `${firstName} ${lastName}`.trim() || 'User';
    }
    return 'User';
  };

  const getDisplayEmail = () => {
    const primaryMember = getPrimaryMemberData();
    if (primaryMember?.email) {
      return primaryMember.email;
    }
    return profileData?.email || 'No email';
  };

  const getDisplayGender = () => {
    const primaryMember = getPrimaryMemberData();
    if (primaryMember?.gender) {
      return primaryMember.gender.charAt(0).toUpperCase() + primaryMember.gender.slice(1).toLowerCase();
    }
    return profileData?.gender ? profileData.gender.charAt(0).toUpperCase() + profileData.gender.slice(1).toLowerCase() : 'Not specified';
  };

  const getDisplayBirthplace = () => {
    const primaryMember = getPrimaryMemberData();
    if (primaryMember?.birthplace) {
      return primaryMember.birthplace;
    }
    return profileData?.birthplace || 'Not specified';
  };

  const getDisplayOccupation = () => {
    const primaryMember = getPrimaryMemberData();
    if (primaryMember?.occupation) {
      return primaryMember.occupation;
    }
    return (profileData as any)?.occupation || 'Not specified';
  };

  // Helper function to get gender-based profile image
  const getProfileImageSource = () => {
    const gender = getDisplayGender().toLowerCase();
    if (gender === 'male' || gender === 'm') {
      return require('../../assets/image/profile-Male.png');
    } else if (gender === 'female' || gender === 'f') {
      return require('../../assets/image/profile-Female.png');
    }
    // Default to regular profile image if gender is not specified or unknown
    return require('../../assets/image/profile-Male.png');
  };

  // Helper function to get gender-based icon
  const getGenderIconSource = () => {
    const gender = getDisplayGender().toLowerCase();
    if (gender === 'male' || gender === 'm') {
      return require('../../assets/icons/Male.png');
    } else if (gender === 'female' || gender === 'f') {
      return require('../../assets/icons/female.png');
    }
    // Default to male icon if gender is not specified or unknown
    return require('../../assets/icons/Male.png');
  };

  const getPrimaryMemberId = () => {
    const primaryMember = getPrimaryMemberData();
    return primaryMember?.id || primaryMember?._id || null;
  };

  // Payment handling function
  const handleAddMemberPayment = async () => {
    try {
      setIsProcessingPayment(true);

      // Get current user data
      const userDataString = await AsyncStorage.getItem('USER_DATA');
      if (!userDataString) {
        throw new Error('User data not found. Please login again.');
      }

      const currentUserData = JSON.parse(userDataString);
      const userId = currentUserData._id || currentUserData.user_id;

      if (!userId) {
        throw new Error('User ID not found. Please login again.');
      }

      // Validate selectedMemberCount
      if (!selectedMemberCount || selectedMemberCount < 1) {
        throw new Error('Invalid member count selected');
      }

      // Create order
      const orderData = {
        plan_id: RAZORPAY_CONFIG.PLAN_ID,
        user_id: userId,
        receipt: paymentService.generateReceipt(),
        members: selectedMemberCount,
        notes: {
          action: 'add_new_member',
          user_name: `${currentUserData.first_name || ''} ${currentUserData.last_name || ''}`.trim() || 'User',
        },
      };

      const orderResponse = await paymentService.createOrder(orderData);

      // Validate order response
      if (!orderResponse || !orderResponse.order_id || !orderResponse.amount) {
        throw new Error('Invalid order response from server');
      }

      // Razorpay payment options
      const options = {
        description: `Add ${selectedMemberCount} Member${selectedMemberCount > 1 ? 's' : ''} to Astroself`,
        currency: 'INR',
        key: RAZORPAY_CONFIG.TEST_KEY,
        amount: orderResponse.amount,
        order_id: orderResponse.order_id,
        name: 'Astroself',
        prefill: {
          email: currentUserData.email || 'user@example.com',
          contact: currentUserData.phone || '9999999999',
          name: `${currentUserData.first_name || ''} ${currentUserData.last_name || ''}`.trim() || 'User',
        },
        theme: { color: '#DF8A5D' },
      };

      // Open Razorpay checkout
      const paymentResponse = await RazorpayCheckout.open(options);

      // Verify payment
      const verifyData = {
        current_plan_id: RAZORPAY_CONFIG.PLAN_ID,
        user_id: userId,
        user_name: `${currentUserData.first_name || ''} ${currentUserData.last_name || ''}`.trim() || 'User',
        email: currentUserData.email || 'user@example.com',
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_signature: paymentResponse.razorpay_signature,
        members: selectedMemberCount,
      };

      const verifyResponse = await paymentService.verifyPayment(verifyData);
      console.log('Verify response:', verifyResponse);

      // Check if payment is successful based on response
      const isSuccess = verifyResponse.success === true || 
                       String(verifyResponse.success) === 'true' ||
                       (verifyResponse.message && verifyResponse.message.toLowerCase().includes('verified successfully')) ||
                       (verifyResponse.message && verifyResponse.message.toLowerCase().includes('payment successful'));

      if (isSuccess) {
        // Payment successful, navigate to AddNewMember screen
        Toast.show({
          type: 'success',
          text1: 'Payment Successful',
          text2: `You can now add ${selectedMemberCount} member${selectedMemberCount > 1 ? 's' : ''}.`,
          position: 'top',
          topOffset: 60,
          visibilityTime: 3000,
        });
        
        // Navigate to AddNewMember screen
        navigation.navigate('AddNewMember');
      } else {
        throw new Error(verifyResponse.message || 'Payment verification failed');
      }
    } catch (paymentError: any) {
      let errorMessage = 'Payment failed. Please try again.';
      let alertTitle = 'Payment Failed';
      
      console.log('Payment error details:', paymentError);
      
      // Check if this is a Razorpay cancellation error (iOS pattern)
      if (paymentError.code === 0 && 
          paymentError.description === 'Payment processing cancelled by user' &&
          paymentError.details?.error?.reason === 'payment_cancelled') {
        // User cancelled the payment - show consistent message
        console.log('Payment cancelled by user (iOS pattern)');
        Alert.alert('Payment Failed', 'Payment processing cancelled by user', [
          { text: 'OK', style: 'default' }
        ]);
        return;
      }
      
      // Check if this is a Razorpay cancellation error (Android pattern)
      if (paymentError.error?.code === 'BAD_REQUEST_ERROR' && 
          paymentError.error?.reason === 'payment_error' &&
          paymentError.error?.step === 'payment_authentication') {
        // User cancelled the payment - show consistent message
        console.log('Payment cancelled by user (Android pattern)');
        Alert.alert('Payment Failed', 'Payment processing cancelled by user', [
          { text: 'OK', style: 'default' }
        ]);
        return;
      }
      
      // Check for other Razorpay cancellation patterns
      if (paymentError.code === 'PAYMENT_CANCELLED' || 
          paymentError.reason === 'payment_cancelled' ||
          (paymentError.message && paymentError.message.toLowerCase().includes('cancelled')) ||
          (paymentError.description && paymentError.description.toLowerCase().includes('cancelled'))) {
        // User cancelled the payment - show consistent message
        console.log('Payment cancelled by user (alternative pattern)');
        Alert.alert('Payment Failed', 'Payment processing cancelled by user', [
          { text: 'OK', style: 'default' }
        ]);
        return;
      }
      
      if (paymentError.description) {
        errorMessage = paymentError.description;
      } else if (paymentError.message) {
        errorMessage = paymentError.message;
      }

      // Check if the error message indicates success but was caught as error
      if (errorMessage.toLowerCase().includes('verified successfully') || 
          errorMessage.toLowerCase().includes('payment successful')) {
        alertTitle = 'Payment Successful';
        // Don't show error alert for successful payments
        return;
      }

      console.log('Error message:', paymentError);
      console.log('Error message: Alert title:', alertTitle);

      Alert.alert(alertTitle, errorMessage, [
        { text: 'OK', style: 'default' }
      ]);
    } finally {
      setIsProcessingPayment(false);
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      style={{ flex: 1, backgroundColor: '#202945' }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : -84}
    >
      <MainContainer>
        {/* Sticky Header */}
        <ImageBackground
          source={
            theme === 'dark'
              ? require('../../assets/image/DarkBackground.png')
              : require('../../assets/image/LightBackground.png')
          }
          // blurRadius={12}
          style={[
            styles.stickyHeaderContainer,
            {
              backgroundColor:
                theme === 'dark' ? colors.cardBackground : colors.white,
            },
          ]}
          imageStyle={styles.stickyHeaderBgImage}
        >
          <View style={styles.stickyHeaderOverlay} />
          {/* <Image
            source={colors.subtractIcon}
            style={styles.headerIcon}
          /> */}
          {/* <View style={styles.headerTextWrap}> */}
          <Text
            style={[
              styles.headerText,
              {
                color:
                  theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
              },
            ]}
          >
            Profile
          </Text>
          {/* </View> */}
        </ImageBackground>

        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refreshProfileData}
              tintColor="#F6EFD9"
              colors={['#F6EFD9']}
            />
          }
        >
          <View style={{ padding: responsiveWidth('4') }}>
            {/* Profile Card */}
            <ImageBackground
              source={
                theme === 'dark'
                  ? require('../../assets/image/DarkBackground.png')
                  : require('../../assets/image/LightBackground.png')
              }
              blurRadius={12}
              style={[
                styles.membersCardMain,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.transparent : colors.white,
                },
              ]}
              imageStyle={[styles.membersBgImage, styles.membersCardMainImage]}
            >
              <View style={styles.membersOverlay} />
              <View
                style={[
                  styles.profileCardRedesigned,
                  {
                    backgroundColor:
                      theme === 'dark' ? colors.transparent : colors.white,
                  },
                ]}
              >
                {/* Profile Header Row */}
                <View style={styles.profileHeaderRow}>
                  <View style={styles.profileAvatarContainer}>
                    <Image
                      source={getProfileImageSource()}
                      style={styles.profileAvatar}
                    />
                  </View>
                  <Text
                    style={[
                      styles.profileNameText,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    {getDisplayName()}
                  </Text>
                </View>

                {/* Profile Information List */}
                <View style={styles.profileInfoList}>
                  {/* Email */}
                  <View style={styles.profileInfoRow}>
                    <Text
                      style={[
                        styles.profileInfoLabel,
                        {
                          color:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.DarkNavy,
                        },
                      ]}
                    >
                      Email
                    </Text>
                    <Text
                      style={[
                        styles.profileInfoValue,
                        {
                          color:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.DarkNavy,
                        },
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      : {getDisplayEmail()}
                    </Text>
                  </View>

                  {/* Occupation */}
                  {/* <View style={styles.profileInfoRow}>
                    <Text
                      style={[
                        styles.profileInfoLabel,
                        {
                          color:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.DarkNavy,
                        },
                      ]}
                    >
                      Occupation:
                    </Text>
                    <Text
                      style={[
                        styles.profileInfoValue,
                        {
                          color:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.DarkNavy,
                        },
                      ]}
                    >
                      {getDisplayOccupation()}
                    </Text>
                  </View> */}

                  {/* Gender */}
                  <View style={styles.profileInfoRow}>
                    <Text
                      style={[
                        styles.profileInfoLabel,
                        {
                          color:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.DarkNavy,
                        },
                      ]}
                    >
                      Gender
                    </Text>
                    <View style={styles.genderValueContainer}>
                      <Text
                        style={[
                          styles.profileInfoValue,
                          {
                            color:
                              theme === 'dark'
                                ? colors.themeTextWhite
                                : colors.DarkNavy,
                                
                          },
                        ]}
                      >
                        : {getDisplayGender()}
                      </Text>
                      <View style={styles.genderIconContainer}>
                        <Image
                          source={getGenderIconSource()}
                          style={styles.genderIcon}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Date of Birth */}
                  <View style={styles.profileInfoRow}>
                    <Text
                      style={[
                        styles.profileInfoLabel,
                        {
                          color:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.DarkNavy,
                        },
                      ]}
                    >
                      Date Of Birth
                    </Text>
                    <Text
                      style={[
                        styles.profileInfoValue,
                        {
                          color:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.DarkNavy,
                        },
                      ]}
                    >
                      : {getFormattedDateOfBirth()}
                    </Text>
                  </View>

                  {/* Time of Birth */}
                  <View style={styles.profileInfoRow}>
                    <Text
                      style={[
                        styles.profileInfoLabel,
                        {
                          color:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.DarkNavy,
                        },
                      ]}
                    >
                      Time Of Birth
                    </Text>
                    <Text
                      style={[
                        styles.profileInfoValue,
                        {
                          color:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.DarkNavy,
                        },
                      ]}
                    >
                      : {getFormattedTimeOfBirth()}
                    </Text>
                  </View>

                  {/* Place of Birth */}
                  <View style={styles.profileInfoRow}>
                    <Text
                      style={[
                        styles.profileInfoLabel,
                        {
                          color:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.DarkNavy,
                        },
                      ]}
                    >
                      Place Of Birth
                    </Text>
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={[
                        styles.profileInfoValue,

                        {
                          color:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.DarkNavy,
                              
                        },
                      ]}
                    >
                      : {getDisplayBirthplace()}
                    </Text>
                  </View>
                </View>
              </View>
            </ImageBackground>

            {/* Birth Chart Card */}
            <View
              style={[
                styles.birthChartCard,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.cardBackground : colors.DarkNavy,
                  borderColor:
                    theme === 'dark' ? colors.borderColor : colors.borderColor,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.birthChartTitle,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.surface,
                    },
                  ]}
                >
                  Your Birth Chart
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('NakshatraScreen', {
                      userId: getPrimaryMemberId(),
                    })
                  }
                  style={styles.fullChartBtn}
                >
                  <Text style={styles.fullChartBtnText}>View Chart</Text>
                </TouchableOpacity>
              </View>
              <Image
                source={require('../../assets/icons/ZodiacWheel-main.png')}
                style={styles.zodiacWheel}
              />
            </View>

            {/* Add New Member Card */}
            <ImageBackground
              source={
                theme === 'dark'
                  ? require('../../assets/image/DarkBackground.png')
                  : require('../../assets/image/LightBackground.png')
              }
              blurRadius={12}
              style={[
                styles.newMembersCard,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.cardBackground : colors.white,
                  borderColor:
                    theme === 'dark' ? colors.borderColor : colors.borderColor,
                },
              ]}
              imageStyle={[
                styles.newMembersBgImage,
                styles.newMembersCardImage,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.cardBackground : colors.white,
                },
              ]}
            >
              {/* <View style={styles.newMmembersOverlay} /> */}
              <View
                style={[
                  styles.newMmembersOverlay,
                  {
                    backgroundColor:
                      theme === 'dark' ? colors.transparent : colors.white,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.addMemberTitle,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  Add members and generate charts
                </Text>
                <View
                  style={[
                    styles.addMemberCard,
                    {
                      backgroundColor:
                        theme === 'dark' ? colors.transparent : colors.white,
                    },
                  ]}
                >
                  <View style={styles.addMemberCardLeft}>
                    {/* Member Count Selector */}
                    <View style={styles.memberCountContainer}>
                      <TouchableOpacity
                        style={[
                          styles.countButton,
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
                          selectedMemberCount <= 1 &&
                            styles.countButtonDisabled,
                        ]}
                        onPress={() => {
                          if (selectedMemberCount > 1) {
                            setSelectedMemberCount(selectedMemberCount - 1);
                          }
                        }}
                        disabled={selectedMemberCount <= 1}
                      >
                        <Text
                          style={[
                            styles.countButtonText,
                            {
                              color:
                                theme === 'dark'
                                  ? colors.themeTextWhite
                                  : colors.white,
                            },
                            selectedMemberCount <= 1 &&
                              styles.countButtonTextDisabled,
                          ]}
                        >
                          -
                        </Text>
                      </TouchableOpacity>

                      <View style={styles.memberCountDisplay}>
                        <Text
                          style={[
                            styles.memberCountNumber,
                            {
                              color:
                                theme === 'dark'
                                  ? colors.themeTextWhite
                                  : colors.DarkNavy,
                            },
                          ]}
                        >
                          {selectedMemberCount.toString().padStart(2, '0')}
                        </Text>
                        <Text
                          style={[
                            styles.memberCountLabel,
                            {
                              color:
                                theme === 'dark'
                                  ? colors.themeTextWhite
                                  : colors.DarkNavy,
                            },
                          ]}
                        >
                          Member{selectedMemberCount > 1 ? 's' : ''}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.countButton,
                          {
                            backgroundColor:
                              theme === 'dark'
                                ? colors.Orangeaccentcolor
                                : colors.Orangeaccentcolor,
                            borderColor:
                              theme === 'dark'
                                ? colors.themeBorderDropdown
                                : colors.themeBorderDropdown,
                          },
                        ]}
                        onPress={() => {
                          setSelectedMemberCount(selectedMemberCount + 1);
                        }}
                      >
                        <Text
                          style={[
                            styles.countButtonText,
                            {
                              color:
                                theme === 'dark'
                                  ? colors.themeTextWhite
                                  : colors.surface,
                            },
                          ]}
                        >
                          +
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Remaining slots message */}

                    {/* Action Buttons */}
                  </View>

                  {/* 3D Human Figures Icon */}
                  <View style={styles.addMemberCardRight}>
                    <Image
                      source={require('../../assets/icons/AddUser.png')}
                      style={styles.addUserIcon3D}
                    />
                  </View>
                </View>
                <Text
                  style={[
                    styles.remainingSlotsText,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  {Math.max(
                    0,
                    (profileData?.members_allow || 0) -
                      (profileData?.current_members || 0),
                  ) === 0 &&
                  Math.max(
                    0,
                    (profileData?.child_allow || 0) -
                      (profileData?.current_child || 0),
                  ) === 0
                    ? 'No members or children available'
                    : `You can create ${Math.max(
                        0,
                        (profileData?.members_allow || 0) -
                          (profileData?.current_members || 0),
                      )} more Member${
                        Math.max(
                          0,
                          (profileData?.members_allow || 0) -
                            (profileData?.current_members || 0),
                        ) !== 1
                          ? 's'
                          : ''
                      }${
                        Math.max(
                          0,
                          (profileData?.members_allow || 0) -
                            (profileData?.current_members || 0),
                        ) > 0 &&
                        Math.max(
                          0,
                          (profileData?.child_allow || 0) -
                            (profileData?.current_child || 0),
                        ) > 0
                          ? ' and '
                          : ''
                      }${
                        Math.max(
                          0,
                          (profileData?.child_allow || 0) -
                            (profileData?.current_child || 0),
                        ) > 0
                          ? ` ${Math.max(
                              0,
                              (profileData?.child_allow || 0) -
                                (profileData?.current_child || 0),
                            )} more Child${
                              Math.max(
                                0,
                                (profileData?.child_allow || 0) -
                                  (profileData?.current_child || 0),
                              ) !== 1
                                ? 'ren'
                                : ''
                            }`
                          : ''
                      }`}
                </Text>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    onPress={handleAddMemberPayment}
                    style={[
                      styles.actionButton,
                      styles.addButton,
                      {
                        backgroundColor:
                          theme === 'dark'
                            ? '#DF8A5D'
                            : colors.Orangeaccentcolor,
                        borderColor:
                          theme === 'dark'
                            ? '#DF8A5D'
                            : colors.Orangeaccentcolor,
                      },
                      // Make Add button full width when Create button is hidden
                      Math.max(
                        0,
                        (profileData?.members_allow || 0) -
                          (profileData?.current_members || 0),
                      ) === 0 &&
                        Math.max(
                          0,
                          (profileData?.child_allow || 0) -
                            (profileData?.current_child || 0),
                        ) === 0 &&
                        styles.fullWidthButton,
                    ]}
                    disabled={isProcessingPayment}
                  >
                    <Text
                      style={[
                        styles.actionButtonText,
                        {
                          color:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.white,
                        },
                      ]}
                    >
                      {isProcessingPayment ? 'Processing...' : 'Add'}
                    </Text>
                  </TouchableOpacity>

                  {/* Only show Create button if there are remaining member or child slots */}
                  {(Math.max(
                    0,
                    (profileData?.members_allow || 0) -
                      (profileData?.current_members || 0),
                  ) > 0 ||
                    Math.max(
                      0,
                      (profileData?.child_allow || 0) -
                        (profileData?.current_child || 0),
                    ) > 0) && (
                    <TouchableOpacity
                      onPress={() => navigation.navigate('AddNewMember')}
                      style={[
                        styles.actionButton,
                        styles.createButton,
                        {
                          backgroundColor:
                            theme === 'dark' ? 'transparent' : colors.white,
                          borderColor:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.primaryBlue,
                        },
                      ]}
                      disabled={isProcessingPayment}
                    >
                      <Text
                        style={[
                          styles.actionButtonText,
                          {
                            color:
                              theme === 'dark'
                                ? colors.themeTextWhite
                                : colors.primaryBlue,
                          },
                        ]}
                      >
                        Create
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </ImageBackground>

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
                },
              ]}
              imageStyle={[
                styles.membersBgImage,
                styles.membersCardImage,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.transparent : colors.white,
                },
              ]}
            >
              <View
                style={[
                  styles.membersOverlay,
                  {
                    backgroundColor:
                      theme === 'dark' ? colors.transparent : colors.DarkNavy,
                  },
                ]}
              />
              <View
                style={[
                  styles.membersInner,
                  {
                    backgroundColor:
                      theme === 'dark' ? colors.transparent : colors.DarkNavy,
                  },
                ]}
              >
                <View style={styles.membersContent}>
                  <Text
                    style={[
                      styles.membersTitle,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.surface,
                      },
                    ]}
                  >
                    Browse all added members
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.membersButton,
                      {
                        borderColor:
                          theme === 'dark'
                            ? colors.borderColor
                            : colors.surface,
                      },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('MemberManagement')}
                  >
                    <Text
                      style={[
                        styles.membersButtonText,
                        {
                          color:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.surface,
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
            </ImageBackground>
          </View>
        </ScrollView>
      </MainContainer>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
    minHeight: '100%',
    // backgroundColor: '#202945',
    paddingTop: responsiveWidth('19'), // Add space for sticky header
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#F6EFD9',
    ...font.buttonLarge,
  },
  lottieAnimation: {
    width: 264,
    height: 264,
  },
  stickyHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: responsiveWidth('3'),
    // paddingBottom: responsiveWidth('2'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stickyHeaderBgImage: {
    // opacity: 1,
  },
  stickyHeaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // backgroundColor: 'rgba(32, 41, 69, 0.8)',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: responsiveWidth('3'),
    marginBottom: responsiveWidth('2'),
  },
  headerIcon: {
    width: responsiveWidth('35%'),
    height: responsiveWidth('10%'),
    marginTop: responsiveWidth('10'),
    // marginRight: 8,

    resizeMode: 'contain',
  },
  // headerTextWrap: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   flex: 1,
  // },
  headerText: {
    color: color.themeTextWhite,
    fontSize: 24,
    marginTop: responsiveWidth('10'),
    fontFamily: fontFamily.regular,

    // ...font.h2,
    // fontFamily: 'Inter',
  },
  profileCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
  },
  profileName: {
    color: '#fff',
    ...font.labelSmall,
    fontFamily: fontFamily.regular,
  },
  editBtn: {
    padding: 8,
  },
  editIcon: {
    width: 22,
    height: 22,
    tintColor: '#DF8A5D',
    resizeMode: 'contain',
  },
  profileInfoCol: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    color: '#B0B8D1',
    ...font.caption,
    marginTop: 8,
    fontFamily: fontFamily.regular,
  },
  value: {
    color: '#fff',
    ...font.bodySmall,
    fontFamily: fontFamily.regular,
  },
  birthChartCard: {
    backgroundColor: 'rgba(238, 229, 202, 1)',
    borderRadius: 16,
    borderWidth: 0.2,
    flexDirection: 'row',
    alignItems: 'center',
    padding: responsiveWidth('4'),
    marginBottom: responsiveWidth('5'),
  },
  birthChartTitle: {
    color: '#202945',
    // ...font.labelLarge,
    fontSize: 18,
    marginBottom: 16,
    fontFamily: fontFamily.regular,
  },
  fullChartBtn: {
    backgroundColor: '#DF8A5D',
    borderRadius: 10,
    width: responsiveWidth('30%'),
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  fullChartBtnText: {
    color: color.themeTextWhite,
    fontSize: 12,
    fontFamily: fontFamily.regular,
    fontWeight: '600' as const,
  },
  zodiacWheel: {
    width: 90,
    height: 90,
    marginLeft: 16,
    resizeMode: 'contain',
  },
  addMemberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addMemberCardLeft: {
    flex: 1,
    paddingRight: 20,
  },
  addMemberCardRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMemberTitle: {
    color: color.themeTextWhite,
    // ...font.subtitleLarge,
    fontSize: 18,
    fontFamily: fontFamily.regular,
    // fontFamily: 'Inter-Medium',
    lineHeight: 24,
    letterSpacing: -0.14,
    textAlignVertical: 'center',
    textAlign: 'left',
    // marginBottom: 20,
  },
  memberLimitLabel: {
    color: 'rgba(223, 138, 93, 1)',
    // ...font.bodySmall,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    backgroundColor: 'rgba(238, 229, 202, 1)',
    padding: responsiveWidth('4'),
    textAlign: 'center',
    borderRadius: 10,
    fontWeight: '500',

    marginTop: -responsiveWidth('2'),
    marginRight: -responsiveWidth('10'),
    width: '70%',
  },
  addMemberBtn: {
    borderWidth: 1,
    borderColor: 'rgba(238, 229, 202, 1)',
    borderRadius: 10,
    paddingVertical: responsiveWidth('2.4'),
    paddingHorizontal: 24,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  addMemberBtnText: {
    color: '#fff',
    ...font.labelLarge,
    fontFamily: fontFamily.regular,
  },
  memberCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  addUserIcon: {
    width: responsiveWidth('27'),
    height: responsiveWidth('27'),
    marginLeft: 16,
    resizeMode: 'contain',
  },
  addUserIcon3D: {
    width: responsiveWidth('25'),
    height: responsiveWidth('25'),
    resizeMode: 'contain',
  },
  profileCardRedesigned: {
    paddingHorizontal: responsiveWidth('3'),
    // marginBottom: responsiveWidth('5'),
  },

  membersCardMain: {
    borderRadius: 16,
    overflow: 'hidden',
    // padding: responsiveWidth('1'),
    marginTop: responsiveWidth('0.5%'),
    marginBottom: responsiveWidth('5%'),
    borderWidth: 0.2,
    borderColor: '#EEE5CA',
  },
  membersCardMainImage: {
    borderRadius: 16,
  },

  membersCard: {
    borderRadius: 16,
    overflow: 'hidden',
    // marginHorizontal: 8,
    // marginTop: responsiveWidth('1%'),
    borderWidth: 0.2,
    borderColor: '#EEE5CA',
    marginBottom: responsiveWidth('15%'),
    paddingHorizontal: responsiveWidth('5'),
    paddingVertical:
      Platform.OS === 'android' ? responsiveWidth('1') : responsiveWidth('0'),
  },
  membersCardImage: {
    borderRadius: 16,
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
  },

  newMembersCard: {
    borderRadius: 16,
    overflow: 'hidden',
    // padding: responsiveWidth('4'),
    marginBottom: responsiveWidth('5%'),
    borderWidth: 0.2,
    borderColor: '#EEE5CA',
  },
  newMembersCardImage: {
    borderRadius: 16,
  },
  newMembersBgImage: {
    borderRadius: 16,
    opacity: 0.7,
  },
  newMmembersOverlay: {
    // position: 'absolute',
    // top: 0,
    // left: 0,
    // right: 0,
    // bottom: 0,
    padding: responsiveWidth('4'),
  },

  // New Profile Card Styles
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginBottom: responsiveWidth('4'),
    marginTop: responsiveWidth('3'),
  },
  profileAvatar: {
    width: 75,
    height: 75,
    resizeMode: 'contain',
  },
  profileAvatarContainer: {
    paddingTop: 7,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
    backgroundColor: color.themeTextWhite,
    marginRight: responsiveWidth('4'),
    overflow: 'hidden',
  },
  profileNameText: {
    color: color.themeTextWhite,
    // ...font.h6,
    fontSize: 18,
    fontWeight: '500',
    fontFamily: fontFamily.regular,
    lineHeight: 36,
    letterSpacing: -0.24,
  },
  emailSection: {
    // marginBottom: responsiveWidth('4'),
    flex: 1,
  },
  emailLabel: {
    color: color.themeTextWhite,
    // ...font.bodySmall,
    fontSize: 14, 
    fontFamily: fontFamily.regular,
    fontWeight: '400',

  },
  emailValueContainer: {
    flex: 1,
    width: '100%',
  },
  emailValue: {
    color: color.themeTextWhite,
    // fontSize: 16,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '500',
    flexShrink: 1,
    width: '100%',
  },
  infoGridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // marginTop: 8,
  },
  infoColumnLeft: {
    flex: 1,
    marginRight: responsiveWidth('4'),
  },
  infoColumnRight: {
    flex: 1,
  },
 
  infoLabel: {
    color: color.themeTextWhite,
    // ...font.body,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    marginBottom: 4,
  },
  infoValue: {
    color: color.themeTextWhite,
    // ...font.label,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '500',
  },
  genderIconContainer: {
    // marginLeft: 6,
    flex: 1.7,
  },
 
  genderIcon: {
    width: 20,
    height: 20,
    // paddingLeft: 10,
    resizeMode: 'contain',
    tintColor: '#DF8A5D',
    // marginLe: 6,
  },
  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSheet: {
    backgroundColor: '#34495E',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    minWidth: 300,
    maxWidth: 400,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#5DADE2',
    marginBottom: 20,
  },
  modalTitle: {
    color: color.themeTextWhite,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: fontFamily.regular,
  },
  modalSubtitle: {
    color: color.themeTextWhite,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: fontFamily.regular,
  },
  countButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2994A',
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.25,
    shadowRadius: 1,
    elevation: 2,
  },
  countButtonDisabled: {
    backgroundColor: '#666666',
    borderColor: 'transparent',
  },
  countButtonText: {
    color: color.themeTextWhite,
    fontSize: 16,
    fontWeight: '600' as const,
    fontFamily: fontFamily.regular,
  },
  countButtonTextDisabled: {
    color: 'rgba(255,255,255,0.3)',
  },
  memberCountDisplay: {
    alignItems: 'center',
    width: responsiveWidth('18'),
  },
  memberCountNumber: {
    color: color.themeTextWhite,
    fontSize: 18,
    fontFamily: fontFamily.regular,
    fontWeight: '700',
    marginBottom: 4,
  },
  memberCountLabel: {
    color: color.themeTextWhite,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    // fontWeight: '500',
  },
  remainingSlotsText: {
    color: color.themeTextWhite,
    // fontSize: 14,
    // ...font.bodySmall,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '500',
    fontStyle: 'italic',
    // marginBottom: 20,
    textAlign: 'left',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600' as const,
    fontFamily: fontFamily.regular,
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#DF8A5D',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600' as const,
    fontFamily: fontFamily.regular,
  },
  membersInner: {
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'space-between',
    // alignSelf: 'center',
    paddingVertical:
      Platform.OS === 'android' ? responsiveWidth('2.5') : responsiveWidth('0'),
    // paddingHorizontal: responsiveWidth('3'),
  },
  membersContent: {
    flex: 1,
  },
  membersTitle: {
    //  ...font.subtitleLarge,
    // ...font.subtitleLarge,
    fontSize: 18,
    fontFamily: fontFamily.regular,
    // lineHeight: 32,
    letterSpacing: -0.14,
    color: color.themeTextWhite,
    marginTop: -responsiveWidth('2.5'),
    marginBottom: responsiveWidth('3'),
    textAlignVertical: 'center',
  },
  membersButton: {
    borderColor: color.themeTextWhite,
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    // width: responsiveWidth('35%'),
    paddingHorizontal: 14,
    paddingVertical: 14,
    // paddingHorizontal: 14,
    // marginTop: responsiveWidth('0.5'),
    alignSelf: 'flex-start',
  },
  membersButtonText: {
    fontFamily: fontFamily.regular,
    color: color.themeTextWhite,
    fontWeight: '600' as const,
    fontSize: 12,
  },
  membersImage: {
    width: responsiveWidth('30%'),
    height: responsiveWidth('30%'),
    resizeMode: 'contain',
    marginLeft: responsiveWidth('5'),
    marginRight: -responsiveWidth('3'),
  },
  // New styles for Add New Member Card buttons
  buttonContainer: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    backgroundColor: '#DF8A5D',
    borderWidth: 1,
    borderColor: '#DF8A5D',
  },
  createButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: color.themeTextWhite,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    fontFamily: fontFamily.regular,
    color: color.themeTextWhite,
  },
  fullWidthButton: {
    flex: 1,
  },
  // New Profile Card Redesigned Styles
  profileInfoList: {
    marginTop: responsiveWidth('2'),
    marginBottom: Platform.OS === 'ios' ? responsiveWidth('2.5') : responsiveWidth('1.5'),
  },
  profileInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // marginBottom: responsiveWidth('2.5'),
    paddingVertical: responsiveWidth('0.5'),
  },
  profileInfoLabel: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '400' as const,
    color: color.themeTextWhite,
    flex: 0.29,
    textAlign: 'left',
  },
  profileInfoValue: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    
    fontWeight: '500' as const,
    color: color.themeTextWhite,
    flex: 0.71,
    textAlign: 'left',
  },
  genderValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 0.71,
    flexWrap: 'nowrap',
  },
});

export default ProfileScreen;
