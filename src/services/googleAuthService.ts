import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { beginExternalAuthSession } from '../utils/hardRefreshGate';
import auth from '@react-native-firebase/auth';
import { Platform } from 'react-native';
import { Service } from './Service';
import UserService from './user/user.service';
import serviceFactory from './serviceFactory';
import notificationService from './notificationService';

function extractApiErrorMessage(error: unknown): string {
  if (!error) {
    return '';
  }

  const err = error as {
    message?: string;
    response?: { data?: unknown };
  };

  const data = err.response?.data;

  if (typeof data === 'string' && data.trim()) {
    return data.trim();
  }

  if (data && typeof data === 'object') {
    const payload = data as Record<string, unknown>;
    const fields = ['message', 'error_message', 'detail', 'error'];

    for (const field of fields) {
      const value = payload[field];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
  }

  const message = err.message?.trim() || '';
  if (message && !/^Request failed with status code \d+$/i.test(message)) {
    return message;
  }

  return '';
}

function isUserNotRegisteredError(error: any): boolean {
  const message = (
    error?.message ||
    error?.response?.data?.message ||
    error?.response?.data?.error_message ||
    ''
  ).toLowerCase();

  return (
    message.includes('not registered') ||
    message.includes('sign up first') ||
    message.includes('please register')
  );
}

class GoogleAuthService extends Service {
  private static instance: GoogleAuthService;

  private constructor() {
    super();
    this.configureGoogleSignIn();
  }

  public static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  private configureGoogleSignIn() {
    // ONLY client_type: 3 from google-services.json (Web). Never use client_type: 1 (Android).
    // Wrong IDs that cause DEVELOPER_ERROR: 01iq149..., aa366f05..., 128164235380-...
    const webClientId =
      '279160023240-0thjsthpl0gkvm80bb98a2etai3q0s6v.apps.googleusercontent.com';

    GoogleSignin.configure({
      ...(Platform.OS === 'ios'
        ? {
            iosClientId:
              '279160023240-0thjsthpl0gkvm80bb98a2etai3q0s6v.apps.googleusercontent.com',
          }
        : {}),
      webClientId,
      offlineAccess: true,
      hostedDomain: '',
      forceCodeForRefreshToken: true,
    });
  }

  public async signInWithGoogle(): Promise<any> {
    const endExternalAuth = beginExternalAuthSession();
    try {
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Get the users ID token
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;
      
      if (!idToken) {
        return {
          success: false,
          error: 'Failed to get ID token from Google Sign-In',
        };
      }
      
      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      
      // Sign-in the user with the credential
      const userCredential = await auth().signInWithCredential(googleCredential);

      console.log('userCredential', userCredential);
      
      // Get FCM token (reuse stored token if available, generate only if needed)
      let fcmToken: string | null = null;
      try {
        fcmToken = await notificationService.getOrCreateFCMToken();
        console.log('FCM Token for Google login:', fcmToken);
      } catch (error) {
        console.error('Error getting FCM token for Google login:', error);
        // Continue with login even if FCM token fails
      }


      console.log('====================================');
      console.log('userCredential', userCredential);
      console.log('====================================');
      // Register or login the user with your backend API
      const apiResponse = await this.registerOrLoginGoogleUser(userCredential.user, fcmToken || undefined);


      console.log('====================================');
      console.log('apiResponse', apiResponse);
      console.log('====================================');
      
      if (apiResponse.success) {
        return {
          success: true,
          user: apiResponse.user,
          token: apiResponse.token,
          isNewUser: apiResponse.isNewUser,
          fallback: apiResponse.fallback,
          firebaseUser: userCredential.user,
          idToken,
        };
      } else {
        return {
          success: false,
          error: apiResponse.error || '',
          firebaseUser: userCredential.user,
        };
      }
    } catch (error: any) {
      console.log('Google Sign-In Error:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return {
          success: false,
          error: 'User cancelled the login flow',
        };
      } else if (error.code === statusCodes.IN_PROGRESS) {
        return {
          success: false,
          error: 'Sign in is in progress already',
        };
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return {
          success: false,
          error: 'Play services not available',
        };
      } else if (
        error.code === '10' ||
        error.message?.includes('DEVELOPER_ERROR')
      ) {
        return {
          success: false,
          error:
            'Google Sign-In config error (DEVELOPER_ERROR). Firebase project astrodha-b8493: add Play Store App signing SHA-1 for com.astrodha.ai, enable Google in Authentication, then download a fresh google-services.json.',
        };
      } else {
        return {
          success: false,
          error: error.message || 'Something went wrong with Google Sign-In',
        };
      }
    } finally {
      endExternalAuth();
    }
  }

  public async signOut(): Promise<void> {
    try {
      await GoogleSignin.signOut();
      await auth().signOut();
    } catch (error) {
      console.log('Google Sign-Out Error:', error);
    }
  }

  public async getCurrentUser() {
    try {
      const user = await GoogleSignin.getCurrentUser();
      return user;
    } catch (error) {
      console.log('Get Current User Error:', error);
      return null;
    }
  }

  public async isSignedIn(): Promise<boolean> {
    try {
      const currentUser = await GoogleSignin.getCurrentUser();
      return currentUser !== null;
    } catch (error) {
      console.log('Check Sign-In Status Error:', error);
      return false;
    }
  }

  public async registerOrLoginGoogleUser(firebaseUser: any, fcmToken?: string): Promise<any> {
    try {
      const userService = serviceFactory.get<UserService>('UserService');
      
      // Extract user data from Firebase Auth response
      const userData = {
        firstName: firebaseUser.displayName?.split(' ')[0] || '',
        lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
        email: firebaseUser.email,
        phone: firebaseUser.phoneNumber || '', // Google users might not have phone
        password: 'google_auth_' + firebaseUser.uid, // Generate a dummy password for Google users
        photoURL: firebaseUser.photoURL,
        provider: 'google',
        uid: firebaseUser.uid,
      };

      console.log('Google User Data:', userData);
      console.log('FCM Token for Google login API:', fcmToken || 'not provided');

      // First try to login (user might already exist)
      try {
        const loginResponse = await userService.login(
          userData.email,
          userData.password,
          fcmToken
        );

        console.log('Google User Login Success (Existing User):', loginResponse);
        return {
          success: true,
          user: loginResponse.data,
          token: loginResponse.access_token,
          isNewUser: false,
        };
      } catch (loginError: any) {
        console.log('Password login failed, trying email-only login:', loginError);

        const emailOnlyResponse = await this.tryEmailOnlyLogin(
          userService,
          userData.email,
          fcmToken,
        );
        if (emailOnlyResponse?.success) {
          return emailOnlyResponse;
        }

        console.log('Email-only login failed, trying registration');

        const emailOnlyError = emailOnlyResponse?.error;
        if (
          isUserNotRegisteredError(loginError) ||
          isUserNotRegisteredError(emailOnlyError)
        ) {
          try {
            const registerResponse = await userService.registerAstrologer({
              first_name:
                userData.firstName ||
                userData.email?.split('@')[0] ||
                'User',
              last_name: userData.lastName || '',
              email: userData.email,
              password: userData.password,
              experience: '1',
              bio: 'Registered via Google',
            });

            console.log(
              'Google User Astrologer Registration Success:',
              registerResponse,
            );
            return {
              success: true,
              user: registerResponse.data,
              token: registerResponse.access_token,
              isNewUser: true,
            };
          } catch (registerError: any) {
            console.log('Astrologer registration failed:', registerError);

            const errorMessage = extractApiErrorMessage(registerError);
            const isUserExistsError =
              errorMessage.toLowerCase().includes('already exists') ||
              errorMessage.toLowerCase().includes('user already exists') ||
              errorMessage.toLowerCase().includes('email already exists');

            if (isUserExistsError) {
              const existingUserResponse = await this.tryEmailOnlyLogin(
                userService,
                userData.email,
                fcmToken,
              );
              if (existingUserResponse?.success) {
                return existingUserResponse;
              }
            }

            return {
              success: false,
              error: errorMessage,
            };
          }
        }

        const backendError =
          extractApiErrorMessage(loginError) ||
          extractApiErrorMessage(emailOnlyError);

        return {
          success: false,
          error: backendError,
        };
        /*
        try {
          const registerResponse = await userService.register({
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            phone: userData.phone || '+91',
            password: userData.password,
            fcmToken: fcmToken,
          });

          console.log('Google User Registration Success (New User):', registerResponse);
          return {
            success: true,
            user: registerResponse.data,
            token: registerResponse.access_token,
            isNewUser: true,
          };
        } catch (registerError: any) {
          console.log('Registration failed:', registerError);

          const errorMessage =
            registerError?.response?.data?.message ||
            registerError?.response?.data?.error_message ||
            registerError?.message ||
            '';
          const isUserExistsError =
            errorMessage.toLowerCase().includes('already exists') ||
            errorMessage.toLowerCase().includes('user already exists') ||
            errorMessage.toLowerCase().includes('email already exists');

          if (isUserExistsError) {
            const existingUserResponse = await this.tryEmailOnlyLogin(
              userService,
              userData.email,
              fcmToken,
            );
            if (existingUserResponse) {
              return existingUserResponse;
            }
          }

          const status = registerError?.response?.status ?? loginError?.response?.status;
          if (status && status >= 500) {
            return {
              success: false,
              error:
                'Server is temporarily unavailable (503/5xx). Please try again in a few minutes.',
            };
          }

          return {
            success: false,
            error: errorMessage || 'Failed to register/login with backend',
          };
        }
        */
      }
    } catch (error: any) {
      console.log('Google User Registration/Login Error:', error);
      return {
        success: false,
        error: extractApiErrorMessage(error),
      };
    }
  }

  private async tryEmailOnlyLogin(
    userService: UserService,
    email: string,
    fcmToken?: string,
  ): Promise<
    | {
        success: true;
        user: any;
        token: string;
        isNewUser: false;
      }
    | { success: false; error: any }
  > {
    try {
      const loginResponse = await userService.login(email, undefined, fcmToken);
      if (loginResponse.access_token && loginResponse.data) {
        console.log('Email-only login success:', loginResponse);
        return {
          success: true,
          user: loginResponse.data,
          token: loginResponse.access_token,
          isNewUser: false,
        };
      }
    } catch (error) {
      console.log('Email-only login failed:', error);
      return { success: false, error: extractApiErrorMessage(error) };
    }
    return { success: false, error: '' };
  }

  // Helper method to check if user exists (optional - for future use)
  private async checkUserExists(_email: string): Promise<boolean> {
    // This would require a separate API endpoint to check user existence
    // For now, we'll rely on the login attempt to determine if user exists
    return false;
  }
}

export default GoogleAuthService;
