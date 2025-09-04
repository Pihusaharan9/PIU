const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization is required'],
    index: true
  },
  
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Task title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Task description cannot exceed 2000 characters']
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: false // Make project optional
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assignee is required']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'review', 'testing', 'completed', 'cancelled'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent', 'critical'],
    default: 'medium'
  },
  priorityScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  type: {
    type: String,
    enum: ['feature', 'bug', 'improvement', 'documentation', 'research', 'testing'],
    default: 'feature'
  },
  estimatedHours: {
    type: Number,
    min: 0,
    max: 1000
  },
  actualHours: {
    type: Number,
    min: 0,
    max: 1000
  },
  dueDate: {
    type: Date
  },
  startDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  subtasks: [{
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Subtask title cannot exceed 200 characters']
    },
    description: String,
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'completed'],
      default: 'todo'
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    estimatedHours: Number,
    actualHours: Number,
    completedDate: Date
  }],
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    attachments: [{
      filename: String,
      originalName: String,
      mimeType: String,
      size: Number,
      url: String
    }]
  }],
  timeLogs: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: Date,
    duration: Number, // in minutes
    description: String,
    isActive: {
      type: Boolean,
      default: false
    }
  }],
  aiOptimization: {
    lastOptimized: Date,
    optimizationHistory: [{
      type: {
        type: String,
        enum: ['priority', 'scheduling', 'estimation', 'workload_balance']
      },
      previousValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed,
      reasoning: String,
      optimizedAt: {
        type: Date,
        default: Date.now
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1
      }
    }],
    suggestions: [{
      type: {
        type: String,
        enum: ['priority_change', 'deadline_adjustment', 'resource_reallocation', 'dependency_optimization']
      },
      description: String,
      impact: {
        type: String,
        enum: ['low', 'medium', 'high']
      },
      confidence: Number,
      suggestedAt: Date
    }]
  },
  metrics: {
    complexity: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    },
    risk: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    },
    businessValue: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    },
    effort: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    },
    urgency: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    }
  },
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: Date,
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for progress percentage
taskSchema.virtual('progress').get(function() {
  if (!this.subtasks || this.subtasks.length === 0) {
    return this.status === 'completed' ? 100 : 0;
  }
  
  const completedSubtasks = this.subtasks.filter(subtask => subtask && subtask.status === 'completed').length;
  return Math.round((completedSubtasks / this.subtasks.length) * 100);
});

// Virtual for time efficiency
taskSchema.virtual('timeEfficiency').get(function() {
  if (!this.estimatedHours || !this.actualHours || this.estimatedHours === 0) return null;
  return Math.round(((this.estimatedHours - this.actualHours) / this.estimatedHours) * 100);
});

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'completed') return false;
  const due = new Date(this.dueDate);
  if (isNaN(due.getTime())) return false; // Check if dueDate is valid
  return new Date() > due;
});

// Virtual for days until due
taskSchema.virtual('daysUntilDue').get(function() {
  if (!this.dueDate) return null;
  const now = new Date();
  const due = new Date(this.dueDate);
  if (isNaN(due.getTime())) return null; // Check if dueDate is valid
  const diffTime = due - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for total time logged
taskSchema.virtual('totalTimeLogged').get(function() {
  if (!this.timeLogs || this.timeLogs.length === 0) {
    return 0;
  }
  
  return this.timeLogs.reduce((total, log) => {
    if (log && log.duration && typeof log.duration === 'number') {
      return total + log.duration;
    }
    return total;
  }, 0);
});

// Indexes for better query performance
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignee: 1, status: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ priority: 1, priorityScore: -1 });
taskSchema.index({ 'aiOptimization.lastOptimized': -1 });
taskSchema.index({ tags: 1 });
taskSchema.index({ isArchived: 1 });

// Pre-save middleware to update priority score
taskSchema.pre('save', function(next) {
  if (this.isModified('priority') || this.isModified('metrics')) {
    this.calculatePriorityScore();
  }
  
  if (this.isModified('status') && this.status === 'completed' && !this.completedDate) {
    this.completedDate = new Date();
  }
  
  next();
});

// Pre-save middleware to update time logs
taskSchema.pre('save', function(next) {
  if (this.timeLogs && this.timeLogs.length > 0) {
    this.timeLogs.forEach(log => {
      if (log.startTime && log.endTime && !log.duration) {
        log.duration = Math.round((log.endTime - log.startTime) / (1000 * 60));
      }
    });
  }
  next();
});

// Instance method to calculate priority score
taskSchema.methods.calculatePriorityScore = function() {
  const weights = {
    priority: 0.3,
    complexity: 0.15,
    risk: 0.15,
    businessValue: 0.2,
    effort: 0.1,
    urgency: 0.1
  };

  const priorityValues = {
    'low': 20,
    'medium': 40,
    'high': 60,
    'urgent': 80,
    'critical': 100
  };

  const priorityScore = priorityValues[this.priority] || 40;
  
  // Ensure metrics exist with default values
  const metrics = this.metrics || {};
  
  this.priorityScore = Math.round(
    (priorityScore * weights.priority) +
    ((metrics.complexity || 0) * 10 * weights.complexity) +
    ((metrics.risk || 0) * 10 * weights.risk) +
    ((metrics.businessValue || 0) * 10 * weights.businessValue) +
    ((metrics.effort || 0) * 10 * weights.effort) +
    ((metrics.urgency || 0) * 10 * weights.urgency)
  );

  return this.priorityScore;
};

// Instance method to add time log
taskSchema.methods.addTimeLog = function(userId, startTime, description = '') {
  if (!this.timeLogs) {
    this.timeLogs = [];
  }
  
  if (!userId || !startTime) {
    throw new Error('UserId and startTime are required');
  }
  
  this.timeLogs.push({
    user: userId,
    startTime,
    description: description || '',
    isActive: true
  });
  return this.save();
};

// Instance method to stop time log
taskSchema.methods.stopTimeLog = function(userId) {
  if (!this.timeLogs || this.timeLogs.length === 0) {
    return this.save();
  }
  
  const activeLog = this.timeLogs.find(log => 
    log && log.user && log.user.toString() === userId.toString() && log.isActive
  );
  
  if (activeLog) {
    activeLog.endTime = new Date();
    activeLog.isActive = false;
    if (activeLog.startTime) {
      activeLog.duration = Math.round((activeLog.endTime - activeLog.startTime) / (1000 * 60));
    }
  }
  
  return this.save();
};

// Instance method to add comment
taskSchema.methods.addComment = function(userId, content, attachments = []) {
  if (!this.comments) {
    this.comments = [];
  }
  
  if (!content || !userId) {
    throw new Error('Content and userId are required');
  }
  
  this.comments.push({
    content,
    author: userId,
    attachments: attachments || []
  });
  return this.save();
};

// Instance method to add subtask
taskSchema.methods.addSubtask = function(subtaskData) {
  if (!this.subtasks) {
    this.subtasks = [];
  }
  
  if (!subtaskData || !subtaskData.title) {
    throw new Error('Subtask data with title is required');
  }
  
  this.subtasks.push(subtaskData);
  return this.save();
};

// Instance method to update subtask
taskSchema.methods.updateSubtask = function(subtaskId, updates) {
  if (!this.subtasks || this.subtasks.length === 0) {
    return this.save();
  }
  
  const subtask = this.subtasks.id(subtaskId);
  if (subtask && updates) {
    Object.assign(subtask, updates);
    if (updates.status === 'completed' && !subtask.completedDate) {
      subtask.completedDate = new Date();
    }
  }
  return this.save();
};

// Instance method to archive task
taskSchema.methods.archive = function(userId) {
  if (!userId) {
    throw new Error('UserId is required for archiving');
  }
  
  this.isArchived = true;
  this.archivedAt = new Date();
  this.archivedBy = userId;
  return this.save();
};

// Instance method to unarchive task
taskSchema.methods.unarchive = function() {
  this.isArchived = false;
  this.archivedAt = undefined;
  this.archivedBy = undefined;
  return this.save();
};

// Static method to find overdue tasks
taskSchema.statics.findOverdue = function() {
  return this.find({
    dueDate: { $lt: new Date(), $exists: true, $ne: null },
    status: { $ne: 'completed' },
    isArchived: false
  });
};

// Static method to find high priority tasks
taskSchema.statics.findHighPriority = function() {
  return this.find({
    priority: { $in: ['high', 'urgent', 'critical'] },
    status: { $ne: 'completed' },
    isArchived: false
  }).sort({ priorityScore: -1 });
};

// Static method to get task statistics
taskSchema.statics.getTaskStats = function(projectId = null) {
  const match = { isArchived: false };
  if (projectId) match.project = projectId;

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalTasks: { $sum: 1 },
        completedTasks: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        inProgressTasks: {
          $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
        },
        overdueTasks: {
          $sum: {
            $cond: [
              { $and: [
                { $lt: ['$dueDate', new Date()] },
                { $ne: ['$status', 'completed'] },
                { $exists: ['$dueDate', true] },
                { $ne: ['$dueDate', null] }
              ]},
              1,
              0
            ]
          }
        },
        avgPriorityScore: { $avg: { $ifNull: ['$priorityScore', 0] } },
        totalEstimatedHours: { $sum: { $ifNull: ['$estimatedHours', 0] } },
        totalActualHours: { $sum: { $ifNull: ['$actualHours', 0] } }
      }
    }
  ]);
};

// Export the model
module.exports = mongoose.model('Task', taskSchema);
