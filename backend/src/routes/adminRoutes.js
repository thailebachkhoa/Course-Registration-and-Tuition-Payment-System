const express = require('express');
const { getStage, nextStage, getPaymentRequests, approvePayment } = require('../controllers/adminController');
const { authenticate, requireRole } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Admin
 *     description: Admin management endpoints
 */

router.use(authenticate, requireRole('admin'));

/**
 * @swagger
 * /api/admin/stage:
 *   get:
 *     summary: Get current registration stage
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current stage
 */
router.get('/stage', getStage);

/**
 * @swagger
 * /api/admin/stage/next:
 *   post:
 *     summary: Move to next stage
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stage updated
 */
router.post('/stage/next', nextStage);

/**
 * @swagger
 * /api/admin/payment-requests:
 *   get:
 *     summary: List students requesting payment approval
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment request list
 *       403:
 *         description: Only available at lock_class stage
 */
router.get('/payment-requests', getPaymentRequests);

/**
 * @swagger
 * /api/admin/approve-payment/{studentId}:
 *   post:
 *     summary: Approve payment for a student
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment approved
 *       403:
 *         description: Only available at lock_class stage
 *       404:
 *         description: No pending payment request found for the student
 */
router.post('/approve-payment/:studentId', approvePayment);

module.exports = router;