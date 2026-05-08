-- =============================================
-- COURSE REGISTRATION SYSTEM - DATABASE SCHEMA
-- =============================================

-- =============================================
-- STATIC DATA: Courses (môn học)
-- =============================================
CREATE TABLE IF NOT EXISTS Courses (
    course_code VARCHAR(20) PRIMARY KEY,
    course_name VARCHAR(255) NOT NULL,
    credits INT NOT NULL,
    department VARCHAR(100) NOT NULL
);

-- =============================================
-- SYSTEM STATE
-- =============================================
CREATE TABLE IF NOT EXISTS SystemState (
    id INT PRIMARY KEY DEFAULT 1,
    current_stage ENUM('create_class', 'register_class', 'lock_class', 'scheduled_class') NOT NULL DEFAULT 'create_class',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- USERS
-- =============================================
CREATE TABLE IF NOT EXISTS Users (
    person_id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role ENUM('admin', 'teacher', 'student') NOT NULL DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- CLASSES (lớp học)
-- =============================================
CREATE TABLE IF NOT EXISTS Classes (
    class_id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(20) NOT NULL,
    teacher_id VARCHAR(50) NOT NULL,
    day_of_week VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_code) REFERENCES Courses(course_code) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES Users(person_id) ON DELETE CASCADE
);

-- =============================================
-- ENROLLMENTS (đăng ký môn học)
-- =============================================
CREATE TABLE IF NOT EXISTS Enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    class_id INT NOT NULL,
    status ENUM('enrolled', 'payed') NOT NULL DEFAULT 'enrolled',
    payment_requested BOOLEAN DEFAULT FALSE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_enrollment (student_id, class_id),
    FOREIGN KEY (student_id) REFERENCES Users(person_id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES Classes(class_id) ON DELETE CASCADE
);

-- =============================================
-- SEED DATA: System State
-- =============================================
INSERT INTO SystemState (id, current_stage) VALUES (1, 'create_class')
ON DUPLICATE KEY UPDATE id = id;

-- =============================================
-- SEED DATA: Admin account
-- =============================================
INSERT INTO Users (person_id, email, password, full_name, role) VALUES
('admin001', 'admin@school.edu.vn', '$2b$10$YourHashedPasswordHere', 'Quản Trị Viên', 'admin')
ON DUPLICATE KEY UPDATE person_id = person_id;

-- =============================================
-- SEED DATA: Courses (Static - không xóa khi reset)
-- =============================================
INSERT INTO Courses (course_code, course_name, credits, department) VALUES
('CS101', 'Nhập môn Lập trình', 3, 'Công nghệ thông tin'),
('CS102', 'Cấu trúc Dữ liệu & Giải thuật', 3, 'Công nghệ thông tin'),
('CS201', 'Lập trình Hướng đối tượng', 3, 'Công nghệ thông tin'),
('CS202', 'Cơ sở Dữ liệu', 3, 'Công nghệ thông tin'),
('CS301', 'Mạng Máy tính', 3, 'Công nghệ thông tin'),
('CS302', 'Trí tuệ Nhân tạo', 3, 'Công nghệ thông tin'),
('CS303', 'Lập trình Web', 3, 'Công nghệ thông tin'),
('CS401', 'Kiến trúc Máy tính', 3, 'Công nghệ thông tin'),
('MATH101', 'Giải tích 1', 4, 'Toán - Tin học'),
('MATH102', 'Giải tích 2', 4, 'Toán - Tin học'),
('MATH201', 'Đại số Tuyến tính', 3, 'Toán - Tin học'),
('MATH202', 'Xác suất & Thống kê', 3, 'Toán - Tin học'),
('PHYS101', 'Vật lý Đại cương 1', 3, 'Vật lý'),
('PHYS102', 'Vật lý Đại cương 2', 3, 'Vật lý'),
('ENG101', 'Tiếng Anh Cơ bản', 3, 'Ngoại ngữ'),
('ENG201', 'Tiếng Anh Chuyên ngành', 3, 'Ngoại ngữ'),
('ECON101', 'Kinh tế Vi mô', 3, 'Kinh tế'),
('ECON102', 'Kinh tế Vĩ mô', 3, 'Kinh tế'),
('MGT101', 'Quản trị Học', 3, 'Quản trị Kinh doanh'),
('LAW101', 'Pháp luật Đại cương', 2, 'Luật')
ON DUPLICATE KEY UPDATE course_code = course_code;
