// location: backend/src/routes/studentRoutes.js

const express = require('express');
const router = express.Router();
const {
  getCatalog, getEnrollments, getSchedule, enroll, cancelEnroll,
  getTuition, requestPayment, getDepartments
} = require('../controllers/studentController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate, requireRole('student'));

router.get('/catalog', getCatalog);
router.get('/enrollments', getEnrollments);
router.get('/schedule', getSchedule);
router.post('/enroll', enroll);
router.delete('/enroll/:classId', cancelEnroll);
router.get('/tuition', getTuition);
router.post('/request-payment', requestPayment);
router.get('/departments', getDepartments);

module.exports = router;