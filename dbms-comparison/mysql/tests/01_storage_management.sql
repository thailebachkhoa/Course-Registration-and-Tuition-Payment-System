USE course_comparison;

SELECT '01 DATA STORAGE & MANAGEMENT - MySQL normalized authoritative tables' AS topic;

SELECT 'Departments' AS table_name, COUNT(*) AS row_count FROM Departments
UNION ALL SELECT 'Users', COUNT(*) FROM Users
UNION ALL SELECT 'Courses', COUNT(*) FROM Courses
UNION ALL SELECT 'Classes', COUNT(*) FROM Classes
UNION ALL SELECT 'Enrollments', COUNT(*) FROM Enrollments
UNION ALL SELECT 'StudentAccounts', COUNT(*) FROM StudentAccounts
UNION ALL SELECT 'TuitionPayments', COUNT(*) FROM TuitionPayments
UNION ALL SELECT 'AuditLogs', COUNT(*) FROM AuditLogs
UNION ALL SELECT 'SystemState', COUNT(*) FROM SystemState;

SELECT 'Foreign keys proving referential integrity' AS evidence;
SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'course_comparison'
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, COLUMN_NAME;

SELECT 'Relational join: student schedule assembled from normalized tables' AS demo;
SELECT e.student_id, co.course_code, co.course_name, cl.class_code, cl.room, e.status, e.tuition_amount
FROM Enrollments e
JOIN Classes cl ON cl.class_id = e.class_id
JOIN Courses co ON co.course_code = cl.course_code
WHERE e.student_id = 'student00001'
ORDER BY e.enrolled_at
LIMIT 10;
