-- ============================================================================
-- DEMO 02: Row-Level Lock - MySQL/InnoDB
-- ============================================================================
--
-- MySQL/InnoDB sử dụng row-level locking để kiểm soát truy cập đồng thời.
-- Có hai loại lock chính:
-- 1. Shared Lock (S-lock): Cho phép đọc, nhưng ngăn chặn ghi
-- 2. Exclusive Lock (X-lock): Ngăn chặn cả đọc và ghi từ transactions khác
--
-- Kịch bản:
-- - T1 khóa một bản ghi với UPDATE (exclusive lock)
-- - T2 cố gắng UPDATE bản ghi đó - sẽ chặn (block)
-- - T1 COMMIT -> T2 được tiếp tục
-- ============================================================================

-- SETUP: Kiểm tra trạng thái ban đầu
SELECT 'DEMO 1: Row-Level Lock - Exclusive Lock Block' AS section;
SELECT 'Ban dau: Bank accounts cua cac sinh vien' AS step;
SELECT account_id, student_id, balance, version FROM BankAccounts ORDER BY account_id;

-- ============================================================================
-- STEP 1: T1 - Bắt đầu transaction, khóa bản ghi
-- ============================================================================

SELECT 'T1: START TRANSACTION' AS T1_action;
START TRANSACTION;

SELECT 'T1: UPDATE balance (acquire exclusive lock)' AS T1_action;
UPDATE BankAccounts 
SET balance = balance + 50000, version = version + 1
WHERE student_id = 'student001';

SELECT 'T1: Lock acquired (dao tham gia)' AS T1_action;

-- ============================================================================
-- STEP 2: T2 cố gắng UPDATE cùng bản ghi (sẽ bị chặn)
-- ============================================================================
-- [Chạy trong session khác]
-- START TRANSACTION;
-- UPDATE BankAccounts 
-- SET balance = balance - 30000, version = version + 1
-- WHERE student_id = 'student001';
-- -- Sẽ BỊ BLOCK cho đến khi T1 COMMIT
-- ============================================================================

-- STEP 3: Xem lock info (nếu có tool monitor)
SELECT 'T1: Dang gio lock' AS T1_action;
SELECT 'Cho den khi T2 timeout hoac T1 commit' AS T1_action;

-- STEP 4: T1 COMMIT - Giải phóng lock
SELECT 'T1: COMMIT - Release lock' AS T1_action;
COMMIT;

SELECT 'T1: Lock released' AS T1_action;
SELECT 'Ket qua sau T1 COMMIT:' AS step;
SELECT account_id, student_id, balance, version FROM BankAccounts WHERE student_id = 'student001';

-- ============================================================================
-- DEMO 2: Shared Lock (SELECT FOR SHARE)
-- ============================================================================
--
-- Shared lock cho phép multiple transactions đọc cùng lúc
-- nhưng ngăn chặn transaction khác UPDATE
--
-- T1: SELECT FOR SHARE (read + prevent write)
-- T2: Có thể SELECT FOR SHARE (cùng được đọc)
-- T2: Không thể UPDATE (sẽ bị block)
-- ============================================================================

SELECT 'DEMO 2: Row-Level Lock - Shared Lock' AS section;

SELECT 'Ban dau: Enrollment cua student001' AS step;
SELECT id, student_id, class_id, status FROM Enrollments WHERE student_id = 'student001';

SELECT 'T1: SELECT FOR SHARE (acquire shared lock)' AS T1_action;
START TRANSACTION;
SELECT @enrollment_id := id, @status := status 
FROM Enrollments 
WHERE student_id = 'student001'
FOR SHARE;

SELECT CONCAT('T1 acquired shared lock. Can read but prevents write') AS T1_status;

-- ============================================================================
-- [Trong T2]
-- START TRANSACTION;
-- SELECT * FROM Enrollments WHERE student_id = 'student001' FOR SHARE;
-- -- Duoc phep - shared lock compatible voi shared lock
-- 
-- UPDATE Enrollments SET status = 'dropped' WHERE student_id = 'student001';
-- -- BLOCK - exclusive lock conflict voi shared lock T1
-- ============================================================================

-- STEP 3: T1 COMMIT
SELECT 'T1: COMMIT - Release shared lock' AS T1_action;
COMMIT;

-- ============================================================================
-- DEMO 3: Exclusive Lock (SELECT FOR UPDATE)
-- ============================================================================
--
-- Exclusive lock ngăn chặn cả read (FOR SHARE) và write (FOR UPDATE)
-- từ các transactions khác
--
-- Kịch bản: Enrollment có thể thay đổi -> cần exclusive lock
-- ============================================================================

SELECT 'DEMO 3: Row-Level Lock - Exclusive Lock (FOR UPDATE)' AS section;

SELECT 'Ban dau: Enrollments tai class_id=1' AS step;
SELECT id, student_id, class_id, status FROM Enrollments WHERE class_id = 1;

SELECT 'T1: SELECT FOR UPDATE (acquire exclusive lock)' AS T1_action;
START TRANSACTION;
SELECT id, student_id, status 
FROM Enrollments 
WHERE class_id = 1
FOR UPDATE;

SELECT 'T1: Exclusive lock acquired - no other transaction can read/write these rows' AS T1_status;

-- ============================================================================
-- [Trong T2]
-- START TRANSACTION;
-- SELECT * FROM Enrollments WHERE class_id = 1 FOR SHARE;
-- -- BLOCK - shared lock conflicts with exclusive lock T1
-- ============================================================================

SELECT 'T1 dang giu lock - chi the COMMIT de giai phong' AS instruction;

COMMIT;

SELECT 'T1: COMMIT - Exclusive lock released' AS T1_action;

-- ============================================================================
-- DEMO 4: Lock Escalation - Khi SELECT FOR UPDATE + UPDATE
-- ============================================================================
--
-- Khi một transaction SELECT FOR UPDATE và sau đó UPDATE,
-- InnoDB sẽ upgrade lock từ intent lock lên exclusive lock
--
-- ============================================================================

SELECT 'DEMO 4: Lock Action - Intention Lock + Update' AS section;

SELECT 'Ban dau: Bank account student002' AS step;
SELECT account_id, student_id, balance FROM BankAccounts WHERE student_id = 'student002';

SELECT 'T1: SELECT FOR UPDATE' AS T1_action;
START TRANSACTION;
SELECT account_id, balance 
FROM BankAccounts 
WHERE student_id = 'student002'
FOR UPDATE;

SELECT 'T1: Now UPDATE - lock already held' AS T1_action;
UPDATE BankAccounts 
SET balance = balance + 100000
WHERE student_id = 'student002';

SELECT 'T1: Row successfully updated' AS T1_status;
SELECT 'Ket qua:' AS step;
SELECT account_id, student_id, balance FROM BankAccounts WHERE student_id = 'student002';

COMMIT;

SELECT 'T1: COMMIT' AS T1_action;
