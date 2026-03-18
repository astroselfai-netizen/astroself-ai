// HomeScreen.tsx

import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { responsiveHeight, responsiveWidth, fontFamily } from '../../constant/theme';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthContainer } from '../../components/common/AuthContainer';
import BackIcon from '../../assets/icons/back.png';
import { useTheme } from '../../context/ThemeContext';

export type RootStackParamList = {
  Login: undefined; // Login screen
  Register: undefined; // Register screen
  ForgotPassword: undefined;
  HomeScreen: undefined;
  // Add other screens as needed
};

// Define your navigation prop type
type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Login'
>;

const ForgotPasswordOtp = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const theme = useTheme();
  // Hardcoded email for demo, replace with actual email logic if needed
  const email = 'abc@gmail.com';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  const handleBack = () => {
    navigation.goBack();
  };

  const handleOtpChange = (value: string, idx: number) => {
    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[idx] = value;
      setOtp(newOtp);
      if (value && idx < 5) {
        otpRefs[idx + 1].current?.focus();
      }
      if (!value && idx > 0) {
        otpRefs[idx - 1].current?.focus();
      }
    }
  };

  const handleVerifyOtp = () => {
    // TODO: Verify OTP logic
  };

  const handleResendOtp = () => {
    // TODO: Resend OTP logic
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      style={{ flex: 1, backgroundColor: '#202945' }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -84}
    >
        <AuthContainer>
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flex: 1 }}>
            {/* Header */}
            <View style={styles.topBar}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                // style={styles.backBtn}
              >
                <Image source={BackIcon} style={styles.backIcon} />
              </TouchableOpacity>
              <Text style={styles.topBarText}>Forgot Password</Text>
            </View>

            {/* Astroself logo and title */}
            <View
              style={{ alignItems: 'center', marginTop: responsiveWidth('4%') }}
            >
              <Image
                source={theme === 'dark'
                  ? require('../../assets/icons/Subtract-dark.png')
                  : require('../../assets/icons/Subtract-dark.png')}
                style={[styles.astroIcon,theme === 'dark' ? { tintColor: colors.themeTextWhite } : { tintColor: colors.DarkNavy }]}
              />

              <Image
                source={require('../../assets/image/lock.png')}
                style={styles.lockKeyImage}
              />
            </View>

            {/* Instructions */}

            <View style={{ paddingHorizontal: 24 }}>
              <Text style={styles.instructionText}>
                Enter the 6-digit code we sent{`\n`}to your email
              </Text>
              <Text style={styles.emailText}>{email}</Text>

              {/* OTP input row */}
              <View style={styles.otpRow}>
                {otp.map((digit, idx) => (
                  <TextInput
                    key={idx}
                    ref={otpRefs[idx]}
                    style={styles.otpBox}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={digit}
                    onChangeText={value => handleOtpChange(value, idx)}
                    returnKeyType="next"
                    textAlign="center"
                  />
                ))}
              </View>

              {/* Verify OTP Button */}
              <TouchableOpacity
                style={styles.verifyButton}
                onPress={handleVerifyOtp}
              >
                <Text style={styles.verifyButtonText}>Verify OTP</Text>
              </TouchableOpacity>

              {/* Resend OTP */}
              <View style={styles.resendRow}>
                <Text style={styles.resendText}>Didn't receive the code? </Text>
                <TouchableOpacity onPress={handleResendOtp}>
                  <Text style={styles.resendLink}>Resend OTP</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
        </AuthContainer>
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
  headerContainer: {
    alignItems: 'center',
    // marginTop: 40,
    marginBottom: 24,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  astroIcon: {
    width: responsiveWidth('100%'),
    height: responsiveWidth('20%'),
    resizeMode: 'contain',
    marginTop: responsiveWidth('5%'),
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: responsiveWidth('15%'),
    paddingHorizontal: 16,
  },
  backIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
    tintColor: '#F6EFD9',
  },
  topBarText: {
    color: '#F6EFD9',
    fontSize: 20,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
    marginLeft: responsiveWidth('3%'),
  },
  astroTitle: {
    fontSize: 40,
    color: '#F6EFD9',
    fontWeight: '700',
    fontFamily: fontFamily.regular,
    marginBottom: 0,
  },
  astroWheelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  astroWheel: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
  },
  lockKeyImage: {
    width: responsiveWidth('100%'),
    height: responsiveWidth('80%'),
    resizeMode: 'contain',
    marginTop: -responsiveWidth('7%'),
  },
  planet1: {
    position: 'absolute',
    left: -30,
    top: 30,
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
  planet2: {
    width: responsiveWidth('100%'),
    height: responsiveHeight('26%'),
    resizeMode: 'contain',
  },
  formContainer: {
    paddingHorizontal: responsiveWidth('7%'),
  },
  input: {
    backgroundColor: '#223149',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
    fontFamily: fontFamily.regular,
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
    marginBottom: responsiveWidth('1.5%'),
  },
  eyeIconContainer: {
    paddingHorizontal: 12,
  },
  forgotPassword: {
    color: '#F6EFD9',
    fontSize: 14,
    fontFamily: fontFamily.regular,
    alignSelf: 'flex-end',

    marginBottom: responsiveWidth('2%'),
  },
  loginButton: {
    backgroundColor: '#DF8A5D',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonText: {
    color: '#EEE5CA',
    fontSize: 18,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
  },
  otpButton: {
    borderWidth: 1,
    borderColor: '#DF8A5D',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: responsiveWidth('3%'),
  },
  otpButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: fontFamily.regular,
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
    color: '#EEE5CA',
    marginHorizontal: 12,
    fontSize: 16,
    fontFamily: fontFamily.regular,
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE5CA',
    borderRadius: 10,
    paddingVertical: 12,
    justifyContent: 'center',
    marginBottom: responsiveWidth('5%'),
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleButtonText: {
    color: '#EEE5CA',
    fontSize: 16,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: fontFamily.regular,
  },
  registerNowText: {
    color: '#F2994A',
    fontSize: 15,
    fontFamily: fontFamily.regular,
    fontWeight: '700',
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: responsiveWidth('15%'),
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EEE5CA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  backArrow: {
    color: '#EEE5CA',
    fontSize: 22,
    fontFamily: fontFamily.regular,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#F6EFD9',
    fontSize: 24,
    fontFamily: fontFamily.regular,
    // fontWeight: '600',
    marginLeft: 8,
  },
  otpIllustration: {
    width: responsiveWidth('100%'),
    height: responsiveWidth('50%'),
    resizeMode: 'contain',
    // marginTop: 16,
    // marginBottom: 8,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // marginHorizontal: 24,
    marginBottom: responsiveWidth('5%'),
    marginTop: -responsiveWidth('1%'),
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
  forgotPasswordBtn: {
    alignSelf: 'flex-end',
    // marginBottom: 12,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  resendText: {
    color: '#EEE5CA',
    fontSize: 16,
    fontFamily: fontFamily.regular,
  },
  resendLink: {
    color: '#DF8A5D',
    fontSize: 16,
    fontFamily: fontFamily.regular,
    fontWeight: '700',
  },
  googleG: {
    color: '#4285F4',
    fontWeight: 'bold',
    fontSize: 20,
    fontFamily: fontFamily.regular,
  },
  verifyButton: {
    backgroundColor: '#DF8A5D',
    borderRadius: 10,
    marginHorizontal: responsiveWidth('3%'),
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  verifyButtonText: {
    color: '#EEE5CA',
    fontFamily: fontFamily.regular,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  instructionText: {
    fontFamily: fontFamily.regular, // Make sure this font is linked in your project
    fontWeight: '500',
    fontStyle: 'normal',
    fontSize: 24,
    lineHeight: 36, // 150% of 24px
    letterSpacing: 0.6,
    color: '#EEE5CA',
    textAlign: 'center',
    verticalAlign: 'middle', // Not always supported, but included for completeness
    marginBottom: 4,
  },
  emailText: {
    fontFamily: fontFamily.regular, // Make sure this font is linked in your project
    fontWeight: '400',
    fontStyle: 'normal',
    fontSize: 20,
    lineHeight: 30, // 150% of 20px
    letterSpacing: 0.6,
    color: '#EEE5CA',
    textAlign: 'center',
    verticalAlign: 'middle', // Not always supported, but included for completeness
    marginBottom: 24,
  },
});

export default ForgotPasswordOtp;
