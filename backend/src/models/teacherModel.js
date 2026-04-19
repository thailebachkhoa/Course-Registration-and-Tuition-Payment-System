const pool = require('../database/pool');

const getMyClasses = async (teacherId) => {
  const [rows] = await pool.query(
    `SELECT cl.class_id, cl.course_code, c.course_name, c.credits, c.department,
            cl.day_of_week, cl.start_time, cl.end_time
     FROM Classes cl
     JOIN Courses c ON c.course_code = cl.course_code
     WHERE cl.teacher_id = ?
     ORDER BY cl.class_id DESC`,
    [teacherId]
  );
  return rows;
};

const getSchedule = async (teacherId) => {
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
    [teacherId]
  );
  return rows;
};

const findCourseByCode = async (courseCode) => {
  const [rows] = await pool.query('SELECT course_code FROM Courses WHERE course_code = ?', [courseCode]);
  return rows[0] || null;
};

const createClass = async (payload) => {
  const [result] = await pool.query(
    'INSERT INTO Classes (course_code, teacher_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?, ?)',
    [payload.course_code, payload.teacher_id, payload.day_of_week, payload.start_time, payload.end_time]
  );
  return result.insertId;
};

const findTimeConflict = async ({ teacherId, day_of_week, start_time, end_time, excludeClassId }) => {
  let query = `SELECT class_id, course_code, day_of_week, start_time, end_time
               FROM Classes
               WHERE teacher_id = ?
                 AND day_of_week = ?
                 AND start_time < ?
                 AND end_time > ?`;
  const params = [teacherId, day_of_week, end_time, start_time];

  if (excludeClassId) {
    query += ' AND class_id <> ?';
    params.push(excludeClassId);
  }

  query += ' LIMIT 1';

  const [rows] = await pool.query(query, params);
  return rows[0] || null;
};

const findOwnedClass = async (classId, teacherId) => {
  const [rows] = await pool.query(
    'SELECT class_id FROM Classes WHERE class_id = ? AND teacher_id = ?',
    [classId, teacherId]
  );
  return rows[0] || null;
};

const updateClass = async (classId, payload) => {
  await pool.query(
    'UPDATE Classes SET day_of_week = ?, start_time = ?, end_time = ? WHERE class_id = ?',
    [payload.day_of_week, payload.start_time, payload.end_time, classId]
  );
};

const deleteClass = async (classId) => {
  await pool.query('DELETE FROM Classes WHERE class_id = ?', [classId]);
};

const getCourses = async () => {
  const [rows] = await pool.query('SELECT * FROM Courses ORDER BY course_code');
  return rows;
};

const getCourseByCode = async (courseCode) => {
  const [rows] = await pool.query('SELECT * FROM Courses WHERE course_code = ?', [courseCode]);
  return rows[0] || null;
};

const getCurrentStage = async () => {
  const [rows] = await pool.query('SELECT current_stage FROM SystemState WHERE id = 1');
  return rows[0]?.current_stage || 'create_class';
};

module.exports = {
  getMyClasses,
  getSchedule,
  findCourseByCode,
  createClass,
  findTimeConflict,
  findOwnedClass,
  updateClass,
  deleteClass,
  getCourses,
  getCourseByCode,
  getCurrentStage,
};
