-- =============================================
-- DEMO DATA FOR COURSE REGISTRATION SYSTEM
-- =============================================
-- Usage: Load this after schema.sql to populate demo database
-- Purpose: Demonstrate all features during presentation/demo

USE course_registration;

-- =============================================
-- 1. INSERT COURSES (Static Master Data)
-- =============================================
INSERT INTO Courses (course_code, course_name, credits, department) VALUES
('CS101', 'Introduction to Programming', 3, 'Computer Science'),
('CS202', 'Data Structures', 3, 'Computer Science'),
('CS303', 'Database Systems', 3, 'Computer Science'),
('CS404', 'Software Engineering', 3, 'Computer Science'),
('MATH101', 'Calculus I', 4, 'Mathematics'),
('MATH202', 'Linear Algebra', 3, 'Mathematics'),
('PHYS101', 'Physics I', 4, 'Physics'),
('ENG101', 'English I', 2, 'English'),
('ENG202', 'English II', 2, 'English'),
('CHEM101', 'Chemistry I', 4, 'Chemistry');

-- =============================================
-- 2. INSERT USERS (Admin, Teachers, Students)
-- =============================================

-- Admin account (for testing admin features)
INSERT INTO Users (person_id, email, password, full_name, role) VALUES
('admin_001', 'admin@school.edu.vn', '$2b$10$replace_with_bcrypt_hash_admin', 'System Administrator', 'admin');

-- Teacher accounts
INSERT INTO Users (person_id, email, password, full_name, role) VALUES
('teacher_001', 'nguyen.van.a@school.edu.vn', '$2b$10$replace_with_bcrypt_hash', 'Nguyễn Văn A', 'teacher'),
('teacher_002', 'tran.thi.b@school.edu.vn', '$2b$10$replace_with_bcrypt_hash', 'Trần Thị B', 'teacher'),
('teacher_003', 'pham.van.c@school.edu.vn', '$2b$10$replace_with_bcrypt_hash', 'Phạm Văn C', 'teacher'),
('teacher_004', 'hoang.thi.d@school.edu.vn', '$2b$10$replace_with_bcrypt_hash', 'Hoàng Thị D', 'teacher');

-- Student accounts (various stages)
INSERT INTO Users (person_id, email, password, full_name, role) VALUES
('student_001', 'le.minh.e@student.edu.vn', '$2b$10$replace_with_bcrypt_hash', 'Lê Minh E', 'student'),
('student_002', 'ngo.tuan.f@student.edu.vn', '$2b$10$replace_with_bcrypt_hash', 'Ngô Tuấn F', 'student'),
('student_003', 'vu.linh.g@student.edu.vn', '$2b$10$replace_with_bcrypt_hash', 'Vũ Linh G', 'student'),
('student_004', 'dang.huy.h@student.edu.vn', '$2b$10$replace_with_bcrypt_hash', 'Đặng Huy H', 'student'),
('student_005', 'ly.nhat.i@student.edu.vn', '$2b$10$replace_with_bcrypt_hash', 'Lý Nhật I', 'student'),
('student_006', 'thai.thanh.k@student.edu.vn', '$2b$10$replace_with_bcrypt_hash', 'Thái Thành K', 'student');

-- =============================================
-- 3. INSERT SYSTEM STATE (Demo in register_class stage)
-- =============================================
INSERT INTO SystemState (id, current_stage) VALUES
(1, 'register_class');

-- =============================================
-- 4. INSERT CLASSES (Various courses with different teachers)
-- =============================================
INSERT INTO Classes (course_code, teacher_id, day_of_week, start_time, end_time) VALUES
-- CS202 - Data Structures (Teacher 1)
('CS202', 'teacher_001', 'Monday', '08:00:00', '10:00:00'),
('CS202', 'teacher_001', 'Wednesday', '08:00:00', '10:00:00'),
('CS202', 'teacher_001', 'Friday', '08:00:00', '10:00:00'),

-- CS303 - Database Systems (Teacher 2)
('CS303', 'teacher_002', 'Tuesday', '10:00:00', '12:00:00'),
('CS303', 'teacher_002', 'Thursday', '10:00:00', '12:00:00'),

-- CS404 - Software Engineering (Teacher 3)
('CS404', 'teacher_003', 'Monday', '13:00:00', '15:00:00'),
('CS404', 'teacher_003', 'Wednesday', '13:00:00', '15:00:00'),

-- MATH101 - Calculus I (Teacher 4)
('MATH101', 'teacher_004', 'Tuesday', '08:00:00', '10:00:00'),
('MATH101', 'teacher_004', 'Thursday', '08:00:00', '10:00:00'),

-- ENG101 - English I (Teacher 1)
('ENG101', 'teacher_001', 'Monday', '15:00:00', '17:00:00'),
('ENG101', 'teacher_001', 'Friday', '15:00:00', '17:00:00');

-- =============================================
-- 5. INSERT ENROLLMENTS (Different statuses for demo)
-- =============================================

-- student_001: Multiple enrollments - one enrolled, one payed
-- Enrolled class (CS202)
INSERT INTO Enrollments (student_id, class_id, status, payment_requested) VALUES
('student_001', 1, 'enrolled', FALSE);

-- Payed class (CS303)
INSERT INTO Enrollments (student_id, class_id, status, payment_requested) VALUES
('student_001', 4, 'payed', FALSE);

-- student_002: Two enrolled classes waiting for payment
INSERT INTO Enrollments (student_id, class_id, status, payment_requested) VALUES
('student_002', 2, 'enrolled', FALSE),
('student_002', 5, 'enrolled', FALSE);

-- student_003: Requested payment (waiting admin approval)
INSERT INTO Enrollments (student_id, class_id, status, payment_requested) VALUES
('student_003', 3, 'enrolled', TRUE),
('student_003', 6, 'enrolled', TRUE);

-- student_004: Mix of enrolled and payed
INSERT INTO Enrollments (student_id, class_id, status, payment_requested) VALUES
('student_004', 1, 'payed', FALSE),
('student_004', 4, 'payed', FALSE),
('student_004', 7, 'enrolled', FALSE);

-- student_005: Multiple payed (full schedule)
INSERT INTO Enrollments (student_id, class_id, status, payment_requested) VALUES
('student_005', 2, 'payed', FALSE),
('student_005', 5, 'payed', FALSE),
('student_005', 8, 'payed', FALSE);

-- student_006: Just one enrollment, payed
INSERT INTO Enrollments (student_id, class_id, status, payment_requested) VALUES
('student_006', 3, 'payed', FALSE);

-- =============================================
-- SUMMARY OF DEMO DATA
-- =============================================
-- Users: 1 Admin + 4 Teachers + 6 Students = 11 total
-- Courses: 10 courses across 5 departments
-- Classes: 11 class instances
-- Enrollments: 15 enrollments with mixed statuses:
--   - Some "enrolled" (waiting payment request)
--   - Some "payed" (completed registration)
--   - Some with payment_requested = TRUE (awaiting admin approval)
--
-- DEMO SCENARIOS:
-- 1. Student view: Student 1 can see enrolled class and scheduled class
-- 2. Payment flow: Student 3 shows payment request pending
-- 3. Schedule: Student 5 has full paid schedule
-- 4. Teacher view: Can see their class enrollments
-- 5. Admin view: Can see payment requests and all system data
