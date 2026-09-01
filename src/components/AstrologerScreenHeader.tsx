import React from 'react';
import {
  Dimensions,
  Image,
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontFamily, responsiveWidth } from '../constant/theme';

const GOLD = '#C5A370';
const SCREEN_WIDTH = Dimensions.get('window').width;

type AstrologerScreenHeaderProps = {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
};

const AstrologerScreenHeader = ({
  title,
  showBack = false,
  onBack,
}: AstrologerScreenHeaderProps) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <ImageBackground
      source={require('../assets/image/DarkBackground.png')}
      style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}
      imageStyle={styles.headerImage}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.row}>
        {showBack ? (
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Image
              source={require('../assets/icons/back.png')}
              style={styles.backIcon}
            />
          </TouchableOpacity>
        ) : null}
        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
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
    paddingBottom: responsiveWidth('4.5'),
  },
  headerImage: {
    resizeMode: 'cover',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    marginRight: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
    tintColor: '#FFFFFF',
  },
  titleWrap: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: fontFamily.semiBold,
  },
  underline: {
    width: 38,
    height: 3,
    marginTop: 5,
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
