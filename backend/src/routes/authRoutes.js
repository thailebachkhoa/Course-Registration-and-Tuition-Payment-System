const express = require('express');

const { register, login } = require('../controllers/authController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication endpoints
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký tài khoản sinh viên hoặc giảng viên
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [person_id, email, password, full_name, role]
 *             properties:
 *               person_id:
 *                 type: string
 *                 example: SV001
 *               email:
 *                 type: string
 *                 example: sv001@school.edu.vn
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: abc12345
 *               full_name:
 *                 type: string
 *                 example: Nguyen Van A
 *               role:
 *                 type: string
 *                 enum: [teacher, student]
 *                 example: student
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Đăng ký thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       409:
 *         description: Trùng mã số hoặc email
 *       500:
 *         description: Lỗi server
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập bằng email hoặc mã số SV/GV
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, password]
 *             properties:
 *               identifier:
 *                 type: string
 *                 example: admin@school.edu.vn
 *               password:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     person_id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     full_name:
 *                       type: string
 *                     role:
 *                       type: string
 *                 stage:
 *                   type: string
 *       400:
 *         description: Thiếu thông tin đăng nhập
 *       401:
 *         description: Sai tài khoản hoặc mật khẩu
 *       403:
 *         description: Bị chặn theo trạng thái hệ thống
 *       500:
 *         description: Lỗi server
 */
router.post('/login', login);

module.exports = router;