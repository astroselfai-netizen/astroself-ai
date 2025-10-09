import React from 'react';
import { ImageBackground, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface ThemedBackgroundProps extends ViewProps {
  containerStyle?: ViewStyle;
  subContainerStyle?: ViewStyle;
  children?: React.ReactNode;
}

const ThemedBackground: React.FC<ThemedBackgroundProps> = ({
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

export { ThemedBackground };

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  subContainer: {
    flex: 1,
  },
});