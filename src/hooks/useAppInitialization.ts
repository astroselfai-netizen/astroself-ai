import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setUser, setUserToken, setMembers } from '../state/slices/appSlice';
import serviceFactory from '../services/serviceFactory';
import UserService from '../services/user/user.service';

export const useAppInitialization = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing app...');
        
        // Initialize service factory
        serviceFactory.create();
        console.log('Service factory initialized');
        
        // Load user data from AsyncStorage
        const userDataString = await AsyncStorage.getItem('USER_DATA');
        const userToken = await AsyncStorage.getItem('USER_TOKEN');

        console.log('Storage data - User data exists:', !!userDataString);
        console.log('Storage data - Token exists:', !!userToken);

        if (userDataString && userToken) {
          try {
            const userData = JSON.parse(userDataString);
            console.log('Parsed user data:', userData);
            
            // Dispatch user data to Redux state
            dispatch(setUser(userData));
            dispatch(setUserToken(userToken));
            
            // Fetch profile data including members immediately
            try {
              const userService = new UserService();
              const profileResponse = await userService.getProfileData(userData._id || userData.user_id, 0);
              
              if (profileResponse.status && profileResponse.data.user_details) {
                console.log('Profile data fetched during app initialization');
                console.log('Members data length:', profileResponse.data.data?.length);
                console.log('Members data:', profileResponse.data.data);
                
                // Update user data with latest profile info
                dispatch(setUser(profileResponse.data.user_details));
                // Set members data
                dispatch(setMembers(profileResponse.data.data as any));
                
                console.log('Profile and members data loaded successfully during app initialization');
              }
            } catch (profileError) {
              console.error('Error fetching profile data during app initialization:', profileError);
              // Don't clear user data if profile fetch fails, just log the error
              // The user can still use the app, profile data will be fetched later
            }
            
            console.log('App initialized with user data from storage');
          } catch (parseError) {
            console.error('Error parsing user data from storage:', parseError);
            // Clear invalid data
            await AsyncStorage.removeItem('USER_DATA');
            await AsyncStorage.removeItem('USER_TOKEN');
            console.log('Cleared invalid user data from storage');
          }
        } else {
          console.log('No user data found in storage');
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();
  }, [dispatch]);
};
