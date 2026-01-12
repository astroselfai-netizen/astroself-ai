import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacityProps,
  TextStyle,
  ViewStyle,
  View,
  Image,
  Platform,
  TouchableOpacity,
  SafeAreaView,
  InteractionManager,
} from 'react-native';
import {color, font, responsiveWidth} from '../../constant/theme';
import {icons} from '../../assets';
import {useNavigation, useRoute} from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  onPress?: () => void;
  Customcontainer?: ViewStyle;
  titleStyle?: TextStyle;
  showBack?: boolean;
  rightIcon?: any;
  LeftIcon?: any;
  onPressRight?: () => void;
  onPressLeft?: () => void;
  rightIconContainerStyle?: ViewStyle;
  leftIconContainerStyle?:ViewStyle;
  rightIconStyle?: any;
  cutomReightContainer?: React.ReactNode;
}

const Header: React.FC<ButtonProps> = ({
  title,
  rightIcon,
  rightIconContainerStyle,
  leftIconContainerStyle,
  LeftIcon,
  rightIconStyle,
  onPressRight,
  onPressLeft,
  showBack,
  cutomReightContainer,
}: any) => {
  const navigation = useNavigation();
  const { theme, colors } = useTheme();
  const route = useRoute();
  const [isNavigating, setIsNavigating] = React.useState(false);

  const handleBackPress = React.useCallback(() => {
    if (isNavigating) return;
    setIsNavigating(true);
    
    InteractionManager.runAfterInteractions(() => {
      console.log('route.name', route.name);
      // Special case for NotificationScreen
      if (route.name === "NotificationScreen") {
        navigation.navigate("HomeScreen");
        } else if (route.name === "AddReminder") {
        // Reset only the current page
        navigation.navigate("ReminderScreen");
      } else if (navigation?.canGoBack()) {
        navigation.goBack();
      }
      setIsNavigating(false);
    });
  }, [navigation, isNavigating, route.name]);

  return (
    <SafeAreaView>
      <View style={styles.header}>
        {showBack ? (
          <TouchableOpacity
            disabled={isNavigating}
            style={[styles.iconContainer, { marginRight: responsiveWidth(2) }]}
            onPress={handleBackPress}
          >
            <Image source={icons.icBack} style={[styles.iconStyle ,{tintColor: theme === 'dark' ? colors.textPrimary : colors.DarkNavy}]} />
          </TouchableOpacity>
        ) : null}

        {LeftIcon ? (
          <TouchableOpacity
            style={[styles.iconContainerLeft, leftIconContainerStyle]}
            onPress={onPressLeft}
          >
            <Image
              source={LeftIcon}
              style={[styles.leftIconStyle ,{tintColor: theme === 'dark' ? colors.textPrimary : colors.DarkNavy}]}
            />
          </TouchableOpacity>
        ) : null}
        <Text style={[styles.headerTitle ,{color: theme === 'dark' ? colors.textPrimary : colors.DarkNavy}]}>{title}</Text>
        {rightIcon ? (
          <TouchableOpacity
            style={[styles.iconContainer, rightIconContainerStyle]}
            onPress={onPressRight}
          >
            <Image
              source={rightIcon}
              style={[styles.iconStyle, rightIconStyle ,{tintColor: theme === 'dark' ? colors.textPrimary : colors.DarkNavy}]}
            />
          </TouchableOpacity>
        ) : null}
        {cutomReightContainer}
      </View>
    </SafeAreaView>
  );
};

export {Header};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    // justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(3),
    paddingTop: responsiveWidth(1),
    // paddingBottom: responsiveWidth(2),
  },
  headerTitle: {
    ...font.h5,
    // color: color.black,
    flex: 1,
  },
  iconStyle: {
    height: responsiveWidth(6),
    width: responsiveWidth(6),
    resizeMode: 'contain',
  },
  leftIconStyle: {
    height: responsiveWidth("15%"),
    width: responsiveWidth("30%"),
    resizeMode: 'contain',
  },
  iconContainer: {
    // backgroundColor: color.white,
    height: responsiveWidth(8),
    width: responsiveWidth(8),
    borderRadius: responsiveWidth(4),
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerLeft: {
    height: responsiveWidth("15%"),
    width: responsiveWidth("30%"),
    justifyContent: 'center',
    alignItems: 'center',
  },
});
