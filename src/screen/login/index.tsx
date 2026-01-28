// HomeScreen.tsx

import React, { useState, useEffect } from 'react';
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
import UserService from '../../services/user/user.service';
import GoogleAuthService from '../../services/googleAuthService';
import notificationService from '../../services/notificationService';
// import {InputBox} from '../../components/common/inputBox';
import Toast from 'react-native-toast-message';

// import Bigball from '../../assets/svgs/bigball.svg';
// import IcBall from '../../assets/svgs/icBall.svg';
// import Bg from '../../assets/svgs/bg.svg';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthContainer } from '../../components/common/AuthContainer';
import { icons } from '../../assets';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, setUserToken } from '../../state/slices/appSlice';
import { RootState } from '../../state/store';
import { useTheme } from '../../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type RootStackParamList = {
  Login: undefined; // Login screen
  Register: undefined; // Register screen
  ForgotPassword: undefined;
  HomeScreen: undefined;
  ContinueWithOtp: undefined;
  AddNewMember: undefined;
  BasicDeatil:undefined;
  // Add other screens as needed
};

// Define your navigation prop type
type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Login'
>;

// Validation schema for formik
const validationSchema = Yup.object().shape({
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
  const membersData = useSelector((state: RootState) => state.app.members);
  // Ensure serviceFactory is initialized
  React.useEffect(() => {
    serviceFactory.create();
  }, []);
  const userService = serviceFactory.get<UserService>('UserService');
  const googleAuthService = serviceFactory.get<GoogleAuthService>('GoogleAuthService');

  // Helper function to navigate based on members data
  const navigateAfterAuth = (current_members: number, userData: any) => {
    console.log('Checking members data for navigation:', membersData);
    if (current_members === 0) {
      console.log('No members found, navigating to AddNewMember');
      navigation.replace('AddNewMember');
    } else {
      console.log('Members found, navigating to ChatWithPrompts', userData);
      // Get user_id from userData
      const userId = userData._id || userData.user_id || userData.id;
      
      if (!userId) {
        console.error('User ID not found, navigating to HomeScreen instead');
        navigation.replace('HomeScreen');
        return;
      }

      // Store navigation params in AsyncStorage to be picked up by HomeScreen
      AsyncStorage.setItem(
        'NAVIGATE_TO_CHAT_WITH_PROMPTS',
        JSON.stringify({
          userId: userId,
          cardTitles: 'Snapshot Prediction',
          tab: 'LifeNow',
          planet: null,
        }),
      );

      // Navigate to HomeScreen
      navigation.replace('HomeScreen');
    }
  };

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      general: undefined,
    },
    validationSchema,
    onSubmit: async values => {
      console.log('values.email==>1', values.email, values.password);
      setIsLoading(true);
      try {
        console.log('values.email==>', values.email, values.password);

        // Get FCM token (reuse stored token if available, generate only if needed)
        let fcmToken: string | null = null;
        try {
          fcmToken = await notificationService.getOrCreateFCMToken();
          console.log('FCM Token for login:', fcmToken);
        } catch (error) {
          console.error('Error getting FCM token:', error);
          // Continue with login even if FCM token fails
        }

        const data = await userService.login(values.email, values.password, fcmToken || undefined);

        if (data && data.access_token) {
          // Dispatch user data to Redux state
          dispatch(setUser(data.data));
          dispatch(setUserToken(data.access_token));

          // Check if this user has already seen the free points modal
          try {
            const userId = data.data._id || data.data.user_id || data.data.id;
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

          // Toast.show({
          //   type: 'success',
          //   text1: 'Login Successful',
          //   text2: 'Welcome back! You have successfully logged in.',
          //   position: 'top',
          //   topOffset: 60,
          //   visibilityTime: 3000,
          // });

          console.log('data.data₹183', data.data);

          console.log('data.data', data.data.current_members);

          // Wait a bit for the profile data to be loaded, then check members
          setTimeout(() => {
            navigateAfterAuth(data.data.current_members, data.data);
          }, 1000);
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
        console.log('Full error object:', error);
        console.log('Error response:', error?.response);
        console.log('Error response data:', error?.response?.data);
        console.log('Error status:', error?.response?.status);
        console.log('Error message:', error?.message);

        const errorMessage =
          error?.response?.data?.error_message ||
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

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleGoogleLogin = async () => {
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
          : 'Welcome back! You have successfully logged in with Google.';

        Toast.show({
          type: 'success',
          text1: result.isNewUser ? 'Registration Successful' : 'Login Successful',
          text2: message,
          position: 'top',
          topOffset: 60,
          visibilityTime: 3000,
        });

        console.log('result.isNewUser', result?.user?.current_members);

        // Wait a bit for the profile data to be loaded, then check members
        setTimeout(() => {
          navigateAfterAuth(result?.user?.current_members || 0, userData);
        }, 1000);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Google Login Failed',
          text2: result.error || 'Failed to login with Google. Please try again.',
          position: 'top',
          topOffset: 60,
          visibilityTime: 3000,
        });
      }
    } catch (error: any) {
      console.log('Google Login Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong with Google login. Please try again.',
        position: 'top',
        topOffset: 60,
        visibilityTime: 3000,
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const [, setKeyboardVisible] = useState(false);
  const [keyboardHeight] = useState(new Animated.Value(0));
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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
          scrollEnabled={!isLoading && !isGoogleLoading}
          pointerEvents={isLoading || isGoogleLoading ? 'none' : 'auto'}
        >
          {/* Top Logo and Title */}
          <View style={styles.headerContainer}>
            <View style={styles.logoRow}>
              {/* Placeholder for astrology icon */}
              <Image
                source={
                  theme === 'dark'
                    ? require('../../assets/icons/Subtract-dark.png')
                    : require('../../assets/icons/Subtract-light.png')
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
              onChangeText={formik.handleChange('email')}
              onBlur={formik.handleBlur('email')}
              editable={!isLoading && !isGoogleLoading}
            />
            {formik.touched.email && formik.errors.email && (
              <Text style={styles.errorText}>{formik.errors.email}</Text>
            )}
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
                editable={!isLoading && !isGoogleLoading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIconContainer}
                disabled={isLoading || isGoogleLoading}
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
            {formik.errors.general && (
              <Text style={styles.errorText}>{formik.errors.general}</Text>
            )}
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
            {/* Login Button */}
            <TouchableOpacity
              onPress={() => {
                console.log('Login button pressed!');
                // console.log('Formik values before submit:', formik.values);
                // console.log('Formik errors before submit:', formik.errors);
                formik.handleSubmit();
                // navigation.navigate("HomeScreen")
              }}
              style={[
                styles.loginButton,
                (isLoading || isGoogleLoading) && styles.loginButtonDisabled,
              ]}
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="small" color={color.themeTextWhite} />
                  <Text style={[styles.loginButtonText, styles.loadingText]}>
                    Logging in...
                  </Text>
                </View>
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>
            {/* Continue with OTP */}
            <TouchableOpacity
              onPress={() => navigation.navigate('ContinueWithOtp')}
              style={[
                styles.otpButton,
                {
                  borderColor:
                    theme === 'dark'
                      ? colors.Orangeaccentcolor
                      : colors.primaryBlue,
                },
                (isLoading || isGoogleLoading) && styles.loginButtonDisabled,
              ]}
              disabled={isLoading || isGoogleLoading}
            >
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
            {/* Google Login */}
            <TouchableOpacity
              style={[
                styles.googleButton,
                {
                  borderColor:
                    theme === 'dark'
                      ? colors.themeTextWhite
                      : colors.primaryBlue,
                },
                (isLoading || isGoogleLoading) && styles.loginButtonDisabled,
              ]}
              onPress={handleGoogleLogin}
              disabled={isLoading || isGoogleLoading}
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
                disabled={isLoading || isGoogleLoading}
                style={(isLoading || isGoogleLoading) && styles.disabledTouchable}
              >
                <Text
                  style={[
                    styles.registerNowText,
                    {
                      color:
                        theme === 'dark'
                          ? colors.Orangeaccentcolor
                          : colors.Orangeaccentcolor,
                      opacity: isLoading || isGoogleLoading ? 0.5 : 1,
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
});

export default Login;
