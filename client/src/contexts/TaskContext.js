import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import toast from 'react-hot-toast';

const TaskContext = createContext();

// Get the server URL from environment variables
const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};

export const TaskProvider = ({ children }) => {
  const { token, isAuthenticated, user } = useAuth();
  const { socket } = useSocket();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    todo: 0,
    productivity: 0
  });
  const [refreshProjects, setRefreshProjects] = useState(0);

  // Fetch tasks
  const fetchTasks = async () => {
    if (!isAuthenticated || !token) return;
    
    try {
      setIsLoading(true);

      const response = await axios.get(`${SERVER_URL}/api/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const fetchedTasks = response.data.data || [];

      setTasks(fetchedTasks);
      calculateStats(fetchedTasks);
    } catch (error) {

      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (taskList) => {
    const total = taskList.length;
    const completed = taskList.filter(task => task.status === 'completed').length;
    const inProgress = taskList.filter(task => task.status === 'in_progress').length;
    const todo = taskList.filter(task => task.status === 'todo').length;
    const productivity = total > 0 ? Math.round((completed / total) * 100) : 0;

    setStats({
      total,
      completed,
      inProgress,
      todo,
      productivity
    });
  };

  // Create task
  const createTask = async (taskData, showSuccessMessage = true) => {
    try {
      setIsLoading(true);

      
      const response = await axios.post(`${SERVER_URL}/api/tasks`, taskData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const newTask = response.data.data;

      
      const updatedTasks = [...tasks, newTask];
      setTasks(updatedTasks);
      calculateStats(updatedTasks);
      
      // Trigger project refresh to update task counts
      setRefreshProjects(prev => prev + 1);
      
      // Dispatch custom event to refresh projects
      window.dispatchEvent(new CustomEvent('taskChange'));
      
      if (showSuccessMessage) {
        toast.success('Task created successfully!');
      }
      return newTask;
    } catch (error) {

      toast.error('Failed to create task');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update task
  const updateTask = async (taskId, updates) => {
    try {
      setIsLoading(true);

      
      const response = await axios.put(`${SERVER_URL}/api/tasks/${taskId}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      

      
      const updatedTask = response.data.data;
      const updatedTasks = tasks.map(task => 
        task._id === taskId ? updatedTask : task
      );
      setTasks(updatedTasks);
      calculateStats(updatedTasks);
      
      // Trigger project refresh to update task counts
      setRefreshProjects(prev => prev + 1);
      
      // Dispatch custom event to refresh projects
      window.dispatchEvent(new CustomEvent('taskChange'));
      
      toast.success('Task updated successfully!');
      return updatedTask;
    } catch (error) {

      toast.error(`Failed to update task: ${error.response?.data?.message || error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete task
  const deleteTask = async (taskId) => {
    try {
      setIsLoading(true);
      await axios.delete(`${SERVER_URL}/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const updatedTasks = tasks.filter(task => task._id !== taskId);
      setTasks(updatedTasks);
      calculateStats(updatedTasks);
      
      // Trigger project refresh to update task counts
      setRefreshProjects(prev => prev + 1);
      
      // Dispatch custom event to refresh projects
      window.dispatchEvent(new CustomEvent('taskChange'));
      
      toast.success('Task deleted successfully!');
    } catch (error) {

      toast.error('Failed to delete task');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Get tasks by status
  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  // Get overdue tasks
  const getOverdueTasks = () => {
    const now = new Date();
    return tasks.filter(task => 
      task.dueDate && new Date(task.dueDate) < now && task.status !== 'completed'
    );
  };

  // Get high priority tasks
  const getHighPriorityTasks = () => {
    return tasks.filter(task => task.priority === 'high' && task.status !== 'completed');
  };

  // Socket.io event handlers
  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    // Listen for task events
    socket.on('taskCreated', (newTask) => {
      if (newTask.assignee === user?.id || newTask.createdBy === user?.id) {
        setTasks(prev => {
          const updated = [newTask, ...prev];
          calculateStats(updated);
          return updated;
        });
        // Trigger project refresh to update task counts
        setRefreshProjects(prev => prev + 1);
        
        // Dispatch custom event to refresh projects
        window.dispatchEvent(new CustomEvent('taskChange'));
        
        toast.success('New task created!');
      }
    });

    socket.on('taskUpdated', (updatedTask) => {
      if (updatedTask.assignee === user?.id || updatedTask.createdBy === user?.id) {
        setTasks(prev => {
          const updated = prev.map(task => 
            task._id === updatedTask._id ? updatedTask : task
          );
          calculateStats(updated);
          return updated;
        });
        // Trigger project refresh to update task counts
        setRefreshProjects(prev => prev + 1);
        
        // Dispatch custom event to refresh projects
        window.dispatchEvent(new CustomEvent('taskChange'));
      }
    });

    socket.on('taskDeleted', (deletedTaskId) => {
      setTasks(prev => {
        const updated = prev.filter(task => task._id !== deletedTaskId);
        calculateStats(updated);
        return updated;
      });
      // Trigger project refresh to update task counts
      setRefreshProjects(prev => prev + 1);
      
      // Dispatch custom event to refresh projects
      window.dispatchEvent(new CustomEvent('taskChange'));
    });

    // Join user's task room
    socket.emit('joinTaskRoom', user?.id);

    // Cleanup
    return () => {
      socket.off('taskCreated');
      socket.off('taskUpdated');
      socket.off('taskDeleted');
    };
  }, [socket, isAuthenticated, user?.id]);

  // Fetch tasks when component mounts and user is authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchTasks();
    } else {
      setTasks([]);
      setStats({
        total: 0,
        completed: 0,
        inProgress: 0,
        todo: 0,
        productivity: 0
      });
    }
  }, [isAuthenticated, token]);

  const value = {
    tasks,
    stats,
    isLoading,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    getTasksByStatus,
    getOverdueTasks,
    getHighPriorityTasks,
    refreshProjects
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};

export default TaskProvider;
