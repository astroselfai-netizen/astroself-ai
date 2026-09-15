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
import { SvgXml } from 'react-native-svg';
import { fontFamily, responsiveWidth } from '../constant/theme';
import { useAstrologerUnreadCount } from '../hooks/useAstrologerUnreadCount';

const GOLD = '#C5A370';
const SCREEN_WIDTH = Dimensions.get('window').width;

type AstrologerScreenHeaderProps = {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  showNotificationBell?: boolean;
};

const BELL_SVG = `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const AstrologerScreenHeader = ({
  title,
  showBack = false,
  onBack,
  showNotificationBell = false,
}: AstrologerScreenHeaderProps) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const unreadCount = useAstrologerUnreadCount(showNotificationBell);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const openNotifications = () => {
    const rootNav =
      navigation.getParent()?.getParent() || navigation.getParent() || navigation;
    const nav = rootNav as { navigate?: (screen: string) => void };
    if (nav.navigate) {
      nav.navigate('AstrologerNotificationsScreen');
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
        <View style={styles.rightCluster}>
          <Image
            source={require('../assets/icons/Subtract-dark.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          {showNotificationBell ? (
            <TouchableOpacity
              onPress={openNotifications}
              style={styles.bellBtn}
              activeOpacity={0.75}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <SvgXml xml={BELL_SVG} width={20} height={20} />
              {unreadCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : String(unreadCount)}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ) : null}
        </View>
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
  rightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#1A3673',
    fontSize: 9,
    lineHeight: 11,
    fontFamily: fontFamily.bold,
  },
  logo: {
    width: responsiveWidth('30'),
    height: responsiveWidth('8'),
    tintColor: '#FFFFFF',
  },
});

export default AstrologerScreenHeader;
