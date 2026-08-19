import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainContainer } from '../../components/common/mainContainer';
import { fontFamily, responsiveWidth } from '../../constant/theme';
import { useTheme } from '../../context/ThemeContext';
import UserService from '../../services/user/user.service';
import { Api } from '../../types/api';

type RootStackParamList = {
  AstrologerChatHistoryScreen: {
    clientId: string;
    clientName: string;
  };
  AstrologerChatHistoryDetailsScreen: {
    clientId: string;
    clientName: string;
    month: number;
    year: number;
    display: string;
  };
};

type MonthItem = Api.User.Res.AstrologerChatHistoryMonth;

const NAVY = '#1A3673';

const fullScreenContainerStyle = {
  backgroundColor: 'transparent' as const,
};

const fullScreenSubContainerStyle = {
  backgroundColor: 'transparent' as const,
  marginBottom: 0,
  borderBottomLeftRadius: 0,
  borderBottomRightRadius: 0,
  overflow: 'visible' as const,
};

const AstrologerChatHistoryScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AstrologerChatHistoryScreen'>>();
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const userService = useMemo(() => new UserService(), []);

  const clientId = route.params?.clientId || '';
  const clientName = route.params?.clientName || 'Client';

  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState<MonthItem[]>([]);
  const [errorText, setErrorText] = useState('');

  const isDark = theme === 'dark';
  const textPrimary = isDark ? colors.themeTextWhite : NAVY;
  const textMuted = isDark ? 'rgba(255,255,255,0.65)' : '#6B7280';
  const cardBg = isDark ? colors.cardBackground : colors.white;
  const cardBorder = isDark ? 'rgba(255,255,255,0.18)' : '#D7DEEA';
  const backBtnBg = isDark ? 'rgba(255,255,255,0.12)' : '#E8EEF7';

  const loadMonths = useCallback(async () => {
    if (!clientId) {
      setMonths([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorText('');
    try {
      const response = await userService.getAstrologerChatHistoryMonths(clientId);

      console.log('response--->99', response);
      setMonths(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      setMonths([]);
      setErrorText(error?.message || 'Failed to load chat history');
    } finally {
      setLoading(false);
    }
  }, [clientId, userService]);

  useFocusEffect(
    useCallback(() => {
      loadMonths();
    }, [loadMonths]),
  );

  const openMonth = (item: MonthItem) => {
    if (!item.month || !item.year) {
      return;
    }

    navigation.navigate('AstrologerChatHistoryDetailsScreen', {
      clientId,
      clientName,
      month: item.month,
      year: item.year,
      display: item.display,
    });
  };

  const renderItem = ({ item }: { item: MonthItem }) => {
    const count = item.total_questions ?? 0;
    const label = count === 1 ? '1 Question asked' : `${count} Questions asked`;

    return (
      <TouchableOpacity
        style={[
          styles.monthCard,
          { backgroundColor: cardBg, borderColor: cardBorder },
        ]}
        activeOpacity={0.85}
        onPress={() => openMonth(item)}
      >
        <View style={styles.monthCardText}>
          <Text style={[styles.monthTitle, { color: textPrimary }]}>
            {item.display}
          </Text>
          <Text style={[styles.monthSubtitle, { color: textMuted }]}>{label}</Text>
        </View>
        <Text style={[styles.chevron, { color: textPrimary }]}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <MainContainer
      safeBottom
      containerStyle={fullScreenContainerStyle}
      subContainerStyle={fullScreenSubContainerStyle}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: backBtnBg }]}
          activeOpacity={0.8}
        >
          <Image
            source={require('../../assets/icons/back.png')}
            style={[styles.backIcon, { tintColor: textPrimary }]}
          />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.headerTitle, { color: textPrimary }]} numberOfLines={2}>
            Viewing your asked questions
          </Text>
          {clientName ? (
            <Text style={[styles.clientLabel, { color: textMuted }]} numberOfLines={1}>
              {clientName}
            </Text>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={textPrimary} />
        </View>
      ) : errorText ? (
        <View style={styles.centerState}>
          <Text style={[styles.emptyText, { color: textMuted }]}>{errorText}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadMonths} activeOpacity={0.85}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={months}
          keyExtractor={(item, index) => `${item.year}-${item.month}-${index}`}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            months.length === 0 ? styles.listEmpty : null,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: textMuted }]}>
              No chat history yet
            </Text>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </MainContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth('4'),
    paddingBottom: responsiveWidth('3'),
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fontFamily.bold,
    lineHeight: 26,
  },
  clientLabel: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: fontFamily.regular,
  },
  listContent: {
    paddingHorizontal: responsiveWidth('4'),
    paddingTop: responsiveWidth('2'),
    paddingBottom: responsiveWidth('6'),
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: 12,
  },
  monthCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthCardText: {
    flex: 1,
    paddingRight: 12,
  },
  monthTitle: {
    fontSize: 22,
    fontFamily: fontFamily.bold,
    marginBottom: 6,
  },
  monthSubtitle: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
  },
  chevron: {
    fontSize: 28,
    fontFamily: fontFamily.regular,
    marginTop: -2,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 14,
    backgroundColor: NAVY,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fontFamily.bold,
  },
});

export default AstrologerChatHistoryScreen;
