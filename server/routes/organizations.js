const express = require('express');
const { body, validationResult } = require('express-validator');
const Organization = require('../models/Organization');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/organizations
 * @desc    Get all organizations for current user (as admin or member)
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const organizations = await Organization.findByUser(req.user._id);
    
    res.json({
      success: true,
      data: { organizations }
    });

  } catch (error) {
    console.error('Get organizations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get organizations',
      code: 'ORGANIZATIONS_ERROR'
    });
  }
});

/**
 * @route   GET /api/organizations/:id
 * @desc    Get specific organization details
 * @access  Private (Admin or member of organization)
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id)
      .populate('admin', 'username firstName lastName email avatar')
      .populate('members.user', 'username firstName lastName email avatar role');

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
        code: 'ORGANIZATION_NOT_FOUND'
      });
    }

    // Check if user has access to this organization
    if (!organization.isMember(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this organization',
        code: 'ACCESS_DENIED'
      });
    }

    res.json({
      success: true,
      data: { organization }
    });

  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get organization',
      code: 'ORGANIZATION_ERROR'
    });
  }
});

/**
 * @route   PUT /api/organizations/:id
 * @desc    Update organization details (Admin only)
 * @access  Private (Admin only)
 */
router.put('/:id', authenticateToken, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Organization name cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('settings.allowMemberInvites')
    .optional()
    .isBoolean()
    .withMessage('allowMemberInvites must be a boolean'),
  body('settings.defaultMemberRole')
    .optional()
    .isIn(['member', 'manager'])
    .withMessage('Invalid default member role')
], async (req, res) => {
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

    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
        code: 'ORGANIZATION_NOT_FOUND'
      });
    }

    // Check if user is admin of this organization
    if (organization.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only organization admin can update details',
        code: 'ADMIN_REQUIRED'
      });
    }

    // Update organization
    const updates = req.body;
    const allowedUpdates = ['name', 'description', 'settings'];
    
    // Filter out non-allowed updates
    Object.keys(updates).forEach(key => {
      if (!allowedUpdates.includes(key)) {
        delete updates[key];
      }
    });

    const updatedOrganization = await Organization.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('admin', 'username firstName lastName email avatar')
     .populate('members.user', 'username firstName lastName email avatar role');

    res.json({
      success: true,
      message: 'Organization updated successfully',
      data: { organization: updatedOrganization }
    });

  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update organization',
      code: 'UPDATE_ERROR'
    });
  }
});

/**
 * @route   DELETE /api/organizations/:id
 * @desc    Delete organization (Admin only)
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
        code: 'ORGANIZATION_NOT_FOUND'
      });
    }

    // Check if user is admin of this organization
    if (organization.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only organization admin can delete organization',
        code: 'ADMIN_REQUIRED'
      });
    }

    // Remove organization reference from all members
    await User.updateMany(
      { organization: organization._id },
      { $unset: { organization: 1 } }
    );

    // Delete the organization
    await Organization.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Organization deleted successfully'
    });

  } catch (error) {
    console.error('Delete organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete organization',
      code: 'DELETE_ERROR'
    });
  }
});

/**
 * @route   POST /api/organizations/:id/remove-member
 * @desc    Remove member from organization (Admin only)
 * @access  Private (Admin only)
 */
router.post('/:id/remove-member', authenticateToken, [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
], async (req, res) => {
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

    const { userId } = req.body;
    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
        code: 'ORGANIZATION_NOT_FOUND'
      });
    }

    // Check if user is admin of this organization
    if (organization.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only organization admin can remove members',
        code: 'ADMIN_REQUIRED'
      });
    }

    // Check if trying to remove admin
    if (organization.admin.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove organization admin',
        code: 'CANNOT_REMOVE_ADMIN'
      });
    }

    // Remove member from organization
    await organization.removeMember(userId);

    // Remove organization reference from user
    await User.findByIdAndUpdate(userId, { $unset: { organization: 1 } });

    res.json({
      success: true,
      message: 'Member removed successfully'
    });

  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove member',
      code: 'REMOVE_MEMBER_ERROR'
    });
  }
});

/**
 * @route   POST /api/organizations/:id/update-member-role
 * @desc    Update member role in organization (Admin only)
 * @access  Private (Admin only)
 */
router.post('/:id/update-member-role', authenticateToken, [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required'),
  body('role')
    .isIn(['member', 'manager'])
    .withMessage('Invalid role')
], async (req, res) => {
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

    const { userId, role } = req.body;
    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
        code: 'ORGANIZATION_NOT_FOUND'
      });
    }

    // Check if user is admin of this organization
    if (organization.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only organization admin can update member roles',
        code: 'ADMIN_REQUIRED'
      });
    }

    // Update member role
    await organization.updateMemberRole(userId, role);

    res.json({
      success: true,
      message: 'Member role updated successfully'
    });

  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update member role',
      code: 'UPDATE_ROLE_ERROR'
    });
  }
});

module.exports = router;
