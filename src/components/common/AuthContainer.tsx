import {
  ImageBackground,
  StyleSheet,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import React from 'react';
import { color, responsiveHeight, responsiveWidth } from '../../constant/theme';
import { useTheme } from '../../context/ThemeContext';

interface AuthContainerProps extends ViewProps {
  containerStyle?: ViewStyle;
  subContainerStyle?: ViewStyle;
  children?: React.ReactNode;
}

const AuthContainer: React.FC<AuthContainerProps> = ({
  containerStyle,
  subContainerStyle,
  children,
}) => {
  const { colors, theme } = useTheme();
  return (
    <View style={[styles.container, containerStyle]}>
      <ImageBackground
        source={theme === 'dark' ? require('../../assets/image/DarkBackground.png') : require('../../assets/image/LightBackground.png')} // Always use dark background for auth
        style={styles.background}
        resizeMode="cover"
      >
        <View style={[styles.subContainer, subContainerStyle]}>
          {children}
        </View>
      </ImageBackground>
    </View>
  );
};

export { AuthContainer };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202945' // Always dark background for auth
  },
  background: {
    flex: 1,
    backgroundColor: '#202945' // Always dark background for auth
  },
  subContainer: {
    flex: 1,
    // backgroundColor: color.primaryBackground,
    marginBottom: responsiveWidth(2),
    borderBottomLeftRadius: responsiveWidth(4),
    borderBottomRightRadius: responsiveWidth(4),
    overflow: 'hidden',
  },
});
