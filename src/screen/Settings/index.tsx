// HomeScreen.tsx

import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Switch,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  responsiveWidth,
  fontFamily,
  responsiveHeight,
} from '../../constant/theme';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainContainer } from '../../components/common/mainContainer';
import { useTheme } from '../../context/ThemeContext';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import { isAstrologerUser } from '../../utils/userRole';

const ASTROLOGER_HIDDEN_GENERAL_LABELS = [
  'Paid Plans',
  'Reports',
  'Resources',
  'Purchase History',
];

export type RootStackParamList = {
  Login: undefined; // Login screen
  Register: undefined; // Register screen
  ForgotPassword: undefined;
  HomeScreen: undefined;
  ContinueWithOtp: undefined;
  ForgotPasswordOtp: undefined;
  PrivacyPolicyScreen: undefined; // Privacy Policy screen
  TermsAndConditions: undefined; // Terms and Conditions screen
  AboutUsScreen: undefined; // About Us screen
  ResourcesScreen: undefined; // Resources screen
  PaidPlanScreen: undefined; // Paid Plan screen
  FaqsScreen: undefined; // Faqs screen
  HelpCenterScreen: undefined; // Help Center screen
  ReportScreen: undefined; // Report screen
  PurchasedHistoryScreen: undefined; // Purchased History screen
  // Add other screens as needed
};

// Define your navigation prop type
type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Login'
>;

const settingsList = [
  {
    section: 'General',
    data: [
      // {
      //   icon: require('../../assets/icons/notification.png'),
      //   label: 'Notification',
      // },
      // { icon: require('../../assets/icons/PaidPlan.png'), label: 'Paid Plans' },
      // {
      //   icon: require('../../assets/icons/Reports-Plans.png'),
      //   label: 'Reports',
      // },
      // {
      //   icon: require('../../assets/icons/Resources.png'),
      //   label: 'Resources',
      // },
      // {
      //   icon: require('../../assets/icons/LanguageIcon.png'),
      //   label: 'Language',
      //   right: 'English (US)',
      // },
      // {
      //   icon: require('../../assets/icons/Purchased-History.png'),
      //   label: 'Purchase History',
      // },
      // {
      //   icon: require('../../assets/icons/Dark-Mode.png'),
      //   label: 'Dark Mode',
      //   isSwitch: true,
      // },
      { icon: require('../../assets/icons/info.png'), label: 'Help Center' },
      // { icon: require('../../assets/icons/star.png'), label: 'Rate us' },
    ],
  },
  {
    section: 'About',
    data: [
      {
        icon: require('../../assets/icons/Faqs.png'),
        label: 'Faqs',
      },
      // {
      //   icon: require('../../assets/icons/document.png'),
      //   label: 'Privacy & Policy',
      // },

      {
        icon: require('../../assets/icons/Terms-of-Services.png'),
        label: 'Terms of Services',
      },
      { icon: require('../../assets/icons/About-us.png'), label: 'About us' },
    ],
  },
];

const SettingsScreen = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { theme, toggleTheme, colors } = useTheme();
  const user = useSelector((state: RootState) => state.app.user);
  const [darkMode, setDarkMode] = useState(theme === 'dark');

  const generalItems = useMemo(() => {
    const items = settingsList[0].data;
    if (isAstrologerUser(user)) {
      return items.filter(
        item => !ASTROLOGER_HIDDEN_GENERAL_LABELS.includes(item.label),
      );
    }
    return items;
  }, [user]);

  // Sync local state with theme context
  React.useEffect(() => {
    setDarkMode(theme === 'dark');
  }, [theme]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['USER_TOKEN', 'USER_DATA']);
    } catch (e) {
      // noop
    } finally {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  };

  const handleThemeToggle = () => {
    toggleTheme();
  };

  const handlePrivacyPolicyPress = () => {
    navigation.navigate('PrivacyPolicyScreen');
  };

  const handleTermsOfServicesPress = () => {
    navigation.navigate('TermsAndConditions');
  };

  const handleAboutUsPress = () => {
    navigation.navigate('AboutUsScreen');
  };

  const handleResourcesPress = (label: string) => {
    // console.log('label', label);
    if (label === 'Resources') {
      navigation.navigate('ResourcesScreen');
    } else if (label === 'Paid Plans') {
      navigation.navigate('PaidPlanScreen');
    }
    else if (label === 'Help Center') {
      navigation.navigate('HelpCenterScreen');
    }
    else if (label === 'Reports') {
       navigation.navigate('ReportScreen');
    }
    else if (label === 'Purchase History') {
      navigation.navigate('PurchasedHistoryScreen');
    }
  };

  const handleFaqsPress = () => {
    navigation.navigate('FaqsScreen');
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent={true}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -84}
      >
        <MainContainer>
          <ScrollView
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
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
                  style={[styles.headerTitle, { color: colors.textPrimary }]}
                >
                  Settings
                </Text>
              </View>
            </View>

            <View style={styles.sectionContainer}>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              >
                General
              </Text>
              {generalItems.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.row}
                  activeOpacity={0.7}
                  onPress={() => handleResourcesPress(item.label)}
                  disabled={item.isSwitch}
                >
                  <View style={[styles.iconWrap]}>
                    <Image
                      source={item.icon}
                      style={[
                        styles.icon,
                        {
                          tintColor:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.DarkNavy,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.label,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.right && (
                    <Text
                      style={[
                        styles.rightText,
                        {
                          color:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.DarkNavy,
                        },
                      ]}
                    >
                      {item.right}
                    </Text>
                  )}
                  {item.isSwitch && (
                    <Switch
                      value={darkMode}
                      onValueChange={handleThemeToggle}
                      trackColor={{ false: '#767577', true: colors.accent }}
                      thumbColor={darkMode ? '#fff' : '#f4f3f4'}
                      style={styles.switch}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View
              style={[
                styles.divider,
                {
                  backgroundColor:
                    theme === 'dark'
                      ? colors.surfaceOpacity
                      : colors.primaryBlue,
                },
              ]}
            />

            <View style={styles.sectionContainer}>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              >
                About
              </Text>
              {settingsList[1].data.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.row}
                  activeOpacity={0.7}
                  onPress={
                    item.label === 'Privacy & Policy'
                      ? handlePrivacyPolicyPress
                      : item.label === 'Terms of Services'
                      ? handleTermsOfServicesPress
                      : item.label === 'About us'
                      ? handleAboutUsPress
                      : item.label === 'Faqs'
                      ? handleFaqsPress
                      : undefined
                  }
                >
                  <View style={[styles.iconWrap]}>
                    <Image
                      source={item.icon}
                      style={[
                        styles.icon,
                        {
                          tintColor:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.DarkNavy,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.label,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View
              style={[
                styles.divider,
                {
                  backgroundColor:
                    theme === 'dark'
                      ? colors.surfaceOpacity
                      : colors.primaryBlue,
                },
              ]}
            />

            {/* <TouchableOpacity style={styles.deactivateBtn} activeOpacity={0.7}>
              <Image
                source={require('../../assets/icons/Deactivate-My-Account.png')}
                style={styles.deactivateIcon}
              />
              <Text style={styles.deactivateText}>Deactivate My Account</Text>
            </TouchableOpacity> */}
            <TouchableOpacity
              style={styles.logoutBtn}
              activeOpacity={0.7}
              onPress={handleLogout}
            >
              <Image
                source={require('../../assets/icons/Log-out.png')}
                style={[styles.logoutIcon, { tintColor: colors.accent }]}
              />
              <Text style={[styles.logoutText, { color: colors.accent }]}>
                Logout
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </MainContainer>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    minHeight: '100%',
    // backgroundColor: 'transparent',
    paddingBottom: Platform.OS === 'android' ? 35 : 32,
  },
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    textAlign: 'center',
    marginTop:
      Platform.OS === 'android'
        ? 0
        : responsiveWidth('12%'),
    // marginBottom: responsiveWidth('5%'),
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  backBtn: {
    marginRight: 8,
    padding: 4,
  },
  backIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
    tintColor: '#F6EFD9',
  },
  headerCenter: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: fontFamily.regular,
    // fontWeight: '600',
    // marginLeft: 8,
  },
  sectionContainer: {
    marginHorizontal: 20,
    // marginBottom: 16,
  },
  sectionTitle: {
    // ...font.body,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fontFamily.regular,
    marginBottom: 12,
    // marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical:
      Platform.OS === 'android' ? responsiveWidth('1') : responsiveWidth('1'),
    borderBottomWidth: Platform.OS === 'android' ? 0.5 : 0,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  icon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  label: {
    // ...font.body,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    flex: 1,
  },
  rightText: {
    // ...font.body,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    marginRight: 8,
  },
  switch: {
    marginLeft: 'auto',
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(238, 238, 238, 1)',
    marginVertical: 16,
    marginHorizontal: 20,
  },
  deactivateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingVertical: 8,
  },
  deactivateIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
    // tintColor: '#DF8A5D',
    marginRight: 10,
  },
  deactivateText: {
    color: '#DF8A5D',
    // ...font.body,
    fontSize: 14,
    fontFamily: fontFamily.regular,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: Platform.OS === 'android' ? 40 : 32,
    paddingVertical: 8,
  },
  logoutIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
    tintColor: '#DF8A5D',
    marginLeft: 7,
    marginRight: 20,
  },
  logoutText: {
    // ...font.body,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    // fontFamily:
    //  fontFamily.regular,
  },
});

export default SettingsScreen;
