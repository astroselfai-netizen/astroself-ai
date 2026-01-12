import React, { useEffect } from 'react';
import { StyleSheet, Image, ImageBackground } from 'react-native';
import { NavigationProp, StackActions } from '@react-navigation/native';

import { responsiveHeight, responsiveWidth } from '../../constant/theme';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { icons} from "../../assets/index"
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
// import Icon from '../../assets/svgs/icBall.svg';
// import { useTranslation } from 'react-i18next';

type RootStackParamList = {
  Login: undefined;
  HomeScreen: undefined;
  AddNewMember: undefined;
};

const SplashScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const membersData = useSelector((state: RootState) => state.app.members);
  const user = useSelector((state: RootState) => state.app.user);

  // const { i18n } = useTranslation();  // t is the function to get translations

  // const currentLanguage = i18n.language;

  useEffect(() => {
    const checkUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('USER_TOKEN');

        setTimeout(() => {
          if (token) {
            // User is logged in - check if they have any members
            console.log('User has token, checking members data...');
            console.log('Current membersData:', membersData);
            console.log('Current user:', user);
            
            // Wait for user data to be loaded (indicates app initialization is complete)
            if (user && user._id) {
              console.log('User data loaded, checking members...');
              
              // Check if members data is loaded
              if (membersData !== undefined) {
                console.log('Members data loaded:', membersData);
                
                if (!membersData || (Array.isArray(membersData) && membersData.length === 0)) {
                  // User has no members, show AddNewMember screen
                  console.log('No members found, navigating to HomeScreen then AddNewMember');
                  // Set flag to navigate to AddNewMember after HomeScreen loads
                  AsyncStorage.setItem('NAVIGATE_TO_ADD_MEMBER', 'true');
                  
                  // Navigate to HomeScreen first (which loads MyTabs)
                  // HomeScreen will check the flag and navigate to AddNewMember immediately
                  navigation.dispatch(StackActions.replace('StartExploring'));
                } else {
                  // User has members, go to home screen
                  console.log('Members found, navigating to HomeScreen');
                  navigation.dispatch(StackActions.replace('HomeScreen'));
                }
              } else {
                console.log('Members data not yet loaded, waiting...');
                // If members data is not loaded yet, wait a bit more
                // setTimeout(() => {
                //   if (!membersData || (Array.isArray(membersData) && membersData.length === 0)) {
                //     navigation.dispatch(StackActions.replace('AddNewMember'));
                //   } else {
                //     navigation.dispatch(StackActions.replace('HomeScreen'));
                //   }
                // }, 1000);
              }
            } else {
              console.log('User data not yet loaded, waiting...');
            }
          } else {
            // User not logged in
            console.log('No token found, navigating to Login');
            navigation.dispatch(StackActions.replace('Login'));
          }
        }, 500); // 2 second delay
      } catch (error) {
        console.error('Error checking auth:', error);
        setTimeout(() => {
          navigation.dispatch(StackActions.replace('Login'));
        }, 1000); // 2 second delay
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
  },
});

export default SplashScreen;
