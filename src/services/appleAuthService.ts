import { Platform } from 'react-native';
import appleAuth from '@invertase/react-native-apple-authentication';
import { Service } from './Service';
import UserService from './user/user.service';
import serviceFactory from './serviceFactory';
import notificationService from './notificationService';

class AppleAuthService extends Service {
  private static instance: AppleAuthService;

  private constructor() {
    super();
  }

  public static getInstance(): AppleAuthService {
    if (!AppleAuthService.instance) {
      AppleAuthService.instance = new AppleAuthService();
    }
    return AppleAuthService.instance;
  }

  /**
   * Decode JWT token to extract email and other claims
   * Uses base64 decoding compatible with React Native
   */
  private decodeJWT(token: string): any {
    try {
      // JWT has 3 parts: header.payload.signature
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      // Decode the payload (second part)
      const payload = parts[1];
      
      // Add padding if needed for base64 decoding
      const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
      
      // Convert base64url to base64 format
      let base64 = paddedPayload.replace(/-/g, '+').replace(/_/g, '/');
      base64 = base64.replace(/[^A-Za-z0-9+/=]/g, '');
      
      // Decode base64 - React Native doesn't have Buffer, so use manual decoding
      let decodedPayload: string;
      try {
        // Manual base64 decoding for React Native
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        let result = '';
        let i = 0;
        
        while (i < base64.length) {
          const enc1 = chars.indexOf(base64.charAt(i++));
          const enc2 = chars.indexOf(base64.charAt(i++));
          const enc3 = chars.indexOf(base64.charAt(i++));
          const enc4 = chars.indexOf(base64.charAt(i++));
          
          // eslint-disable-next-line no-bitwise
          const bits = (enc1 << 18) | (enc2 << 12) | (enc3 << 6) | enc4;
          
          if (enc3 === 64) {
            // eslint-disable-next-line no-bitwise
            result += String.fromCharCode((bits >> 16) & 255);
          } else if (enc4 === 64) {
            // eslint-disable-next-line no-bitwise
            result += String.fromCharCode((bits >> 16) & 255, (bits >> 8) & 255);
          } else {
            // eslint-disable-next-line no-bitwise
            result += String.fromCharCode((bits >> 16) & 255, (bits >> 8) & 255, bits & 255);
          }
        }
        
        decodedPayload = result;
      } catch (decodeError) {
        console.error('Error in base64 decoding:', decodeError);
        return null;
      }
      
      // Parse JSON
      return JSON.parse(decodedPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  }

  /**
   * Check if Apple Sign In is available on this device
   * Only available on iOS 13+
   */
  public async isAvailable(): Promise<boolean> {
      if (Platform.OS !== 'ios') {
        return false;
      }
      try {
        return appleAuth.isSupported;
      } catch (error) {
        console.log('Apple Auth availability check error:', error);
        return false;
      }
  }

  /**
   * Sign in with Apple
   * Requests FULL_NAME and EMAIL scopes
   */
  public async signInWithApple(): Promise<any> {
    try {
      // Check if Apple Sign In is available
      if (!(await this.isAvailable())) {
        return {
          success: false,
          error: 'Apple Sign In is not available on this device',
        };
      }

      // Perform the sign-in request
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [
          appleAuth.Scope.FULL_NAME,
          appleAuth.Scope.EMAIL,
        ],
      });

      console.log('Apple Auth Response:', appleAuthRequestResponse);

      // Check if the request was successful
      if (!appleAuthRequestResponse.identityToken) {
        return {
          success: false,
          error: 'Failed to get identity token from Apple Sign-In',
        };
      }

      // Get credential state to check if user is authenticated
      const credentialState = await appleAuth.getCredentialStateForUser(
        appleAuthRequestResponse.user,
      );

      console.log('credentialState', credentialState);

      if (credentialState !== appleAuth.State.AUTHORIZED) {
        return {
          success: false,
          error: 'Apple Sign-In authorization failed',
        };
      }

      // Extract user data
      const appleId = appleAuthRequestResponse.user;
      const identityToken = appleAuthRequestResponse.identityToken;
      let email = appleAuthRequestResponse.email || null;
      const fullName = appleAuthRequestResponse.fullName;

      // If email is null, try to extract it from identityToken (JWT)
      if (!email && identityToken) {
        const decodedToken = this.decodeJWT(identityToken);
        if (decodedToken && decodedToken.email) {
          email = decodedToken.email;
          console.log('Email extracted from identityToken:', email);
        }
      }

      // Construct full name
      let firstName = '';
      let lastName = '';
      if (fullName) {
        firstName = fullName.givenName || '';
        lastName = fullName.familyName || '';
      } else {
        // If fullName is null, use default values
        // Note: Apple doesn't include name in JWT, only email
        // So we'll use default values - backend can update later if needed
        firstName = 'Apple';
        lastName = 'User';
      }

      // Get FCM token
      let fcmToken: string | null = null;
      try {
        fcmToken = await notificationService.getOrCreateFCMToken();
        console.log('FCM Token for Apple login:', fcmToken);
      } catch (error) {
        console.error('Error getting FCM token for Apple login:', error);
      }

      // Register or login the user with your backend API
      const apiResponse = await this.registerOrLoginAppleUser(
        {
          appleId,
          email,
          firstName,
          lastName,
          identityToken,
        },
        fcmToken || undefined,
      );

      if (apiResponse.success) {
        return {
          success: true,
          user: apiResponse.user,
          token: apiResponse.token,
          isNewUser: apiResponse.isNewUser,
          fallback: apiResponse.fallback,
          appleId,
          email,
          fullName: fullName
            ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim()
            : null,
          identityToken,
        };
      } else {
        return {
          success: false,
          error: apiResponse.error || 'Failed to register/login with backend',
          appleId,
          email,
          identityToken,
        };
      }
    } catch (error: any) {
      console.log('Apple Sign-In Error:', error);

      if (error.code === appleAuth.Error.CANCELED) {
        return {
          success: false,
          error: 'User cancelled the Apple Sign-In flow',
        };
      } else if (error.code === appleAuth.Error.INVALID_RESPONSE) {
        return {
          success: false,
          error: 'Invalid response from Apple Sign-In',
        };
      } else if (error.code === appleAuth.Error.NOT_HANDLED) {
        return {
          success: false,
          error: 'Apple Sign-In request not handled',
        };
      } else {
        return {
          success: false,
          error: error.message || 'Something went wrong with Apple Sign-In',
        };
      }
    }
  }

  /**
   * Register or login Apple user with backend API
   * Similar to Google auth flow: try login first, then register
   */
  public async registerOrLoginAppleUser(
    appleData: {
      appleId: string;
      email: string | null;
      firstName: string;
      lastName: string;
      identityToken: string;
    },
    fcmToken?: string,
  ): Promise<any> {
    try {
      const userService = serviceFactory.get<UserService>('UserService');

      // Validate identityToken before sending to backend
      if (!appleData.identityToken) {
        throw new Error('Invalid identity token from Apple');
      }

      // Generate a password for Apple users (similar to Google)
      const password = `apple_auth_${appleData.appleId}`;

      console.log('Apple User Data:', {
        ...appleData,
        password: '***hidden***',
      });
      console.log('FCM Token for Apple login API:', fcmToken || 'not provided');

      // If email is available, try to login first
      if (appleData.email) {
        try {
          const loginResponse = await userService.login(
            appleData.email,
            password,
            fcmToken,
          );

          console.log('Apple User Login Success (Existing User):', loginResponse);
          return {
            success: true,
            user: loginResponse.data,
            token: loginResponse.access_token,
            isNewUser: false,
          };
        } catch (loginError: any) {
          console.log(
            'Login failed, user might be new. Trying registration:',
            loginError,
          );
        }
      }

      // If login failed or email is not available, try to register
      try {
        // For registration, we need at least an email or a way to identify the user
        // If email is null, we'll use a placeholder email format
        const registrationEmail = appleData.email || `apple_${appleData.appleId}@appleid.local`;

        const registerResponse = await userService.register({
          firstName: appleData.firstName || 'Apple',
          lastName: appleData.lastName || 'User',
          email: registrationEmail,
          phone: '+91', // Default phone for Apple users
          password: password,
          fcmToken: fcmToken,
        });

        console.log('Apple User Registration Success (New User):', registerResponse);
        return {
          success: true,
          user: registerResponse.data,
          token: registerResponse.access_token,
          isNewUser: true,
        };
      } catch (registerError: any) {
        console.log('Registration failed:', registerError);
        
        // Check if error is "User already exists"
        const errorMessage = registerError?.response?.data?.message || 
                            registerError?.message || 
                            '';
        
        const isUserExistsError = errorMessage.toLowerCase().includes('already exists') ||
                                 errorMessage.toLowerCase().includes('user already exists') ||
                                 errorMessage.toLowerCase().includes('email already exists');

        // If user already exists and we have email, try login again
        if (isUserExistsError && appleData.email) {
          console.log('User already exists, trying login again with email:', appleData.email);
          try {
            const loginResponse = await userService.login(
              appleData.email,
              password,
              fcmToken,
            );

            console.log('Apple User Login Success (After Registration Failed):', loginResponse);
            return {
              success: true,
              user: loginResponse.data,
              token: loginResponse.access_token,
              isNewUser: false,
            };
          } catch (retryLoginError: any) {
            console.log('Retry login also failed:', retryLoginError);
            // Continue to fallback
          }
        }

        // If both registration and retry login failed, return error
        console.log('Both registration and login failed:', registerError);
        return {
          success: false,
          error: errorMessage || 'Failed to register/login Apple user',
          appleId: appleData.appleId,
          email: appleData.email,
        };
      }
    } catch (error: any) {
      console.log('Apple User Registration/Login Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to register/login Apple user',
      };
    }
  }

  /**
   * Sign out from Apple (if needed)
   */
  public async signOut(): Promise<void> {
    try {
      // Apple Sign-In doesn't require explicit sign-out
      // The credential state will be checked on next sign-in
      console.log('Apple Sign-Out: No explicit sign-out needed');
    } catch (error) {
      console.log('Apple Sign-Out Error:', error);
    }
  }
}

export default AppleAuthService;
