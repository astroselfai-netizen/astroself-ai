import React from 'react';
import {
  Dimensions,
  Image,
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontFamily, responsiveWidth } from '../constant/theme';

const GOLD = '#C5A370';
const SCREEN_WIDTH = Dimensions.get('window').width;

type AstrologerScreenHeaderProps = {
  title: string;
};

const AstrologerScreenHeader = ({ title }: AstrologerScreenHeaderProps) => {
  const insets = useSafeAreaInsets();

  return (
    <ImageBackground
      source={require('../assets/image/DarkBackground.png')}
      style={[styles.header, { paddingTop: insets.top  }]}
      imageStyle={styles.headerImage}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.row}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.underline} />
        </View>
        <Image
          source={require('../assets/icons/Subtract-dark.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  header: {
    width: SCREEN_WIDTH,
    alignSelf: 'stretch',
    paddingHorizontal: responsiveWidth('4'),
    paddingBottom: responsiveWidth('4'),
  },
  headerImage: {
    resizeMode: 'cover',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWrap: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: fontFamily.bold,
  },
  underline: {
    width: 42,
    height: 3,
    marginTop: 6,
    borderRadius: 2,
    backgroundColor: GOLD,
  },
  logo: {
    width: responsiveWidth('30'),
    height: responsiveWidth('8'),
    tintColor: '#FFFFFF',
  },
});

export default AstrologerScreenHeader;
