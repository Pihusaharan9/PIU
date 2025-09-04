const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const { authenticateToken } = require('../middleware/auth');
const { socketManager } = require('../config/socket');

const router = express.Router();

// Validation rules for task creation
const createTaskValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('priority')
    .isIn(['low', 'medium', 'high', 'urgent', 'critical'])
    .withMessage('Priority must be low, medium, high, urgent, or critical'),
  body('status')
    .isIn(['todo', 'in_progress', 'review', 'testing', 'completed', 'cancelled'])
    .withMessage('Status must be todo, in_progress, review, testing, completed, or cancelled'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('estimatedHours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated hours must be a positive number'),
  body('project')
    .optional()
    .isMongoId()
    .withMessage('Project must be a valid MongoDB ObjectId')
];

// GET /api/tasks - Get all tasks in the organization
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Fetching all tasks for organization:', req.user.organization);
    
    const tasks = await Task.find({ 
      organization: req.user.organization
    })
    .populate('assignee', 'username firstName lastName')
    .populate('createdBy', 'username firstName lastName')
    .populate('project', 'name')
    .sort({ createdAt: -1 });

    console.log('📋 Found tasks:', tasks.length);

    res.json({
      success: true,
      message: 'Tasks retrieved successfully',
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks'
    });
  }
});

// GET /api/tasks/my-tasks - Get only tasks assigned TO the current user
router.get('/my-tasks', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Fetching MY TASKS for user:', req.user._id);
    console.log('🔍 User object:', req.user);
    console.log('🔍 User ID type:', typeof req.user._id);
    console.log('🔍 User ID value:', req.user._id);
    
    const tasks = await Task.find({ 
      organization: req.user.organization,
      assignee: req.user._id // Only tasks assigned TO this user
    })
    .populate('assignee', 'username firstName lastName')
    .populate('createdBy', 'username firstName lastName')
    .populate('project', 'name')
    .sort({ createdAt: -1 });

    console.log('📋 Found my tasks:', tasks.length);
    console.log('📋 Tasks found:', tasks.map(t => ({ id: t._id, title: t.title, assignee: t.assignee })));

    res.json({
      success: true,
      message: 'My tasks retrieved successfully',
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching my tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch my tasks'
    });
  }
});

// POST /api/tasks - Create a new task
router.post('/', authenticateToken, createTaskValidation, async (req, res) => {
  try {
    console.log('🚀 Creating new task with data:', req.body);
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation failed:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, description, priority, status, dueDate, estimatedHours, tags, project, assignee } = req.body;
    console.log('📝 Extracted task data:', { title, description, priority, status, dueDate, estimatedHours, tags, project });
    console.log('👤 User ID from token:', req.user._id);
    console.log('👤 User object:', req.user);

    // Create new task
    const task = new Task({
      title,
      description,
      priority,
      status: status || 'todo', // Use 'todo' as default
      dueDate,
      estimatedHours,
      tags: tags || [],
      createdBy: req.user._id, // Match the model field name
      assignee: assignee || req.user._id, // Use form assignee or default to creator
      project: project || null, // Use extracted project field
      organization: req.user.organization // Add organization from user
    });

    console.log('📋 Task object created:', task);
    console.log('🔍 Task project field before save:', task.project);
    console.log('🔍 Task project field type before save:', typeof task.project);
    
    await task.save();
    console.log('💾 Task saved to database with ID:', task._id);
    
    // Fetch the saved task to verify project field
    const savedTask = await Task.findById(task._id);
    console.log('🔍 Saved task project field:', savedTask.project);
    console.log('🔍 Saved task project field type:', typeof savedTask.project);

    // Update project's tasks array if project is specified
    if (task.project) {
      try {
        const Project = require('../models/Project');
        await Project.findByIdAndUpdate(
          task.project,
          { $addToSet: { tasks: task._id } }
        );
        console.log('✅ Project tasks array updated for project:', task.project);
      } catch (error) {
        console.error('❌ Failed to update project tasks array:', error);
      }
    }

    // Populate the task before sending response
    await task.populate('assignee', 'username firstName lastName');
    await task.populate('createdBy', 'username firstName lastName');

    // Emit real-time event for task creation
    socketManager.emitToUser(task.assignee._id, 'taskCreated', task);
    if (task.createdBy._id.toString() !== task.assignee._id.toString()) {
      socketManager.emitToUser(task.createdBy._id, 'taskCreated', task);
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create task'
    });
  }
});

// PUT /api/tasks/:id - Update a task
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    console.log('🔄 Updating task:', id);
    console.log('📝 Updates:', updates);
    console.log('👤 User:', req.user._id);

    // Find task within organization (any member can update)
    const task = await Task.findOne({
      _id: id,
      organization: req.user.organization
    });

    if (!task) {
      console.log('❌ Task not found in organization');
      return res.status(404).json({
        success: false,
        message: 'Task not found in your organization'
      });
    }

    console.log('✅ Task found:', task.title);

    // Store the old project ID before updating
    const oldProjectId = task.project;

    // Update the task
    Object.assign(task, updates);
    await task.save();

    console.log('✅ Task saved successfully');

    // Handle project changes
    if (oldProjectId && oldProjectId.toString() !== task.project?.toString()) {
      // Remove task from old project
      try {
        const Project = require('../models/Project');
        await Project.findByIdAndUpdate(
          oldProjectId,
          { $pull: { tasks: task._id } }
        );
        console.log('✅ Task removed from old project:', oldProjectId);
      } catch (error) {
        console.error('❌ Failed to remove task from old project:', error);
      }
    }

    if (task.project && (!oldProjectId || oldProjectId.toString() !== task.project.toString())) {
      // Add task to new project
      try {
        const Project = require('../models/Project');
        await Project.findByIdAndUpdate(
          task.project,
          { $addToSet: { tasks: task._id } }
        );
        console.log('✅ Task added to new project:', task.project);
      } catch (error) {
        console.error('❌ Failed to add task to new project:', error);
      }
    }

    // Populate the task before sending response
    await task.populate('assignee', 'username firstName lastName');
    await task.populate('createdBy', 'username firstName lastName');

    console.log('✅ Task populated successfully');

    // Emit real-time event for task update (with error handling)
    try {
      if (task.assignee && task.assignee._id) {
        socketManager.emitToUser(task.assignee._id, 'taskUpdated', task);
        console.log('✅ Emitted to assignee:', task.assignee._id);
      }
      if (task.createdBy && task.createdBy._id && task.createdBy._id.toString() !== task.assignee?._id?.toString()) {
        socketManager.emitToUser(task.createdBy._id, 'taskUpdated', task);
        console.log('✅ Emitted to creator:', task.createdBy._id);
      }
    } catch (socketError) {
      console.error('❌ Socket emission error:', socketError);
      // Don't fail the request if socket emission fails
    }

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task'
    });
  }
});

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Find task within organization (any member can delete)
    const task = await Task.findOne({
      _id: id,
      organization: req.user.organization
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found in your organization'
      });
    }

    // Store assignee and creator IDs before deleting
    const assigneeId = task.assignee._id || task.assignee;
    const creatorId = task.createdBy._id || task.createdBy;

    // Remove task from project's tasks array if project is specified
    if (task.project) {
      try {
        const Project = require('../models/Project');
        await Project.findByIdAndUpdate(
          task.project,
          { $pull: { tasks: task._id } }
        );
        console.log('✅ Task removed from project tasks array for project:', task.project);
      } catch (error) {
        console.error('❌ Failed to remove task from project tasks array:', error);
      }
    }

    await Task.findByIdAndDelete(id);

    // Emit real-time event for task deletion
    socketManager.emitToUser(assigneeId, 'taskDeleted', id);
    if (creatorId.toString() !== assigneeId.toString()) {
      socketManager.emitToUser(creatorId, 'taskDeleted', id);
    }

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task'
    });
  }
});

// GET /api/tasks/stats - Get task statistics for authenticated user
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const stats = await Task.aggregate([
      {
        $match: {
          $or: [
            { assignee: userId },
            { createdBy: userId }
          ]
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
          },
          todo: {
            $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || { total: 0, completed: 0, inProgress: 0, todo: 0 };
    result.productivity = result.total > 0 ? Math.round((result.completed / result.total) * 100) : 0;

    res.json({
      success: true,
      message: 'Task statistics retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Error fetching task stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task statistics'
    });
  }
});

module.exports = router;
