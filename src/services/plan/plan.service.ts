import { Service } from '../Service';
import http from '../../utils/http';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AllocatePlanRequest {
  user_ids: string[];
}

export interface AllocatePlanResponse {
  status: boolean;
  message: string;
}

class PlanService extends Service {
  /**
   * Allocates plan to multiple users
   * @param user_ids - Array of user IDs to allocate plan to
   * @returns Response with status and message
   */
  async allocatePlanMultiSelection(
    user_ids: string[]
  ): Promise<AllocatePlanResponse> {
    try {
      // Get authentication token
      const token = await AsyncStorage.getItem('USER_TOKEN');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Allocating plan to user_ids:', user_ids);

      // Make API call
      const response = await http.post<AllocatePlanResponse>(
        'allocate-plan-multi-selection',
        {
          user_ids,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      console.log('Allocate plan API Response:', response.data);

      // Check if response is successful
      if (response.data?.status === true) {
        return response.data;
      }

      throw new Error(response.data?.message || 'Failed to allocate plan');
    } catch (error: any) {
      console.error('Error allocating plan:', error);
      console.error('Error response:', error.response?.data);
      
      // Re-throw with a more user-friendly message
      const errorMessage = 
        error.response?.data?.message || 
        error.message || 
        'Failed to allocate plan. Please try again.';
      
      throw new Error(errorMessage);
    }
  }
}

export default new PlanService();

