/**
 * Load demo data into the database
 * Usage: npm run init-demo-data
 * 
 * Prerequisites:
 * 1. Schema must be already initialized (npm run init-db)
 * 2. Database connection vars in .env must be set
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function initDemoData() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.DB_PASS || 'password',
    database: process.env.DB_NAME || 'course_registration',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    const connection = await pool.getConnection();
    console.log('✓ Connected to MySQL');

    // Read demo data SQL file
    const demoDataPath = path.join(__dirname, 'demo-data.sql');
    if (!fs.existsSync(demoDataPath)) {
      throw new Error(`Demo data file not found: ${demoDataPath}`);
    }

    const sqlContent = fs.readFileSync(demoDataPath, 'utf8');
    
    // Split by newlines and execute statements
    // (Simple split by semicolon with comment removal)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--')); // Remove empty and comment-only lines

    console.log(`Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      try {
        await connection.query(statements[i]);
        console.log(`  [${i + 1}/${statements.length}] Executed`);
      } catch (err) {
        // Some statements might fail if data already exists, that's okay
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`  [${i + 1}/${statements.length}] Skipped (data exists)`);
        } else {
          console.warn(`  [${i + 1}/${statements.length}] Warning:`, err.message);
        }
      }
    }

    // Hash and update demo user passwords
    const defaultPassword = 'demo123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    console.log('\nHashing demo user passwords...');
    await connection.query(
      'UPDATE Users SET password = ? WHERE role IN ("student", "teacher") AND person_id LIKE "student_%" OR person_id LIKE "teacher_%"',
      [hashedPassword]
    );
    
    // Also update admin password if using demo DB
    const demoAdminPass = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
    await connection.query(
      'UPDATE Users SET password = ? WHERE person_id = "admin_001"',
      [demoAdminPass]
    );
    console.log('✓ Passwords hashed and updated');

    connection.release();
    console.log('\n✓ Demo data loaded successfully');
    console.log('\nDemo credentials ready:');
    console.log(`  - Admin:    admin_001 / admin@school.edu.vn (password: admin123)`);
    console.log(`  - Teachers: teacher_001-004 / (password: demo123)`);
    console.log(`  - Students: student_001-006 / (password: demo123)`);
    console.log('\nReady for presentation!');

  } catch (error) {
    console.error('✗ Error loading demo data:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run
initDemoData();
