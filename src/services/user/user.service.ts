import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  filterChatHistoryByMonthYear,
  groupChatHistoryIntoMonths,
  normalizeChatHistoryMonthsList,
} from '../../utils/astrologerChatHistory';
import http from '../../utils/http';
import { Service } from '../Service';
import { Api, CurrentDashaTimeResponse } from '../../types/api';

// import i18next from 'i18next';

export default class UserService extends Service {
  async login(
    email: string,
    password?: string | null,
    fcmToken?: string,
  ): Promise<{
    status: boolean;
    is_user_exist?: boolean;
    data: Api.User.Res.Detail | null;
    access_token: string | null;
    message?: string;
  }> {
    try {
      console.log('email--->', email, password ?? '(email check only)');
      const payload: {
        username: string;
        password?: string | null;
        fcm_token?: string;
      } = {
        username: email,
      };

      if (password) {
        payload.password = password;
      }else{
        payload.password = "";
      }

      if (fcmToken) {
        payload.fcm_token = fcmToken;
      }

      console.log('Making API call to /login with:', payload);

      const axiosResponse = await http.post('astrologer/mobile/login', payload);

      console.log('API Response:', axiosResponse);
      console.log('API Response data:', axiosResponse.data);
      console.log('API Response status:', axiosResponse.status);

      const responseData = axiosResponse?.data;

      if (
        responseData?.status &&
        responseData?.data &&
        responseData?.access_token
      ) {
        await AsyncStorage.setItem(
          'USER_DATA',
          JSON.stringify(responseData.data),
        );
        await AsyncStorage.setItem('USER_TOKEN', responseData.access_token);
        return responseData;
      }

      // Email-only step: user exists, show password field on client
      if (responseData?.is_user_exist === true && !password) {
        return {
          status: responseData.status ?? false,
          is_user_exist: true,
          data: responseData.data ?? null,
          access_token: responseData.access_token ?? null,
          message: responseData.message,
        };
      }

      throw new Error(
        responseData?.error_message ||
          responseData?.message ||
          'Login failed',
      );
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

  async registerAstrologer(params: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    experience?: string;
    bio?: string;
  }): Promise<{
    status: boolean;
    message?: string;
    data?: Api.User.Res.Detail & { _id?: string; id?: string };
    access_token?: string;
  }> {
    try {
      const axiosResponse = await http.post(
        '/astrologer/users/mobile/register',
        {
          first_name: params.first_name,
          last_name: params.last_name,
          email: params.email,
          password: params.password,
          role: 'astrologer',
          experience: params.experience ?? '',
          bio: params.bio ?? '',
        },
        {
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: 'Bearer null',
          },
        },
      );

      if (axiosResponse?.data?.status) {
        if (axiosResponse?.data?.data) {
          await AsyncStorage.setItem(
            'USER_DATA',
            JSON.stringify(axiosResponse.data.data),
          );
        }
        if (axiosResponse?.data?.access_token) {
          await AsyncStorage.setItem(
            'USER_TOKEN',
            axiosResponse.data.access_token,
          );
        }
        return axiosResponse.data;
      }

      throw new Error(
        axiosResponse?.data?.message || 'Failed to register astrologer',
      );
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to register. Please try again.';
      throw new Error(errorMessage);
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

  async requestAstrologerOtp(email: string) {
    try {
      const axiosResponse = await http.post('/astrologer/request-otp', {
        email,
      });

      if (axiosResponse?.data?.status) {
        return axiosResponse.data;
      }

      throw new Error(axiosResponse?.data?.message || 'Failed to send OTP');
    } catch (error: any) {
      console.error('Astrologer request OTP error in service:', error);
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

  async requestAstrologerEmailOtp(email: string) {
    try {
      const axiosResponse = await http.post('/astrologer/email/request-otp', {
        email,
      });

      if (axiosResponse?.data?.status) {
        return axiosResponse.data;
      }

      throw new Error(axiosResponse?.data?.message || 'Failed to send OTP');
    } catch (error: any) {
      console.error('Astrologer request OTP error in service:', error);
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

  async verifyAstrologerOtp(
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

      const axiosResponse = await http.post('/astrologer/verify-otp', payload);

      if (axiosResponse?.data?.status === true) {
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

        return axiosResponse.data;
      }

      throw new Error(
        axiosResponse?.data?.message || 'OTP verification failed',
      );
    } catch (error: any) {
      console.error('Verify astrologer OTP error in service:', error);
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

  async verifyAstrologerEmail(
    email: string,
    otp: string,
  ): Promise<{
    status: boolean;
    message?: string;
  }> {
    try {
      const axiosResponse = await http.post('/astrologer/email/verify-otp', {
        email,
        otp,
      });

      if (axiosResponse?.data?.status === true) {
        return axiosResponse.data;
      }

      throw new Error(
        axiosResponse?.data?.message || 'Email verification failed',
      );
    } catch (error: any) {
      console.error('Verify astrologer email error in service:', error);
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

  async resetPasswordOtp(
    email: string,
    newPassword: string,
  ): Promise<{ status: boolean; message?: string }> {
    try {
      const axiosResponse = await http.post('/auth/reset-password-otp', {
        email,
        new_password: newPassword,
      });

      if (axiosResponse?.data?.status === true) {
        return axiosResponse.data;
      }

      throw new Error(
        axiosResponse?.data?.message || 'Failed to reset password',
      );
    } catch (error: any) {
      console.error('Reset password OTP error in service:', error);
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

  async getAstrologerClients(
    userId: string,
    skip: number = 0,
    take: number = 10,
  ): Promise<Api.User.Res.AstrologerClientsResponse> {
    try {
      const token = await AsyncStorage.getItem('USER_TOKEN');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const axiosResponse = await http.get(
        `/astrologer/birth_data?userId=${userId}&skip=${skip}&take=${take}&limit=${take}&pageNo=${skip}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: 'application/json',
          },
        },
      );

      if (axiosResponse?.data?.status === true) {
        return axiosResponse.data;
      }

      throw new Error(
        axiosResponse?.data?.message || 'Failed to fetch astrologer clients',
      );
    } catch (error: any) {
      console.error('Get astrologer clients error in service:', error);

      if (error.response?.status === 401) {
        await AsyncStorage.removeItem('USER_TOKEN');
        await AsyncStorage.removeItem('USER_DATA');
        throw new Error('Authentication failed. Please login again.');
      }

      throw error;
    }
  }

  async createAstrologerClient(
    userId: string,
    payload: {
      first_name: string;
      last_name: string;
      gender: string;
      isDeactivated: boolean;
      day: string;
      month: string;
      year: string;
      hour: number;
      min: number;
      birthplace: string;
      lat: number;
      lon: number;
      tzone: number;
      personalizedDetails: boolean;
      about_client: string;
      isTransit: boolean;
      prediction_type: string;
      userId: string;
    },
  ): Promise<{ status: boolean; message?: string | null; data?: unknown }> {
    try {
      const token = await AsyncStorage.getItem('USER_TOKEN');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const axiosResponse = await http.post(
        `/astrologer/birth_data?userId=${userId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      );

      if (axiosResponse?.data?.status === true) {
        return axiosResponse.data;
      }

      throw new Error(
        axiosResponse?.data?.message || 'Failed to create client',
      );
    } catch (error: any) {
      console.error('Create astrologer client error in service:', error);

      if (error.response?.status === 401) {
        await AsyncStorage.removeItem('USER_TOKEN');
        await AsyncStorage.removeItem('USER_DATA');
        throw new Error('Authentication failed. Please login again.');
      }

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to create chart. Please try again.';
      throw new Error(errorMessage);
    }
  }

  async updateAstrologerClient(
    clientId: string,
    payload: Record<string, unknown>,
  ): Promise<{ status: boolean; message?: string }> {
    try {
      const token = await AsyncStorage.getItem('USER_TOKEN');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const axiosResponse = await http.put(
        `/astrologer/birth_data/${clientId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      );

      if (axiosResponse?.data?.status === true) {
        return axiosResponse.data;
      }

      throw new Error(
        axiosResponse?.data?.message || 'Failed to update client',
      );
    } catch (error: any) {
      console.error('Update astrologer client error in service:', error);

      if (error.response?.status === 401) {
        await AsyncStorage.removeItem('USER_TOKEN');
        await AsyncStorage.removeItem('USER_DATA');
        throw new Error('Authentication failed. Please login again.');
      }

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to update client. Please try again.';
      throw new Error(errorMessage);
    }
  }

  async createAstrologerCurrentTransit(payload: {
    day: number;
    month: number;
    year: number;
    hour: number;
    min: number;
    birthplace: string;
    lat: number;
    lon: number;
    tzone: number;
  }): Promise<{ status: boolean; data?: Record<string, unknown> }> {
    try {
      const token = await AsyncStorage.getItem('USER_TOKEN');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const axiosResponse = await http.post('/astrologer/current-transit', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      console.log('axiosResponse--->748', axiosResponse?.data);

      if (axiosResponse?.data?.status === true) {
        return axiosResponse.data;
      }

      throw new Error(
        axiosResponse?.data?.message || 'Failed to generate transit chart',
      );
    } catch (error: any) {
      console.error('Create astrologer current transit error:', error);

      if (error.response?.status === 401) {
        await AsyncStorage.removeItem('USER_TOKEN');
        await AsyncStorage.removeItem('USER_DATA');
        throw new Error('Authentication failed. Please login again.');
      }

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to generate transit chart. Please try again.';
      throw new Error(errorMessage);
    }
  }

  async getAstrologerChatHistory(
    clientId: string,
  ): Promise<Api.User.Res.AstrologerChatHistoryResponse> {
    try {
      const token = await AsyncStorage.getItem('USER_TOKEN');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const axiosResponse = await http.get(`/astrologer/chat-history/${clientId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          accept: 'application/json',
        },
      });

      if (axiosResponse?.data?.status === true) {
        return axiosResponse.data;
      }

      throw new Error(
        axiosResponse?.data?.message || 'Failed to fetch chat history',
      );
    } catch (error: any) {
      console.error('Get astrologer chat history error:', error);

      if (error.response?.status === 401) {
        await AsyncStorage.removeItem('USER_TOKEN');
        await AsyncStorage.removeItem('USER_DATA');
        throw new Error('Authentication failed. Please login again.');
      }

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch chat history. Please try again.';
      throw new Error(errorMessage);
    }
  }

  private async fetchAstrologerChatHistoryMonthsFromApi(
    userId: string,
    token: string,
  ): Promise<Api.User.Res.AstrologerChatHistoryMonthsResponse> {
    const axiosResponse = await http.post(
      '/astrologer/chat-history/months',
      { user_id: userId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
      },
    );

    if (axiosResponse?.data?.status === true) {
      const normalized = normalizeChatHistoryMonthsList(axiosResponse.data.data);
      return {
        ...axiosResponse.data,
        data: normalized,
        count: normalized.length,
      };
    }

    throw new Error(
      axiosResponse?.data?.message || 'Failed to fetch chat history months',
    );
  }

  async getAstrologerChatHistoryMonths(
    userId: string,
  ): Promise<Api.User.Res.AstrologerChatHistoryMonthsResponse> {
    try {
      const token = await AsyncStorage.getItem('USER_TOKEN');

      if (!token) {
        throw new Error('No authentication token found');
      }

      try {
        const response = await this.fetchAstrologerChatHistoryMonthsFromApi(
          userId,
          token,
        );
        if (response.data.length > 0) {
          return response;
        }

        const fullHistory = await this.getAstrologerChatHistory(userId);
        const months = groupChatHistoryIntoMonths(fullHistory.data || []);
        if (months.length > 0) {
          return {
            status: true,
            user_id: userId,
            count: months.length,
            data: months,
          };
        }

        return response;
      } catch (error: any) {
        if (error.response?.status !== 404) {
          throw error;
        }

        const fullHistory = await this.getAstrologerChatHistory(userId);
        const months = groupChatHistoryIntoMonths(fullHistory.data || []);
        return {
          status: true,
          user_id: userId,
          count: months.length,
          data: months,
        };
      }
    } catch (error: any) {
      console.error('Get astrologer chat history months error:', error);

      if (error.response?.status === 401) {
        await AsyncStorage.removeItem('USER_TOKEN');
        await AsyncStorage.removeItem('USER_DATA');
        throw new Error('Authentication failed. Please login again.');
      }

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch chat history months. Please try again.';
      throw new Error(errorMessage);
    }
  }

  async getAstrologerChatHistoryMonthDetails(
    userId: string,
    month: number,
    year: number,
  ): Promise<Api.User.Res.AstrologerChatHistoryMonthDetailsResponse> {
    try {
      const token = await AsyncStorage.getItem('USER_TOKEN');

      if (!token) {
        throw new Error('No authentication token found');
      }

      try {
        const axiosResponse = await http.post(
          '/astrologer/chat-history/months/details',
          { user_id: userId, month, year },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              accept: 'application/json',
              'Content-Type': 'application/json',
            },
          },
        );

        if (axiosResponse?.data?.status === true) {
          return axiosResponse.data;
        }

        throw new Error(
          axiosResponse?.data?.message || 'Failed to fetch chat history details',
        );
      } catch (error: any) {
        if (error.response?.status !== 404) {
          throw error;
        }

        const fullHistory = await this.getAstrologerChatHistory(userId);
        const data = filterChatHistoryByMonthYear(
          fullHistory.data || [],
          month,
          year,
        );

        return {
          status: true,
          user_id: userId,
          month,
          year,
          data,
        };
      }
    } catch (error: any) {
      console.error('Get astrologer chat history month details error:', error);

      if (error.response?.status === 401) {
        await AsyncStorage.removeItem('USER_TOKEN');
        await AsyncStorage.removeItem('USER_DATA');
        throw new Error('Authentication failed. Please login again.');
      }

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch chat history details. Please try again.';
      throw new Error(errorMessage);
    }
  }

  async getAstrologerMemberBirthChart(
    userId: string,
    chartType: string,
  ): Promise<{
    status: boolean;
    chart?: string;
    planets_positions?: Array<Record<string, unknown>>;
    summary?: Array<Record<string, unknown>>;
  }> {
    try {
      const token = await AsyncStorage.getItem('USER_TOKEN');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const axiosResponse = await http.post(
        '/astrologer/member_birth/chart',
        {
          userId,
          chart_type: chartType,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      );

      if (axiosResponse?.data?.status === true) {
        return axiosResponse.data;
      }

      throw new Error(
        axiosResponse?.data?.message || 'Failed to fetch vedic chart',
      );
    } catch (error: any) {
      console.error('Get astrologer member birth chart error:', error);

      if (error.response?.status === 401) {
        await AsyncStorage.removeItem('USER_TOKEN');
        await AsyncStorage.removeItem('USER_DATA');
        throw new Error('Authentication failed. Please login again.');
      }

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch vedic chart. Please try again.';
      throw new Error(errorMessage);
    }
  }

  async getAstrologerMemberDetails(
    userId: string,
  ): Promise<Api.User.Res.AstrologerMemberDetailsResponse> {
    try {
      const token = await AsyncStorage.getItem('USER_TOKEN');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const axiosResponse = await http.get(
        `/astrologer/get-members-details/?user_id=${encodeURIComponent(userId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: 'application/json',
          },
        },
      );

      if (axiosResponse?.data?.birth_details && axiosResponse?.data?.dasha_result) {
        return axiosResponse.data;
      }

      throw new Error(
        axiosResponse?.data?.message || 'Failed to fetch member details',
      );
    } catch (error: any) {
      console.error('Get astrologer member details error:', error);

      if (error.response?.status === 401) {
        await AsyncStorage.removeItem('USER_TOKEN');
        await AsyncStorage.removeItem('USER_DATA');
        throw new Error('Authentication failed. Please login again.');
      }

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch member details. Please try again.';
      throw new Error(errorMessage);
    }
  }

  async getAstrologerChartDetails(clientId: string): Promise<{
    status: boolean;
    data?: Record<string, unknown>;
  }> {
    try {
      const token = await AsyncStorage.getItem('USER_TOKEN');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const axiosResponse = await http.get(
        `/astrologer/chart_details/${encodeURIComponent(clientId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: 'application/json',
          },
        },
      );

      if (axiosResponse?.data?.status === true) {
        return axiosResponse.data;
      }

      throw new Error(
        axiosResponse?.data?.message || 'Failed to fetch chart details',
      );
    } catch (error: any) {
      console.error('Get astrologer chart details error:', error);

      if (error.response?.status === 401) {
        await AsyncStorage.removeItem('USER_TOKEN');
        await AsyncStorage.removeItem('USER_DATA');
        throw new Error('Authentication failed. Please login again.');
      }

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch chart details. Please try again.';
      throw new Error(errorMessage);
    }
  }

  async getAstrologerClientDashaDetails(params: {
    user_id: string;
    level: string;
    md: string;
    ad: string;
    pd: string;
    sd: string;
  }): Promise<{
    status: boolean;
    message?: string;
    data?: Record<string, unknown>;
  }> {
    try {
      const token = await AsyncStorage.getItem('USER_TOKEN');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const query = new URLSearchParams({
        user_id: params.user_id,
        level: params.level,
        md: params.md,
        ad: params.ad,
        pd: params.pd,
        sd: params.sd,
      });

      const axiosResponse = await http.get(
        `/astrologer/client/dasha/details?${query.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: 'application/json',
          },
        },
      );

      console.log('axiosResponse--->1158', axiosResponse?.data);

      if (axiosResponse?.data?.status === true) {
        return axiosResponse.data;
      }

      throw new Error(
        axiosResponse?.data?.message || 'Failed to fetch dasha details',
      );
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch dasha details. Please try again.';
      throw new Error(errorMessage);
    }
  }

  async getAstrologerDignityChart(
    userId: string,
  ): Promise<Api.User.Res.AstrologerDignityChartResponse> {
    try {
      const token = await AsyncStorage.getItem('USER_TOKEN');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const axiosResponse = await http.get(
        `/astrologer/dignity_chart?user_id=${encodeURIComponent(userId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: 'application/json',
          },
        },
      );

      if (axiosResponse?.data?.status === true) {
        return axiosResponse.data;
      }

      throw new Error(
        axiosResponse?.data?.message || 'Failed to fetch dignity chart',
      );
    } catch (error: any) {
      console.error('Get astrologer dignity chart error:', error);

      if (error.response?.status === 401) {
        await AsyncStorage.removeItem('USER_TOKEN');
        await AsyncStorage.removeItem('USER_DATA');
        throw new Error('Authentication failed. Please login again.');
      }

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch dignity chart. Please try again.';
      throw new Error(errorMessage);
    }
  }

  async getAstrologerUsage(
    astrologerId: string,
    inrBudget: number,
  ): Promise<Api.User.Res.AstrologerUsageResponse> {
    try {
      const token = await AsyncStorage.getItem('USER_TOKEN');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const axiosResponse = await http.get(
        `/astrologer/usage?astrologer_id=${encodeURIComponent(astrologerId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: 'application/json',
          },
        },
      );

      if (axiosResponse?.data?.percent_remaining != null) {
        return axiosResponse.data;
      }

      throw new Error(
        axiosResponse?.data?.message || 'Failed to fetch astrologer usage',
      );
    } catch (error: any) {
      console.error('Get astrologer usage error:', error);

      if (error.response?.status === 401) {
        await AsyncStorage.removeItem('USER_TOKEN');
        await AsyncStorage.removeItem('USER_DATA');
        throw new Error('Authentication failed. Please login again.');
      }

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch astrologer usage. Please try again.';
      throw new Error(errorMessage);
    }
  }

  async getAstrologerTransitResult(userId: string): Promise<{
    status: boolean;
    current_date?: string;
    data?: Array<{
      heading?: string;
      subheading?: string[];
    }>;
  }> {
    try {
      const token = await AsyncStorage.getItem('USER_TOKEN');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const axiosResponse = await http.get(
        `/astrologer/transit_result?user_id=${encodeURIComponent(userId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: 'application/json',
          },
        },
      );

      if (axiosResponse?.data?.status === true) {
        return axiosResponse.data;
      }

      throw new Error(
        axiosResponse?.data?.message || 'Failed to fetch transit combinations',
      );
    } catch (error: any) {
      console.error('Get astrologer transit result error:', error);

      if (error.response?.status === 401) {
        await AsyncStorage.removeItem('USER_TOKEN');
        await AsyncStorage.removeItem('USER_DATA');
        throw new Error('Authentication failed. Please login again.');
      }

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch transit combinations. Please try again.';
      throw new Error(errorMessage);
    }
  }

  async getAstrologerTransitConnectionList(userId: string): Promise<{
    status: boolean;
    current_date?: string;
    data?: Array<{
      heading?: string;
      subheading?: string[];
    }>;
  }> {
    try {
      const token = await AsyncStorage.getItem('USER_TOKEN');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const axiosResponse = await http.get(
        `/astrologer/transit_connection_list?user_id=${encodeURIComponent(userId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: 'application/json',
          },
        },
      );

      if (axiosResponse?.data?.status === true) {
        return axiosResponse.data;
      }

      throw new Error(
        axiosResponse?.data?.message || 'Failed to fetch transit combinations',
      );
    } catch (error: any) {
      console.error('Get astrologer transit connection list error:', error);

      if (error.response?.status === 401) {
        await AsyncStorage.removeItem('USER_TOKEN');
        await AsyncStorage.removeItem('USER_DATA');
        throw new Error('Authentication failed. Please login again.');
      }

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch transit combinations. Please try again.';
      throw new Error(errorMessage);
    }
  }

  async getAstrologerTransitHeadingReport(
    userId: string,
    heading: string,
  ): Promise<{
    status: boolean;
    answer?: string;
    heading?: string;
  }> {
    try {
      const token = await AsyncStorage.getItem('USER_TOKEN');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const axiosResponse = await http.post(
        '/astrologer/transit/heading-report',
        {
          user_id: userId,
          heading,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      );

      if (axiosResponse?.data?.status === true) {
        return axiosResponse.data;
      }

      throw new Error(
        axiosResponse?.data?.message || 'Failed to fetch transit analysis report',
      );
    } catch (error: any) {
      console.error('Get astrologer transit heading report error:', error);

      if (error.response?.status === 401) {
        await AsyncStorage.removeItem('USER_TOKEN');
        await AsyncStorage.removeItem('USER_DATA');
        throw new Error('Authentication failed. Please login again.');
      }

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch transit analysis report. Please try again.';
      throw new Error(errorMessage);
    }
  }

  async getAstrologerCombinations(
    userId: string,
    dataType:
      | 'combinations'
      | 'active_combinations'
      | 'current_activity'
      | 'transit_details_list'
      | 'the_inner_you'
      | 'next_week'
      | string,
  ): Promise<{
    status: boolean;
    data?: Array<{
      heading?: string;
      collection?: string;
      pipeline?: Array<Record<string, unknown>>;
      insights?: string;
      details?: unknown[];
      week_start?: string;
      week_end?: string;
    }>;
    insights?: string;
    week_start?: string;
    week_end?: string;
  }> {
    try {
      const token = await AsyncStorage.getItem('USER_TOKEN');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const axiosResponse = await http.get(
        `/astrologer/combinations/${encodeURIComponent(userId)}?data_type=${encodeURIComponent(dataType)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: 'application/json',
          },
        },
      );

      if (axiosResponse?.data?.status === true) {
        return axiosResponse.data;
      }

      throw new Error(
        axiosResponse?.data?.message || 'Failed to fetch combinations',
      );
    } catch (error: any) {
      console.error('Get astrologer combinations error:', error);

      if (error.response?.status === 401) {
        await AsyncStorage.removeItem('USER_TOKEN');
        await AsyncStorage.removeItem('USER_DATA');
        throw new Error('Authentication failed. Please login again.');
      }

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch combinations. Please try again.';
      throw new Error(errorMessage);
    }
  }

  async refreshAstrologerCombinations(
    userId: string,
    dataType: 'current_activity' | 'transit_details_list',
  ): Promise<{
    status: boolean;
    data?: Array<{
      heading?: string;
      collection?: string;
      pipeline?: Array<Record<string, unknown>>;
    }>;
  }> {
    try {
      const token = await AsyncStorage.getItem('USER_TOKEN');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const axiosResponse = await http.get(
        `/astrologer/combinations/refresh?user_id=${encodeURIComponent(userId)}&data_type=${encodeURIComponent(dataType)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: 'application/json',
          },
        },
      );

      if (axiosResponse?.data?.status === true) {
        return axiosResponse.data;
      }

      throw new Error(
        axiosResponse?.data?.message || 'Failed to refresh combinations',
      );
    } catch (error: any) {
      console.error('Refresh astrologer combinations error:', error);

      if (error.response?.status === 401) {
        await AsyncStorage.removeItem('USER_TOKEN');
        await AsyncStorage.removeItem('USER_DATA');
        throw new Error('Authentication failed. Please login again.');
      }

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to refresh combinations. Please try again.';
      throw new Error(errorMessage);
    }
  }

  async generateAstrologerCustomCombination(
    userId: string,
    dataType: string,
    heading: string,
    force: boolean = false,
  ): Promise<{
    status: boolean;
    data?: unknown;
    message?: string;
  }> {
    try {
      const token = await AsyncStorage.getItem('USER_TOKEN');

      if (!token) {
        throw new Error('No authentication token found');
      }

      let url = `/astrologer/combinations/custom/generate/?user_id=${encodeURIComponent(userId)}&data_type=${encodeURIComponent(dataType)}&heading=${encodeURIComponent(heading)}`;
      if (force) {
        url += '&force=true';
      }

      const axiosResponse = await http.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          accept: 'application/json, text/plain, */*',
        },
      });

      if (axiosResponse?.data?.status === true || axiosResponse?.status === 200) {
        return axiosResponse.data;
      }

      throw new Error(
        axiosResponse?.data?.message || 'Failed to generate combination',
      );
    } catch (error: any) {
      console.error('Generate astrologer custom combination error:', error);

      if (error.response?.status === 401) {
        await AsyncStorage.removeItem('USER_TOKEN');
        await AsyncStorage.removeItem('USER_DATA');
        throw new Error('Authentication failed. Please login again.');
      }

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to generate prediction. Please try again.';
      throw new Error(errorMessage);
    }
  }

  async getAstrologerComboContent(
    collection: string,
    pipeline: Array<Record<string, unknown>>,
  ): Promise<{
    status: boolean;
    data?: unknown;
  }> {
    try {
      const token = await AsyncStorage.getItem('USER_TOKEN');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const axiosResponse = await http.post(
        '/astrologer/get-content',
        {
          collection,
          pipeline,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      );

      if (axiosResponse?.data?.status === true || axiosResponse?.data?.status === 'true') {
        return axiosResponse.data;
      }

      if (Array.isArray(axiosResponse?.data?.data)) {
        return axiosResponse.data;
      }

      throw new Error(
        axiosResponse?.data?.message || 'Failed to fetch combination content',
      );
    } catch (error: any) {
      console.error('Get astrologer combo content error:', error);

      if (error.response?.status === 401) {
        await AsyncStorage.removeItem('USER_TOKEN');
        await AsyncStorage.removeItem('USER_DATA');
        throw new Error('Authentication failed. Please login again.');
      }

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch combination content. Please try again.';
      throw new Error(errorMessage);
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
  async createBirthData(birthData: Record<string, unknown>): Promise<any> {
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
    topic?: string
  ): Promise<string[]> {
    try {
     
      if (mainHeading === 'About Your Partner') {
        topic = 'Partner';
        mainHeading = 'Your Personality';
      }

      // if (mainHeading === "Snapshot Prediction") {
      //   topic = "Snapshot Prediction";
      // }
      // if (mainHeading === "Your Personality") {
      //   topic = 'Blended Predictions';
      // }

      // if (mainHeading === 'Birth Chart Insights') {
      //   mainHeading = 'summary';
      // }

      console.log('mainHeading---->399', mainHeading);
      console.log('topic---->400', topic);

      const categorizeUrl =
        `/house/mobile/categorize?user_id=${userId}` +
        `&main_heading=${encodeURIComponent(mainHeading)}` +
        (topic ? `&topic=${encodeURIComponent(topic)}` : '');

      console.log('mainHeading---->401', categorizeUrl);

      const token = await AsyncStorage.getItem('USER_TOKEN');
      const axiosResponse = await http.get(
        categorizeUrl,
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

      console.log('Dasha categorize data response:', axiosResponse.data);

      const payload = axiosResponse.data;
      const data = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : null;

      if (data) {
        return {
          data,
          updated_list: payload?.updated_list || {},
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

  /**
   * Delete user account
   * @param userId - User ID to delete
   */
  async deleteUser(userId: string): Promise<{
    status: boolean;
    message?: string;
  }> {
    try {
      console.log('Deleting user with ID:', userId);
      
      const axiosResponse = await http.delete(`/mobile/delete/users?user_id=${userId}`, {
        headers: {
          'accept': 'application/json',
        },
      });

      console.log('Delete user response:', axiosResponse.data);

      if (axiosResponse?.data?.status !== false) {
        return {
          status: true,
          message: axiosResponse?.data?.message || 'Account deleted successfully',
        };
      } else {
        throw new Error(axiosResponse?.data?.message || 'Failed to delete account');
      }
    } catch (error: any) {
      console.error('Delete user error:', error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to delete account. Please try again.';
      throw new Error(errorMessage);
    }
  }

  /**
   * Delete astrologer account
   * @param userId - Astrologer user ID to delete
   */
  async deleteAstrologerUser(userId: string): Promise<{
    status: boolean;
    message?: string;
  }> {
    try {
      const token = await AsyncStorage.getItem('USER_TOKEN');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const axiosResponse = await http.delete(
        `/astrologer/mobile/delete/users?user_id=${userId}`,
        {
          headers: {
            accept: 'application/json, text/plain, */*',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (axiosResponse?.data?.status !== false) {
        return {
          status: true,
          message:
            axiosResponse?.data?.message ||
            'User and related data deleted successfully',
        };
      }

      throw new Error(
        axiosResponse?.data?.message || 'Failed to delete account',
      );
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to delete account. Please try again.';
      throw new Error(errorMessage);
    }
  }

  async deleteMember(adminId: string, birthId: string): Promise<{
    status: boolean;
    message?: string;
  }> {
    try {
      const token = await AsyncStorage.getItem('USER_TOKEN');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const axiosResponse = await http.delete(
        `astrologer/members?admin_id=${adminId}&birth_id=${birthId}`,
        {
          headers: {
            accept: 'application/json, text/plain, */*',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return axiosResponse?.data;
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to delete member. Please try again.';
      throw new Error(errorMessage);
    }
  }

  async createAstrologerQuestionsOrder(payload: {
    user_id: string;
    question_count: number;
    currency?: string;
    receipt?: string;
    notes?: Record<string, unknown>;
  }): Promise<{
    order_id: string;
    amount: number;
    currency: string;
    receipt?: string;
    status?: string;
    razorpay_key?: string;
    [key: string]: unknown;
  }> {
    try {
      const token = await AsyncStorage.getItem('USER_TOKEN');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const axiosResponse = await http.post(
        '/astrologer/questions/order',
        {
          user_id: payload.user_id,
          question_count: payload.question_count,
          currency: payload.currency || 'INR',
          receipt: payload.receipt || `questions_${Date.now()}`,
          notes: payload.notes || {},
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      );

      const data = axiosResponse?.data?.data || axiosResponse?.data;
      const orderId =
        data?.order_id ||
        data?.razorpay_order_id ||
        data?.id ||
        axiosResponse?.data?.order_id;

      if (!orderId) {
        throw new Error(
          axiosResponse?.data?.message || 'Invalid order response from server',
        );
      }

      return {
        ...data,
        order_id: String(orderId),
        amount: Number(data?.amount ?? data?.amount_paise ?? 0),
        currency: String(data?.currency || 'INR'),
        razorpay_key:
          data?.razorpay_key ||
          axiosResponse?.data?.razorpay_key ||
          undefined,
      };
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to create questions order. Please try again.';
      throw new Error(errorMessage);
    }
  }

  async verifyAstrologerQuestionsPayment(payload: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }): Promise<{
    success: boolean;
    message?: string;
    status?: string;
    data?: any;
  }> {
    try {
      const token = await AsyncStorage.getItem('USER_TOKEN');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const axiosResponse = await http.post(
        '/astrologer/questions/verify',
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      );

      return axiosResponse?.data || { success: true };
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to verify questions payment. Please try again.';
      throw new Error(errorMessage);
    }
  }
}
