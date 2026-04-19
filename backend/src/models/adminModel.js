const pool = require('../database/pool');

const getCurrentStage = async () => {
  const [rows] = await pool.query('SELECT current_stage FROM SystemState WHERE id = 1');
  return rows[0]?.current_stage;
};

const updateStage = async (nextStage) => {
  await pool.query('UPDATE SystemState SET current_stage = ? WHERE id = 1', [nextStage]);
};

const clearRegistrationData = async () => {
  await pool.query('DELETE FROM Enrollments');
  await pool.query('DELETE FROM Classes');
};

const getPaymentRequests = async () => {
  const [rows] = await pool.query(
    `SELECT
      u.person_id,
      u.full_name,
      SUM(c2.credits) * 600000 AS total_amount,
      COUNT(e.id) AS class_count
     FROM Users u
     JOIN Enrollments e ON e.student_id = u.person_id
     JOIN Classes cl ON cl.class_id = e.class_id
     JOIN Courses c2 ON c2.course_code = cl.course_code
     WHERE e.payment_requested = TRUE AND e.status = 'enrolled'
     GROUP BY u.person_id, u.full_name
     ORDER BY u.full_name`
  );
  return rows;
};

const approvePayment = async (studentId) => {
  const [result] = await pool.query(
    `UPDATE Enrollments SET status = 'payed', payment_requested = FALSE
     WHERE student_id = ? AND payment_requested = TRUE AND status = 'enrolled'`,
    [studentId]
  );
  return result.affectedRows;
};

module.exports = {
  getCurrentStage,
  updateStage,
  clearRegistrationData,
  getPaymentRequests,
  approvePayment,
};
