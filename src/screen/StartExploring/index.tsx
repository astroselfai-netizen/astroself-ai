import React from 'react';
import { StyleSheet, ImageBackground, Text, TouchableOpacity, View } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { color, responsiveHeight, responsiveWidth } from '../../constant/theme';

type RootStackParamList = {
  Login: undefined;
  HomeScreen: undefined;
  AddNewMember: undefined;
};

const StartExploring = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <ImageBackground
      source={require('../../assets/image/DarkBackground.png')}
      // blurRadius={12}
      style={style.SplashScreenPicContainer}
    >
      <ImageBackground
        source={require('../../assets/icons/unsplash.png')}
        style={[style.SubtractIcon]}
      >
        <View style={style.contentContainer}>
          <View style={style.titleContainer}>
            <Text style={style.stylishText}>
              CREATE CHART AND{'\n\n'}
              <Text style={style.stylishText}>START EXPLORING</Text>
            </Text>
          </View>
          <View style={style.buttonContainer}>
            <TouchableOpacity
              style={[
                style.continueButton,
                { borderColor: color.Orangeaccentcolor },
              ]}
              onPress={() => navigation.navigate('AddNewMember')}
            >
              <Text
                style={[
                  style.continueButtonText,
                  { color: color.Orangeaccentcolor },
                ]}
              >
                Continue
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </ImageBackground>
  );
};

const style = StyleSheet.create({
  SplashScreenPicContainer: {
    // height: responsiveHeight('100%'),
    // width: responsiveWidth('100%'),
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // resizeMode: 'contain',
    // transform: [{ rotate: "340deg" }],
  },
  SubtractIcon: {
    height: responsiveHeight('100%'),
    width: responsiveWidth('100%'),
    resizeMode: 'contain',
    // opacity: 0.5,
  },
  contentContainer: {
    flex: 1,
    width: '100%',
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stylishText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700', // Bold
    textAlign: 'center',
    letterSpacing: 4,   // Aksharon ke beech gap
    textTransform: 'uppercase',
    textShadowColor: 'rgba(255, 255, 255, 0.5)', // Halka glow effect
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subText: {
    fontSize: 16,
    fontWeight: '500', // Patla font
    letterSpacing: 2,
    // paddingTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  buttonContainer: {
    paddingBottom: responsiveHeight('8'),
    paddingHorizontal: responsiveWidth('4'),
    alignItems: 'center',
  },
  continueButton: {
    // backgroundColor: '#DF8A5D',
    paddingVertical: responsiveHeight('1.5'),
    paddingHorizontal: responsiveWidth('8'),
    borderRadius: 8,
    minWidth: responsiveWidth('40'),
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default StartExploring;
