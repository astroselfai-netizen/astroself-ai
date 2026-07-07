import { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../state/store';
import UserService from '../services/user/user.service';
import { Api } from '../types/api';
import { setMembers, setUser } from '../state/slices/appSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { isAstrologerUser, mergeUserProfile } from '../utils/userRole';

export const useProfileData = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const user = useSelector((state: RootState) => state.app.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<Api.User.Res.Detail | null>(null);
  const [membersData, setMembersData] = useState<null|any>(
    null,
  );

  const fetchProfileData = useCallback(async (forceRefresh = false) => {
    try {
     
      setError(null);
      
      let userId = user?._id;
      let currentUser = user as (Api.User.Res.Detail & { role?: string }) | undefined;
      
      // If no user in Redux state, try to get from AsyncStorage
      if (!userId) {
        try {
          const userDataString = await AsyncStorage.getItem('USER_DATA');
          if (userDataString) {
            const userData = JSON.parse(userDataString);
            userId = userData._id;
            currentUser = userData;
            // Also update Redux state
            dispatch(setUser(userData));
          }
        } catch (storageError) {
          console.error('Error reading user data from storage:', storageError);
        }
      }
      
      setLoading(true);
      if (!userId) {
        console.log('No user ID found, skipping profile fetch');
        setLoading(false);
        return;
      }

      if (isAstrologerUser(currentUser)) {
        console.log('Astrologer user - skipping regular profile fetch');
        setLoading(false);
        return;
      }
       

      const userService = new UserService();
      // Add a timestamp parameter to force refresh
      const skip = forceRefresh ? 0 : 0; // You can add a timestamp here if needed
      const response = await userService.getProfileData(userId, skip);
      
      if (response.status && response.data.user_details) {
        console.log('Profile data fetched successfully, updating state...');
        const mergedUser = mergeUserProfile(
          user,
          response.data.user_details as Record<string, unknown>,
        );
        setProfileData(mergedUser as Api.User.Res.Detail);

        console.log('Members data length:', response.data.data?.length);
        console.log('Members data:', response.data.data);
        setMembersData(response.data.data);
        dispatch(setUser(mergedUser as Api.User.Res.Detail));
        dispatch(setMembers(response.data.data));
        await AsyncStorage.setItem('USER_DATA', JSON.stringify(mergedUser));
        console.log('State updated successfully');
      }
    } catch (error: any) {
      await AsyncStorage.removeItem('USER_TOKEN');
      await AsyncStorage.removeItem('USER_DATA');
      navigation.navigate('Login');
      console.error('Error fetching profile data:', error);
      setError(error.message || 'Failed to fetch profile data');
    } finally {
      setLoading(false);
    }
  }, [user?._id, dispatch]);

  const refreshProfileData = useCallback(async () => {
    console.log('refreshProfileData called - starting refresh...');
    await fetchProfileData(true); // Force refresh
    console.log('refreshProfileData completed');
  }, [fetchProfileData]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  // Poll every 20 seconds when any member has processing_data === true
  useEffect(() => {
    const members = membersData || [];
    const anyProcessing = members.some(
      (m: any) => m.processing_data === false || m.processing_data === 'false',
    );
    if (!anyProcessing) return;

    const intervalId = setInterval(() => {
      fetchProfileData(true);
    }, 20000);
    return () => clearInterval(intervalId);
  }, [membersData, fetchProfileData]);

  return {
    profileData,
    membersData,
    loading,
    error,
    refreshProfileData,
    fetchProfileData
  };
};
