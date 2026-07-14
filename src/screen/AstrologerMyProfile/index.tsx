import React, { useMemo } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MainContainer } from '../../components/common/mainContainer';
import AstrologerProfileSection from '../../components/AstrologerProfileSection';
import { fontFamily, responsiveWidth } from '../../constant/theme';
import { useTheme } from '../../context/ThemeContext';

const astrologerContainerStyle = {
  backgroundColor: 'transparent',
  marginBottom: 0,
  borderBottomLeftRadius: 0,
  borderBottomRightRadius: 0,
  overflow: 'visible' as const,
};

const astrologerMainContainerStyle = {
  backgroundColor: 'transparent',
};

const AstrologerMyProfileScreen = () => {
  const { colors, theme } = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);

  const palette = useMemo(() => {
    const isDark = theme === 'dark';
    return {
      isDark,
      textPrimary: isDark ? colors.themeTextWhite : colors.DarkNavy,
      textMuted: isDark ? '#B8B0A0' : '#8B95A8',
      screenBg: isDark ? '#202945' : '#F5F6F8',
      gold: '#C5A370',
      cardBg: isDark ? colors.cardBackground : colors.white,
    };
  }, [theme, colors]);

  useFocusEffect(
    React.useCallback(() => {
      setRefreshing(false);
    }, []),
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      style={styles.flex}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -84}
    >
      <MainContainer
        containerStyle={astrologerMainContainerStyle}
        subContainerStyle={astrologerContainerStyle}
      >
        <View style={styles.headerBackground}>
          <Text style={[styles.heroTitle, { color: palette.textPrimary }]}>
            My Profile
          </Text>
          <View style={[styles.heroTitleUnderline, { backgroundColor: palette.gold }]} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                setTimeout(() => setRefreshing(false), 500);
              }}
              tintColor={palette.isDark ? colors.themeTextWhite : colors.DarkNavy}
              colors={[colors.Orangeaccentcolor]}
            />
          }
        >
          <View style={styles.contentPadding}>
            <AstrologerProfileSection />
          </View>
        </ScrollView>
      </MainContainer>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'android' ? 140 : 120,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  headerBackground: {
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? responsiveWidth('14') : responsiveWidth('10'),
    paddingBottom: responsiveWidth('5'),
    paddingHorizontal: responsiveWidth('4'),
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: fontFamily.bold,
  },
  heroTitleUnderline: {
    width: 42,
    height: 3,
    marginTop: 6,
    borderRadius: 2,
  },
  contentPadding: {
    paddingHorizontal: responsiveWidth('4'),
    paddingTop: responsiveWidth('2'),
  },
});

export default AstrologerMyProfileScreen;
