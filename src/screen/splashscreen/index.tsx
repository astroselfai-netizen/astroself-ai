import React, { useEffect, useRef } from 'react';
import { StyleSheet, Image, ImageBackground } from 'react-native';
import { NavigationProp, StackActions } from '@react-navigation/native';

import { responsiveHeight, responsiveWidth } from '../../constant/theme';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import { isAstrologerUser } from '../../utils/userRole';
// import Icon from '../../assets/svgs/icBall.svg';
// import { useTranslation } from 'react-i18next';

type RootStackParamList = {
  Login: undefined;
  HomeScreen: undefined;
  AstrologerHome: undefined;
  AddNewMember: undefined;
};

const SplashScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const membersData = useSelector((state: RootState) => state.app.members);
  const user = useSelector((state: RootState) => state.app.user);
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    const checkUserData = async () => {
      if (hasNavigatedRef.current) {
        return;
      }

      try {
        const token = await AsyncStorage.getItem('USER_TOKEN');
        const userDataString = await AsyncStorage.getItem('USER_DATA');
        const storedUser = userDataString ? JSON.parse(userDataString) : null;

        setTimeout(() => {
          if (hasNavigatedRef.current) {
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
                console.log('Astrologer user found, navigating to AstrologerHome');
                hasNavigatedRef.current = true;
                navigation.dispatch(StackActions.replace('AstrologerHome'));
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
        }, 500);
      } catch (error) {
        console.error('Error checking auth:', error);
        setTimeout(() => {
          if (!hasNavigatedRef.current) {
            hasNavigatedRef.current = true;
            navigation.dispatch(StackActions.replace('Login'));
          }
        }, 1000);
      }
    };

    checkUserData();
  }, [navigation, membersData, user]);

  return (
    <ImageBackground
      source={require('../../assets/image/DarkBackground.png')}
      // blurRadius={12}
      style={style.SplashScreenPicContainer}
    >
      <Image
        source={require('../../assets/icons/Subtract-dark.png')}
        style={[style.SubtractIcon]}
      />
    </ImageBackground>
  );
};

const style = StyleSheet.create({
  SplashScreenPicContainer: {
    height: responsiveHeight('100%'),
    width: responsiveWidth('100%'),
    alignItems: 'center',
    justifyContent: 'center',
    // resizeMode: 'contain',
    // transform: [{ rotate: "340deg" }],
  },
  SubtractIcon: {
    height: responsiveWidth(20),
    width: responsiveWidth(70),
    resizeMode: 'contain',
    tintColor: 'white',
  },
});

export default SplashScreen;
