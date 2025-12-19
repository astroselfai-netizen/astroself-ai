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
  Modal,
  FlatList,
  TextInput,
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
import taskService from '../../services/task/task.service';
import { Task } from '../../services/task/task.service';
import LottieView from 'lottie-react-native';
import { useProfileData } from '../../hooks/useProfileData';

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
  timing_status?: 'new' | 'old';
}

const EditAllTaskSelectionScreen = () => {
  const { theme, colors } = useTheme();
  const navigation = useNavigation<EditAllTaskSelectionScreenNavigationProp>();
  const route = useRoute<EditAllTaskSelectionScreenRouteProp>();
  const { membersData } = useProfileData();

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [originalTasks, setOriginalTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [heading, setHeading] = useState<string>('Tasks You Should Perform Daily');
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCreateTaskModalVisible, setIsCreateTaskModalVisible] = useState(false);
  const [newTaskDescription, setNewTaskDescription] = useState('');

  // Set selectedMemberId only when userId comes from route params
  useEffect(() => {
    if (route.params?.userId && route.params.userId.trim() !== '') {
      console.log('Setting member from route params:', route.params.userId);
      const memberId = route.params.userId;
      setSelectedMemberId(memberId);
      setUserId(memberId);
      setIsInitialized(true);
    }
  }, [route.params?.userId]);

  // Set selectedMemberId based on primary member from membersData (only initially)
  useEffect(() => {
    if (
      !isInitialized &&
      membersData &&
      Array.isArray(membersData) &&
      membersData.length > 0 &&
      !route.params?.userId // Don't override if route params has userId
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
  }, [membersData, isInitialized, route.params?.userId]);

  // Update userId when selectedMemberId changes (from dropdown)
  useEffect(() => {
    if (selectedMemberId) {
      setUserId(selectedMemberId);
    }
  }, [selectedMemberId]);

  // Fetch tasks from API - use selectedMemberId or userId
  useEffect(() => {
    const fetchTasks = async () => {
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
        const currentHeading = route.params?.heading || heading;
        const response = await taskService.getTaskActivity(
          memberIdToUse,
          currentHeading,
        );
        
        console.log('Tasks fetched successfully:', response);
        
        // Check if response has insights and it's an array
        if (!response || !response.insights || !Array.isArray(response.insights)) {
          console.log('No insights found in response, setting empty tasks');
          setTasks([]);
          setOriginalTasks([]);
          setLoading(false);
          return;
        }

        // Check if insights array is empty
        if (response.insights.length === 0) {
          console.log('Empty insights array, setting empty tasks');
          setTasks([]);
          setOriginalTasks([]);
          setLoading(false);
          return;
        }

        console.log('response.insights -->', JSON.stringify(response.insights, null, 2))
        
        // Map API response to component task structure
        const mappedTasks: TaskItem[] = response.insights.map(
          (task: Task, index: number) => {
            // Preserve timing_status from API - if it exists and is valid, use it
            // Only default to 'old' if timing_status is completely missing, null, undefined, or empty
            let timingStatus: 'new' | 'old' = 'old';
            
            // Check if timing_status exists in the task object
            if (task.timing_status !== undefined && task.timing_status !== null && task.timing_status !== '') {
              const status = String(task.timing_status).toLowerCase().trim();
              if (status === 'new') {
                timingStatus = 'new';
              } else if (status === 'old') {
                timingStatus = 'old';
              } else {
                // If timing_status exists but is not 'new' or 'old', log it and default to 'old'
                console.warn(`Task ${index + 1} has invalid timing_status: "${task.timing_status}", defaulting to 'old'`);
                timingStatus = 'old';
              }
            } else {
              // timing_status is missing - this should not happen if backend is saving it correctly
              console.warn(`Task ${index + 1} is missing timing_status field. Full task:`, JSON.stringify(task));
            }
            
            console.log(`Task ${index + 1}: "${task.task.substring(0, 40)}..." | API timing_status: "${task.timing_status}" (type: ${typeof task.timing_status}) | Mapped to: "${timingStatus}"`);
            
            return {
              id: index + 1,
              description: task.task,
              frequency:
                task.track === 'Daily' ||
                task.track === 'Weekly' ||
                task.track === 'Monthly'
                  ? (task.track as 'Daily' | 'Weekly' | 'Monthly')
                  : 'Daily',
              selected: task.selected,
              status: task.status,
              track: task.track,
              timing_status: timingStatus,
            };
          },
        );

        setTasks(mappedTasks);
        setOriginalTasks(mappedTasks);
        if (response.heading && response.heading !== currentHeading) {
          setHeading(response.heading);
        }
      } catch (error: any) {
        console.error('Error fetching tasks:', error);
        
        // Handle 404 or any error - set empty tasks array to show "No tasks found"
        setTasks([]);
        setOriginalTasks([]);
        
        // Check if it's a 404 error
        if (error?.response?.status === 404 || error?.status === 404) {
          console.log('404 error: No tasks found for this member');
        } else {
          console.log('Error fetching tasks:', error?.message || 'Unknown error');
        }
      } finally {
        setLoading(false);
      }
    };

    // Fetch when selectedMemberId is available (this is the primary source)
    if (selectedMemberId) {
      console.log('Triggering fetchTasks, selectedMemberId:', selectedMemberId);
      fetchTasks();
    } else if (!isInitialized && userId) {
      // Fallback: if initialization hasn't happened yet but userId exists, use it
      console.log('Triggering fetchTasks with userId fallback:', userId);
      fetchTasks();
    }
  }, [selectedMemberId, userId, heading, route.params?.heading, isInitialized]);

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

  const handleCreateTask = async () => {
    if (!newTaskDescription.trim()) {
      Alert.alert('Error', 'Please enter a task description');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    try {
      setSaving(true);

      // Create new task with default values
      const newTask: TaskItem = {
        id: tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
        description: newTaskDescription.trim(),
        frequency: 'Daily',
        selected: true,
        status: 'pending',
        track: 'Daily',
        timing_status: 'new',
      };

      // Add new task to tasks array
      const updatedTasks = [...tasks, newTask];
      setTasks(updatedTasks);

      console.log('updatedTasks=========>', updatedTasks);
      

      // Map all tasks (including new one) to API format
      const insights: Task[] = updatedTasks.map(task => {
        // Find the original task by description to compare
        const originalTask = originalTasks.find(
          orig => orig.description === task.description
        );
        
        // If task was unselected (changed from selected=true to selected=false), set status to pending
        const wasUnselected = originalTask && originalTask.selected === true && task.selected === false;
        
        // If task is new (not in originalTasks), set timing_status to "new"
        // Otherwise, preserve the existing timing_status (don't change 'new' to 'old')
        const isNewTask = !originalTask;
        
        // For existing tasks, preserve their timing_status - if it was 'new', keep it 'new'
        // Only use 'old' as fallback if timing_status is completely missing
        let finalTimingStatus: string;
        if (isNewTask) {
          finalTimingStatus = 'new';
        } else {
          // Preserve existing timing_status - prioritize task.timing_status, then originalTask.timing_status
          // Ensure it's always a valid string ('new' or 'old')
          const currentStatus = task.timing_status || originalTask?.timing_status;
          if (currentStatus === 'new' || currentStatus === 'old') {
            finalTimingStatus = currentStatus;
          } else {
            finalTimingStatus = 'old';
          }
        }
        
        // Ensure timing_status is always a string (never undefined/null)
        finalTimingStatus = String(finalTimingStatus || 'old');
        
        console.log(`Task (handleCreateTask): ${task.description.substring(0, 30)}... | isNewTask: ${isNewTask} | task.timing_status: ${task.timing_status} | originalTask.timing_status: ${originalTask?.timing_status} | final: ${finalTimingStatus}`);
        
        return {
          task: task.description,
          selected: task.selected,
          status: wasUnselected ? 'pending' : (task.status || 'pending'),
          track: task.frequency as 'Daily' | 'Weekly' | 'Monthly' | '',
          timing_status: finalTimingStatus,
        };
      });

      console.log('insights before API call -->', JSON.stringify(insights, null, 2));

      // Call API to update tasks
      await taskService.updateTaskActivity({
        user_id: selectedMemberId || userId || '',
        heading: 'Tasks You Should Perform Daily',
        insights: insights,
      });

      // Close modal and reset description
      setIsCreateTaskModalVisible(false);
      setNewTaskDescription('');

      Alert.alert('Success', 'Task created successfully');
    } catch (error: any) {
      console.error('Error creating task:', error);
      Alert.alert(
        'Error',
        error?.message || 'Failed to create task. Please try again.',
        [{ text: 'OK' }],
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!userId) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    try {
      setSaving(true);
      
      // Map component tasks back to API format
      const insights: Task[] = tasks.map(task => {
        // Find the original task by description to compare
        const originalTask = originalTasks.find(
          orig => orig.description === task.description
        );
        
        // If task was unselected (changed from selected=true to selected=false), set status to pending
        const wasUnselected = originalTask && originalTask.selected === true && task.selected === false;
        
        // If task is new (not in originalTasks), set timing_status to "new"
        // Otherwise, preserve the existing timing_status (don't change 'new' to 'old')
        const isNewTask = !originalTask;
        
        // For existing tasks, preserve their timing_status - if it was 'new', keep it 'new'
        // Only use 'old' as fallback if timing_status is completely missing
        let finalTimingStatus: string;
        if (isNewTask) {
          finalTimingStatus = 'new';
        } else {
          // Preserve existing timing_status - prioritize task.timing_status, then originalTask.timing_status
          // Ensure it's always a valid string ('new' or 'old')
          const currentStatus = task.timing_status || originalTask?.timing_status;
          if (currentStatus === 'new' || currentStatus === 'old') {
            finalTimingStatus = currentStatus;
          } else {
            finalTimingStatus = 'old';
          }
        }
        
        // Ensure timing_status is always a string (never undefined/null)
        finalTimingStatus = String(finalTimingStatus || 'old');
        
        console.log(`Task (handleSave): ${task.description.substring(0, 30)}... | isNewTask: ${isNewTask} | task.timing_status: ${task.timing_status} | originalTask.timing_status: ${originalTask?.timing_status} | final: ${finalTimingStatus}`);
        
        return {
          task: task.description,
          selected: task.selected,
          status: wasUnselected ? 'pending' : (task.status || 'pending'),
          track: task.frequency as 'Daily' | 'Weekly' | 'Monthly' | '',
          timing_status: finalTimingStatus,
        };
      });

      console.log('insights before API call (handleSave) -->', JSON.stringify(insights, null, 2));

      await taskService.updateTaskActivity({
        user_id: selectedMemberId || userId || '',
        heading: 'Tasks You Should Perform Daily',
        insights: insights,
      });

      Alert.alert('Success', 'Tasks updated successfully', [
        { text: 'OK', onPress: () => {
          navigation.goBack();
        } },
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
        {/* Select Your Karmic Points Section */}
        <View style={styles.pointsSection}>
          <View style={styles.saveButtonContainer}>
            <View style={styles.sectionTitleContainer}>
              <Text
                style={[styles.sectionTitle, { color: colors.themeTextWhite }]}
              >
                Select Your Tasks
              </Text>
              {/* <Text style={styles.moonIcon}>🌙</Text> */}
            </View>

            {/* create task */}
            <TouchableOpacity
              onPress={() => setIsCreateTaskModalVisible(true)}
              style={[
                styles.createTaskButton,
                {
                  backgroundColor:
                    theme === 'dark'
                      ? colors.Orangeaccentcolor
                      : colors.Orangeaccentcolor,
                },
              ]}
            >
              <Text
                style={[
                  styles.editBtnText,
                  { color: theme === 'dark' ? colors.white : colors.white },
                ]}
              >
                Create Task
              </Text>
            </TouchableOpacity>
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
                  opacity: saving || loading ? 0.5 : 1,
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
                style={[styles.emptyText, { color: colors.themeTextWhite }]}
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
                  <View style={styles.taskTextContainer}>
                    <Text
                      style={[
                        styles.taskNumber,
                        {
                          color:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.DarkNavy,
                        },
                      ]}
                    >
                      {index + 1}.&nbsp;
                    </Text>
                    <View style={styles.taskDescriptionContainer}>
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
                      {task.timing_status && task.timing_status === 'new' && (
                        <View
                          style={[
                            styles.timingStatusBadge,
                            {
                              backgroundColor:
                                task.timing_status === 'new'
                                  ? '#4CAF50'
                                  : '#9E9E9E'
                            },
                          ]}
                        >
                          <Text style={styles.timingStatusText}>
                            {/* {task.timing_status === 'new' ? 'NEW' : 'OLD'} */}
                            NEW
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
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
            ))
          )}
        </View>
      </ScrollView>

      {/* Create Task Modal */}
      <Modal
        visible={isCreateTaskModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setIsCreateTaskModalVisible(false);
          setNewTaskDescription('');
        }}
      >
        <TouchableOpacity
          style={styles.createTaskModalOverlay}
          activeOpacity={1}
          onPress={() => {
            setIsCreateTaskModalVisible(false);
            setNewTaskDescription('');
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={e => e.stopPropagation()}
            style={[
              styles.createTaskModalContainer,
              {
                backgroundColor:
                  theme === 'dark' ? colors.DarkNavy : colors.white,
              },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              Create New Task
            </Text>

            <TextInput
              style={[
                styles.modalDescriptionInput,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.DarkNavy : colors.white,
                  borderColor:
                    theme === 'dark'
                      ? colors.themeBorderDropdown
                      : colors.borderColor,
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
              placeholder="Enter task description"
              placeholderTextColor={
                theme === 'dark' ? colors.themelightText : colors.themelightText
              }
              value={newTaskDescription}
              onChangeText={setNewTaskDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.modalCancelButton,
                  {
                    backgroundColor:
                      theme === 'dark' ? colors.DarkNavy : colors.white,
                    borderColor:
                      theme === 'dark'
                        ? colors.themeBorderDropdown
                        : colors.borderColor,
                  },
                ]}
                onPress={() => {
                  setIsCreateTaskModalVisible(false);
                  setNewTaskDescription('');
                }}
              >
                <Text
                  style={[
                    styles.modalCancelButtonText,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalCreateButton,
                  {
                    backgroundColor: colors.Orangeaccentcolor,
                  },
                ]}
                onPress={handleCreateTask}
              >
                <Text style={styles.modalCreateButtonText}>Create</Text>
              </TouchableOpacity>
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
    paddingBottom: Platform.OS === 'android' ? 70 : 70,
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
    // width: responsiveWidth(15),
    alignItems: 'flex-start',
    justifyContent: 'center',
    // position: 'absolute',
    // left: 16,
    zIndex: 1,
  },
  backIcon: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    marginLeft: responsiveWidth(3),
    resizeMode: 'contain',
  },
  headerCenter: {
    flex: 1,
    // width: '100%',
    // alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -responsiveWidth(6),
  },
  // headerSpacer: {
  //   width: responsiveWidth(15),
  // },
  headerTitle: {
    fontSize: 24,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  editBtn: {
    // width: responsiveWidth(15),
    paddingVertical: 8,
    paddingHorizontal: 14,
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
    marginBottom: responsiveWidth(3),
    marginTop: responsiveWidth(3),
  },
  saveButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: responsiveWidth(3),
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
  taskTextContainer: {
    flex: 1,
    flexDirection: 'row',
    marginRight: responsiveWidth(2),
    alignItems: 'flex-start',
  },
  taskDescriptionContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: responsiveWidth(2),
  },
  taskNumber: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    marginRight: responsiveWidth(1),
  },
  taskDescription: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: '#FFFFFF',
    // marginBottom: responsiveHeight(1),
  },
  timingStatusBadge: {
    paddingHorizontal: responsiveWidth(2),
    paddingVertical: responsiveWidth(0.5),
    borderRadius: 4,
    marginLeft: responsiveWidth(1),
    // marginBottom: responsiveHeight(1),
  },
  timingStatusText: {
    fontSize: 10,
    fontFamily: fontFamily.semiBold,
    color: '#FFFFFF',
    textTransform: 'uppercase',
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
    alignItems: 'flex-start',
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
  profileCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 49, 73, 0.9)',
    borderRadius: 10,
    paddingHorizontal: responsiveWidth('2'),
    paddingVertical: responsiveWidth('1'),
    marginHorizontal: responsiveWidth(4),
    // marginBottom: 24,
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
  createTaskButton: {
    // width: responsiveWidth(15),
    backgroundColor: '#DF8A5D',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    // marginRight: responsiveWidth(2),
  },
  createTaskButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fontFamily.medium,
  },
  createTaskModalContainer: {
    width: '85%',
    borderRadius: 16,
    padding: responsiveWidth(5),
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: fontFamily.semiBold,
    marginBottom: responsiveWidth(4),
    textAlign: 'center',
  },
  modalDescriptionInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: responsiveWidth(3),
    fontSize: 16,
    fontFamily: fontFamily.regular,
    minHeight: 100,
    marginBottom: responsiveWidth(4),
    textAlignVertical: 'top',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: responsiveWidth(10),
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontFamily: fontFamily.medium,
  },
  modalCreateButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCreateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fontFamily.medium,
  },
  createTaskModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default EditAllTaskSelectionScreen;