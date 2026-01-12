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
  MemberPlanManagement: undefined;
  ProfileScreen:undefined;
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
  navigation.navigate('ProfileScreen');
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
                color: theme === 'dark' ? colors.white : colors.DarkNavy,
              },
            ]}
          >
            Plans
          </Text>
        </View>
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={require('../../assets/image/PaidPlanImage.png')}
          resizeMode="cover"
          style={styles.imagePaidPlan}
        />
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
                  color: theme === 'dark' ? colors.white : colors.DarkNavy,
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
                  color: theme === 'dark' ? colors.white : colors.DarkNavy,
                },
                activeTab === 'paid' && {
                  color:
                    theme === 'dark' ? colors.accent : colors.Orangeaccentcolor,
                },
              ]}
            >
              Paid Plans
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
                {/* Most Popular Tag */}
                <View style={styles.mostPopularTag}>
                  <Text
                    style={[
                      styles.mostPopularText,
                      {
                        color: theme === 'dark' ? colors.white : colors.white,
                      },
                    ]}
                  >
                    MOST POPULAR
                  </Text>
                </View>

                {/* Plan Title and Price */}
                <View style={styles.planHeader}>
                  <Text
                    style={[
                      styles.planTitle,
                      {
                        color:
                          theme === 'dark' ? colors.white : colors.DarkNavy,
                      },
                    ]}
                  >
                    Paid Plan - What You Unlock
                  </Text>
                  <View style={styles.priceContainer}>
                    <Text
                      style={[
                        styles.price,
                        {
                          color:
                            theme === 'dark' ? colors.white : colors.DarkNavy,
                        },
                      ]}
                    >
                      999
                    </Text>
                  </View>
                </View>

                {/* Plan Description */}
                <Text
                  style={[
                    styles.planDescription,
                    {
                      color: theme === 'dark' ? colors.white : colors.DarkNavy,
                    },
                  ]}
                >
                  Experience The Complete Power Of Natal Insights + Dynamic Planetary Intelligence + Karma-Aligned Action - Combined Into One Seamless, Evolving Journey.
                </Text>

                {/* Features List */}
                <View style={styles.featuresList}>
                  {/* Module 1: Natal Chart-Based Insights */}
                  <View style={styles.featureItem}>
                    <Image
                      source={require('../../assets/icons/checkIcon.png')}
                      resizeMode="contain"
                      style={styles.checkIcon}
                    />
                    <View style={styles.featureTextContainer}>
                      <Text
                        style={[
                          styles.featureText,
                          styles.featureTitle,
                          {
                            color:
                              theme === 'dark' ? colors.white : colors.DarkNavy,
                          },
                        ]}
                      >
                        Natal Chart-Based Insights
                      </Text>
                      <Text
                        style={[
                          styles.featureDescription,
                          {
                            color:
                              theme === 'dark' ? colors.white : colors.DarkNavy,
                          },
                        ]}
                      >
                        Deep, holistic interpretations drawn from your complete birth chart, covering:
                      </Text>
                      <View style={styles.bulletPointContainer}>
                        <View style={styles.bulletPointRow}>
                          <Text
                            style={[
                              styles.bulletSymbol,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            {'\u2022'}
                          </Text>
                          <Text
                            style={[
                              styles.bulletPointText,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            Core personality and soul desires
                          </Text>
                        </View>
                        <View style={styles.bulletPointRow}>
                          <Text
                            style={[
                              styles.bulletSymbol,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            {'\u2022'}
                          </Text>
                          <Text
                            style={[
                              styles.bulletPointText,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            Income, wealth, and professional pathways
                          </Text>
                        </View>
                        <View style={styles.bulletPointRow}>
                          <Text
                            style={[
                              styles.bulletSymbol,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            {'\u2022'}
                          </Text>
                          <Text
                            style={[
                              styles.bulletPointText,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            Natural energy flow and rejuvenation patterns
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.featureDescription,
                          {
                            color:
                              theme === 'dark' ? colors.white : colors.DarkNavy,
                          },
                        ]}
                      >
                        {'\n'}Blended predictions across all 12 houses, using:
                      </Text>
                      <View style={[styles.bulletPointContainer, styles.subBulletPointContainer]}>
                        <View style={styles.bulletPointRow}>
                          <Text
                            style={[
                              styles.bulletSymbol,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            {'\u2022'}
                          </Text>
                          <Text
                            style={[
                              styles.bulletPointText,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            House lords
                          </Text>
                        </View>
                        <View style={styles.bulletPointRow}>
                          <Text
                            style={[
                              styles.bulletSymbol,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            {'\u2022'}
                          </Text>
                          <Text
                            style={[
                              styles.bulletPointText,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            Signs and planets
                          </Text>
                        </View>
                        <View style={styles.bulletPointRow}>
                          <Text
                            style={[
                              styles.bulletSymbol,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            {'\u2022'}
                          </Text>
                          <Text
                            style={[
                              styles.bulletPointText,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            Nakshatras and padas
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.featureDescription,
                          {
                            color:
                              theme === 'dark' ? colors.white : colors.DarkNavy,
                          },
                        ]}
                      >
                        {'\n'}This module also includes:
                      </Text>
                      <View style={[styles.bulletPointContainer, styles.subBulletPointContainer]}>
                        <View style={styles.bulletPointRow}>
                          <Text
                            style={[
                              styles.bulletSymbol,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            {'\u2022'}
                          </Text>
                          <Text
                            style={[
                              styles.bulletPointText,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            100 BNN snapshot predictions
                          </Text>
                        </View>
                        <View style={styles.bulletPointRow}>
                          <Text
                            style={[
                              styles.bulletSymbol,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            {'\u2022'}
                          </Text>
                          <Text
                            style={[
                              styles.bulletPointText,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            Planetary strength & weakness analysis (exalted, debilitated, marankaraka, etc.)
                          </Text>
                        </View>
                        <View style={styles.bulletPointRow}>
                          <Text
                            style={[
                              styles.bulletSymbol,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            {'\u2022'}
                          </Text>
                          <Text
                            style={[
                              styles.bulletPointText,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            Blank chart-based predictions
                          </Text>
                        </View>
                        <View style={styles.bulletPointRow}>
                          <Text
                            style={[
                              styles.bulletSymbol,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            {'\u2022'}
                          </Text>
                          <Text
                            style={[
                              styles.bulletPointText,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            Hyper-personalised insights based on the details you share.
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Module 2: Dynamic Insights */}
                  <View style={styles.featureItem}>
                    <Image
                      source={require('../../assets/icons/checkIcon.png')}
                      resizeMode="contain"
                      style={styles.checkIcon}
                    />
                    <View style={styles.featureTextContainer}>
                      <Text
                        style={[
                          styles.featureText,
                          styles.featureTitle,
                          {
                            color:
                              theme === 'dark' ? colors.white : colors.DarkNavy,
                          },
                        ]}
                      >
                        Dynamic Insights (Active Planet + Transits)
                      </Text>
                      <Text
                        style={[
                          styles.featureDescription,
                          {
                            color:
                              theme === 'dark' ? colors.white : colors.DarkNavy,
                          },
                        ]}
                      >
                        Living guidance that evolves as your life and planets move:
                      </Text>
                      <View style={styles.bulletPointContainer}>
                        <View style={styles.bulletPointRow}>
                          <Text
                            style={[
                              styles.bulletSymbol,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            {'\u2022'}
                          </Text>
                          <Text
                            style={[
                              styles.bulletPointText,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            Identification of your most active planet right now
                          </Text>
                        </View>
                        <View style={styles.bulletPointRow}>
                          <Text
                            style={[
                              styles.bulletSymbol,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            {'\u2022'}
                          </Text>
                          <Text
                            style={[
                              styles.bulletPointText,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            How current transits are influencing your natal chart
                          </Text>
                        </View>
                        <View style={styles.bulletPointRow}>
                          <Text
                            style={[
                              styles.bulletSymbol,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            {'\u2022'}
                          </Text>
                          <Text
                            style={[
                              styles.bulletPointText,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            Jupiter, Saturn, Rahu, and Ketu connections with your active planet
                          </Text>
                        </View>
                        <View style={styles.bulletPointRow}>
                          <Text
                            style={[
                              styles.bulletSymbol,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            {'\u2022'}
                          </Text>
                          <Text
                            style={[
                              styles.bulletPointText,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            Transit-triggered combinations already present in your chart
                          </Text>
                        </View>
                        <View style={styles.bulletPointRow}>
                          <Text
                            style={[
                              styles.bulletSymbol,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            {'\u2022'}
                          </Text>
                          <Text
                            style={[
                              styles.bulletPointText,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            Insights refreshed, aligned with planetary movement and any life updates you provide
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Module 3: Dynamic Task Module */}
                  <View style={styles.featureItem}>
                    <Image
                      source={require('../../assets/icons/checkIcon.png')}
                      resizeMode="contain"
                      style={styles.checkIcon}
                    />
                    <View style={styles.featureTextContainer}>
                      <Text
                        style={[
                          styles.featureText,
                          styles.featureTitle,
                          {
                            color:
                              theme === 'dark' ? colors.white : colors.DarkNavy,
                          },
                        ]}
                      >
                        Dynamic Task Module - Karma-Aligned Action
                      </Text>
                      <Text
                        style={[
                          styles.featureDescription,
                          {
                            color:
                              theme === 'dark' ? colors.white : colors.DarkNavy,
                          },
                        ]}
                      >
                        Turn awareness into real-world momentum (Available exclusively on the mobile app):
                      </Text>
                      <View style={styles.bulletPointContainer}>
                        <View style={styles.bulletPointRow}>
                          <Text
                            style={[
                              styles.bulletSymbol,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            {'\u2022'}
                          </Text>
                          <Text
                            style={[
                              styles.bulletPointText,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            Personalised Do's & Don'ts based on your active planet
                          </Text>
                        </View>
                        <View style={styles.bulletPointRow}>
                          <Text
                            style={[
                              styles.bulletSymbol,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            {'\u2022'}
                          </Text>
                          <Text
                            style={[
                              styles.bulletPointText,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            Create tasks aligned with your current planetary phase
                          </Text>
                        </View>
                        <View style={styles.bulletPointRow}>
                          <Text
                            style={[
                              styles.bulletSymbol,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            {'\u2022'}
                          </Text>
                          <Text
                            style={[
                              styles.bulletPointText,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            Track progress and maintain consistency
                          </Text>
                        </View>
                        <View style={styles.bulletPointRow}>
                          <Text
                            style={[
                              styles.bulletSymbol,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            {'\u2022'}
                          </Text>
                          <Text
                            style={[
                              styles.bulletPointText,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            Build habits that resonate with your present planetary energy
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Buy Premium Access Button */}
                <TouchableOpacity
                  onPress={handleAddMemberPayment}
                  style={[
                    styles.buyPremiumButton,
                    {
                      backgroundColor:
                        theme === 'dark'
                          ? '#DF8A5D'
                          : colors.Orangeaccentcolor,
                    },
                  ]}
                  disabled={isProcessingPayment}
                >
                  <Text
                    style={[
                      styles.buyPremiumButtonText,
                      {
                        color: theme === 'dark' ? colors.white : colors.DarkNavy,
                      },
                    ]}
                  >
                    Buy Premium Access
                  </Text>
                </TouchableOpacity>
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
                          theme === 'dark' ? colors.white : colors.DarkNavy,
                      },
                    ]}
                  >
                    Free Version Includes (One-Time Access)
                  </Text>
                </View>

                {/* Free Plan Features List */}
                <View style={styles.featuresList}>
                  <View style={styles.featureItem}>
                    <Text
                      style={[
                        styles.bulletPoint,
                        {
                          color:
                            theme === 'dark' ? colors.white : colors.DarkNavy,
                        },
                      ]}
                    >
                      {'\u2022'}
                    </Text>
                    <View style={styles.featureTextContainer}>
                      <Text
                        style={[
                          styles.featureText,
                          styles.featureTitle,
                          {
                            color:
                              theme === 'dark' ? colors.white : colors.DarkNavy,
                          },
                        ]}
                      >
                        100 BNN Snapshot Predictions
                      </Text>
                      <Text
                        style={[
                          styles.featureDescription,
                          {
                            color:
                              theme === 'dark' ? colors.white : colors.DarkNavy,
                          },
                        ]}
                      >
                        Concise insights highlighting the key themes, patterns, and energies currently influencing your life.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.featureItem}>
                    <Text
                      style={[
                        styles.bulletPoint,
                        {
                          color:
                            theme === 'dark' ? colors.white : colors.DarkNavy,
                        },
                      ]}
                    >
                      {'\u2022'}
                    </Text>
                    <View style={styles.featureTextContainer}>
                      <Text
                        style={[
                          styles.featureText,
                          styles.featureTitle,
                          {
                            color:
                              theme === 'dark' ? colors.white : colors.DarkNavy,
                          },
                        ]}
                      >
                        In-Depth Personality Insights
                      </Text>
                      <Text
                        style={[
                          styles.featureDescription,
                          {
                            color:
                              theme === 'dark' ? colors.white : colors.DarkNavy,
                          },
                        ]}
                      >
                        Discover your soul's desires, sources of happiness, rejuvenation triggers, natural energy flow, and core temperament — interpreted based on your gender.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.featureItem}>
                    <Text
                      style={[
                        styles.bulletPoint,
                        {
                          color:
                            theme === 'dark' ? colors.white : colors.DarkNavy,
                        },
                      ]}
                    >
                      {'\u2022'}
                    </Text>
                    <View style={styles.featureTextContainer}>
                      <Text
                        style={[
                          styles.featureText,
                          styles.featureTitle,
                          {
                            color:
                              theme === 'dark' ? colors.white : colors.DarkNavy,
                          },
                        ]}
                      >
                        Income & Wealth Potential
                      </Text>
                      <Text
                        style={[
                          styles.featureDescription,
                          {
                            color:
                              theme === 'dark' ? colors.white : colors.DarkNavy,
                          },
                        ]}
                      >
                        Identify natural pathways for financial growth, career opportunities, and areas where money and success may flow more easily.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.featureItem}>
                    <Text
                      style={[
                        styles.bulletPoint,
                        {
                          color:
                            theme === 'dark' ? colors.white : colors.DarkNavy,
                        },
                      ]}
                    >
                      {'\u2022'}
                    </Text>
                    <View style={styles.featureTextContainer}>
                      <Text
                        style={[
                          styles.featureText,
                          styles.featureTitle,
                          {
                            color:
                              theme === 'dark' ? colors.white : colors.DarkNavy,
                          },
                        ]}
                      >
                        Current Antardasha Analysis
                      </Text>
                      <Text
                        style={[
                          styles.featureDescription,
                          {
                            color:
                              theme === 'dark' ? colors.white : colors.DarkNavy,
                          },
                        ]}
                      >
                        Understand which antardasha you are currently running and how it impacts your mindset, decisions, and life experiences.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.featureItem}>
                    <Text
                      style={[
                        styles.bulletPoint,
                        {
                          color:
                            theme === 'dark' ? colors.white : colors.DarkNavy,
                        },
                      ]}
                    >
                      {'\u2022'}
                    </Text>
                    <View style={styles.featureTextContainer}>
                      <Text
                        style={[
                          styles.featureText,
                          styles.featureTitle,
                          {
                            color:
                              theme === 'dark' ? colors.white : colors.DarkNavy,
                          },
                        ]}
                      >
                        Most Active Planet
                      </Text>
                      <Text
                        style={[
                          styles.featureDescription,
                          {
                            color:
                              theme === 'dark' ? colors.white : colors.DarkNavy,
                          },
                        ]}
                      >
                        Learn which planet is currently dominant in your chart and how its influence may show up in your daily life.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.featureItem}>
                    <Text
                      style={[
                        styles.bulletPoint,
                        {
                          color:
                            theme === 'dark' ? colors.white : colors.DarkNavy,
                        },
                      ]}
                    >
                      {'\u2022'}
                    </Text>
                    <View style={styles.featureTextContainer}>
                      <Text
                        style={[
                          styles.featureText,
                          styles.featureTitle,
                          {
                            color:
                              theme === 'dark' ? colors.white : colors.DarkNavy,
                          },
                        ]}
                      >
                        Strengths & Watch-Out Areas
                      </Text>
                      <Text
                        style={[
                          styles.featureDescription,
                          {
                            color:
                              theme === 'dark' ? colors.white : colors.DarkNavy,
                          },
                        ]}
                      >
                        Clear highlights of what's supporting you, along with patterns or tendencies you should be cautious about.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.featureItem}>
                    <Text
                      style={[
                        styles.bulletPoint,
                        {
                          color:
                            theme === 'dark' ? colors.white : colors.DarkNavy,
                        },
                      ]}
                    >
                      {'\u2022'}
                    </Text>
                    <View style={styles.featureTextContainer}>
                      <Text
                        style={[
                          styles.featureText,
                          styles.featureTitle,
                          {
                            color:
                              theme === 'dark' ? colors.white : colors.DarkNavy,
                          },
                        ]}
                      >
                        Key Planetary Connections
                      </Text>
                      <Text
                        style={[
                          styles.featureDescription,
                          {
                            color:
                              theme === 'dark' ? colors.white : colors.DarkNavy,
                          },
                        ]}
                      >
                        Insights into whether Jupiter, Saturn, Rahu, or Ketu are influencing your active planet — and what that connection may indicate for inner experiences and external events.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.featureItem}>
                    <Text
                      style={[
                        styles.bulletPoint,
                        {
                          color:
                            theme === 'dark' ? colors.white : colors.DarkNavy,
                        },
                      ]}
                    >
                      {'\u2022'}
                    </Text>
                    <View style={styles.featureTextContainer}>
                      <Text
                        style={[
                          styles.featureText,
                          styles.featureTitle,
                          {
                            color:
                              theme === 'dark' ? colors.white : colors.DarkNavy,
                          },
                        ]}
                      >
                        Transit Snapshot (Excluding Moon)
                      </Text>
                      <Text
                        style={[
                          styles.featureDescription,
                          {
                            color:
                              theme === 'dark' ? colors.white : colors.DarkNavy,
                          },
                        ]}
                      >
                        A focused view of how current transits interact with your natal chart, including:
                      </Text>
                      <View style={styles.bulletPointContainer}>
                        <View style={styles.bulletPointRow}>
                          <Text
                            style={[
                              styles.bulletSymbol,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            {'\u2022'}
                          </Text>
                          <Text
                            style={[
                              styles.bulletPointText,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            Existing planetary combinations that are getting activated
                          </Text>
                        </View>
                        <View style={styles.bulletPointRow}>
                          <Text
                            style={[
                              styles.bulletSymbol,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            {'\u2022'}
                          </Text>
                          <Text
                            style={[
                              styles.bulletPointText,
                              {
                                color:
                                  theme === 'dark' ? colors.white : colors.DarkNavy,
                              },
                            ]}
                          >
                            Transit planets (except the Moon) forming meaningful connections with natal planets
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.featureDescription,
                          {
                            color:
                              theme === 'dark' ? colors.white : colors.DarkNavy,
                          },
                        ]}
                      >
                        {'\n'}This provides a grounded understanding of the themes currently unfolding in your life.
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Disclaimer */}
                <View style={styles.disclaimerContainer}>
                  <Text
                    style={[
                      styles.disclaimerText,
                      {
                        color:
                          theme === 'dark' ? colors.white : colors.DarkNavy,
                      },
                    ]}
                  >
                    *Astrological analysis is not generated for children up to 15 years of age.
                  </Text>
                </View>

                {/* Separator Line */}
                {/* <View
                  style={[
                    styles.freePlanSeparator,
                    {
                      backgroundColor:
                        theme === 'dark'
                          ? colors.Orangeaccentcolor
                          : colors.Orangeaccentcolor,
                    },
                  ]}
                /> */}
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
    paddingBottom: Platform.OS === 'android' ? 90 : 90,
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
  imageContainer: {
    // width: '92%',
    // width:408,
    height:98,
    borderRadius: 8,
    // justifyContent: 'center',
    // alignItems: 'center',
    overflow: "hidden",
    marginBottom: responsiveWidth(4),
    marginHorizontal: responsiveWidth(4),
    // backgroundColor: colors.transparent,
  },
  imagePaidPlan: {
    width: '100%',
    height: "100%",
    borderRadius: 8,
    // marginHorizontal: responsiveWidth(4),
    // overflow: 'hidden',
    resizeMode: "cover",
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
    marginLeft: -responsiveWidth(5),
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
    alignItems: 'flex-start',
    marginBottom: responsiveWidth(2),
  },
  checkIcon: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    resizeMode: 'contain',
    marginRight: responsiveWidth(2),
  },
  bulletPoint: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    marginRight: responsiveWidth(1.5),
    marginTop: responsiveWidth(0.5),
    lineHeight: 20,
    width: responsiveWidth(3),
    textAlign: 'left',
  },
  featureText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    flex: 1,
    fontWeight: '500',
    lineHeight: 18,
  },
  featureTextContainer: {
    flex: 1,
    flexShrink: 1,
    paddingLeft: 0,
  },
  featureTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    lineHeight: 18,
    marginTop: 2,
    paddingLeft: 0,
    textAlign: 'left',
    includeFontPadding: false,
    textAlignVertical: 'top',
  },
  bulletPointContainer: {
    marginTop: 4,
    marginBottom: 4,
  },
  subBulletPointContainer: {
    paddingLeft: responsiveWidth(4),
  },
  bulletPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  bulletSymbol: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    marginRight: responsiveWidth(1.5),
    marginTop: 0,
    lineHeight: 18,
    width: responsiveWidth(3),
  },
  bulletPointText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    lineHeight: 18,
    flex: 1,
    flexShrink: 1,
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
    marginTop: responsiveWidth(1),
  },
  addMemberTitle: {
    fontSize: 18,
    fontFamily: fontFamily.regular,
    lineHeight: 24,
    // marginBottom: 16,
  },
  addMemberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // marginBottom: 12,
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
  priceAndButtonWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priceContainerLeft: {
    flex: 1,
    paddingLeft: 8,
  },
  totalPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  totalPriceLabel: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    fontWeight: '600' as '600',
  },
  totalPriceValue: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '700' as '700',
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  originalPriceLabel: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    fontWeight: '400' as const,
    marginRight: 8,
  },
  originalPriceValue: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    fontWeight: '400' as const,
    textDecorationLine: 'line-through',
  },
  discountLabel: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    fontWeight: '600' as const,
    marginRight: 8,
  },
  discountValue: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    fontWeight: '600' as const,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center',
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
  mostPopularTag: {
    alignSelf: 'flex-end',
    backgroundColor: '#223149',
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveWidth(1),
    borderRadius: 4,
    marginBottom: responsiveWidth(2),
  },
  mostPopularText: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  buyPremiumButton: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: responsiveWidth(4),
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: responsiveHeight(3),
    marginBottom: responsiveHeight(2),
  },
  buyPremiumButtonText: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
});

export default PaidPlanScreen;
