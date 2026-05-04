const express = require('express');
const {
  getCatalog, getEnrollments, getSchedule, enroll, cancelEnroll,
  getTuition, requestPayment, getDepartments
} = require('../controllers/studentController');
const { authenticate, requireRole } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Student
 *     description: Student registration and tuition endpoints
 */

router.use(authenticate, requireRole('student'));

/**
 * @swagger
 * /api/student/catalog:
 *   get:
 *     summary: Get class catalog
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *       - in: query
 *         name: credits
 *         schema:
 *           type: integer
 *       - in: query
 *         name: course_code
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Catalog list
 */
router.get('/catalog', getCatalog);

/**
 * @swagger
 * /api/student/enrollments:
 *   get:
 *     summary: Get current enrollments
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Enrollment list
 */
router.get('/enrollments', getEnrollments);

/**
 * @swagger
 * /api/student/schedule:
 *   get:
 *     summary: Get paid schedule
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Schedule and summary
 */
router.get('/schedule', getSchedule);

/**
 * @swagger
 * /api/student/enroll:
 *   post:
 *     summary: Enroll to class
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [class_id]
 *             properties:
 *               class_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Enrollment success
 *       409:
 *         description: Enrollment conflict (duplicate or timetable overlap)
 */
router.post('/enroll', enroll);

/**
 * @swagger
 * /api/student/enroll/{classId}:
 *   delete:
 *     summary: Cancel enrollment
 *     tags: [Student]
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
 *         description: Enrollment canceled
 */
router.delete('/enroll/:classId', cancelEnroll);

/**
 * @swagger
 * /api/student/tuition:
 *   get:
 *     summary: Tuition summary
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tuition detail
 */
router.get('/tuition', getTuition);

/**
 * @swagger
 * /api/student/request-payment:
 *   post:
 *     summary: Request admin payment approval
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment request submitted
 */
router.post('/request-payment', requestPayment);

/**
 * @swagger
 * /api/student/departments:
 *   get:
 *     summary: List departments
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Department list
 */
router.get('/departments', getDepartments);

module.exports = router;