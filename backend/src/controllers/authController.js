const { body, validationResult } = require('express-validator');
const AuthService = require('../services/authService');

class AuthController {

  // Admin-only explicit creators with RBAC
  static async createSchoolAdmin(req, res) {
    try {
      req.body.role = 'schoolAdmin';
      const result = await AuthService.userSignup(req.body);
      res.status(201).json({ success: true, message: 'School admin created successfully', data: result });
    } catch (error) {
      console.error('Create school admin error:', error);
      res.status(400).json({ success: false, message: error.message || 'Internal server error' });
    }
  }

  static async createParent(req, res) {
    try {
      req.body.role = 'parent';
      // ensure school binding if creator is school admin
      if (req.user.role === 'schoolAdmin') {
        req.body.adminInfo = req.body.adminInfo || {};
        req.body.adminInfo.schoolId = req.user.adminInfo?.schoolId;
        req.body.adminInfo.schoolName = req.user.adminInfo?.schoolName;
      }
      const result = await AuthService.userSignup(req.body);
      res.status(201).json({ success: true, message: 'Parent created successfully', data: result });
    } catch (error) {
      console.error('Create parent error:', error);
      res.status(400).json({ success: false, message: error.message || 'Internal server error' });
    }
  }

  static async createStudent(req, res) {
    try {
      req.body.role = 'student';
      // ensure school binding if creator is school admin
      if (req.user.role === 'schoolAdmin') {
        req.body.adminInfo = req.body.adminInfo || {};
        req.body.adminInfo.schoolId = req.user.adminInfo?.schoolId;
        req.body.adminInfo.schoolName = req.user.adminInfo?.schoolName;
      }
      const result = await AuthService.userSignup(req.body);
      res.status(201).json({ success: true, message: 'Student created successfully', data: result });
    } catch (error) {
      console.error('Create student error:', error);
      res.status(400).json({ success: false, message: error.message || 'Internal server error' });
    }
  }

  // User Sign In
  static async userSignin(req, res) {
    try {
      // Validation rules
      const validationRules = [
        body('username').notEmpty().trim(),
        body('password').notEmpty()
      ];

      // Run validation
      await Promise.all(validationRules.map(validation => validation.run(req)));

      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const result = await AuthService.userSignin(req.body);

      res.json({
        success: true,
        message: `${result.user.role} signed in successfully`,
        data: result
      });
    } catch (error) {
      console.error('User signin error:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Get current user profile
  static async getProfile(req, res) {
    try {
      const result = await AuthService.getUserProfile(req.user._id, req.user.role);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Change password
  static async changePassword(req, res) {
    try {
      // Validation rules
      const validationRules = [
        body('currentPassword').notEmpty(),
        body('newPassword').isLength({ min: 6 })
      ];

      // Run validation
      await Promise.all(validationRules.map(validation => validation.run(req)));

      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const { currentPassword, newPassword } = req.body;
      await AuthService.changePassword(req.user, currentPassword, newPassword);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Reset password
  static async resetPassword(req, res) {
    try {
      // Validation rules
      const validationRules = [
        body('email').isEmail().normalizeEmail()
      ];

      // Run validation
      await Promise.all(validationRules.map(validation => validation.run(req)));

      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const { email } = req.body;
      const result = await AuthService.resetPassword(email);

      res.json({
        success: true,
        message: 'Password reset email sent successfully',
        data: { email: result.email }
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Confirm password reset
  static async confirmPasswordReset(req, res) {
    try {
      // Validation rules
      const validationRules = [
        body('token').notEmpty(),
        body('newPassword').isLength({ min: 6 })
      ];

      // Run validation
      await Promise.all(validationRules.map(validation => validation.run(req)));

      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const { token, newPassword } = req.body;
      await AuthService.confirmPasswordReset(token, newPassword);

      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      console.error('Confirm password reset error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Verify email
  static async verifyEmail(req, res) {
    try {
      const { token } = req.params;
      await AuthService.verifyEmail(token);

      res.json({
        success: true,
        message: 'Email verified successfully'
      });
    } catch (error) {
      console.error('Verify email error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Get users by role (Admin only)
  static async getUsersByRole(req, res) {
    try {
      const { role } = req.params;
      const { search, schoolId } = req.query;
      
      const filters = { search, schoolId };
      const users = await AuthService.getUsersByRole(role, filters);

      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('Get users by role error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Update user role (Admin only)
  static async updateUserRole(req, res) {
    try {
      // Validation rules
      const validationRules = [
        body('newRole').isIn(['systemAdmin', 'schoolAdmin', 'student', 'parent'])
      ];

      // Run validation
      await Promise.all(validationRules.map(validation => validation.run(req)));

      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const { userId } = req.params;
      const { newRole } = req.body;
      
      const user = await AuthService.updateUserRole(userId, newRole, req.user);

      res.json({
        success: true,
        message: 'User role updated successfully',
        data: user
      });
    } catch (error) {
      console.error('Update user role error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Toggle user lock (Admin only)
  static async toggleUserLock(req, res) {
    try {
      // Validation rules
      const validationRules = [
        body('lock').isBoolean()
      ];

      // Run validation
      await Promise.all(validationRules.map(validation => validation.run(req)));

      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const { userId } = req.params;
      const { lock } = req.body;
      
      const user = await AuthService.toggleUserLock(userId, lock);

      res.json({
        success: true,
        message: `User account ${lock ? 'locked' : 'unlocked'} successfully`,
        data: user
      });
    } catch (error) {
      console.error('Toggle user lock error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Get all admins (Admin only)
  static async getAllAdmins(req, res) {
    try {
      const { search, schoolId } = req.query;
      const filters = { search, schoolId };
      
      const admins = await AuthService.getAllAdmins(filters);

      res.json({
        success: true,
        data: admins
      });
    } catch (error) {
      console.error('Get all admins error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Get school admins by school (Admin only)
  static async getSchoolAdminsBySchool(req, res) {
    try {
      const { schoolId } = req.params;
      
      const admins = await AuthService.getSchoolAdminsBySchool(schoolId);

      res.json({
        success: true,
        data: admins
      });
    } catch (error) {
      console.error('Get school admins error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Check user permission (Admin only)
  static async checkUserPermission(req, res) {
    try {
      const { userId } = req.params;
      const { permission } = req.query;
      
      if (!permission) {
        return res.status(400).json({
          success: false,
          message: 'Permission parameter is required'
        });
      }
      
      const hasPermission = await AuthService.checkUserPermission(userId, permission);

      res.json({
        success: true,
        data: { hasPermission }
      });
    } catch (error) {
      console.error('Check user permission error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Check school access (Admin only)
  static async checkSchoolAccess(req, res) {
    try {
      const { userId } = req.params;
      const { schoolId } = req.query;
      
      if (!schoolId) {
        return res.status(400).json({
          success: false,
          message: 'School ID parameter is required'
        });
      }
      
      const canAccess = await AuthService.checkSchoolAccess(userId, schoolId);

      res.json({
        success: true,
        data: { canAccess }
      });
    } catch (error) {
      console.error('Check school access error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }
}

module.exports = AuthController; 