// location: backend/src/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const { getStage, nextStage, getPaymentRequests, approvePayment } = require('../controllers/adminController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate, requireRole('admin'));

router.get('/stage', getStage);
router.post('/stage/next', nextStage);
router.get('/payment-requests', getPaymentRequests);
router.post('/approve-payment/:studentId', approvePayment);

module.exports = router;