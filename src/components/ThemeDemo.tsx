import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const ThemeDemo: React.FC = () => {
  const { theme, toggleTheme, colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        Theme Demo
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Current Theme: {theme}
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.accent }]}
        onPress={toggleTheme}
      >
        <Text style={[styles.buttonText, { color: colors.textPrimary }]}>
          Toggle Theme
        </Text>
      </TouchableOpacity>
      <View style={[styles.colorPalette, { backgroundColor: colors.surface }]}>
        <Text style={[styles.paletteTitle, { color: colors.textPrimary }]}>
          Color Palette:
        </Text>
        <View style={[styles.colorItem, { backgroundColor: colors.background }]}>
          <Text style={[styles.colorText, { color: colors.textPrimary }]}>
            Background
          </Text>
        </View>
        <View style={[styles.colorItem, { backgroundColor: colors.surface }]}>
          <Text style={[styles.colorText, { color: colors.textPrimary }]}>
            Surface
          </Text>
        </View>
        <View style={[styles.colorItem, { backgroundColor: colors.accent }]}>
          <Text style={[styles.colorText, { color: colors.textPrimary }]}>
            Accent
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  colorPalette: {
    padding: 15,
    borderRadius: 10,
    width: '100%',
  },
  paletteTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  colorItem: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
  },
  colorText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ThemeDemo;