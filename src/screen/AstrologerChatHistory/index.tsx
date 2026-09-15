import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SectionList,
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
import { formatChatHistoryEntryDate, extractChatHistoryThreads } from '../../utils/astrologerChatHistory';

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
    conversationId?: string;
  };
};

type MonthItem = Api.User.Res.AstrologerChatHistoryMonth;
type ThreadItem = Api.User.Res.AstrologerChatHistoryThread;

type HistorySection = {
  title: string;
  month: number;
  year: number;
  data: ThreadItem[];
};

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

  const sections = useMemo<HistorySection[]>(
    () =>
      months
        .map(month => ({
          title: month.display,
          month: month.month,
          year: month.year,
          data:
            month.threads && month.threads.length > 0
              ? month.threads
              : extractChatHistoryThreads({
                  conversations: month.conversations || [],
                }),
        }))
        .filter(section => section.data.length > 0),
    [months],
  );

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

  const openConversation = (section: HistorySection, item: ThreadItem) => {
    if (!section.month || !section.year) {
      return;
    }

    navigation.navigate('AstrologerChatHistoryDetailsScreen', {
      clientId,
      clientName,
      month: section.month,
      year: section.year,
      display: formatChatHistoryEntryDate(item.created_at) || section.title,
      conversationId: item.conversation_id,
    });
  };

  const renderItem = ({
    item,
    section,
  }: {
    item: ThreadItem;
    section: HistorySection;
  }) => (
    <TouchableOpacity
      style={[
        styles.chatCard,
        { backgroundColor: cardBg, borderColor: cardBorder },
      ]}
      activeOpacity={0.85}
      onPress={() => openConversation(section, item)}
    >
      <View style={styles.chatCardText}>
        <Text style={[styles.chatDate, { color: textPrimary }]}>
          {formatChatHistoryEntryDate(item.created_at)}
        </Text>
        <Text
          style={[styles.chatQuestion, { color: textMuted }]}
          numberOfLines={2}
        >
          {item.question}
        </Text>
      </View>
      <Text style={[styles.chevron, { color: textPrimary }]}>›</Text>
    </TouchableOpacity>
  );

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
        <SectionList
          sections={sections}
          keyExtractor={(item, index) =>
            `${item.conversation_id}-${item.created_at}-${index}`
          }
          renderItem={renderItem}
          renderSectionHeader={({ section }) => (
            <Text
              style={[
                styles.monthHeader,
                { color: textPrimary },
                section.month === sections[0]?.month &&
                section.year === sections[0]?.year
                  ? styles.monthHeaderFirst
                  : null,
              ]}
            >
              {section.title.toUpperCase()}
            </Text>
          )}
          contentContainerStyle={[
            styles.listContent,
            sections.length === 0 ? styles.listEmpty : null,
          ]}
          stickySectionHeadersEnabled={false}
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
    paddingTop: responsiveWidth('1'),
    paddingBottom: responsiveWidth('6'),
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthHeader: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    marginBottom: 10,
    marginTop: 18,
    letterSpacing: 0.4,
  },
  monthHeaderFirst: {
    marginTop: 4,
  },
  separator: {
    height: 10,
  },
  chatCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatCardText: {
    flex: 1,
    paddingRight: 12,
  },
  chatDate: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    marginBottom: 6,
  },
  chatQuestion: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
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
