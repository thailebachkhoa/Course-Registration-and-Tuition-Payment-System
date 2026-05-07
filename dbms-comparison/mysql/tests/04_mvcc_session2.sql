USE course_comparison;

SELECT 'MYSQL MVCC SESSION 2 - T2 waits for T1 snapshot, then updates' AS step;
SELECT SLEEP(2) AS sleep_return_code;
START TRANSACTION;
UPDATE StudentAccounts
SET balance = balance + 100000, version = version + 1, updated_at = NOW()
WHERE student_id = 'student00004';
COMMIT;
SELECT 'T2 committed update' AS step;
SELECT student_id, balance, version FROM StudentAccounts WHERE student_id = 'student00004';
