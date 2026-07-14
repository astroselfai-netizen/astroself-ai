import {
  ImageBackground,
  StyleSheet,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, responsiveWidth } from '../../constant/theme';
import { useTheme } from '../../context/ThemeContext';
import { resolveBottomSafeInset } from '../../utils/safeAreaInsets';

interface MainContainerProps extends ViewProps {
  containerStyle?: ViewStyle;
  subContainerStyle?: ViewStyle;
  childern?: React.ReactNode;
  /** Use on full-screen stack routes without an in-app tab bar. */
  safeBottom?: boolean;
}

const MainContainer: React.FC<MainContainerProps> = ({
  containerStyle,
  subContainerStyle,
  children,
  safeBottom = false,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = safeBottom ? resolveBottomSafeInset(insets.bottom) : 0;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingBottom: bottomInset },
        containerStyle,
      ]}
    >
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
