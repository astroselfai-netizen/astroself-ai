// AboutUsScreen.tsx

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
  ImageBackground,
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

type AboutUsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Login'
>;

const AboutUsScreen = () => {
  const { theme, colors } = useTheme();
  const navigation = useNavigation<AboutUsScreenNavigationProp>();

  return (
    <ImageBackground
      source={
        theme === 'dark'
          ? require('../../assets/image/DarkBackground.png')
          : require('../../assets/image/LightBackground.png')
      }
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent={true}
      />

      <MainContainer>
        {/* Header */}
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
              About Astroself.Ai
            </Text>
          </View>
        </View>

        {/* Main Content Card */}
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Banner with Logo and Title */}

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
            {/* <View style={styles.topBanner}> */}

            <Image
              source={require('../../assets/icons/About-us-img.png')}
              style={styles.zodiacWheel}
            />

            {/* </View> */}

            {/* Main Content - No Card, Direct on Background */}
            <View style={styles.mainContent}>
              {/* Introduction Paragraphs */}
              <View style={styles.introSection}>
                <Text
                  style={[styles.introText, { color: colors.themeTextWhite }]}
                >
                  At Astroself, we believe that the universe holds the key to
                  self discovery and growth. Astrology is not just about
                  predicting the future it is about understanding yourself, your
                  challenges, and your opportunities through the wisdom of the
                  stars.
                </Text>

                <Text
                  style={[styles.introText, { color: colors.themeTextWhite }]}
                >
                  Founded with the vision of blending ancient astrological
                  knowledge with modern technology, Astroself is designed to
                  make accurate guidance simple, accessible, and personalized
                  for everyone. Whether you seek clarity in relationships,
                  career, health, or personal growth, our platform provides
                  insights that help you make confident decisions and live in
                  harmony with cosmic rhythms.
                </Text>

                <Text
                  style={[styles.introText, { color: colors.themeTextWhite }]}
                >
                  Our team of expert astrologers, supported by advanced digital
                  tools, ensures that every prediction and reading is
                  meaningful, reliable, and easy to understand. We are committed
                  to guiding you on a journey of self awareness, helping you
                  unlock your true potential and align with the universe's flow.
                </Text>

                <Text
                  style={[styles.introText, { color: colors.themeTextWhite }]}
                >
                  At Astroself, we don't just predict we empower.
                </Text>
              </View>

              {/* Vision Section */}
              <View style={styles.visionSection}>
                <View style={styles.visionContent}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: colors.themeTextWhite },
                    ]}
                  >
                    Vision
                  </Text>
                  <Text
                    style={[
                      styles.sectionText,
                      { color: colors.themeTextWhite },
                    ]}
                  >
                    To be the most trusted global platform that empowers
                    individuals to connect with the wisdom of the cosmos,
                    unlocking clarity, confidence, & harmony in their personal &
                    spiritual journey.
                  </Text>

                  <View style={styles.visionImageContainer}>
                    <Image
                      source={require('../../assets/image/Vision.png')}
                      style={styles.visionImage}
                    />
                  </View>
                </View>
              </View>

              {/* Mission Section */}
              <View style={styles.missionSection}>
                <View style={styles.missionContent}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: colors.themeTextWhite },
                    ]}
                  >
                    Mission
                  </Text>
                  <Text
                    style={[
                      styles.sectionText,
                      { color: colors.themeTextWhite },
                    ]}
                  >
                    Astroself blends ancient astrology with modern technology to
                    deliver simple, accurate guidance that helps people realize
                    their potential & live in harmony.
                  </Text>
                  <View style={styles.missionImageContainer}>
                    <Image
                      source={require('../../assets/image/Mission.png')}
                      style={styles.missionImage}
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </MainContainer>
    </ImageBackground>
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
    // paddingVertical: Platform.OS === 'android' ? 10 : responsiveWidth('1'),
    // paddingHorizontal: 20,
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 3,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fontFamily.regular,
    marginBottom: 10,
    lineHeight: 24,
  },
  sectionText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
    textAlign: 'left',
  },
  // New About Us Styles
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  // Top Banner Styles
  topBanner: {
   
   
  },

  zodiacWheel: {
    width:"100%",
    height: responsiveHeight(18),
    // borderRadius: 50,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    resizeMode: "cover",
    // boxShadow: '3px 3px 3px 0px rgba(0, 0, 0, 0.35)',
  },
  titleContainer: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 28,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
    textAlign: 'left',
  },
  // Main Content Styles
  mainContent: {
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveWidth(3),
  },
  introSection: {
    // marginBottom: 10,
  },
  introText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 24,
    marginBottom: 10,
    textAlign: 'left',
  },
  // Vision Section Styles
  visionSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  visionContent: {
    flex: 1,
    marginRight: 15,
  },
  visionImageContainer: {
    width: "105%",
    height: 120,
    marginTop: 10,
    // marginRight: 15,
    borderRadius: 8,
    boxShadow: '3px 3px 3px 0px rgba(0, 0, 0, 0.35)',
  },
  visionImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    resizeMode: 'cover',
  },
  // Mission Section Styles
  missionSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    // marginBottom: 20,
  },
  missionImageContainer: {
    width: "100%",
    height: 120,
    marginTop: 5,
    marginRight: 15,
    borderRadius: 8,
    boxShadow: '3px 3px 3px 0px rgba(0, 0, 0, 0.35)',
    // marginTop: 40,
  },
  missionImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    resizeMode: 'cover',

  },
  missionContent: {
    flex: 1,
  },
});

export default AboutUsScreen;
