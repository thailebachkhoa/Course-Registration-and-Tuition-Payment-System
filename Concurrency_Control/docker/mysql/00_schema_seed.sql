DROP TABLE IF EXISTS Enrollments;
DROP TABLE IF EXISTS Classes;
DROP TABLE IF EXISTS Courses;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS BankAccounts;
DROP TABLE IF EXISTS Transactions;

CREATE TABLE Users (
  person_id VARCHAR(50) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  role ENUM('admin', 'teacher', 'student') NOT NULL
);

CREATE TABLE Courses (
  course_code VARCHAR(20) PRIMARY KEY,
  course_name VARCHAR(255) NOT NULL,
  credits INT NOT NULL,
  department VARCHAR(100) NOT NULL
);

CREATE TABLE Classes (
  class_id INT AUTO_INCREMENT PRIMARY KEY,
  course_code VARCHAR(20) NOT NULL,
  teacher_id VARCHAR(50) NOT NULL,
  day_of_week VARCHAR(100) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INT DEFAULT 30,
  enrolled_count INT DEFAULT 0,
  FOREIGN KEY (course_code) REFERENCES Courses(course_code),
  FOREIGN KEY (teacher_id) REFERENCES Users(person_id)
);

CREATE TABLE Enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  class_id INT NOT NULL,
  status ENUM('enrolled', 'payed', 'dropped') NOT NULL DEFAULT 'enrolled',
  enrollment_version INT DEFAULT 1,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_enrollment (student_id, class_id),
  FOREIGN KEY (student_id) REFERENCES Users(person_id),
  FOREIGN KEY (class_id) REFERENCES Classes(class_id),
  KEY idx_student (student_id),
  KEY idx_class (class_id)
);

CREATE TABLE BankAccounts (
  account_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  version INT DEFAULT 1,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_account (student_id),
  FOREIGN KEY (student_id) REFERENCES Users(person_id),
  KEY idx_balance (balance)
);

CREATE TABLE Transactions (
  transaction_id INT AUTO_INCREMENT PRIMARY KEY,
  account_id INT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  transaction_type ENUM('deposit', 'withdrawal', 'transfer') NOT NULL,
  status ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES BankAccounts(account_id),
  KEY idx_account_created (account_id, created_at)
);

-- Insert Users
INSERT INTO Users VALUES
('admin001', 'admin@school.edu.vn', 'Admin', 'admin'),
('teacher001', 'teacher001@school.edu.vn', 'Tran Thi B', 'teacher'),
('student001', 'student001@school.edu.vn', 'Nguyen Van A', 'student'),
('student002', 'student002@school.edu.vn', 'Pham Thi C', 'student'),
('student003', 'student003@school.edu.vn', 'Hoang Van D', 'student');

-- Insert Courses
INSERT INTO Courses VALUES
('CS202', 'Co so Du lieu', 3, 'Cong nghe thong tin'),
('CS303', 'Lap trinh Web', 3, 'Cong nghe thong tin'),
('CS404', 'Ke thua Du lieu', 3, 'Cong nghe thong tin');

-- Insert Classes
INSERT INTO Classes (course_code, teacher_id, day_of_week, start_time, end_time, capacity) VALUES
('CS202', 'teacher001', 'Monday', '07:00:00', '09:00:00', 3),
('CS303', 'teacher001', 'Tuesday', '08:00:00', '10:00:00', 2),
('CS404', 'teacher001', 'Wednesday', '09:00:00', '11:00:00', 2);

-- Insert Enrollments for testing
INSERT INTO Enrollments (student_id, class_id, status) VALUES
('student001', 1, 'enrolled'),
('student002', 1, 'enrolled'),
('student003', 2, 'enrolled');

-- Insert Bank Accounts
INSERT INTO BankAccounts (student_id, balance) VALUES
('student001', 1000000.00),
('student002', 500000.00),
('student003', 750000.00);

-- Create indexes for concurrency control
CREATE INDEX idx_class_capacity ON Classes(class_id, capacity, enrolled_count);
CREATE INDEX idx_enrollment_status ON Enrollments(status);
