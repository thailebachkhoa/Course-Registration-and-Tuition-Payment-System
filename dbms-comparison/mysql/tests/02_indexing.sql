USE course_comparison;

SET SESSION cte_max_recursion_depth = 100000;

SELECT '02 INDEXING - MySQL before/after indexes on 100k enrollments and 100k audit logs' AS topic;

DROP TABLE IF EXISTS EnrollmentsNoIndex;
DROP TABLE IF EXISTS AuditLogsNoIndex;

CREATE TABLE EnrollmentsNoIndex AS SELECT * FROM Enrollments;
CREATE TABLE AuditLogsNoIndex AS SELECT * FROM AuditLogs;

SELECT 'Dataset sizes used for indexing comparison' AS evidence;
SELECT 'Enrollments' AS dataset, COUNT(*) AS row_count FROM Enrollments
UNION ALL
SELECT 'AuditLogs', COUNT(*) FROM AuditLogs;

SELECT 'WITHOUT secondary index: scan copied enrollment table' AS demo;
EXPLAIN ANALYZE
SELECT *
FROM EnrollmentsNoIndex
WHERE student_id = 'student00005' AND status = 'enrolled';

SELECT 'WITH composite index idx_enrollments_student_status' AS demo;
EXPLAIN ANALYZE
SELECT *
FROM Enrollments
WHERE student_id = 'student00005' AND status = 'enrolled';

SELECT 'WITHOUT actor/time index: scan copied audit log table' AS demo;
EXPLAIN ANALYZE
SELECT *
FROM AuditLogsNoIndex
WHERE actor_user_id = 'student00001'
ORDER BY created_at DESC
LIMIT 20;

SELECT 'WITH composite index idx_logs_actor_created' AS demo;
EXPLAIN ANALYZE
SELECT *
FROM AuditLogs
WHERE actor_user_id = 'student00001'
ORDER BY created_at DESC
LIMIT 20;

SELECT 'FULLTEXT index on course_name + description' AS demo;
EXPLAIN ANALYZE
SELECT course_code, course_name
FROM Courses
WHERE MATCH(course_name, description) AGAINST('database transaction recovery' IN NATURAL LANGUAGE MODE);

SELECT 'PARTIAL INDEX EMULATION - MySQL uses functional index for pending payment subset' AS demo;
CREATE INDEX idx_enrollments_payment_request_student_expr
ON EnrollmentsNoIndex ((CASE WHEN payment_requested = TRUE THEN student_id ELSE NULL END));

EXPLAIN ANALYZE
SELECT enrollment_id, student_id, status, payment_requested
FROM EnrollmentsNoIndex
WHERE (CASE WHEN payment_requested = TRUE THEN student_id ELSE NULL END) = 'student00005'
LIMIT 20;

SELECT 'WRITE COST - compare insert into table with few indexes vs many indexes' AS demo;
DROP TABLE IF EXISTS WriteLight;
DROP TABLE IF EXISTS WriteHeavy;

CREATE TABLE WriteLight (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  class_id INT NOT NULL,
  status VARCHAR(20) NOT NULL,
  note VARCHAR(160) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE WriteHeavy LIKE WriteLight;
CREATE INDEX idx_write_heavy_student_status ON WriteHeavy(student_id, status);
CREATE INDEX idx_write_heavy_class_status ON WriteHeavy(class_id, status);
CREATE INDEX idx_write_heavy_note_prefix ON WriteHeavy(note(40));

SET @t0 = NOW(6);
INSERT INTO WriteLight(student_id, class_id, status, note)
WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 3000
)
SELECT CONCAT('student', LPAD((n % 2000) + 1, 5, '0')), (n % 240) + 1, IF(n % 2 = 0, 'enrolled', 'payed'), CONCAT('light write benchmark ', n)
FROM seq;
SELECT TIMESTAMPDIFF(MICROSECOND, @t0, NOW(6)) / 1000 AS write_light_ms;

SET @t0 = NOW(6);
INSERT INTO WriteHeavy(student_id, class_id, status, note)
WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 3000
)
SELECT CONCAT('student', LPAD((n % 2000) + 1, 5, '0')), (n % 240) + 1, IF(n % 2 = 0, 'enrolled', 'payed'), CONCAT('heavy write benchmark ', n)
FROM seq;
SELECT TIMESTAMPDIFF(MICROSECOND, @t0, NOW(6)) / 1000 AS write_heavy_ms;
