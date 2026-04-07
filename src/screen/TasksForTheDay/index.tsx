import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { fontFamily, responsiveWidth } from '../../constant/theme';

type RootStackParamList = {
  TasksForTheDayScreen: { userId?: string } | undefined;
};

type NavProp = StackNavigationProp<RootStackParamList, 'TasksForTheDayScreen'>;

interface TaskItem {
  id: number;
  description: string;
  status?: 'Done' | 'pending';
  track?: string;
  heading?: string;
}

const TasksForTheDayScreen = () => {
  const { theme, colors } = useTheme();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<any>();
  const routeUserId: string | undefined = route?.params?.userId;

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const openKarmicPoints = useMemo(
    () => tasks.filter(t => t.status === 'pending'),
    [tasks],
  );
  // Note: We intentionally don't show closed tasks on this screen.

  const fetchTasks = useCallback(async () => {
    if (!routeUserId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // SAME as DashboardTasks: fetch only selected tasks
      const response = await taskService.getSelectedTasks(routeUserId);

      if (
        !response ||
        !response.selected_data ||
        !Array.isArray(response.selected_data) ||
        response.selected_data.length === 0
      ) {
        setTasks([]);
        return;
      }

      const allTasks: TaskItem[] = [];
      let taskIdCounter = 1;

      response.selected_data.forEach((data: any) => {
        if (data.selected_insights && Array.isArray(data.selected_insights)) {
          data.selected_insights.forEach((insight: any) => {
            allTasks.push({
              id: taskIdCounter++,
              description: insight.task,
              status: insight.status,
              track: insight.track,
              heading: data.heading,
            });
          });
        }
      });

      // For this screen, show only daily heading tasks
      const dailyTasks = allTasks.filter(
        t =>
          String(t.heading || '').toLowerCase() ===
          'tasks you should perform daily',
      );

      setTasks(dailyTasks);
    } catch (e: any) {
      console.error('Error fetching selected tasks:', e);
      setTasks([]);
      Alert.alert('Error', e?.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [routeUserId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [fetchTasks]),
  );

  const [selectedToClose, setSelectedToClose] = useState<Set<number>>(
    new Set(),
  );

  const toggleTaskSelection = (taskId: number) => {
    setSelectedToClose(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const handleDone = async () => {
    if (!routeUserId) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    try {
      if (selectedToClose.size === 0) {
        Alert.alert('No Selection', 'Please select at least one task.');
        return;
      }

      setSaving(true);

      // Apply changes locally only at submit time
      const tasksAfterSubmit: TaskItem[] = tasks.map(t => {
        if (selectedToClose.has(t.id)) {
          return { ...t, status: 'Done' };
        }
        return t;
      });

      // SAME as DashboardTasks: fetch full task_activity by heading,
      // then merge updated statuses, preserve selected/timing_status.
      const apiResponse = await taskService.getTaskActivity(
        routeUserId,
        'Tasks You Should Perform Daily',
      );
      const allTasksFromAPI: Task[] =
        (apiResponse?.insights && Array.isArray(apiResponse.insights)
          ? apiResponse.insights
          : []) || [];

      const updatedTasksMap = new Map<string, TaskItem>();
      tasksAfterSubmit.forEach(t => updatedTasksMap.set(t.description, t));

      const mergedInsights: Task[] = allTasksFromAPI.map(apiTask => {
        const updated = updatedTasksMap.get(apiTask.task);
        if (!updated) return apiTask;
        return {
          task: updated.description,
          selected: apiTask.selected !== undefined ? apiTask.selected : true,
          status: updated.status || 'pending',
          track:
            updated.track === 'Daily' ||
            updated.track === 'Weekly' ||
            updated.track === 'Monthly' ||
            updated.track === ''
              ? (updated.track as any)
              : '',
          timing_status: apiTask.timing_status || 'old',
        };
      });

      await taskService.updateTaskActivity({
        user_id: routeUserId,
        heading: 'Tasks You Should Perform Daily',
        insights: mergedInsights,
      });

      setSelectedToClose(new Set());
      await fetchTasks();
      Alert.alert('Success', 'Tasks updated successfully');
    } catch (e: any) {
      console.error('Error updating tasks:', e);
      Alert.alert('Error', e?.message || 'Failed to update tasks');
    } finally {
      setSaving(false);
    }
  };

  const hasOpenTasks = openKarmicPoints.length > 0;
  const hasSelection = selectedToClose.size > 0;
  const doneEnabled =
    hasOpenTasks && hasSelection && !saving && !loading;
  const doneButtonDimmed =
    !hasOpenTasks || (!hasSelection && !saving) || loading;

  return (
    <MainContainer>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent={true}
      />
      {/* Header (same layout style as DashboardTasks) */}
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
            numberOfLines={1}
          >
            Submit Your Progress
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {hasOpenTasks ? (
          <View style={styles.topActionRow}>
            <TouchableOpacity
              style={[
                styles.topActionButton,
                {
                  backgroundColor: colors.Orangeaccentcolor,
                  opacity: doneButtonDimmed ? 0.45 : 1,
                },
              ]}
              onPress={handleDone}
              disabled={!doneEnabled}
              activeOpacity={0.7}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={[styles.topActionButtonText, { color: colors.white }]}>
                  Submit Your Progress
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Pending tasks pill (no Closed tab) */}
        {/* <View style={styles.pendingPillRow}>
          <View
            style={[
              styles.pendingPill,
              { backgroundColor: colors.Orangeaccentcolor },
            ]}
          >
            <Text style={[styles.pendingPillText, { color: colors.white }]}>
              Your Tasks for the day
            </Text>
            <View style={[styles.pendingPillBadge, { backgroundColor: colors.white }]}>
              <Text
                style={[
                  styles.pendingPillBadgeText,
                  { color: colors.Orangeaccentcolor },
                ]}
              >
                {openKarmicPoints.length}
              </Text>
            </View>
          </View>
        </View> */}

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator
              size="large"
              color={colors.Orangeaccentcolor}
            />
          </View>
        ) : (
          <>
            {openKarmicPoints.length > 0 ? (
              openKarmicPoints.map(task => (
                <TouchableOpacity
                  key={task.id}
                  activeOpacity={0.7}
                  onPress={() => toggleTaskSelection(task.id)}
                >
                  <View
                    style={[
                      styles.taskCard,
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
                    <View style={styles.taskRow}>
                      <Text
                        style={[
                          styles.taskText,
                          {
                            flex: 1,
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
                      <View style={styles.checkboxContainer}>
                        {selectedToClose.has(task.id) ? (
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
                                borderColor: colors.Orangeaccentcolor,
                                backgroundColor:
                                  theme === 'dark'
                                    ? colors.DarkNavy
                                    : colors.white,
                              },
                            ]}
                          />
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View
                style={[
                  styles.emptyCard,
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
                    styles.emptyText,
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
          </>
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
  topActionRow: {
    alignItems: 'flex-end',
    marginTop: responsiveWidth(2),
    marginBottom: responsiveWidth(2),
  },
  topActionButton: {
    minWidth: responsiveWidth(34),
    borderRadius: 12,
    paddingVertical: responsiveWidth(2.6),
    paddingHorizontal: responsiveWidth(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  topActionButtonText: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop:
      Platform.OS === 'android' ? responsiveWidth(2) : responsiveWidth(12),
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
    position: 'relative',
    minHeight: 50,
  },
  backBtn: {
    width: responsiveWidth(12),
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerRight: {
    width: responsiveWidth(12),
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
    fontSize: 20,
    fontFamily: fontFamily.medium,
    textAlign: 'center',
  },
  pendingPillRow: {
    marginTop: responsiveWidth(4),
    marginBottom: responsiveWidth(4),
  },
  pendingPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: responsiveWidth(3),
    paddingHorizontal: responsiveWidth(4),
    gap: responsiveWidth(2),
  },
  pendingPillText: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
  },
  pendingPillBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  pendingPillBadgeText: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
  },
  loadingWrap: {
    paddingVertical: responsiveWidth(10),
  },
  taskCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: responsiveWidth(4),
    marginBottom: responsiveWidth(3),
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    paddingRight: responsiveWidth(2),
  },
  checkboxContainer: {
    marginLeft: responsiveWidth(2),
  },
  checkboxUnchecked: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
  },
  checkboxChecked: {
    width: 24,
    height: 24,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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

export default TasksForTheDayScreen;

