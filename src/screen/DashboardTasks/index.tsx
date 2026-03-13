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
  Modal,
  FlatList,
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
import taskService, { Task, KarmicProgressResponse } from '../../services/task/task.service';
import LottieView from 'lottie-react-native';
import { useProfileData } from '../../hooks/useProfileData';
import { icons } from '../../assets';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  HomeScreen: undefined;
  ContinueWithOtp: undefined;
  ForgotPasswordOtp: undefined;
  EditAllTaskSelectionScreen: { userId?: string };
  DashboardTasksScreen: undefined;
  DashboardTasksDoNotScreen: { userId?: string; heading?: string };
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
  const { membersData } = useProfileData();
  const [selectedTab, setSelectedTab] = useState<'Today' | 'Weekly' | 'Monthly'>('Today');

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [_selectedData, setSelectedData] = useState<any[]>([]); // Store original API response structure
  const [karmicActionDate] = useState(() => {
    const today = new Date();
    return `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [karmicProgress, setKarmicProgress] = useState<KarmicProgressResponse | null>(null);
  const [karmicProgressLoading, setKarmicProgressLoading] = useState(false);
  const [showProgressCardModal, setShowProgressCardModal] = useState(false);

  // Set selectedMemberId based on primary member from membersData (only initially)
  useEffect(() => {
    if (
      !isInitialized &&
      membersData &&
      Array.isArray(membersData) &&
      membersData.length > 0
    ) {
      // Function to get primary member ID
      const getPrimaryMemberId = () => {
        console.log('Looking for primary member in membersData:', membersData);

        // Look for a member with primary_mamber field set to "True"
        const primaryMember = membersData.find((member: any) => {
          console.log(
            'Checking member:',
            member.full_name,
            'primary_mamber:',
            member.primary_mamber,
          );
          return member.primary_mamber === 'True';
        });

        if (primaryMember) {
          console.log('Found primary member:', primaryMember);
          return primaryMember.id || primaryMember._id;
        }

        // If no primary_mamber == "True" found, use first member
        const firstMember = membersData[0];
        console.log(
          'No primary member found, using first member:',
          firstMember,
        );
        return firstMember?.id || firstMember?._id || null;
      };

      const primaryMemberId = getPrimaryMemberId();
      if (primaryMemberId) {
        console.log(
          'Setting initial selection to primary member:',
          primaryMemberId,
        );
        setSelectedMemberId(primaryMemberId);
        setUserId(primaryMemberId);
        setIsInitialized(true);
      }
    }
  }, [membersData, isInitialized]);

  // Update userId when selectedMemberId changes (from dropdown)
  useEffect(() => {
    if (selectedMemberId) {
      setUserId(selectedMemberId);
    }
  }, [selectedMemberId]);

  // Fetch selected tasks from API
  const fetchTasks = useCallback(async () => {
    // Use selectedMemberId if available, otherwise fallback to userId
    const memberIdToUse = selectedMemberId || userId;
    
    if (!memberIdToUse) {
      console.log('No member ID available, skipping fetch');
      setLoading(false);
      return;
    }

    console.log('Fetching tasks for memberId:', memberIdToUse);

    try {
      setLoading(true);
      console.log('userId-->', memberIdToUse);
      
      const response = await taskService.getSelectedTasks(memberIdToUse);
      
      console.log('Tasks fetched successfully:', response);
      
      // Check if response has selected_data and it's an array
      if (!response || !response.selected_data || !Array.isArray(response.selected_data)) {
        console.log('No selected_data found in response, setting empty tasks');
        setTasks([]);
        setLoading(false);
        return;
      }
      
      // Check if selected_data array is empty
      if (response.selected_data.length === 0) {
        console.log('Empty selected_data array, setting empty tasks');
        setTasks([]);
        setLoading(false);
        // Navigate to EditAllTaskSelectionScreen if no tasks are selected
        // navigation.replace('EditAllTaskSelectionScreen');
        return;
      }
      
      // Transform API response to component task structure
      // Flatten all selected_data and their insights
      const allTasks: TaskItem[] = [];
      let taskIdCounter = 1;

      response.selected_data.forEach((data) => {
        if (data.selected_insights && Array.isArray(data.selected_insights)) {
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
        }
      });

      setTasks(allTasks);
      setSelectedData(response.selected_data); // Store original structure for API updates
    } catch (error: any) {
      console.error('Error fetching selected tasks:', error);
      
      // Handle 404 or any error - set empty tasks array
      setTasks([]);
      
      // Check if it's a 404 error or user not found error
      const is404Error = error?.response?.status === 404 || error?.status === 404;
      const errorMessage = error?.response?.data?.detail || error?.message || '';
      const isUserNotFound = errorMessage.includes('User not found in task_and_activity collection');
      
      if (is404Error || isUserNotFound) {
        console.log('404 error or user not found: No tasks found for this member');
        // Navigate to EditAllTaskSelectionScreen if user not found or 404
        // navigation.replace('EditAllTaskSelectionScreen');
      } else {
        // For other errors, show alert
        Alert.alert(
          'Error',
          error?.message || 'Failed to load tasks. Please try again.',
          [{ text: 'OK' }],
        );
      }
    } finally {
      setLoading(false);
    }
  }, [selectedMemberId, userId]);

  // Fetch karmic progress status from API
  const fetchKarmicProgress = useCallback(async () => {
    const memberIdToUse = selectedMemberId || userId;
    
    if (!memberIdToUse) {
      console.log('No member ID available for karmic progress, skipping fetch');
      return;
    }

    // Map selectedTab to API period
    const periodMap: Record<'Today' | 'Weekly' | 'Monthly', 'daily' | 'weekly' | 'monthly'> = {
      'Today': 'daily',
      'Weekly': 'weekly',
      'Monthly': 'monthly',
    };

    const period = periodMap[selectedTab];

    try {
      setKarmicProgressLoading(true);
      console.log('Fetching karmic progress for memberId:', memberIdToUse, 'period:', period);
      
      const response = await taskService.getKarmicProgressStatus(memberIdToUse, period);
      
      console.log('Karmic progress fetched successfully:', response);
      setKarmicProgress(response);
    } catch (error: any) {
      console.error('Error fetching karmic progress:', error);
      // Set default values on error
      setKarmicProgress({
        total: 0,
        completed: 0,
        score: 0.0,
      });
    } finally {
      setKarmicProgressLoading(false);
    }
  }, [selectedMemberId, userId, selectedTab]);

  // Fetch tasks when selectedMemberId or userId is available (NOT when selectedTab changes)
  useEffect(() => {
    // Fetch when selectedMemberId is available (this is the primary source)
    if (selectedMemberId) {
      console.log('Triggering fetchTasks, selectedMemberId:', selectedMemberId);
      fetchTasks();
    } else if (!isInitialized && userId) {
      // Fallback: if initialization hasn't happened yet but userId exists, use it
      console.log('Triggering fetchTasks with userId fallback:', userId);
      fetchTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMemberId, userId, isInitialized]);

  // Refetch tasks when screen comes into focus (e.g., when navigating back)
  useFocusEffect(
    useCallback(() => {
      if (selectedMemberId || userId) {
        fetchTasks();
        fetchKarmicProgress();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedMemberId, userId, fetchTasks]),
  );

  // Fetch karmic progress when tab or member changes
  useEffect(() => {
    if (selectedMemberId || userId) {
      fetchKarmicProgress();
    }
  }, [selectedTab, selectedMemberId, userId, fetchKarmicProgress]);

  // Filter tasks based on status
  const openKarmicPoints = tasks.filter(task => task.status === 'pending');
  const closedKarmicPoints = tasks.filter(task => task.status === 'Done');

  // Calculate karmic score from API data or fallback to local calculation
  const karmicScore = karmicProgress?.completed ?? closedKarmicPoints.length;
  const maxScore = karmicProgress?.total ?? (tasks.length > 0 ? tasks.length : 10);
  const progressPercentage = maxScore > 0 ? (karmicScore / maxScore) * 100 : 0;

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

  const handleResetTask = async () => {
    const memberIdToUse = selectedMemberId || userId;
    
    if (!memberIdToUse) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    Alert.alert(
      'Reset Task',
      'Are you sure you want to reset all tasks? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setResetting(true);
              await taskService.resetTask(memberIdToUse);
              
              // Small delay to ensure backend has processed the reset
              await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
              
              // Refresh tasks and karmic progress to get fresh data
              await fetchTasks();
              await fetchKarmicProgress();
              
              Alert.alert('Success', 'Tasks reset successfully', [{ text: 'OK' }]);
            } catch (error: any) {
              console.error('Error resetting tasks:', error);
              Alert.alert(
                'Error',
                error?.message || 'Failed to reset tasks. Please try again.',
                [{ text: 'OK' }],
              );
            } finally {
              setResetting(false);
            }
          },
        },
      ],
    );
  };

  const handleDone = async () => {
    const memberIdToUse = selectedMemberId || userId;
    
    if (!memberIdToUse) {
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
        // First, fetch all tasks for this heading from API
        let allTasksFromAPI: Task[] = [];
        try {
          const apiResponse = await taskService.getTaskActivity(memberIdToUse, heading);
          if (apiResponse && apiResponse.insights && Array.isArray(apiResponse.insights)) {
            allTasksFromAPI = apiResponse.insights;
          }
        } catch (error) {
          console.log('Error fetching tasks for heading:', heading, error);
          // If fetch fails, continue with just the updated tasks
        }

        // Create a map of updated tasks by description for quick lookup
        const updatedTasksMap = new Map<string, TaskItem>();
        headingTasks.forEach(task => {
          updatedTasksMap.set(task.description, task);
        });

        // Merge: Use updated tasks if they exist, otherwise keep original tasks
        const mergedInsights: Task[] = allTasksFromAPI.map((apiTask: Task) => {
          const updatedTask = updatedTasksMap.get(apiTask.task);
          if (updatedTask) {
            // This task was updated, use the updated values but preserve selected from API
            return {
              task: updatedTask.description,
              selected: apiTask.selected !== undefined ? apiTask.selected : true, // Preserve selected status from API
              status: updatedTask.status || 'pending',
              track: (updatedTask.track === 'Daily' || updatedTask.track === 'Weekly' || updatedTask.track === 'Monthly' || updatedTask.track === '')
                ? updatedTask.track as 'Daily' | 'Weekly' | 'Monthly' | ''
                : '',
              timing_status: apiTask.timing_status || 'old',
            };
          }
          // This task was not updated, keep original
          return apiTask;
        });

        // Add any new tasks that are not in the API response
        const existingTaskDescriptions = new Set(allTasksFromAPI.map(t => t.task));
        headingTasks.forEach(task => {
          if (!existingTaskDescriptions.has(task.description)) {
            mergedInsights.push({
              task: task.description,
              selected: true,
              status: task.status || 'pending',
              track: (task.track === 'Daily' || task.track === 'Weekly' || task.track === 'Monthly' || task.track === '')
                ? task.track as 'Daily' | 'Weekly' | 'Monthly' | ''
                : '',
              timing_status: 'old', // Default to 'old' for new tasks
            });
          }
        });

        return taskService.updateTaskActivity({
          user_id: memberIdToUse,
          heading: heading,
          insights: mergedInsights,
        });
      });

      // Wait for all updates to complete
      await Promise.all(updatePromises);

      // Small delay to ensure backend has processed the update
      await new Promise<void>(resolve => setTimeout(() => resolve(), 500));

      // Exit edit mode after successful save
      setIsEditMode(false);
      
      // Refresh tasks and karmic progress to get fresh data
      await fetchTasks();
      await fetchKarmicProgress();
      
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
      strokeWidth: 10,
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
          {karmicProgressLoading ? (
            <View style={styles.karmicProgressLoaderContainer}>
              <LottieView
                source={require('../../assets/lottie/loader-Animation-1.json')}
                autoPlay
                loop
                style={styles.lottieAnimation}
              />
            </View>
          ) : (
            <ProgressChart
              data={progressData}
              width={120}
              height={120}
              strokeWidth={12}
              radius={50}
              hideLegend={true}
              chartConfig={chartConfig}
              style={styles.progressChart}
            />
          )}
        </View>
        <View style={styles.progressTextContainer}>
          {karmicProgressLoading ? (
            <LottieView
              source={require('../../assets/lottie/loader-Animation-1.json')}
              autoPlay
              loop
              style={styles.lottieAnimation}
            />
          ) : (
            <>
              <Text
                style={[
                  styles.progressScore,
                  {
                    color:
                      theme === 'dark'
                        ? colors.DarkNavy
                        : colors.themeTextWhite,
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
                      theme === 'dark'
                        ? colors.DarkNavy
                        : colors.themeTextWhite,
                  },
                ]}
              >
                {selectedTab === 'Today'
                  ? "Total Score"
                  : selectedTab === 'Weekly'
                  ? 'Total Score'
                  : 'Total Score'}
              </Text>
            </>
          )}
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
            Tasks Dashboard
          </Text>
        </View>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('EditAllTaskSelectionScreen', {
              userId: selectedMemberId || undefined,
            })
          }
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
              backgroundColor:
                theme === 'dark' ? colors.DarkNavy : colors.white,
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
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              {selectedMemberId
                ? membersData?.find(
                    (m: any) => (m.id || m._id) === selectedMemberId,
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
                            console.log('item.id --->', item.id);
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
        <TouchableOpacity
          style={styles.arrowIconContainer}
          onPress={() => setIsMemberDropdownOpen(!isMemberDropdownOpen)}
        >
          <Image
            source={require('../../assets/icons/Dropdown.png')}
            style={[
              styles.arrowIcon as any,
              {
                transform: [
                  { rotate: isMemberDropdownOpen ? '180deg' : '0deg' },
                ],
                marginRight: -responsiveWidth('1.5%'),
                tintColor:
                  theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
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
            {/* Actions you think twice before doing */}
            <View
              style={[
                styles.astroCard,
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
              <View style={styles.astroContent}>
                <View style={styles.astroContentLeft}>
                  {' '}
                  <Text
                    style={[
                      styles.astroTitle,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    Actions to watch out
                  </Text>
                </View>
                <View style={styles.astroContentRight}>
                  <TouchableOpacity
                    style={[
                      styles.astroButton,
                      { borderColor: colors.Orangeaccentcolor },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (selectedMemberId) {
                        navigation.navigate('DashboardTasksDoNotScreen', {
                          userId: selectedMemberId,
                          heading: 'Actions you think twice before doing',
                        });
                      } else {
                        Alert.alert('Error', 'Please select a member first');
                      }
                    }}
                  >
                    <Text
                      style={[styles.astroButtonText, { color: colors.Orangeaccentcolor }]}
                    >
                      View
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              {/* <Image
                source={require('../../assets/image/Ai-robot.png')}
                style={styles.astroImage}
              /> */}
            </View>

            {/* Karmic Progress Score Section */}
            <View style={styles.progressSection}>
              <View style={[styles.progressScoreHeader, { backgroundColor: theme === 'dark' ? colors.DarkNavy : colors.white , borderColor:
                    theme === 'dark'
                      ? colors.themeBorderDropdown
                      : colors.borderColor, }]}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colors.themeTextWhite },
                  ]}
                >
                  Tasks Progress Score
                </Text>

                <TouchableOpacity
                  style={[styles.progressScoreButton, { borderColor: colors.Orangeaccentcolor }]}
                  onPress={() => setShowProgressCardModal(true)}
                >
                  <Text style={[styles.progressScoreButtonText, { color: colors.Orangeaccentcolor }]}>View</Text>
                </TouchableOpacity>
              </View>
              {/* Tabs */}
              {/* <View style={styles.tabsContainer}>
                {renderTabButton('Today', selectedTab === 'Today')}
                {renderTabButton('Weekly', selectedTab === 'Weekly')}
                {renderTabButton('Monthly', selectedTab === 'Monthly')}
              </View> */}
            </View>
            {/* Karmic Action Section - only show if tasks exist */}
            {tasks.length > 0 && (
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
                  Your Tasks Action for{' '}
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
                {isEditMode ? (
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
                ) : (
                  <View style={styles.updateTaskButtonContainer}>
                    <TouchableOpacity
                      style={[
                        styles.updateTaskButton,
                        {
                          backgroundColor:
                            theme === 'dark'
                              ? colors.transparentBg
                              : colors.white,
                          borderColor:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.surfaceOpacity,
                          opacity: resetting ? 0.6 : 1,
                        },
                      ]}
                      activeOpacity={0.7}
                      onPress={handleResetTask}
                      disabled={resetting}
                    >
                      {resetting ? (
                        <ActivityIndicator
                          size="small"
                          color={
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.DarkNavy
                          }
                        />
                      ) : (
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
                        Reset Score
                        </Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.updateTaskButton,
                        {
                          backgroundColor:
                            theme === 'dark'
                              ? colors.transparentBg
                              : colors.white,
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
                )}
              </View>
            )}
            {/* Karmic Points Section - only show if tasks exist */}
            {tasks.length > 0 ? (
              isEditMode ? (
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
                            {task.description?.replace(/^[•\s]+/, '').trim() ||
                              task.description}
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
                      Your Tasks for the day
                    </Text>
                    {openKarmicPoints && openKarmicPoints.length > 0 ? (
                      openKarmicPoints.map(task => (
                        <View
                          key={task.id}
                          style={[
                            styles.taskCard,
                            {
                              backgroundColor:
                                theme === 'dark'
                                  ? colors.DarkNavy
                                  : colors.white,
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
                            {task.description?.replace(/^[•\s]+/, '').trim() ||
                              task.description}
                          </Text>
                          {/* <View style={styles.taskTagContainer}>
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
                          </View> */}
                        </View>
                      ))
                    ) : (
                      <View
                        style={[
                          styles.emptyStateContainer,
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
                        <Text
                          style={[
                            styles.emptyStateText,
                            {
                              color:
                                theme === 'dark'
                                  ? colors.themeTextWhite
                                  : colors.DarkNavy,
                            },
                          ]}
                        >
                          No open tasks
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.pointsSection}>
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: colors.themeTextWhite },
                      ]}
                    >
                      Closed Tasks
                    </Text>
                    {closedKarmicPoints && closedKarmicPoints.length > 0 ? (
                      closedKarmicPoints.map(task => (
                        <View
                          key={task.id}
                          style={[
                            styles.taskCard,
                            styles.closedTaskCard,
                            {
                              backgroundColor:
                                theme === 'dark'
                                  ? colors.DarkNavy
                                  : colors.white,
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
                            {task.description?.replace(/^[•\s]+/, '').trim() ||
                              task.description}
                          </Text>
                          {/* <View style={styles.taskTagContainer}>
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
                          </View> */}
                        </View>
                      ))
                    ) : (
                      <View
                        style={[
                          styles.emptyStateContainer,
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
                        <Text
                          style={[
                            styles.emptyStateText,
                            {
                              color:
                                theme === 'dark'
                                  ? colors.themeTextWhite
                                  : colors.DarkNavy,
                            },
                          ]}
                        >
                          No closed tasks
                        </Text>
                      </View>
                    )}
                  </View>
                </>
              )
            ) : (
              // Empty state when no tasks
              <View style={styles.pointsSection}>
                <View
                  style={[
                    styles.emptyStateContainer,
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
                  {/* <Text
                    style={[
                      styles.emptyStateText,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    Create and perform tasks to track your progress.
                  </Text> */}
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('EditAllTaskSelectionScreen', {
                        userId: selectedMemberId || undefined,
                      })
                    }
                    style={[
                      styles.addTaskButton,
                      {
                        backgroundColor:
                          theme === 'dark' ? colors.DarkNavy : colors.white,
                        borderColor: colors.Orangeaccentcolor,
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.addTaskButtonText,
                        {
                          color: colors.Orangeaccentcolor,
                        },
                      ]}
                    >
                      Select the tasks curated by our AI
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Progress Card Modal */}
      <Modal
        visible={showProgressCardModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProgressCardModal(false)}
      >
        <TouchableOpacity
          style={styles.progressModalOverlay}
          activeOpacity={1}
          onPress={() => setShowProgressCardModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={e => e.stopPropagation()}
            style={styles.progressModalContainer}
          >
            {/* Close Button */}
            <TouchableOpacity
              style={styles.progressModalCloseButton}
              onPress={() => setShowProgressCardModal(false)}
            >
              <Image
                source={icons.Icclose}
                style={[
                  styles.progressModalCloseIcon,
                  {
                    tintColor:
                      theme === 'dark'
                        ? colors.DarkNavy
                        : colors.DarkNavy,
                  },
                ]}
              />
            </TouchableOpacity>

            {/* Progress Card Content */}
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
              {/* Left Section */}
              <View style={styles.progressCardLeftSection}>
                <Text
                  style={[
                    styles.progressCardTitle,
                    {
                      color: colors.DarkNavy,
                    },
                  ]}
                >
                  Your Tasks Progress
                </Text>

                {/* Task Completed Section */}
                <View style={styles.progressStatSection}>
                  <Text
                    style={[
                      styles.progressStatNumber,
                      {
                        color: colors.DarkNavy,
                      },
                    ]}
                  >
                    {closedKarmicPoints.length}
                  </Text>
                  <Text
                    style={[
                      styles.progressStatLabel,
                      {
                        color: colors.DarkNavy,
                      },
                    ]}
                  >
                    Tasks
                  </Text>
                </View>

                {/* Separator Line */}
                <View
                  style={[
                    styles.progressSeparator,
                    {
                      backgroundColor: colors.DarkNavy,
                    },
                  ]}
                />

                {/* Current Streak Section */}
                <View style={styles.progressStatSection}>
                  <Text
                    style={[
                      styles.progressStatNumber,
                      {
                        color: colors.DarkNavy,
                      },
                    ]}
                  >
                    {(karmicProgress as any)?.current_streak || 0}
                  </Text>
                  <Text
                    style={[
                      styles.progressStatLabel,
                      {
                        color: colors.DarkNavy,
                      },
                    ]}
                  >
                    Days
                  </Text>
                </View>
              </View>

              {/* Vertical Divider */}
              <View
                style={[
                  styles.progressVerticalDivider,
                  {
                    backgroundColor: colors.DarkNavy,
                  },
                ]}
              />

              {/* Right Section - Circular Progress */}
              <View style={styles.progressCardRightSection}>
                {renderCircularProgress()}
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </MainContainer>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: responsiveWidth(4),
    paddingBottom: Platform.OS === 'android' ? 85 : 85,
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
    marginBottom: responsiveWidth(5),
  },
  progressScoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'space-between',
    padding: responsiveWidth(2),
    borderRadius: 12,
    marginBottom: responsiveWidth(4),
    // borderWidth: 1,
    // borderColor: colors.Orangeaccentcolor,
  },
  progressScoreButton: {
    paddingVertical: responsiveWidth(1),
    paddingHorizontal: responsiveWidth(4),
    borderRadius: 8,
    // backgroundColor: colors.Orangeaccentcolor,
    borderWidth: 1,
    // borderColor: colors.Orangeaccentcolor,
  },
  progressScoreButtonText: {},
  sectionTitle: {
    fontSize: 20,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
    marginLeft: responsiveWidth(2),
    // marginBottom: responsiveWidth(2),
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: responsiveWidth(2),
    marginBottom: responsiveWidth(2),
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
    borderRadius: 15,
    borderWidth: 0.2,
    padding: responsiveWidth(4),
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: responsiveHeight(20),
  },
  progressCardLeftSection: {
    flex: 1,
    paddingRight: responsiveWidth(3),
  },
  progressCardRightSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: responsiveWidth(3),
  },
  progressCardTitle: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
    marginBottom: responsiveWidth(2),
  },
  progressStatSection: {
    // marginBottom: responsiveHeight(1.5),
  },
  progressStatNumber: {
    fontSize: 28,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    lineHeight: 34,
  },
  progressStatLabel: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    marginTop: 2,
  },
  progressSeparator: {
    height: 1,
    width: '100%',
    // marginVertical: responsiveHeight(1),
    opacity: 0.3,
  },
  progressVerticalDivider: {
    width: 1,
    height: '80%',
    opacity: 0.3,
    marginHorizontal: responsiveWidth(2),
  },
  starEmoji: {
    fontSize: 18,
  },
  progressContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  chartWrapper: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  backgroundCircle: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'white',
  },
  progressChart: {
    // marginVertical: 6,
    backgroundColor: 'white',
  },
  progressTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressScore: {
    fontSize: 24,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    color: '#23304D',
    lineHeight: 30,
  },
  progressLabel: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: '#23304D',
    marginTop: 4,
  },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  updateTaskButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: responsiveWidth(3),
    gap: responsiveWidth(2),
  },
  updateTaskButton: {
    paddingVertical: responsiveWidth(1),
    paddingHorizontal: responsiveWidth(4),
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateTaskButtonText: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
    color: '#FFFFFF',
  },
  pointsSection: {
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
    borderRadius: 8,
    paddingVertical: responsiveWidth(1),
    paddingHorizontal: responsiveWidth(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
    color: '#FFFFFF',
  },
  emptyStateContainer: {
    borderRadius: 12,
    padding: responsiveWidth(4),
    marginBottom: responsiveWidth(3),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    marginBottom: responsiveWidth(3),
  },
  addTaskButton: {
    borderRadius: 8,
    paddingVertical: responsiveWidth(2),
    paddingHorizontal: responsiveWidth(6),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: responsiveWidth(2),
  },
  addTaskButtonText: {
    fontSize: 16,
    fontFamily: fontFamily.medium,
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
  karmicProgressLoaderContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 49, 73, 0.9)',
    borderRadius: 10,
    paddingHorizontal: responsiveWidth('2'),
    paddingVertical: responsiveWidth('1'),
    marginHorizontal: responsiveWidth(4),
    marginBottom: 24,
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
  },
  selectedMemberText: {
    color: '#F6EFD9',
    fontSize: 16,
    fontFamily: fontFamily.regular,
  },
  arrowIcon: {
    width: responsiveWidth('7%'),
    height: responsiveWidth('7%'),
    resizeMode: 'contain',
    tintColor: '#F6EFD9',
  },
  arrowIconContainer: {
    padding: responsiveWidth(1),
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
  astroCard: {
    borderWidth: 0.2,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    // marginHorizontal: responsiveWidth('3'),
    marginBottom: responsiveWidth('3'),
  },
  astroContent: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: responsiveWidth('1'),
    paddingHorizontal: responsiveWidth('3'),
  },
  astroContentLeft: {
    width: '70%',
  },
  astroContentRight: {
    marginVertical: responsiveWidth(1),
  },
  astroTitle: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    lineHeight: 30,
    marginBottom: responsiveWidth('2'),
    textAlignVertical: 'center',
  },
  astroButton: {
    borderRadius: 8,
    // paddingVertical: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: responsiveWidth(1),
    paddingHorizontal: responsiveWidth(4),
    alignSelf: 'flex-start',
  },
  astroButtonText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    fontWeight: '600' as const,
  },
  astroImage: {
    width: responsiveWidth('30%'),
    height: responsiveWidth('30%'),
    resizeMode: 'contain',
    marginRight: responsiveWidth('2'),
  },
  // Progress Card Modal styles
  progressModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressModalContainer: {
    width: '90%',
    maxWidth: responsiveWidth(90),
    borderRadius: 20,
    padding: responsiveWidth(5),
    position: 'relative',
  },
  progressModalCloseButton: {
    position: 'absolute',
    top: responsiveWidth(5),
    right: responsiveWidth(5),
    width: responsiveWidth(10),
    height: responsiveWidth(10),
    borderRadius: responsiveWidth(5),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  progressModalCloseIcon: {
    width: responsiveWidth(6),
    height: responsiveWidth(6),
    resizeMode: 'contain',
  },
});

export default DashboardTasksScreen;