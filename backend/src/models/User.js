const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic user information
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  
  // Role-based system
  role: {
    type: String,
    required: true,
    enum: ['systemAdmin', 'schoolAdmin', 'student', 'parent'],
    default: 'student'
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Student-specific fields (only for students)
  studentInfo: {
    studentId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    grade: {
      type: Number,
      min: 1,
      max: 12
    },
    section: {
      type: String,
      trim: true
    },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: function() { return this.role === 'student'; }
    }
  },
  
  // Parent-specific fields (only for parents)
  parentInfo: {
    relationship: {
      type: String,
      enum: ['father', 'mother', 'guardian', 'other']
    },
    children: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    emergencyContacts: [{
      name: String,
      relationship: String,
      phone: String,
      email: String
    }]
  },
  
  // Admin-specific fields (for systemAdmin and schoolAdmin)
  adminInfo: {
    permissions: [{
      type: String,
      enum: [
        // System Admin permissions
        'manage_system', 'manage_schools', 'manage_all_users', 'view_all_data',
        // School Admin permissions
        'manage_school_users', 'manage_students', 'manage_tracking', 'view_reports',
        'manage_buses', 'manage_schedules', 'manage_notifications'
      ]
    }],
    schoolId: {
      type: String,
      required: function() { return this.role === 'schoolAdmin'; }
    },
    schoolName: {
      type: String,
      required: function() { return this.role === 'schoolAdmin'; }
    },
    department: String,
    employeeId: String,
    accessLevel: {
      type: String,
      enum: ['full', 'limited', 'readonly'],
      default: 'full'
    }
  },
  
  // Bus and tracking information (for students)
  busInfo: {
    busNumber: String,
    pickupLocation: String,
    dropLocation: String,
    pickupTime: String,
    dropTime: String
  },
  
  // Tracking information (for students)
  trackingInfo: {
    status: {
      type: String,
      enum: ['active', 'inactive', 'tracking', 'emergency'],
      default: 'active'
    },
    location: {
      latitude: Number,
      longitude: Number,
      timestamp: Date,
      accuracy: Number,
      speed: Number,
      heading: Number
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    notes: String,
    emergencyAlert: {
      type: String,
      enum: ['medical', 'safety', 'transport', 'other'],
      message: String,
      location: {
        latitude: Number,
        longitude: Number
      },
      timestamp: Date
    }
  },
  
  // Common fields
  profilePicture: String,
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  emailVerificationToken: String,
  emailVerificationExpires: Date
}, {
  timestamps: true
});

// Indexes for better performance
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ 'studentInfo.studentId': 1 });
userSchema.index({ 'studentInfo.parentId': 1 });
userSchema.index({ 'parentInfo.children': 1 });
userSchema.index({ 'trackingInfo.status': 1 });
userSchema.index({ 'busInfo.busNumber': 1 });
userSchema.index({ 'adminInfo.schoolId': 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if account is locked
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Instance method to get public profile (without sensitive data)
userSchema.methods.toPublicJSON = function() {
  const user = this.toObject();
  
  // Remove sensitive fields
  delete user.password;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpires;
  delete user.emailVerificationToken;
  delete user.emailVerificationExpires;
  delete user.loginAttempts;
  delete user.lockUntil;
  
  return user;
};

// Static method to find users by role
userSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true });
};

// Static method to find students by parent
userSchema.statics.findStudentsByParent = function(parentId) {
  return this.find({
    role: 'student',
    'studentInfo.parentId': parentId,
    isActive: true
  });
};

// Static method to find parent by student
userSchema.statics.findParentByStudent = function(studentId) {
  return this.findOne({
    role: 'parent',
    'parentInfo.children': studentId,
    isActive: true
  });
};

// Static method to find school admins by school
userSchema.statics.findSchoolAdminsBySchool = function(schoolId) {
  return this.find({
    role: 'schoolAdmin',
    'adminInfo.schoolId': schoolId,
    isActive: true
  });
};

// Static method to find all admins (system and school)
userSchema.statics.findAllAdmins = function() {
  return this.find({
    role: { $in: ['systemAdmin', 'schoolAdmin'] },
    isActive: true
  });
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for display name based on role
userSchema.virtual('displayName').get(function() {
  if (this.role === 'student') {
    return `${this.firstName} ${this.lastName} (Student)`;
  } else if (this.role === 'parent') {
    return `${this.firstName} ${this.lastName} (Parent)`;
  } else if (this.role === 'schoolAdmin') {
    return `${this.firstName} ${this.lastName} (School Admin - ${this.adminInfo?.schoolName || 'Unknown School'})`;
  } else {
    return `${this.firstName} ${this.lastName} (System Admin)`;
  }
});

// Instance method to check if user has permission
userSchema.methods.hasPermission = function(permission) {
  if (this.role === 'systemAdmin') {
    return true; // System admins have all permissions
  }
  
  if (this.role === 'schoolAdmin' && this.adminInfo?.permissions) {
    return this.adminInfo.permissions.includes(permission);
  }
  
  return false;
};

// Instance method to check if user can access school data
userSchema.methods.canAccessSchool = function(schoolId) {
  if (this.role === 'systemAdmin') {
    return true; // System admins can access all schools
  }
  
  if (this.role === 'schoolAdmin') {
    return this.adminInfo?.schoolId === schoolId;
  }
  
  return false;
};

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema); 