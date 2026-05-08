db = db.getSiblingDB("course_registration");

db.users.drop();
db.courses.drop();
db.classes.drop();
db.enrollments.drop();
db.bank_accounts.drop();
db.transactions.drop();

db.users.insertMany([
  { _id: "admin001", email: "admin@school.edu.vn", full_name: "Admin", role: "admin" },
  { _id: "teacher001", email: "teacher001@school.edu.vn", full_name: "Tran Thi B", role: "teacher" },
  { _id: "student001", email: "student001@school.edu.vn", full_name: "Nguyen Van A", role: "student" },
  { _id: "student002", email: "student002@school.edu.vn", full_name: "Pham Thi C", role: "student" },
  { _id: "student003", email: "student003@school.edu.vn", full_name: "Hoang Van D", role: "student" }
]);

db.courses.insertMany([
  { _id: "CS202", course_name: "Co so Du lieu", credits: 3, department: "Cong nghe thong tin" },
  { _id: "CS303", course_name: "Lap trinh Web", credits: 3, department: "Cong nghe thong tin" },
  { _id: "CS404", course_name: "Ke thua Du lieu", credits: 3, department: "Cong nghe thong tin" }
]);

db.classes.insertMany([
  {
    _id: 1,
    course_code: "CS202",
    teacher_id: "teacher001",
    day_of_week: "Monday",
    start_time: "07:00",
    end_time: "09:00",
    capacity: 3,
    enrolled_count: 0
  },
  {
    _id: 2,
    course_code: "CS303",
    teacher_id: "teacher001",
    day_of_week: "Tuesday",
    start_time: "08:00",
    end_time: "10:00",
    capacity: 2,
    enrolled_count: 0
  },
  {
    _id: 3,
    course_code: "CS404",
    teacher_id: "teacher001",
    day_of_week: "Wednesday",
    start_time: "09:00",
    end_time: "11:00",
    capacity: 2,
    enrolled_count: 0
  }
]);

db.enrollments.insertMany([
  {
    _id: 1,
    student_id: "student001",
    class_id: 1,
    status: "enrolled",
    enrollment_version: 1,
    enrolled_at: new Date()
  },
  {
    _id: 2,
    student_id: "student002",
    class_id: 1,
    status: "enrolled",
    enrollment_version: 1,
    enrolled_at: new Date()
  },
  {
    _id: 3,
    student_id: "student003",
    class_id: 2,
    status: "enrolled",
    enrollment_version: 1,
    enrolled_at: new Date()
  }
]);

db.enrollments.createIndex(
  { student_id: 1, class_id: 1 },
  { unique: true }
);

db.enrollments.createIndex({ status: 1 });
db.enrollments.createIndex({ student_id: 1 });

db.bank_accounts.insertMany([
  {
    _id: "acc_student001",
    student_id: "student001",
    balance: 1000000.00,
    version: 1,
    last_modified: new Date()
  },
  {
    _id: "acc_student002",
    student_id: "student002",
    balance: 500000.00,
    version: 1,
    last_modified: new Date()
  },
  {
    _id: "acc_student003",
    student_id: "student003",
    balance: 750000.00,
    version: 1,
    last_modified: new Date()
  }
]);

db.bank_accounts.createIndex({ student_id: 1 }, { unique: true });

db.transactions.createIndex({ account_id: 1, created_at: 1 });
