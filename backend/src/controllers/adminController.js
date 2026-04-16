const pool = require('../config/db');

const STAGES = ['create_class', 'register_class', 'lock_class', 'scheduled_class'];

// GET /api/admin/stage
const getStage = async (req, res) => {
  const [rows] = await pool.query('SELECT current_stage FROM SystemState WHERE id = 1');
  res.json({ stage: rows[0].current_stage });
};

// POST /api/admin/stage/next  — UPDATE (c)
const nextStage = async (req, res) => {
  const [rows] = await pool.query('SELECT current_stage FROM SystemState WHERE id = 1');
  const current = rows[0].current_stage;
  const idx = STAGES.indexOf(current);
  const next = STAGES[(idx + 1) % STAGES.length];

  await pool.query('UPDATE SystemState SET current_stage = ? WHERE id = 1', [next]);

  // If transitioning from scheduled_class -> create_class, wipe classes & enrollments (b)
  if (current === 'scheduled_class' && next === 'create_class') {
    await pool.query('DELETE FROM Enrollments');
    await pool.query('DELETE FROM Classes');
  }

  res.json({ stage: next, message: `Chuyển sang: ${next}` });
};

// GET /api/admin/payment-requests — list students who requested payment
const getPaymentRequests = async (req, res) => {
  // Aggregate: student info + SUM credits (h)
  const [rows] = await pool.query(`
    SELECT
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
    ORDER BY u.full_name
  `);
  res.json(rows);
};

// POST /api/admin/approve-payment/:studentId — UPDATE enrolled -> payed (c)
const approvePayment = async (req, res) => {
  const { studentId } = req.params;
  await pool.query(
    `UPDATE Enrollments SET status = 'payed', payment_requested = FALSE
     WHERE student_id = ? AND payment_requested = TRUE AND status = 'enrolled'`,
    [studentId]
  );
  res.json({ message: 'Đã xác nhận học phí' });
};

module.exports = { getStage, nextStage, getPaymentRequests, approvePayment };