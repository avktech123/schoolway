const express = require('express');
const { authenticateToken, requireSchoolAdmin } = require('../middleware/auth');
const TrackingController = require('../controllers/trackingController');

const router = express.Router();

// Update student location (School Admin only)
router.put('/:id/location', authenticateToken, requireSchoolAdmin, TrackingController.updateStudentLocation);

// Update student status (School Admin only)
router.put('/:id/status', authenticateToken, requireSchoolAdmin, TrackingController.updateStudentStatus);

// Get students by status (auth required)
router.get('/status/:status', authenticateToken, TrackingController.getStudentsByStatus);

// Get students by location (auth required)
router.get('/location', authenticateToken, TrackingController.getStudentsByLocation);

// Get student tracking history (auth required)
router.get('/:id/history', authenticateToken, TrackingController.getStudentTrackingHistory);

// Get real-time tracking data (auth required)
router.get('/realtime', authenticateToken, TrackingController.getRealTimeTrackingData);

// Bulk status update (School Admin only)
router.put('/bulk/status', authenticateToken, requireSchoolAdmin, TrackingController.bulkUpdateStatus);

// Get tracking analytics (School Admin only)
router.get('/analytics', authenticateToken, requireSchoolAdmin, TrackingController.getTrackingAnalytics);

// Send emergency alert (School Admin only)
router.post('/:id/emergency', authenticateToken, requireSchoolAdmin, TrackingController.sendEmergencyAlert);

module.exports = router; 