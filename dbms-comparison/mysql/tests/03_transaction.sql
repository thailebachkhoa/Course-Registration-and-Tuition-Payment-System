USE course_comparison;

SELECT '03 TRANSACTION - MySQL ACID payment workflow' AS topic;

SET @student_id := 'student00005';
SET @enrollment_id := (
  SELECT enrollment_id
  FROM Enrollments
  WHERE student_id = @student_id AND status = 'enrolled'
  ORDER BY enrollment_id
  LIMIT 1
);
SET @amount := (SELECT tuition_amount FROM Enrollments WHERE enrollment_id = @enrollment_id);

SELECT 'Before payment' AS phase;
SELECT account_id, student_id, balance, version FROM StudentAccounts WHERE student_id = @student_id;
SELECT enrollment_id, student_id, status, tuition_amount, version FROM Enrollments WHERE enrollment_id = @enrollment_id;

START TRANSACTION;
UPDATE StudentAccounts
SET balance = balance - @amount, version = version + 1, updated_at = NOW()
WHERE student_id = @student_id AND balance >= @amount;
SET @account_rows := ROW_COUNT();

UPDATE Enrollments
SET status = 'payed', payment_requested = FALSE, paid_at = NOW(), version = version + 1
WHERE enrollment_id = @enrollment_id AND @account_rows = 1;

INSERT INTO TuitionPayments(student_id, enrollment_id, amount, status, requested_at, completed_at)
SELECT @student_id, @enrollment_id, @amount, 'completed', NOW(), NOW()
WHERE @account_rows = 1 AND @enrollment_id IS NOT NULL;
COMMIT;

SELECT 'After payment: all related rows changed together' AS phase;
SELECT account_id, student_id, balance, version FROM StudentAccounts WHERE student_id = @student_id;
SELECT enrollment_id, student_id, status, paid_at, version FROM Enrollments WHERE enrollment_id = @enrollment_id;
SELECT payment_id, student_id, enrollment_id, amount, status
FROM TuitionPayments
WHERE enrollment_id = @enrollment_id
ORDER BY payment_id DESC
LIMIT 3;

SELECT 'Statement-level atomicity: one UPDATE changes many rows under autocommit' AS demo;
UPDATE Enrollments
SET payment_requested = TRUE
WHERE student_id = 'student00006'
  AND status = 'enrolled';
SELECT ROW_COUNT() AS rows_changed_by_one_statement;

SELECT 'Consistency by database constraints: invalid class_id is rejected by FK' AS demo;
DROP PROCEDURE IF EXISTS demo_invalid_fk_insert;
DELIMITER //
CREATE PROCEDURE demo_invalid_fk_insert()
BEGIN
  DECLARE fk_error VARCHAR(255) DEFAULT 'NO_ERROR';
  DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET fk_error = 'REJECTED_BY_FOREIGN_KEY';
  INSERT INTO Enrollments(student_id, class_id, status, tuition_amount, enrolled_at)
  VALUES ('student00006', 999999, 'enrolled', 1800000, NOW());
  SELECT fk_error AS invalid_fk_insert_result;
END//
DELIMITER ;
CALL demo_invalid_fk_insert();
DROP PROCEDURE demo_invalid_fk_insert;
