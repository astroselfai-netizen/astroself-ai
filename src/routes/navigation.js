import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import {
  font,
  fontFamily,
  fontSize,
  responsiveWidth,
} from '../constant/theme';
import {
  Image,
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useSelector } from 'react-redux';
import { useProfileData } from '../hooks/useProfileData';
import RazorpayCheckout from 'react-native-razorpay';
import AsyncStorage from '@react-native-async-storage/async-storage';
import serviceFactory from '../services/serviceFactory';
import Toast from 'react-native-toast-message';
import Login from '../screen/login';
import SplashScreen from '../screen/splashscreen';
import ContinueWithOtp from '../screen/ContinueWithOtp';
import ForgotPassword from '../screen/ForgotPassword';
import ForgotPasswordOtp from '../screen/ForgotPasswordOtp';
import Register from '../screen/Register';
import HomeScreen from '../screen/Home';
import ProfileScreen from '../screen/Profile';
import { icons } from '../assets';
import ChatScreen from '../screen/Chat';
import NakshatraScreen from '../screen/Nakshatra';
import SettingsScreen from '../screen/Settings';

import BasicDeatil from '../screen/BasicDeatil';
import AddNewMember from '../screen/AddNewMember';
import MemberManagement from '../screen/MemberManagement';
import NotificationScreen from '../screen/Notification';
import ChatWithPromptsScreen from '../screen/ChatWithPrompts';
import PrivacyPolicyScreen from '../screen/PrivacyPolicy';
import TermsAndConditions from '../screen/TermsAndConditions';
import AboutUsScreen from '../screen/AboutUs';
import ResourcesScreen from '../screen/Resources';
import ResourcesDetailsScreen from '../screen/ResourcesDetails';
import PaidPlanScreen from '../screen/PaidPlan';
import FaqsScreen from '../screen/Faqs';
import ReportScreen from '../screen/Report';
import HelpCenterScreen from '../screen/HelpCenter';
import DashboardTasksScreen from '../screen/DashboardTasks';
import EditAllTaskSelectionScreen from '../screen/EditAllTaskSelection';
import PurchasedHistoryScreen from '../screen/PurchasedHistory';
import DashboardTasksDoNotScreen from '../screen/DashboardTasksDoNot';
import MemberPlanManagement from '../screen/MemberPlanManagement';
import StartExploring from '../screen/StartExploring';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Helper to create stack with initial route
function createAppStack(initialRouteName) {
  return function AppStack() {
    return (
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{ headerShown: false }}
      >
        {/* Main Tab Screens */}
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="ChatScreen" component={ChatScreen} />
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
        <Stack.Screen name="NakshatraScreen" component={NakshatraScreen} />
        <Stack.Screen name="SettingsScreen" component={SettingsScreen} />

        {/* All other screens - accessible from anywhere */}
        <Stack.Screen name="BasicDeatil" component={BasicDeatil} />
        <Stack.Screen name="AddNewMember" component={AddNewMember} />
        <Stack.Screen name="StartExploring" component={StartExploring} />
        <Stack.Screen name="MemberManagement" component={MemberManagement} />
        <Stack.Screen
          name="NotificationScreen"
          component={NotificationScreen}
        />
        <Stack.Screen
          name="ChatWithPrompts"
          component={ChatWithPromptsScreen}
        />
        <Stack.Screen
          name="PrivacyPolicyScreen"
          component={PrivacyPolicyScreen}
        />
        <Stack.Screen
          name="TermsAndConditions"
          component={TermsAndConditions}
        />
        <Stack.Screen name="AboutUsScreen" component={AboutUsScreen} />
        <Stack.Screen name="ResourcesScreen" component={ResourcesScreen} />
        <Stack.Screen
          name="ResourcesDetailsScreen"
          component={ResourcesDetailsScreen}
        />
        <Stack.Screen name="PaidPlanScreen" component={PaidPlanScreen} />
        <Stack.Screen name="FaqsScreen" component={FaqsScreen} />
        <Stack.Screen name="ReportScreen" component={ReportScreen} />
        <Stack.Screen name="HelpCenterScreen" component={HelpCenterScreen} />
        <Stack.Screen
          name="DashboardTasksScreen"
          component={DashboardTasksScreen}
        />
        <Stack.Screen
          name="EditAllTaskSelectionScreen"
          component={EditAllTaskSelectionScreen}
        />
        <Stack.Screen
          name="PurchasedHistoryScreen"
          component={PurchasedHistoryScreen}
        />
        <Stack.Screen
          name="DashboardTasksDoNotScreen"
          component={DashboardTasksDoNotScreen}
        />
        <Stack.Screen
          name="MemberPlanManagement"
          component={MemberPlanManagement}
        />
      </Stack.Navigator>
    );
  };
}

// Create separate stack instances for each tab with different initial routes
const HomeStack = createAppStack('HomeScreen');
const ChatStack = createAppStack('ChatScreen');
const ProfileStack = createAppStack('ProfileScreen');
const TasksStack = createAppStack('DashboardTasksScreen');
const SettingsStack = createAppStack('SettingsScreen');
const ReportStack = createAppStack('ReportScreen');
const ResourcesStack = createAppStack('ResourcesScreen');

function MainNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* Auth and initial screens - these won't show tabs */}
        <Stack.Screen name="SplashScreen" component={SplashScreen} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="ContinueWithOtp" component={ContinueWithOtp} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        <Stack.Screen name="ForgotPasswordOtp" component={ForgotPasswordOtp} />
        <Stack.Screen name="AddNewMember" component={AddNewMember} />
        <Stack.Screen name="ChatWithPrompts" component={ChatWithPromptsScreen} />
        {/* <Stack.Screen name="ChatScreen" component={ChatScreen} /> */}
        <Stack.Screen name="StartExploring" component={StartExploring} />
        <Stack.Screen name="NakshatraScreen" component={NakshatraScreen} />
        <Stack.Screen name="Register" component={Register} />
        {/* Main app with tabs - tabs will be visible on all screens inside MyTabs */}
        <Stack.Screen name="HomeScreen" component={MyTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function MyTabs() {
  const { colors, theme } = useTheme();
  const user = useSelector((state) => state.app.user);
  const { membersData } = useProfileData();
  const reduxMembers = useSelector((state) => state.app.members);
  // Use Redux members if available and is array, otherwise use membersData from useProfileData
  const allMembersData = React.useMemo(() => {
    const redux = Array.isArray(reduxMembers) && reduxMembers.length > 0 ? reduxMembers : null;
    const profile = Array.isArray(membersData) && membersData.length > 0 ? membersData : null;
    const result = redux || profile || [];
    console.log('Members data computed:', {
      reduxCount: redux?.length || 0,
      profileCount: profile?.length || 0,
      resultCount: result.length,
      reduxMembers,
      membersData,
      result,
    });
    return result;
  }, [reduxMembers, membersData]);
  const paymentService = serviceFactory.get('PaymentService');
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);
  const [showPremiumModal, setShowPremiumModal] = React.useState(false);
  const [pendingNavigation, setPendingNavigation] = React.useState(null);
  const [showMemberDropdown, setShowMemberDropdown] = React.useState(false);
  const [selectedMemberForSubscription, setSelectedMemberForSubscription] = React.useState(null);
  const [creatingSubscription, setCreatingSubscription] = React.useState(false);
  
  const handleCloseUpgradeModal = () => {
    setShowUpgradeModal(false);
    setPendingNavigation(null);
  };

  const handleUpgradeModalBuy = () => {
    // Close upgrade modal and show premium modal
    setShowUpgradeModal(false);
    setShowPremiumModal(true);
  };

  const handleClosePremiumModal = () => {
    setShowPremiumModal(false);
    // Don't navigate if user still has cosmic_foundation plan
    // Only navigate if plan is eternal_path
    if (pendingNavigation && user && user.current_plan === 'eternal_path') {
      setTimeout(() => {
        pendingNavigation();
        setPendingNavigation(null);
      }, 300);
    } else {
      setPendingNavigation(null);
    }
  };

  const handleBuyPremiumAccess = () => {
    // Show member dropdown first
    if (!showMemberDropdown) {
      setShowMemberDropdown(true);
      return;
    }

    // If member is selected, proceed with payment
    if (!selectedMemberForSubscription) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select a member',
        position: 'top',
        topOffset: 60,
        visibilityTime: 3000,
      });
      return;
    }

    // Proceed with payment
    handlePaymentForMember(selectedMemberForSubscription);
  };

  const handlePaymentForMember = async (member) => {
    if (!member || !user) {
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

    if (!paymentService) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Payment service not available',
        position: 'top',
        topOffset: 60,
        visibilityTime: 3000,
      });
      return;
    }

    try {
      setCreatingSubscription(true);

      const planId = 'd461266c-574b-4312-994a-ebd2b5cf6dc3'; // Premium plan ID
      const userId = user?._id || user?.id || '';
      const memberUserId = member.id || member._id || '';

      // First create subscription
      const subscriptionResponse = await paymentService.createSubscription({
        plan_id: planId,
        user_id: userId,
        member_user_id: memberUserId,
        notes: {
          action: 'premium_subscription',
          member_name: member.full_name || 'Member',
        },
      });

      console.log('Subscription created:', subscriptionResponse);

      if (!subscriptionResponse.subscription_id) {
        throw new Error('Subscription ID not received from server');
      }

      if (!subscriptionResponse.razorpay_key) {
        throw new Error('Razorpay key not received from server');
      }

      // Get user data for prefill
      const userDataString = await AsyncStorage.getItem('USER_DATA');
      let currentUserData = {};
      if (userDataString) {
        currentUserData = JSON.parse(userDataString);
      }

      // Close the premium modal before opening Razorpay
      setShowPremiumModal(false);
      setShowMemberDropdown(false);
      setPendingNavigation(null);

      // Razorpay payment options for subscription
      const options = {
        key: subscriptionResponse.razorpay_key,
        subscription_id: subscriptionResponse.subscription_id,
        name: 'Astroself',
        description: 'Premium Plan Subscription - Astroself',
        currency: 'INR',
        prefill: {
          email: currentUserData.email || user?.email || 'user@example.com',
          contact: currentUserData.phone || user?.phone || '9999999999',
          name: `${currentUserData.first_name || user?.first_name || ''} ${
            currentUserData.last_name || user?.last_name || ''
          }`.trim() || 'User',
        },
        notes: {
          source: 'react_native',
          user_id: userId,
          member_user_id: memberUserId,
          plan_id: planId,
        },
      };

      try {
        // Open Razorpay checkout modal
        console.log('Razorpay options:', options);
        const paymentData = await RazorpayCheckout.open(options);

        console.log('Payment response:', paymentData);

        // Payment successful
        if (paymentData) {
          Toast.show({
            type: 'success',
            text1: 'Payment Successful',
            text2: 'Your premium subscription has been activated',
            position: 'top',
            topOffset: 60,
            visibilityTime: 3000,
          });
        }
      } catch (razorpayError) {
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
    } catch (subscriptionError) {
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
      setSelectedMemberForSubscription(null);
      setShowMemberDropdown(false);
    }
  };

  const handleMemberSelect = (member) => {
    console.log('Member selected:', member);
    setSelectedMemberForSubscription(member);
    setShowMemberDropdown(false);
    // Automatically proceed to payment after member selection
    setTimeout(() => {
      handlePaymentForMember(member);
    }, 300);
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -84}
    >
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarShowLabel: false,
          tabBarStyle: {
            position: 'absolute',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            height: responsiveWidth('20%'),
            // marginLeft:responsiveWidth('2%'),
            // marginRight:responsiveWidth('2%'),
            // marginBottom:responsiveWidth('5%'),
            borderWidth: 1,
            borderColor:
              theme === 'dark' ? colors.borderColor : colors.surfaceOpacity,
            paddingBottom: 0,
            paddingTop: responsiveWidth('5%'),
          },
          tabBarBackground: () => (
            <Image
              source={colors.backgroundImage}
              style={{
                width: '100%',
                height: '100%',
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                // marginLeft:responsiveWidth('2%'),
                // marginRight:responsiveWidth('2%'),
                opacity: 10,
                resizeMode: 'cover',
              }}
            />
          ),
        }}
      >
        <Tab.Screen
          name="ChatTab"
          component={ChatStack}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={styles.tabItemContainer}>
                <Image
                  source={focused ? icons.IcChatActive : icons.icChat}
                  style={[
                    styles.iconStyle,
                    {
                      tintColor: focused
                        ? colors.Orangeaccentcolor
                        : colors.textSecondary,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: focused
                        ? colors.Orangeaccentcolor
                        : colors.textSecondary,
                    },
                  ]}
                >
                  Predictions
                </Text>
              </View>
            ),
          }}
          listeners={({ navigation, route }) => ({
            tabPress: e => {
              const state = navigation.getState();
              const tabRoute = state.routes.find(r => r.key === route.key);
              const nestedState = tabRoute?.state;
              const currentRoute = nestedState?.routes[nestedState?.index];

              // If not on ChatScreen, navigate to it
              if (currentRoute?.name !== 'ChatScreen') {
                e.preventDefault();
                navigation.navigate('ChatTab', {
                  screen: 'ChatScreen',
                });
              }
            },
          })}
        />
        <Tab.Screen
          name="ProfileTab"
          component={ProfileStack}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={styles.tabItemContainer}>
                <Image
                  source={
                    focused ? icons.icProfileActive : icons.icProfileInActive
                  }
                  style={[
                    styles.iconStyle,
                    {
                      tintColor: focused
                        ? colors.Orangeaccentcolor
                        : colors.textSecondary,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: focused
                        ? colors.Orangeaccentcolor
                        : colors.textSecondary,
                    },
                  ]}
                >
                  My Members
                </Text>
              </View>
            ),
          }}
          listeners={({ navigation, route }) => ({
            tabPress: e => {
              const state = navigation.getState();
              const tabRoute = state.routes.find(r => r.key === route.key);
              const nestedState = tabRoute?.state;
              const currentRoute = nestedState?.routes[nestedState?.index];

              // If not on ProfileScreen, navigate to it
              if (currentRoute?.name !== 'ProfileScreen') {
                e.preventDefault();
                navigation.navigate('ProfileTab', {
                  screen: 'ProfileScreen',
                });
              }
            },
          })}
        />

        <Tab.Screen
          name="ReportTab"
          component={ReportStack}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={styles.tabItemContainer}>
                <Image
                  source={focused ? icons.icReportActive : icons.icReport}
                  style={[
                    styles.iconStyle,
                    {
                      tintColor: focused
                        ? colors.Orangeaccentcolor
                        : colors.textSecondary,
                      width: responsiveWidth(6.5),
                      height: responsiveWidth(6.5),
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: focused
                        ? colors.Orangeaccentcolor
                        : colors.textSecondary,
                    },
                  ]}
                >
                  Reports
                </Text>
              </View>
            ),
          }}
          listeners={({ navigation, route }) => ({
            tabPress: e => {
              const state = navigation.getState();
              const tabRoute = state.routes.find(r => r.key === route.key);
              const nestedState = tabRoute?.state;
              const currentRoute = nestedState?.routes[nestedState?.index];

              // If not on DashboardTasksScreen, navigate to it
              if (currentRoute?.name !== 'ReportScreen') {
                e.preventDefault();
                navigation.navigate('ReportTab', {
                  screen: 'ReportScreen',
                });
              }
            },
          })}
        />

        <Tab.Screen
          name="TasksTab"
          component={TasksStack}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={styles.tabItemContainer}>
                <Image
                  source={
                    focused
                      ? icons.icNakshatraActive
                      : icons.icNakshatraInActive
                  }
                  style={[
                    styles.iconStyle,
                    {
                      tintColor: focused
                        ? colors.Orangeaccentcolor
                        : colors.textSecondary,
                      width: responsiveWidth(6.5),
                      height: responsiveWidth(6.5),
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: focused
                        ? colors.Orangeaccentcolor
                        : colors.textSecondary,
                    },
                  ]}
                >
                  Tasks
                </Text>
              </View>
            ),
          }}
          listeners={({ navigation, route }) => ({
            tabPress: e => {
              const state = navigation.getState();
              const tabRoute = state.routes.find(r => r.key === route.key);
              const nestedState = tabRoute?.state;
              const currentRoute = nestedState?.routes[nestedState?.index];

              console.log('user411', user);

              // Check if user has cosmic_foundation plan - don't allow navigation
              if (user && user.current_plan === 'cosmic_foundation') {
                // Prevent navigation completely - show upgrade modal first
                e.preventDefault();
                // Store navigation function only if plan becomes eternal_path later
                setPendingNavigation(() => () => {
                  navigation.navigate('TasksTab', {
                    screen: 'DashboardTasksScreen',
                  });
                });
                setShowUpgradeModal(true);
                // Don't navigate - stay on current tab
                return;
              }

              // Only allow navigation if plan is eternal_path or other paid plans
              if (user && user.current_plan === 'eternal_path') {
                // If not on DashboardTasksScreen, navigate to it
                if (currentRoute?.name !== 'DashboardTasksScreen') {
                  e.preventDefault();
                  navigation.navigate('TasksTab', {
                    screen: 'DashboardTasksScreen',
                  });
                }
              } else {
                // For other plans or no plan, allow normal navigation
                if (currentRoute?.name !== 'DashboardTasksScreen') {
                  e.preventDefault();
                  navigation.navigate('TasksTab', {
                    screen: 'DashboardTasksScreen',
                  });
                }
              }
            },
          })}
        />
      
        <Tab.Screen
          name="HomeTab"
          component={HomeStack}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={styles.tabItemContainer}>
                <Image
                  source={focused ? icons.icHomeActive : icons.icHome}
                  style={[
                    styles.iconStyle,
                    {
                      tintColor: focused
                        ? colors.Orangeaccentcolor
                        : colors.textSecondary,
                      width: responsiveWidth(6),
                      height: responsiveWidth(6),
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: focused
                        ? colors.Orangeaccentcolor
                        : colors.textSecondary,
                    },
                  ]}
                >
                  Dashboard
                </Text>
              </View>
            ),
          }}
          listeners={({ navigation, route }) => ({
            tabPress: e => {
              const state = navigation.getState();
              const tabRoute = state.routes.find(r => r.key === route.key);
              const nestedState = tabRoute?.state;
              const currentRoute = nestedState?.routes[nestedState?.index];

              // If not on HomeScreen, navigate to it
              if (currentRoute?.name !== 'HomeScreen') {
                e.preventDefault();
                navigation.navigate('HomeTab', {
                  screen: 'HomeScreen',
                });
              }
            },
          })}
        />
        {/* <Tab.Screen
          name="SettingsTab"
          component={SettingsStack}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={styles.tabItemContainer}>
                <Image
                  source={
                    focused ? icons.icSettingsActive : icons.icSettingsInActive
                  }
                  style={[
                    styles.iconStyle,
                    {
                      tintColor: focused
                        ? colors.Orangeaccentcolor
                        : colors.textSecondary,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: focused
                        ? colors.Orangeaccentcolor
                        : colors.textSecondary,
                    },
                  ]}
                >
                  Settings
                </Text>
              </View>
            ),
          }}
          listeners={({ navigation, route }) => ({
            tabPress: e => {
              const state = navigation.getState();
              const tabRoute = state.routes.find(r => r.key === route.key);
              const nestedState = tabRoute?.state;
              const currentRoute = nestedState?.routes[nestedState?.index];

              // If not on SettingsScreen, navigate to it
              if (currentRoute?.name !== 'SettingsScreen') {
                e.preventDefault();
                navigation.navigate('SettingsTab', {
                  screen: 'SettingsScreen',
                });
              }
            },
          })}
        /> */}
      </Tab.Navigator>

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
            <ScrollView style={styles.premiumModalFeaturesContainer}>
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
            </ScrollView>

            {/* Member Dropdown */}
            {showMemberDropdown && allMembersData && Array.isArray(allMembersData) && allMembersData.length > 0 && (
              <View style={styles.memberDropdownContainer}>
                <Text
                  style={[
                    styles.memberDropdownLabel,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  Select Member ({allMembersData.length}):
                </Text>
                <ScrollView
                  style={[
                    styles.memberDropdownList,
                    {
                      borderColor:
                        theme === 'dark'
                          ? colors.themeBorderDropdown
                          : colors.borderColor,
                    },
                  ]}
                  nestedScrollEnabled={true}
                >
                  {allMembersData.map((member, index) => {
                    console.log('Rendering member in dropdown:', index, member?.full_name || member?.first_name, member);
                    const memberId = member.id || member._id;
                    const isSelected = selectedMemberForSubscription && (
                      selectedMemberForSubscription.id === memberId ||
                      selectedMemberForSubscription._id === memberId
                    );
                    return (
                      <TouchableOpacity
                        key={memberId || index}
                        style={[
                          styles.memberDropdownItem,
                          {
                            backgroundColor: isSelected
                              ? colors.Orangeaccentcolor + '20'
                              : 'transparent',
                            borderColor:
                              theme === 'dark'
                                ? colors.themeBorderDropdown
                                : colors.borderColor,
                          },
                        ]}
                        onPress={() => {
                          console.log('Selecting member:', member);
                          handleMemberSelect(member);
                        }}
                      >
                        <Text
                          style={[
                            styles.memberDropdownItemText,
                            {
                              color:
                                theme === 'dark'
                                  ? colors.themeTextWhite
                                  : colors.DarkNavy,
                            },
                          ]}
                        >
                          {member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Member'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                {selectedMemberForSubscription && (
                  <Text
                    style={[
                      styles.selectedMemberText,
                      {
                        color: colors.Orangeaccentcolor,
                      },
                    ]}
                  >
                    Selected: {selectedMemberForSubscription.full_name || `${selectedMemberForSubscription.first_name || ''} ${selectedMemberForSubscription.last_name || ''}`.trim() || 'Member'}
                  </Text>
                )}
              </View>
            )}

            {/* Buy Premium Access Button */}
            {!showMemberDropdown && (
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
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.premiumModalBuyButtonText}>
                    Buy an Annual Plan
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Upgrade Plan Modal - First Modal */}
      <Modal
        visible={showUpgradeModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseUpgradeModal}
      >
        <TouchableOpacity
          style={styles.upgradeModalOverlay}
          activeOpacity={1}
          onPress={handleCloseUpgradeModal}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={e => e.stopPropagation()}
            style={[
              styles.upgradeModalContainer,
              {
                backgroundColor:
                  theme === 'dark' ? colors.DarkNavy : colors.white,
              },
            ]}
          >
            {/* Title */}
            <Text
              style={[
                styles.upgradeModalTitle,
                {
                  color:
                    theme === 'dark'
                      ? colors.themeTextWhite
                      : colors.DarkNavy,
                },
              ]}
            >
              Upgrade Plan
            </Text>

            {/* Message */}
            <Text
              style={[
                styles.upgradeModalMessage,
                {
                  color:
                    theme === 'dark'
                      ? colors.themeTextWhite
                      : colors.DarkNavy,
                },
              ]}
            >
              To Access Dynamic Predictions, Please Upgrade Your Plan.
            </Text>

            {/* Buttons */}
            <View style={styles.upgradeModalButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.upgradeModalButton,
                  styles.upgradeModalCancelButton,
                  {
                    borderColor:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
                onPress={handleCloseUpgradeModal}
              >
                <Text
                  style={[
                    styles.upgradeModalButtonText,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.upgradeModalButton,
                  styles.upgradeModalBuyButton,
                  {
                    backgroundColor: colors.Orangeaccentcolor,
                  },
                ]}
                onPress={handleUpgradeModalBuy}
              >
                <Text
                  style={[
                    styles.upgradeModalButtonText,
                    { color: colors.white },
                  ]}
                >
                  Buy
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* White indicator bar at the bottom center */}
      {/* <View style={styles.indicatorBar} /> */}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  shadow: {
    // shadowColor: color.black,
    // shadowOffset: {
    //   width: 0,
    //   height: 0,
    // },
    // shadowOpacity: 0.25,
    // shadowRadius: 10,
    // elevation: 5,
  },
  tabItemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: fontSize.xxsmall,
    fontFamily: fontFamily.regular,
    // marginTop: responsiveWidth(1),
    fontWeight: '400',
    marginTop: 4,
    textAlign: 'center',
    width: responsiveWidth('19%'),
  },
  // Premium Modal Styles
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
    maxHeight: '85%',
  },
  premiumModalCloseButton: {
    position: 'absolute',
    top: responsiveWidth(3),
    right: responsiveWidth(3),
    width: responsiveWidth(8),
    height: responsiveWidth(8),
    borderRadius: responsiveWidth(4),
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
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
    maxHeight: responsiveWidth(60),
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
    fontWeight: 'bold',
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
    opacity: 0.9,
  },
  premiumModalBuyButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveWidth(3.5),
    borderRadius: 12,
  },
  premiumModalBuyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
  },
  // Member Dropdown Styles
  memberDropdownContainer: {
    marginBottom: responsiveWidth(4),
  },
  memberDropdownLabel: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    marginBottom: responsiveWidth(2),
  },
  memberDropdownList: {
    maxHeight: responsiveWidth(40),
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: responsiveWidth(2),
  },
  memberDropdownItem: {
    paddingVertical: responsiveWidth(3),
    paddingHorizontal: responsiveWidth(4),
    borderBottomWidth: 1,
  },
  memberDropdownItemText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
  },
  selectedMemberText: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
    marginTop: responsiveWidth(2),
    textAlign: 'center',
  },
  // Upgrade Modal Styles
  upgradeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeModalContainer: {
    width: responsiveWidth(85),
    borderRadius: 16,
    padding: responsiveWidth(6),
    alignItems: 'center',
  },
  upgradeModalTitle: {
    fontSize: 24,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    marginBottom: responsiveWidth(4),
    textAlign: 'center',
  },
  upgradeModalMessage: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    marginBottom: responsiveWidth(6),
    textAlign: 'center',
    lineHeight: 24,
  },
  upgradeModalButtonsContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: responsiveWidth(3),
  },
  upgradeModalButton: {
    flex: 1,
    paddingVertical: responsiveWidth(3.5),
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeModalCancelButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  upgradeModalBuyButton: {
    // backgroundColor will be set inline
  },
  upgradeModalButtonText: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
  },
  iconStyle: {
    height: responsiveWidth(7),
    width: responsiveWidth(7),
    resizeMode: 'contain',
    // tintColor: '#EEE5CA',
  },
  indicatorBar: {
    position: 'absolute',
    left: '25%',
    right: '25%',
    bottom: 18,
    height: 10,
    borderRadius: 8,
    // backgroundColor: '#fff',
    opacity: 0.95,
    zIndex: 10,
  },
});

export default MainNavigator;
