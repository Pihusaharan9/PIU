const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class SocketManager {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
    this.userRooms = new Map();
  }

  initializeSocket(server) {
    this.io = socketIo(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? [process.env.CLIENT_URL, 'https://yourdomain.com'] 
          : ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    
    console.log('🔌 Socket.io initialized successfully');
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }

        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 User connected: ${socket.user.username} (${socket.id})`);
      
      // Store connected user
      this.connectedUsers.set(socket.user._id.toString(), {
        socketId: socket.id,
        user: socket.user,
        connectedAt: new Date()
      });

      // Join user to their personal room
      socket.join(`user_${socket.user._id}`);
      this.userRooms.set(socket.user._id.toString(), `user_${socket.user._id}`);

      // Join user to their team rooms
      if (socket.user.teams && socket.user.teams.length > 0) {
        socket.user.teams.forEach(teamId => {
          socket.join(`team_${teamId}`);
        });
      }

      // Handle task updates
      socket.on('task:update', (data) => {
        this.handleTaskUpdate(socket, data);
      });

      // Handle project updates
      socket.on('project:update', (data) => {
        this.handleProjectUpdate(socket, data);
      });

      // Handle chat messages
      socket.on('chat:message', (data) => {
        this.handleChatMessage(socket, data);
      });

      // Handle user typing
      socket.on('chat:typing', (data) => {
        this.handleUserTyping(socket, data);
      });

      // Handle user joining project
      socket.on('project:join', (data) => {
        this.handleProjectJoin(socket, data);
      });

      // Handle user leaving project
      socket.on('project:leave', (data) => {
        this.handleProjectLeave(socket, data);
      });

      // Handle AI task optimization
      socket.on('ai:optimize', (data) => {
        this.handleAIOptimization(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error('Socket error:', error);
        socket.emit('error', { message: 'An error occurred' });
      });

      // Send welcome message
      socket.emit('welcome', {
        message: `Welcome ${socket.user.username}!`,
        userId: socket.user._id,
        timestamp: new Date()
      });
    });
  }

  handleTaskUpdate(socket, data) {
    const { taskId, projectId, updates, userId } = data;
    
    // Emit to project room
    if (projectId) {
      socket.to(`project_${projectId}`).emit('task:updated', {
        taskId,
        updates,
        updatedBy: userId,
        timestamp: new Date()
      });
    }

    // Emit to team members
    if (socket.user.teams) {
      socket.user.teams.forEach(teamId => {
        socket.to(`team_${teamId}`).emit('task:updated', {
          taskId,
          updates,
          updatedBy: userId,
          timestamp: new Date()
        });
      });
    }
  }

  handleProjectUpdate(socket, data) {
    const { projectId, updates, userId } = data;
    
    socket.to(`project_${projectId}`).emit('project:updated', {
      projectId,
      updates,
      updatedBy: userId,
      timestamp: new Date()
    });
  }

  handleChatMessage(socket, data) {
    const { projectId, message, userId, username } = data;
    
    const chatData = {
      message,
      userId,
      username,
      timestamp: new Date(),
      projectId
    };

    socket.to(`project_${projectId}`).emit('chat:new_message', chatData);
  }

  handleUserTyping(socket, data) {
    const { projectId, isTyping, username } = data;
    
    socket.to(`project_${projectId}`).emit('chat:user_typing', {
      username,
      isTyping,
      timestamp: new Date()
    });
  }

  handleProjectJoin(socket, data) {
    const { projectId } = data;
    
    socket.join(`project_${projectId}`);
    socket.to(`project_${projectId}`).emit('project:user_joined', {
      userId: socket.user._id,
      username: socket.user.username,
      timestamp: new Date()
    });
  }

  handleProjectLeave(socket, data) {
    const { projectId } = data;
    
    socket.leave(`project_${projectId}`);
    socket.to(`project_${projectId}`).emit('project:user_left', {
      userId: socket.user._id,
      username: socket.user.username,
      timestamp: new Date()
    });
  }

  async handleAIOptimization(socket, data) {
    try {
      const { taskId, optimizationType } = data;
      
      // Emit optimization start
      socket.emit('ai:optimization_started', {
        taskId,
        optimizationType,
        timestamp: new Date()
      });

      // Simulate AI processing time
      setTimeout(() => {
        socket.emit('ai:optimization_complete', {
          taskId,
          optimizationType,
          result: 'Task optimized successfully',
          timestamp: new Date()
        });
      }, 2000);

    } catch (error) {
      socket.emit('ai:optimization_error', {
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  handleDisconnect(socket) {
    console.log(`🔌 User disconnected: ${socket.user.username} (${socket.id})`);
    
    // Remove from connected users
    this.connectedUsers.delete(socket.user._id.toString());
    this.userRooms.delete(socket.user._id.toString());

    // Notify team members
    if (socket.user.teams) {
      socket.user.teams.forEach(teamId => {
        socket.to(`team_${teamId}`).emit('user:offline', {
          userId: socket.user._id,
          username: socket.user.username,
          timestamp: new Date()
        });
      });
    }
  }

  // Public methods for external use
  getIO() {
    return this.io;
  }

  getConnectedUsers() {
    return Array.from(this.connectedUsers.values());
  }

  getUserSocket(userId) {
    const userData = this.connectedUsers.get(userId);
    return userData ? userData.socketId : null;
  }

  emitToUser(userId, event, data) {
    const socketId = this.getUserSocket(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  emitToProject(projectId, event, data) {
    this.io.to(`project_${projectId}`).emit(event, data);
  }

  emitToTeam(teamId, event, data) {
    this.io.to(`team_${teamId}`).emit(event, data);
  }

  broadcastToAll(event, data) {
    this.io.emit(event, data);
  }
}

// Create singleton instance
const socketManager = new SocketManager();

// Initialize function for external use
const initializeSocket = (server) => {
  socketManager.initializeSocket(server);
};

module.exports = {
  initializeSocket,
  socketManager
};
