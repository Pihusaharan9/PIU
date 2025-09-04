const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const aiService = require('../services/aiService');
const Task = require('../models/Task');
const User = require('../models/User');

const router = express.Router();

// POST /api/ai/prioritize - AI task prioritization
router.post('/prioritize', authenticateToken, async (req, res) => {
  try {
    
    const tasks = await Task.find({ 
      organization: req.user.organization
    }).populate('project', 'name').sort({ createdAt: -1 });
    
    console.log('📋 Task details:', tasks.map(t => ({
      id: t._id,
      title: t.title,
      project: t.project?.name || 'No Project',
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate
    })));

    if (tasks.length === 0) {
      return res.json({
        success: true,
        message: 'No tasks to prioritize',
        data: {
          priorityOrder: [],
          insights: {
            productivity: "Create some tasks to get AI-powered prioritization",
            recommendations: ["Start by creating your first task"]
          }
        }
      });
    }

    // Get user context for better AI analysis
    const userContext = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      preferences: req.body.preferences || {}
    };

    // Get AI prioritization
    const aiResult = await aiService.prioritizeTasks(tasks, userContext);

    res.json({
      success: true,
      message: 'Tasks prioritized successfully',
      data: aiResult.success ? aiResult.data : aiResult.fallback,
      aiPowered: aiResult.success,
      usage: aiResult.usage
    });

  } catch (error) {
    console.error('AI prioritization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to prioritize tasks',
      error: error.message
    });
  }
});

// POST /api/ai/suggestions - AI task suggestions
router.post('/suggestions', authenticateToken, async (req, res) => {
  try {
    // Get user's existing tasks
    const existingTasks = await Task.find({ 
      $or: [
        { assignee: req.user.id },
        { creator: req.user.id }
      ]
    }).limit(10).sort({ createdAt: -1 });

    // Get user context
    const userContext = {
      industry: req.body.industry || 'general',
      role: req.body.role || 'professional',
      goals: req.body.goals || [],
      workStyle: req.body.workStyle || 'balanced',
      currentFocus: req.body.currentFocus || 'productivity'
    };

    // Get AI suggestions
    const aiResult = await aiService.generateTaskSuggestions(userContext, existingTasks);

    res.json({
      success: true,
      message: 'Task suggestions generated successfully',
      data: aiResult.success ? aiResult.data : aiResult.fallback,
      aiPowered: aiResult.success
    });

  } catch (error) {
    console.error('AI suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate suggestions',
      error: error.message
    });
  }
});

// GET /api/ai/insights - AI productivity insights
router.get('/insights', authenticateToken, async (req, res) => {
  try {
    // Get user's task statistics - tasks assigned to or created by the user within their organization
    const tasks = await Task.find({ 
      organization: req.user.organization,  // Filter by organization first
      $or: [
        { assignee: req.user.id },
        { createdBy: req.user.id }  // Use 'createdBy' not 'creator'
      ]
    }).populate('project', 'name').sort({ createdAt: -1 });

    const stats = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      pending: tasks.filter(t => t.status === 'todo').length,
      productivity: 0
    };

    if (stats.total > 0) {
      stats.productivity = Math.round((stats.completed / stats.total) * 100);
    }

    // Get recent task history (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentTasks = tasks.filter(task => 
      new Date(task.createdAt) >= thirtyDaysAgo
    );

    // Get AI analysis
    const aiResult = await aiService.analyzeProductivity(stats, recentTasks);

    res.json({
      success: true,
      message: 'Productivity insights generated successfully',
      data: aiResult.success ? aiResult.data : aiResult.fallback,
      stats: stats,
      aiPowered: aiResult.success
    });

  } catch (error) {
    console.error('AI insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate insights',
      error: error.message
    });
  }
});

// POST /api/ai/optimize-task - AI task optimization
router.post('/optimize-task', 
  authenticateToken,
  [
    body('title').trim().notEmpty().withMessage('Task title is required'),
    body('description').optional().trim()
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { title, description } = req.body;

      // Get AI optimization
      const aiResult = await aiService.optimizeTaskDescription(title, description);

      if (!aiResult.success && !aiResult.fallback) {
        return res.status(500).json({
          success: false,
          message: 'Failed to optimize task',
          error: aiResult.error
        });
      }

      // Use fallback if AI is not available
      const resultData = aiResult.success ? aiResult.data : aiResult.fallback;

      res.json({
        success: true,
        message: aiResult.success ? 'Task optimized successfully with AI' : 'Task optimized with fallback methods',
        data: resultData,
        aiPowered: aiResult.success
      });

    } catch (error) {
      console.error('AI task optimization error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to optimize task',
        error: error.message
      });
    }
  }
);

// POST /api/ai/smart-schedule - AI scheduling suggestions
router.post('/smart-schedule', authenticateToken, async (req, res) => {
  try {
    // Get user's pending and in-progress tasks
    const tasks = await Task.find({ 
      $or: [
        { assignee: req.user.id },
        { creator: req.user.id }
      ],
      status: { $in: ['pending', 'in_progress'] }
    }).sort({ priority: -1, dueDate: 1 });

    if (tasks.length === 0) {
      return res.json({
        success: true,
        message: 'No tasks to schedule',
        data: {
          schedule: [],
          recommendations: ["Create some tasks to get AI-powered scheduling suggestions"]
        }
      });
    }

    // Simple scheduling algorithm (can be enhanced with AI)
    const schedule = tasks.map((task, index) => ({
      taskId: task._id,
      title: task.title,
      suggestedTimeSlot: {
        start: new Date(Date.now() + (index * 2 * 60 * 60 * 1000)), // 2 hours apart
        duration: task.estimatedHours || 1
      },
      priority: task.priority,
      reasoning: `Scheduled based on ${task.priority} priority and due date`
    }));

    res.json({
      success: true,
      message: 'Smart schedule generated successfully',
      data: {
        schedule: schedule,
        recommendations: [
          "Start with high-priority tasks",
          "Take breaks between tasks",
          "Adjust timing based on your energy levels"
        ],
        totalEstimatedHours: tasks.reduce((sum, task) => sum + (task.estimatedHours || 1), 0)
      },
      aiPowered: false // This could be enhanced with real AI scheduling
    });

  } catch (error) {
    console.error('AI scheduling error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate schedule',
      error: error.message
    });
  }
});

module.exports = router;
