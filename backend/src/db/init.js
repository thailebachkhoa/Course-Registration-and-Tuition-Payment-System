// initalize database: create tables and set up admin account
// location: backend/src/db/init.js
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDb() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  console.log('✅ Connected to MySQL');

  // Run schema - FIX: path is relative to THIS file (src/db/)
  const schema = fs.readFileSync(
    path.join(__dirname, 'schema.sql'),
    'utf-8'
  );
  await conn.query(schema);
  console.log('✅ Schema applied');

  // Hash admin password and upsert
  const adminPass = await bcrypt.hash(
    process.env.ADMIN_PASSWORD || 'admin123',
    10
  );
  await conn.query(
    `UPDATE Users SET password = ? WHERE person_id = 'admin001'`,
    [adminPass]
  );
  console.log('✅ Admin account ready (email: admin@school.edu.vn, pass: admin123)');

  await conn.end();
  console.log('🎉 Database initialized successfully!');
}

initDb().catch((err) => {
  console.error('❌ DB init failed:', err.message);
  process.exit(1);
});