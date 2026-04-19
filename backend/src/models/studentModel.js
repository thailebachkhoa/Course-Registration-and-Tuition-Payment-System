const pool = require('../database/pool');

const getCatalog = async (studentId, filters = {}) => {
  const whereParts = [];
  const params = [studentId];

  if (filters.department) {
    whereParts.push('c.department = ?');
    params.push(filters.department);
  }
  if (filters.credits !== undefined) {
    whereParts.push('c.credits = ?');
    params.push(filters.credits);
  }
  if (filters.course_code) {
    whereParts.push('cl.course_code = ?');
    params.push(filters.course_code);
  }

  const whereClause = whereParts.length > 0 ? whereParts.join(' AND ') : '1=1';

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
    params
  );

  return rows;
};

const getEnrollments = async (studentId) => {
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
    [studentId]
  );

  return rows;
};

const getScheduleClasses = async (studentId) => {
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
    [studentId]
  );

  return rows;
};

const getScheduleSummary = async (studentId) => {
  const [rows] = await pool.query(
    `SELECT COUNT(e.id) AS total_classes, SUM(c.credits) AS total_credits
     FROM Enrollments e
     JOIN Classes cl ON cl.class_id = e.class_id
     JOIN Courses c ON c.course_code = cl.course_code
     WHERE e.student_id = ? AND e.status = 'payed'`,
    [studentId]
  );

  return rows[0] || { total_classes: 0, total_credits: 0 };
};

const findClassById = async (classId) => {
  const [rows] = await pool.query(
    `SELECT class_id, course_code, day_of_week, start_time, end_time
     FROM Classes
     WHERE class_id = ?`,
    [classId]
  );
  return rows[0] || null;
};

const findScheduleConflict = async (studentId, classInfo) => {
  const [rows] = await pool.query(
    `SELECT cl.class_id, cl.course_code, cl.day_of_week, cl.start_time, cl.end_time
     FROM Enrollments e
     JOIN Classes cl ON cl.class_id = e.class_id
     WHERE e.student_id = ?
       AND e.status IN ('enrolled', 'payed')
       AND cl.day_of_week = ?
       AND cl.start_time < ?
       AND cl.end_time > ?
     LIMIT 1`,
    [studentId, classInfo.day_of_week, classInfo.end_time, classInfo.start_time]
  );

  return rows[0] || null;
};

const createEnrollment = async (studentId, classId) => {
  await pool.query(
    'INSERT INTO Enrollments (student_id, class_id, status) VALUES (?, ?, ?)',
    [studentId, classId, 'enrolled']
  );
};

const deleteEnrollment = async (studentId, classId) => {
  const [result] = await pool.query(
    'DELETE FROM Enrollments WHERE student_id = ? AND class_id = ?',
    [studentId, classId]
  );
  return result.affectedRows;
};

const getTuitionClasses = async (studentId) => {
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
    [studentId]
  );

  return rows;
};

const getTuitionSummary = async (studentId) => {
  const [rows] = await pool.query(
    `SELECT SUM(c.credits) * 600000 AS total_amount, SUM(c.credits) AS total_credits
     FROM Enrollments e
     JOIN Classes cl ON cl.class_id = e.class_id
     JOIN Courses c ON c.course_code = cl.course_code
     WHERE e.student_id = ? AND e.status = 'enrolled'`,
    [studentId]
  );

  return rows[0] || { total_amount: 0, total_credits: 0 };
};

const getEnrollmentsPendingPayment = async (studentId) => {
  const [rows] = await pool.query(
    `SELECT id FROM Enrollments WHERE student_id = ? AND status = 'enrolled'`,
    [studentId]
  );
  return rows;
};

const markPaymentRequested = async (studentId) => {
  await pool.query(
    `UPDATE Enrollments SET payment_requested = TRUE
     WHERE student_id = ? AND status = 'enrolled'`,
    [studentId]
  );
};

const getDepartments = async () => {
  const [rows] = await pool.query('SELECT DISTINCT department FROM Courses ORDER BY department');
  return rows.map((row) => row.department);
};

const getCurrentStage = async () => {
  const [rows] = await pool.query('SELECT current_stage FROM SystemState WHERE id = 1');
  return rows[0]?.current_stage || 'create_class';
};

module.exports = {
  getCatalog,
  getEnrollments,
  getScheduleClasses,
  getScheduleSummary,
  findClassById,
  findScheduleConflict,
  createEnrollment,
  deleteEnrollment,
  getTuitionClasses,
  getTuitionSummary,
  getEnrollmentsPendingPayment,
  markPaymentRequested,
  getDepartments,
  getCurrentStage,
};
