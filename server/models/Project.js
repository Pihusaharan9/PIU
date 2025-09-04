const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  status: {
    type: String,
    enum: ['planning', 'active', 'on_hold', 'completed'],
    default: 'planning'
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization is required'],
    index: true
  },
  
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Project owner is required'],
    index: true
  },
  
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  tasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  
  startDate: {
    type: Date,
    default: Date.now
  },
  
  deadline: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value > new Date();
      },
      message: 'Deadline must be in the future'
    }
  },
  
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  
  budget: {
    type: Number,
    min: [0, 'Budget cannot be negative']
  },
  
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  settings: {
    isPublic: {
      type: Boolean,
      default: false
    },
    allowGuestView: {
      type: Boolean,
      default: false
    },
    notifications: {
      emailUpdates: {
        type: Boolean,
        default: true
      },
      taskAssignments: {
        type: Boolean,
        default: true
      },
      deadlineReminders: {
        type: Boolean,
        default: true
      }
    }
  },
  
  metadata: {
    totalTasks: {
      type: Number,
      default: 0
    },
    completedTasks: {
      type: Number,
      default: 0
    },
    totalMembers: {
      type: Number,
      default: 1
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
projectSchema.index({ owner: 1, status: 1 });
projectSchema.index({ members: 1, status: 1 });
projectSchema.index({ deadline: 1 });
projectSchema.index({ 'metadata.lastActivity': -1 });

// Virtual for completion percentage
projectSchema.virtual('completionPercentage').get(function() {
  if (this.metadata.totalTasks === 0) return 0;
  return Math.round((this.metadata.completedTasks / this.metadata.totalTasks) * 100);
});

// Virtual for days until deadline
projectSchema.virtual('daysUntilDeadline').get(function() {
  if (!this.deadline) return null;
  const today = new Date();
  const deadline = new Date(this.deadline);
  const timeDiff = deadline.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

// Virtual for overdue status
projectSchema.virtual('isOverdue').get(function() {
  if (!this.deadline) return false;
  return new Date() > new Date(this.deadline) && this.status !== 'completed';
});

// Pre-save middleware to update metadata
projectSchema.pre('save', function(next) {
  if (this.members) {
    this.metadata.totalMembers = this.members.length;
  }
  this.metadata.lastActivity = new Date();
  next();
});

// Instance methods
projectSchema.methods.addMember = function(userId) {
  if (!this.members.includes(userId)) {
    this.members.push(userId);
    this.metadata.totalMembers = this.members.length;
  }
  return this.save();
};

projectSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(member => !member.equals(userId));
  this.metadata.totalMembers = this.members.length;
  return this.save();
};

projectSchema.methods.updateProgress = function() {
  if (this.metadata.totalTasks > 0) {
    this.progress = Math.round((this.metadata.completedTasks / this.metadata.totalTasks) * 100);
  } else {
    this.progress = 0;
  }
  return this.save();
};

// Static methods
projectSchema.statics.findByOwner = function(ownerId, status = null) {
  const query = { owner: ownerId };
  if (status) query.status = status;
  return this.find(query).populate('members', 'username firstName lastName email');
};

projectSchema.statics.findByMember = function(userId, status = null) {
  const query = { members: userId };
  if (status) query.status = status;
  return this.find(query).populate('owner members', 'username firstName lastName email');
};

projectSchema.statics.findOverdue = function() {
  return this.find({
    deadline: { $lt: new Date() },
    status: { $ne: 'completed' }
  }).populate('owner members', 'username firstName lastName email');
};

// Update lastActivity on any update operation
projectSchema.post(['findOneAndUpdate', 'updateOne', 'updateMany'], function() {
  this.set({ 'metadata.lastActivity': new Date() });
});

module.exports = mongoose.model('Project', projectSchema);
