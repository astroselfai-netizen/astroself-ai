import http from '../../utils/http';

export interface Task {
  task: string;
  selected: boolean;
  status: 'Done' | 'pending';
  track: 'Daily' | 'Weekly' | 'Monthly' | '';
  timing_status: string;
}

export interface TaskActivityResponse {
  user_id: string;
  heading: string;
  insights: Task[];
}

export interface UpdateTaskRequest {
  user_id: string;
  heading: string;
  insights: Task[];
}

export interface SelectedTaskData {
  heading: string;
  selected_insights: Task[];
}

export interface SelectedTasksResponse {
  user_id: string;
  message: string;
  selected_data: SelectedTaskData[];
}

export interface KarmicProgressResponse {
  total: number;
  completed: number;
  score: number;
}

class TaskService {
  async getTaskActivity(
    userId: string,
    heading: string = 'Tasks You Should Perform Daily',
  ): Promise<TaskActivityResponse> {
    try {

     

      const encodedHeading = encodeURIComponent(heading);

       console.log(
         'userId -->47',
         `task_activity/${userId}?heading=${encodedHeading}`,
       );
      const response = await http.get(
        `task_activity/${userId}?heading=${encodedHeading}`,
        {
          headers: {
            accept: 'application/json',
          },
        },
      );

      console.log('response.data -->56', response.data);

      if (response.data) {
        return response.data as TaskActivityResponse;
      }

      throw new Error('Invalid response format from task activity API');
    } catch (error) {
      console.error('Error fetching task activity:', error);
      throw error;
    }
  }

  async updateTaskActivity(
    requestData: UpdateTaskRequest,
  ): Promise<{ status: boolean; message?: string }> {
    try {
      const { user_id, heading, insights } = requestData;

      // Ensure track is capitalized: "daily" -> "Daily", "weekly" -> "Weekly", etc.
      const normalizedInsights = insights.map(insight => ({
        ...insight,
        track:
          insight.track && typeof insight.track === 'string'
            ? (insight.track.charAt(0).toUpperCase() +
                insight.track.slice(1).toLowerCase()) as 'Daily' | 'Weekly' | 'Monthly'
            : insight.track,
      }));

      console.log('requestData -->83', { ...requestData, insights: normalizedInsights });

      const response = await http.put(
        'task_activity/update',
        {
          user_id,
          heading,
          insights: normalizedInsights,
        },
        {
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('response.data -->99', response.data);

      if (response.data) {
        return response.data;
      }

      throw new Error('Invalid response format from update task activity API');
    } catch (error) {
      console.error('Error updating task activity:', error);
      throw error;
    }
  }

  async getSelectedTasks(userId: string): Promise<SelectedTasksResponse> {
    try {
      const response = await http.get(
        `task_activity/selected/${userId}`,
        {
          headers: {
            accept: 'application/json',
          },
        },
      );

      if (response.data) {
        return response.data as SelectedTasksResponse;
      }

      throw new Error('Invalid response format from selected tasks API');
    } catch (error) {
      console.error('Error fetching selected tasks:', error);
      throw error;
    }
  }

  async getKarmicProgressStatus(
    memberId: string,
    period: 'daily' | 'weekly' | 'monthly',
  ): Promise<KarmicProgressResponse> {
    try {
      // Add timestamp to prevent caching and ensure fresh data
      // const timestamp = new Date().getTime();
      const response = await http.get(
        `status/${period}/${memberId}`,
        {
          headers: {
            accept: 'application/json',
            'Cache-Control': 'no-cache',
          },
        },
      );

      if (response.data) {
        return response.data as KarmicProgressResponse;
      }

      throw new Error('Invalid response format from karmic progress API');
    } catch (error) {
      console.error('Error fetching karmic progress:', error);
      throw error;
    }
  }

  async resetTask(userId: string): Promise<{ status: boolean; message?: string }> {
    try {

      console.log(
        'userId-->`task_activity/reset-task?user_id=${userId}`',
        `task_activity/reset-task?user_id=${userId}`,
      );
      const response = await http.delete(
        `task_activity/reset-task?user_id=${userId}`,
        {
          headers: {
            accept: 'application/json',
          },
        },
      );

      if (response.data) {
        return response.data;
      }

      throw new Error('Invalid response format from reset task API');
    } catch (error) {
      console.error('Error resetting task:', error);
      throw error;
    }
  }
}

export default new TaskService();

