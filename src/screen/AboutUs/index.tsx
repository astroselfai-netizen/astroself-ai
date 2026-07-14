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

  const features = [
    'Vedic Astrology',
    'Planetary Patterns',
    'Repetition Logic',
    'Birth Chart Signatures',
    'Transits',
    'Nakshatras',
    'Padas',
    'Real-Life Updates',
  ];

  const experiencePoints = [
    "you're taking small steps toward alignment",
    "you're reconnecting with your strengths",
    "something inside you feels understood",
    "you're being guided, not judged",
    "you're gaining clarity, not fear",
    "you're discovering your own patterns",
  ];

  const missionStatements = [
    'To help people understand themselves— softly, honestly, and consistently.',
    'To offer guidance that grows with them.',
    'To become a quiet presence that encourages reflection',
    'To bring ancient wisdom and modern intelligence together in the service of inner clarity.',
  ];

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

      <MainContainer safeBottom>
        {/* Header */}
        <View style={styles.headerWrap}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Image
              source={require('../../assets/icons/back.png')}
              style={[
                styles.backIcon,
                {
                  tintColor:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            />
          </TouchableOpacity>
          <View style={styles.backIconWrap}>
            <Text
              style={[
                styles.topBarText,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              About Astrodha.Ai
            </Text>
          </View>
        </View>

        {/* Main Content */}
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Why we built this app Section */}
          <View style={styles.whyWeBuiltSection}>
            <View style={styles.whyWeBuiltBannerImageContainer}>
            <Image
              source={require('../../assets/icons/About-us-img.png')}
              style={styles.whyWeBuiltBanner}
              // imageStyle={styles.whyWeBuiltBannerImage}
              resizeMode="cover"
            >
              {/* <View style={styles.whyWeBuiltBannerOverlay}>
                <View style={styles.whyWeBuiltBannerSpacer} />
                <View style={styles.whyWeBuiltTextContainer}>
                  <Text style={styles.whyWeBuiltTitleOnImage}>
                    Why we built this app
                  </Text>
                  <Text style={styles.whyWeBuiltSubtitleOnImage}>
                    Most of us move through life with questions no one teaches us
                    to ask
                  </Text>
                </View>
              </View> */}
            </Image>
            </View>

            <View style={styles.whyWeBuiltQuestionsBlock}>
              <View style={styles.questionsList}>
                <Text
                  style={[
                    styles.questionItem,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  Why do I react this way?
                </Text>
                <Text
                  style={[
                    styles.questionItem,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  Where is my energy flowing right now?
                </Text>
                <Text
                  style={[
                    styles.questionItem,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  What am I naturally good at?
                </Text>
                <Text
                  style={[
                    styles.questionItem,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  What is shifting in me that I cannot see?
                </Text>
                <Text
                  style={[
                    styles.questionItem,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  Why do certain patterns repeat?
                </Text>
              </View>
            </View>
          </View>

          {/* Traditional astrology card */}
          <View
            style={[
              styles.whiteCard,
              {
                backgroundColor: colors.white,
              },
            ]}
          >
            <Text
              style={[
                styles.cardText,
                {
                  color: colors.DarkNavy,
                },
              ]}
            >
              Traditional astrology offers answers
            </Text>
            <Text
              style={[
                styles.cardTextAccent,
                {
                  color: colors.Orangeaccentcolor,
                },
              ]}
            >
              AI offers clarity, speed, and structure.
            </Text>
          </View>

          {/* App Purpose Statement */}
          <View style={styles.purposeStatement}>
            <Text
              style={[
                styles.purposeText,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              We created this app to bring both worlds together—
            </Text>
            <Text
              style={[
                styles.purposeText,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              not to predict your future,
            </Text>
            <Text
              style={[
                styles.purposeText,
                {
                  color: colors.Orangeaccentcolor,
                },
              ]}
            >
              but to help you understand your inner world.
            </Text>
          </View>

          {/* Astrology is not about fate card */}
          <View
            style={[
              styles.whiteCard,
              {
                backgroundColor: colors.white,
              },
            ]}
          >
            <Text
              style={[
                styles.cardTitle,
                {
                  color: colors.DarkNavy,
                },
              ]}
            >
              Astrology is not about fate. It is about awareness.
            </Text>
            <Text
              style={[
                styles.cardBodyText,
                {
                  color: colors.DarkNavy,
                },
              ]}
            >
              It teaches us where our strengths lie, where we get stuck, and
              what part of us is calling for attention. AI helps decode these
              patterns quickly and clearly, so you can see yourself from a wider
              lens—without complexity or confusion.
            </Text>
            <View style={styles.quoteContainer}>
              <View
                style={[
                  styles.quoteLine,
                  {
                    backgroundColor: colors.Orangeaccentcolor,
                  },
                ]}
              />
              <Text
                style={[
                  styles.quoteText,
                  {
                    color: colors.DarkNavy,
                  },
                ]}
              >
                "This app exists to hold up a mirror, gently revealing what you
                might overlook in the rush of daily life"
              </Text>
            </View>
          </View>

          {/* Interactive Mode Buttons */}
          <View style={styles.modeButtonsContainer}>
            {['Gentle', 'Modern', 'Guided', 'Ancient'].map(mode => (
              <View
                key={mode}
                style={[
                  styles.modeButton,
                  {
                    backgroundColor:
                      theme === 'dark' ? colors.DarkNavy : colors.white,
                    borderColor:
                      theme === 'dark'
                        ? colors.themeBorderDropdown
                        : colors.borderColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  {mode}
                </Text>
              </View>
            ))}
          </View>

          {/* What Makes Us Different Section */}
          <View style={styles.differentSection}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              What Makes Us Different
            </Text>
            <Text
              style={[
                styles.sectionSubtitle,
                {
                  color:
                    theme === 'dark'
                      ? colors.textSecondary || '#999'
                      : colors.textSecondary || '#666',
                },
              ]}
            >
              We are not here to entertain. We are here to support your
              awareness journey.
            </Text>

            {/* Features Grid */}
            <View style={styles.featuresGrid}>
              {features.map((feature, index) => (
                <View
                  key={index}
                  style={[
                    styles.featureCard,
                    {
                      backgroundColor: colors.white,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.featureText,
                      {
                        color: colors.DarkNavy,
                      },
                    ]}
                  >
                    {feature}
                  </Text>
                </View>
              ))}
            </View>

            <Text
              style={[
                styles.featuresFooter,
                {
                  color:
                    theme === 'dark'
                      ? colors.textSecondary || '#999'
                      : colors.textSecondary || '#666',
                },
              ]}
            >
              To Create Reflections That Feel Personal, Grounded, And
              Evolving—As You Evolve.
            </Text>
          </View>

          {/* The Experience We Want You to Have Section */}
          <View style={styles.experienceSection}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              The Experience We Want You to Have
            </Text>
            <View style={styles.experienceList}>
              {experiencePoints.map((point, index) => (
                <Text
                  key={index}
                  style={[
                    styles.experiencePoint,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  {point}
                </Text>
              ))}
            </View>
          </View>

          {/* Our Mission Section */}
          <View style={styles.missionSection}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              Our Mission
            </Text>
            <View
              style={[
                styles.whiteCard,
                {
                  backgroundColor: colors.white,
                },
              ]}
            >
              {missionStatements.map((statement, index) => (
                <View key={index} style={styles.missionStatementContainer}>
                  <View
                    style={[
                      styles.missionQuoteLine,
                      {
                        backgroundColor: colors.Orangeaccentcolor,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.missionStatement,
                      {
                        color: colors.DarkNavy,
                      },
                    ]}
                  >
                    {statement}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* App Purpose Footer */}
          <View style={styles.footerSection}>
            <Text
              style={[
                styles.footerText,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              If this app makes you feel even{' '}
              <Text
                style={[
                  styles.footerAccent,
                  {
                    color: colors.Orangeaccentcolor,
                  },
                ]}
              >
                5% more understood,
              </Text>
            </Text>
            <Text
              style={[
                styles.footerText,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              <Text
                style={[
                  styles.footerAccent,
                  {
                    color: colors.Orangeaccentcolor,
                  },
                ]}
              >
                5% more grounded,
              </Text>
            </Text>
            <Text
              style={[
                styles.footerText,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              <Text
                style={[
                  styles.footerAccent,
                  {
                    color: colors.Orangeaccentcolor,
                  },
                ]}
              >
                5% more aware of your patterns
              </Text>
            </Text>
            <Text
              style={[
                styles.footerText,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              then it has fulfilled its purpose
            </Text>
          </View>
        </ScrollView>
      </MainContainer>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'android' ? 70 : 70,
    paddingHorizontal: responsiveWidth(4),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop:
      Platform.OS === 'android'
        ? responsiveHeight('0.5%')
        : responsiveWidth('12%'),
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
    paddingHorizontal: responsiveWidth(5),
    marginBottom: responsiveWidth(2),
    position: 'relative',
    minHeight: 50,
  },
  backIconWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarText: {
    fontSize: 24,
    fontFamily: fontFamily.regular,
    // fontWeight: '600',
    color: '#F6EFD9',
  },
  backBtn: {
    padding: responsiveWidth(2),
    marginRight: responsiveWidth(4),
    zIndex: 10,
  },
  backIcon: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    resizeMode: 'contain',
    tintColor: '#FFFFFF',
  },
  headerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 20,
    // marginBottom: 20,
    position: 'relative',
  },
  headerCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    pointerEvents: 'none',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fontFamily.semiBold,
    textAlign: 'center',
  },
  // Why we built this app Section
  whyWeBuiltSection: {
    marginTop: responsiveWidth(4),
    marginBottom: responsiveWidth(4),
    width: '100%',
  },
  whyWeBuiltBannerImageContainer: {
      width: "auto",
    height: responsiveWidth(35),
    alignItems: 'center',
    justifyContent: 'center',
  },
  whyWeBuiltBanner: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    // overflow: "",
    // minHeight: responsiveWidth(46),
    resizeMode: "contain",
  },
  whyWeBuiltBannerImage: {
    borderRadius: 12,
  },
  whyWeBuiltBannerOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: responsiveWidth(46),
    width: '100%',
    paddingVertical: responsiveWidth(3),
    paddingLeft: responsiveWidth(2),
    paddingRight: responsiveWidth(3),
  },
  whyWeBuiltBannerSpacer: {
    flex: 0.4,
    minWidth: 0,
  },
  whyWeBuiltTextContainer: {
    flex: 0.6,
    minWidth: 0,
    justifyContent: 'center',
  },
  whyWeBuiltTitleOnImage: {
    fontSize: 18,
    fontFamily: fontFamily.semiBold,
    marginBottom: responsiveWidth(1.5),
    lineHeight: 24,
    textAlign: 'left',
    width: '100%',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  whyWeBuiltSubtitleOnImage: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 21,
    textAlign: 'left',
    width: '100%',
    color: 'rgba(255, 255, 255, 0.92)',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  whyWeBuiltQuestionsBlock: {
    width: '100%',
    marginTop: responsiveWidth(4),
    alignItems: 'center',
  },
  questionsList: {
    gap: responsiveWidth(2),
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  questionItem: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 24,
    textAlign: 'center',
    fontWeight: '500',
    alignSelf: 'stretch',
  },
  // White Card Styles
  whiteCard: {
    borderRadius: 12,
    padding: responsiveWidth(4),
    marginBottom: responsiveWidth(4),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  cardText: {
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
    marginBottom: responsiveWidth(1),
    textAlign: 'center',
  },
  cardTextAccent: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: fontFamily.semiBold,
    marginBottom: responsiveWidth(2),
    textAlign: 'center',
  },
  cardBodyText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 22,
    marginBottom: responsiveWidth(3),
    textAlign: 'center',
  },
  quoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: responsiveWidth(2),
    width: '100%',
    justifyContent: 'center',
  },
  quoteLine: {
    width: 4,
    height: '100%',
    marginRight: responsiveWidth(2),
    borderRadius: 2,
  },
  quoteText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontStyle: 'italic',
    lineHeight: 20,
    textAlign: 'center',
  },
  // Purpose Statement
  purposeStatement: {
    marginBottom: responsiveWidth(4),
    gap: responsiveWidth(1),
    alignItems: 'center',
  },
  purposeText: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    lineHeight: 24,
    textAlign: 'center',
  },
  // Mode Buttons
  modeButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: responsiveWidth(2),
    marginBottom: responsiveWidth(5),
  },
  modeButton: {
    flex: 1,
    paddingVertical: responsiveWidth(3),
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
  },
  // What Makes Us Different Section
  differentSection: {
    marginBottom: responsiveWidth(5),
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: fontFamily.semiBold,
    marginBottom: responsiveWidth(2),
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
    marginBottom: responsiveWidth(4),
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: responsiveWidth(2),
    marginBottom: responsiveWidth(4),
  },
  featureCard: {
    width: '48%',
    padding: responsiveWidth(3),
    borderRadius: 8,
    marginBottom: responsiveWidth(2),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: responsiveWidth(12),
  },
  featureText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  featuresFooter: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Experience Section
  experienceSection: {
    marginBottom: responsiveWidth(5),
    alignItems: 'center',
  },
  experienceList: {
    gap: responsiveWidth(2),
    marginTop: responsiveWidth(2),
    alignItems: 'center',
    width: '100%',
  },
  experiencePoint: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 22,
    textAlign: 'center',
  },
  // Mission Section
  missionSection: {
    marginBottom: responsiveWidth(5),
    alignItems: 'center',
  },
  missionStatementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveWidth(3),
    width: '100%',
    justifyContent: 'center',
  },
  missionQuoteLine: {
    width: 4,
    height: '100%',
    marginRight: responsiveWidth(2),
    borderRadius: 2,
    minHeight: 20,
  },
  missionStatement: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
    textAlign: 'center',
  },
  // Footer Section
  footerSection: {
    marginBottom: responsiveWidth(5),
    gap: responsiveWidth(1),
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    lineHeight: 24,
    textAlign: 'center',
  },
  footerAccent: {
    fontFamily: fontFamily.semiBold,
  },
});

export default AboutUsScreen;
