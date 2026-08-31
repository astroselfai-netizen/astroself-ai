// HomeScreen.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  KeyboardEvent,
  Animated,
  Image,
  ActivityIndicator,
} from 'react-native';
import { responsiveHeight, responsiveWidth, color } from '../../constant/theme';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import serviceFactory from '../../services/serviceFactory';
import GoogleAuthService from '../../services/googleAuthService';
import AppleAuthService from '../../services/appleAuthService';
import AppleLoginButton from '../../components/AppleLoginButton';
import UserService from '../../services/user/user.service';
import notificationService from '../../services/notificationService';
import { isAstrologerUser } from '../../utils/userRole';
import {
  AstrologerCreateClientNavParams,
  resolveAstrologerPostAuthScreen,
} from '../../utils/resolveAstrologerPostAuthNavigation';
// import {InputBox} from '../../components/common/inputBox';
import Toast from 'react-native-toast-message';

// import Bigball from '../../assets/svgs/bigball.svg';
// import IcBall from '../../assets/svgs/icBall.svg';
// import Bg from '../../assets/svgs/bg.svg';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthContainer } from '../../components/common/AuthContainer';
import { icons } from '../../assets';
import { useDispatch } from 'react-redux';
import { setUser, setUserToken } from '../../state/slices/appSlice';
import { useTheme } from '../../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  AstrologerRegister:
    | {
        email?: string;
        firstName?: string;
        lastName?: string;
      }
    | undefined;
  ForgotPassword: undefined;
  HomeScreen: undefined;
  AstrologerHome: undefined;
  AstrologerCreateClientScreen: AstrologerCreateClientNavParams | undefined;
  ContinueWithOtp: undefined;
  AddNewMember: undefined;
  BasicDeatil: undefined;
  TermsAndConditions: undefined;
};

// Define your navigation prop type
type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Login'
>;

const emailOnlySchema = Yup.object().shape({
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Please enter your email'),
});

const loginWithPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Please enter your email'),
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
});

const Login = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const dispatch = useDispatch();
  const { theme, colors } = useTheme();
  // Ensure serviceFactory is initialized
  React.useEffect(() => {
    serviceFactory.create();
  }, []);
  const userService = serviceFactory.get<UserService>('UserService');
  const googleAuthService = serviceFactory.get<GoogleAuthService>('GoogleAuthService');
  const appleAuthService = serviceFactory.get<AppleAuthService>('AppleAuthService');

  const [showPasswordField, setShowPasswordField] = useState(false);
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isOtpActive, setIsOtpActive] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [isOtpVerifying, setIsOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');
  const otpTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const otpRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  const showAstrologerOnlyError = () => {
    Toast.show({
      type: 'error',
      text1: 'Access denied',
      text2: 'This login is for astrologers only.',
      position: 'top',
      topOffset: 60,
      visibilityTime: 3000,
    });
  };

  const navigateAstrologerAfterAuth = async (userData: any) => {
    if (!isAstrologerUser(userData)) {
      showAstrologerOnlyError();
      return;
    }

    const userId = userData?._id || userData?.user_id || userData?.id;
    if (!userId) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'AstrologerHome' }],
      });
      return;
    }

    const { screen, params } = await resolveAstrologerPostAuthScreen(
      userService,
      String(userId),
      userData,
    );

    if (screen === 'AstrologerCreateClientScreen') {
      navigation.reset({
        index: 0,
        routes: [{ name: 'AstrologerCreateClientScreen', params }],
      });
      return;
    }

    navigation.reset({
      index: 0,
      routes: [{ name: 'AstrologerHome' }],
    });
  };

  const navigateAfterAuth = (userData: any) => {
    void navigateAstrologerAfterAuth(userData);
  };

  const completeLogin = async (data: {
    access_token: string | null;
    data: any;
  }) => {
    if (!data?.access_token || !data?.data) {
      return;
    }

    if (!isAstrologerUser(data.data)) {
      showAstrologerOnlyError();
      return;
    }

    dispatch(setUser(data.data));
    dispatch(setUserToken(data.access_token));

    try {
      const userId = data.data._id || data.data.user_id || data.data.id;
      if (userId) {
        const hasSeenModal = await AsyncStorage.getItem(
          `FREE_POINTS_MODAL_SEEN_${userId}`,
        );
        if (!hasSeenModal) {
          await AsyncStorage.setItem('SHOW_FREE_POINTS_MODAL', 'true');
        }
      }
    } catch (error) {
      console.error('Error checking/setting free points modal flag:', error);
    }

    setTimeout(() => {
      void navigateAstrologerAfterAuth(data.data);
    }, 1000);
  };

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      general: undefined,
    },
    validationSchema: showPasswordField
      ? loginWithPasswordSchema
      : emailOnlySchema,
    onSubmit: async values => {
      setIsLoading(true);
      try {
        if (!showPasswordField) {
          let fcmToken: string | null = null;
          try {
            fcmToken = await notificationService.getOrCreateFCMToken();
          } catch (error) {
            console.error('Error getting FCM token:', error);
          }

          const checkResponse = await userService.login(
            values.email,
            undefined,
            fcmToken || undefined,
          );

          if (checkResponse.access_token && checkResponse.data) {
            await completeLogin(checkResponse);
            return;
          }

          if (checkResponse.is_user_exist) {
            setShowPasswordField(true);
            formik.setFieldValue('password', '');
            formik.setFieldError('general', undefined);
            return;
          }

          Toast.show({
            type: 'info',
            text1: 'Account not found',
            text2: 'Please register to create a new account.',
            position: 'top',
            topOffset: 60,
            visibilityTime: 3000,
          });
          return;
        }

        let fcmToken: string | null = null;
        try {
          fcmToken = await notificationService.getOrCreateFCMToken();
        } catch (error) {
          console.error('Error getting FCM token:', error);
        }

        const data = await userService.login(
          values.email,
          values.password,
          fcmToken || undefined,
        );

        if (data?.access_token) {
          await completeLogin(data);
        } else {
          Toast.show({
            type: 'error',
            text1: 'Login Failed',
            text2: data.message || 'Invalid credentials. Please try again.',
            position: 'top',
            topOffset: 60,
            visibilityTime: 3000,
          });
          formik.setErrors({
            general: data.message || 'Invalid credentials',
          });
        }
      } catch (error: any) {
        console.log('Login error:', error);

        const errorMessage =
          error?.response?.data?.error_message ||
          error?.message ||
          'Something went wrong. Please try again.';
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: errorMessage,
          position: 'top',
          topOffset: 60,
          visibilityTime: 3000,
        });
        formik.setErrors({ general: errorMessage });
      } finally {
        setIsLoading(false);
      }
    },
  });

  const handleEmailChange = (text: string) => {
    if (otpMode) {
      setOtpMode(false);
      setOtp(['', '', '', '', '', '']);
      setIsOtpActive(false);
      setOtpCountdown(0);
      setOtpError('');
    }
    if (showPasswordField) {
      setShowPasswordField(false);
      formik.setFieldValue('password', '');
      formik.setFieldError('password', undefined);
    }
    formik.handleChange('email')(text);
  };

  const resetOtpTimer = () => {
    if (otpTimerRef.current) {
      clearInterval(otpTimerRef.current);
      otpTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (isOtpActive && otpCountdown > 0 && otpTimerRef.current === null) {
      otpTimerRef.current = setInterval(() => {
        setOtpCountdown(prev => {
          if (prev <= 1) {
            resetOtpTimer();
            setIsOtpActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return resetOtpTimer;
  }, [isOtpActive, otpCountdown]);

  const handleOtpChange = (value: string, idx: number) => {
    if (!/^[0-9]?$/.test(value)) {
      return;
    }

    const nextOtp = [...otp];
    nextOtp[idx] = value;
    setOtp(nextOtp);
    setOtpError('');

    if (value && idx < 5) {
      otpRefs[idx + 1].current?.focus();
    }
    if (!value && idx > 0) {
      otpRefs[idx - 1].current?.focus();
    }
  };

  const handleContinueWithOtp = async () => {
    const errors = await formik.validateForm();
    if (errors.email) {
      formik.setTouched({ email: true });
      return;
    }

    setIsOtpSending(true);
    setOtpError('');

    try {
      const response = await userService.requestAstrologerOtp(formik.values.email.trim());

      setOtpMode(true);
      setShowPasswordField(false);
      setOtp(['', '', '', '', '', '']);
      setIsOtpActive(true);
      setOtpCountdown(60);

      Toast.show({
        type: 'success',
        text1: 'OTP Sent',
        text2: response.message || 'OTP sent to your email.',
        position: 'top',
        topOffset: 60,
        visibilityTime: 3000,
      });

      setTimeout(() => otpRefs[0].current?.focus(), 300);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to send OTP. Please try again.';
      setOtpError(message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
        position: 'top',
        topOffset: 60,
        visibilityTime: 3000,
      });
    } finally {
      setIsOtpSending(false);
    }
  };

  const handleResendOtp = async () => {
    if (isOtpActive) {
      return;
    }

    await handleContinueWithOtp();
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      return;
    }

    setIsOtpVerifying(true);
    setOtpError('');

    try {
      let fcmToken: string | null = null;
      try {
        fcmToken = await notificationService.getOrCreateFCMToken();
      } catch (error) {
        console.error('Error getting FCM token for verify OTP:', error);
      }

      const response = await userService.verifyAstrologerOtp(
        formik.values.email.trim(),
        otpString,
        fcmToken || undefined,
      );

      if (response?.status && response?.data && response?.access_token) {
        await completeLogin(response);
        return;
      }

      throw new Error(response?.message || 'Invalid OTP. Please try again.');
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Invalid OTP. Please try again.';
      setOtpError(message);
      setOtp(['', '', '', '', '', '']);
      otpRefs[0].current?.focus();
      Toast.show({
        type: 'error',
        text1: 'Verification Failed',
        text2: message,
        position: 'top',
        topOffset: 60,
        visibilityTime: 3000,
      });
    } finally {
      setIsOtpVerifying(false);
    }
  };

  const isOtpComplete = otp.every(digit => digit !== '');
  const isFormBusy =
    isLoading || isGoogleLoading || isAppleLoading || isOtpSending || isOtpVerifying;

  const handleRegister = () => {
    navigation.navigate('AstrologerRegister');
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await googleAuthService.signInWithGoogle();
      
      if (result.success) {
        // We require backend token for app APIs. If backend is down, don't proceed.
        const userData = result.user;
        const token = result.token;

        if (!token) {
          Toast.show({
            type: 'error',
            text1: 'Server Unavailable',
            text2:
              'Google sign-in worked, but our server is down (503). Please try again later.',
            position: 'top',
            topOffset: 60,
            visibilityTime: 3500,
          });
          await googleAuthService.signOut();
          return;
        }

        if (!isAstrologerUser(userData)) {
          await googleAuthService.signOut();
          showAstrologerOnlyError();
          return;
        }

        dispatch(setUser(userData));
        if (token) {
          dispatch(setUserToken(token));
        }

        // Check if this user has already seen the free points modal
        try {
          const userId = userData._id || userData.user_id || userData.id;
          if (userId) {
            const hasSeenModal = await AsyncStorage.getItem(
              `FREE_POINTS_MODAL_SEEN_${userId}`,
            );
            // Only set flag if user hasn't seen the modal before
            if (!hasSeenModal) {
              await AsyncStorage.setItem('SHOW_FREE_POINTS_MODAL', 'true');
            }
          }
        } catch (error) {
          console.error('Error checking/setting free points modal flag:', error);
        }

        const message = result.isNewUser 
          ? 'Welcome! Your account has been created with Google.'
          : 'Welcome! Your account has been created with Google.';

        Toast.show({
          type: 'success',
          text1: result.isNewUser ? 'Registration Successful' : 'Login Successful',
          text2: message,
          position: 'top',
          topOffset: 60,
          visibilityTime: 3000,
        });

        setTimeout(() => {
          void navigateAstrologerAfterAuth(userData);
        }, 1000);
      } else if (result.error) {
        Toast.show({
          type: 'error',
          text1: 'Google Login Failed',
          text2: result.error,
          position: 'top',
          topOffset: 60,
          visibilityTime: 3000,
        });
      }
    } catch (error: any) {
      console.log('Google Login Error:', error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error_message ||
        error?.message ||
        '';

      if (errorMessage) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: errorMessage,
          position: 'top',
          topOffset: 60,
          visibilityTime: 3000,
        });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setIsAppleLoading(true);
    try {
      const result = await appleAuthService.signInWithApple();
      
      if (result.success) {
        const userData = result.user;
        const token = result.token || result.identityToken;

        if (!isAstrologerUser(userData)) {
          showAstrologerOnlyError();
          return;
        }

        dispatch(setUser(userData));
        if (token) {
          dispatch(setUserToken(token));
        }

        try {
          const userId = userData._id || userData.user_id || userData.id;
          if (userId) {
            const hasSeenModal = await AsyncStorage.getItem(
              `FREE_POINTS_MODAL_SEEN_${userId}`,
            );
            if (!hasSeenModal) {
              await AsyncStorage.setItem('SHOW_FREE_POINTS_MODAL', 'true');
            }
          }
        } catch (error) {
          console.error('Error checking/setting free points modal flag:', error);
        }

        const message = result.isNewUser 
          ? 'Welcome! Your account has been created with Apple.'
          : 'Welcome! Your account has been created with Apple.';

        Toast.show({
          type: 'success',
          text1: result.isNewUser ? 'Registration Successful' : 'Login Successful',
          text2: message,
          position: 'top',
          topOffset: 60,
          visibilityTime: 3000,
        });

        setTimeout(() => {
          navigateAfterAuth(userData);
        }, 1000);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Apple Login Failed',
          text2: result.error || 'Failed to login with Apple. Please try again.',
          position: 'top',
          topOffset: 60,
          visibilityTime: 3000,
        });
      }
    } catch (error: any) {
      console.log('Apple Login Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong with Apple login. Please try again.',
        position: 'top',
        topOffset: 60,
        visibilityTime: 3000,
      });
    } finally {
      setIsAppleLoading(false);
    }
  };

  const [, setKeyboardVisible] = useState(false);
  const [keyboardHeight] = useState(new Animated.Value(0));
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e: KeyboardEvent) => {
        Animated.timing(keyboardHeight, {
          toValue: e.endCoordinates.height,
          duration: 250,
          useNativeDriver: false,
        }).start();
      },
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        Animated.timing(keyboardHeight, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }).start();
      },
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, [keyboardHeight]);

  // Debug log to see Formik state
  console.log(
    'Formik errors:',
    formik.errors,
    'touched:',
    formik.touched,
    'values:',
    formik.values,
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      style={{ height: responsiveHeight('100%'), justifyContent: 'center' }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -84}
    >
      <AuthContainer>
        {/* <Animated.View style={{ paddingBottom: keyboardHeight }}> */}
        <ScrollView
          style={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={!isLoading && !isGoogleLoading && !isAppleLoading}
          pointerEvents={isFormBusy ? 'none' : 'auto'}
        >
          {/* Top Logo and Title */}
          <View style={styles.headerContainer}>
            <View style={styles.logoRow}>
              {/* Placeholder for astrology icon */}
              <Image
                source={
                  theme === 'dark'
                    ? require('../../assets/icons/Subtract-dark.png')
                    : require('../../assets/icons/Subtract-dark.png')
                }
                style={[styles.astroIcon,theme === 'dark' ? { tintColor: colors.themeTextWhite } : { tintColor: colors.DarkNavy }]}
              />
            </View>
            {/* Astrology wheel and planets (placeholders) */}
            <View style={styles.astroWheelContainer}>
              <Image
                source={require('../../assets/image/upscalemediaTransformed.png')}
                style={styles.planet2}
              />
            </View>
          </View>
          {/* Login Form */}
          <View style={styles.formContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.DarkNavy : colors.white,
                  borderColor:
                    theme === 'dark'
                      ? colors.themeBorderDropdown
                      : colors.Orangeaccentcolor,
                      color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
              placeholder="Email"
              placeholderTextColor={
                theme === 'dark'
                  ? colors.placeholderTextColor
                  : colors.themelightText
              }
              keyboardType="email-address"
              autoCapitalize="none"
              value={formik.values.email}
              onChangeText={handleEmailChange}
              onBlur={formik.handleBlur('email')}
              editable={!isFormBusy}
            />
            {formik.touched.email && formik.errors.email && (
              <Text style={styles.errorText}>{formik.errors.email}</Text>
            )}
            {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}
            {otpMode ? (
              <View style={styles.otpRow}>
                {otp.map((digit, idx) => (
                  <TextInput
                    key={idx}
                    ref={otpRefs[idx]}
                    style={[
                      styles.otpBox,
                      {
                        backgroundColor:
                          theme === 'dark' ? colors.DarkNavy : colors.white,
                        borderColor:
                          theme === 'dark'
                            ? colors.themeBorderDropdown
                            : colors.Orangeaccentcolor,
                        color:
                          theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                      },
                    ]}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={digit}
                    onChangeText={value => handleOtpChange(value, idx)}
                    returnKeyType="next"
                    textAlign="center"
                    editable={!isOtpVerifying}
                  />
                ))}
              </View>
            ) : null}
            {showPasswordField && !otpMode && (
            <>
            <View
              style={[
                styles.passwordInputContainer,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.DarkNavy : colors.white,
                  borderColor:
                    theme === 'dark'
                      ? colors.themeBorderDropdown
                      : colors.Orangeaccentcolor,

                      
                },
              ]}
            >
              <TextInput
                style={[
                  styles.input,
                  {
                    flex: 1,
                    marginBottom: 0,
                    borderWidth: 0,
                    backgroundColor:
                      theme === 'dark' ? colors.DarkNavy : colors.white,
                    borderColor:
                      theme === 'dark'
                        ? colors.themeBorderDropdown
                        : colors.Orangeaccentcolor,
                        color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                  },
                ]}
                placeholder="Password"
                placeholderTextColor={
                  theme === 'dark'
                    ? colors.placeholderTextColor
                    : colors.themelightText
                }
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                value={formik.values.password}
                onChangeText={formik.handleChange('password')}
                onBlur={formik.handleBlur('password')}
                editable={!isFormBusy}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIconContainer}
                disabled={isFormBusy}
              >
                <View style={styles.eyeIconWrapper}>
                  <Image
                    source={require('../../assets/icons/Show.png')}
                    style={{
                      width: responsiveWidth('5%'),
                      height: responsiveWidth('5%'),
                    }}
                  />
                  {!showPassword && (
                    <View style={styles.crossLineContainer}>
                      <View style={[styles.crossLine, styles.crossLine1]} />
                      {/* <View style={[styles.crossLine, styles.crossLine2]} /> */}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
            {formik.touched.password && formik.errors.password && (
              <Text style={styles.errorText}>{formik.errors.password}</Text>
            )}
            </>
            )}
            {formik.errors.general && (
              <Text style={styles.errorText}>{formik.errors.general}</Text>
            )}
            {showPasswordField && !otpMode && (
            <TouchableOpacity 
              onPress={handleForgotPassword}
              disabled={isLoading || isGoogleLoading}
              style={(isLoading || isGoogleLoading) && styles.disabledTouchable}
            >
              <Text
                style={[
                  styles.forgotPassword,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.themelightText,
                    opacity: isLoading || isGoogleLoading ? 0.5 : 1,
                  },
                ]}
              >
                Forgot Password?
              </Text>
            </TouchableOpacity>
            )}
            {!otpMode ? (
            <TouchableOpacity
              onPress={() => {
                console.log('Login button pressed!');
                formik.handleSubmit();
              }}
              style={[
                styles.loginButton,
                isFormBusy && styles.loginButtonDisabled,
              ]}
              disabled={isFormBusy}
            >
              {isLoading ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="small" color={color.themeTextWhite} />
                  <Text style={[styles.loginButtonText, styles.loadingText]}>
                    {showPasswordField ? 'Logging in...' : 'Please wait...'}
                  </Text>
                </View>
              ) : (
                <Text style={styles.loginButtonText}>
                  {showPasswordField ? 'Login' : 'Continue'}
                </Text>
              )}
            </TouchableOpacity>
            ) : (
            <TouchableOpacity
              onPress={handleVerifyOtp}
              style={[
                styles.loginButton,
                (!isOtpComplete || isOtpVerifying) && styles.loginButtonDisabled,
              ]}
              disabled={!isOtpComplete || isOtpVerifying}
            >
              {isOtpVerifying ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="small" color={color.themeTextWhite} />
                  <Text style={[styles.loginButtonText, styles.loadingText]}>
                    Verifying...
                  </Text>
                </View>
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>
            )}
            {otpMode && isOtpActive ? (
              <View style={styles.resendRow}>
                <Text
                  style={[
                    styles.resendText,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.themelightText,
                    },
                  ]}
                >
                  Resend OTP in {otpCountdown}s
                </Text>
              </View>
            ) : null}
            {otpMode && !isOtpActive ? (
              <TouchableOpacity onPress={handleResendOtp} disabled={isOtpSending}>
                <Text
                  style={[
                    styles.resendLink,
                    {
                      color:
                        theme === 'dark'
                          ? colors.Orangeaccentcolor
                          : colors.primaryBlue,
                    },
                    isOtpSending && styles.resendLinkDisabled,
                  ]}
                >
                  {isOtpSending ? 'Sending...' : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            ) : null}
            {/* {!otpMode ? (
            <TouchableOpacity
              onPress={handleContinueWithOtp}
              style={[
                styles.otpButton,
                {
                  borderColor:
                    theme === 'dark'
                      ? colors.Orangeaccentcolor
                      : colors.primaryBlue,
                },
                isFormBusy && styles.loginButtonDisabled,
              ]}
              disabled={isFormBusy}
            >
              {isOtpSending ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator
                    size="small"
                    color={theme === 'dark' ? colors.themeTextWhite : colors.primaryBlue}
                  />
                  <Text
                    style={[
                      styles.otpButtonText,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.primaryBlue,
                      },
                      styles.loadingText,
                    ]}
                  >
                    Sending OTP...
                  </Text>
                </View>
              ) : (
                <Text
                  style={[
                    styles.otpButtonText,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.primaryBlue,
                    },
                  ]}
                >
                  Continue with OTP
                </Text>
              )}
            </TouchableOpacity>
            ) : null} */}
            <View style={styles.dividerRow}>
              <View
                style={[
                  styles.divider,
                  {
                    backgroundColor:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.themelightText,
                  },
                ]}
              />
              <Text
                style={[
                  styles.orText,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.themelightText,
                  },
                ]}
              >
                OR
              </Text>
              <View
                style={[
                  styles.divider,
                  {
                    backgroundColor:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.themelightText,
                  },
                ]}
              />
            </View>
            {/* Google Login */}
            {
              Platform.OS === 'android' && (
                <TouchableOpacity
                  style={[
                    styles.googleButton,
                    {
                      borderColor:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.primaryBlue,
                    },
                    (isLoading || isGoogleLoading || isAppleLoading) && styles.loginButtonDisabled,
                  ]}
                  onPress={handleGoogleLogin}
                  disabled={isLoading || isGoogleLoading || isAppleLoading}
                >
                  {isGoogleLoading ? (
                    <View style={styles.loaderContainer}>
                      <ActivityIndicator size="small" color={theme === 'dark' ? colors.themeTextWhite : colors.primaryBlue} />
                      <Text
                        style={[
                          styles.googleButtonText,
                          styles.loadingText,
                          {
                            color:
                              theme === 'dark'
                                ? colors.themeTextWhite
                                : colors.primaryBlue,
                          },
                        ]}
                      >
                        Logging in...
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Image source={icons.Ic_google} style={styles.googleG} />
                      <Text
                        style={[
                          styles.googleButtonText,
                          {
                            color:
                              theme === 'dark'
                                ? colors.themeTextWhite
                                : colors.primaryBlue,
                          },
                        ]}
                      >
                        Login with Google
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )
            }
           
            <AppleLoginButton
              onPress={handleAppleLogin}
              isLoading={isAppleLoading}
              disabled={isLoading || isGoogleLoading}
              buttonType="sign-in"
            />
            {/* Register Link */}
            <View style={styles.registerRow}>
              <Text
                style={[
                  styles.registerText,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.themelightText,
                  },
                ]}
              >
                Don't have account?{' '}
              </Text>
              <TouchableOpacity 
                onPress={handleRegister}
                disabled={isLoading || isGoogleLoading || isAppleLoading}
                style={(isLoading || isGoogleLoading || isAppleLoading) && styles.disabledTouchable}
              >
                <Text
                  style={[
                    styles.registerNowText,
                    {
                      color:
                        theme === 'dark'
                          ? colors.Orangeaccentcolor
                          : colors.Orangeaccentcolor,
                      opacity: isLoading || isGoogleLoading || isAppleLoading ? 0.5 : 1,
                    },
                  ]}
                >
                  Register Now
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        {/* </Animated.View> */}
      </AuthContainer>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
    minHeight: '100%',
    // backgroundColor: '#202945',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    // justifyContent: 'center',
    // alignItems: 'center',
    paddingBottom: 32,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: responsiveWidth('13%'),
    marginBottom: 24,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveWidth('4%'),
  },
  astroIcon: {
    width: responsiveWidth('35%'),
    height: responsiveWidth('10%'),
    resizeMode: 'contain',
  },
  astroWheelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  planet2: {
    width: responsiveWidth('100%'),
    height: responsiveHeight('15%'),
    resizeMode: 'contain',
  },
  formContainer: {
    paddingHorizontal: responsiveWidth('7%'),
  },
  input: {
    backgroundColor: '#223149',
    borderRadius: 12,
    paddingHorizontal: responsiveWidth('4%'),
    paddingVertical: responsiveWidth('3'),
    color: color.themeTextWhite,
    // ...font.input,
    fontSize: 16,
    marginBottom: responsiveWidth('4%'),
    borderWidth: 1,
    borderColor: '#496CA8',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#223149',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#496CA8',
    marginBottom: responsiveWidth('4%'),
  },
  eyeIconContainer: {
    paddingHorizontal: 12,
  },
  eyeIconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossLineContainer: {
    position: 'absolute',
    width: responsiveWidth('5%'),
    height: responsiveWidth('5%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossLine: {
    position: 'absolute',
    width: responsiveWidth('5%'),
    height: 2,
    backgroundColor: '#B0B3C7',
  },
  crossLine1: {
    transform: [{ rotate: '45deg' }],
  },
  crossLine2: {
    transform: [{ rotate: '-45deg' }],
  },
  forgotPassword: {
    color: color.themeTextWhite,
    // ...font.input,
    fontSize: 16,
    alignSelf: 'flex-end',
    marginBottom: responsiveWidth('3.5%'),
  },
  loginButton: {
    backgroundColor: '#DF8A5D',
    borderRadius: 10,
    paddingVertical: responsiveWidth('3%'),
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonText: {
    color: color.themeTextWhite,
    // ...font.buttonSmall,
    fontSize: 16,
    fontWeight: '600',
  },
  otpButton: {
    borderWidth: 1,
    borderColor: '#DF8A5D',
    borderRadius: 10,
    paddingVertical: responsiveWidth('3'),
    alignItems: 'center',
    marginBottom: responsiveWidth('3%'),
  },
  otpButtonText: {
    color: color.themeTextWhite,
    // ...font.buttonSmall,
    fontSize: 16,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginBottom: 24,
    marginBottom: responsiveWidth('3%'),
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#EEE5CA',
  },
  orText: {
    color: color.themeTextWhite,
    marginHorizontal: 12,
    // ...font.labelLarge,
    fontSize: 18,
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    // borderColor: '#EEE5CA',
    borderRadius: 10,
    paddingVertical: responsiveWidth('2.5'),
    justifyContent: 'center',
    marginBottom: responsiveWidth('5%'),
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleButtonText: {
    color: color.themeTextWhite,
    fontSize: 16,
    fontWeight: '600',
    // ...font.buttonSmall,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: color.themeTextWhite,
    fontSize: 16,
    fontWeight: '400',
    // ...font.bodySmall,
    // ...font.bodySmall,
  },
  registerNowText: {
    color: '#F2994A',
    fontSize: 16,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    // ...font.buttonSmall,
  },
  googleG: {
    width: responsiveWidth('6%'),
    height: responsiveWidth('6%'),
    marginRight: responsiveWidth('2%'),
  },
  errorText: {
    color: 'red',
    marginBottom: responsiveWidth('1'),
    marginTop: -responsiveWidth('2.5'),
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 8,
  },
  disabledTouchable: {
    opacity: 0.5,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: responsiveWidth('4%'),
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 24,
    textAlign: 'center',
  },
  resendRow: {
    alignItems: 'center',
    marginBottom: responsiveWidth('3%'),
  },
  resendText: {
    fontSize: 15,
  },
  resendLink: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: responsiveWidth('3%'),
  },
  resendLinkDisabled: {
    opacity: 0.5,
  },
});

export default Login;
