// location: backend/src/controllers/teacherController.js

const pool = require('../config/db');

// GET /api/teacher/classes — list my classes with JOIN (f)
const getMyClasses = async (req, res) => {
  const { person_id } = req.user;
  // Query with single condition (d): WHERE teacher_id = ?
  const [rows] = await pool.query(
    `SELECT cl.class_id, cl.course_code, c.course_name, c.credits, c.department,
            cl.day_of_week, cl.start_time, cl.end_time
     FROM Classes cl
     JOIN Courses c ON c.course_code = cl.course_code
     WHERE cl.teacher_id = ?
     ORDER BY cl.class_id DESC`,
    [person_id]
  );
  res.json(rows);
};

// GET /api/teacher/schedule — schedule view (Stage 4) with payed count (h)
const getSchedule = async (req, res) => {
  const { person_id } = req.user;
  const [rows] = await pool.query(
    `SELECT cl.class_id, cl.course_code, c.course_name, c.credits,
            cl.day_of_week, cl.start_time, cl.end_time,
            COUNT(e.student_id) AS payed_count
     FROM Classes cl
     JOIN Courses c ON c.course_code = cl.course_code
     LEFT JOIN Enrollments e ON e.class_id = cl.class_id AND e.status = 'payed'
     WHERE cl.teacher_id = ?
     GROUP BY cl.class_id, cl.course_code, c.course_name, c.credits,
              cl.day_of_week, cl.start_time, cl.end_time
     ORDER BY cl.start_time`,
    [person_id]
  );
  res.json(rows);
};

// POST /api/teacher/classes — create new class (a)
const createClass = async (req, res) => {
  const { person_id } = req.user;
  const { course_code, day_of_week, start_time, end_time } = req.body;

  if (!course_code || !day_of_week || !start_time || !end_time)
    return res.status(400).json({ message: 'Thiếu thông tin lớp học' });

  // Check course exists
  const [courses] = await pool.query(
    'SELECT course_code FROM Courses WHERE course_code = ?',
    [course_code]
  );
  if (courses.length === 0)
    return res.status(404).json({ message: 'Mã môn học không tồn tại' });

  // INSERT (a)
  const [result] = await pool.query(
    'INSERT INTO Classes (course_code, teacher_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?, ?)',
    [course_code, person_id, day_of_week, start_time, end_time]
  );
  res.status(201).json({ message: 'Tạo lớp thành công', class_id: result.insertId });
};

// PUT /api/teacher/classes/:classId — update class (c)
const updateClass = async (req, res) => {
  const { person_id } = req.user;
  const { classId } = req.params;
  const { day_of_week, start_time, end_time } = req.body;

  // Verify ownership
  const [rows] = await pool.query(
    'SELECT class_id FROM Classes WHERE class_id = ? AND teacher_id = ?',
    [classId, person_id]
  );
  if (rows.length === 0)
    return res.status(403).json({ message: 'Không có quyền chỉnh sửa lớp này' });

  await pool.query(
    'UPDATE Classes SET day_of_week = ?, start_time = ?, end_time = ? WHERE class_id = ?',
    [day_of_week, start_time, end_time, classId]
  );
  res.json({ message: 'Cập nhật thành công' });
};

// DELETE /api/teacher/classes/:classId — delete class (b)
const deleteClass = async (req, res) => {
  const { person_id } = req.user;
  const { classId } = req.params;

  const [rows] = await pool.query(
    'SELECT class_id FROM Classes WHERE class_id = ? AND teacher_id = ?',
    [classId, person_id]
  );
  if (rows.length === 0)
    return res.status(403).json({ message: 'Không có quyền xóa lớp này' });

  await pool.query('DELETE FROM Classes WHERE class_id = ?', [classId]);
  res.json({ message: 'Xóa lớp thành công' });
};

// GET /api/courses — all courses (for dropdown)
const getCourses = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM Courses ORDER BY course_code');
  res.json(rows);
};

// GET /api/courses/:code
const getCourseByCode = async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM Courses WHERE course_code = ?',
    [req.params.code]
  );
  if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy môn học' });
  res.json(rows[0]);
};

module.exports = { getMyClasses, getSchedule, createClass, updateClass, deleteClass, getCourses, getCourseByCode };