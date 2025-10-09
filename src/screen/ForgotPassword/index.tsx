// HomeScreen.tsx

import React, { useState } from 'react';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const userService = new UserService();

  const isValidEmail = (value: string) =>
    /^(?!\.)[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value.trim());

  const handleSend = async () => {
    const trimmed = email.trim();
    if (!trimmed || !isValidEmail(trimmed)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await userService.forgotPassword(trimmed);
      Alert.alert(
        'Success',
        response?.message || 'Password reset link sent to your email.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ],
      );
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to send reset link');
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
              source={require('../../assets/icons/Subtract-dark.png')}
              style={styles.sunIcon}
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
            />
            {/* Send OTP Button */}
            <TouchableOpacity
              onPress={handleSend}
              style={styles.sendOtpButton}
              disabled={isSubmitting}
            >
              <Text style={styles.sendOtpButtonText}>
                {isSubmitting ? 'Sending...' : 'Send'}
              </Text>
            </TouchableOpacity>
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
});

export default ForgotPassword;
