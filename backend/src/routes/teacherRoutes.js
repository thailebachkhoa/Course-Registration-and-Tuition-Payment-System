const express = require('express');
const {
  getMyClasses, getSchedule, createClass, updateClass, deleteClass,
  getCourses, getCourseByCode
} = require('../controllers/teacherController');
const { authenticate, requireRole } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Teacher
 *     description: Teacher and course endpoints
 */

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get all courses
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Course list
 */
router.get('/courses', authenticate, requireRole('teacher'), getCourses);

/**
 * @swagger
 * /api/courses/{code}:
 *   get:
 *     summary: Get course by code
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course detail
 */
router.get('/courses/:code', authenticate, requireRole('teacher'), getCourseByCode);

/**
 * @swagger
 * /api/teacher/classes:
 *   get:
 *     summary: Get classes owned by teacher
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Teacher classes
 */
router.get('/teacher/classes', authenticate, requireRole('teacher'), getMyClasses);

/**
 * @swagger
 * /api/teacher/schedule:
 *   get:
 *     summary: Get teacher schedule
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Teacher schedule
 */
router.get('/teacher/schedule', authenticate, requireRole('teacher'), getSchedule);

/**
 * @swagger
 * /api/teacher/classes:
 *   post:
 *     summary: Create class
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [course_code, day_of_week, start_time, end_time]
 *             properties:
 *               course_code:
 *                 type: string
 *               day_of_week:
 *                 type: string
 *               start_time:
 *                 type: string
 *               end_time:
 *                 type: string
 *     responses:
 *       201:
 *         description: Class created
 *       409:
 *         description: Teacher already has another class in the same time slot
 */
router.post('/teacher/classes', authenticate, requireRole('teacher'), createClass);

/**
 * @swagger
 * /api/teacher/classes/{classId}:
 *   put:
 *     summary: Update class
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [day_of_week, start_time, end_time]
 *             properties:
 *               day_of_week:
 *                 type: string
 *                 example: Monday
 *               start_time:
 *                 type: string
 *                 example: 07:30:00
 *               end_time:
 *                 type: string
 *                 example: 09:30:00
 *     responses:
 *       200:
 *         description: Class updated
 *       400:
 *         description: Missing update payload
 *       409:
 *         description: Teacher already has another class in the same time slot
 */
router.put(
  '/teacher/classes/:classId',
  authenticate,
  requireRole('teacher'),
  updateClass
);

/**
 * @swagger
 * /api/teacher/classes/{classId}:
 *   delete:
 *     summary: Delete class
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Class deleted
 */
router.delete('/teacher/classes/:classId', authenticate, requireRole('teacher'), deleteClass);

module.exports = router;