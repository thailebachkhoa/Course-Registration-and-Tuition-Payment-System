USE course_comparison;

SELECT '04 CONCURRENCY CONTROL - MySQL row lock and optimistic version check' AS topic;
SELECT @@transaction_isolation AS isolation_level;
SELECT 'For the two-session MVCC snapshot demo, run scripts/run-mvcc-demo.ps1' AS mvcc_demo_note;

SELECT 'Atomic capacity guard using one UPDATE predicate' AS demo;
SELECT class_id, capacity, enrolled_count FROM Classes WHERE class_id = 29;
START TRANSACTION;
UPDATE Classes
SET enrolled_count = enrolled_count + 1
WHERE class_id = 29 AND enrolled_count < capacity;
SELECT ROW_COUNT() AS capacity_update_rows;
COMMIT;
SELECT class_id, capacity, enrolled_count FROM Classes WHERE class_id = 29;

SELECT 'Row-level lock with SELECT ... FOR UPDATE' AS demo;
START TRANSACTION;
SELECT account_id, student_id, balance, version FROM StudentAccounts WHERE student_id = 'student00002' FOR UPDATE;
UPDATE StudentAccounts
SET balance = balance - 600000, version = version + 1, updated_at = NOW()
WHERE student_id = 'student00002' AND balance >= 600000;
COMMIT;
SELECT account_id, student_id, balance, version FROM StudentAccounts WHERE student_id = 'student00002';

SELECT 'Optimistic concurrency by version column' AS demo;
SET @old_version := (SELECT version FROM Enrollments WHERE enrollment_id = 2);
UPDATE Enrollments SET payment_requested = TRUE, version = version + 1 WHERE enrollment_id = 2 AND version = @old_version;
SELECT ROW_COUNT() AS optimistic_update_rows;
UPDATE Enrollments SET payment_requested = FALSE, version = version + 1 WHERE enrollment_id = 2 AND version = @old_version;
SELECT ROW_COUNT() AS stale_version_update_rows;

SELECT 'Lost update prevention: stale version update fails instead of overwriting newer data' AS demo;
SET @balance_before := (SELECT balance FROM StudentAccounts WHERE student_id = 'student00003');
SET @version_before := (SELECT version FROM StudentAccounts WHERE student_id = 'student00003');
UPDATE StudentAccounts SET balance = @balance_before + 100000, version = version + 1 WHERE student_id = 'student00003' AND version = @version_before;
SELECT ROW_COUNT() AS first_writer_rows;
UPDATE StudentAccounts SET balance = @balance_before + 50000, version = version + 1 WHERE student_id = 'student00003' AND version = @version_before;
SELECT ROW_COUNT() AS stale_second_writer_rows;
SELECT student_id, balance, version FROM StudentAccounts WHERE student_id = 'student00003';
