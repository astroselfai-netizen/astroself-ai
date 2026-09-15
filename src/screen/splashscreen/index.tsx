import React, { useEffect, useRef } from 'react';
import { StyleSheet, ImageBackground, StatusBar, Text, View } from 'react-native';
import { NavigationProp, StackActions } from '@react-navigation/native';

import {
  fontFamily,
  responsiveHeight,
  responsiveWidth,
} from '../../constant/theme';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import { isAstrologerUser } from '../../utils/userRole';
import UserService from '../../services/user/user.service';
import { resolveAstrologerPostAuthScreen } from '../../utils/resolveAstrologerPostAuthNavigation';
import { navigationRef } from '../../utils/navigationRef';

type RootStackParamList = {
  Login: undefined;
  HomeScreen: undefined;
  AstrologerHome: undefined;
  AddNewMember: undefined;
};

const GOLD = '#C8A165';

const SplashScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const membersData = useSelector((state: RootState) => state.app.members);
  const user = useSelector((state: RootState) => state.app.user);
  const hasNavigatedRef = useRef(false);
  const splashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shouldSkipSplashAutoNavigation = () => {
    if (hasNavigatedRef.current) {
      return true;
    }
    if (navigationRef.isReady()) {
      const current = navigationRef.getCurrentRoute()?.name;
      if (current && current !== 'SplashScreen') {
        return true;
      }
    }
    return false;
  };

  useEffect(() => {
    const checkUserData = async () => {
      if (hasNavigatedRef.current) {
        return;
      }

      try {
        const token = await AsyncStorage.getItem('USER_TOKEN');
        const userDataString = await AsyncStorage.getItem('USER_DATA');
        const storedUser = userDataString ? JSON.parse(userDataString) : null;

        splashTimerRef.current = setTimeout(async () => {
          if (shouldSkipSplashAutoNavigation()) {
            hasNavigatedRef.current = true;
            return;
          }

          if (token) {
            console.log('User has token, checking members data...');
            console.log('Current membersData:', membersData);
            console.log('Current user:', user);

            const activeUser = user?._id ? user : storedUser;
            const isAstrologer =
              isAstrologerUser(user) || isAstrologerUser(storedUser);

            if (activeUser?._id) {
              console.log('User data loaded, checking role and members...');

              if (isAstrologer) {
                console.log('Astrologer user found, resolving post-auth screen');
                hasNavigatedRef.current = true;

                const userId =
                  activeUser._id || activeUser.user_id || activeUser.id;
                const userService = new UserService();
                const { screen, params } = await resolveAstrologerPostAuthScreen(
                  userService,
                  String(userId),
                  activeUser as Record<string, unknown>,
                );

                if (screen === 'AstrologerCreateClientScreen') {
                  navigation.dispatch(
                    StackActions.replace('AstrologerCreateClientScreen', params),
                  );
                } else {
                  navigation.dispatch(StackActions.replace('AstrologerHome'));
                }
                return;
              }

              // Normal user auto-login disabled for now
              /*
              if (membersData !== undefined) {
                console.log('Members data loaded:', membersData);

                if (
                  !membersData ||
                  (Array.isArray(membersData) && membersData.length === 0)
                ) {
                  console.log('No members found, navigating to StartExploring');
                  AsyncStorage.setItem('NAVIGATE_TO_ADD_MEMBER', 'true');
                  hasNavigatedRef.current = true;
                  navigation.dispatch(StackActions.replace('StartExploring'));
                } else {
                  console.log('Members found, navigating to HomeScreen');
                  hasNavigatedRef.current = true;
                  navigation.dispatch(StackActions.replace('HomeScreen'));
                }
              } else {
                console.log('Members data not yet loaded, waiting...');
              }
              */
              console.log('Normal login disabled, navigating to Login');
              hasNavigatedRef.current = true;
              navigation.dispatch(StackActions.replace('Login'));
            } else {
              console.log('User data not yet loaded, waiting...');
            }
          } else {
            console.log('No token found, navigating to Login');
            hasNavigatedRef.current = true;
            navigation.dispatch(StackActions.replace('Login'));
          }
        }, 2200);
      } catch (error) {
        console.error('Error checking auth:', error);
        splashTimerRef.current = setTimeout(() => {
          if (shouldSkipSplashAutoNavigation()) {
            hasNavigatedRef.current = true;
            return;
          }
          hasNavigatedRef.current = true;
          navigation.dispatch(StackActions.replace('Login'));
        }, 2200);
      }
    };

    checkUserData();

    return () => {
      if (splashTimerRef.current) {
        clearTimeout(splashTimerRef.current);
        splashTimerRef.current = null;
      }
    };
  }, [navigation, membersData, user]);

  return (
    <ImageBackground
      source={require('../../assets/image/DarkBackground.png')}
      style={style.SplashScreenPicContainer}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={style.content}>
        <View style={style.badge}>
          <Text style={style.badgeText}>CALM YOUR NERVES AND ENJOY YOUR LIFE</Text>
        </View>

        <Text style={style.headline}>
          Astrodha<Text style={style.headlineGold}>.AI</Text>
          {' - KNOW\nTHE TIMING OF EVENTS\nYOU ARE EXPECTING'}
        </Text>

        <Text style={style.subtext}>
          A next-generation AI-powered workspace that helps you ask questions
          about life events.
        </Text>
      </View>
    </ImageBackground>
  );
};

const style = StyleSheet.create({
  SplashScreenPicContainer: {
    height: responsiveHeight('100%'),
    width: responsiveWidth('100%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    paddingHorizontal: responsiveWidth('7'),
    alignItems: 'center',
  },
  badge: {
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 50,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: responsiveHeight('4'),
  },
  badgeText: {
    color: GOLD,
    fontSize: 10,
    fontFamily: fontFamily.medium,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  headline: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 36,
    fontFamily: fontFamily.bold,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  headlineGold: {
    color: GOLD,
    fontFamily: fontFamily.bold,
  },
  subtext: {
    marginTop: responsiveHeight('2.5'),
    color: 'rgba(255,255,255,0.88)',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    maxWidth: responsiveWidth('82'),
  },
});

export default SplashScreen;
