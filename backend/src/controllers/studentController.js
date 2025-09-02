const { body, validationResult } = require('express-validator');
const StudentService = require('../services/studentService');

class StudentController {
  // Get all students (Admin only)
  static async getAllStudents(req, res) {
    try {
      const { page, limit, search, grade, busNumber, status } = req.query;
      
      const filters = { search, grade, busNumber, status };
      const pagination = { page, limit };
      
      const result = await StudentService.getStudents(filters, pagination);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get students error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Get student by ID
  static async getStudentById(req, res) {
    try {
      const student = await StudentService.getStudentById(req.params.id);
      
      // Check if user has access to this student
      if (req.user.role === 'parent') {
        await StudentService.checkParentAccess(req.user._id, req.params.id);
      }
      
      res.json({
        success: true,
        data: student
      });
    } catch (error) {
      console.error('Get student error:', error);
      if (error.message === 'Student not found') {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else if (error.message === 'Access denied to this student') {
        res.status(403).json({
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

  // Create new student
  static async createStudent(req, res) {
    try {
      // Validation rules
      const validationRules = [
        body('firstName').notEmpty().trim().escape(),
        body('lastName').notEmpty().trim().escape(),
        body('studentId').notEmpty().trim(),
        body('grade').notEmpty().isInt({ min: 1, max: 12 }),
        body('parentInfo').notEmpty().isMongoId(),
        body('busInfo.busNumber').optional().trim(),
        body('trackingInfo.status').optional().isIn(['active', 'inactive', 'tracking', 'emergency'])
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

      const student = await StudentService.createStudent(req.body);

      res.status(201).json({
        success: true,
        message: 'Student created successfully',
        data: student
      });
    } catch (error) {
      console.error('Create student error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Update student
  static async updateStudent(req, res) {
    try {
      // Validation rules
      const validationRules = [
        body('firstName').optional().trim().escape(),
        body('lastName').optional().trim().escape(),
        body('grade').optional().isInt({ min: 1, max: 12 }),
        body('busInfo.busNumber').optional().trim(),
        body('trackingInfo.status').optional().isIn(['active', 'inactive', 'tracking', 'emergency'])
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

      const student = await StudentService.updateStudent(req.params.id, req.body);

      res.json({
        success: true,
        message: 'Student updated successfully',
        data: student
      });
    } catch (error) {
      console.error('Update student error:', error);
      if (error.message === 'Student not found') {
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

  // Delete student
  static async deleteStudent(req, res) {
    try {
      const student = await StudentService.deleteStudent(req.params.id);

      res.json({
        success: true,
        message: 'Student deleted successfully',
        data: student
      });
    } catch (error) {
      console.error('Delete student error:', error);
      if (error.message === 'Student not found') {
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

  // Get students by parent
  static async getStudentsByParent(req, res) {
    try {
      const students = await StudentService.getStudentsByParent(req.user._id);

      res.json({
        success: true,
        data: students
      });
    } catch (error) {
      console.error('Get students by parent error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Update student tracking info
  static async updateTrackingInfo(req, res) {
    try {
      // Validation rules
      const validationRules = [
        body('trackingInfo.status').optional().isIn(['active', 'inactive', 'tracking', 'emergency']),
        body('trackingInfo.location.latitude').optional().isFloat(),
        body('trackingInfo.location.longitude').optional().isFloat(),
        body('trackingInfo.notes').optional().trim()
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

      const student = await StudentService.updateTrackingInfo(req.params.id, req.body);

      res.json({
        success: true,
        message: 'Tracking info updated successfully',
        data: student
      });
    } catch (error) {
      console.error('Update tracking info error:', error);
      if (error.message === 'Student not found') {
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

  // Get students by bus number
  static async getStudentsByBus(req, res) {
    try {
      const { busNumber } = req.params;
      const students = await StudentService.getStudentsByBus(busNumber);

      res.json({
        success: true,
        data: students
      });
    } catch (error) {
      console.error('Get students by bus error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Get students by grade
  static async getStudentsByGrade(req, res) {
    try {
      const { grade } = req.params;
      const students = await StudentService.getStudentsByGrade(grade);

      res.json({
        success: true,
        data: students
      });
    } catch (error) {
      console.error('Get students by grade error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
      }
    }
  }

module.exports = StudentController; 