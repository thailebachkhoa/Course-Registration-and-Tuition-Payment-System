// location: backend/src/controllers/studentController.js

const pool = require('../config/db');

// GET /api/student/catalog — all classes with enrollment status
// Uses JOIN (f) + subquery (g)
const getCatalog = async (req, res) => {
  const { person_id } = req.user;
  const { department, credits, course_code } = req.query;

  let whereClause = '1=1';
  // const params = [person_id];
  const filterParams = [];

  // Composite condition (e): filter by department AND/OR credits
  if (department) {
    whereClause += ' AND c.department = ?';
    filterParams.push(department);
  }
  if (credits) {
    whereClause += ' AND c.credits = ?';
    filterParams.push(parseInt(credits));
  }
  // Single condition (d): filter by course_code
  if (course_code) {
    whereClause += ' AND cl.course_code = ?';
    filterParams.push(course_code);
  }

  // JOIN + subquery (g): check enrollment NOT EXISTS
  const [rows] = await pool.query(
    `SELECT
       cl.class_id,
       cl.course_code,
       c.course_name,
       c.credits,
       c.department,
       u.full_name AS teacher_name,
       cl.day_of_week,
       cl.start_time,
       cl.end_time,
       CASE
         WHEN EXISTS (
           SELECT 1 FROM Enrollments e2
           WHERE e2.student_id = ? AND e2.class_id = cl.class_id
         ) THEN 'enrolled'
         ELSE 'not-enrolled'
       END AS enrollment_status
     FROM Classes cl
     JOIN Courses c ON c.course_code = cl.course_code
     JOIN Users u ON u.person_id = cl.teacher_id
     WHERE ${whereClause}
     ORDER BY cl.course_code, cl.class_id`,
    [person_id, ...filterParams]
  );
  res.json(rows);
};

// GET /api/student/enrollments — my enrolled classes
const getEnrollments = async (req, res) => {
  const { person_id } = req.user;
  // JOIN (f)
  const [rows] = await pool.query(
    `SELECT
       e.id AS enrollment_id,
       cl.class_id,
       cl.course_code,
       c.course_name,
       c.credits,
       c.department,
       u.full_name AS teacher_name,
       cl.day_of_week,
       cl.start_time,
       cl.end_time,
       e.status,
       e.payment_requested
     FROM Enrollments e
     JOIN Classes cl ON cl.class_id = e.class_id
     JOIN Courses c ON c.course_code = cl.course_code
     JOIN Users u ON u.person_id = cl.teacher_id
     WHERE e.student_id = ?
     ORDER BY cl.course_code`,
    [person_id]
  );
  res.json(rows);
};

// GET /api/student/schedule — only payed classes (Stage 4)
const getSchedule = async (req, res) => {
  const { person_id } = req.user;
  // Composite condition (e): student_id AND status = payed
  const [rows] = await pool.query(
    `SELECT
       cl.class_id,
       cl.course_code,
       c.course_name,
       c.credits,
       u.full_name AS teacher_name,
       cl.day_of_week,
       cl.start_time,
       cl.end_time
     FROM Enrollments e
     JOIN Classes cl ON cl.class_id = e.class_id
     JOIN Courses c ON c.course_code = cl.course_code
     JOIN Users u ON u.person_id = cl.teacher_id
     WHERE e.student_id = ? AND e.status = 'payed'
     ORDER BY cl.start_time`,
    [person_id]
  );

  // Aggregate (h): total credits + count
  const [summary] = await pool.query(
    `SELECT COUNT(e.id) AS total_classes, SUM(c.credits) AS total_credits
     FROM Enrollments e
     JOIN Classes cl ON cl.class_id = e.class_id
     JOIN Courses c ON c.course_code = cl.course_code
     WHERE e.student_id = ? AND e.status = 'payed'`,
    [person_id]
  );

  res.json({ classes: rows, summary: summary[0] });
};

// POST /api/student/enroll — enroll in a class (a)
const enroll = async (req, res) => {
  const { person_id } = req.user;
  const { class_id } = req.body;

  if (!class_id)
    return res.status(400).json({ message: 'Thiếu class_id' });

  // Check class exists
  const [classes] = await pool.query('SELECT class_id FROM Classes WHERE class_id = ?', [class_id]);
  if (classes.length === 0)
    return res.status(404).json({ message: 'Lớp học không tồn tại' });

  // No duplicate enrollment (unique constraint)
  try {
    await pool.query(
      'INSERT INTO Enrollments (student_id, class_id, status) VALUES (?, ?, ?)',
      [person_id, class_id, 'enrolled']
    );
    res.status(201).json({ message: 'Đăng ký thành công' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ message: 'Bạn đã đăng ký lớp này rồi' });
    throw err;
  }
};

// DELETE /api/student/enroll/:classId — cancel enrollment (b)
const cancelEnroll = async (req, res) => {
  const { person_id } = req.user;
  const { classId } = req.params;

  const [result] = await pool.query(
    'DELETE FROM Enrollments WHERE student_id = ? AND class_id = ?',
    [person_id, classId]
  );
  if (result.affectedRows === 0)
    return res.status(404).json({ message: 'Không tìm thấy đăng ký' });
  res.json({ message: 'Hủy đăng ký thành công' });
};

// GET /api/student/tuition — tuition summary with aggregate (h)
const getTuition = async (req, res) => {
  const { person_id } = req.user;

  const [rows] = await pool.query(
    `SELECT
       cl.class_id,
       cl.course_code,
       c.course_name,
       c.credits,
       e.status,
       e.payment_requested
     FROM Enrollments e
     JOIN Classes cl ON cl.class_id = e.class_id
     JOIN Courses c ON c.course_code = cl.course_code
     WHERE e.student_id = ? AND e.status = 'enrolled'
     ORDER BY cl.course_code`,
    [person_id]
  );

  // Aggregate SUM (h)
  const [total] = await pool.query(
    `SELECT SUM(c.credits) * 600000 AS total_amount, SUM(c.credits) AS total_credits
     FROM Enrollments e
     JOIN Classes cl ON cl.class_id = e.class_id
     JOIN Courses c ON c.course_code = cl.course_code
     WHERE e.student_id = ? AND e.status = 'enrolled'`,
    [person_id]
  );

  const hasPaymentRequested = rows.some((r) => r.payment_requested);

  res.json({
    classes: rows,
    total_amount: total[0].total_amount || 0,
    total_credits: total[0].total_credits || 0,
    payment_requested: hasPaymentRequested,
  });
};

// POST /api/student/request-payment — confirm payment (c: flag payment_requested)
const requestPayment = async (req, res) => {
  const { person_id } = req.user;

  const [enrollments] = await pool.query(
    `SELECT id FROM Enrollments WHERE student_id = ? AND status = 'enrolled'`,
    [person_id]
  );
  if (enrollments.length === 0)
    return res.status(400).json({ message: 'Không có môn học nào để xác nhận' });

  await pool.query(
    `UPDATE Enrollments SET payment_requested = TRUE
     WHERE student_id = ? AND status = 'enrolled'`,
    [person_id]
  );
  res.json({ message: 'Đã gửi xác nhận chuyển khoản cho Admin' });
};

// GET /api/departments — distinct departments
const getDepartments = async (req, res) => {
  const [rows] = await pool.query('SELECT DISTINCT department FROM Courses ORDER BY department');
  res.json(rows.map((r) => r.department));
};

module.exports = {
  getCatalog,
  getEnrollments,
  getSchedule,
  enroll,
  cancelEnroll,
  getTuition,
  requestPayment,
  getDepartments,
};