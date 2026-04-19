const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDb() {
	const conn = await mysql.createConnection({
		host: process.env.DB_HOST || 'localhost',
		port: Number(process.env.DB_PORT || 3306),
		user: process.env.DB_USER || 'appuser',
		password: process.env.DB_PASSWORD || '',
		database: process.env.DB_NAME || 'appdb',
		multipleStatements: true,
	});

	console.log('Connected to MySQL');

	const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
	await conn.query(schema);
	console.log('Schema applied');

	const adminPass = await bcrypt.hash('admin123', 10);
	await conn.query(`UPDATE Users SET password = ? WHERE person_id = 'admin001'`, [adminPass]);
	console.log('Admin account ready (email: admin@school.edu.vn, pass: admin123)');

	await conn.end();
	console.log('Database initialized successfully');
}

initDb().catch((err) => {
	console.error('DB init failed:', err.message);
	process.exit(1);
});
