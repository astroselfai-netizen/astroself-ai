import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Platform,
} from 'react-native';
import appleAuth, {
  AppleButton,
  AppleButtonStyle,
  AppleButtonType,
} from '@invertase/react-native-apple-authentication';
import { responsiveWidth } from '../../constant/theme';
import { useTheme } from '../../context/ThemeContext';

interface AppleLoginButtonProps {
  onPress: () => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  buttonText?: string;
  buttonType?: 'sign-in' | 'sign-up';
}

const AppleLoginButton: React.FC<AppleLoginButtonProps> = ({
  onPress,
  isLoading = false,
  disabled = false,
  buttonText,
  buttonType = 'sign-in',
}) => {
  const { theme, colors } = useTheme();
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    // Check if Apple Sign In is available (iOS 13+ only)
    if (Platform.OS === 'ios') {
      try {
        setIsAvailable(appleAuth.isSupported);
      } catch (error) {
        console.log('Apple Auth availability check error:', error);
        setIsAvailable(false);
      }
    } else {
      setIsAvailable(false);
    }
  }, []);

  // Don't render on Android or if Apple Sign In is not available
  if (Platform.OS !== 'ios' || !isAvailable) {
    return null;
  }

  // Use native Apple button if available
  if (isAvailable && appleAuth.isSupported) {
    // Use enum values if available, otherwise fall back to string literals
    const buttonStyle: AppleButtonStyle = theme === 'dark'
      ? (AppleButtonStyle?.WHITE ?? ('White' as AppleButtonStyle))
      : (AppleButtonStyle?.BLACK ?? ('Black' as AppleButtonStyle));
    
    const buttonTypeValue: AppleButtonType = buttonType === 'sign-up'
      ? (AppleButtonType?.SIGN_UP ?? ('SignUp' as AppleButtonType))
      : (AppleButtonType?.SIGN_IN ?? ('SignIn' as AppleButtonType));

    return (
      <View style={styles.container}>
        <AppleButton
          buttonStyle={buttonStyle}
          buttonType={buttonTypeValue}
          cornerRadius={10}
          style={[
            styles.appleButton,
            (isLoading || disabled) && styles.buttonDisabled,
          ]}
          onPress={isLoading || disabled ? () => {} : onPress}
        />
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator
              size="small"
              color={theme === 'dark' ? colors.DarkNavy : colors.white}
            />
          </View>
        )}
      </View>
    );
  }

  // Fallback custom button (shouldn't reach here if Apple Auth is supported)
  const defaultText =
    buttonText ||
    (buttonType === 'sign-up' ? 'Sign up with Apple' : 'Sign in with Apple');

  return (
    <TouchableOpacity
      style={[
        styles.customButton,
        {
          backgroundColor: theme === 'dark' ? colors.white : colors.DarkNavy,
          borderColor:
            theme === 'dark' ? colors.themeTextWhite : colors.primaryBlue,
        },
        (isLoading || disabled) && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={isLoading || disabled}
    >
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator
            size="small"
            color={theme === 'dark' ? colors.DarkNavy : colors.white}
          />
          <Text
            style={[
              styles.buttonText,
              styles.loadingText,
              {
                color: theme === 'dark' ? colors.DarkNavy : colors.white,
              },
            ]}
          >
            {buttonType === 'sign-up' ? 'Signing up...' : 'Signing in...'}
          </Text>
        </View>
      ) : (
        <Text
          style={[
            styles.buttonText,
            {
              color: theme === 'dark' ? colors.DarkNavy : colors.white,
            },
          ]}
        >
          {defaultText}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: responsiveWidth('5%'),
  },
  appleButton: {
    width: '100%',
    height: 50,
  },
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: responsiveWidth('2.5%'),
    marginBottom: responsiveWidth('5%'),
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 10,
  },
});

export default AppleLoginButton;

