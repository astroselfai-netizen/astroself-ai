import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainContainer } from '../../components/common/mainContainer';
import { useTheme } from '../../context/ThemeContext';
import taskService, { Task } from '../../services/task/task.service';
import { fontFamily, responsiveHeight, responsiveWidth } from '../../constant/theme';
import { icons } from '../../assets';

type RootStackParamList = {
  TaskActivityDetailsScreen: { userId?: string; heading: string };
};

type NavProp = StackNavigationProp<
  RootStackParamList,
  'TaskActivityDetailsScreen'
>;

type RouteParams = { userId?: string; heading: string };

const TaskActivityDetailsScreen = () => {
  const { theme, colors } = useTheme();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<any>();
  const { userId, heading } = (route?.params || {}) as RouteParams;

  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<Task[]>([]);

  const fetchData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setInsights([]);
      return;
    }

    console.log('userId---->49', userId);
    console.log('heading---->50', heading);

    try {
      setLoading(true);
      const response = await taskService.getTaskActivity(userId, heading);
      const list = Array.isArray(response?.insights) ? response.insights : [];
      setInsights(list);
    } catch (e: any) {
      console.error('Error fetching task activity:', e);
      setInsights([]);
      Alert.alert('Error', e?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [userId, heading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  return (
    <MainContainer>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent={true}
      />

      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Image
            source={require('../../assets/icons/back.png')}
            style={[
              styles.backIcon,
              {
                tintColor: theme === 'dark' ? colors.textPrimary : colors.DarkNavy,
              },
            ]}
          />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text
            style={[
              styles.headerTitle,
              {
                color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
              },
            ]}
            numberOfLines={2}
          >
            {heading}
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.Orangeaccentcolor} />
          </View>
        ) : insights.length > 0 ? (
          insights.map((t, idx) => (
            <View
              key={`${t.task}-${idx}`}
              style={[
                styles.card,
                {
                  backgroundColor: theme === 'dark' ? colors.DarkNavy : colors.white,
                  borderColor:
                    theme === 'dark'
                      ? colors.themeBorderDropdown
                      : colors.borderColor,
                },
              ]}
            >
              <Text
                style={[
                  styles.cardText,
                  {
                    color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                  },
                ]}
              >
                {t.task?.replace(/^[•\s]+/, '').trim() || t.task}
              </Text>
            </View>
          ))
        ) : (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: theme === 'dark' ? colors.DarkNavy : colors.white,
                borderColor:
                  theme === 'dark'
                    ? colors.themeBorderDropdown
                    : colors.borderColor,
              },
            ]}
          >
            <Text
              style={[
                styles.emptyText,
                {
                  color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              No data found
            </Text>
          </View>
        )}
      </ScrollView>
    </MainContainer>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    paddingHorizontal: responsiveWidth(4),
    paddingBottom: responsiveWidth(10),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop:
      Platform.OS === 'android' ? responsiveHeight('0.5%') : responsiveWidth('12%'),
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
    position: 'relative',
    minHeight: 50,
  },
  backBtn: {
    width: responsiveWidth(15),
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backIcon: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    resizeMode: 'contain',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    width: responsiveWidth(15),
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fontFamily.medium,
    textAlign: 'center',
  },
  loadingWrap: {
    paddingVertical: responsiveWidth(12),
    alignItems: 'center',
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: responsiveWidth(4),
    marginBottom: responsiveWidth(3),
  },
  cardText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: responsiveWidth(5),
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
});

export default TaskActivityDetailsScreen;

