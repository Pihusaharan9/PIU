const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true,
    maxlength: [100, 'Organization name cannot exceed 100 characters']
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['member', 'manager'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  settings: {
    allowMemberInvites: {
      type: Boolean,
      default: false
    },
    defaultMemberRole: {
      type: String,
      enum: ['member', 'manager'],
      default: 'member'
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for member count
organizationSchema.virtual('memberCount').get(function() {
  return this.members.length + 1; // +1 for admin
});

// Virtual for total users in organization
organizationSchema.virtual('totalUsers').get(function() {
  return this.members.length + 1; // +1 for admin
});

// Indexes for better query performance
organizationSchema.index({ admin: 1 });
organizationSchema.index({ 'members.user': 1 });
organizationSchema.index({ status: 1 });
organizationSchema.index({ name: 1 });

// Instance method to add member
organizationSchema.methods.addMember = function(userId, role = 'member') {
  // Check if user is already a member
  const existingMember = this.members.find(member => 
    member.user.toString() === userId.toString()
  );
  
  if (existingMember) {
    return Promise.resolve(this);
  }
  
  this.members.push({
    user: userId,
    role: role,
    joinedAt: new Date()
  });
  
  return this.save();
};

// Instance method to remove member
organizationSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(member => 
    member.user.toString() !== userId.toString()
  );
  return this.save();
};

// Instance method to update member role
organizationSchema.methods.updateMemberRole = function(userId, newRole) {
  const member = this.members.find(member => 
    member.user.toString() === userId.toString()
  );
  
  if (member) {
    member.role = newRole;
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Instance method to check if user is member
organizationSchema.methods.isMember = function(userId) {
  if (this.admin.toString() === userId.toString()) {
    return true;
  }
  
  return this.members.some(member => 
    member.user.toString() === userId.toString()
  );
};

// Instance method to get user role in organization
organizationSchema.methods.getUserRole = function(userId) {
  if (this.admin.toString() === userId.toString()) {
    return 'admin';
  }
  
  const member = this.members.find(member => 
    member.user.toString() === userId.toString()
  );
  
  return member ? member.role : null;
};

// Static method to find organizations by user
organizationSchema.statics.findByUser = function(userId) {
  return this.find({
    $or: [
      { admin: userId },
      { 'members.user': userId }
    ]
  }).populate('admin', 'username firstName lastName email avatar');
};

// Static method to find admin organizations
organizationSchema.statics.findByAdmin = function(adminId) {
  return this.find({ admin: adminId })
    .populate('admin', 'username firstName lastName email avatar')
    .populate('members.user', 'username firstName lastName email avatar');
};

// Static method to find member organizations
organizationSchema.statics.findByMember = function(userId) {
  return this.find({ 'members.user': userId })
    .populate('admin', 'username firstName lastName email avatar')
    .populate('members.user', 'username firstName lastName email avatar');
};

// Export the model
module.exports = mongoose.model('Organization', organizationSchema);
