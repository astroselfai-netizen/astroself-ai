import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { fontFamily } from '../constant/theme';

const { width } = Dimensions.get('window');

const AstroselfLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    console.log('Email:', email, 'Password:', password);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logoText}>☀️ Astrodha</Text>
      </View>

      {/* Illustration */}
      <View style={styles.illustration}>
        <Text style={{ fontSize: 60, fontFamily: fontFamily.regular }}>🪐</Text>
        <Text style={{ fontSize: 80, fontFamily: fontFamily.regular }}>🔮</Text>
      </View>

      {/* Login Form */}
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#8E9AAF"
          value={email}
          onChangeText={setEmail}
        />

        <View style={styles.passwordWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#8E9AAF"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={{ fontSize: 18, fontFamily: fontFamily.regular }}>{showPassword ? '👁️' : '🙈'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity onPress={handleLogin} style={styles.loginButton}>
          <LinearGradient
            colors={['#FF8C42', '#FF6B35']}
            style={styles.buttonGradient}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* OTP Button */}
        <TouchableOpacity style={styles.otpButton}>
          <Text style={styles.otpButtonText}>Continue with OTP</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google Login */}
        <TouchableOpacity style={styles.googleButton}>
          {/* <Text style={styles.googleIcon}>G</Text> */}
          {/* <Im */}
          <Text style={styles.googleButtonText}>Login with Google</Text>
        </TouchableOpacity>

        {/* Register Link */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Don't have account? </Text>
          <TouchableOpacity>
            <Text style={styles.registerLink}>Register Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1C2C',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: fontFamily.regular,
  },
  illustration: {
    alignItems: 'center',
    marginVertical: 40,
  },
  formContainer: {
    flex: 1,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(142, 154, 175, 0.3)',
    fontFamily: fontFamily.regular,
  },
  passwordWrapper: {
    position: 'relative',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 20,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#8E9AAF',
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: fontFamily.regular,
  },
  otpButton: {
    borderWidth: 2,
    borderColor: '#FF8C42',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  otpButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fontFamily.regular,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(142, 154, 175, 0.3)',
  },
  dividerText: {
    color: '#8E9AAF',
    marginHorizontal: 16,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(142,154,175,0.3)',
    paddingVertical: 16,
    marginBottom: 32,
  },
  googleIcon: {
    backgroundColor: '#fff',
    color: '#4285F4',
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 10,
    fontWeight: 'bold',
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fontFamily.regular,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  registerText: {
    color: '#8E9AAF',
    fontFamily: fontFamily.regular,
  },
  registerLink: {
    color: '#FF8C42',
    fontWeight: 'bold',
    fontFamily: fontFamily.regular,
  },
});

export default AstroselfLogin;
