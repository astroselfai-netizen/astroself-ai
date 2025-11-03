import React, { useState, useEffect, useCallback } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainContainer } from '../../components/common/mainContainer';
import { useTheme } from '../../context/ThemeContext';
import { ProgressChart } from 'react-native-chart-kit';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import taskService from '../../services/task/task.service';
import LottieView from 'lottie-react-native';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  HomeScreen: undefined;
  ContinueWithOtp: undefined;
  ForgotPasswordOtp: undefined;
  EditAllTaskSelectionScreen: undefined;
  DashboardTasksScreen: undefined;
  };

type DashboardTasksScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'DashboardTasksScreen'
>;

interface TaskItem {
  id: number;
  description: string;
  type: 'Daily' | 'Weekly' | 'Monthly' | '';
  completed: boolean;
  status?: 'Done' | 'pending';
  track?: string;
  heading?: string;
}

const DashboardTasksScreen = () => {
  const { theme, colors } = useTheme();
  const navigation = useNavigation<DashboardTasksScreenNavigationProp>();
  const user = useSelector((state: RootState) => state.app.user);
  const [selectedTab, setSelectedTab] = useState<'Today' | 'Weekly' | 'Monthly'>('Today');

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [_selectedData, setSelectedData] = useState<any[]>([]); // Store original API response structure
  const [karmicActionDate] = useState(() => {
    const today = new Date();
    return `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
  });
  const [isEditMode, setIsEditMode] = useState(true);

  // Get userId from Redux or AsyncStorage
  useEffect(() => {
    const getUserId = async () => {
      let id = user?._id;
      
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
    };

    getUserId();
  }, [user]);

  // Fetch selected tasks from API
  const fetchTasks = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('userId-->', userId);
      
      const response = await taskService.getSelectedTasks(userId);
      
      // Check if selected_data is null or empty array
      if (!response.selected_data || response.selected_data.length === 0) {
        setLoading(false);
        // Navigate to EditAllTaskSelectionScreen if no tasks are selected
        navigation.replace('EditAllTaskSelectionScreen');
        return;
      }
      
      // Transform API response to component task structure
      // Flatten all selected_data and their insights
      const allTasks: TaskItem[] = [];
      let taskIdCounter = 1;

      response.selected_data.forEach((data) => {
        data.selected_insights.forEach((insight) => {
          allTasks.push({
            id: taskIdCounter++,
            description: insight.task,
            type: (insight.track === 'Daily' || insight.track === 'Weekly' || insight.track === 'Monthly')
              ? (insight.track as 'Daily' | 'Weekly' | 'Monthly')
              : '',
            completed: insight.status === 'Done',
            status: insight.status,
            track: insight.track,
            heading: data.heading,
          });
        });
      });

      setTasks(allTasks);
      setSelectedData(response.selected_data); // Store original structure for API updates
    } catch (error: any) {
      console.error('Error fetching selected tasks:', error);
      
      // Check if it's a 404 error or user not found error
      const is404Error = error?.response?.status === 404;
      const errorMessage = error?.response?.data?.detail || error?.message || '';
      const isUserNotFound = errorMessage.includes('User not found in task_and_activity collection');
      
      if (is404Error || isUserNotFound) {
        setLoading(false);
        // Navigate to EditAllTaskSelectionScreen if user not found or 404
        navigation.replace('EditAllTaskSelectionScreen');
        return;
      }
      
      // For other errors, show alert
      Alert.alert(
        'Error',
        error?.message || 'Failed to load tasks. Please try again.',
        [{ text: 'OK' }],
      );
    } finally {
      setLoading(false);
    }
  }, [userId, navigation]);

  // Fetch tasks when userId is available (initial load)
  useEffect(() => {
    if (userId) {
      fetchTasks();
    }
  }, [userId, fetchTasks]);

  // Refetch tasks when screen comes into focus (e.g., when navigating back)
  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchTasks();
      }
    }, [userId, fetchTasks])
  );

  // Filter tasks based on status
  const openKarmicPoints = tasks.filter(task => task.status === 'pending');
  const closedKarmicPoints = tasks.filter(task => task.status === 'Done');

  // Calculate karmic score
  const completedCount = closedKarmicPoints.length;
  const totalCount = tasks.length;
  const karmicScore = totalCount > 0 ? completedCount : 0;
  const maxScore = totalCount > 0 ? totalCount : 10;
  const progressPercentage = maxScore > 0 ? (karmicScore / maxScore) * 100 : 0;
  const radius = 60;

  const toggleTaskCompletion = (taskId: number) => {
    // Simple local state update - no API call here
    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.id === taskId) {
          const newStatus = task.status === 'Done' ? 'pending' : 'Done';
          return {
            ...task,
            completed: newStatus === 'Done',
            status: newStatus,
          };
        }
        return task;
      })
    );
  };

  const handleUpdateTask = () => {
     setIsEditMode(true);
  };

  const handleDone = async () => {
    if (!userId) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    try {
      setSaving(true);

      // Group tasks by heading
      const tasksByHeading = tasks.reduce((acc, task) => {
        const heading = task.heading || 'Tasks You Should Perform Daily';
        if (!acc[heading]) {
          acc[heading] = [];
        }
        acc[heading].push(task);
        return acc;
      }, {} as Record<string, TaskItem[]>);

      // Update each heading via API
      const updatePromises = Object.entries(tasksByHeading).map(async ([heading, headingTasks]) => {
        const insights = headingTasks.map(task => ({
          task: task.description,
          selected: true, // All tasks in selected_data are selected
          status: task.status || 'pending',
          track: (task.track === 'Daily' || task.track === 'Weekly' || task.track === 'Monthly' || task.track === '')
            ? task.track as 'Daily' | 'Weekly' | 'Monthly' | ''
            : '',
        }));

        return taskService.updateTaskActivity({
          user_id: userId,
          heading: heading,
          insights: insights,
        });
      });

      // Wait for all updates to complete
      await Promise.all(updatePromises);

      // Exit edit mode after successful save
      setIsEditMode(false);
      
      Alert.alert('Success', 'Tasks updated successfully', [{ text: 'OK' }]);
    } catch (error: any) {
      console.error('Error saving tasks:', error);
      Alert.alert(
        'Error',
        error?.message || 'Failed to save tasks. Please try again.',
        [{ text: 'OK' }],
      );
    } finally {
      setSaving(false);
    }
  };

  const renderCircularProgress = () => {
    const progressData = {
      data: [progressPercentage / 100], // ProgressChart expects values between 0 and 1
    };

    // Warm medium orange color for filled portion (matching image)
    const orangeColor = '#DF8A5D';

    const chartConfig = {
      backgroundColor: theme === 'dark' ? 'rgba(238, 229, 202, 1)' : 'white',
      backgroundGradientFrom:
        theme === 'dark' ? 'rgba(238, 229, 202, 1)' : 'white',
      backgroundGradientTo:
        theme === 'dark' ? 'rgba(238, 229, 202, 1)' : 'white',
      color: (opacity = 1) => {
        // When opacity is around 0.2, it's the background/unfilled portion - return white
      const hex = orangeColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      },
      strokeWidth: 12,
      barPercentage: 0.5,
    };

    return (
      <View style={styles.progressContainer}>
        {/* Background circle for unfilled portion - white */}
        <View style={styles.chartWrapper}>
          {/* <Svg width={140} height={140} style={styles.backgroundCircle}>
            <Circle
              cx={70}
              cy={70}
              r={radius}
              stroke="#ffffff"
              strokeWidth={12}
              fill="transparent"
            />
          </Svg> */}
          <ProgressChart
            data={progressData}
            width={140}
            height={140}
            strokeWidth={12}
            radius={radius}
            hideLegend={true}
            chartConfig={chartConfig}
            style={styles.progressChart}
          />
        </View>
        <View style={styles.progressTextContainer}>
          <Text
            style={[
              styles.progressScore,
              {
                color:
                  theme === 'dark' ? colors.DarkNavy : colors.themeTextWhite,
              },
            ]}
          >
            {karmicScore}/{maxScore}
          </Text>
          <Text
            style={[
              styles.progressLabel,
              {
                color:
                  theme === 'dark' ? colors.DarkNavy : colors.themeTextWhite,
              },
            ]}
          >
            Today's Score
          </Text>
        </View>
      </View>
    );
  };

  const renderTabButton = (
    label: 'Today' | 'Weekly' | 'Monthly',
    isSelected: boolean,
  ) => {
    return (
      <TouchableOpacity
        onPress={() => setSelectedTab(label)}
        style={[
          styles.tabButton,
          isSelected
            ? { backgroundColor: colors.Orangeaccentcolor, borderWidth: 0 }
            : {
                backgroundColor: theme === 'dark' ? colors.cardBackground : colors.white,
                borderColor: theme === 'dark' ? colors.borderColor : colors.surfaceOpacity,
                borderWidth: 0.2,
              },
        ]}
        // activeOpacity={0.7}
        key={label}
      >
        <Text
          style={[
            styles.tabButtonText,
            isSelected
              ? 
              { color: theme === 'dark' ? colors.themeTextWhite : colors.white }
              : { color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
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
            Dashboard
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('EditAllTaskSelectionScreen')}
          style={styles.editBtn}
        >
          <Image
            source={require('../../assets/icons/edit-painel.png')}
            style={[
              styles.editIcon,
              {
                tintColor:
                  theme === 'dark' ? colors.textPrimary : colors.DarkNavy,
              },
            ]}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <LottieView
              source={require('../../assets/lottie/loader-Animation-1.json')}
              autoPlay
              loop
              style={styles.lottieAnimation}
            />
          </View>
        ) : (
          <>
            {/* Karmic Progress Score Section */}
            <View style={styles.progressSection}>
              <Text
                style={[styles.sectionTitle, { color: colors.themeTextWhite }]}
              >
                Karmic Progress Score
              </Text>

              {/* Tabs */}
              <View style={styles.tabsContainer}>
                {renderTabButton('Today', selectedTab === 'Today')}
                {renderTabButton('Weekly', selectedTab === 'Weekly')}
                {renderTabButton('Monthly', selectedTab === 'Monthly')}
              </View>

              {/* Progress Card */}
              <View
                style={[
                  styles.progressCard,
                  {
                    backgroundColor:
                      theme === 'dark' ? colors.themeTextWhite : colors.white,
                    borderColor:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.surfaceOpacity,
                  },
                ]}
              >
                <View style={styles.progressCardHeader}>
                  <Text
                    style={[
                      styles.progressCardTitle,
                      {
                        color:
                          theme === 'dark' ? colors.DarkNavy : colors.DarkNavy,
                      },
                    ]}
                  >
                    Your Karmic Progress
                  </Text>
                  <Text style={styles.starEmoji}>🌟</Text>
                </View>
                {renderCircularProgress()}
              </View>
            </View>

            {/* Karmic Action Section */}
            <View style={styles.actionSection}>
              <Text
                style={[
                  styles.actionText,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              >
                Your Karmic Action for{' '}
                <Text
                  style={[
                    styles.actionDateText,
                    {
                      color: colors.Orangeaccentcolor,
                    },
                  ]}
                >
                  {karmicActionDate}
                </Text>
              </Text>
              <TouchableOpacity
                style={[
                  styles.updateTaskButton,
                  {
                    backgroundColor:
                      theme === 'dark' ? colors.transparentBg : colors.white,
                    borderColor:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.surfaceOpacity,
                  },
                ]}
                activeOpacity={0.7}
                onPress={handleUpdateTask}
              >
                <Text
                  style={[
                    styles.updateTaskButtonText,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  Update Task
                </Text>
              </TouchableOpacity>
            </View>

            {/* Karmic Points Section */}
            {isEditMode ? (
              // Edit Mode UI
              <View style={styles.pointsSection}>
                {/* <Text
              style={[
                styles.sectionTitle,
                { color: colors.themeTextWhite, marginBottom: responsiveWidth(2) },
              ]}
            >
              Your Tasks for{' '}
              <Text
                style={[
                  styles.actionDateText,
                  {
                    color: colors.Orangeaccentcolor,
                  },
                ]}
              >
                {karmicActionDate}
              </Text>
            </Text> */}
                {tasks.map(task => (
                  <TouchableOpacity
                    key={task.id}
                    onPress={() => toggleTaskCompletion(task.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.taskCard,
                        {
                          backgroundColor:
                            theme === 'dark' ? colors.DarkNavy : colors.white,
                          borderColor: task.completed
                            ? theme === 'dark'
                              ? colors.Orangeaccentcolor
                              : '#27AE60'
                            : theme === 'dark'
                            ? colors.primaryBlue
                            : colors.surfaceOpacity,
                        },
                      ]}
                    >
                      <View style={styles.taskCardContent}>
                        <Text
                          style={[
                            styles.taskDescription,
                            {
                              color:
                                theme === 'dark'
                                  ? colors.themeTextWhite
                                  : colors.DarkNavy,
                              flex: 1,
                            },
                          ]}
                        >
                          {task.description}
                        </Text>
                        <View style={styles.checkboxContainer}>
                          {task.completed ? (
                            <View
                              style={[
                                styles.checkboxChecked,
                                {
                                  backgroundColor:
                                    theme === 'dark'
                                      ? colors.Orangeaccentcolor
                                      : colors.Orangeaccentcolor,
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
                                  borderColor: colors.Orangeaccentcolor,
                                  backgroundColor:
                                    theme === 'dark'
                                      ? colors.themeTextWhite
                                      : colors.white,
                                },
                              ]}
                            />
                          )}
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              // Normal Mode UI
              <>
                <View style={styles.pointsSection}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: colors.themeTextWhite },
                    ]}
                  >
                    Open Karmic Points
                  </Text>
                  {openKarmicPoints.map(task => (
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
                        {task.description}
                      </Text>
                      <View style={styles.taskTagContainer}>
                        <View
                          style={[
                            styles.taskTag,
                            {
                              backgroundColor:
                                theme === 'dark'
                                  ? colors.Orangeaccentcolor
                                  : colors.Orangeaccentcolor,
                              borderColor:
                                theme === 'dark'
                                  ? colors.Orangeaccentcolor
                                  : colors.surfaceOpacity,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.taskTagText,
                              {
                                color:
                                  theme === 'dark'
                                    ? colors.themeTextWhite
                                    : colors.white,
                              },
                            ]}
                          >
                            {task.type}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.pointsSection}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: colors.themeTextWhite },
                    ]}
                  >
                    Closed Karmic Points
                  </Text>
                  {closedKarmicPoints.map(task => (
                    <View
                      key={task.id}
                      style={[
                        styles.taskCard,
                        styles.closedTaskCard,
                        {
                          backgroundColor:
                            theme === 'dark' ? colors.DarkNavy : colors.white,
                          borderColor:
                            theme === 'dark'
                              ? colors.Orangeaccentcolor
                              : colors.Orangeaccentcolor,
                        },
                      ]}
                    >
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
                        {task.description}
                      </Text>
                      <View style={styles.taskTagContainer}>
                        <View
                          style={[
                            styles.taskTag,
                            {
                              backgroundColor:
                                theme === 'dark'
                                  ? colors.Orangeaccentcolor
                                  : colors.Orangeaccentcolor,
                              borderColor:
                                theme === 'dark'
                                  ? colors.Orangeaccentcolor
                                  : colors.surfaceOpacity,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.taskTagText,
                              {
                                color:
                                  theme === 'dark'
                                    ? colors.themeTextWhite
                                    : colors.white,
                              },
                            ]}
                          >
                            {task.type}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Done Button - only show in edit mode */}
            {isEditMode && (
              <View style={styles.doneButtonContainer}>
                <TouchableOpacity
                  style={[
                    styles.doneButton,
                    {
                      backgroundColor:
                        theme === 'dark'
                          ? colors.Orangeaccentcolor
                          : colors.Orangeaccentcolor,
                      opacity: saving ? 0.6 : 1,
                    },
                  ]}
                  onPress={handleDone}
                  disabled={saving}
                  activeOpacity={0.7}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.doneButtonText}>Done</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
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
    alignItems: 'flex-end',
    justifyContent: 'center',
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
  sectionTitle: {
    fontSize: 20,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
   
    marginBottom: responsiveWidth(3),
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
    // backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  chartWrapper: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  backgroundCircle: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'white',
  },
  progressChart: {
    marginVertical: 8,
    backgroundColor: 'white',
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
    // marginBottom: responsiveWidth(1),
    // marginTop: responsiveWidth(3),
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
  taskCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    backgroundColor: '#FF8C00',
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
    paddingVertical: responsiveHeight(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: responsiveWidth(3),
    fontSize: 14,
    fontFamily: fontFamily.regular,
  },

  lottieAnimation: {
    width: 264,
    height: 264,
  },
});

export default DashboardTasksScreen;