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

## 6) Setup Demo Database (for presentation/demo)
The demo database is separate from production data to avoid affecting real usage.

**Option A: Automated setup (recommended)**
1. Ensure backend/.env points to a clean MySQL database (e.g., course_registration_demo)
2. Run: `npm run init-db`
3. Run: `npm run init-demo-data` (if this script exists)

**Option B: Manual setup**
1. Create a new database: `CREATE DATABASE course_registration_demo;`
2. Run schema: `mysql -u root -p course_registration_demo < backend/src/db/schema.sql`
3. Load demo data: `mysql -u root -p course_registration_demo < backend/src/db/demo-data.sql`

**Demo Database Content:**
- 11 users: 1 admin, 4 teachers, 6 students
- 10 courses across 5 departments
- 11 class instances with schedules
- 15 enrollments showing:
  - Enrolled students (waiting payment request)
  - Paid students (completed registration)
  - Payment requests pending admin approval

**Demo Scenarios Ready:**
- Student 1: Mixed enrolled & paid classes (show transitions)
- Student 3: Pending payment requests (show payment flow)
- Student 5: Full paid schedule (show final schedule)
- Teachers: Can view their class enrollments
- Admin: Can approve payments and manage system state

## 7) Sample queries for report/grading
Use file backend/src/db/btl_queries.sql to run:
- Insert data
- Update data
- Delete/reset data
- Join queries
- Subquery
- Aggregate queries

## 8) Notes for grading/demo
- Show system stage transitions from SystemState.
- Show registration and payment flow in Enrollments.
- Show schedule generation based on status = 'payed'.
- Use demo-data.sql for clean presentation scenarios.
