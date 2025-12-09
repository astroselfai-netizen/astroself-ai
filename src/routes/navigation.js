import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import {
  font,
  responsiveWidth,
} from '../constant/theme';
import {
  Image,
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
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
      <Stack.Screen name="EditAllTaskSelectionScreen" component={EditAllTaskSelectionScreen} />
      <Stack.Screen name="PurchasedHistoryScreen" component={PurchasedHistoryScreen} />
      <Stack.Screen name="DashboardTasksDoNotScreen" component={DashboardTasksDoNotScreen} />
      <Stack.Screen name="MemberPlanManagement" component={MemberPlanManagement} />
    </Stack.Navigator>
    );
  };
}

// Create separate stack instances for each tab with different initial routes
const HomeStack = createAppStack('HomeScreen');
const ChatStack = createAppStack('ChatScreen');
const ProfileStack = createAppStack('ProfileScreen');
const NakshatraStack = createAppStack('NakshatraScreen');
const SettingsStack = createAppStack('SettingsScreen');

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
        <Stack.Screen name="Register" component={Register} />
        {/* Main app with tabs - tabs will be visible on all screens inside MyTabs */}
        <Stack.Screen name="HomeScreen" component={MyTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function MyTabs() {
  const { colors, theme } = useTheme();
  
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
                  Home
                </Text>
              </View>
            ),
          }}
          listeners={({ navigation, route }) => ({
            tabPress: (e) => {
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
            tabPress: (e) => {
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
                  Profile
                </Text>
              </View>
            ),
          }}
          listeners={({ navigation, route }) => ({
            tabPress: (e) => {
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
          name="NakshatraTab"
          component={NakshatraStack}
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
                  Charts
                </Text>
              </View>
            ),
          }}
          listeners={({ navigation, route }) => ({
            tabPress: (e) => {
              const state = navigation.getState();
              const tabRoute = state.routes.find(r => r.key === route.key);
              const nestedState = tabRoute?.state;
              const currentRoute = nestedState?.routes[nestedState?.index];
              
              // If not on NakshatraScreen, navigate to it
              if (currentRoute?.name !== 'NakshatraScreen') {
                e.preventDefault();
                navigation.navigate('NakshatraTab', {
                  screen: 'NakshatraScreen',
                });
              }
            },
          })}
        />
        <Tab.Screen
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
            tabPress: (e) => {
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
        />
      </Tab.Navigator>
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
    ...font.caption,
    marginTop: 4,
    textAlign: 'center',
    width: responsiveWidth('20%'),
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
