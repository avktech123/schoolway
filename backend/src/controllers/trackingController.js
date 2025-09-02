const { body, validationResult } = require('express-validator');
const TrackingService = require('../services/trackingService');

class TrackingController {
  // Update student location
  static async updateStudentLocation(req, res) {
    try {
      // Validation rules
      const validationRules = [
        body('latitude').isFloat({ min: -90, max: 90 }),
        body('longitude').isFloat({ min: -180, max: 180 }),
        body('timestamp').optional().isISO8601(),
        body('status').optional().isIn(['active', 'inactive', 'tracking', 'emergency'])
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

      const student = await TrackingService.updateStudentLocation(req.params.id, req.body);

      res.json({
        success: true,
        message: 'Student location updated successfully',
        data: student
      });
    } catch (error) {
      console.error('Update student location error:', error);
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

  // Update student status
  static async updateStudentStatus(req, res) {
    try {
      // Validation rules
      const validationRules = [
        body('status').isIn(['active', 'inactive', 'tracking', 'emergency']),
        body('location.latitude').optional().isFloat({ min: -90, max: 90 }),
        body('location.longitude').optional().isFloat({ min: -180, max: 180 }),
        body('notes').optional().trim()
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

      const { status, ...additionalInfo } = req.body;
      const student = await TrackingService.updateStudentStatus(req.params.id, status, additionalInfo);

      res.json({
        success: true,
        message: 'Student status updated successfully',
        data: student
      });
    } catch (error) {
      console.error('Update student status error:', error);
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

  // Get students by status
  static async getStudentsByStatus(req, res) {
    try {
      const { status } = req.params;
      const students = await TrackingService.getStudentsByStatus(status);

      res.json({
        success: true,
        data: students
      });
    } catch (error) {
      console.error('Get students by status error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Get students by location
  static async getStudentsByLocation(req, res) {
    try {
      const { latitude, longitude, radius } = req.query;
      const location = { latitude: parseFloat(latitude), longitude: parseFloat(longitude) };
      const radiusKm = radius ? parseFloat(radius) : 5;
      
      const students = await TrackingService.getStudentsByLocation(location, radiusKm);

      res.json({
        success: true,
        data: students
      });
    } catch (error) {
      console.error('Get students by location error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Get student tracking history
  static async getStudentTrackingHistory(req, res) {
    try {
      const { limit } = req.query;
      const history = await TrackingService.getStudentTrackingHistory(req.params.id, limit);

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('Get student tracking history error:', error);
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

  // Get real-time tracking data
  static async getRealTimeTrackingData(req, res) {
    try {
      const { status, busNumber } = req.query;
      const filters = { status, busNumber };
      
      const students = await TrackingService.getRealTimeTrackingData(filters);

      res.json({
        success: true,
        data: students
      });
    } catch (error) {
      console.error('Get real-time tracking data error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Bulk status update
  static async bulkUpdateStatus(req, res) {
    try {
      // Validation rules
      const validationRules = [
        body('updates').isArray({ min: 1 }),
        body('updates.*.studentId').isMongoId(),
        body('updates.*.status').isIn(['active', 'inactive', 'tracking', 'emergency'])
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

      const result = await TrackingService.bulkUpdateStatus(req.body.updates);

      res.json({
        success: true,
        message: 'Bulk status update completed successfully',
        data: result
      });
    } catch (error) {
      console.error('Bulk status update error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Get tracking analytics
  static async getTrackingAnalytics(req, res) {
    try {
      const analytics = await TrackingService.getTrackingAnalytics();

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Get tracking analytics error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Send emergency alert
  static async sendEmergencyAlert(req, res) {
    try {
      // Validation rules
      const validationRules = [
        body('type').isIn(['medical', 'safety', 'transport', 'other']),
        body('message').notEmpty().trim(),
        body('location.latitude').optional().isFloat({ min: -90, max: 90 }),
        body('location.longitude').optional().isFloat({ min: -180, max: 180 })
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

      const student = await TrackingService.sendEmergencyAlert(req.params.id, req.body);

      res.json({
        success: true,
        message: 'Emergency alert sent successfully',
        data: student
      });
    } catch (error) {
      console.error('Send emergency alert error:', error);
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
}

module.exports = TrackingController; 