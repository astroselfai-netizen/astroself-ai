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
import { MarkdownAnswer } from '../../components/StreamingMarkdownAnswer';
import { fontFamily, responsiveWidth } from '../../constant/theme';
import { useTheme } from '../../context/ThemeContext';
import UserService from '../../services/user/user.service';
import { Api } from '../../types/api';

type RootStackParamList = {
  AstrologerChatHistoryDetailsScreen: {
    clientId: string;
    clientName: string;
    month: number;
    year: number;
    display: string;
  };
};

type HistoryItem = Api.User.Res.AstrologerChatHistoryItem;

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

const formatDetailTime = (createdAt: string) => {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const AstrologerChatHistoryDetailsScreen = () => {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList>>();
  const route =
    useRoute<RouteProp<RootStackParamList, 'AstrologerChatHistoryDetailsScreen'>>();
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const userService = useMemo(() => new UserService(), []);

  const clientId = route.params?.clientId || '';
  const display = route.params?.display || 'Chat history';
  const month = route.params?.month;
  const year = route.params?.year;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [errorText, setErrorText] = useState('');

  const isDark = theme === 'dark';
  const textPrimary = isDark ? colors.themeTextWhite : NAVY;
  const textMuted = isDark ? 'rgba(255,255,255,0.65)' : '#6B7280';
  const cardBg = isDark ? colors.cardBackground : colors.white;
  const answerBorder = isDark ? 'rgba(255,255,255,0.18)' : '#C5D3EA';
  const answerText = isDark ? colors.themeTextWhite : '#1F2937';
  const backBtnBg = isDark ? 'rgba(255,255,255,0.12)' : '#E8EEF7';

  const loadDetails = useCallback(async () => {
    if (!clientId || month == null || year == null) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorText('');
    try {
      const response = await userService.getAstrologerChatHistoryMonthDetails(
        clientId,
        month,
        year,
      );
      const sorted = [...(response.data || [])].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
      setItems(sorted);
    } catch (error: any) {
      setItems([]);
      setErrorText(error?.message || 'Failed to load chat details');
    } finally {
      setLoading(false);
    }
  }, [clientId, month, year, userService]);

  useFocusEffect(
    useCallback(() => {
      loadDetails();
    }, [loadDetails]),
  );

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <View style={styles.threadBlock}>
      <Text style={[styles.timeLabel, { color: textMuted }]}>
        {formatDetailTime(item.created_at)}
      </Text>

      <View style={styles.questionBubble}>
        <Text style={styles.questionText}>{item.question}</Text>
      </View>

      <View
        style={[
          styles.answerCard,
          { backgroundColor: cardBg, borderColor: answerBorder },
        ]}
      >
        {/* <Text style={[styles.answerTitle, { color: textPrimary }]}>Response</Text> */}
        <MarkdownAnswer text={item.answer || ''} textColor={answerText} />
      </View>
    </View>
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
          <Text style={[styles.headerTitle, { color: textPrimary }]} numberOfLines={1}>
            {display}
          </Text>
          <Text style={[styles.headerSubtitle, { color: textMuted }]}>
            Asked questions
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={textPrimary} />
        </View>
      ) : errorText ? (
        <View style={styles.centerState}>
          <Text style={[styles.emptyText, { color: textMuted }]}>{errorText}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadDetails} activeOpacity={0.85}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, index) =>
            `${item.conversation_id}-${item.created_at}-${index}`
          }
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            items.length === 0 ? styles.listEmpty : null,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: textMuted }]}>
              No questions in this month
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
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: fontFamily.regular,
  },
  listContent: {
    paddingHorizontal: responsiveWidth('4'),
    paddingBottom: responsiveWidth('6'),
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: 18,
  },
  threadBlock: {
    gap: 10,
  },
  timeLabel: {
    alignSelf: 'center',
    fontSize: 12,
    fontFamily: fontFamily.regular,
    marginBottom: 2,
  },
  questionBubble: {
    alignSelf: 'flex-end',
    maxWidth: '82%',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: NAVY,
  },
  questionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: fontFamily.regular,
    lineHeight: 21,
  },
  answerCard: {
    alignSelf: 'stretch',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  answerTitle: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    marginBottom: 8,
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

export default AstrologerChatHistoryDetailsScreen;
