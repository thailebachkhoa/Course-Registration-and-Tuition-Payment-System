# Demo Database Setup Guide

## Quick Start

### For Demo/Presentation Database:

```bash
# 1. Ensure you have a separate MySQL database for demo
# Option A: Create new database
# mysql -u root -p
# CREATE DATABASE course_registration_demo;

# 2. Setup environment (backend folder)
cp .env.example .env
# Edit .env and set DB_NAME=course_registration_demo (if using separate demo DB)

# 3. Initialize schema + demo data
npm run init-db        # Load schema
npm run init-demo-data # Load demo data with sample users and enrollments
```

### For Production Database:

```bash
# Same steps but use DB_NAME=course_registration (default)
npm run init-db        # Schema only
# Don't run init-demo-data - use real data through the app
```

---

## Demo Data Overview

### Users Ready for Demo:
- **Admin**: admin@school.edu.vn / admin_001
- **Teachers**: 4 teacher accounts (teacher_001 to teacher_004)
- **Students**: 6 student accounts (student_001 to student_006)

### Key Demo Scenarios:

#### Scenario 1: Payment Flow
- Login as **student_003**
- Shows enrollments with **payment_requested = TRUE**
- Demonstrates: Student → Request Payment → Admin Approves

#### Scenario 2: Student Schedule
- Login as **student_005**
- Shows only **status = 'payed'** classes
- Demonstrates: Final approved schedule after payment

#### Scenario 3: Admin Controls
- Login as **admin_001**
- Can approve/reject payment requests
- Can change system stage (create_class → register_class → lock_class → scheduled_class)

#### Scenario 4: Teacher View
- Login as **teacher_001**
- Can see all students enrolled in their classes
- Can view enrollment payment status

---

## Database Switching

```bash
# For development (real data):
DB_NAME=course_registration npm run dev

# For demo (sample data):
DB_NAME=course_registration_demo npm run dev
```

---

## Reset Demo Data

```sql
-- MySQL command line:
DROP DATABASE course_registration_demo;
CREATE DATABASE course_registration_demo;
mysql -u root -p course_registration_demo < backend/src/database/schema.sql
mysql -u root -p course_registration_demo < backend/src/database/demo-data.sql
```

Or via npm:
```bash
# Reset and reload (if script is created)
npm run init-db && npm run init-demo-data
```

---

## Sample Credentials for Testing

All demo accounts are set up with default passwords after running `npm run init-demo-data`:

| Role | Person ID | Email | Password |
|------|-----------|-------|----------|
| Admin | admin_001 | admin@school.edu.vn | `admin123` |
| Teacher | teacher_001 | nguyen.van.a@school.edu.vn | `demo123` |
| Teacher | teacher_002 | tran.thi.b@school.edu.vn | `demo123` |
| Teacher | teacher_003 | pham.van.c@school.edu.vn | `demo123` |
| Teacher | teacher_004 | hoang.thi.d@school.edu.vn | `demo123` |
| Student | student_001 | le.minh.e@student.edu.vn | `demo123` |
| Student | student_002 | ngo.tuan.f@student.edu.vn | `demo123` |
| Student | student_003 | vu.linh.g@student.edu.vn | `demo123` |
| Student | student_004 | dang.huy.h@student.edu.vn | `demo123` |
| Student | student_005 | ly.nhat.i@student.edu.vn | `demo123` |
| Student | student_006 | thai.thanh.k@student.edu.vn | `demo123` |

### Password Setup
- **Teacher & Student passwords**: Auto-generated as `demo123` (bcrypt hashed)
- **Admin password**: Uses `admin123` or value from `ADMIN_PASSWORD` env var
- Passwords are hashed during `npm run init-demo-data` execution

---

## File References

- Schema: `backend/src/database/schema.sql`
- Demo Data: `backend/src/database/demo-data.sql`
- Demo Loader: `backend/src/database/init-demo.js`
- Documentation: `document/database-guide.md`
