// PrivacyPolicyScreen.tsx

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
  Alert,
} from 'react-native';
import {
  fontFamily,
  responsiveWidth,
  responsiveHeight,
} from '../../constant/theme';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainContainer } from '../../components/common/mainContainer';
import { useTheme } from '../../context/ThemeContext';
import { useProfileData } from '../../hooks/useProfileData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PaymentService from '../../services/payment/payment.service';
import serviceFactory from '../../services/serviceFactory';
import RazorpayCheckout from 'react-native-razorpay';
import Toast from 'react-native-toast-message';

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
  ForgotPasswordOtp: undefined;
  AddNewMember: undefined;
};

type PaidPlanScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Login'
>;

const PaidPlanScreen = () => {
  const { theme, colors } = useTheme();
  const navigation = useNavigation<PaidPlanScreenNavigationProp>();
  const { profileData, refreshProfileData } = useProfileData();
  const paymentService = serviceFactory.get<PaymentService>('PaymentService');
  const [activeTab, setActiveTab] = useState<'free' | 'paid'>('free');
  const [memberCount, setMemberCount] = useState(1);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Refresh profile data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('PaidPlan screen focused, refreshing profile data...');
      if (refreshProfileData) {
        refreshProfileData();
      }
    }, [refreshProfileData]),
  );


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
      if (!memberCount || memberCount < 1) {
        throw new Error('Invalid member count selected');
      }

      // Create order
      const orderData = {
        plan_id: RAZORPAY_CONFIG.PLAN_ID,
        user_id: userId,
        receipt: paymentService.generateReceipt(),
        members: memberCount,
        notes: {
          action: 'add_new_member',
          user_name:
            `${currentUserData.first_name || ''} ${
              currentUserData.last_name || ''
            }`.trim() || 'User',
        },
      };

      const orderResponse = await paymentService.createOrder(orderData);

      // Validate order response
      if (!orderResponse || !orderResponse.order_id || !orderResponse.amount) {
        throw new Error('Invalid order response from server');
      }

      // Razorpay payment options
      const options = {
        description: `Add ${memberCount} Member${
          memberCount > 1 ? 's' : ''
        } to Astroself`,
        currency: 'INR',
        key: RAZORPAY_CONFIG.TEST_KEY,
        amount: orderResponse.amount,
        order_id: orderResponse.order_id,
        name: 'Astroself',
        prefill: {
          email: currentUserData.email || 'user@example.com',
          contact: currentUserData.phone || '9999999999',
          name:
            `${currentUserData.first_name || ''} ${
              currentUserData.last_name || ''
            }`.trim() || 'User',
        },
        theme: { color: '#DF8A5D' },
      };

      // Open Razorpay checkout
      const paymentResponse = await RazorpayCheckout.open(options);

      // Verify payment
      const verifyData = {
        current_plan_id: RAZORPAY_CONFIG.PLAN_ID,
        user_id: userId,
        user_name:
          `${currentUserData.first_name || ''} ${
            currentUserData.last_name || ''
          }`.trim() || 'User',
        email: currentUserData.email || 'user@example.com',
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_signature: paymentResponse.razorpay_signature,
        members: memberCount,
      };

      const verifyResponse = await paymentService.verifyPayment(verifyData);
      console.log('Verify response:', verifyResponse);

      // Check if payment is successful based on response
      const isSuccess =
        verifyResponse.success === true ||
        String(verifyResponse.success) === 'true' ||
        (verifyResponse.message &&
          verifyResponse.message
            .toLowerCase()
            .includes('verified successfully')) ||
        (verifyResponse.message &&
          verifyResponse.message.toLowerCase().includes('payment successful'));

      if (isSuccess) {
        // Payment successful, navigate to AddNewMember screen
        Toast.show({
          type: 'success',
          text1: 'Payment Successful',
          text2: `You can now add ${memberCount} member${
            memberCount > 1 ? 's' : ''
          }.`,
          position: 'top',
          topOffset: 60,
          visibilityTime: 3000,
        });

        // Navigate to AddNewMember screen
        navigation.navigate('AddNewMember');
      } else {
        throw new Error(
          verifyResponse.message || 'Payment verification failed',
        );
      }
    } catch (paymentError: any) {
      let errorMessage = 'Payment failed. Please try again.';
      let alertTitle = 'Payment Failed';

      console.log('Payment error details:', paymentError);

      // Check if this is a Razorpay cancellation error (iOS pattern)
      if (
        paymentError.code === 0 &&
        paymentError.description === 'Payment processing cancelled by user' &&
        paymentError.details?.error?.reason === 'payment_cancelled'
      ) {
        // User cancelled the payment - show consistent message
        console.log('Payment cancelled by user (iOS pattern)');
        Alert.alert('Payment Failed', 'Payment processing cancelled by user', [
          { text: 'OK', style: 'default' },
        ]);
        return;
      }

      // Check if this is a Razorpay cancellation error (Android pattern)
      if (
        paymentError.error?.code === 'BAD_REQUEST_ERROR' &&
        paymentError.error?.reason === 'payment_error' &&
        paymentError.error?.step === 'payment_authentication'
      ) {
        // User cancelled the payment - show consistent message
        console.log('Payment cancelled by user (Android pattern)');
        Alert.alert('Payment Failed', 'Payment processing cancelled by user', [
          { text: 'OK', style: 'default' },
        ]);
        return;
      }

      // Check for other Razorpay cancellation patterns
      if (
        paymentError.code === 'PAYMENT_CANCELLED' ||
        paymentError.reason === 'payment_cancelled' ||
        (paymentError.message &&
          paymentError.message.toLowerCase().includes('cancelled')) ||
        (paymentError.description &&
          paymentError.description.toLowerCase().includes('cancelled'))
      ) {
        // User cancelled the payment - show consistent message
        console.log('Payment cancelled by user (alternative pattern)');
        Alert.alert('Payment Failed', 'Payment processing cancelled by user', [
          { text: 'OK', style: 'default' },
        ]);
        return;
      }

      if (paymentError.description) {
        errorMessage = paymentError.description;
      } else if (paymentError.message) {
        errorMessage = paymentError.message;
      }

      // Check if the error message indicates success but was caught as error
      if (
        errorMessage.toLowerCase().includes('verified successfully') ||
        errorMessage.toLowerCase().includes('payment successful')
      ) {
        // Payment was actually successful
        Toast.show({
          type: 'success',
          text1: 'Payment Successful',
          text2: `You can now add ${memberCount} member${
            memberCount > 1 ? 's' : ''
          }.`,
          position: 'top',
          topOffset: 60,
          visibilityTime: 3000,
        });

        navigation.navigate('AddNewMember');
        return;
      }

      Alert.alert(alertTitle, errorMessage, [{ text: 'OK', style: 'default' }]);
    } finally {
      setIsProcessingPayment(false);
    }
  };

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
                  theme === 'dark' ? colors.white : colors.DarkNavy,
              },
            ]}
          >
            Paid Plan
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
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'free' && {
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
            onPress={() => setActiveTab('free')}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    theme === 'dark' ? colors.white : colors.DarkNavy,
                },
                activeTab === 'free' && {
                  color:
                    theme === 'dark' ? colors.accent : colors.Orangeaccentcolor,
                },
              ]}
            >
              Free Trial
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'paid' && {
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
            onPress={() => setActiveTab('paid')}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    theme === 'dark' ? colors.white : colors.DarkNavy,
                },
                activeTab === 'paid' && {
                  color:
                    theme === 'dark' ? colors.accent : colors.Orangeaccentcolor,
                },
              ]}
            >
              Paid Plan
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
        <View
          style={[
            styles.contentCard,
            {
              backgroundColor:
                theme === 'dark'
                  ? colors.cardBackground
                  : colors.surfaceOpacity,
            },
          ]}
        >
          {/* Tab Navigation */}

          {/* Tab Content */}
          <View style={styles.tabContentContainer}>
            {activeTab === 'paid' && (
              <View style={styles.planContent}>
                {/* Plan Title and Price */}
                <View style={styles.planHeader}>
                  <Text
                    style={[
                      styles.planTitle,
                      {
                        color:
                          theme === 'dark'
                            ? colors.white
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    Eternal Path
                  </Text>
                  <View style={styles.priceContainer}>
                    <Text
                      style={[
                        styles.price,
                        {
                          color:
                            theme === 'dark'
                              ? colors.white
                              : colors.DarkNavy,
                        },
                      ]}
                    >
                      499
                    </Text>
                    <Text
                      style={[
                        styles.priceUnit,
                        {
                          color:
                            theme === 'dark'
                              ? colors.white
                              : colors.DarkNavy,
                        },
                      ]}
                    >
                      (INR)/Member
                    </Text>
                  </View>
                </View>

                {/* Plan Description */}
                <Text
                  style={[
                    styles.planDescription,
                    {
                      color:
                        theme === 'dark'
                          ? colors.white
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  In this Plan, you will receive personalized predictions for
                  your Kundli based on the following detailed analysis:
                </Text>

                {/* Features List */}
                <View style={styles.featuresList}>
                  {[
                    'Planets in Signs',
                    'Planets in Houses',
                    'Conjunctions of Planets',
                    'Trine Conjunction',
                    'Nakshatra - Planet in Nakshtras and House',
                    'Nakshatras-Padawise',
                    'Debilitation and Exaltation',
                    'Retro Planets Effects',
                    'Impact of Rahu, Ketu, Saturn on Planets',
                    '50 Personalized Questions, Answered by AI',
                  ].map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Image
                        source={require('../../assets/icons/checkIcon.png')}
                        resizeMode="contain"
                        style={styles.checkIcon}
                      />
                      <Text
                        style={[
                          styles.featureText,
                          {
                            color:
                              theme === 'dark'
                                ? colors.white
                                : colors.DarkNavy,
                          },
                        ]}
                      >
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Disclaimer */}
                <View style={styles.disclaimerContainer}>
                  {/* <View style={styles.separator} /> */}
                  <Text
                    style={[
                      styles.disclaimerText,
                      {
                        color:
                          theme === 'dark'
                            ? colors.white
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    * Our AI is not yet trained to answer questions on the
                    timing of the events
                  </Text>
                </View>

                {/* Member Management Section */}
                <View
                  style={[
                    styles.freePlanSeparator,
                    {
                      backgroundColor:
                        theme === 'dark'
                          ? colors.Orangeaccentcolor
                          : colors.Orangeaccentcolor,
                    },
                  ]}
                />
                <View style={styles.memberSection}>
                  <Text
                    style={[
                      styles.addMemberTitle,
                      {
                        color:
                          theme === 'dark'
                            ? colors.white
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
                            memberCount <= 1 && styles.countButtonDisabled,
                          ]}
                          onPress={() => {
                            if (memberCount > 1) {
                              setMemberCount(memberCount - 1);
                            }
                          }}
                          disabled={memberCount <= 1}
                        >
                          <Text
                            style={[
                              styles.countButtonText,
                              {
                                color:
                                  theme === 'dark'
                                    ? colors.white
                                    : colors.white,
                              },
                              memberCount <= 1 &&
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
                                    ? colors.white
                                    : colors.DarkNavy,
                              },
                            ]}
                          >
                            {memberCount.toString().padStart(2, '0')}
                          </Text>
                          <Text
                            style={[
                              styles.memberCountLabel,
                              {
                                color:
                                  theme === 'dark'
                                    ? colors.white
                                    : colors.DarkNavy,
                              },
                            ]}
                          >
                            Member{memberCount > 1 ? 's' : ''}
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
                            setMemberCount(memberCount + 1);
                          }}
                        >
                          <Text
                            style={[
                              styles.countButtonText,
                              {
                                color:
                                  theme === 'dark'
                                    ? colors.white
                                    : colors.surface,
                              },
                            ]}
                          >
                            +
                          </Text>
                        </TouchableOpacity>
                      </View>
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
                            ? colors.white
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
                                ? colors.white
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
                                ? colors.white
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
                                  ? colors.white
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
              </View>
            )}

            {activeTab === 'free' && (
              <View style={styles.planContent}>
                {/* Free Plan Header */}
                <View
                  style={{
                    alignItems: 'flex-start',
                  }}
                >
                  <Text
                    style={[
                      styles.planTitle,
                      {
                        color:
                          theme === 'dark'
                            ? colors.white
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    Cosmic Foundation
                  </Text>
                </View>
                <View style={styles.freePlanHeader}>
                  <Text
                    style={[
                      styles.freePlanTitle,
                      {
                        color:
                          theme === 'dark'
                            ? colors.white
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    Free*
                  </Text>
                </View>

                {/* Free Plan Description */}
                <Text
                  style={[
                    styles.planDescription,
                    {
                      color:
                        theme === 'dark'
                          ? colors.white
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  In this Plan, you will receive personalized predictions for
                  your Kundli based on the following detailed analysis:
                </Text>

                {/* Free Plan Features List */}
                <View style={styles.featuresList}>
                  {[
                    'Ascendant Analysis',
                    'Lords Through Houses',
                    'Lords Conjunctions',
                    'Circuit Through Lords',
                    '15 Personalized Questions, Answered by AI, Limited to One Person',
                  ].map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Image
                        source={require('../../assets/icons/checkIcon.png')}
                        resizeMode="contain"
                        style={styles.checkIcon}
                      />
                      <Text
                        style={[
                          styles.featureText,
                          {
                            color:
                              theme === 'dark'
                                ? colors.white
                                : colors.DarkNavy,
                          },
                        ]}
                      >
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Disclaimer */}
                <View style={styles.disclaimerContainer}>
                  <Text
                    style={[
                      styles.disclaimerText,
                      {
                        color:
                          theme === 'dark'
                            ? colors.white
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    * Our AI is not yet trained to answer questions on the
                    timing of the events
                  </Text>
                </View>

                {/* Separator Line */}
                <View
                  style={[
                    styles.freePlanSeparator,
                    {
                      backgroundColor:
                        theme === 'dark'
                          ? colors.Orangeaccentcolor
                          : colors.Orangeaccentcolor,
                    },
                  ]}
                />
              </View>
            )}
          </View>
        </View>
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
    position: 'absolute',
    left: 16,
    padding: 8,
    top:
      Platform.OS === 'android'
        ? responsiveWidth('11.5%')
        : responsiveWidth('1.5%'),
    zIndex: 1,
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
  contentCard: {
    borderRadius: 12,
    marginHorizontal: responsiveWidth('4'),
    marginTop: responsiveWidth('2%'),
    borderWidth: 0.2,
    borderColor: '#EEE5CA',
    overflow: 'hidden',
    opacity: 0.9,
    // marginBottom: responsiveWidth('5%'),
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  // Tab Styles - Matching ChatScreen
  tabsContainer: {
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#EEE5CA',
    overflow: 'hidden',
    marginBottom: responsiveHeight(2),
    marginHorizontal: responsiveWidth(4),
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
    paddingHorizontal: responsiveWidth(2),
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
  tabContentContainer: {
    // flex: 1,
    paddingTop: responsiveHeight(1),
  },
  // Plan Content Styles
  planContent: {
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  planHeader: {
    // marginBottom: 16,
  },
  planTitle: {
    fontSize: 18,
    fontFamily: fontFamily.regular,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  price: {
    fontSize: 36,
    fontFamily: fontFamily.bold,
    marginRight: 8,
  },
  priceUnit: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
  },
  planDescription: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
    marginBottom: responsiveWidth(3),
  },
  // Features List Styles
  featuresList: {
    // marginBottom: responsiveWidth(2),
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveWidth(2),
  },
  checkIcon: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    resizeMode: 'contain',
    marginRight: responsiveWidth(2),
  },
  featureText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    flex: 1,
    fontWeight: '500',
    lineHeight: 18,
  },
  // Disclaimer Styles
  disclaimerContainer: {
    marginBottom: responsiveWidth(2),
  },
  separator: {
    height: 1,
    backgroundColor: '#333',
    marginBottom: 12,
  },
  disclaimerText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    fontStyle: 'italic',
  },
  // Member Management Styles - Matching ProfileScreen
  memberSection: {
    marginBottom: responsiveWidth(2),
    marginTop: responsiveWidth(2),
  },
  addMemberTitle: {
    fontSize: 18,
    fontFamily: fontFamily.regular,
    lineHeight: 24,
    marginBottom: 16,
  },
  addMemberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addMemberCardLeft: {
    flex: 1,
    paddingRight: 20,
  },
  addMemberCardRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
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
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  countButtonDisabled: {
    backgroundColor: '#666666',
    borderColor: 'transparent',
  },
  countButtonText: {
    color: '#fff',
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
    color: '#fff',
    fontSize: 18,
    fontFamily: fontFamily.regular,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  memberCountLabel: {
    color: '#fff',
    fontSize: 12,
    fontFamily: fontFamily.regular,
  },
  addUserIcon3D: {
    width: responsiveWidth('27'),
    height: responsiveWidth('27'),
    resizeMode: 'contain',
  },
  remainingSlotsText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  addButton: {
    // Styles applied via props
  },
  createButton: {
    // Styles applied via props
  },
  fullWidthButton: {
    flex: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '600' as const,
  },
  // Free Plan Styles
  freePlanHeader: {
    marginBottom: 16,
    alignItems: 'center',
  },
  freePlanTitle: {
    fontSize: 36,
    fontFamily: fontFamily.bold,
    textAlign: 'center',
  },
  freePlanSeparator: {
    height: 2,
   
    marginTop: responsiveWidth(2),
    marginBottom: responsiveWidth(2),
    borderRadius: 1,
  },
});

export default PaidPlanScreen;
