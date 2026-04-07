import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  FlatList,
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
import { useProfileData } from '../../hooks/useProfileData';

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
  const { membersData } = useProfileData();

  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<Task[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Init from route param userId (if present)
  useEffect(() => {
    if (userId && userId.trim() !== '') {
      setSelectedMemberId(userId);
      setIsInitialized(true);
    }
  }, [userId]);

  // If no route userId, pick primary/first member once membersData arrives
  useEffect(() => {
    if (
      !isInitialized &&
      membersData &&
      Array.isArray(membersData) &&
      membersData.length > 0 &&
      !userId
    ) {
      const primaryMember =
        membersData.find((m: any) => m.primary_mamber === 'True') || membersData[0];
      const id = primaryMember?.id || primaryMember?._id || null;
      if (id) {
        setSelectedMemberId(id);
        setIsInitialized(true);
      }
    }
  }, [membersData, isInitialized, userId]);

  const effectiveUserId = selectedMemberId || userId;

  const fetchData = useCallback(async () => {
    if (!effectiveUserId) {
      setLoading(false);
      setInsights([]);
      return;
    }

    console.log('userId---->49', effectiveUserId);
    console.log('heading---->50', heading);

    try {
      setLoading(true);
      const response = await taskService.getTaskActivity(effectiveUserId, heading);
      const list = Array.isArray(response?.insights) ? response.insights : [];
      setInsights(list);
    } catch (e: any) {
      console.error('Error fetching task activity:', e);
      setInsights([]);
      Alert.alert('Error', e?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId, heading]);

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

        {/* Profile member dropdown */}
        <View
          style={[
            styles.profileCardContainer,
            {
              backgroundColor: theme === 'dark' ? colors.DarkNavy : colors.white,
              borderColor:
                theme === 'dark' ? colors.themeBorderDropdown : colors.white,
            },
          ]}
        >
          <Image
            source={require('../../assets/icons/profile-icons.png')}
            style={styles.profileIcon as any}
          />
          <View
            style={[
              styles.dropdownWrapper,
              {
                backgroundColor: theme === 'dark' ? colors.DarkNavy : colors.white,
                borderColor:
                  theme === 'dark'
                    ? colors.themeBorderDropdown
                    : colors.borderColor,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.input,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.DarkNavy : colors.surfaceOpacity,
                  borderColor:
                    theme === 'dark'
                      ? colors.themeBorderDropdown
                      : colors.borderColor,
                },
              ]}
              onPress={() => setIsMemberDropdownOpen(!isMemberDropdownOpen)}
            >
              <Text
                style={[
                  styles.selectedMemberText,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              >
                {effectiveUserId
                  ? membersData?.find(
                      (m: any) => (m.id || m._id) === effectiveUserId,
                    )?.full_name || 'Select Member'
                  : 'Select Member'}
              </Text>
            </TouchableOpacity>

            <Modal
              visible={isMemberDropdownOpen}
              transparent={true}
              animationType="none"
              onRequestClose={() => setIsMemberDropdownOpen(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setIsMemberDropdownOpen(false)}
              >
                <View style={styles.modalDropdownContainer}>
                  <View
                    style={[
                      styles.dropdownContainer,
                      {
                        backgroundColor:
                          theme === 'dark' ? colors.DarkNavy : colors.white,
                        borderColor:
                          theme === 'dark'
                            ? colors.themeBorderDropdown
                            : colors.borderColor,
                      },
                    ]}
                  >
                    {membersData && membersData.length > 0 ? (
                      <FlatList
                        data={membersData}
                        keyExtractor={item => (item.id || item._id).toString()}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={styles.dropdownItem}
                            onPress={() => {
                              setSelectedMemberId(item.id || item._id);
                              setIsMemberDropdownOpen(false);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.dropdownItemText,
                                {
                                  color:
                                    theme === 'dark'
                                      ? colors.themeTextWhite
                                      : colors.DarkNavy,
                                },
                              ]}
                            >
                              {item.full_name}
                            </Text>
                          </TouchableOpacity>
                        )}
                        showsVerticalScrollIndicator={true}
                        bounces={false}
                        keyboardShouldPersistTaps="handled"
                        style={styles.flatListStyle}
                        removeClippedSubviews={false}
                        scrollEventThrottle={16}
                      />
                    ) : (
                      <Text style={styles.noResultsText}>No members found</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
        </View>

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
  profileCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 49, 73, 0.9)',
    borderRadius: 10,
    paddingHorizontal: responsiveWidth('2'),
    paddingVertical: responsiveWidth('1'),
    // marginHorizontal: responsiveWidth(4),
    marginBottom: responsiveWidth(3),
    borderWidth: 2,
    borderColor: '#496CA8',
    position: 'relative',
    zIndex: 99999,
  },
  dropdownWrapper: {
    zIndex: 999,
    flex: 1,
  },
  profileIcon: {
    width: responsiveWidth('7%'),
    height: responsiveWidth('7%'),
    marginRight: responsiveWidth('3'),
  },
  input: {
    backgroundColor: '#223149',
    color: '#fff',
    fontSize: 16,
    fontFamily: fontFamily.regular,
    borderColor: '#496CA8',
    paddingVertical: 5,
  },
  selectedMemberText: {
    color: '#F6EFD9',
    fontSize: 16,
    fontFamily: fontFamily.regular,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop:
      Platform.OS === 'ios' ? responsiveWidth('42') : responsiveWidth('29'),
  },
  modalDropdownContainer: {
    width: '90%',
    maxWidth: responsiveWidth('90'),
    alignSelf: 'center',
  },
  dropdownContainer: {
    backgroundColor: '#223149',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#496CA8',
    maxHeight: 200,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  flatListStyle: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#496CA8',
  },
  dropdownItemText: {
    color: '#F6EFD9',
    fontSize: 16,
    fontFamily: fontFamily.regular,
  },
  noResultsText: {
    color: '#F6EFD9',
    fontSize: 16,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    paddingVertical: 10,
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

