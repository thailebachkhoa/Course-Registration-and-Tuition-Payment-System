// location: backend/src/routes/teacherRoutes.js

const express = require('express');
const router = express.Router();
const {
  getMyClasses, getSchedule, createClass, updateClass, deleteClass,
  getCourses, getCourseByCode
} = require('../controllers/teacherController');
const { authenticate, requireRole } = require('../middleware/auth');

// Course lookup (accessible to all authenticated users for dropdown)
router.get('/courses', authenticate, getCourses);
router.get('/courses/:code', authenticate, getCourseByCode);

// Teacher-only routes
router.get('/teacher/classes', authenticate, requireRole('teacher'), getMyClasses);
router.get('/teacher/schedule', authenticate, requireRole('teacher'), getSchedule);
router.post('/teacher/classes', authenticate, requireRole('teacher'), createClass);
router.put('/teacher/classes/:classId', authenticate, requireRole('teacher'), updateClass);
router.delete('/teacher/classes/:classId', authenticate, requireRole('teacher'), deleteClass);

module.exports = router;