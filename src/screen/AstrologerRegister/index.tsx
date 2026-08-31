import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { AuthContainer } from '../../components/common/AuthContainer';
import { fontFamily, responsiveWidth } from '../../constant/theme';
import { useTheme } from '../../context/ThemeContext';
import serviceFactory from '../../services/serviceFactory';
import UserService from '../../services/user/user.service';
import { setUser, setUserToken } from '../../state/slices/appSlice';
import { AstrologerCreateClientNavParams } from '../../utils/resolveAstrologerPostAuthNavigation';

const GOLD = '#C5A370';

type RootStackParamList = {
  Login: undefined;
  TermsAndConditions: undefined;
  AstrologerHome: undefined;
  AstrologerCreateClientScreen: AstrologerCreateClientNavParams | undefined;
  AstrologerRegister:
    | {
        email?: string;
        firstName?: string;
        lastName?: string;
      }
    | undefined;
};

const validationSchema = Yup.object().shape({
  firstName: Yup.string().trim().required('First name is required'),
  lastName: Yup.string().trim().required('Last name is required'),
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: Yup.string()
    .matches(
      /[A-Z]/,
      'Password must contain at least one uppercase letter (A-Z)',
    )
    .matches(
      /[a-z]/,
      'Password must contain at least one lowercase letter (a-z)',
    )
    .matches(/[0-9]/, 'Password must contain at least one number (0-9)')
    .matches(
      /[!@#$%^&*]/,
      'Password must contain at least one symbol (!, @, #, $, %, ^, &, *)',
    )
    .min(8, 'Password must be at least 8 characters')
    .required('Please enter your password'),
  agreeTerms: Yup.boolean().oneOf([true], 'Please accept Terms and Conditions'),
});

const AstrologerRegisterScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AstrologerRegister'>>();
  const googlePrefill = route.params;
  const { theme, colors } = useTheme();
  const dispatch = useDispatch();
  const userService = useMemo(
    () => serviceFactory.get<UserService>('UserService'),
    [],
  );
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [showOtpSection, setShowOtpSection] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isOtpActive, setIsOtpActive] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const otpRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];
  const otpTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    serviceFactory.create();
  }, []);

  useEffect(() => {
    if (isOtpActive && otpCountdown > 0 && otpTimerRef.current === null) {
      otpTimerRef.current = setInterval(() => {
        setOtpCountdown(prev => prev - 1);
      }, 1000);
    }

    if (!isOtpActive || otpCountdown === 0) {
      if (otpTimerRef.current) {
        clearInterval(otpTimerRef.current);
        otpTimerRef.current = null;
      }
    }

    if (otpCountdown === 0 && isOtpActive) {
      setIsOtpActive(false);
    }

    return () => {
      if (otpTimerRef.current) {
        clearInterval(otpTimerRef.current);
        otpTimerRef.current = null;
      }
    };
  }, [isOtpActive, otpCountdown]);

  const handleOtpChange = (value: string, idx: number) => {
    if (value === '' || /^[0-9]$/.test(value)) {
      const nextOtp = [...otp];
      const previousValue = nextOtp[idx];
      nextOtp[idx] = value;
      setOtp(nextOtp);

      if (value && value !== previousValue && idx < 5) {
        setTimeout(() => otpRefs[idx + 1].current?.focus(), 10);
      }

      if (!value && previousValue && idx > 0) {
        setTimeout(() => otpRefs[idx - 1].current?.focus(), 10);
      }
    }
  };

  const handleOtpKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (otp[idx] && idx > 0) {
        e.preventDefault();
        const nextOtp = [...otp];
        nextOtp[idx] = '';
        setOtp(nextOtp);
        setTimeout(() => otpRefs[idx - 1].current?.focus(), 10);
      } else if (!otp[idx] && idx > 0) {
        e.preventDefault();
        const nextOtp = [...otp];
        nextOtp[idx - 1] = '';
        setOtp(nextOtp);
        setTimeout(() => otpRefs[idx - 1].current?.focus(), 10);
      }
    }
  };

  const isOtpComplete = otp.every(digit => digit !== '');

  const formik = useFormik({
    initialValues: {
      firstName: googlePrefill?.firstName ?? '',
      lastName: googlePrefill?.lastName ?? '',
      email: googlePrefill?.email ?? '',
      password: '',
      agreeTerms: false,
      general: undefined as string | undefined,
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values, helpers) => {
      try {
        if (!showOtpSection) {
          setIsSendingOtp(true);
          try {
            await userService.requestAstrologerEmailOtp(values.email.trim());
            setShowOtpSection(true);
            setIsOtpActive(true);
            setOtpCountdown(60);
            setOtp(['', '', '', '', '', '']);

            Toast.show({
              type: 'success',
              text1: 'OTP Sent',
              text2: 'Please check your email for the OTP code.',
              position: 'top',
              topOffset: 60,
              visibilityTime: 3000,
            });
          } catch (otpError: any) {
            const errorMessage =
              otpError?.response?.data?.message ||
              otpError?.message ||
              'Failed to send OTP. Please try again.';
            Toast.show({
              type: 'error',
              text1: 'OTP Error',
              text2: errorMessage,
              position: 'top',
              topOffset: 60,
              visibilityTime: 3000,
            });
            helpers.setErrors({ general: errorMessage });
          } finally {
            setIsSendingOtp(false);
          }
          return;
        }

        if (!isOtpComplete) {
          Toast.show({
            type: 'error',
            text1: 'Incomplete OTP',
            text2: 'Please enter all 6 digits of the OTP.',
            position: 'top',
            topOffset: 60,
            visibilityTime: 3000,
          });
          return;
        }

        helpers.setSubmitting(true);
        setIsVerifyingOtp(true);

        const otpString = otp.join('');

        await userService.verifyAstrologerEmail(values.email.trim(), otpString);

        const response = await userService.registerAstrologer({
          first_name: values.firstName.trim(),
          last_name: values.lastName.trim(),
          email: values.email.trim(),
          password: values.password,
        });

        if (response?.status) {
          if (response.data) {
            dispatch(setUser(response.data));
          }
          if (response.access_token) {
            dispatch(setUserToken(response.access_token));
          }

          try {
            const userId =
              response.data?._id || response.data?.user_id || response.data?.id;
            if (userId) {
              const hasSeenModal = await AsyncStorage.getItem(
                `FREE_POINTS_MODAL_SEEN_${userId}`,
              );
              if (!hasSeenModal) {
                await AsyncStorage.setItem('SHOW_FREE_POINTS_MODAL', 'true');
              }
            }
          } catch (modalError) {
            console.error(
              'Error checking/setting free points modal flag:',
              modalError,
            );
          }

          Toast.show({
            type: 'success',
            text1: 'Registration Successful',
            text2:
              response.message || 'Your astrologer account has been created.',
            position: 'top',
            topOffset: 60,
            visibilityTime: 3000,
          });

          setTimeout(() => {
            if (response.access_token) {
              navigation.reset({
                index: 0,
                routes: [
                  {
                    name: 'AstrologerCreateClientScreen',
                    params: { fromRegistration: true },
                  },
                ],
              });
            } else {
              navigation.navigate('Login');
            }
          }, 1500);
          return;
        }

        const errorMessage = response?.message || 'Please try again.';
        Toast.show({
          type: 'error',
          text1: 'Registration Failed',
          text2: errorMessage,
          position: 'top',
          topOffset: 60,
        });
        helpers.setErrors({ general: errorMessage });
      } catch (error: unknown) {
        const err = error as { message?: string };
        const errorMessage =
          err.message || 'Failed to register. Please try again.';
        Toast.show({
          type: 'error',
          text1: showOtpSection ? 'Verification Failed' : 'Registration Failed',
          text2: errorMessage,
          position: 'top',
          topOffset: 60,
        });
        helpers.setErrors({ general: errorMessage });
        if (showOtpSection) {
          setOtp(['', '', '', '', '', '']);
          otpRefs[0].current?.focus();
        }
      } finally {
        helpers.setSubmitting(false);
        setIsVerifyingOtp(false);
      }
    },
  });

  const inputThemeStyle = {
    backgroundColor: theme === 'dark' ? colors.DarkNavy : colors.white,
    borderColor:
      theme === 'dark' ? colors.themeBorderDropdown : colors.Orangeaccentcolor,
    color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
  };

  const textPrimary =
    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy;
  const textMuted =
    theme === 'dark' ? colors.themeTextWhite : colors.themelightText;

  const placeholderColor = textMuted;

  const renderLabel = (label: string) => (
    <Text style={[styles.fieldLabel, { color: textPrimary }]}>
      {label}
      <Text style={styles.requiredMark}> *</Text>
    </Text>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      style={styles.flex}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -84}
    >
      <AuthContainer>
        <View style={styles.stickyHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
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
          <Text
            style={[
              styles.headerTitle,
              { color: textPrimary },
            ]}
          >
            Create Account
          </Text>
          <View style={styles.backBtnPlaceholder} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            showOtpSection && styles.scrollContentCentered,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.formContainer, showOtpSection && styles.formContainerCentered]}>
            {!showOtpSection ? (
              <>
                <View style={styles.nameRow}>
                  <View style={styles.nameField}>
                    {renderLabel('First Name')}
                    <TextInput
                      style={[styles.input, inputThemeStyle]}
                      placeholder="First Name"
                      placeholderTextColor={placeholderColor}
                      value={formik.values.firstName}
                      onChangeText={formik.handleChange('firstName')}
                      onBlur={formik.handleBlur('firstName')}
                      editable={!formik.isSubmitting}
                    />
                    {formik.touched.firstName && formik.errors.firstName ? (
                      <Text style={styles.errorText}>{formik.errors.firstName}</Text>
                    ) : null}
                  </View>

                  <View style={styles.nameField}>
                    {renderLabel('Last Name')}
                    <TextInput
                      style={[styles.input, inputThemeStyle]}
                      placeholder="Last Name"
                      placeholderTextColor={placeholderColor}
                      value={formik.values.lastName}
                      onChangeText={formik.handleChange('lastName')}
                      onBlur={formik.handleBlur('lastName')}
                      editable={!formik.isSubmitting}
                    />
                    {formik.touched.lastName && formik.errors.lastName ? (
                      <Text style={styles.errorText}>{formik.errors.lastName}</Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.fieldBlock}>
                  {renderLabel('Email Address')}
                  <TextInput
                    style={[styles.input, inputThemeStyle]}
                    placeholder="Email Address"
                    placeholderTextColor={placeholderColor}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formik.values.email}
                    onChangeText={formik.handleChange('email')}
                    onBlur={formik.handleBlur('email')}
                    editable={!formik.isSubmitting}
                  />
                  {formik.touched.email && formik.errors.email ? (
                    <Text style={styles.errorText}>{formik.errors.email}</Text>
                  ) : null}
                </View>

                <View style={styles.fieldBlock}>
                  {renderLabel('Password')}
                  <View style={[styles.passwordInputWrap, inputThemeStyle]}>
                    <TextInput
                      style={[styles.passwordInput, { color: inputThemeStyle.color }]}
                      placeholder="Password"
                      placeholderTextColor={placeholderColor}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      value={formik.values.password}
                      onChangeText={formik.handleChange('password')}
                      onBlur={formik.handleBlur('password')}
                      editable={!formik.isSubmitting}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIconContainer}
                      activeOpacity={0.8}
                    >
                      <View style={styles.eyeIconWrapper}>
                        <Image
                          source={require('../../assets/icons/Show.png')}
                          style={[
                            styles.eyeIcon,
                            {
                              tintColor:
                                theme === 'dark'
                                  ? colors.themeTextWhite
                                  : colors.themelightText,
                            },
                          ]}
                        />
                        {!showPassword ? (
                          <View style={styles.crossLineContainer}>
                            <View
                              style={[
                                styles.crossLine,
                                {
                                  backgroundColor:
                                    theme === 'dark'
                                      ? colors.themeTextWhite
                                      : colors.themelightText,
                                },
                              ]}
                            />
                          </View>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  </View>
                  {formik.touched.password && formik.errors.password ? (
                    <Text style={styles.errorText}>{formik.errors.password}</Text>
                  ) : null}
                </View>
              </>
            ) : null}

            {showOtpSection ? (
              <View style={styles.otpSection}>
                <Text style={[styles.otpLabel, { color: textPrimary }]}>
                  Enter 6-Digit OTP
                </Text>
                <View style={styles.otpRow}>
                  {otp.map((digit, idx) => (
                    <TextInput
                      key={idx}
                      ref={otpRefs[idx]}
                      style={[
                        styles.otpInput,
                        inputThemeStyle,
                        digit ? styles.otpInputFilled : null,
                      ]}
                      value={digit}
                      onChangeText={value => handleOtpChange(value, idx)}
                      onKeyPress={e => handleOtpKeyPress(e, idx)}
                      keyboardType="number-pad"
                      maxLength={1}
                      textAlign="center"
                      editable={!isVerifyingOtp && !formik.isSubmitting}
                    />
                  ))}
                </View>

                {isOtpActive ? (
                  <Text style={[styles.otpInfoText, { color: textMuted }]}>
                    OTP expires in {otpCountdown}s
                  </Text>
                ) : (
                  <TouchableOpacity
                    onPress={async () => {
                      if (isSendingOtp) return;
                      try {
                        setIsSendingOtp(true);
                        await userService.requestAstrologerEmailOtp(
                          formik.values.email.trim(),
                        );
                        setIsOtpActive(true);
                        setOtpCountdown(60);
                        setOtp(['', '', '', '', '', '']);
                        Toast.show({
                          type: 'success',
                          text1: 'OTP Resent',
                          text2: 'A new OTP has been sent to your email.',
                          position: 'top',
                          topOffset: 60,
                          visibilityTime: 3000,
                        });
                      } catch (otpError: any) {
                        const errorMessage =
                          otpError?.response?.data?.message ||
                          otpError?.message ||
                          'Failed to resend OTP.';
                        Toast.show({
                          type: 'error',
                          text1: 'OTP Error',
                          text2: errorMessage,
                          position: 'top',
                          topOffset: 60,
                          visibilityTime: 3000,
                        });
                      } finally {
                        setIsSendingOtp(false);
                      }
                    }}
                    disabled={isSendingOtp}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.resendOtpText, isSendingOtp && styles.resendOtpDisabled]}>
                      {isSendingOtp ? 'Sending...' : 'Resend OTP'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null}

            {!showOtpSection ? (
              <>
                <TouchableOpacity
                  style={styles.termsRow}
                  onPress={() =>
                    formik.setFieldValue('agreeTerms', !formik.values.agreeTerms)
                  }
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: textPrimary,
                      },
                      formik.values.agreeTerms && {
                        backgroundColor: colors.Orangeaccentcolor,
                        borderColor: colors.Orangeaccentcolor,
                      },
                    ]}
                  >
                    {formik.values.agreeTerms ? (
                      <Text style={styles.checkboxTick}>✓</Text>
                    ) : null}
                  </View>
                  <Text style={[styles.termsText, { color: textPrimary }]}>
                    I agree to the{' '}
                    <Text
                      style={[styles.termsLink, { color: colors.Orangeaccentcolor }]}
                      onPress={() => navigation.navigate('TermsAndConditions')}
                    >
                      Terms and Conditions
                    </Text>
                  </Text>
                </TouchableOpacity>
                {formik.touched.agreeTerms && formik.errors.agreeTerms ? (
                  <Text style={styles.errorText}>{formik.errors.agreeTerms}</Text>
                ) : null}
              </>
            ) : null}

            {formik.errors.general ? (
              <Text style={styles.errorText}>{formik.errors.general}</Text>
            ) : null}

            <TouchableOpacity
              style={[
                styles.createButton,
                (formik.isSubmitting || isSendingOtp || isVerifyingOtp) &&
                  styles.createButtonDisabled,
              ]}
              onPress={() => formik.handleSubmit()}
              disabled={formik.isSubmitting || isSendingOtp || isVerifyingOtp}
              activeOpacity={0.85}
            >
              {formik.isSubmitting || isVerifyingOtp ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : isSendingOtp ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.createButtonText}>
                  {showOtpSection ? 'Verify OTP & Create' : 'Send OTP'}
                </Text>
              )}
            </TouchableOpacity>

            {!showOtpSection ? (
              <>
                <View style={styles.loginRow}>
                  <Text style={[styles.loginText, { color: textMuted }]}>
                    Already have an Account? Click here to{' '}
                  </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={[styles.loginLink, { color: colors.Orangeaccentcolor }]}>
                      Login
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.backHomeBtn}
                  onPress={() => navigation.navigate('Login')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.backHomeText}>← Back to Home</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </ScrollView>
      </AuthContainer>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  stickyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 48,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPlaceholder: {
    width: 36,
    height: 36,
  },
  backIcon: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    resizeMode: 'contain',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: responsiveWidth('8'),
  },
  scrollContentCentered: {
    justifyContent: 'center',
  },
  formContainer: {
    paddingHorizontal: responsiveWidth('5'),
  },
  formContainerCentered: {
    width: '100%',
    paddingBottom: responsiveWidth('20'),
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  nameField: {
    flex: 1,
  },
  fieldBlock: {
    marginBottom: 12,
  },
  otpSection: {
    marginBottom: 12,
    alignItems: 'center',
  },
  otpLabel: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    marginBottom: 8,
    textAlign: 'center',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    width: '100%',
  },
  otpInput: {
    flex: 1,
    minWidth: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    fontSize: 18,
    fontFamily: fontFamily.semiBold,
    marginBottom: 8,
  },
  otpInputFilled: {
    borderColor: '#DF8A5D',
  },
  otpInfoText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  resendOtpText: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
    color: '#DF8A5D',
    marginTop: 2,
    textAlign: 'center',
  },
  resendOtpDisabled: {
    opacity: 0.6,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    marginBottom: 6,
  },
  requiredMark: {
    color: '#EF4444',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: responsiveWidth('3'),
    paddingVertical: Platform.OS === 'ios' ? responsiveWidth('3') : responsiveWidth('2.5'),
    fontSize: 16,
    fontFamily: fontFamily.regular,
    marginBottom: responsiveWidth('1'),
  },
  passwordInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: responsiveWidth('3'),
    marginBottom: responsiveWidth('1'),
  },
  passwordInput: {
    flex: 1,
    paddingVertical:
      Platform.OS === 'ios' ? responsiveWidth('3') : responsiveWidth('2.5'),
    fontSize: 16,
    fontFamily: fontFamily.regular,
  },
  eyeIconContainer: {
    paddingLeft: 10,
    paddingVertical: 8,
  },
  eyeIconWrapper: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  crossLineContainer: {
    position: 'absolute',
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossLine: {
    position: 'absolute',
    width: 20,
    height: 1.8,
    transform: [{ rotate: '-35deg' }],
    borderRadius: 1,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxTick: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 14,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
  },
  termsLink: {
    fontFamily: fontFamily.semiBold,
    textDecorationLine: 'underline',
  },
  createButton: {
    backgroundColor: '#DF8A5D',
    borderRadius: 999,
    paddingVertical: responsiveWidth('3.5'),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 48,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
  },
  loginRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: responsiveWidth('4'),
  },
  loginText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  loginLink: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
  },
  backHomeBtn: {
    alignItems: 'center',
    marginTop: responsiveWidth('3'),
    marginBottom: responsiveWidth('2'),
  },
  backHomeText: {
    color: GOLD,
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontFamily: fontFamily.regular,
    marginTop: 4,
  },
});

export default AstrologerRegisterScreen;
