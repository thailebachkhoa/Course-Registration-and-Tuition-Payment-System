USE course_comparison;

SET SESSION cte_max_recursion_depth = 100000;

DROP TABLE IF EXISTS WriteHeavy;
DROP TABLE IF EXISTS WriteLight;
DROP TABLE IF EXISTS AuditLogsNoIndex;
DROP TABLE IF EXISTS EnrollmentsNoIndex;
DROP TABLE IF EXISTS AuditLogs;
DROP TABLE IF EXISTS TuitionPayments;
DROP TABLE IF EXISTS StudentAccounts;
DROP TABLE IF EXISTS Enrollments;
DROP TABLE IF EXISTS Classes;
DROP TABLE IF EXISTS Courses;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Departments;
DROP TABLE IF EXISTS SystemState;

CREATE TABLE Departments (
  department_id INT PRIMARY KEY,
  department_code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE Users (
  user_id VARCHAR(50) PRIMARY KEY,
  email VARCHAR(160) NOT NULL UNIQUE,
  full_name VARCHAR(160) NOT NULL,
  role ENUM('admin', 'teacher', 'student') NOT NULL,
  major_department_id INT NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (major_department_id) REFERENCES Departments(department_id),
  KEY idx_users_role_email (role, email)
) ENGINE=InnoDB;

CREATE TABLE Courses (
  course_code VARCHAR(20) PRIMARY KEY,
  course_name VARCHAR(180) NOT NULL,
  credits INT NOT NULL,
  department_id INT NOT NULL,
  tags JSON NOT NULL,
  description TEXT NOT NULL,
  FOREIGN KEY (department_id) REFERENCES Departments(department_id),
  KEY idx_courses_department_credits (department_id, credits),
  FULLTEXT KEY ft_courses_text (course_name, description)
) ENGINE=InnoDB;

CREATE TABLE Classes (
  class_id INT AUTO_INCREMENT PRIMARY KEY,
  class_code VARCHAR(30) NOT NULL UNIQUE,
  course_code VARCHAR(20) NOT NULL,
  teacher_id VARCHAR(50) NOT NULL,
  semester VARCHAR(20) NOT NULL,
  day_of_week VARCHAR(20) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room VARCHAR(20) NOT NULL,
  capacity INT NOT NULL,
  enrolled_count INT NOT NULL DEFAULT 0,
  status ENUM('open', 'closed', 'cancelled') NOT NULL DEFAULT 'open',
  created_at DATETIME NOT NULL,
  FOREIGN KEY (course_code) REFERENCES Courses(course_code),
  FOREIGN KEY (teacher_id) REFERENCES Users(user_id),
  KEY idx_classes_course_semester (course_code, semester),
  KEY idx_classes_capacity (class_id, capacity, enrolled_count),
  KEY idx_classes_status_created (status, created_at)
) ENGINE=InnoDB;

CREATE TABLE Enrollments (
  enrollment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  class_id INT NOT NULL,
  status ENUM('enrolled', 'payed', 'dropped') NOT NULL DEFAULT 'enrolled',
  payment_requested BOOLEAN NOT NULL DEFAULT FALSE,
  tuition_amount DECIMAL(12,2) NOT NULL,
  version INT NOT NULL DEFAULT 1,
  enrolled_at DATETIME NOT NULL,
  paid_at DATETIME NULL,
  UNIQUE KEY uq_enrollment_student_class (student_id, class_id),
  FOREIGN KEY (student_id) REFERENCES Users(user_id),
  FOREIGN KEY (class_id) REFERENCES Classes(class_id),
  KEY idx_enrollments_student_status (student_id, status),
  KEY idx_enrollments_class_status (class_id, status),
  KEY idx_enrollments_payment_requested (payment_requested, status)
) ENGINE=InnoDB;

CREATE TABLE StudentAccounts (
  account_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL UNIQUE,
  balance DECIMAL(14,2) NOT NULL,
  version INT NOT NULL DEFAULT 1,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (student_id) REFERENCES Users(user_id),
  KEY idx_accounts_balance (balance)
) ENGINE=InnoDB;

CREATE TABLE TuitionPayments (
  payment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  enrollment_id BIGINT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status ENUM('pending', 'completed', 'failed') NOT NULL,
  requested_at DATETIME NOT NULL,
  completed_at DATETIME NULL,
  FOREIGN KEY (student_id) REFERENCES Users(user_id),
  FOREIGN KEY (enrollment_id) REFERENCES Enrollments(enrollment_id),
  KEY idx_payments_student_status (student_id, status),
  KEY idx_payments_requested (requested_at)
) ENGINE=InnoDB;

CREATE TABLE AuditLogs (
  log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  actor_user_id VARCHAR(50) NOT NULL,
  action VARCHAR(40) NOT NULL,
  target_type VARCHAR(40) NOT NULL,
  target_id VARCHAR(60) NOT NULL,
  metadata JSON NOT NULL,
  created_at DATETIME NOT NULL,
  KEY idx_logs_actor_created (actor_user_id, created_at),
  KEY idx_logs_action_created (action, created_at)
) ENGINE=InnoDB;

CREATE TABLE SystemState (
  id INT PRIMARY KEY,
  current_stage ENUM('create_class', 'register_class', 'lock_class', 'scheduled_class') NOT NULL,
  semester VARCHAR(20) NOT NULL,
  updated_at DATETIME NOT NULL
) ENGINE=InnoDB;

INSERT INTO Departments VALUES
(1, 'CSE', 'Computer Science'),
(2, 'MTH', 'Mathematics'),
(3, 'ENG', 'English'),
(4, 'BUS', 'Business');

INSERT INTO Users(user_id, email, full_name, role, major_department_id, created_at)
WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 2000
)
SELECT
  CONCAT('student', LPAD(n, 5, '0')),
  CONCAT('student', LPAD(n, 5, '0'), '@student.edu.vn'),
  CONCAT('Student ', n),
  'student',
  (n % 4) + 1,
  TIMESTAMP('2026-01-01 08:00:00') + INTERVAL (n % 45) DAY
FROM seq;

INSERT INTO Users VALUES
('admin001', 'admin@school.edu.vn', 'System Administrator', 'admin', NULL, '2026-01-01 08:00:00'),
('teacher001', 'teacher001@school.edu.vn', 'Nguyen Van A', 'teacher', 1, '2026-01-02 08:00:00'),
('teacher002', 'teacher002@school.edu.vn', 'Tran Thi B', 'teacher', 1, '2026-01-02 08:10:00'),
('teacher003', 'teacher003@school.edu.vn', 'Le Hoang C', 'teacher', 2, '2026-01-02 08:20:00'),
('teacher004', 'teacher004@school.edu.vn', 'Pham Minh D', 'teacher', 3, '2026-01-02 08:30:00');

INSERT INTO Courses(course_code, course_name, credits, department_id, tags, description)
WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 80
)
SELECT
  CONCAT(ELT((n % 4) + 1, 'CS', 'MATH', 'ENG', 'BUS'), LPAD(100 + n, 3, '0')),
  CONCAT('Course ', n, ' ', ELT((n % 6) + 1, 'Database', 'Web', 'Statistics', 'Language', 'Management', 'Systems')),
  CASE WHEN n % 5 = 0 THEN 4 WHEN n % 7 = 0 THEN 2 ELSE 3 END,
  (n % 4) + 1,
  JSON_ARRAY(ELT((n % 6) + 1, 'database', 'web', 'statistics', 'language', 'management', 'systems'), ELT((n % 4) + 1, 'lab', 'theory', 'project', 'seminar')),
  CONCAT('Course ', n, ' supports registration, tuition payment, indexing, transaction, concurrency, backup and recovery comparison.')
FROM seq;

INSERT INTO Classes(class_code, course_code, teacher_id, semester, day_of_week, start_time, end_time, room, capacity, enrolled_count, status, created_at)
WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 240
)
SELECT
  CONCAT('CLS', LPAD(n, 5, '0')),
  CONCAT(ELT((((n - 1) % 80 + 1) % 4) + 1, 'CS', 'MATH', 'ENG', 'BUS'), LPAD(100 + ((n - 1) % 80 + 1), 3, '0')),
  CONCAT('teacher00', ((n - 1) % 4) + 1),
  '2026.2',
  ELT((n % 6) + 1, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'),
  MAKETIME(7 + (n % 7), 0, 0),
  MAKETIME(9 + (n % 7), 0, 0),
  CONCAT(CHAR(65 + (n % 4)), LPAD(100 + (n % 40), 3, '0')),
  500 + (n % 100),
  0,
  CASE WHEN n % 20 = 0 THEN 'closed' ELSE 'open' END,
  TIMESTAMP('2026-02-01 08:00:00') + INTERVAL (n % 20) DAY
FROM seq;

INSERT INTO Enrollments(student_id, class_id, status, payment_requested, tuition_amount, version, enrolled_at, paid_at)
WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 100000
)
SELECT
  CONCAT('student', LPAD(((n - 1) % 2000) + 1, 5, '0')),
  ((((n - 1) % 2000) * 7 + FLOOR((n - 1) / 2000)) % 240) + 1,
  CASE WHEN n % 10 IN (0,1,2,3) THEN 'payed' WHEN n % 10 = 9 THEN 'dropped' ELSE 'enrolled' END,
  n % 10 IN (4,5),
  c.credits * 600000,
  1,
  TIMESTAMP('2026-02-10 08:00:00') + INTERVAL (n % 21) DAY,
  CASE WHEN n % 10 IN (0,1,2,3) THEN TIMESTAMP('2026-03-01 08:00:00') + INTERVAL (n % 10) DAY ELSE NULL END
FROM seq
JOIN Classes cl ON cl.class_id = (((((n - 1) % 2000) * 7 + FLOOR((n - 1) / 2000)) % 240) + 1)
JOIN Courses c ON c.course_code = cl.course_code;

UPDATE Classes c
JOIN (
  SELECT class_id, COUNT(*) AS total
  FROM Enrollments
  WHERE status <> 'dropped'
  GROUP BY class_id
) e ON e.class_id = c.class_id
SET c.enrolled_count = e.total;

INSERT INTO StudentAccounts(student_id, balance, version, updated_at)
WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 2000
)
SELECT
  CONCAT('student', LPAD(n, 5, '0')),
  2000000 + ((n * 137000) % 9000000),
  1,
  '2026-03-01 08:00:00'
FROM seq;

INSERT INTO TuitionPayments(student_id, enrollment_id, amount, status, requested_at, completed_at)
SELECT
  student_id,
  enrollment_id,
  tuition_amount,
  CASE WHEN status = 'payed' THEN 'completed' ELSE 'pending' END,
  enrolled_at + INTERVAL 1 DAY,
  paid_at
FROM Enrollments
WHERE payment_requested = TRUE OR status = 'payed';

INSERT INTO AuditLogs(actor_user_id, action, target_type, target_id, metadata, created_at)
WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 100000
)
SELECT
  CASE WHEN n % 13 = 0 THEN 'admin001' ELSE CONCAT('student', LPAD(((n - 1) % 2000) + 1, 5, '0')) END,
  ELT((n % 5) + 1, 'CREATE_CLASS', 'ENROLL_CLASS', 'REQUEST_PAYMENT', 'PAY_TUITION', 'DROP_CLASS'),
  ELT((n % 3) + 1, 'class', 'enrollment', 'payment'),
  CONCAT('target_', n),
  JSON_OBJECT('class_id', ((n - 1) % 240) + 1, 'ip', CONCAT('10.0.', n % 255, '.', (n * 7) % 255)),
  TIMESTAMP('2026-02-01 00:00:00') + INTERVAL (n % 60) DAY + INTERVAL (n % 86400) SECOND
FROM seq;

INSERT INTO SystemState VALUES (1, 'register_class', '2026.2', '2026-02-10 08:00:00');
