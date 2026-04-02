import { Service } from '../Service';
import http from '../../utils/http';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserPlanDetailsResponse {
  current_plan: string;
  members_allow: number;
  available_members_allow: number;
  email: string;
}

export interface AssignFamilyPlanRequest {
  user_id: string;
  birth_input_id: string;
}

export interface AssignFamilyPlanResponse {
  success: boolean;
  message: string;
}

export interface AllocatePlanRequest {
  user_ids: string[];
}

export interface AllocatePlanResponse {
  status: boolean;
  message: string;
}

class PlanService extends Service {
  /**
   * Fetches user plan details
   * @param userId - Logged-in user's ID
   */
  async getUserPlanDetails(userId: string): Promise<UserPlanDetailsResponse> {
    try {
      const token = await AsyncStorage.getItem('USER_TOKEN');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await http.get<UserPlanDetailsResponse>(
        `user-plan-details/${userId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error fetching user plan details:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch plan details';
      throw new Error(errorMessage);
    }
  }

  /**
   * Assigns family plan to a member
   * @param user_id - Logged-in user's ID
   * @param birth_input_id - Member's birth_input_id
   */
  async assignFamilyPlan(
    user_id: string,
    birth_input_id: string
  ): Promise<AssignFamilyPlanResponse> {
    try {
      const token = await AsyncStorage.getItem('USER_TOKEN');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await http.post<AssignFamilyPlanResponse>(
        'assign-family-plan',
        { user_id, birth_input_id },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      console.log('Assign family plan API Response:', response.data);

      return response.data;
    } catch (error: any) {
      console.error('Error assigning family plan:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to assign family plan';
      throw new Error(errorMessage);
    }
  }

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

