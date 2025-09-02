const express = require('express');
const { authenticateToken, canPerform } = require('../middleware/auth');
const AdminController = require('../controllers/adminController');

const router = express.Router();

// Get all admins (system-level read)
router.get('/', authenticateToken, canPerform('read:schoolAdmin'), AdminController.getAllAdmins);

// Get admin by ID (system-level read)
router.get('/:id', authenticateToken, canPerform('read:schoolAdmin'), AdminController.getAdminById);

// Create new admin (system admin creates school admins)
router.post('/', authenticateToken, canPerform('create:schoolAdmin'), AdminController.createAdmin);

// Update admin (system-level update)
router.put('/:id', authenticateToken, canPerform('update:schoolAdmin'), AdminController.updateAdmin);

// Delete admin (system-level delete)
router.delete('/:id', authenticateToken, canPerform('delete:schoolAdmin'), AdminController.deleteAdmin);

// Get dashboard statistics (both admins; treat as analytics admin read)
router.get('/dashboard/stats', authenticateToken, canPerform('read:analytics:schoolAdmin'), AdminController.getDashboardStats);

// Get system overview (both admins; treat as analytics admin read)
router.get('/dashboard/overview', authenticateToken, canPerform('read:analytics:schoolAdmin'), AdminController.getSystemOverview);

// Bulk update students (school admin ability maps to update:student; allow either admin type)
router.put('/students/bulk-update', authenticateToken, canPerform('update:student'), AdminController.bulkUpdateStudents);

// Export students data (school admin ability)
router.get('/students/export', authenticateToken, canPerform('export:students'), AdminController.exportStudentsData);

// Get admin activity log (system-level read)
router.get('/:id/activity-log', authenticateToken, canPerform('read:schoolAdmin'), AdminController.getAdminActivityLog);

module.exports = router;