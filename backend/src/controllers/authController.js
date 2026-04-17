// location: backend/src/controllers/authController.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// POST /api/auth/register
const register = async (req, res) => {
  const { person_id, email, password, full_name, role } = req.body;

  if (!person_id || !email || !password || !full_name || !role) {
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
  }
  if (!['teacher', 'student'].includes(role)) {
    return res.status(400).json({ message: 'Role phải là teacher hoặc student' });
  }

  try {
    // Check duplicate personId or email
    const [existing] = await pool.query(
      'SELECT person_id, email FROM Users WHERE person_id = ? OR email = ?',
      [person_id, email]
    );
    if (existing.length > 0) {
      const dup = existing[0];
      if (dup.person_id === person_id)
        return res.status(409).json({ message: 'Mã số sinh viên/giảng viên đã tồn tại' });
      return res.status(409).json({ message: 'Email đã được sử dụng' });
    }

    const hashed = await bcrypt.hash(password, 10);
    // INSERT (a)
    await pool.query(
      'INSERT INTO Users (person_id, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [person_id, email, hashed, full_name, role]
    );

    return res.status(201).json({ message: 'Đăng ký thành công' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password)
    return res.status(400).json({ message: 'Thiếu thông tin đăng nhập' });

  try {
    // Allow login with email OR person_id (d)
    const [rows] = await pool.query(
      'SELECT * FROM Users WHERE email = ? OR person_id = ?',
      [identifier, identifier]
    );
    if (rows.length === 0)
      return res.status(401).json({ message: 'Tài khoản không tồn tại' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ message: 'Mật khẩu không đúng' });

    // Check system stage for role locking
    const [stateRows] = await pool.query('SELECT current_stage FROM SystemState WHERE id = 1');
    const stage = stateRows[0]?.current_stage || 'create_class';

    if (user.role !== 'admin') {
      if (stage === 'create_class' && user.role === 'student') {
        return res.status(403).json({ message: 'Hệ thống đang tạo lớp', stage, blocked: true });
      }
      if (stage === 'register_class' && user.role === 'teacher') {
        return res.status(403).json({ message: 'Hệ thống đang đăng ký lớp', stage, blocked: true });
      }
      if (stage === 'lock_class') {
        return res.status(403).json({ message: 'Hệ thống đang chuẩn bị thời khóa biểu', stage, blocked: true });
      }
    }

    const token = jwt.sign(
      { person_id: user.person_id, email: user.email, role: user.role, full_name: user.full_name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '8h' }
    );

    return res.json({
      token,
      user: {
        person_id: user.person_id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
      stage,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = { register, login };