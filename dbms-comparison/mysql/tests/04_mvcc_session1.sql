USE course_comparison;

SELECT 'MYSQL MVCC SESSION 1 - T1 starts REPEATABLE READ transaction' AS step;
SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ;
START TRANSACTION;
SELECT 'T1 first read: snapshot is established here' AS step;
SELECT student_id, balance, version FROM StudentAccounts WHERE student_id = 'student00004';
SELECT 'T1 waits while Session 2 commits an update' AS step;
SELECT SLEEP(8) AS sleep_return_code;
SELECT 'T1 second read: still sees the original snapshot' AS step;
SELECT student_id, balance, version FROM StudentAccounts WHERE student_id = 'student00004';
COMMIT;
SELECT 'T1 after COMMIT: a new read sees Session 2 committed value' AS step;
SELECT student_id, balance, version FROM StudentAccounts WHERE student_id = 'student00004';
