const pool = require('../database/pool');

const findUserByPersonIdOrEmail = async (personId, email) => {
  const [rows] = await pool.query(
    'SELECT person_id, email FROM Users WHERE person_id = ? OR email = ?',
    [personId, email]
  );
  return rows;
};

const createUser = async (payload) => {
  const [result] = await pool.query(
    'INSERT INTO Users (person_id, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
    [payload.person_id, payload.email, payload.password, payload.full_name, payload.role]
  );
  return result;
};

const findUserByIdentifier = async (identifier) => {
  const [rows] = await pool.query(
    'SELECT person_id, email, password, full_name, role FROM Users WHERE LOWER(email) = LOWER(?) OR person_id = ?',
    [identifier, identifier]
  );
  return rows[0] || null;
};

const getCurrentStage = async () => {
  const [rows] = await pool.query('SELECT current_stage FROM SystemState WHERE id = 1');
  return rows[0]?.current_stage || 'create_class';
};

module.exports = {
  findUserByPersonIdOrEmail,
  createUser,
  findUserByIdentifier,
  getCurrentStage,
};
