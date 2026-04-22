# Database Guide (BTL)

## 1) Logical entities
- Courses: static course catalog.
- Users: all system users (admin/teacher/student).
- Classes: class instances opened by teachers.
- Enrollments: student registration and payment state.
- SystemState: current workflow stage.

## 2) Key relationships
- Courses (1) -> (n) Classes via Classes.course_code.
- Users role teacher (1) -> (n) Classes via Classes.teacher_id.
- Users role student (1) -> (n) Enrollments via Enrollments.student_id.
- Classes (1) -> (n) Enrollments via Enrollments.class_id.
- SystemState stores one row with id = 1.

## 3) Main constraints
- PK: Courses.course_code, Users.person_id, Classes.class_id, Enrollments.id, SystemState.id.
- Unique: Users.email, Enrollments(student_id, class_id).
- FK with ON DELETE CASCADE for Classes and Enrollments.
- Enum stages: create_class, register_class, lock_class, scheduled_class.
- Enum enrollment status: enrolled, payed.

## 4) Initialization
1. Copy backend/.env.example to backend/.env.
2. Set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT.
3. Run in backend folder:
   - npm install
   - npm run init-db

Expected output includes:
- Connected to MySQL
- Schema applied
- Admin account ready

## 5) Sample queries for report/demo
Use file backend/src/db/btl_queries.sql to run:
- Insert data
- Update data
- Delete/reset data
- Join queries
- Subquery
- Aggregate queries

## 6) Notes for grading/demo
- Show system stage transitions from SystemState.
- Show registration and payment flow in Enrollments.
- Show schedule generation based on status = 'payed'.
