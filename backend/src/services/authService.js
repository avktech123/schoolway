const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthService {
  // Generate JWT token
  static generateToken(userId, userType) {
    return jwt.sign(
      { userId, userType },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  // User Sign Up (for any role)
  static async userSignup(userData) {
    const { username, email, password, firstName, lastName, phone, role } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    // Validate role-specific requirements
    if (role === 'student') {
      if (!userData.studentInfo || !userData.studentInfo.parentId) {
        throw new Error('Student must have parent information');
      }
    }

    if (role === 'parent') {
      if (!userData.parentInfo || !userData.parentInfo.relationship) {
        throw new Error('Parent must have relationship information');
      }
    }

    if (role === 'schoolAdmin') {
      if (!userData.adminInfo || !userData.adminInfo.schoolId || !userData.adminInfo.schoolName) {
        throw new Error('School admin must have school information');
      }
    }

    if (role === 'systemAdmin') {
      // Only allow system admin creation if no other system admin exists
      const existingSystemAdmin = await User.findOne({ role: 'systemAdmin', isActive: true });
      if (existingSystemAdmin) {
        throw new Error('System admin already exists');
      }
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      phone,
      role: role || 'student',
      ...userData
    });

    await user.save();

    // Generate token
    const token = this.generateToken(user._id, user.role);

    return {
      user: user.toPublicJSON(),
      token
    };
  }

  // User Sign In
  static async userSignin(credentials) {
    const { username, password } = credentials;

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username }]
    });

    if (!user || !user.isActive) {
      throw new Error('Invalid credentials or account inactive');
    }

    // Check if account is locked
    if (user.isLocked()) {
      throw new Error('Account is temporarily locked due to multiple failed login attempts');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment login attempts
      await user.incLoginAttempts();
      throw new Error('Invalid credentials');
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = this.generateToken(user._id, user.role);

    return {
      user: user.toPublicJSON(),
      token
    };
  }

  // Get user profile
  static async getUserProfile(userId, userType) {
    let user;
    
    if (userType === 'student') {
      user = await User.findById(userId).populate('studentInfo.parentId');
    } else if (userType === 'parent') {
      user = await User.findById(userId).populate('parentInfo.children');
    } else {
      user = await User.findById(userId);
    }

    if (!user) {
      throw new Error('User not found');
    }

    return {
      user: user.toPublicJSON(),
      userType
    };
  }

  // Change password
  static async changePassword(user, currentPassword, newPassword) {
    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return true;
  }

  // Reset password
  static async resetPassword(email) {
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      throw new Error('User not found');
    }

    // Generate reset token
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    return {
      resetToken,
      email: user.email
    };
  }

  // Confirm password reset
  static async confirmPasswordReset(token, newPassword) {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    // Update password and clear reset token
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return true;
  }

  // Verify email
  static async verifyEmail(token) {
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    return true;
  }

  // Lock/unlock user account
  static async toggleUserLock(userId, lock = true) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (lock) {
      user.lockUntil = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    } else {
      user.lockUntil = undefined;
      user.loginAttempts = 0;
    }

    await user.save();

    return user.toPublicJSON();
  }

  // Get users by role
  static async getUsersByRole(role, filters = {}) {
    const query = { role, isActive: true };
    
    // Apply additional filters
    if (filters.search) {
      query.$or = [
        { firstName: { $regex: filters.search, $options: 'i' } },
        { lastName: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } }
      ];
    }

    // School-specific filter for school admins
    if (filters.schoolId && role === 'schoolAdmin') {
      query['adminInfo.schoolId'] = filters.schoolId;
    }

    const users = await User.find(query).select('-password');
    return users;
  }

  // Update user role
  static async updateUserRole(userId, newRole, currentUser) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check permissions
    if (currentUser.role === 'schoolAdmin') {
      // School admins can only manage users within their school
      if (newRole === 'systemAdmin') {
        throw new Error('School admins cannot create system admins');
      }
      if (newRole === 'schoolAdmin' && user.adminInfo?.schoolId !== currentUser.adminInfo?.schoolId) {
        throw new Error('School admins can only manage users within their school');
      }
    }

    // Validate role transition
    if (user.role === 'systemAdmin' && newRole !== 'systemAdmin') {
      throw new Error('Cannot downgrade system admin role');
    }

    // Validate role-specific requirements
    if (newRole === 'schoolAdmin') {
      if (!user.adminInfo?.schoolId || !user.adminInfo?.schoolName) {
        throw new Error('School admin must have school information');
      }
    }

    user.role = newRole;
    await user.save();

    return user.toPublicJSON();
  }

  // Get all admins (system and school)
  static async getAllAdmins(filters = {}) {
    const query = { 
      role: { $in: ['systemAdmin', 'schoolAdmin'] }, 
      isActive: true 
    };

    if (filters.schoolId) {
      query['adminInfo.schoolId'] = filters.schoolId;
    }

    if (filters.search) {
      query.$or = [
        { firstName: { $regex: filters.search, $options: 'i' } },
        { lastName: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const admins = await User.find(query).select('-password');
    return admins;
  }

  // Get school admins by school
  static async getSchoolAdminsBySchool(schoolId) {
    const admins = await User.findSchoolAdminsBySchool(schoolId);
    return admins;
  }

  // Check if user has permission
  static async checkUserPermission(userId, permission) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return user.hasPermission(permission);
  }

  // Check if user can access school data
  static async checkSchoolAccess(userId, schoolId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return user.canAccessSchool(schoolId);
  }
}

module.exports = AuthService; 