-- ============================================================================
-- DEMO 03: Race Condition - MySQL/InnoDB
-- ============================================================================
--
-- Race Condition xảy ra khi hai hay nhiều transactions cùng truy cập và
-- modify cùng dữ liệu một cách không kiểm soát, dẫn đến inconsistent state.
--
-- Nguyên nhân: 
-- - Không dùng lock (SELECT ... FOR UPDATE)
-- - Không dùng transaction
-- - Read-Check-Write pattern không atomic
--
-- MySQL cho phép race condition nếu code không cẩn thận
-- ============================================================================

-- SETUP
SELECT 'DEMO 1: Race Condition - Double Payment' AS section;
SELECT 'Situation: Two concurrent payment requests for same enrollment' AS description;

SELECT 'Ban dau: Enrollment student001 - class 1' AS step;
SELECT id, student_id, class_id, status FROM Enrollments 
WHERE student_id = 'student001' AND class_id = 1;

-- ============================================================================
-- SCENARIO: Race Condition trong Payment Processing
-- 
-- Kịch bản: Hai client gọi payment handler cùng lúc
-- 1. Check: SELECT status FROM Enrollments
-- 2. Verify: if status == 'enrolled' then
-- 3. Update: UPDATE status = 'payed'
-- 4. Record: INSERT INTO transaction log
-- 
-- Problem: Without FOR UPDATE, both T1 & T2 có thể CÙNG thấy status='enrolled'
--          -> Cả 2 đều update status -> Double charging ở application level
-- ============================================================================

-- STEP 1: T1 & T2 BOTH START
SELECT 'T1 START' AS T1;
START TRANSACTION;

-- T2 START (in another session - simulated)
-- START TRANSACTION;

-- STEP 2: T1 - Read WITHOUT LOCK (RACE CONDITION!)
SELECT 'T1: Check enrollment status - NO LOCK' AS T1_action;
SELECT @enrollment_id := id, @current_status := status 
FROM Enrollments
WHERE student_id = 'student001' AND class_id = 1;

SELECT CONCAT('T1 thay status = ', @current_status) AS T1_read;

-- ============================================================================
-- [T2 SAY TIME - vẫn trong T1 transaction]
-- T2 cũng đọc: SELECT status từ Enrollments -> thấy 'enrolled'
-- T2 UPDATE: UPDATE Enrollments SET status = 'payed'
-- T2 COMMIT
-- 
-- Khi T1 quay lại:
-- ============================================================================

-- STEP 3: T1 kiểm tra điều kiện (application level)
SELECT 'T1: Check: if status == "enrolled"' AS T1_check;
IF @current_status = 'enrolled' THEN
  SELECT 'Condition TRUE - Proceed with payment' AS T1_check_result;
ELSE
  SELECT 'Condition FALSE - Skip' AS T1_check_result;
END IF;

-- STEP 4: T1 update (KHÔNG BIẾT T2 đã update)
SELECT 'T1: UPDATE status = "payed"' AS T1_update;
UPDATE Enrollments
SET status = 'payed'
WHERE id = @enrollment_id;

-- STEP 5: T1 record transaction
SELECT 'T1: Record payment transaction' AS T1_action;
-- INSERT INTO Transactions (enrollment_id, amount, status)
-- VALUES (@enrollment_id, 1000000, 'completed');

COMMIT;

SELECT 'T1: COMMIT' AS T1_action;
SELECT 'RESULT: Race condition - double payment recorded!' AS result;

-- ============================================================================
-- DEMO 2: Preventing Race Condition dengan SELECT FOR UPDATE
-- ============================================================================

SELECT 'DEMO 2: Preventing Race Condition with SELECT FOR UPDATE' AS section;
SELECT 'Reset: Enrollment back to enrolled' AS step;
UPDATE Enrollments SET status = 'enrolled' WHERE id = 1;
SELECT id, student_id, status FROM Enrollments WHERE id = 1;

-- CORRECT APPROACH
SELECT 'T1 (FIXED): START TRANSACTION' AS T1_action;
START TRANSACTION;

-- READ WITH LOCK (Acquire exclusive lock immediately)
SELECT 'T1 (FIXED): SELECT FOR UPDATE - Acquire exclusive lock' AS T1_action;
SELECT @fixed_id := id, @fixed_status := status
FROM Enrollments
WHERE student_id = 'student001' AND class_id = 1
FOR UPDATE;

SELECT CONCAT('T1 acquired exclusive lock. Status = ', @fixed_status) AS T1_status;

-- ============================================================================
-- [T2 SAY TIME - cố gắng update]
-- T2: SELECT ... FOR UPDATE -> BLOCK (lock held by T1)
-- T2 phải chờ đến khi T1 COMMIT
-- ============================================================================

SELECT 'T1: Check condition (protected by lock)' AS T1_action;
IF @fixed_status = 'enrolled' THEN
  SELECT 'Condition TRUE - Proceed with payment (protected)' AS T1_result;
  UPDATE Enrollments SET status = 'payed' WHERE id = @fixed_id;
ELSE
  SELECT 'Condition FALSE - Rollback' AS T1_result;
  ROLLBACK;
END IF;

COMMIT;
SELECT 'T1: COMMIT - No race condition!' AS T1_action;

-- ============================================================================
-- DEMO 3: Race Condition - Over-enrollment (Capacity Check)
-- ============================================================================
--
-- Kịch bản: Class có capacity 3, nhưng 4 students cọ gắng enroll đồng thời
--
-- Tanpa Row-Level Lock:
-- - T1 & T2 & T3 cùng SELECT COUNT(*) -> all see count=2, capacity=3
-- - Cả 3 INSERT thành công -> enrolled_count = 5 (vượt capacity!)
-- ============================================================================

SELECT 'DEMO 3: Race Condition - Over-enrollment' AS section;
SELECT 'Class 1 current state:' AS step;
SELECT class_id, capacity, enrolled_count FROM Classes WHERE class_id = 1;
SELECT COUNT(*) as enrolled_students FROM Enrollments WHERE class_id = 1;

-- UNSAFE VERSION (Race condition)
SELECT 'Unsafe: Without lock' AS approach;

SELECT 'T1: Check class capacity' AS T1;
START TRANSACTION;
SELECT @capacity := capacity, @current_enrolled := enrolled_count
FROM Classes WHERE class_id = 1;

SELECT CONCAT('T1: Current enrolled = ', @current_enrolled, ', Capacity = ', @capacity) AS check;

-- ============================================================================
-- [T2, T3, T4 cùng do giống T1 tại đây - all see same count]
-- ============================================================================

SELECT 'T1: IF current_enrolled < capacity' AS logic;
IF @current_enrolled < @capacity THEN
  SELECT 'INSERT INTO Enrollments' AS action;
  INSERT INTO Enrollments (student_id, class_id, status)
  VALUES ('student_new_t1', 1, 'enrolled');
  
  UPDATE Classes SET enrolled_count = enrolled_count + 1 WHERE class_id = 1;
END IF;

COMMIT;

SELECT 'Ket qua sau T1 (giả sử T2,T3,T4 cũng làm):' AS step;
SELECT COUNT(*) as total_enrolled FROM Enrollments WHERE class_id = 1;
SELECT enrolled_count FROM Classes WHERE class_id = 1;
SELECT 'May bi over-enrollment!' AS result;

-- RESET
DELETE FROM Enrollments WHERE student_id LIKE 'student_new%';
UPDATE Classes SET enrolled_count = 3 WHERE class_id = 1;

-- ============================================================================
-- DEMO 4: Preventing Over-enrollment with Row Lock
-- ============================================================================

SELECT 'DEMO 4: Preventing Over-enrollment with FOR UPDATE' AS section;

SELECT 'Safe version: With row lock' AS approach;
START TRANSACTION;

SELECT 'Acquire exclusive lock on class row' AS action;
SELECT @cap := capacity, @enr := enrolled_count
FROM Classes 
WHERE class_id = 1
FOR UPDATE;

SELECT CONCAT('T1: Locked. Current enrolled = ', @enr, ', Capacity = ', @cap) AS check;

IF @enr < @cap THEN
  SELECT 'INSERT - Protected by lock' AS action;
  INSERT INTO Enrollments (student_id, class_id, status)
  VALUES ('student_safe_t1', 1, 'enrolled');
  
  UPDATE Classes SET enrolled_count = enrolled_count + 1 WHERE class_id = 1;
  SELECT 'Successfully enrolled' AS result;
ELSE
  SELECT 'Class FULL - Cannot enroll' AS result;
  ROLLBACK;
END IF;

COMMIT;

SELECT 'Final state:' AS step;
SELECT COUNT(*) as total FROM Enrollments WHERE class_id = 1;
SELECT enrolled_count FROM Classes WHERE class_id = 1;

-- ============================================================================
-- DEMO 5: Race Condition - Lost Update
-- ============================================================================
--
-- Lost Update: Transaction T1 update, Transaction T2 update cùng dữ liệu
-- nhưng read cùng giá trị cũ
--
-- T1: Read value = 100
-- T2: Read value = 100
-- T1: Update to 110 (100 + 10)
-- T2: Update to 150 (100 + 50)
-- Result: Lost T1's update, T2 wins
-- ============================================================================

SELECT 'DEMO 5: Lost Update Race Condition' AS section;

SELECT 'Ban dau: Student001 balance' AS step;
SELECT @bal := balance FROM BankAccounts WHERE student_id = 'student001';
SELECT CONCAT('Balance = ', @bal) AS initial;

-- T1 & T2 start together
SELECT 'T1: Read balance (no lock)' AS T1;
START TRANSACTION;
SELECT @t1_balance := balance FROM BankAccounts 
WHERE student_id = 'student001';

-- ============================================================================
-- [T2 cùng time]
-- T2: SELECT @t2_balance := balance ... -> cùng thấy @t1_balance
-- ============================================================================

-- T1 update
SELECT 'T1: Increase by 100000' AS T1;
SET @t1_balance = @t1_balance + 100000;
UPDATE BankAccounts SET balance = @t1_balance WHERE student_id = 'student001';
COMMIT;

-- T2 would do same but with different amount
-- UPDATE BankAccounts SET balance = @t2_balance + 50000 WHERE student_id = 'student001';

SELECT 'After T1 COMMIT:' AS step;
SELECT balance FROM BankAccounts WHERE student_id = 'student001';
SELECT 'T1 update preserved, but if T2 follow same pattern, T1 update would be lost' AS note;

-- ============================================================================
-- DEMO 6: Fix with Optimistic Locking (Version Column)
-- ============================================================================

SELECT 'DEMO 6: Preventing Lost Update with Version Column' AS section;

SELECT 'Before: account version' AS step;
SELECT account_id, balance, version FROM BankAccounts WHERE student_id = 'student001';

START TRANSACTION;
SELECT @prev_balance := balance, @prev_version := version
FROM BankAccounts
WHERE student_id = 'student001';

-- Simulate check condition & calculation
SET @new_balance = @prev_balance + 50000;

-- Update only if version hasn't changed
SELECT 'Update with version check:' AS action;
UPDATE BankAccounts 
SET balance = @new_balance, version = version + 1
WHERE student_id = 'student001' AND version = @prev_version;

SELECT ROW_COUNT() as rows_affected;

IF ROW_COUNT() = 1 THEN
  SELECT 'Update successful - version not changed' AS result;
ELSE
  SELECT 'Update failed - version changed (concurrent update detected)' AS result;
  ROLLBACK;
END IF;

COMMIT;

SELECT 'After version-checked update:' AS step;
SELECT account_id, balance, version FROM BankAccounts WHERE student_id = 'student001';
