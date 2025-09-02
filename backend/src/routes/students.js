const express = require('express');
const { authenticateToken, canPerform } = require('../middleware/auth');
const StudentController = require('../controllers/studentController');

const router = express.Router();

// Get all students (RBAC read:students)
router.get('/', authenticateToken, canPerform('read:students'), StudentController.getAllStudents);

// Get student by ID (RBAC read:students)
router.get('/:id', authenticateToken, canPerform('read:students'), StudentController.getStudentById);

// Create new student (RBAC create:student)
router.post('/', authenticateToken, canPerform('create:student'), StudentController.createStudent);

// Update student (RBAC update:student)
router.put('/:id', authenticateToken, canPerform('update:student'), StudentController.updateStudent);

// Delete student (RBAC delete:student)
router.delete('/:id', authenticateToken, canPerform('delete:student'), StudentController.deleteStudent);

// Get students by parent (Parent only - keep as is via requireParent in controller logic)
router.get('/parent/children', authenticateToken, require('../middleware/auth').requireParent, StudentController.getStudentsByParent);

// Update student tracking info (RBAC update:student)
router.put('/:id/tracking', authenticateToken, canPerform('update:student'), StudentController.updateTrackingInfo);

// Get students by bus number (RBAC read:students)
router.get('/bus/:busNumber', authenticateToken, canPerform('read:students'), StudentController.getStudentsByBus);

// Get students by grade (RBAC read:students)
router.get('/grade/:grade', authenticateToken, canPerform('read:students'), StudentController.getStudentsByGrade);

module.exports = router; 