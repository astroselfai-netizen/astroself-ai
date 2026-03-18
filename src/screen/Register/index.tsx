// HomeScreen.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Modal,
  FlatList,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import * as RNLocalize from 'react-native-localize';
import { COUNTRY_CODES, isoToDialMap } from '../../constant/countryCodes';
import { responsiveWidth, font, fontFamily, color } from '../../constant/theme';
// import serviceFactory from '../../services/serviceFactory';
// import UserService from '../../services/user/user.service';
// import {InputBox} from '../../components/common/inputBox';
import Toast from 'react-native-toast-message';
import serviceFactory from '../../services/serviceFactory';
import UserService from '../../services/user/user.service';
import GoogleAuthService from '../../services/googleAuthService';
import AppleAuthService from '../../services/appleAuthService';
import notificationService from '../../services/notificationService';
import AppleLoginButton from '../../components/AppleLoginButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, setUserToken } from '../../state/slices/appSlice';
import { RootState } from '../../state/store';

// import Bigball from '../../assets/svgs/bigball.svg';
// import IcBall from '../../assets/svgs/icBall.svg';
// import Bg from '../../assets/svgs/bg.svg';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StackActions } from '@react-navigation/native';
import { AuthContainer } from '../../components/common/AuthContainer';
import { icons } from '../../assets';
import { useTheme } from '../../context/ThemeContext';

export type RootStackParamList = {
  Login: undefined; // Login screen
  Register: undefined; // Register screen
  ForgotPassword: undefined;
  HomeScreen: undefined;
  ContinueWithOtp: undefined;
  AddNewMember: undefined;
  BasicDeatil: undefined;
  // Add other screens as needed
};

// Define your navigation prop type
type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Login'
>;

// Validation handled inline for simplicity

const Register = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { theme, colors } = useTheme();
  const dispatch = useDispatch();
  const membersData = useSelector((state: RootState) => state.app.members);
  const [showPassword, setShowPassword] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');
  const [isCcModalVisible, setIsCcModalVisible] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  
  // OTP related states
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

  // Password strength validation
  const getPasswordStrength = (password: string) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      symbol: /[!@#$%^&*]/.test(password),
    };
    return checks;
  };

  const countryCodes = COUNTRY_CODES;

  // Helper function to navigate based on members data
  const navigateAfterAuth = async (current_members?: number) => {
    try {
      const membersCount = current_members ? current_members : 0;
      console.log('navigateAfterAuth called with current_members:', membersCount);
      console.log('Redux membersData:', membersData);
      
      if (membersCount === 0 || membersCount === undefined) {
        console.log('No members found, navigating to HomeScreen then AddNewMember');
        // Set flag to navigate to AddNewMember after HomeScreen loads
        await AsyncStorage.setItem('NAVIGATE_TO_ADD_MEMBER', 'true');
        
        // Navigate to StartExploring screen first
        navigation.dispatch(
          StackActions.replace('StartExploring')
        );
      } else {
        console.log('Members found, navigating to HomeScreen');
        navigation.dispatch(
          StackActions.replace('HomeScreen')
        );
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback: Navigate to HomeScreen first, then AddNewMember
      try {
        // navigation.dispatch(
        //   StackActions.replace('HomeScreen')
        // );
        setTimeout(() => {
          (navigation as any).navigate('StartExploring');
        }, 200);
      } catch (fallbackError) {
        console.error('Fallback navigation error:', fallbackError);
      }
    }
  };

  React.useEffect(() => {
    serviceFactory.create();
  }, []);
  const userService = serviceFactory.get<UserService>('UserService');
  const googleAuthService = serviceFactory.get<GoogleAuthService>('GoogleAuthService');
  const appleAuthService = serviceFactory.get<AppleAuthService>('AppleAuthService');

  React.useEffect(() => {
    try {
      const deviceCountry = RNLocalize.getCountry();
      const detected = isoToDialMap[deviceCountry];
      if (detected) setCountryCode(detected);
    } catch (e) {
      // ignore and keep default
    }
  }, []);

  // OTP countdown timer
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
    // Allow empty string or single digit
    if (value === '' || /^[0-9]$/.test(value)) {
      const newOtp = [...otp];
      const previousValue = newOtp[idx];
      newOtp[idx] = value;
      setOtp(newOtp);
      
      // If a digit is entered (new value different from previous), move to next
      if (value && value !== previousValue && idx < 5) {
        // Small delay to ensure state is updated before focusing
        setTimeout(() => {
          otpRefs[idx + 1].current?.focus();
        }, 10);
      }
      // If value is deleted (empty) and had a previous value, move to previous
      if (!value && previousValue && idx > 0) {
        setTimeout(() => {
          otpRefs[idx - 1].current?.focus();
        }, 10);
      }
    }
  };

  const handleOtpKeyPress = (e: any, idx: number) => {
    // Handle backspace/delete key
    if (e.nativeEvent.key === 'Backspace') {
      // If current field has value, clear it and move to previous
      if (otp[idx] && idx > 0) {
        e.preventDefault();
        const newOtp = [...otp];
        newOtp[idx] = '';
        setOtp(newOtp);
        // Move to previous field after state update
        setTimeout(() => {
          otpRefs[idx - 1].current?.focus();
        }, 10);
      }
      // If current field is empty and backspace is pressed, move to previous and clear it
      else if (!otp[idx] && idx > 0) {
        e.preventDefault();
        const newOtp = [...otp];
        newOtp[idx - 1] = '';
        setOtp(newOtp);
        setTimeout(() => {
          otpRefs[idx - 1].current?.focus();
        }, 10);
      }
    }
  };

  const isOtpComplete = otp.every(digit => digit !== '');

  const handleBackPress = () => {
    if (showOtpSection) {
      // If OTP section is visible, hide it and reset OTP state
      setShowOtpSection(false);
      setIsOtpActive(false);
      setOtpCountdown(0);
      setOtp(['', '', '', '', '', '']);
      // Clear timer if active
      if (otpTimerRef.current) {
        clearInterval(otpTimerRef.current);
        otpTimerRef.current = null;
      }
    } else {
      // Normal back navigation
      navigation.goBack();
    }
  };

  const validationSchema = Yup.object().shape({
    firstName: Yup.string().trim().required('Please enter your first name'),
    lastName: Yup.string().trim().required('Please enter your last name'),
    email: Yup.string()
      .email('Please enter a valid email address')
      .required('Please enter your email'),
    phone: Yup.string()
      .trim()
      .test('phone-length', 'Please enter a valid phone number', function(value) {
        // If phone is provided, it must be at least 6 characters
        if (value && value.trim().length > 0) {
          return value.trim().length >= 10;
        }
        // If phone is empty, it's valid (optional field)
        return true;
      }),
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

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      general: undefined as undefined | string,
    },
    validationSchema,
    onSubmit: async (values, helpers) => {
      try {
        // If OTP section is not shown, send OTP first
        if (!showOtpSection) {
          setIsSendingOtp(true);
          try {
            const otpResponse = await userService.requestEmailOtp(values.email);
            console.log('OTP sent successfully:', otpResponse);
            
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

        // If OTP section is shown, verify OTP and then register
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
        
        try {
          // Verify email with OTP
          await userService.verifyEmail(values.email, otpString);
          console.log('Email verified successfully');
          
          // Get FCM token
          let fcmToken: string | null = null;
          try {
            fcmToken = await notificationService.getOrCreateFCMToken();
            console.log('FCM Token for register:', fcmToken);
          } catch (error) {
            console.error('Error getting FCM token for register:', error);
          }
          
          // Now register the user
          const compactLocal = values.phone ? values.phone.replace(/[^\d]/g, '') : '';
          const registerData: any = {
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            password: values.password,
            fcmToken: fcmToken || undefined,
          };
          
          // Only include phone if it's provided
          if (compactLocal && compactLocal.length > 0) {
            registerData.phone = `${countryCode}${compactLocal}`;
          }
          
          const data = await userService.register(registerData);

          if (data?.status) {
            // Dispatch user data to Redux state
            dispatch(setUser(data.data));
            if (data.access_token) {
              dispatch(setUserToken(data.access_token));
            }
            
            // Check if this user has already seen the free points modal
            try {
              const userId = (data.data as any)?._id || (data.data as any)?.user_id;
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
            
            Toast.show({
              type: 'success',
              text1: 'Registration Successful',
              text2: 'Your account has been created.',
              position: 'top',
              topOffset: 60,
              visibilityTime: 3000,
            });
            
            // After successful registration, check members data and navigate accordingly
            console.log('Registration data:', data);
            console.log('Access token:', data?.access_token);
            console.log('User data:', data?.data);
            console.log('Current members:', data?.data?.current_members);
            
            // Wait a bit for the profile data to be loaded, then check members
            setTimeout(() => {
              const currentMembers = data?.data?.current_members ? data?.data?.current_members : 0;
              console.log(
                'Navigating after registration, current_members:',
                data,
              );
              console.log('Calling navigateAfterAuth with:', currentMembers);
              
              if (data?.access_token) {
                navigateAfterAuth(currentMembers);
              } else {
                console.log('No access token, navigating to Login');
                navigation.navigate('Login');
              }
            }, 1500);
          } else {
            const errorMessage = data?.message || 'Please try again.';
            Toast.show({
              type: 'error',
              text1: 'Registration Failed',
              text2: errorMessage,
              position: 'top',
              topOffset: 60,
              visibilityTime: 3000,
            });
            helpers.setErrors({ general: errorMessage });
          }
        } catch (verifyError: any) {
          const errorMessage =
            verifyError?.response?.data?.message ||
            verifyError?.message ||
            'OTP verification failed. Please try again.';
          Toast.show({
            type: 'error',
            text1: 'Verification Failed',
            text2: errorMessage,
            position: 'top',
            topOffset: 60,
            visibilityTime: 3000,
          });
          helpers.setErrors({ general: errorMessage });
          // Clear OTP on error
          setOtp(['', '', '', '', '', '']);
          otpRefs[0].current?.focus();
        } finally {
          helpers.setSubmitting(false);
          setIsVerifyingOtp(false);
        }
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          'Something went wrong.';
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: errorMessage,
          position: 'top',
          topOffset: 60,
          visibilityTime: 3000,
        });
        helpers.setErrors({ general: errorMessage });
      }
    },
  });

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await googleAuthService.signInWithGoogle();
      
      if (result.success) {
        // Use the user data from your backend API
        const userData = result.user;
        const token = result.token || result.idToken;

        // Dispatch user data to Redux state
        dispatch(setUser(userData));
        if (token) {
          dispatch(setUserToken(token));
        }

        const message = result.isNewUser 
          ? 'Welcome! Your account has been created with Google.'
          : 'Welcome back! You have successfully logged in with Google.';

        Toast.show({
          type: 'success',
          text1: result.isNewUser ? 'Registration Successful' : 'Login Successful',
          text2: message,
          position: 'top',
          topOffset: 60,
          visibilityTime: 3000,
        });

        // Wait a bit for the profile data to be loaded, then check members
        setTimeout(() => {
          navigateAfterAuth(result?.user?.current_members);
        }, 1000);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Google Signup Failed',
          text2: result.error || 'Failed to sign up with Google. Please try again.',
          position: 'top',
          topOffset: 60,
          visibilityTime: 3000,
        });
      }
    } catch (error: any) {
      console.log('Google Signup Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong with Google signup. Please try again.',
        position: 'top',
        topOffset: 60,
        visibilityTime: 3000,
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleSignup = async () => {
    setIsAppleLoading(true);
    try {
      const result = await appleAuthService.signInWithApple();

      console.log('Apple Signup Result:', result);
      
      if (result.success) {
        // Use the user data from your backend API
        const userData = result.user;
        const token = result.token || result.identityToken;

        // Dispatch user data to Redux state
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
          ? 'Welcome! Your account has been created with Apple.'
          : 'Welcome back! You have successfully logged in with Apple.';

        Toast.show({
          type: 'success',
          text1: result.isNewUser ? 'Registration Successful' : 'Login Successful',
          text2: message,
          position: 'top',
          topOffset: 60,
          visibilityTime: 3000,
        });

        // Wait a bit for the profile data to be loaded, then check members
        setTimeout(() => {
          navigateAfterAuth(result?.user?.current_members);
        }, 1000);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Apple Signup Failed',
          text2: result.error || 'Failed to sign up with Apple. Please try again.',
          position: 'top',
          topOffset: 60,
          visibilityTime: 3000,
        });
      }
    } catch (error: any) {
      console.log('Apple Signup Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong with Apple signup. Please try again.',
        position: 'top',
        topOffset: 60,
        visibilityTime: 3000,
      });
    } finally {
      setIsAppleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      style={{ flex: 1, backgroundColor: '#202945' }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -84}
    >
      <AuthContainer>
        {/* Sticky Header */}
        <View style={styles.stickyHeader}>
          <TouchableOpacity
            onPress={handleBackPress}
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
                styles.createAccountText,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              Create An Account
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={!formik.isSubmitting && !isGoogleLoading && !isAppleLoading}
          pointerEvents={formik.isSubmitting || isGoogleLoading || isAppleLoading ? 'none' : 'auto'}
        >
          {/* Title */}
          <View style={styles.titleWrap}>
            <Image
              source={theme === 'dark'
                ? require('../../assets/icons/Subtract-dark.png')
                : require('../../assets/icons/Subtract-dark.png')}
              style={[styles.sunIcon,theme === 'dark' ? { tintColor: colors.themeTextWhite } : { tintColor: colors.DarkNavy }]}
            />
          </View>

          <View style={styles.lockKeyContainer}>
            <Image
              source={require('../../assets/image/signupLock.png')}
              style={styles.lockKeyImage}
            />
          </View>
          {/* Form */}
          <View style={styles.formContainer}>


            {/* OTP Section - shown after OTP is sent */}
            {showOtpSection ?(
              <>
                <Text
                  style={[
                    styles.otpTitle,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  Enter OTP sent to {formik.values.email}
                </Text>
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
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.DarkNavy,
                        },
                      ]}
                      keyboardType="number-pad"
                      maxLength={1}
                      value={digit}
                      onChangeText={value => handleOtpChange(value, idx)}
                      onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                      returnKeyType="next"
                      textAlign="center"
                      editable={!isVerifyingOtp && !formik.isSubmitting}
                    />
                  ))}
                </View>
                {isOtpActive ? (
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
                      Time remaining:{' '}
                      {String(Math.floor(otpCountdown / 60)).padStart(2, '0')}:
                      {String(otpCountdown % 60).padStart(2, '0')}
                    </Text>
                  </View>
                ) : (
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
                      Didn't receive the code?{' '}
                    </Text>
                    <TouchableOpacity
                      onPress={async () => {
                        if (isSendingOtp) return;
                        setIsSendingOtp(true);
                        try {
                          await userService.requestOtp(formik.values.email);
                          setIsOtpActive(true);
                          setOtpCountdown(60);
                          setOtp(['', '', '', '', '', '']);
                          Toast.show({
                            type: 'success',
                            text1: 'OTP Resent',
                            text2: 'Please check your email.',
                            position: 'top',
                            topOffset: 60,
                            visibilityTime: 3000,
                          });
                        } catch (error: any) {
                          Toast.show({
                            type: 'error',
                            text1: 'Error',
                            text2: error?.message || 'Failed to resend OTP',
                            position: 'top',
                            topOffset: 60,
                            visibilityTime: 3000,
                          });
                        } finally {
                          setIsSendingOtp(false);
                        }
                      }}
                      disabled={isSendingOtp}
                    >
                      <Text
                        style={[
                          styles.resendLink,
                          {
                            opacity: isSendingOtp ? 0.5 : 1,
                          },
                        ]}
                      >
                        {isSendingOtp ? 'Sending...' : 'Resend OTP'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) :(
            <>
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
              placeholder="First name"
              placeholderTextColor={
                theme === 'dark' ? colors.themeTextWhite : colors.themelightText
              }
              value={formik.values.firstName}
              onChangeText={formik.handleChange('firstName')}
              onBlur={formik.handleBlur('firstName')}
              editable={!formik.isSubmitting && !isGoogleLoading}
            />
            {formik.touched.firstName && formik.errors.firstName && (
              <Text style={styles.errorText}>{formik.errors.firstName}</Text>
            )}
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
              placeholder="Last name"
              placeholderTextColor={
                theme === 'dark' ? colors.themeTextWhite : colors.themelightText
              }
              value={formik.values.lastName}
              onChangeText={formik.handleChange('lastName')}
              onBlur={formik.handleBlur('lastName')}
              editable={!formik.isSubmitting && !isGoogleLoading}
            />
            {formik.touched.lastName && formik.errors.lastName && (
              <Text style={styles.errorText}>{formik.errors.lastName}</Text>
            )}
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
                theme === 'dark' ? colors.themeTextWhite : colors.themelightText
              }
              keyboardType="email-address"
              autoCapitalize="none"
              value={formik.values.email}
              onChangeText={formik.handleChange('email')}
              onBlur={formik.handleBlur('email')}
              editable={!formik.isSubmitting && !isGoogleLoading}
            />
            {formik.touched.email && formik.errors.email && (
              <Text style={styles.errorText}>{formik.errors.email}</Text>
            )}
            {/* <View style={styles.phoneRow}>
              <TouchableOpacity
                onPress={() => setIsCcModalVisible(true)}
                style={[
                  styles.ccButton,
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
                activeOpacity={0.8}
                disabled={formik.isSubmitting || isGoogleLoading}
              >
                <Text
                  style={[
                    styles.ccText,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  {countryCode}
                </Text>
              </TouchableOpacity>
              <TextInput
                style={[
                  styles.input,
                  styles.phoneInput,
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
                placeholder="Mobile"
                placeholderTextColor={
                  theme === 'dark'
                    ? colors.themeTextWhite
                    : colors.themelightText
                }
                keyboardType="phone-pad"
                value={formik.values.phone}
                onChangeText={formik.handleChange('phone')}
                onBlur={formik.handleBlur('phone')}
                editable={!formik.isSubmitting && !isGoogleLoading}
              />
            </View>
            {formik.touched.phone && formik.errors.phone && (
              <Text style={styles.errorText}>{formik.errors.phone}</Text>
            )} */}
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
                    ? colors.themeTextWhite
                    : colors.themelightText
                }
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                value={formik.values.password}
                onChangeText={formik.handleChange('password')}
                onBlur={formik.handleBlur('password')}
                editable={!formik.isSubmitting && !isGoogleLoading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIconContainer}
                disabled={formik.isSubmitting || isGoogleLoading}
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
                  {!showPassword && (
                    <View style={styles.crossLineContainer}>
                      <View
                        style={[
                          styles.crossLine,
                          styles.crossLine1,
                          {
                            backgroundColor:
                              theme === 'dark'
                                ? colors.themeTextWhite
                                : colors.themelightText,
                          },
                        ]}
                      />
                      {/* <View style={[styles.crossLine, styles.crossLine2]} /> */}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
            {formik.touched.password && formik.errors.password && (
              <Text style={styles.errorText}>{formik.errors.password}</Text>
            )}
            </>)}

            {/* Password Strength Indicator */}
            {/* {formik.values.password.length > 0 && (
              <View style={styles.passwordStrengthContainer}>
                <Text style={styles.passwordStrengthTitle}>Password Requirements:</Text>
                {(() => {
                  const strength = getPasswordStrength(formik.values.password);
                  return (
                    <View style={styles.passwordRequirements}>
                      <View style={styles.requirementItem}>
                        <Text style={[styles.requirementText, strength.length && styles.requirementMet]}>
                          {strength.length ? '✓' : '○'} At least 8 characters
                        </Text>
                      </View>
                      <View style={styles.requirementItem}>
                        <Text style={[styles.requirementText, strength.uppercase && styles.requirementMet]}>
                          {strength.uppercase ? '✓' : '○'} One uppercase letter (A-Z)
                        </Text>
                      </View>
                      <View style={styles.requirementItem}>
                        <Text style={[styles.requirementText, strength.lowercase && styles.requirementMet]}>
                          {strength.lowercase ? '✓' : '○'} One lowercase letter (a-z)
                        </Text>
                      </View>
                      <View style={styles.requirementItem}>
                        <Text style={[styles.requirementText, strength.number && styles.requirementMet]}>
                          {strength.number ? '✓' : '○'} One number (0-9)
                        </Text>
                      </View>
                      <View style={styles.requirementItem}>
                        <Text style={[styles.requirementText, strength.symbol && styles.requirementMet]}>
                          {strength.symbol ? '✓' : '○'} One symbol (!, @, #, $, %, ^, &, *)
                        </Text>
                      </View>
                    </View>
                  );
                })()}
              </View>
            )} */}
            {formik.errors.general && (
              <Text style={styles.errorText}>{formik.errors.general}</Text>
            )}
            <TouchableOpacity
              onPress={formik.handleSubmit as any}
              disabled={formik.isSubmitting || isGoogleLoading || isAppleLoading || isSendingOtp || isVerifyingOtp}
              style={[
                styles.createAccountButton,
                (formik.isSubmitting || isGoogleLoading || isAppleLoading || isSendingOtp || isVerifyingOtp) && styles.loginButtonDisabled,
              ]}
            >
              {formik.isSubmitting || isVerifyingOtp ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="small" color={color.themeTextWhite} />
                  <Text style={[styles.createAccountButtonText, styles.loadingText]}>
                    {isVerifyingOtp ? 'Verifying OTP...' : 'Please wait...'}
                  </Text>
                </View>
              ) : isSendingOtp ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="small" color={color.themeTextWhite} />
                  <Text style={[styles.createAccountButtonText, styles.loadingText]}>
                    Sending OTP...
                  </Text>
                </View>
              ) : (
                <Text style={styles.createAccountButtonText}>
                  {showOtpSection ? 'Verify OTP & Register' : 'Send OTP'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
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

            {/* Google Signup */}
            <TouchableOpacity
              style={[
                styles.googleButton,
                {
                  borderColor:
                    theme === 'dark'
                      ? colors.themeTextWhite
                      : colors.primaryBlue,
                },
                (formik.isSubmitting || isGoogleLoading || isAppleLoading) && styles.loginButtonDisabled,
              ]}
              onPress={handleGoogleSignup}
              disabled={formik.isSubmitting || isGoogleLoading || isAppleLoading}
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
                    Signing up...
                  </Text>
                </View>
              ) : (
                <>
                  <Image source={icons.Ic_google} style={styles.googleIcon} />
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
                    Sign up with Google
                  </Text>
                </>
              )}
            </TouchableOpacity>
            {/* Apple Signup */}
            <AppleLoginButton
              onPress={handleAppleSignup}
              isLoading={isAppleLoading}
              disabled={formik.isSubmitting || isGoogleLoading}
              buttonType="sign-up"
            />
          </View>
          {/* Footer */}
          <View style={styles.footerWrap}>
            <Text
              style={[
                styles.footerText,
                {
                  color:
                    theme === 'dark'
                      ? colors.themeTextWhite
                      : colors.themelightText,
                },
              ]}
            >
              Already have an account?{' '}
            </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Login')}
              disabled={formik.isSubmitting || isGoogleLoading || isAppleLoading}
            >
              <Text 
                style={[
                  styles.loginLink,
                  {
                    opacity: formik.isSubmitting || isGoogleLoading || isAppleLoading ? 0.5 : 1,
                  },
                ]}
              >
                Login
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </AuthContainer>
      <Modal
        visible={isCcModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCcModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.modalBackdrop]}
          onPress={() => setIsCcModalVisible(false)}
        >
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor:
                  theme === 'dark' ? colors.DarkNavy : colors.white,
              },
            ]}
          >
            <View
              style={[
                styles.modalHandle,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.DarkNavy : colors.DarkNavy,
                },
              ]}
            />
            <FlatList
              data={countryCodes}
              keyExtractor={item => `${item.name}-${item.dialCode}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.ccItem,
                    {
                      backgroundColor:
                        theme === 'dark' ? colors.DarkNavy : colors.white,
                    },
                  ]}
                  onPress={() => {
                    setCountryCode(item.dialCode);
                    setIsCcModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.ccItemText,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      styles.ccItemCode,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    {item.dialCode}
                  </Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => (
                <View
                  style={[
                    styles.ccSeparator,
                    {
                      backgroundColor:
                        theme === 'dark' ? colors.DarkNavy : colors.white,
                    },
                  ]}
                />
              )}
              contentContainerStyle={{ paddingBottom: 12 }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
    minHeight: '100%',
    // backgroundColor: '#202945',
    paddingBottom: 32,
  },
  stickyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop:
      Platform.OS === 'android'
        ? -responsiveWidth('1%')
        : responsiveWidth('13%'),
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
    // justifyContent: 'center',
    // paddingTop: responsiveWidth('15%'),
    // paddingBottom: 16,
    paddingHorizontal: responsiveWidth('2'),
    // backgroundColor: '#202945',
    zIndex: 1000,
  },
  headerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: responsiveWidth('15%'),
    paddingHorizontal: 16,
  },
  backBtn: {
    marginRight: 10,
    // padding: 6,
  },
  backIcon: {
    width: responsiveWidth('5%'),
    height: responsiveWidth('5%'),
    resizeMode: 'contain',
    marginLeft: responsiveWidth('2%'),
    // tintColor: '#EEE5CA',
  },
  createAccountText: {
    color: color.themeTextWhite,
    // ...font.buttonSmall,
    fontFamily: fontFamily.regular,
    // fontWeight: '600',
    textAlign: 'center',
    // textTransform: 'capitalize',
    fontSize: 24,
    marginLeft: responsiveWidth('2%'),
  },
  titleWrap: {
    alignItems: 'center',
    marginTop: -responsiveWidth('5%'),
  },
  sunIcon: {
    width: responsiveWidth('35%'),
    height: responsiveWidth('10%'),
    resizeMode: 'contain',
    marginTop: responsiveWidth('8%'),
  },
  astroselfTitle: {
    ...font.displayLarge,
    color: '#EEE5CA',
  },

  lockKeyContainer: {
    alignItems: 'center',
    marginTop: -responsiveWidth('10%'),
  },
  lockKeyImage: {
    width: responsiveWidth('100%'),
    height: responsiveWidth('50%'),

    resizeMode: 'contain',
  },
  imageWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  backIconWrap: {
    // width: 1,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // marginBottom: 30,
  },
  userCardIcon: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginRight: -30,
    zIndex: 2,
  },
  lockIcon: {
    width: 90,
    height: 90,
    resizeMode: 'contain',
    marginLeft: -30,
    zIndex: 1,
  },
  formContainer: {
    paddingHorizontal: responsiveWidth('5%'),
    // marginBottom: responsiveWidth('4%'),
    // marginTop: -responsiveWidth('4'),
  },
  input: {
    backgroundColor: '#223149',
    borderRadius: 12,
    paddingHorizontal: responsiveWidth('3%'),
    paddingVertical: responsiveWidth('3%'),
    color: color.themeTextWhite,
    // ...font.input,
    fontSize: 16,
    marginBottom: responsiveWidth('4%'),
    borderWidth: 1,
    borderColor: '#496CA8',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveWidth('4%'),
  },
  ccButton: {
    backgroundColor: '#223149',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#496CA8',
    paddingHorizontal: responsiveWidth('3%'),
    paddingVertical: responsiveWidth('3%'),
    marginRight: 10,
  },
  ccText: {
    color: color.themeTextWhite,
    // ...font.input,
    fontSize: 16,
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    marginBottom: 0,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#223149',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#496CA8',
    marginBottom: 18,
  },
  eyeIconContainer: {
    paddingHorizontal: 12,
  },
  eyeIconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeIcon: {
    width: 24,
    height: 24,
    tintColor: '#EEE5CA',
  },
  crossLineContainer: {
    position: 'absolute',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossLine: {
    position: 'absolute',
    width: 24,
    height: 1.5,
    backgroundColor: '#EEE5CA',
  },
  crossLine1: {
    transform: [{ rotate: '45deg' }],
  },
  crossLine2: {
    transform: [{ rotate: '-45deg' }],
  },
  createAccountButton: {
    backgroundColor: '#DF8A5D',
    borderRadius: 10,
    paddingVertical: responsiveWidth('3%'),
    alignItems: 'center',
    // marginBottom: 16,
  },
  createAccountButtonText: {
    color: color.themeTextWhite,
    fontSize: 16,
    fontWeight: '600',
    // ...font.buttonSmall,
  },
  modalBackdrop: {
    flex: 1,
    // backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#2A3754',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '60%',
    paddingBottom: 16,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6B7CA8',
    marginVertical: 10,
  },
  ccItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  ccItemText: {
    color: '#EEE5CA',
    ...font.labelLarge,
  },
  ccItemCode: {
    color: '#EEE5CA',
    ...font.labelLarge,
    fontWeight: '700',
  },
  ccSeparator: {
    height: 1,
    backgroundColor: '#3B4A6A',
    marginHorizontal: 20,
  },
  footerWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    // marginTop: 10,
    marginBottom: responsiveWidth('3%'),
  },
  footerText: {
    color: color.themeTextWhite,
    fontSize: 16,
    // fontWeight: '600',
    // ...font.buttonSmall,
    fontFamily: fontFamily.regular,
  },
  loginLink: {
    color: '#DF8A5D',
    // ...font.buttonSmall,
    fontSize: 16,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    fontFamily: fontFamily.regular,
    marginLeft: 2,
  },
  errorText: {
    color: 'red',
    marginBottom: responsiveWidth('1'),
    marginTop: -responsiveWidth('2.5'),
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveWidth('3%'),
    marginTop: responsiveWidth('3%'),
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#EEE5CA',
  },
  orText: {
    color: color.themeTextWhite,
    marginHorizontal: 12,
    // ...font.subtitleLarge,
    fontSize: 18,
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE5CA',
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
  passwordStrengthContainer: {
    backgroundColor: '#1A2332',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#496CA8',
  },
  passwordStrengthTitle: {
    color: color.themeTextWhite,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  passwordRequirements: {
    gap: 4,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requirementText: {
    color: '#B0B0B0',
    fontSize: 12,
    marginLeft: 4,
  },
  requirementMet: {
    color: '#4CAF50',
    fontWeight: '500',
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
  otpTitle: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    marginBottom: responsiveWidth('3%'),
    marginTop: responsiveWidth('2%'),
    textAlign: 'center',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: responsiveWidth('2'),
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#223149',
    borderWidth: 1,
    borderColor: '#496CA8',
    color: '#fff',
    fontSize: 24,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  resendText: {
    color: '#EEE5CA',
    fontSize: 15,
    fontFamily: fontFamily.regular,
  },
  resendLink: {
    color: '#DF8A5D',
    fontSize: 15,
    fontFamily: fontFamily.regular,
    fontWeight: '700' as const,
  },
});

export default Register;
