import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  ScrollView,
  StatusBar,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  fontFamily,
  responsiveWidth,
  responsiveHeight,
} from '../../constant/theme';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainContainer } from '../../components/common/mainContainer';
import { useTheme } from '../../context/ThemeContext';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import taskService from '../../services/task/task.service';
import { Task } from '../../services/task/task.service';
import LottieView from 'lottie-react-native';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  HomeScreen: undefined;
  ContinueWithOtp: undefined;
  ForgotPasswordOtp: undefined;
  EditAllTaskSelectionScreen: { userId?: string; heading?: string };
  };

type EditAllTaskSelectionScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'EditAllTaskSelectionScreen'
>;

type EditAllTaskSelectionScreenRouteProp = RouteProp<
  RootStackParamList,
  'EditAllTaskSelectionScreen'
>;

interface TaskItem {
  id: number;
  description: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly';
  selected: boolean;
  status?: 'Done' | 'pending';
  track?: string;
}

const EditAllTaskSelectionScreen = () => {
  const { theme, colors } = useTheme();
  const navigation = useNavigation<EditAllTaskSelectionScreenNavigationProp>();
  const route = useRoute<EditAllTaskSelectionScreenRouteProp>();
  const user = useSelector((state: RootState) => state.app.user);

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [heading, setHeading] = useState<string>('Tasks You Should Perform Daily');
  const [userId, setUserId] = useState<string | null>(null);

  // Get userId from route params, Redux, or AsyncStorage
  useEffect(() => {
    const getUserId = async () => {
      let id = route.params?.userId || user?._id;
      
      if (!id) {
        try {
          const userDataString = await AsyncStorage.getItem('USER_DATA');
          if (userDataString) {
            const userData = JSON.parse(userDataString);
            id = userData._id;
          }
        } catch (error) {
          console.error('Error reading user data from storage:', error);
        }
      }
      
      setUserId(id || null);
      if (route.params?.heading) {
        setHeading(route.params.heading);
      }
    };

    getUserId();
  }, [route.params, user]);

  // Fetch tasks from API
  useEffect(() => {
    const fetchTasks = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const currentHeading = route.params?.heading || heading;
        const response = await taskService.getTaskActivity(
          userId,
          currentHeading,
        );
        
        // Map API response to component task structure
        const mappedTasks: TaskItem[] = response.insights.map((task: Task, index: number) => ({
          id: index + 1,
          description: task.task,
          frequency: (task.track === 'Daily' || task.track === 'Weekly' || task.track === 'Monthly')
            ? (task.track as 'Daily' | 'Weekly' | 'Monthly')
            : 'Daily',
          selected: task.selected,
          status: task.status,
          track: task.track,
        }));

        setTasks(mappedTasks);
        if (response.heading && response.heading !== currentHeading) {
          setHeading(response.heading);
        }
      } catch (error: any) {
        console.error('Error fetching tasks:', error);
        // Alert.alert(
        //   'Error',
        //   error?.message || 'Failed to load tasks. Please try again.',
        //   [{ text: 'OK' }],
        // );
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchTasks();
    }
  }, [userId, heading, route.params?.heading]);

  const toggleTaskSelection = (taskId: number) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, selected: !task.selected } : task,
      ),
    );
  };

  const updateTaskFrequency = (
    taskId: number,
    frequency: 'Daily' | 'Weekly' | 'Monthly',
  ) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, frequency, track: frequency } : task,
      ),
    );
  };

  const handleSave = async () => {
    if (!userId) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    try {
      setSaving(true);
      
      // Map component tasks back to API format
      const insights: Task[] = tasks.map(task => ({
        task: task.description,
        selected: task.selected,
        status: task.status || 'pending',
        track: task.frequency as 'Daily' | 'Weekly' | 'Monthly' | '',
      }));

      await taskService.updateTaskActivity({
        user_id: userId,
        heading: 'Tasks You Should Perform Daily',
        insights: insights,
      });

      Alert.alert('Success', 'Tasks updated successfully', [
        { text: 'OK', onPress: () => {} },
      ]);
    } catch (error: any) {
      console.error('Error updating tasks:', error);
      Alert.alert(
        'Error',
        error?.message || 'Failed to update tasks. Please try again.',
        [{ text: 'OK' }],
      );
    } finally {
      setSaving(false);
    }
  };



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
                tintColor:
                  theme === 'dark' ? colors.textPrimary : colors.DarkNavy,
              },
            ]}
          />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text
            style={[
              styles.headerTitle,
              {
                color:
                  theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
              },
            ]}
          >
            All Points
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || loading}
          style={[
            styles.editBtn,
            {
              backgroundColor:
                theme === 'dark'
                  ? colors.Orangeaccentcolor
                  : colors.Orangeaccentcolor,
              opacity: (saving || loading) ? 0.5 : 1,
            },
          ]}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text
              style={[
                styles.editBtnText,
                {
                  color: theme === 'dark' ? colors.white : colors.white,
                },
              ]}
            >
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Select Your Karmic Points Section */}
        <View style={styles.pointsSection}>
          <View style={styles.sectionTitleContainer}>
            <Text
              style={[styles.sectionTitle, { color: colors.themeTextWhite }]}
            >
              Select Your Karmic Points
            </Text>
            <Text style={styles.moonIcon}>🌙</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
             <LottieView
              source={require('../../assets/lottie/loader-Animation-1.json')}
              autoPlay
              loop
              style={styles.lottieAnimation}
            />
            </View>
          ) : tasks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text
                style={[
                  styles.emptyText,
                  { color: colors.themeTextWhite },
                ]}
              >
                No tasks found
              </Text>
            </View>
          ) : (
            tasks.map((task, index) => (
            <View
              key={task.id}
              style={[
                styles.taskCard,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.DarkNavy : colors.white,
                  borderColor:
                    theme === 'dark'
                      ? colors.primaryBlue
                      : colors.surfaceOpacity,
                },
              ]}
            >
              <View style={styles.taskCardHeader}>
                <Text
                  style={[
                    styles.taskDescription,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  {index + 1}. {task.description}
                </Text>
                <TouchableOpacity
                  onPress={() => toggleTaskSelection(task.id)}
                  activeOpacity={0.7}
                  style={styles.checkboxContainer}
                >
                  {task.selected ? (
                    <View
                      style={[
                        styles.checkboxChecked,
                        {
                          backgroundColor: colors.Orangeaccentcolor,
                        },
                      ]}
                    >
                      <Text style={styles.checkmark}>✓</Text>
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.checkboxUnchecked,
                        {
                          backgroundColor:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.white,
                          borderColor: colors.Orangeaccentcolor,
                        },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              </View>

              {/* Frequency Buttons */}
              <View style={styles.frequencyButtonsContainer}>
                {(['Daily', 'Weekly', 'Monthly'] as const).map(freq => (
                  <TouchableOpacity
                    key={freq}
                    onPress={() => updateTaskFrequency(task.id, freq)}
                    style={[
                      styles.frequencyButton,
                      task.frequency === freq
                        ? styles.frequencyButtonSelected
                        : styles.frequencyButtonUnselected,
                      {
                        backgroundColor:
                          task.frequency === freq
                            ? colors.Orangeaccentcolor
                            : theme === 'dark'
                            ? colors.DarkNavy
                            : colors.white,
                        borderColor:
                          task.frequency === freq
                            ? colors.Orangeaccentcolor
                            : theme === 'dark'
                            ? colors.borderColor
                            : colors.DarkNavy,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.frequencyButtonText,
                        {
                          color:
                            task.frequency === freq
                              ? colors.white
                              : theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.DarkNavy,
                        },
                      ]}
                    >
                      {freq}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )))}
        </View>
      </ScrollView>
    </MainContainer>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'android' ? 32 : 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop:
      Platform.OS === 'android'
        ? responsiveHeight('0.5%')
        : responsiveWidth('12%'),
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
  headerTitle: {
    fontSize: 24,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  editBtn: {
    width: responsiveWidth(15),
    paddingVertical: responsiveWidth(1),
    // paddingHorizontal: responsiveWidth(3),
    borderRadius: 8,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
    color: '#FFFFFF',
  },
  editIcon: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    resizeMode: 'contain',
  },
  progressSection: {
    paddingHorizontal: responsiveWidth(4),
    marginBottom: responsiveWidth(5),
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveWidth(3),
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
    marginRight: responsiveWidth(2),
  },
  moonIcon: {
    fontSize: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: responsiveWidth(2),
    marginBottom: responsiveHeight(2),
  },
  tabButton: {
    // flex: 1,
    paddingVertical: responsiveWidth(1.5),
    borderRadius: 6,
    borderWidth: 0.2,
    paddingHorizontal: responsiveWidth(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonSelected: {
    backgroundColor: '#FF8C00',
  },
  tabButtonUnselected: {
   
    borderWidth: 0.2,
    borderColor: '#FFFFFF',
  },
  tabButtonText: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
  },
  tabButtonTextSelected: {
    color: '#FFFFFF',
  },
  tabButtonTextUnselected: {
    color: '#FFFFFF',
  },
  progressCard: {
    // backgroundColor: '#F5F5DC',
    borderRadius: 15,
    borderWidth: 0.2,
    padding: responsiveWidth(4),
    alignItems: 'center',
  },
  progressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveHeight(2),
    alignSelf: 'flex-start',
  },
  progressCardTitle: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
    marginRight: 8,
  },
  starEmoji: {
    fontSize: 18,
  },
  progressContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressScore: {
    fontSize: 32,
    fontFamily: fontFamily.bold,
    color: '#223149',
  },
  progressLabel: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: '#223149',
    marginTop: 4,
  },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(4),
    marginBottom: responsiveWidth(3),
  },
  actionText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    // color: '#FFFFFF',
    flex: 1,
  },
  actionDateText: {
   fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
  },
  updateTaskButton: {
    paddingVertical: responsiveWidth(1),
    paddingHorizontal: responsiveWidth(4),
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  updateTaskButtonText: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
    color: '#FFFFFF',
  },
  pointsSection: {
    paddingHorizontal: responsiveWidth(4),
    marginBottom: responsiveWidth(3),
    marginTop: responsiveWidth(3),
  },
  taskCard: {
    // backgroundColor: '#223149',
    borderRadius: 12,
    padding: responsiveWidth(4),
    marginBottom: responsiveWidth(3),
    borderWidth: 1,
    // borderColor: '#FFFFFF',
  },
  closedTaskCard: {
    // borderColor: '#27AE60',
  },
  taskDescription: {
    fontSize: 14,
    width: '90%',
    fontFamily: fontFamily.regular,
    color: '#FFFFFF',
    marginBottom: responsiveHeight(1),
  },
  taskTagContainer: {
    flexDirection: 'row',
  },
  taskTag: {
    borderRadius: 6,
    paddingVertical: 4,

    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  taskTagText: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: '#FFFFFF',
  },
  taskCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // marginBottom: responsiveWidth(2),
  },
  frequencyButtonsContainer: {
    flexDirection: 'row',
    gap: responsiveWidth(2),
    marginTop: responsiveWidth(2),
  },
  frequencyButton: {
    paddingVertical: responsiveWidth(1.5),
    paddingHorizontal: responsiveWidth(3),
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: responsiveWidth(20),
  },
  frequencyButtonSelected: {
    // Selected style handled by backgroundColor
  },
  frequencyButtonUnselected: {
    // Unselected style handled by backgroundColor and borderColor
  },
  frequencyButtonText: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
  },
  checkboxContainer: {
    marginLeft: responsiveWidth(2),
  },
  checkboxUnchecked: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    // backgroundColor: 'transparent',
  },
  checkboxChecked: {
    width: 24,
    height: 24,
    borderRadius: 4,
    // backgroundColor: '#FF8C00',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  doneButtonContainer: {
    paddingHorizontal: responsiveWidth(4),
    paddingBottom: responsiveHeight(3),
    paddingTop: responsiveHeight(2),
  },
  doneButton: {
    borderRadius: 12,
    paddingVertical: responsiveWidth(3),
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  doneButtonText: {
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
    color: '#FFFFFF',
  },
  loadingContainer: {
    paddingVertical: responsiveHeight(5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: responsiveWidth(3),
    fontSize: 14,
    fontFamily: fontFamily.regular,
  },
  emptyContainer: {
    paddingVertical: responsiveHeight(5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
  },
  lottieAnimation: {
    width: 264,
    height: 264,
  },
});

export default EditAllTaskSelectionScreen;