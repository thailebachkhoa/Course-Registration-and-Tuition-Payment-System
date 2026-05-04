-- BTL database queries for Course Registration and Tuition Payment System
-- Target DB: course_registration

USE course_registration;

-- Q1. List all courses by department and code
SELECT course_code, course_name, credits, department
FROM Courses
ORDER BY department, course_code;

-- Q2. Insert a teacher account
INSERT INTO Users (person_id, email, password, full_name, role)
VALUES ('teacher_demo_01', 'teacher.demo@school.edu.vn', '$2b$10$replace_with_bcrypt_hash', 'Teacher Demo', 'teacher');

-- Q3. Insert a student account
INSERT INTO Users (person_id, email, password, full_name, role)
VALUES ('student_demo_01', 'student.demo@school.edu.vn', '$2b$10$replace_with_bcrypt_hash', 'Student Demo', 'student');

-- Q4. Create a class opened by teacher
INSERT INTO Classes (course_code, teacher_id, day_of_week, start_time, end_time)
VALUES ('CS202', 'teacher_demo_01', 'Monday', '08:00:00', '10:00:00');

-- Q5. Student enrolls into the latest class (subquery)
INSERT INTO Enrollments (student_id, class_id, status)
SELECT 'student_demo_01', MAX(class_id), 'enrolled'
FROM Classes
WHERE teacher_id = 'teacher_demo_01';

-- Q6. Join query: enrollment detail with student, teacher, and course
SELECT
  e.id AS enrollment_id,
  s.person_id AS student_id,
  s.full_name AS student_name,
  t.person_id AS teacher_id,
  t.full_name AS teacher_name,
  c.course_code,
  c.course_name,
  c.credits,
  cl.day_of_week,
  cl.start_time,
  cl.end_time,
  e.status,
  e.payment_requested
FROM Enrollments e
JOIN Users s ON s.person_id = e.student_id
JOIN Classes cl ON cl.class_id = e.class_id
JOIN Users t ON t.person_id = cl.teacher_id
JOIN Courses c ON c.course_code = cl.course_code
ORDER BY e.id DESC;

-- Q7. Aggregate query: tuition summary per student
SELECT
  u.person_id,
  u.full_name,
  COUNT(e.id) AS enrolled_classes,
  COALESCE(SUM(c.credits), 0) AS total_credits,
  COALESCE(SUM(c.credits) * 600000, 0) AS total_tuition
FROM Users u
LEFT JOIN Enrollments e ON e.student_id = u.person_id AND e.status = 'enrolled'
LEFT JOIN Classes cl ON cl.class_id = e.class_id
LEFT JOIN Courses c ON c.course_code = cl.course_code
WHERE u.role = 'student'
GROUP BY u.person_id, u.full_name
ORDER BY total_tuition DESC;

-- Q8. Mark student payment request (update)
UPDATE Enrollments
SET payment_requested = TRUE
WHERE student_id = 'student_demo_01' AND status = 'enrolled';

-- Q9. Approve student payment (update)
UPDATE Enrollments
SET status = 'payed', payment_requested = FALSE
WHERE student_id = 'student_demo_01' AND payment_requested = TRUE AND status = 'enrolled';

-- Q10. Student schedule from paid classes only
SELECT
  c.course_code,
  c.course_name,
  c.credits,
  cl.day_of_week,
  cl.start_time,
  cl.end_time,
  t.full_name AS teacher_name
FROM Enrollments e
JOIN Classes cl ON cl.class_id = e.class_id
JOIN Courses c ON c.course_code = cl.course_code
JOIN Users t ON t.person_id = cl.teacher_id
WHERE e.student_id = 'student_demo_01' AND e.status = 'payed'
ORDER BY cl.day_of_week, cl.start_time;

-- Q11. Current system stage
SELECT current_stage, updated_at
FROM SystemState
WHERE id = 1;

-- Q12. Reset cycle data (admin operation) - run only when starting a new term
-- DELETE FROM Enrollments;
-- DELETE FROM Classes;
