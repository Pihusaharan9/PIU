const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const { authenticateToken } = require('../middleware/auth');
const { socketManager } = require('../config/socket');

const router = express.Router();

// Validation rules for project creation
const createProjectValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Project name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('status')
    .optional()
    .isIn(['planning', 'active', 'on_hold', 'completed'])
    .withMessage('Status must be planning, active, on_hold, or completed'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid date')
];

// GET /api/projects - Get all projects in the organization
router.get('/', authenticateToken, async (req, res) => {
  try {
    const projects = await Project.find({ 
      organization: req.user.organization
    })
    .populate('owner', 'username firstName lastName')
    .populate('members', 'username firstName lastName')
    .populate('tasks', '_id title status priority')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Projects retrieved successfully',
      data: projects
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects'
    });
  }
});

// POST /api/projects - Create a new project
router.post('/', authenticateToken, createProjectValidation, async (req, res) => {
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

    const { name, description, status, priority, deadline } = req.body;

    // Create new project
    const project = new Project({
      name,
      description,
      status: status || 'planning',
      priority: priority || 'medium',
      deadline,
      owner: req.user.id,
      members: [req.user.id], // Add creator as member
      organization: req.user.organization // Add organization from user
    });

    await project.save();

    // Populate the project before sending response
    await project.populate('owner', 'username firstName lastName');
    await project.populate('members', 'username firstName lastName');

    // Emit real-time event for project creation
    socketManager.emitToUser(req.user.id, 'projectCreated', project);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project'
    });
  }
});

// PUT /api/projects/:id - Update a project
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Find project and verify ownership/membership within organization
    const project = await Project.findOne({
      _id: id,
      organization: req.user.organization,
      $or: [
        { owner: req.user.id },
        { members: req.user.id }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or you do not have permission to update it'
      });
    }

    // Update the project
    Object.assign(project, updates);
    await project.save();

    // Populate the project before sending response
    await project.populate('owner', 'username firstName lastName');
    await project.populate('members', 'username firstName lastName');

    // Emit real-time event for project update
    project.members.forEach(member => {
      socketManager.emitToUser(member._id, 'projectUpdated', project);
    });

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: project
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project'
    });
  }
});

// DELETE /api/projects/:id - Delete a project
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Find project and verify ownership within organization
    const project = await Project.findOne({
      _id: id,
      organization: req.user.organization,
      owner: req.user.id // Only owner can delete
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or you do not have permission to delete it'
      });
    }

    // Store member IDs before deleting
    const memberIds = project.members || [];

    await Project.findByIdAndDelete(id);

    // Emit real-time event for project deletion
    memberIds.forEach(memberId => {
      socketManager.emitToUser(memberId, 'projectDeleted', id);
    });

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project'
    });
  }
});

module.exports = router;
