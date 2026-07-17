// PrivacyPolicyScreen.tsx

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  ScrollView,
  StatusBar,
  Image,
  useWindowDimensions,
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
import RenderHTML from 'react-native-render-html';
import http from '../../utils/http';

type TermsSection = {
  heading: string;
  content: string;
};

type TermsApiResponse = {
  status: boolean;
  data?: {
    title?: string;
    terms?: TermsSection[];
  };
};

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
  const { width } = useWindowDimensions();

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('Terms and Conditions');
  const [terms, setTerms] = useState<TermsSection[]>([]);

  const fetchTerms = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await http.get<TermsApiResponse>('/terms');
      const apiTitle = res.data?.data?.title;
      const apiTerms = res.data?.data?.terms ?? [];

      setTitle(
        typeof apiTitle === 'string' && apiTitle.trim().length > 0
          ? apiTitle.trim()
          : 'Terms and Conditions',
      );
      setTerms(Array.isArray(apiTerms) ? apiTerms : []);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        'Unable to load Terms & Conditions.';
      setErrorMessage(String(msg));
      setTerms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTerms();
  }, [fetchTerms]);

  const htmlBaseStyle = useMemo(
    () => ({
      color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
      fontSize: 14,
      fontFamily: fontFamily.regular,
      lineHeight: 20,
    }),
    [colors.DarkNavy, colors.themeTextWhite, theme],
  );

  const htmlTagsStyles = useMemo(
    () => ({
      p: { marginTop: 0, marginBottom: 2 },
      ul: { marginTop: 0, marginBottom: 2, paddingLeft: 18 },
      ol: { marginTop: 0, marginBottom: 2, paddingLeft: 18 },
      li: { marginBottom: 1 },
      a: { color: colors.primary ?? colors.yellow },
      span: { color: htmlBaseStyle.color },
    }),
    [colors.primary, colors.yellow, htmlBaseStyle.color],
  );

  return (
    // <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
    <MainContainer safeBottom>
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
            {title}
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
          {loading ? (
            <View style={styles.stateWrap}>
              <ActivityIndicator
                size="small"
                color={theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy}
              />
              <Text
                style={[
                  styles.stateText,
                  {
                    color:
                      theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                  },
                ]}
              >
                Loading…
              </Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.stateWrap}>
              <Text
                style={[
                  styles.stateText,
                  styles.stateTextError,
                  {
                    color:
                      theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                  },
                ]}
              >
                {errorMessage}
              </Text>
              <TouchableOpacity onPress={fetchTerms} activeOpacity={0.8}>
                <Text style={[styles.retryText, { color: colors.yellow }]}>
                  Tap to retry
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text
                style={[
                  styles.introText,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              >
                Welcome to{' '}
                <Text style={styles.introBold}>Astrodha Ai</Text>.{'\n'}
                By accessing or using our platform (the{' '}
                <Text style={styles.introBold}>App</Text> or{' '}
                <Text style={styles.introBold}>Website</Text>), you agree to be
                bound by the following Terms and Conditions. Please read them
                carefully.
              </Text>

              {terms.map((section, idx) => (
                <View key={`${section.heading}-${idx}`} style={styles.section}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      idx === 0 ? styles.sectionTitleFirst : null,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    {section.heading}
                  </Text>
                  <RenderHTML
                    contentWidth={Math.max(0, width - responsiveWidth('8') - 40)}
                    source={{ html: section.content ?? '' }}
                    baseStyle={htmlBaseStyle}
                    tagsStyles={htmlTagsStyles as any}
                    defaultTextProps={{ selectable: false }}
                  />
                </View>
              ))}
            </>
          )}
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
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    overflow: 'hidden',
    marginBottom: responsiveWidth('5%'),
    paddingVertical: Platform.OS === 'android' ? 10 : responsiveWidth('1'),
    paddingHorizontal: 20,
  },
  introText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 22,
    marginTop: responsiveWidth('1%'),
    marginBottom: 14,
    textAlign: 'left',
  },
  introBold: {
    fontFamily: fontFamily.bold,
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
  sectionTitleFirst: {
    marginTop: 0,
  },
  sectionText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
    textAlign: 'left',
  },
  stateWrap: {
    width: '100%',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    lineHeight: 20,
  },
  stateTextError: {
    marginBottom: 10,
  },
  retryText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
});

export default TermsAndConditions;
