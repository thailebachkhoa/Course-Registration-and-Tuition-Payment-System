-- ============================================================================
-- DEMO 01: MVCC (Multi-Version Concurrency Control) - MySQL/InnoDB
-- ============================================================================
-- 
-- MVCC cho phép multiple transactions đọc dữ liệu mà không cần lock.
-- Mỗi transaction thấy một "consistent snapshot" của dữ liệu dựa trên
-- transaction ID (trx_id) tại thời điểm transaction bắt đầu.
--
-- Kịch bản: 
-- - Transaction 1 (T1) bắt đầu và đọc balance
-- - Transaction 2 (T2) update balance
-- - T1 đọc lại balance - vẫn thấy giá trị cũ (snapshot isolation)
-- ============================================================================

-- STEP 1: Xem trạng thái ban đầu
SELECT 'STEP 1: Ban dau - Xem balance cua student001' AS step;
SELECT account_id, student_id, balance, version FROM BankAccounts WHERE student_id = 'student001';

-- STEP 2: Transaction T1 bắt đầu (READ REPEATABLE READ)
START TRANSACTION;

SELECT 'T1 (REPEATABLE READ): Doc balance lan 1' AS T1_Step;
SELECT @initial_balance := balance FROM BankAccounts WHERE student_id = 'student001';
SELECT CONCAT('T1 nhin thay balance = ', @initial_balance) AS T1_View;

-- ============================================================================
-- [TRONG TRANSACTION T2 LAN 1 - Chay trong session khac]
-- (Simulation: chi de minh hoa khong thuc thi)
-- 
-- START TRANSACTION;
-- UPDATE BankAccounts SET balance = balance - 100000, version = version + 1
-- WHERE student_id = 'student001';
-- COMMIT;
-- ============================================================================

-- STEP 3: T1 đọc lại cùng dữ liệu
SELECT 'T1 (sau khi T2 update): Doc balance lan 2' AS T1_Step;
SELECT @second_read := balance FROM BankAccounts WHERE student_id = 'student001';
SELECT CONCAT('T1 van nhin thay balance = ', @second_read, ' (snapshot isolation)') AS T1_View;

-- STEP 4: Commit T1
SELECT 'T1: COMMIT' AS T1_Step;
COMMIT;

-- STEP 5: Sau COMMIT - Thấy giá trị cập nhật từ T2
SELECT 'Sau COMMIT T1: Doc lai balance' AS step;
SELECT account_id, student_id, balance, version FROM BankAccounts WHERE student_id = 'student001';

-- ============================================================================
-- DEMO 2: MVCC với lọc bản ghi đã xóa
-- ============================================================================
-- 
-- Kịch bản:
-- - T1 bắt đầu, đếm tổng số Enrollments
-- - T2 xóa một enrollment
-- - T1 đếm lại - vẫn thấy số cũ (MVCC bảo vệ)
-- ============================================================================

SELECT 'DEMO 2: MVCC voi deleted records' AS section;

-- STEP 1: Initial state
SELECT 'Buoc 1: So luong enrollments ban dau' AS step;
SELECT COUNT(*) as enrollment_count FROM Enrollments;

-- STEP 2: T1 bắt đầu - Repeatable read
SELECT 'T1 START - Dem enrollments lan 1' AS T1_action;
START TRANSACTION;
SELECT @count1 := COUNT(*) FROM Enrollments;
SELECT CONCAT('T1 dem duoc: ', @count1) AS T1_result;

-- ============================================================================
-- [TRONG T2 LAN 2 - Chay trong session khac]
-- DELETE FROM Enrollments WHERE id = 1;
-- COMMIT;
-- ============================================================================

-- STEP 3: T1 đếm lại
SELECT 'T1: Dem enrollments lan 2 (sau khi T2 delete)' AS T1_action;
SELECT @count2 := COUNT(*) FROM Enrollments;
SELECT CONCAT('T1 van dem duoc: ', @count2, ' (MVCC consistent snapshot)') AS T1_result;

-- STEP 4: Commit T1
COMMIT;

SELECT 'Sau COMMIT T1: Dem lai' AS step;
SELECT COUNT(*) as enrollment_count FROM Enrollments;

-- ============================================================================
-- DEMO 3: MVCC - Phantom Read Protection (trong SERIALIZABLE)
-- ============================================================================
-- 
-- Giải thích:
-- - READ UNCOMMITTED: Dirty read có thể xảy ra
-- - READ COMMITTED: Non-repeatable read có thể xảy ra (mặc định ở MySQL kể từ 8.0)
-- - REPEATABLE READ: Phantom read có thể xảy ra (mặc định ở MySQL)
-- - SERIALIZABLE: Phantom read bị ngăn chặn
-- 
-- Kịch bản: Enroll nhiều sinh viên vào một class trong khi T1 đang đọc
-- ============================================================================

SELECT 'DEMO 3: Phantom Read trong REPEATABLE READ' AS section;

-- Check current isolation level
SELECT @@transaction_isolation as isolation_level;

SELECT 'Ban dau: Sinh vien dang dang ky class_id=1' AS step;
SELECT COUNT(*) as total FROM Enrollments WHERE class_id = 1 AND status = 'enrolled';

-- T1 bắt đầu
START TRANSACTION;
SELECT 'T1: Query enrollments o class_id=1 lan 1' AS action;
SELECT @phantom1 := COUNT(*) FROM Enrollments WHERE class_id = 1 AND status = 'enrolled';
SELECT CONCAT('T1 tim thay: ', @phantom1, ' enrollments') AS result;

-- ============================================================================
-- [TRONG T2 LAN 3 - Chay trong session khac]
-- INSERT INTO Enrollments (student_id, class_id, status) 
-- VALUES ('student_new', 1, 'enrolled');
-- COMMIT;
-- ============================================================================

-- T1 query lại
SELECT 'T1: Query enrollments o class_id=1 lan 2 (sau T2 insert)' AS action;
SELECT @phantom2 := COUNT(*) FROM Enrollments WHERE class_id = 1 AND status = 'enrolled';
SELECT CASE 
  WHEN @phantom2 = @phantom1 THEN CONCAT('T1 van thay: ', @phantom1, ' (phantom read duoc bao ve)')
  ELSE CONCAT('T1 thay: ', @phantom2, ' (phantom read xay ra)')
END AS result;

COMMIT;

SELECT 'Sau COMMIT T1' AS step;
SELECT COUNT(*) as total FROM Enrollments WHERE class_id = 1 AND status = 'enrolled';
