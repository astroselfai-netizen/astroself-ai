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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useSelector } from 'react-redux';
import { resolveBottomSafeInset } from '../utils/safeAreaInsets';

const getTabBarBottomInset = bottomInset => resolveBottomSafeInset(bottomInset);
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
import AstrodhaGuideScreen from '../screen/AstrodhaGuide';
import DashboardTasksScreen from '../screen/DashboardTasks';
import EditAllTaskSelectionScreen from '../screen/EditAllTaskSelection';
import PurchasedHistoryScreen from '../screen/PurchasedHistory';
import DashboardTasksDoNotScreen from '../screen/DashboardTasksDoNot';
import TasksForTheDayScreen from '../screen/TasksForTheDay';
import TaskActivityDetailsScreen from '../screen/TaskActivityDetails';
import MemberPlanManagement from '../screen/MemberPlanManagement';
import StartExploring from '../screen/StartExploring';
import AstrologerMyClientsScreen from '../screen/AstrologerMyClients';
import AstrologerMyProfileScreen from '../screen/AstrologerMyProfile';
import AstrologerPlanScreen from '../screen/AstrologerPlan';
import AstrologerCreateClientScreen from '../screen/AstrologerCreateClient';
import AstrologerCurrentTransitScreen from '../screen/AstrologerCurrentTransit';
import AstrologerCurrentTransitResultScreen from '../screen/AstrologerCurrentTransitResult';
import AstrologerClientChatScreen from '../screen/AstrologerClientChat';
import AstrologerClientChartScreen from '../screen/AstrologerClientChart';
import AstrologerDignityAnalysisScreen from '../screen/AstrologerDignityAnalysis';
import AstrologerRegisterScreen from '../screen/AstrologerRegister';

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
          name="AstrodhaGuideScreen"
          component={AstrodhaGuideScreen}
        />
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
          name="TasksForTheDayScreen"
          component={TasksForTheDayScreen}
        />
        <Stack.Screen
          name="TaskActivityDetailsScreen"
          component={TaskActivityDetailsScreen}
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

function createAstrologerStack(initialRouteName) {
  return function AstrologerAppStack() {
    return (
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen
          name="AstrologerMyClientsScreen"
          component={AstrologerMyClientsScreen}
        />
        <Stack.Screen
          name="AstrologerMyProfileScreen"
          component={AstrologerMyProfileScreen}
        />
        <Stack.Screen
          name="AstrologerPlanScreen"
          component={AstrologerPlanScreen}
        />
        <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
        <Stack.Screen
          name="PurchasedHistoryScreen"
          component={PurchasedHistoryScreen}
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
          name="AstrodhaGuideScreen"
          component={AstrodhaGuideScreen}
        />
      </Stack.Navigator>
    );
  };
}

const MyClientsStack = createAstrologerStack('AstrologerMyClientsScreen');
const MyProfileStack = createAstrologerStack('AstrologerMyProfileScreen');
const PlanStack = createAstrologerStack('AstrologerPlanScreen');
const AstrologerSettingsStack = createAstrologerStack('SettingsScreen');

function AstrologerTabs() {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarBottomInset = getTabBarBottomInset(insets.bottom);
  const tabBarHeight = responsiveWidth('20%') + tabBarBottomInset;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -84}
    >
      <Tab.Navigator
        initialRouteName="MyClientsTab"
        safeAreaInsets={{ bottom: 0 }}
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarShowLabel: false,
          tabBarStyle: {
            position: 'absolute',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            height: tabBarHeight,
            borderWidth: 1,
            borderColor:
              theme === 'dark' ? colors.borderColor : colors.surfaceOpacity,
            paddingBottom: tabBarBottomInset,
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
                opacity: 10,
                resizeMode: 'cover',
              }}
            />
          ),
        }}
      >
        <Tab.Screen
          name="MyClientsTab"
          component={MyClientsStack}
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
                  Charts
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

              if (currentRoute?.name !== 'AstrologerMyClientsScreen') {
                e.preventDefault();
                navigation.navigate('MyClientsTab', {
                  screen: 'AstrologerMyClientsScreen',
                });
              }
            },
          })}
        />
        <Tab.Screen
          name="MyProfileTab"
          component={MyProfileStack}
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
                  My Profile
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

              if (currentRoute?.name !== 'AstrologerMyProfileScreen') {
                e.preventDefault();
                navigation.navigate('MyProfileTab', {
                  screen: 'AstrologerMyProfileScreen',
                });
              }
            },
          })}
        />
        <Tab.Screen
          name="PlanTab"
          component={PlanStack}
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
                  Plan
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

              if (currentRoute?.name !== 'AstrologerPlanScreen') {
                e.preventDefault();
                navigation.navigate('PlanTab', {
                  screen: 'AstrologerPlanScreen',
                });
              }
            },
          })}
        />
        <Tab.Screen
          name="SettingsTab"
          component={AstrologerSettingsStack}
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

              if (currentRoute?.name !== 'SettingsScreen') {
                e.preventDefault();
                navigation.navigate('SettingsTab', {
                  screen: 'SettingsScreen',
                });
              }
            },
          })}
        />
      </Tab.Navigator>
    </KeyboardAvoidingView>
  );
}

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
        <Stack.Screen name="AstrologerRegister" component={AstrologerRegisterScreen} />
        <Stack.Screen name="TermsAndConditions" component={TermsAndConditions} />
        {/* Main app with tabs - tabs will be visible on all screens inside MyTabs */}
        <Stack.Screen name="HomeScreen" component={MyTabs} />
        <Stack.Screen name="AstrologerHome" component={AstrologerTabs} />
        <Stack.Screen
          name="AstrologerCreateClientScreen"
          component={AstrologerCreateClientScreen}
        />
        <Stack.Screen
          name="AstrologerCurrentTransitScreen"
          component={AstrologerCurrentTransitScreen}
        />
        <Stack.Screen
          name="AstrologerCurrentTransitResultScreen"
          component={AstrologerCurrentTransitResultScreen}
        />
        <Stack.Screen
          name="AstrologerClientChatScreen"
          component={AstrologerClientChatScreen}
        />
        <Stack.Screen
          name="AstrologerClientChartScreen"
          component={AstrologerClientChartScreen}
        />
        <Stack.Screen
          name="AstrologerDignityAnalysisScreen"
          component={AstrologerDignityAnalysisScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function MyTabs() {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarBottomInset = getTabBarBottomInset(insets.bottom);
  const tabBarHeight = responsiveWidth('20%') + tabBarBottomInset;
  const user = useSelector((state) => state.app.user);
  const navigation = useNavigation();
  const tabNavigationRef = React.useRef(null);
  const [showYodhaUpgradeModal, setShowYodhaUpgradeModal] = React.useState(false);

  const handleGoToProfileFromYodhaModal = () => {
    setShowYodhaUpgradeModal(false);
    const tabNav = tabNavigationRef.current;
    if (tabNav?.navigate) {
      tabNav.navigate('ProfileTab', {
        screen: 'ProfileScreen',
      });
      return;
    }
    navigation.navigate('ProfileTab', {
      screen: 'ProfileScreen',
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -84}
    >
      <Tab.Navigator
        safeAreaInsets={{ bottom: 0 }}
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarShowLabel: false,
          tabBarStyle: {
            position: 'absolute',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            height: tabBarHeight,
            borderWidth: 1,
            borderColor:
              theme === 'dark' ? colors.borderColor : colors.surfaceOpacity,
            paddingBottom: tabBarBottomInset,
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
          listeners={({ navigation: tabNav, route }) => {
            tabNavigationRef.current = tabNav;
            return {
            tabPress: e => {
              const state = tabNav.getState();
              const tabRoute = state.routes.find(r => r.key === route.key);
              const nestedState = tabRoute?.state;
              const currentRoute = nestedState?.routes[nestedState?.index];

              // If not on ProfileScreen, navigate to it
              if (currentRoute?.name !== 'ProfileScreen') {
                e.preventDefault();
                tabNav.navigate('ProfileTab', {
                  screen: 'ProfileScreen',
                });
              }
            },
          };
          }}
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
                  Yodha
                </Text>
              </View>
            ),
          }}
          listeners={({ navigation: tabNav, route }) => {
            tabNavigationRef.current = tabNav;
            return {
            tabPress: e => {
              const state = tabNav.getState();
              const tabRoute = state.routes.find(r => r.key === route.key);
              const nestedState = tabRoute?.state;
              const currentRoute = nestedState?.routes[nestedState?.index];

              // Free plan: show upgrade modal instead of navigating directly
              if (user && user.current_plan === 'cosmic_foundation') {
                e.preventDefault();
                setShowYodhaUpgradeModal(true);
                return;
              }

              // Only allow navigation if plan is eternal_path or other paid plans
              if (user && user.current_plan === 'eternal_path' || user.current_plan === 'family_plan') {
                // If not on DashboardTasksScreen, navigate to it
                if (currentRoute?.name !== 'DashboardTasksScreen') {
                  e.preventDefault();
                  tabNav.navigate('TasksTab', {
                    screen: 'DashboardTasksScreen',
                  });
                }
              } else {
                // For other plans or no plan, allow normal navigation
                if (currentRoute?.name !== 'DashboardTasksScreen') {
                  e.preventDefault();
                  tabNav.navigate('TasksTab', {
                    screen: 'DashboardTasksScreen',
                  });
                }
              }
            },
          };
          }}
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

      <Modal
        visible={showYodhaUpgradeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowYodhaUpgradeModal(false)}
      >
        <View style={styles.upgradeModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowYodhaUpgradeModal(false)}
          />
          <View
            style={[
              styles.upgradeModalContainer,
              {
                backgroundColor: theme === 'dark' ? colors.DarkNavy : colors.white,
                zIndex: 2,
                elevation: 5,
              },
            ]}
          >
            <Text
              style={[
                styles.upgradeModalTitle,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              Unlock Yodha
            </Text>
            <Text
              style={[
                styles.upgradeModalMessage,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              Yodha guidance is available with a premium plan. Go to My Members
              to upgrade and access this feature.
            </Text>
            <View style={styles.upgradeModalButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.upgradeModalButton,
                  styles.upgradeModalCancelButton,
                  {
                    borderColor:
                      theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                  },
                ]}
                onPress={() => setShowYodhaUpgradeModal(false)}
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
                  { backgroundColor: colors.Orangeaccentcolor },
                ]}
                onPress={handleGoToProfileFromYodhaModal}
              >
                <Text style={[styles.upgradeModalButtonText, { color: '#FFFFFF' }]}>
                  My Members
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
