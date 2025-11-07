import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setShowInfoContainer } from '../state/slices/appSlice';
import { AppState, AppStateStatus } from 'react-native';
import { store } from '../state/store';

/**
 * Utility function to check and update member creation timestamp
 * Can be called from anywhere in the app
 */
export const checkAndUpdateMemberCreationTimestamp = async () => {
  try {
    const timestampStr = await AsyncStorage.getItem('MEMBER_CREATED_TIMESTAMP');
    if (timestampStr) {
      const timestamp = parseInt(timestampStr, 10);
      const currentTime = Date.now();
      const timeDifference = currentTime - timestamp;
      const twoMinutesInMs = 2 * 60 * 1000; // 2 minutes in milliseconds

      if (timeDifference < twoMinutesInMs) {
        // Show infoContainer if within 2 minutes
        store.dispatch(setShowInfoContainer(true));

        // Return remaining time for timer
        return twoMinutesInMs - timeDifference;
      } else {
        // Time has passed, clear the timestamp
        store.dispatch(setShowInfoContainer(false));
        AsyncStorage.removeItem('MEMBER_CREATED_TIMESTAMP');
        return 0;
      }
    } else {
      store.dispatch(setShowInfoContainer(false));
      return 0;
    }
  } catch (err) {
    console.error('Error checking member creation timestamp:', err);
    store.dispatch(setShowInfoContainer(false));
    return 0;
  }
};

/**
 * Custom hook to check and manage member creation timestamp
 * Updates Redux state to show/hide infoContainer based on 2-minute window
 * This hook should be used in a root component or app initialization
 * It checks timestamp on mount and when app comes to foreground
 */
export const useMemberCreationTimestamp = () => {
  const dispatch = useDispatch();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkMemberCreationTimestamp = async () => {
    try {
      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      const timestampStr = await AsyncStorage.getItem('MEMBER_CREATED_TIMESTAMP');
      if (timestampStr) {
        const timestamp = parseInt(timestampStr, 10);
        const currentTime = Date.now();
        const timeDifference = currentTime - timestamp;
        const twoMinutesInMs = 2 * 60 * 1000; // 2 minutes in milliseconds

        if (timeDifference < twoMinutesInMs) {
          // Show infoContainer if within 2 minutes
          dispatch(setShowInfoContainer(true));

          // Set timer to hide after remaining time
          const remainingTime = twoMinutesInMs - timeDifference;
          timerRef.current = setTimeout(() => {
            dispatch(setShowInfoContainer(false));
            // Clear the timestamp after 2 minutes
            AsyncStorage.removeItem('MEMBER_CREATED_TIMESTAMP');
            timerRef.current = null;
          }, remainingTime);
          
          return remainingTime;
        } else {
          // Time has passed, clear the timestamp
          dispatch(setShowInfoContainer(false));
          AsyncStorage.removeItem('MEMBER_CREATED_TIMESTAMP');
          return 0;
        }
      } else {
        dispatch(setShowInfoContainer(false));
        return 0;
      }
    } catch (err) {
      console.error('Error checking member creation timestamp:', err);
      dispatch(setShowInfoContainer(false));
      return 0;
    }
  };

  // Check timestamp on mount and when app comes to foreground
  useEffect(() => {
    checkMemberCreationTimestamp().then((remainingTime) => {
      if (remainingTime && remainingTime > 0) {
        // Timer already set in checkMemberCreationTimestamp
      }
    });

    // Check timestamp when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Clear existing timer before checking again
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        checkMemberCreationTimestamp().then((remainingTime) => {
          if (remainingTime && remainingTime > 0) {
            // Timer already set in checkMemberCreationTimestamp
          }
        });
      }
    });

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);
};

