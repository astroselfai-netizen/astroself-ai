import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import { Platform } from 'react-native';
import { Service } from './Service';
import UserService from './user/user.service';
import serviceFactory from './serviceFactory';
import notificationService from './notificationService';

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
    GoogleSignin.configure({
      iosClientId:
        '1061722426474-h0pi8l8lecf8mcba76er53ffc21ho48v.apps.googleusercontent.com',
      // androidClientId: '1061722426474-3aivdpu11tr8i1h52a54ovkrv8ls021p.apps.googleusercontent.com',
      webClientId:
        Platform.OS === 'ios'
          ? '1061722426474-h0pi8l8lecf8mcba76er53ffc21ho48v.apps.googleusercontent.com' // iOS web client ID
          : '1061722426474-3aivdpu11tr8i1h52a54ovkrv8ls021p.apps.googleusercontent.com', // Android web client ID
      // '1061722426474-1bo41g5vpq34c3qaa9v1t18qofjkurq1.apps.googleusercontent.com', // Android web client ID
      offlineAccess: true,
      hostedDomain: '',
      forceCodeForRefreshToken: true,
    });
  }

  public async signInWithGoogle(): Promise<any> {
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
      
      // Register or login the user with your backend API
      const apiResponse = await this.registerOrLoginGoogleUser(userCredential.user, fcmToken || undefined);
      
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
          error: apiResponse.error || 'Failed to register/login with backend',
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
      } else {
        return {
          success: false,
          error: error.message || 'Something went wrong with Google Sign-In',
        };
      }
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
        console.log('Login failed, user might be new. Trying registration:', loginError);
        
        // If login fails, try to register (new user)
        try {
          const registerResponse = await userService.register({
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            phone: userData.phone || '+91', // Default phone if not available
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
          console.log('Both login and registration failed:', registerError);
          
          // If both fail, return the Firebase user data as fallback
          return {
            success: true,
            user: {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              photoURL: firebaseUser.photoURL,
              provider: 'google',
            },
            token: null, // No backend token available
            isNewUser: true,
            fallback: true, // Indicates this is a fallback response
          };
        }
      }
    } catch (error: any) {
      console.log('Google User Registration/Login Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to register/login Google user',
      };
    }
  }

  // Helper method to check if user exists (optional - for future use)
  private async checkUserExists(_email: string): Promise<boolean> {
    // This would require a separate API endpoint to check user existence
    // For now, we'll rely on the login attempt to determine if user exists
    return false;
  }
}

export default GoogleAuthService;
