// PrivacyPolicyScreen.tsx

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Platform,
  ScrollView,
} from 'react-native';
import { fontFamily, responsiveWidth } from '../../constant/theme';
import { MainContainer } from '../../components/common/mainContainer';
import AstrologerScreenHeader from '../../components/AstrologerScreenHeader';
import { useTheme } from '../../context/ThemeContext';

const astrologerMainContainerStyle = {
  backgroundColor: 'transparent',
};

const astrologerContainerStyle = {
  backgroundColor: 'transparent',
  marginBottom: 0,
  borderBottomLeftRadius: 0,
  borderBottomRightRadius: 0,
  overflow: 'visible' as const,
};

const PrivacyPolicyScreen = () => {
  const { theme, colors } = useTheme();

  return (
    <View style={styles.flex}>
      <AstrologerScreenHeader title="Privacy Policy" showBack />
      <MainContainer
        safeBottom
        containerStyle={astrologerMainContainerStyle}
        subContainerStyle={astrologerContainerStyle}
      >
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
              Astrodha AI offers a free tier with limited features and a paid
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
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    minHeight: '100%',
    paddingTop: responsiveWidth('4'),
    paddingBottom: Platform.OS === 'android' ? 60 : 60,
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
