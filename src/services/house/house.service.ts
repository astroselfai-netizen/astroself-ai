import AsyncStorage from '@react-native-async-storage/async-storage';
import http from '../../utils/http';

export interface PredictionHeadingsResponse {
  status: boolean;
  type: 'lifenow' | 'lifeview';
  data: {
    [key: string]: string; // e.g., { "1": "Snapshot Predictions", "2": "Your Personality" }
  };
  message?: string;
}

class HouseService {
  /**
   * Fetches prediction headings for a given user ID and type
   * @param userId - The user ID for which to fetch prediction headings
   * @param type - The type of prediction ('lifenow' or 'lifeview')
   * @returns The prediction headings object with numeric keys and title values
   */
  async getPredictionHeadings(
    userId: string,
    type: 'lifenow' | 'lifeview'
  ): Promise<{ [key: string]: string }> {
    try {
      const token = await AsyncStorage.getItem('USER_TOKEN');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const axiosResponse = await http.post<PredictionHeadingsResponse>(
        'house/prediction/headings',
        {
          user_id: userId,
          type: type,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('Prediction headings response:', axiosResponse.data);

      if (axiosResponse.data?.data && typeof axiosResponse.data.data === 'object') {
        return axiosResponse.data.data;
      }

      throw new Error('Invalid response format from prediction headings API');
    } catch (error: any) {
      console.error('Get prediction headings error in service:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        throw new Error('Invalid request parameters.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      } else if (error.response?.status === 404) {
        throw new Error('Prediction headings not found for this user.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR') {
        throw new Error('Network error. Please check your connection.');
      }

      throw error;
    }
  }
}

export default new HouseService();

