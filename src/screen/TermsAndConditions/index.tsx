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

type TermsAndConditionsNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Login'
>;

const TermsAndConditions = () => {
  const { theme, colors } = useTheme();
  const navigation = useNavigation<TermsAndConditionsNavigationProp>();

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
                  theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
              },
            ]}
          >
            Terms and Conditions
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
          {/* Acceptance of Terms Section */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                  marginTop: responsiveWidth('2%'),
                },
              ]}
            >
              Acceptance of Terms
            </Text>
            <Text
              style={[
                styles.sectionText,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              By accessing or using the Astrodha AI app, you agree to be bound
              by these Terms and Conditions. If you do not agree, you may not
              use the app.
            </Text>
          </View>

          {/* Disclaimer of Liability Section */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              Disclaimer of Liability
            </Text>
            <Text
              style={[
                styles.sectionText,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              Astrodha AI provides insights based on astrological calculations
              and interpretations to assist users in their journey of
              self-awareness and personal growth. While the app aims to provide
              meaningful guidance, it does not guarantee the accuracy,
              completeness, or reliability of the information provided. Users
              are encouraged to combine these insights with their judgment. The
              developers and operators of Astrodha AI are not liable for any
              damages arising from the use or misuse of the app.
            </Text>
          </View>

          {/* Intellectual Property Section */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              Intellectual Property
            </Text>
            <Text
              style={[
                styles.sectionText,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              You agree not to use the app for any unlawful or unauthorized
              purposes. You also agree not to tamper with the app's
              functionality or compromise its security.
            </Text>
          </View>

          {/* Modification of Terms Section */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              Modification of Terms
            </Text>
            <Text
              style={[
                styles.sectionText,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              Astrodha AI reserves the right to modify these Terms and
              Conditions at any time. Users will be notified of significant
              changes, and continued use of the app constitutes acceptance of
              the updated terms.
            </Text>
          </View>

          {/* Governing Law Section */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              Governing Law
            </Text>
            <Text
              style={[
                styles.sectionText,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              These Terms and Conditions are governed by and shall be
              interpreted in accordance with the laws of India. By using this
              app, you agree to comply with all applicable laws and regulations
              of India.
            </Text>
          </View>

          {/* Limitation of Remedies Section */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              Limitation of Remedies
            </Text>
            <Text
              style={[
                styles.sectionText,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              In the event of any dispute or claim arising from the use of
              Astrodha AI, the maximum remedy available to the user will be
              limited to the amount paid for the subscription in the previous
              month.
            </Text>
          </View>

          {/* Focus on Self-Awareness Section */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              Focus on Self-Awareness
            </Text>
            <Text
              style={[
                styles.sectionText,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              Astrodha AI is designed as a tool for fostering self-awareness
              and personal growth. The app encourages users to explore their
              strengths, challenges, and potential through astrological
              insights, promoting introspection and a deeper connection with
              themselves and the universe. Users are reminded that the app's
              purpose is to assist in their journey of self-discovery and is not
              a substitute for professional advice in financial, medical, legal,
              or other critical matters.
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
    paddingBottom: Platform.OS === 'android' ? 70 : 70,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop:
      Platform.OS === 'android'
        ? responsiveHeight('0.5%')
        : responsiveWidth('12%'),
    // paddingHorizontal: responsiveWidth('2'),
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
    position: 'relative',
    minHeight: 50,
  },
  backBtn: {
    // position: 'absolute',
      left: responsiveWidth('5'),
      // padding: 8,
      // top:
      //   Platform.OS === 'android'
      //     ? responsiveWidth('11.5%')
      //     : responsiveWidth('2%'),
    // zIndex: 1,
  },
  backIcon: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    resizeMode: 'contain',
    tintColor: '#FFFFFF',
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

export default TermsAndConditions;
