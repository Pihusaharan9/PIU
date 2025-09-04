import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated, user } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    if (isAuthenticated && token && !socketRef.current) {
      connectSocket();
    }

    return () => {
      if (socketRef.current) {
        disconnectSocket();
      }
    };
  }, [isAuthenticated, token]);

  const connectSocket = () => {
    try {
      // Create socket connection
      socketRef.current = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:3001', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      // Connection events
      socketRef.current.on('connect', () => {

        setIsConnected(true);
        setConnectionStatus('connected');
      });

      socketRef.current.on('disconnect', (reason) => {
        // console.log('🔌 Socket disconnected:', reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
      });

      socketRef.current.on('connect_error', (error) => {
        // console.error('🔌 Socket connection error:', error);
        setConnectionStatus('error');
      });

      socketRef.current.on('welcome', (data) => {
        // console.log('🔌 Welcome message:', data);
      });

      // Task events
      socketRef.current.on('task:updated', (data) => {
        // console.log('📋 Task updated:', data);
        // You can emit custom events or use a state management solution here
      });

      socketRef.current.on('task:created', (data) => {
        // console.log('📋 Task created:', data);
      });

      socketRef.current.on('task:deleted', (data) => {
        // console.log('📋 Task deleted:', data);
      });

      // Project events
      socketRef.current.on('project:updated', (data) => {
        // console.log('📁 Project updated:', data);
      });

      socketRef.current.on('project:created', (data) => {
        // console.log('📁 Project created:', data);
      });

      socketRef.current.on('project:deleted', (data) => {
        // console.log('📁 Project deleted:', data);
      });

      // Chat events
      socketRef.current.on('chat:new_message', (data) => {
        // console.log('💬 New chat message:', data);
      });

      socketRef.current.on('chat:user_typing', (data) => {
        // console.log('💬 User typing:', data);
      });

      // User events
      socketRef.current.on('user:joined', (data) => {
        // console.log('👤 User joined:', data);
      });

      socketRef.current.on('user:left', (data) => {
        // console.log('👤 User left:', data);
      });

      socketRef.current.on('user:offline', (data) => {
        // console.log('👤 User offline:', data);
      });

      // AI events
      socketRef.current.on('ai:optimization_started', (data) => {
        // console.log('🧠 AI optimization started:', data);
      });

      socketRef.current.on('ai:optimization_complete', (data) => {
        // console.log('🧠 AI optimization complete:', data);
      });

      socketRef.current.on('ai:optimization_error', (data) => {
        // console.error('🧠 AI optimization error:', data);
      });

      // Error handling
      socketRef.current.on('error', (error) => {
        // console.error('🔌 Socket error:', error);
      });

    } catch (error) {
      // console.error('🔌 Failed to create socket connection:', error);
      setConnectionStatus('error');
    }
  };

  const disconnectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setConnectionStatus('disconnected');
    }
  };

  const emit = (event, data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    } else {
      // console.warn('🔌 Socket not connected, cannot emit event:', event);
    }
  };

  const on = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  const off = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  };

  // Task-related socket methods
  const updateTask = (taskId, projectId, updates) => {
    emit('task:update', { taskId, projectId, updates, userId: user?._id });
  };

  const createTask = (taskData) => {
    emit('task:create', { ...taskData, userId: user?._id });
  };

  const deleteTask = (taskId, projectId) => {
    emit('task:delete', { taskId, projectId, userId: user?._id });
  };

  // Project-related socket methods
  const updateProject = (projectId, updates) => {
    emit('project:update', { projectId, updates, userId: user?._id });
  };

  const joinProject = (projectId) => {
    emit('project:join', { projectId });
  };

  const leaveProject = (projectId) => {
    emit('project:leave', { projectId });
  };

  // Chat-related socket methods
  const sendMessage = (projectId, message) => {
    emit('chat:message', { 
      projectId, 
      message, 
      userId: user?._id, 
      username: user?.username 
    });
  };

  const setTyping = (projectId, isTyping) => {
    emit('chat:typing', { 
      projectId, 
      isTyping, 
      username: user?.username 
    });
  };

  // AI-related socket methods
  const optimizeTask = (taskId, optimizationType) => {
    emit('ai:optimize', { taskId, optimizationType });
  };

  const value = {
    socket: socketRef.current,
    isConnected,
    connectionStatus,
    connect: connectSocket,
    disconnect: disconnectSocket,
    emit,
    on,
    off,
    // Task methods
    updateTask,
    createTask,
    deleteTask,
    // Project methods
    updateProject,
    joinProject,
    leaveProject,
    // Chat methods
    sendMessage,
    setTyping,
    // AI methods
    optimizeTask
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
