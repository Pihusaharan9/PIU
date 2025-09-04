const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to authenticate JWT token
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
        code: 'TOKEN_MISSING'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists and populate organization
    const user = await User.findById(decoded.userId).select('-password').populate('organization');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'User account is not active',
        code: 'USER_INACTIVE'
      });
    }

    // Check if user is locked
    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        message: 'User account is temporarily locked',
        code: 'USER_LOCKED'
      });
    }

    // Add user to request object
    req.user = user;
    req.token = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware to check if user has required role
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: roles,
        userRole: req.user.role
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is admin
 */
const requireAdmin = requireRole('admin');

/**
 * Middleware to check if user is manager or admin
 */
const requireManager = requireRole('admin', 'manager');

/**
 * Middleware to check if user is team lead, manager, or admin
 */
const requireTeamLead = requireRole('admin', 'manager', 'team_lead');

/**
 * Middleware to check if user owns the resource or has admin privileges
 */
const requireOwnershipOrAdmin = (resourceModel, resourceIdField = 'id') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // Admin can access everything
      if (req.user.role === 'admin') {
        return next();
      }

      const resourceId = req.params[resourceIdField];
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: 'Resource ID is required',
          code: 'RESOURCE_ID_MISSING'
        });
      }

      // Find the resource
      const resource = await resourceModel.findById(resourceId);
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found',
          code: 'RESOURCE_NOT_FOUND'
        });
      }

      // Check if user owns the resource
      const ownerField = resource.owner || resource.createdBy || resource.assignee;
      if (ownerField && ownerField.toString() === req.user._id.toString()) {
        return next();
      }

      // Check if user is manager and resource belongs to their team
      if (req.user.role === 'manager' && resource.team) {
        if (req.user.teams.includes(resource.team)) {
          return next();
        }
      }

      // Check if user is team lead and resource belongs to their team
      if (req.user.role === 'team_lead' && resource.team) {
        if (req.user.teams.includes(resource.team)) {
          return next();
        }
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied to this resource',
        code: 'ACCESS_DENIED'
      });

    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify resource ownership',
        code: 'OWNERSHIP_CHECK_ERROR'
      });
    }
  };
};

/**
 * Middleware to check if user is in the same team
 */
const requireTeamMember = (teamIdField = 'teamId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const teamId = req.params[teamIdField] || req.body.teamId;
      if (!teamId) {
        return res.status(400).json({
          success: false,
          message: 'Team ID is required',
          code: 'TEAM_ID_MISSING'
        });
      }

      // Admin can access any team
      if (req.user.role === 'admin') {
        return next();
      }

      // Check if user is in the team
      if (!req.user.teams.includes(teamId)) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this team',
          code: 'NOT_TEAM_MEMBER'
        });
      }

      next();
    } catch (error) {
      console.error('Team membership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify team membership',
        code: 'TEAM_CHECK_ERROR'
      });
    }
  };
};

/**
 * Middleware to check if user is in the same project
 */
const requireProjectMember = (projectIdField = 'projectId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const projectId = req.params[projectIdField] || req.body.projectId;
      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: 'Project ID is required',
          code: 'PROJECT_ID_MISSING'
        });
      }

      // Admin can access any project
      if (req.user.role === 'admin') {
        return next();
      }

      // Check if user is in the project
      if (!req.user.projects.includes(projectId)) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this project',
          code: 'NOT_PROJECT_MEMBER'
        });
      }

      next();
    } catch (error) {
      console.error('Project membership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify project membership',
        code: 'PROJECT_CHECK_ERROR'
      });
    }
  };
};

/**
 * Middleware to rate limit specific actions per user
 */
const rateLimitPerUser = (maxRequests, windowMs) => {
  const userRequests = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userId = req.user._id.toString();
    const now = Date.now();
    const userData = userRequests.get(userId);

    if (!userData) {
      userRequests.set(userId, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    if (now > userData.resetTime) {
      userRequests.set(userId, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    if (userData.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((userData.resetTime - now) / 1000)
      });
    }

    userData.count++;
    next();
  };
};

/**
 * Middleware to log user activity
 */
const logUserActivity = (action) => {
  return (req, res, next) => {
    if (req.user) {
      // Update user's last active timestamp
      req.user.stats.lastActive = new Date();
      req.user.save().catch(err => {
        console.error('Failed to update user activity:', err);
      });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireManager,
  requireTeamLead,
  requireOwnershipOrAdmin,
  requireTeamMember,
  requireProjectMember,
  rateLimitPerUser,
  logUserActivity
};
