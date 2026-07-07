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

interface MainContainerProps extends ViewProps {
  containerStyle?: ViewStyle;
  subContainerStyle?: ViewStyle;
  childern?: React.ReactNode;
}

const MainContainer: React.FC<MainContainerProps> = ({
  containerStyle,
  subContainerStyle,
  children,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }, containerStyle]}>
      <ImageBackground
        source={colors.backgroundImage}
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

export { MainContainer };

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: '100%',
  },
  subContainer: {
    flex: 1,
    backgroundColor: color.primaryBackground,
    marginBottom: responsiveWidth(2),
    borderBottomLeftRadius: responsiveWidth(4),
    borderBottomRightRadius: responsiveWidth(4),
    overflow: 'hidden',
  },
});
