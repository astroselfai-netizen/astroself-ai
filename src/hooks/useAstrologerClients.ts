import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../state/store';
import { setUser } from '../state/slices/appSlice';
import UserService from '../services/user/user.service';
import { Api } from '../types/api';
import { mergeUserProfile } from '../utils/userRole';

const PAGE_SIZE = 10;

export const useAstrologerClients = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const user = useSelector((state: RootState) => state.app.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Api.User.Res.AstrologerClient[]>([]);
  const [userDetails, setUserDetails] = useState<
    (Api.User.Res.Detail & Record<string, unknown>) | null
  >(null);

  const fetchClients = useCallback(
    async (forceRefresh = false) => {
      try {
        setError(null);

        let userId = user?._id;

        if (!userId) {
          const userDataString = await AsyncStorage.getItem('USER_DATA');
          if (userDataString) {
            const userData = JSON.parse(userDataString);
            userId = userData._id;
            dispatch(setUser(userData));
          }
        }

        if (!userId) {
          setLoading(false);
          return;
        }

        setLoading(true);
        const userService = new UserService();
        const skip = forceRefresh ? 0 : 0;
        const response = await userService.getAstrologerClients(
          userId,
          skip,
          PAGE_SIZE,
        );

        console.log('====================================');
        console.log('response', response);
        console.log('====================================');

        if (response.status && response.data) {
          setClients(response.data.data || []);
          setUserDetails(response.data.user_details || null);
          if (response.data.user_details) {
            const mergedUser = mergeUserProfile(
              user,
              response.data.user_details as Record<string, unknown>,
            );
            dispatch(setUser(mergedUser as Api.User.Res.Detail));
            await AsyncStorage.setItem('USER_DATA', JSON.stringify(mergedUser));
          }
        }
      } catch (fetchError: unknown) {
        const err = fetchError as { message?: string };
        if (err.message?.includes('Authentication failed')) {
          navigation.navigate('Login' as never);
        }
        setError(err.message || 'Failed to fetch clients');
      } finally {
        setLoading(false);
      }
    },
    [user?._id, dispatch, navigation],
  );

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const refreshClients = useCallback(() => fetchClients(true), [fetchClients]);

  return {
    clients,
    userDetails,
    loading,
    error,
    refreshClients,
  };
};
