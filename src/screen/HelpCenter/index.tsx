// HelpCenterScreen.tsx

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
  HelpCenterScreen: undefined;
};

type HelpCenterScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'HelpCenterScreen'
>;

const HelpCenterScreen = () => {
  const { theme, colors } = useTheme();
  const navigation = useNavigation<HelpCenterScreenNavigationProp>();

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
            Contact Us{' '}
          </Text>
        </View>
      </View>

      {/* Main Content Card */}
      <View
        style={styles.scrollViewContent}
      >
        <View style={styles.imageContainer}>
          <Image
            source={require('../../assets/image/contact-us-img.png')}
            resizeMode="contain"
            style={[
              styles.imagePaidPlan,
              {
                boxShadow: '1px 3px 3px 0px rgba(0, 0, 0, 0.35)',
              },
            ]}
          />
        </View>

        <View style={styles.reachOutContainer}>
          <Text
            style={[
              styles.reachOutText,
              {
                color:
                  theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
              },
            ]}
          >
            Reach out to us with your questions or feedback
          </Text>
        </View>

        {/* Response Time Section */}
        <View
          style={[
            styles.responseTimeCard,
            {
              backgroundColor:
                theme === 'dark'
                  ? colors.cardBackground
                  : colors.surfaceOpacity,
              borderColor:
                theme === 'dark' ? colors.themeTextWhite : colors.borderColor,
            },
          ]}
        >
          <Text
            style={[
              styles.responseTimeTitle,
              {
                color:
                  theme === 'dark' ? colors.Orangeaccentcolor : colors.DarkNavy,
              },
            ]}
          >
            Response Time
          </Text>
          <Text
            style={[
              styles.responseTimeText,
              {
                color:
                  theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
              },
            ]}
          >
            Our support team will respond within 24 hours
          </Text>
          <View
            style={[
              styles.responseTimeDivider,
              {
                backgroundColor:
                  theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
              },
            ]}
          />
          <Text
            style={[
              styles.responseTimeThankYou,
              {
                color:
                  theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
              },
            ]}
          >
            Thank you for connecting with Astroself.ai
          </Text>
        </View>

        <View
          style={[
            styles.contentCard,
            {
              backgroundColor:
                theme === 'dark'
                  ? colors.cardBackground
                  : colors.surfaceOpacity,
              borderColor:
                theme === 'dark' ? colors.themeTextWhite : colors.borderColor,
            },
          ]}
        >
          {/* Privacy Policy Section */}
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
              Email Support
            </Text>
            <Text
              style={[
                styles.sectionText,

                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                  marginTop: responsiveWidth('2%'),
                },
              ]}
            >
              support@astroself.ai
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.contentCard,
            {
              backgroundColor:
                theme === 'dark'
                  ? colors.cardBackground
                  : colors.surfaceOpacity,
              borderColor:
                theme === 'dark' ? colors.themeTextWhite : colors.borderColor,
            },
          ]}
        >
          {/* Privacy Policy Section */}
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
              Visit Website
            </Text>
            <Text
              style={[
                styles.sectionText,

                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                  marginTop: responsiveWidth('2%'),
                },
              ]}
            >
              www.astroself.ai
            </Text>
          </View>
        </View>
      </View>
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
  imageContainer: {
    // width: '90%',
    // padding: responsiveWidth('1'),
    height: 180,
    // boxShadow: '1px 3px 3px 0px rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: responsiveWidth('2%'),
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 3,
    // borderRadius: 16,

    // marginBottom: responsiveWidth(2),
    // marginHorizontal: responsiveWidth(4),
    // backgroundColor: colors.transparent,
  },
  imagePaidPlan: {
    width: '92%',
    borderRadius: 8,
    
    // boxShadow: '1px 1px 1px 0px rgba(0, 0, 0, 0.35)',
    height: '100%',
    resizeMode: 'cover',
  },
  reachOutContainer: {
    marginHorizontal: responsiveWidth('4'),
    marginTop: responsiveWidth('4%'),
    marginBottom: responsiveWidth('2%'),
  },
  reachOutText: {
    fontSize: 18,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
    lineHeight: 26,
    textAlign: 'center',
  },

  contentCard: {
    borderRadius: 16,
    marginHorizontal: responsiveWidth('4'),
    marginTop: responsiveWidth('2%'),
    borderWidth: 0.2,
    // borderColor: '#EEE5CA',
    // justifyContent: 'center',
    // alignItems: 'center',
    overflow: 'hidden',
    marginBottom: responsiveWidth('5%'),
    paddingBottom: 12,
    paddingVertical: Platform.OS === 'android' ? 5 : responsiveWidth('1'),
    paddingHorizontal: 16,
    // paddingVertical: 1,
    // boxShadow: '3px 3px 3px 0px rgba(0, 0, 0, 0.35)',
  },
  section: {
    // marginBottom: 12,
    // overflow: 'hidden',
    // padding:1
    // marginTop: responsiveWidth('2%'),
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    marginBottom: 14,
    lineHeight: 24,
  },
  sectionText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
    textAlign: 'left',
  },
  responseTimeCard: {
    // backgroundColor: '#1E3A8A', // Dark blue background
    borderRadius: 16,
    borderWidth: 0.2,
    marginHorizontal: responsiveWidth('4'),
    marginTop: responsiveWidth('3%'),
    marginBottom: responsiveWidth('2%'),
    padding: responsiveWidth('3%'),
    alignItems: 'center',
  },
  responseTimeTitle: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '700',
    // color: '#FF8C42', // Orange color
    // marginBottom: responsiveWidth('1%'),
    textAlign: 'center',
  },
  responseTimeText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: responsiveWidth('2%'),
  },
  responseTimeDivider: {
    width: '95%',
    height: 0.5,
   
    marginBottom: responsiveWidth('2%'),
  },
  responseTimeThankYou: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default HelpCenterScreen;
