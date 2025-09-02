const express = require('express');
const { authenticateToken, requireRole, canPerform } = require('../middleware/auth');
const AuthController = require('../controllers/authController');

const router = express.Router();

// Explicit RBAC-protected creation endpoints
router.post('/create-school-admin', authenticateToken, canPerform('create:schoolAdmin'), AuthController.createSchoolAdmin);
router.post('/create-parent', authenticateToken, canPerform('create:parent'), AuthController.createParent);
router.post('/create-student', authenticateToken, canPerform('create:student'), AuthController.createStudent);

// User Sign In
router.post('/signin', AuthController.userSignin);

// Get current user profile
router.get('/profile', authenticateToken, AuthController.getProfile);

// Change password
router.put('/change-password', authenticateToken, AuthController.changePassword);

// Reset password
router.post('/reset-password', AuthController.resetPassword);

// Confirm password reset
router.post('/confirm-reset', AuthController.confirmPasswordReset);

// Verify email
router.get('/verify-email/:token', AuthController.verifyEmail);

// Admin-only routes (system or school admin)
router.get('/users/:role', authenticateToken, requireRole(['systemAdmin','schoolAdmin']), AuthController.getUsersByRole);
router.put('/users/:userId/role', authenticateToken, requireRole(['systemAdmin','schoolAdmin']), AuthController.updateUserRole);
router.put('/users/:userId/lock', authenticateToken, requireRole(['systemAdmin','schoolAdmin']), AuthController.toggleUserLock);

// Additional admin routes
router.get('/admins', authenticateToken, requireRole(['systemAdmin','schoolAdmin']), AuthController.getAllAdmins);
router.get('/schools/:schoolId/admins', authenticateToken, requireRole(['systemAdmin','schoolAdmin']), AuthController.getSchoolAdminsBySchool);
router.get('/users/:userId/permissions', authenticateToken, requireRole(['systemAdmin','schoolAdmin']), AuthController.checkUserPermission);
router.get('/users/:userId/school-access', authenticateToken, requireRole(['systemAdmin','schoolAdmin']), AuthController.checkSchoolAccess);

module.exports = router;