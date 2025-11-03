// PrivacyPolicyScreen.tsx

import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  ScrollView,
  StatusBar,
  Image,
} from 'react-native';
import {
  fontFamily,
  responsiveWidth,
  responsiveHeight,
} from '../../constant/theme';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainContainer } from '../../components/common/mainContainer';
import { useTheme } from '../../context/ThemeContext';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  HomeScreen: undefined;
  ContinueWithOtp: undefined;
  ForgotPasswordOtp: undefined;
};

type PrivacyPolicyScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Login'
>;

const PrivacyPolicyScreen = () => {
  const { theme, colors } = useTheme();
  const navigation = useNavigation<PrivacyPolicyScreenNavigationProp>();

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
          <Text style={[styles.headerTitle, { color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy }]}>
            Privacy Policy
          </Text>
        </View>
      </View>

      {/* Main Content Card */}
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
          {/* Privacy Policy Section */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,

                {
                  color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                  marginTop: responsiveWidth('2%'),
                },
              ]}
            >
              Privacy Policy
            </Text>
            <Text
              style={[
                styles.sectionText,
                {
                  color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              At Astro Self AI, we respect your privacy. We collect basic
              personal information such as your name, birth date, time, and
              place of birth to generate personalized astrological reports. This
              data is used solely for the purpose of providing our services and
              is never shared, sold, or misused. We may use cookies for website
              functionality and analytics to improve your experience. Your
              information is stored securely and retained only as long as
              necessary. By using our website, you agree to our privacy
              practices.
            </Text>
          </View>

          {/* Refund Policy Section */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              Refund Policy
            </Text>
            <Text
              style={[
                styles.sectionText,
                {
                  color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              Astroself AI offers a free tier with limited features and a paid
              subscription for full access. All payments are non-refundable, and
              subscriptions cannot be canceled once activated, except as
              required by law. Users are responsible for reviewing their
              selected plans before making a purchase.
            </Text>
          </View>

          {/* User Responsibility Section */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              User Responsibility
            </Text>
            <Text
              style={[
                styles.sectionText,
                {
                  color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              You are r esponsible for ensuring that the information you provide
              to the app is accurate. The app's results are based on the data
              you input, and inaccuracies may lead to incorrect interpretations.
              Users are advised to approach insights with an open but thoughtful
              mindset, focusing on personal reflection and self-awareness.
            </Text>
          </View>

          {/* Prohibited Use Section */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              Prohibited Use
            </Text>
            <Text
              style={[
                styles.sectionText,
                {
                  color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              You agree not to use the app for any unlawful or unauthorized
              purposes. You also agree not to tamper with the app's
              functionality or compromise its security.
            </Text>
          </View>
        </View>
      </ScrollView>
    </MainContainer>
    // </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    minHeight: '100%',
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
    // position: 'absolute',
    left: responsiveWidth('2'),
    // padding: 8,
    // top: Platform.OS === 'android' ? responsiveWidth('11.5%') : responsiveWidth('1.5%'),
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
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  contentCard: {
    borderRadius: 8,
    marginHorizontal: responsiveWidth('4'),
    marginTop: responsiveWidth('2%'),
    borderWidth: 0.2,
    borderColor: '#EEE5CA',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: responsiveWidth('5%'),
    paddingVertical: Platform.OS === 'android' ? 10 : responsiveWidth('1'),
    paddingHorizontal: 20,
    // boxShadow: '3px 3px 3px 0px rgba(0, 0, 0, 0.35)',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fontFamily.regular,
    marginBottom: 12,
    lineHeight: 24,
  },
  sectionText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
    textAlign: 'left',
  },
});

export default PrivacyPolicyScreen;
