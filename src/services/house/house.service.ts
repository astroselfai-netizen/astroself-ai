import AsyncStorage from '@react-native-async-storage/async-storage';
import http from '../../utils/http';

export interface SubCard {
  id: number;
  title: string;
}

export interface CardDataItem {
  card_type: string;
  sub_card?: SubCard[];
}

export interface PredictionHeadingsResponse {
  status: boolean;
  type: 'lifenow' | 'lifeview' | 'staticpredictions' | 'dynamicpredictions';
  data: CardDataItem[];
  message?: string;
}

class HouseService {
  /**
   * Fetches prediction headings for a given user ID and type
   * @param userId - The user ID for which to fetch prediction headings
   * @param type - The type of prediction ('lifenow', 'lifeview', 'staticpredictions', or 'dynamicpredictions')
   * @returns The prediction headings array with card_type and optional sub_card items
   */
  async getPredictionHeadings(
    userId: string,
    type: 'lifenow' | 'lifeview' | 'staticpredictions' | 'dynamicpredictions',
  ): Promise<CardDataItem[]> {
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
        },
      );

      console.log('Prediction headings response:', axiosResponse.data);

      if (
        axiosResponse.data?.data &&
        Array.isArray(axiosResponse.data.data)
      ) {
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

