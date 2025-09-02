const { body, validationResult } = require('express-validator');
const AdminService = require('../services/adminService');

class AdminController {
  // Get all admins
  static async getAllAdmins(req, res) {
    try {
      const admins = await AdminService.getAllAdmins();

      res.json({
        success: true,
        data: admins
      });
    } catch (error) {
      console.error('Get admins error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Get admin by ID
  static async getAdminById(req, res) {
    try {
      const admin = await AdminService.getAdminById(req.params.id);

      res.json({
        success: true,
        data: admin
      });
    } catch (error) {
      console.error('Get admin error:', error);
      if (error.message === 'Admin not found') {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: error.message || 'Internal server error'
        });
      }
    }
  }

  // Create new admin
  static async createAdmin(req, res) {
    try {
      // Validation rules
      const validationRules = [
        body('username').isLength({ min: 3 }).trim().escape(),
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 6 }),
        body('fullName').notEmpty().trim().escape(),
        body('phone').optional().trim(),
        body('role').optional().isIn(['systemAdmin', 'schoolAdmin'])
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

      const admin = await AdminService.createAdmin(req.body, req.user);

      res.status(201).json({
        success: true,
        message: 'Admin created successfully',
        data: admin
      });
    } catch (error) {
      console.error('Create admin error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Update admin
  static async updateAdmin(req, res) {
    try {
      // Validation rules
      const validationRules = [
        body('fullName').optional().trim().escape(),
        body('phone').optional().trim(),
        body('role').optional().isIn(['systemAdmin', 'schoolAdmin'])
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

      const admin = await AdminService.updateAdmin(req.params.id, req.body, req.user);

      res.json({
        success: true,
        message: 'Admin updated successfully',
        data: admin
      });
    } catch (error) {
      console.error('Update admin error:', error);
      if (error.message === 'Admin not found') {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: error.message || 'Internal server error'
        });
      }
    }
  }

  // Delete admin
  static async deleteAdmin(req, res) {
    try {
      const admin = await AdminService.deleteAdmin(req.params.id, req.user);

      res.json({
        success: true,
        message: 'Admin deleted successfully',
        data: admin
      });
    } catch (error) {
      console.error('Delete admin error:', error);
      if (error.message === 'Admin not found') {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: error.message || 'Internal server error'
        });
      }
    }
  }

  // Get dashboard statistics
  static async getDashboardStats(req, res) {
    try {
      const stats = await AdminService.getDashboardStats(req.user);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Get system overview
  static async getSystemOverview(req, res) {
    try {
      const overview = await AdminService.getSystemOverview(req.user);

      res.json({
        success: true,
        data: overview
      });
    } catch (error) {
      console.error('Get system overview error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Bulk update students
  static async bulkUpdateStudents(req, res) {
    try {
      // Validation rules
      const validationRules = [
        body('updates').isArray({ min: 1 }),
        body('updates.*.studentId').isMongoId(),
        body('updates.*.data').isObject()
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

      const result = await AdminService.bulkUpdateStudents(req.body.updates, req.user);

      res.json({
        success: true,
        message: 'Bulk update completed successfully',
        data: result
      });
    } catch (error) {
      console.error('Bulk update students error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Export students data
  static async exportStudentsData(req, res) {
    try {
      const { grade, busNumber } = req.query;
      const filters = { grade, busNumber };
      
      const students = await AdminService.exportStudentsData(filters, req.user);

      res.json({
        success: true,
        data: students
      });
    } catch (error) {
      console.error('Export students data error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Get admin activity log
  static async getAdminActivityLog(req, res) {
    try {
      const log = await AdminService.getAdminActivityLog(req.params.id, req.user);

      res.json({
        success: true,
        data: log
      });
    } catch (error) {
      console.error('Get admin activity log error:', error);
      if (error.message === 'Admin not found') {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: error.message || 'Internal server error'
        });
      }
    }
  }
}

module.exports = AdminController; 