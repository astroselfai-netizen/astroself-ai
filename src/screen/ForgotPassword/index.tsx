// HomeScreen.tsx

import React, { useMemo, useRef, useState } from 'react';
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
  Alert,
  Modal,
  StatusBar,
} from 'react-native';
import { responsiveWidth, fontFamily, color } from '../../constant/theme';
// import serviceFactory from '../../services/serviceFactory';
// import UserService from '../../services/user/user.service';
// import {InputBox} from '../../components/common/inputBox';

// import Bigball from '../../assets/svgs/bigball.svg';
// import IcBall from '../../assets/svgs/icBall.svg';
// import Bg from '../../assets/svgs/bg.svg';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthContainer } from '../../components/common/AuthContainer';
// use require for images to avoid TS module declaration issues
import UserService from '../../services/user/user.service';
import { useTheme } from '../../context/ThemeContext';

export type RootStackParamList = {
  Login: undefined; // Login screen
  Register: undefined; // Register screen
  ForgotPassword: undefined;
  HomeScreen: undefined;
  ContinueWithOtp: undefined;
  ForgotPasswordOtp: undefined;
  // Add other screens as needed
};

// Define your navigation prop type
type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Login'
>;

// (unused validation removed)

const ForgotPassword = () => {
  const { theme, colors } = useTheme();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackTitle, setFeedbackTitle] = useState<'Success' | 'Error'>(
    'Success',
  );
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [navigateToLoginOnClose, setNavigateToLoginOnClose] = useState(false);
  const userService = new UserService();

  const isValidEmail = (value: string) =>
    /^(?!\.)[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value.trim());

  const otpRefs = useRef<Array<TextInput | null>>([]);
  const otpDigits = useMemo(() => {
    const digitsOnly = (otp || '').replace(/\D/g, '').slice(0, 6);
    const arr = digitsOnly.split('');
    while (arr.length < 6) arr.push('');
    return arr;
  }, [otp]);

  const handleSendOtp = async () => {
    const trimmed = email.trim();
    if (!trimmed || !isValidEmail(trimmed)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await userService.requestEmailOtp(trimmed);
      setFeedbackTitle('Success');
      setFeedbackMessage(
        response?.message || 'OTP sent to your email.',
      );
      setNavigateToLoginOnClose(false);
      setFeedbackModalVisible(true);
      setStep('otp');
    } catch (error: any) {
      setFeedbackTitle('Error');
      setFeedbackMessage(error?.message || 'Failed to send reset link');
      setNavigateToLoginOnClose(false);
      setFeedbackModalVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    const trimmed = email.trim();
    const trimmedOtp = otp.trim();
    if (!trimmed || !isValidEmail(trimmed)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }
    if (!trimmedOtp) {
      Alert.alert('Invalid OTP', 'Please enter OTP');
      return;
    }
    if (trimmedOtp.replace(/\D/g, '').length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter 6 digit OTP');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await userService.verifyEmail(trimmed, trimmedOtp);
      setFeedbackTitle('Success');
      setFeedbackMessage(response?.message || 'OTP verified successfully.');
      setNavigateToLoginOnClose(false);
      setFeedbackModalVisible(true);
      setStep('reset');
    } catch (error: any) {
      setFeedbackTitle('Error');
      setFeedbackMessage(error?.message || 'Failed to verify OTP');
      setNavigateToLoginOnClose(false);
      setFeedbackModalVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    const trimmed = email.trim();
    if (!trimmed || !isValidEmail(trimmed)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }
    if (!newPassword.trim()) {
      Alert.alert('Invalid Password', 'Please enter new password');
      return;
    }
    if (newPassword.trim().length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters');
      return;
    }
    if (newPassword.trim() !== confirmPassword.trim()) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await userService.resetPasswordOtp(
        trimmed,
        newPassword.trim(),
      );
      setFeedbackTitle('Success');
      setFeedbackMessage(response?.message || 'Password reset successfully.');
      setNavigateToLoginOnClose(true);
      setFeedbackModalVisible(true);
    } catch (error: any) {
      setFeedbackTitle('Error');
      setFeedbackMessage(error?.message || 'Failed to reset password');
      setNavigateToLoginOnClose(false);
      setFeedbackModalVisible(true);
    } finally {
      setIsSubmitting(false);
    }
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
          {/* Top Bar */}
          <View style={styles.topBar}>
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
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
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
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              >
                Forgot Password
              </Text>
            </View>
          </View>
          {/* Sun Icon and Astroself */}
          <View style={styles.centeredHeader}>
            <Image
              source={theme === 'dark'
                ? require('../../assets/icons/Subtract-dark.png')
                : require('../../assets/icons/Subtract-dark.png')}
              style={[styles.sunIcon,theme === 'dark' ? { tintColor: colors.themeTextWhite } : { tintColor: colors.DarkNavy }]}
            />
            {/* <Text style={styles.astroselfText}>Astroself</Text> */}
          </View>
          {/* Lock and Key Image */}
          <View style={styles.lockKeyContainer}>
            <Image
              source={require('../../assets/image/lock.png')}
              style={styles.lockKeyImage}
            />
          </View>
          {/* Email Input */}
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
              placeholder="Enter your registered email id"
              placeholderTextColor={
                theme === 'dark' ? colors.themeTextWhite : colors.themelightText
              }
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={step === 'email'}
            />

            {step === 'otp' && (
              <View style={styles.otpContainer}>
                {otpDigits.map((d, idx) => (
                  <TextInput
                    key={`otp-${idx}`}
                    ref={r => {
                      otpRefs.current[idx] = r;
                    }}
                    value={d}
                    onChangeText={text => {
                      const digits = (text || '').replace(/\D/g, '');

                      // Handle paste / autofill "123456" into any box.
                      if (digits.length > 1) {
                        const next = digits.slice(0, 6).split('');
                        while (next.length < 6) next.push('');
                        setOtp(next.join(''));
                        const lastFilled = Math.min(digits.length, 6) - 1;
                        otpRefs.current[lastFilled]?.focus();
                        return;
                      }

                      const current = [...otpDigits];
                      current[idx] = digits.slice(-1);
                      const joined = current.join('').replace(/\s/g, '');
                      setOtp(joined);

                      if (digits && idx < 5) {
                        otpRefs.current[idx + 1]?.focus();
                      }
                    }}
                    onKeyPress={({ nativeEvent }) => {
                      if (nativeEvent.key === 'Backspace') {
                        if (otpDigits[idx]) {
                          const current = [...otpDigits];
                          current[idx] = '';
                          setOtp(current.join(''));
                          return;
                        }
                        if (idx > 0) {
                          otpRefs.current[idx - 1]?.focus();
                          const current = [...otpDigits];
                          current[idx - 1] = '';
                          setOtp(current.join(''));
                        }
                      }
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus={idx === 0}
                    textAlign="center"
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
                    placeholder="•"
                    placeholderTextColor={
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.themelightText
                    }
                  />
                ))}
              </View>
            )}

            {step === 'reset' && (
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
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                  placeholder="New password"
                  placeholderTextColor={
                    theme === 'dark'
                      ? colors.themeTextWhite
                      : colors.themelightText
                  }
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
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
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                  placeholder="Confirm new password"
                  placeholderTextColor={
                    theme === 'dark'
                      ? colors.themeTextWhite
                      : colors.themelightText
                  }
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </>
            )}

            {/* Primary Button */}
            <TouchableOpacity
              onPress={
                step === 'email'
                  ? handleSendOtp
                  : step === 'otp'
                    ? handleVerifyOtp
                    : handleResetPassword
              }
              style={styles.sendOtpButton}
              disabled={isSubmitting}
            >
              <Text style={styles.sendOtpButtonText}>
                {isSubmitting
                  ? 'Please wait...'
                  : step === 'email'
                    ? 'Send OTP'
                    : step === 'otp'
                      ? 'Verify OTP'
                      : 'Reset Password'}
              </Text>
            </TouchableOpacity>

            {step !== 'email' && (
              <TouchableOpacity
                onPress={() => {
                  setStep('email');
                  setOtp('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                disabled={isSubmitting}
                style={styles.secondaryButton}
              >
                <Text
                  style={[
                    styles.secondaryButtonText,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  Change email
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        <Modal
          visible={feedbackModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setFeedbackModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.cardBackground : colors.white,
                  borderColor:
                    theme === 'dark'
                      ? colors.themeBorderDropdown
                      : colors.borderColor,
                },
              ]}
            >
              <Text
                style={[
                  styles.modalTitle,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              >
                {feedbackTitle}
              </Text>
              <Text
                style={[
                  styles.modalMessage,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              >
                {feedbackMessage}
              </Text>

              <TouchableOpacity
                style={styles.modalOkButton}
                onPress={() => {
                  setFeedbackModalVisible(false);
                  if (navigateToLoginOnClose) {
                    navigation.navigate('Login');
                  }
                }}
              >
                <Text style={styles.modalOkButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop:
      Platform.OS === 'android'
        ? -responsiveWidth('1%')
        : responsiveWidth('13%'),
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
    // justifyContent: 'center',

    paddingHorizontal: 16,
  },
  backBtn: {
    marginRight: 8,
  },
  backIcon: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    resizeMode: 'contain',
    tintColor: '#FFFFFF',
  },
  topBarText: {
    color: color.themeTextWhite,
    fontSize: 24,
    // fontWeight: '600',
    marginLeft: 4,
    alignSelf: 'center',
    fontFamily: fontFamily.regular,
  },
  backIconWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  centeredHeader: {
    alignItems: 'center',
    marginTop: responsiveWidth('2%'),
    // marginBottom: 16,
  },
  sunIcon: {
    width: responsiveWidth('100%'),
    height: responsiveWidth('10%'),
    resizeMode: 'contain',
    marginTop: responsiveWidth('5%'),
  },
  astroselfText: {
    color: '#F6EFD9',
    fontSize: 40,
    fontWeight: '700',
    fontFamily: fontFamily.regular,
  },
  lockKeyContainer: {
    alignItems: 'center',
    marginTop: -responsiveWidth('2%'),
    // marginBottom: responsiveWidth('15%'),
  },
  lockKeyImage: {
    width: responsiveWidth('100%'),
    height: responsiveWidth('50'),
    resizeMode: 'contain',
  },
  formContainer: {
    paddingHorizontal: 24,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#223149',
    borderRadius: 10,
    paddingHorizontal: responsiveWidth('2.5'),
    paddingVertical: responsiveWidth('3'),
    color: color.themeTextWhite,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#496CA8',
    fontFamily: fontFamily.regular,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  otpBox: {
    width: responsiveWidth('12.5'),
    height: responsiveWidth('12.5'),
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 18,
    fontFamily: fontFamily.regular,
    fontWeight: '700',
    paddingVertical: 0,
  },
  sendOtpButton: {
    backgroundColor: '#DF8A5D',
    borderRadius: 10,
    paddingVertical: responsiveWidth('2.5'),
    alignItems: 'center',
    marginBottom: 16,
  },
  sendOtpButtonText: {
    color: color.themeTextWhite,
    fontFamily: fontFamily.regular,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  secondaryButton: {
    marginTop: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fontFamily.regular,
    fontWeight: '700',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
    marginBottom: 16,
  },
  modalOkButton: {
    backgroundColor: '#DF8A5D',
    borderRadius: 10,
    paddingVertical: responsiveWidth('2.5'),
    alignItems: 'center',
  },
  modalOkButtonText: {
    color: color.themeTextWhite,
    fontFamily: fontFamily.regular,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: 0.6,
    textAlign: 'center',
  },
});

export default ForgotPassword;
