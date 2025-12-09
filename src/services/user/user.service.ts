import AsyncStorage from '@react-native-async-storage/async-storage';
import http from '../../utils/http';
import { Service } from '../Service';
import { Api, CurrentDashaTimeResponse } from '../../types/api';

// import i18next from 'i18next';

export default class UserService extends Service {
  async login(
    email: string,
    password: string,
    fcmToken?: string,
  ): Promise<{
    status: boolean;
    data: Api.User.Res.Detail;
    access_token: string;
    message?: string;
  }> {
    try {
      console.log('email--->', email, password);
      console.log('Making API call to /login with:', {
        username: email,
        password,
        fcm_token: fcmToken || 'not provided',
      });

      const payload: {
        username: string;
        password: string;
        fcm_token?: string;
      } = {
        username: email,
        password,
      };

      if (fcmToken) {
        payload.fcm_token = fcmToken;
      }

      const axiosResponse = await http.post('mobile/login', payload);

      console.log('API Response:', axiosResponse);
      console.log('API Response data:', axiosResponse.data);
      console.log('API Response status:', axiosResponse.status);

      console.log('====================================');
      console.log('axiosResponse==>123', axiosResponse.data.data);
      console.log('====================================');

      if (axiosResponse?.data?.status && axiosResponse?.data?.data) {
        // Store complete user data
        await AsyncStorage.setItem(
          'USER_DATA',
          JSON.stringify(axiosResponse.data.data),
        );

        // Store token separately
        if (axiosResponse.data.access_token) {
          await AsyncStorage.setItem(
            'USER_TOKEN',
            axiosResponse.data.access_token,
          );
        }

        return axiosResponse.data;
      }

      throw new Error(axiosResponse?.data?.error_message || 'Login failed');
    } catch (error: any) {
      console.error('Login error in service:', error);
      console.error('Login error response:', error.response);
      console.error('Login error response data:', error.response?.data);
      console.error('Login error message:', error.message);
      console.error('Login error code:', error.code);
      console.error('Login error config:', error.config);
      throw error;
    }
  }

  async register(params: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string; // may include country code like "+91 12345 67890"
    password: string;
    fcmToken?: string;
  }): Promise<{
    status: boolean;
    data: Api.User.Res.Detail;
    access_token: string;
    message?: string;
  }> {
    try {
      const { firstName, lastName, email, phone, password, fcmToken } = params;

      console.log('params==>', params);
      console.log('FCM Token for register:', fcmToken || 'not provided');

      const payload: {
        email: string;
        first_name: string;
        last_name: string;
        password: string;
        role: string;
        current_plan: string;
        complete_profile: boolean;
        members_allow: number;
        current_members: number;
        phone: string;
        fcm_token?: string;
      } = {
        email,
        first_name: firstName,
        last_name: lastName,
        password,
        role: 'user',
        current_plan: 'cosmic_foundation',
        complete_profile: false,
        members_allow: 1,
        current_members: 0,
        phone,
      };

      if (fcmToken) {
        payload.fcm_token = fcmToken;
      }

      console.log('payload-->', payload);

      const axiosResponse = await http.post('/users/mobile/register', payload);

      console.log('axiosResponse--->', axiosResponse.data);

      // On successful registration, persist user data and token similar to login
      if (axiosResponse?.data?.status && axiosResponse?.data?.data) {
        await AsyncStorage.setItem(
          'USER_DATA',
          JSON.stringify(axiosResponse.data.data),
        );
        if (axiosResponse.data.access_token) {
          await AsyncStorage.setItem(
            'USER_TOKEN',
            axiosResponse.data.access_token,
          );
        }
      }

      return axiosResponse.data;
    } catch (error) {
      throw error;
    }
  }

  async requestOtp(email: string) {
    try {
      console.log('Requesting OTP for email:', email);

      const axiosResponse = await http.post('/request-otp', {
        email,
      });

      console.log('OTP Request Response:', axiosResponse.data);

      if (axiosResponse?.data?.status) {
        return axiosResponse.data;
      }

      throw new Error(axiosResponse?.data?.message || 'Failed to send OTP');
    } catch (error: any) {
      console.error('Request OTP error in service:', error);
      throw error;
    }
  }

  async requestEmailOtp(email: string) {
    try {
      console.log('Requesting OTP for email:', email);

      const axiosResponse = await http.post('/email/request-otp', {
        email,
      });

      console.log('OTP Request Response:', axiosResponse.data);

      if (axiosResponse?.data?.status) {
        return axiosResponse.data;
      }

      throw new Error(axiosResponse?.data?.message || 'Failed to send OTP');
    } catch (error: any) {
      console.error('Request OTP error in service:', error);
      throw error;
    }
  }

  async verifyOtp(
    email: string,
    otp: string,
    fcmToken?: string,
  ): Promise<{
    status: boolean;
    data: Api.User.Res.Detail;
    access_token: string;
    message?: string;
  }> {
    try {
      console.log('Verifying OTP for email:', email, 'OTP:', otp);
      console.log('FCM Token for verify OTP:', fcmToken || 'not provided');

      const payload: {
        email: string;
        otp: string;
        fcm_token?: string;
      } = {
        email,
        otp,
      };

      if (fcmToken) {
        payload.fcm_token = fcmToken;
      }

      const axiosResponse = await http.post('/verify-otp', payload);

      console.log('OTP Verification Response:', axiosResponse.data);

      if (axiosResponse?.data?.status === true) {
        // Store complete user data
        await AsyncStorage.setItem(
          'USER_DATA',
          JSON.stringify(axiosResponse.data.data),
        );

        // Store token separately
        if (axiosResponse.data.access_token) {
          await AsyncStorage.setItem(
            'USER_TOKEN',
            axiosResponse.data.access_token,
          );
        }

        return axiosResponse.data;
      }

      throw new Error(
        axiosResponse?.data?.message || 'OTP verification failed',
      );
    } catch (error: any) {
      console.error('Verify OTP error in service:', error);
      throw error;
    }
  }

  async verifyEmail(
    email: string,
    otp: string,
  ): Promise<{
    status: boolean;
    message?: string;
  }> {
    try {
      console.log('Verifying email for email:', email, 'OTP:', otp);

      const axiosResponse = await http.post('/email/verify-otp', {
        email,
        otp,
      });

      console.log('Email Verification Response:', axiosResponse.data);

      if (axiosResponse?.data?.status === true) {
        return axiosResponse.data;
      }

      throw new Error(
        axiosResponse?.data?.message || 'Email verification failed',
      );
    } catch (error: any) {
      console.error('Verify email error in service:', error);
      throw error;
    }
  }

  async forgotPassword(email: string) {
    try {
      const axiosResponse = await http.post('/auth/forgot-password', {
        email,
      });

      if (axiosResponse?.data?.status === true) {
        return axiosResponse.data;
      }

      throw new Error(
        axiosResponse?.data?.message || 'Failed to send reset link',
      );
    } catch (error: any) {
      console.error('Forgot password error in service:', error);
      throw error;
    }
  }

  async getProfileData(
    userId: string,
    skip: number = 0,
  ): Promise<Api.User.Res.ProfileDataResponse> {
    try {
      console.log('Fetching profile data for userId:', userId, 'skip:', skip);

      // Get the auth token from AsyncStorage
      const token = await AsyncStorage.getItem('USER_TOKEN');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const axiosResponse = await http.get(
        `/astrology/birth_data?userId=${userId}&skip=${skip}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: 'application/json',
          },
        },
      );

      console.log('Profile data response:', axiosResponse.data);

      if (axiosResponse?.data?.status === true) {
        return axiosResponse.data;
      }

      throw new Error(
        axiosResponse?.data?.message || 'Failed to fetch profile data',
      );
    } catch (error: any) {
      console.error('Get profile data error in service:', error);

      // Handle specific error cases
      if (error.response?.status === 401) {
          await AsyncStorage.removeItem('USER_TOKEN');
          await AsyncStorage.removeItem('USER_DATA');
        throw new Error('Authentication failed. Please login again.');
      
      } else if (error.response?.status === 404) {
        throw new Error('Profile data not found.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR') {
        throw new Error('Network error. Please check your connection.');
      }

      throw error;
    }
  }

  async getChartDetails(memberId: string): Promise<any> {
    try {
      const response = await http.get(`chart_details/${memberId}`, {
        headers: {
          accept: 'application/json',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Dasha data:', error);
      throw error;
    }
  }

  /**
   * Fetches Dasha data for a given user ID.
   * @param userId - The user ID for which to fetch Dasha data
   * @returns The Dasha data response from the API
   */
  async getDashaData(userId: string): Promise<any> {
    try {
      const response = await http.get(
        `dasha/mobile/current-dasha-time/${userId}`,
        {
          headers: {
            accept: 'application/json',
          },
        },
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Dasha data:', error);
      throw error;
    }
  }

  async hasValidToken(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('USER_TOKEN');
      return !!token;
    } catch (error) {
      console.error('Error checking token validity:', error);
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem('USER_TOKEN');
      await AsyncStorage.removeItem('USER_DATA');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  /**
   * Sets a member as primary member
   * @param memberId - The member ID to set as primary
   * @returns The API response from the set-primary endpoint
   */
  async setPrimaryMember(memberId: string): Promise<any> {
    try {
      console.log('Setting primary member for memberId:', memberId);

      const axiosResponse = await http.put(`/astrology/set-primary/${memberId}`, {}, {
        headers: {
          accept: 'application/json',
        },
      });

      console.log('Set primary member response:', axiosResponse.data);

      // Check if the response indicates success (either status: true or success message)
      if (axiosResponse?.data?.status === true || 
          axiosResponse?.data?.message?.includes('successfully') ||
          axiosResponse?.data?.primary_doc) {
        return axiosResponse.data;
      }

      throw new Error(
        axiosResponse?.data?.message || 'Failed to set primary member',
      );
    } catch (error: any) {
      console.error('Set primary member error in service:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        throw new Error('Invalid member ID provided.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      } else if (error.response?.status === 404) {
        throw new Error('Member not found.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR') {
        throw new Error('Network error. Please check your connection.');
      }

      throw error;
    }
  }

  /**
   * Creates birth data for a new member
   * @param birthData - The birth data object containing all required fields
   * @returns The API response from the birth data creation
   */
  async createBirthData(birthData: {
    userId: string;
    first_name: string;
    last_name: string;
    gender: string;
    birthplace: string;
    day: number;
    month: number;
    year: number;
    hour: number;
    min: number;
    lat: number;
    lon: number;
    tzone: number;
  }): Promise<any> {
    try {
      console.log('Creating birth data for member:', birthData);
      const token = await AsyncStorage.getItem('USER_TOKEN');

      const axiosResponse = await http.post('/astrology/birth_data', birthData, {
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Birth data creation response:', axiosResponse.data);

      if (axiosResponse?.data?.status === true) {
        return axiosResponse.data;
      }

      throw new Error(
        axiosResponse?.data?.message || 'Failed to create birth data',
      );
    } catch (error: any) {
      console.error('Create birth data error in service:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        throw new Error('Invalid birth data provided.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR') {
        throw new Error('Network error. Please check your connection.');
      }

      throw error;
    }
  }

  /**
   * Fetches blended predictions topics for a given user ID
   * @param userId - The user ID for which to fetch blended predictions
   * @param mainHeading - The main heading for the predictions (default: "General Analysis")
   * @param topic - The topic for the predictions (default: "Blended Predictions")
   * @returns The blended predictions topics array
   */
  async getBlendedPredictions(
    userId: string,
    mainHeading: string = "General Analysis",
    topic: string = "Blended Predictions"
    
  ): Promise<string[]> {
    try {
     
      if (mainHeading === "General Analysis") {
        topic = "Blended Predictions";
      }

      if (mainHeading === "Snapshot Prediction") {
        topic = "Snapshot Prediction";
      }
      if (mainHeading === "Your Personality") {
        topic = 'Blended Predictions';
      }

      console.log('mainHeading---->399', mainHeading);
      console.log('topic---->400', topic);

      console.log(
        'mainHeading---->401',
        `house/categorize?user_id=${userId}&main_heading=${encodeURIComponent(
          mainHeading,
        )}&topic=${encodeURIComponent(topic)}`,
      );

      const token = await AsyncStorage.getItem('USER_TOKEN');
      const axiosResponse = await http.get(
        `house/categorize?user_id=${userId}&main_heading=${encodeURIComponent(
          mainHeading,
        )}&topic=${encodeURIComponent(topic)}`,
        {
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('Blended predictions response:', axiosResponse.data);

      if (Array.isArray(axiosResponse.data)) {
        return axiosResponse.data;
      }

      throw new Error('Invalid response format from blended predictions API');
    } catch (error: any) {
      console.error('Get blended predictions error in service:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        throw new Error('Invalid request parameters.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      } else if (error.response?.status === 404) {
        throw new Error('Predictions not found for this user.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR') {
        throw new Error('Network error. Please check your connection.');
      }

      throw error;
    }
  }

  /**
   * Fetches Dasha categorize data for Current predictions and Additional Predictions
   * @param userId - The user ID for which to fetch dasha categorize data
   * @param mainHeading - The main heading (e.g., "Additional Predictions")
   * @returns The dasha categorize data response from the API
   */
  async getDashaCategorizeData(
    userId: string,
    mainHeading: string
  ): Promise<{ data: string[]; updated_list?: Record<string, boolean> }> {
    try {
      console.log(
        'Fetching Dasha categorize data for userId:',
        userId,
        'mainHeading:',
        mainHeading,
        'Full URL:',
        `dasha/dasha_categorize?user_id=${userId}&main_heading=${encodeURIComponent(
          mainHeading,
        )}`,
      );

      const token = await AsyncStorage.getItem('USER_TOKEN');
      // console.log('token---->521', token);

      const axiosResponse = await http.get(
        `dasha/dasha_categorize?user_id=${userId}&main_heading=${encodeURIComponent(
          mainHeading,
        )}`,
        {
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('Dasha categorize data response:', axiosResponse);

      if (axiosResponse.data && axiosResponse.data.status === true && Array.isArray(axiosResponse.data.data)) {
        return {
          data: axiosResponse.data.data,
          updated_list: axiosResponse.data.updated_list || {},
        };
      }

      throw new Error('Invalid response format from Dasha categorize API');
    } catch (error: any) {
      console.error('Get Dasha categorize data error in service:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        throw new Error('Invalid request parameters.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      } else if (error.response?.status === 404) {
        throw new Error('Dasha categorize data not found for this user.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR') {
        throw new Error('Network error. Please check your connection.');
      }

      throw error;
    }
  }

  /**
   * Fetches Antardasha data for a given user ID and planet
   * @param userId - The user ID for which to fetch Antardasha data
   * @param mainHeading - The main heading (should be "Antardasha")
   * @param planet - The planet parameter (e.g., "Moon Lagna")
   * @returns The Antardasha data response from the API
   */
  async getAntardashaData(
    userId: string,
    mainHeading: string = "Antardasha",
    planet: string
  ): Promise<string[]> {
    try {
      console.log('Fetching Antardasha data for userId:', userId, 'planet:', planet);

      const token = await AsyncStorage.getItem('USER_TOKEN');

      const axiosResponse = await http.get(
        `dasha/dasha_active_categorize?user_id=${userId}&main_heading=${encodeURIComponent(
          mainHeading,
        )}&planet=${encodeURIComponent(planet)}`,
        {
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('Antardasha data response:', axiosResponse.data);

      if (Array.isArray(axiosResponse.data)) {
        return axiosResponse.data;
      }

      throw new Error('Invalid response format from Antardasha API');
    } catch (error: any) {
      console.error('Get Antardasha data error in service:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        throw new Error('Invalid request parameters.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      } else if (error.response?.status === 404) {
        throw new Error('Antardasha data not found for this user.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR') {
        throw new Error('Network error. Please check your connection.');
      }

      throw error;
    }
  }

  /**
   * Fetches AI generated response for Dasha predictions (Current predictions and Additional Predictions)
   * @param userId - The user ID for which to fetch AI response
   * @param topic - The main topic (e.g., "Additional Predictions")
   * @param subTopic - The sub-topic (e.g., "Rahu - 10-09-2025 to 05-12-2026")
   * @returns The AI generated response data
   */
  async getDashaAiResponse(
    userId: string,
    topic: string,
    subTopic: string
  ): Promise<Api.AIResponse> {
    try {
      console.log('Fetching Dasha AI response for userId:', userId, 'topic:', topic, 'subTopic:', subTopic);

      const fullUrl = `dasha/get-dasha-analysis/data/topic/generate/?user_id=${userId}&topic=${encodeURIComponent(
        topic,
      )}&sub_topic=${encodeURIComponent(subTopic)}`;
      
      console.log('Full Dasha AI API URL:', fullUrl);
      console.log('Base URL:', http.defaults.baseURL);
      console.log('Complete URL:', `${http.defaults.baseURL}/${fullUrl}`);

      const token = await AsyncStorage.getItem('USER_TOKEN');
      const axiosResponse = await http.get(fullUrl, {
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        timeout: 100000, // Increase timeout to 100 seconds
      });

      console.log('Dasha AI response data===>', axiosResponse.data);

      // Handle different response structures
      if (axiosResponse.data && typeof axiosResponse.data === 'object') {
        // If the response has the expected structure with status and data
        if (axiosResponse.data.status !== undefined) {
          return axiosResponse.data as Api.AIResponse;
        }
        
        // If the response is directly the data structure (as shown in your example)
        if (axiosResponse.data.user_id && axiosResponse.data.topic) {
          return {
            status: true,
            data: axiosResponse.data as Api.AIResponseData
          } as Api.AIResponse;
        }
      }

      throw new Error('Invalid response format from Dasha AI response API');
    } catch (error: any) {
      console.error('Get Dasha AI response error in service:', error);
      
      // Handle specific error cases
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('Request timed out. The AI response is taking longer than expected. Please try again.');
      } else if (error.response?.status === 400) {
        throw new Error('Invalid request parameters.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      } else if (error.response?.status === 404) {
        throw new Error('AI response not found for this user.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR') {
        throw new Error('Network error. Please check your connection.');
      }

      throw error;
    }
  }

  /**
   * Fetches AI generated response for Antardasha specific topic and sub-topic
   * @param userId - The user ID for which to fetch AI response
   * @param topic - The main topic (should be "Antardasha")
   * @param subTopic - The sub-topic (e.g., "Your Strengths during this time period")
   * @returns The AI generated response data
   */
  async getAntardashaAiResponse(
    userId: string,
    topic: string,
    subTopic: string
  ): Promise<Api.AIResponse> {
    try {
      console.log('Fetching Antardasha AI response for userId:', userId, 'topic:', topic, 'subTopic:', subTopic);

      const fullUrl = `dasha/get-dasha-analysis/data/topic/generate/?user_id=${userId}&topic=${encodeURIComponent(
        topic,
      )}&sub_topic=${encodeURIComponent(subTopic)}`;
      
      console.log('Full Antardasha API URL:', fullUrl);
      console.log('Base URL:', http.defaults.baseURL);
      console.log('Complete URL:', `${http.defaults.baseURL}/${fullUrl}`);

      const token = await AsyncStorage.getItem('USER_TOKEN');
      
      const axiosResponse = await http.get(fullUrl, {
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        timeout: 100000, // Increase timeout to 100 seconds
      });

      console.log('Antardasha AI response data===>', axiosResponse.data);

      // Handle different response structures
      if (axiosResponse.data && typeof axiosResponse.data === 'object') {
        // If the response has the expected structure with status and data
        if (axiosResponse.data.status !== undefined) {
          return axiosResponse.data as Api.AIResponse;
        }
        
        // If the response is directly the data structure
        if (axiosResponse.data.user_id && axiosResponse.data.topic) {
          return {
            status: true,
            data: axiosResponse.data as Api.AIResponseData
          } as Api.AIResponse;
        }
      }

      throw new Error('Invalid response format from Antardasha AI response API');
    } catch (error: any) {
      console.error('Get Antardasha AI response error in service:', error);
      
      // Handle specific error cases
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('Request timed out. The AI response is taking longer than expected. Please try again.');
      } else if (error.response?.status === 400) {
        throw new Error('Invalid request parameters.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      } else if (error.response?.status === 404) {
        throw new Error('AI response not found for this user.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR') {
        throw new Error('Network error. Please check your connection.');
      }

      throw error;
    }
  }

  /**
   * Fetches AI generated response for specific topic and sub-topic
   * @param userId - The user ID for which to fetch AI response
   * @param topic - The main topic (e.g., "Personality, Attitude, Vitality")
   * @param subTopic - The sub-topic (e.g., "Your Tendencies", "Summary")
   * @returns The AI generated response data
   */
  async getGenerateHeadingAiResponse(
    userId: string,
    topic: string,
    subTopic: string,
    current_plan: string

  ): Promise<Api.AIResponse> {
    try {
      console.log(
        'Fetching AI response for userId:',
        userId,
        'topic:',
        topic,
        'subTopic:',
        subTopic,
        'plan:',
        current_plan,
      );

      if (subTopic === 'Your tendencies') {
        console.log('subTopic---->702', subTopic);
        subTopic = 'about_house';
      }

    

      const fullUrl = `house/get-sub-topic-analysis/data/topic/generate/?user_id=${userId}&plan=${current_plan}&topic=${encodeURIComponent(
        topic,
      )}&sub_topic=${encodeURIComponent(subTopic)}`;
      
      console.log('Full API URL:', fullUrl);
      console.log('Base URL:', http.defaults.baseURL);
      console.log('Complete URL:', `${http.defaults.baseURL}/${fullUrl}`);

      const token = await AsyncStorage.getItem('USER_TOKEN');
      
      const axiosResponse = await http.get(fullUrl, {

        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        timeout: 100000, // Increase timeout to 100 seconds
      });

      console.log('AI response data===>467', axiosResponse);

      // Handle different response structures
      if (axiosResponse.data && typeof axiosResponse.data === 'object') {
        // If the response has the expected structure with status and data
        if (axiosResponse.data.status !== undefined) {
          return axiosResponse.data as Api.AIResponse;
        }
        
        // If the response is directly the data structure (as shown in your example)
        if (axiosResponse.data.user_id && axiosResponse.data.topic) {
          return {
            status: true,
            data: axiosResponse.data as Api.AIResponseData
          } as Api.AIResponse;
        }
      }

      throw new Error('Invalid response format from AI response API');
    } catch (error: any) {
      console.error('Get AI response error in service:', error);
      console.log('Error response data:', error.response?.data);
      
      // Handle specific error cases
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('Request timed out. The AI response is taking longer than expected. Please try again.');
      } else if (error.response?.status === 400) {
        // Handle plan access errors specifically
        const errorDetail = error.response?.data?.detail;

        console.log('errorDetail---->662', errorDetail);

        if (errorDetail && errorDetail.includes('does not allow access to level')) {
          // const planMatch = errorDetail.match(/Plan '([^']+)' does not allow access to level (\d+)/);
          // if (planMatch) {
            // const [, planName, level] = planMatch;
            throw new Error(`${errorDetail}`);
          // }
        }
        // Handle other 400 errors
        throw new Error(errorDetail || 'Invalid request parameters. Please check your input and try again.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      } else if (error.response?.status === 404) {
        throw new Error('AI response not found for this user.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR') {
        throw new Error('Network error. Please check your connection.');
      }

      throw error;
    }
  }

  /**
   * Fetches current dasha time data for a given user ID
   * @param userId - The user ID for which to fetch current dasha time
   * @returns The current dasha time response from the API
   */
  async getCurrentDashaTime(userId: string): Promise<CurrentDashaTimeResponse> {
    try {
      console.log('Fetching current dasha time for userId:', userId);

      // Get the auth token from AsyncStorage
      const token = await AsyncStorage.getItem('USER_TOKEN');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const axiosResponse = await http.get(
        `dasha/get-current-dasha-time/?user_id=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: 'application/json',
          },
        },
      );

      console.log('Current dasha time response:', axiosResponse.data);

      if (axiosResponse?.data) {
        return axiosResponse.data;
      }

      throw new Error('Invalid response format from current dasha time API');
    } catch (error: any) {
      console.error('Get current dasha time error in service:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        throw new Error('Invalid request parameters.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      } else if (error.response?.status === 404) {
        throw new Error('Current dasha time not found for this user.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR') {
        throw new Error('Network error. Please check your connection.');
      }

      throw error;
    }
  }

  /**
   * Updates birth data for a member
   * @param memberId - The member ID to update
   * @param birthData - The birth data object containing fields to update
   * @returns The API response from the birth data update
   */
  async updateBirthData(
    memberId: string,
    birthData: {
      id: string;
      first_name: string;
      last_name: string;
      isUpdate: boolean;
      isProfile: boolean;
      gender: string;
      day: number;
      month: number;
      year: number;
      hour: number;
      min: number;
      birthplace: string;
      lat?: string;
      lon?: string;
      tzone?: number | null;
      userId: string;
      what_do_you_do: string;
      marital_status?: string | null;
      children?: string | null;
      health_issues_if_any?: string | null;
      main_source_of_finances?: string | null;
      prediction_type?: string;
      personalizedDetails?: boolean;
      profession?: string;
    }
  ): Promise<{ status: boolean; message: string }> {
    try {
      console.log('Updating birth data for member:', memberId, birthData);

      // Get the auth token from AsyncStorage
      const token = await AsyncStorage.getItem('USER_TOKEN');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const axiosResponse = await http.put(
        `/astrology/birth_data/${memberId}`,
        birthData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Birth data update response:', axiosResponse.data);

      if (axiosResponse?.data?.status === true) {
        return axiosResponse.data;
      }

      throw new Error(
        axiosResponse?.data?.message || 'Failed to update birth data'
      );
    } catch (error: any) {
      console.error('Update birth data error in service:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        throw new Error('Invalid birth data provided.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      } else if (error.response?.status === 404) {
        throw new Error('Member not found.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR') {
        throw new Error('Network error. Please check your connection.');
      }

      throw error;
    }
  }
}
