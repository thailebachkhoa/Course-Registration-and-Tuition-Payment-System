db = db.getSiblingDB('course_comparison');
db.dropDatabase();

function pad(number, length) {
  return String(number).padStart(length, '0');
}

function insertInBatches(collectionName, total, batchSize, factory) {
  const collection = db.getCollection(collectionName);
  for (let start = 1; start <= total; start += batchSize) {
    const batch = [];
    const end = Math.min(start + batchSize - 1, total);
    for (let i = start; i <= end; i += 1) {
      batch.push(factory(i));
    }
    collection.insertMany(batch, { ordered: false });
  }
}

db.departments.insertMany([
  { _id: 1, departmentCode: 'CSE', name: 'Computer Science' },
  { _id: 2, departmentCode: 'MTH', name: 'Mathematics' },
  { _id: 3, departmentCode: 'ENG', name: 'English' },
  { _id: 4, departmentCode: 'BUS', name: 'Business' }
]);

insertInBatches('users', 2000, 1000, (i) => ({
  _id: `student${pad(i, 5)}`,
  userId: `student${pad(i, 5)}`,
  email: `student${pad(i, 5)}@student.edu.vn`,
  fullName: `Student ${i}`,
  role: 'student',
  majorDepartmentId: (i % 4) + 1,
  createdAt: new Date(2026, 0, (i % 28) + 1, 8)
}));

db.users.insertMany([
  { _id: 'admin001', userId: 'admin001', email: 'admin@school.edu.vn', fullName: 'System Administrator', role: 'admin', createdAt: new Date('2026-01-01T08:00:00Z') },
  { _id: 'teacher001', userId: 'teacher001', email: 'teacher001@school.edu.vn', fullName: 'Nguyen Van A', role: 'teacher', majorDepartmentId: 1, createdAt: new Date('2026-01-02T08:00:00Z') },
  { _id: 'teacher002', userId: 'teacher002', email: 'teacher002@school.edu.vn', fullName: 'Tran Thi B', role: 'teacher', majorDepartmentId: 1, createdAt: new Date('2026-01-02T08:10:00Z') },
  { _id: 'teacher003', userId: 'teacher003', email: 'teacher003@school.edu.vn', fullName: 'Le Hoang C', role: 'teacher', majorDepartmentId: 2, createdAt: new Date('2026-01-02T08:20:00Z') },
  { _id: 'teacher004', userId: 'teacher004', email: 'teacher004@school.edu.vn', fullName: 'Pham Minh D', role: 'teacher', majorDepartmentId: 3, createdAt: new Date('2026-01-02T08:30:00Z') }
]);

const courseCodes = [];
const prefixes = ['CS', 'MATH', 'ENG', 'BUS'];
const topics = ['Database', 'Web', 'Statistics', 'Language', 'Management', 'Systems'];
const tags = ['database', 'web', 'statistics', 'language', 'management', 'systems'];

insertInBatches('courses', 80, 1000, (i) => {
  const courseCode = `${prefixes[i % 4]}${pad(100 + i, 3)}`;
  courseCodes.push(courseCode);
  return {
    _id: courseCode,
    courseCode,
    courseName: `Course ${i} ${topics[i % topics.length]}`,
    credits: i % 5 === 0 ? 4 : (i % 7 === 0 ? 2 : 3),
    departmentId: (i % 4) + 1,
    tags: [tags[i % tags.length], ['lab', 'theory', 'project', 'seminar'][i % 4]],
    description: `Course ${i} supports registration, tuition payment, indexing, transaction, concurrency, backup and recovery comparison.`
  };
});

insertInBatches('classes', 240, 1000, (i) => {
  const courseCode = courseCodes[(i - 1) % courseCodes.length];
  const course = db.courses.findOne({ _id: courseCode });
  return {
    _id: i,
    classCode: `CLS${pad(i, 5)}`,
    courseCode,
    courseName: course.courseName,
    credits: course.credits,
    departmentId: course.departmentId,
    teacherId: `teacher00${((i - 1) % 4) + 1}`,
    semester: '2026.2',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i % 6],
    startTime: `${pad(7 + (i % 7), 2)}:00`,
    endTime: `${pad(9 + (i % 7), 2)}:00`,
    room: `${String.fromCharCode(65 + (i % 4))}${pad(100 + (i % 40), 3)}`,
    capacity: 500 + (i % 100),
    enrolledCount: 0,
    status: i % 20 === 0 ? 'closed' : 'open',
    createdAt: new Date(2026, 1, (i % 20) + 1, 8)
  };
});

insertInBatches('enrollments', 100000, 1000, (i) => {
  const classId = ((((i - 1) % 2000) * 7 + Math.floor((i - 1) / 2000)) % 240) + 1;
  const classDoc = db.classes.findOne({ _id: classId });
  const status = [0, 1, 2, 3].includes(i % 10) ? 'payed' : (i % 10 === 9 ? 'dropped' : 'enrolled');
  return {
    _id: i,
    enrollmentId: i,
    studentId: `student${pad(((i - 1) % 2000) + 1, 5)}`,
    classId,
    classCode: classDoc.classCode,
    courseCode: classDoc.courseCode,
    courseName: classDoc.courseName,
    credits: classDoc.credits,
    status,
    paymentRequested: [4, 5].includes(i % 10),
    tuitionAmount: classDoc.credits * 600000,
    version: 1,
    enrolledAt: new Date(2026, 1, (i % 21) + 10, 8),
    paidAt: status === 'payed' ? new Date(2026, 2, (i % 10) + 1, 8) : null
  };
});

db.classes.find().forEach((classDoc) => {
  const enrolledCount = db.enrollments.countDocuments({ classId: classDoc._id, status: { $ne: 'dropped' } });
  db.classes.updateOne({ _id: classDoc._id }, { $set: { enrolledCount } });
});

insertInBatches('student_accounts', 2000, 1000, (i) => ({
  _id: i,
  accountId: i,
  studentId: `student${pad(i, 5)}`,
  balance: 2000000 + ((i * 137000) % 9000000),
  version: 1,
  updatedAt: new Date('2026-03-01T08:00:00Z')
}));

const paymentBatch = [];
db.enrollments.find({ $or: [{ paymentRequested: true }, { status: 'payed' }] }).forEach((enrollment) => {
  paymentBatch.push({
    _id: paymentBatch.length + 1,
    paymentId: paymentBatch.length + 1,
    studentId: enrollment.studentId,
    enrollmentId: enrollment.enrollmentId,
    amount: enrollment.tuitionAmount,
    status: enrollment.status === 'payed' ? 'completed' : 'pending',
    requestedAt: new Date(enrollment.enrolledAt.getTime() + 86400000),
    completedAt: enrollment.paidAt
  });
});
db.tuition_payments.insertMany(paymentBatch, { ordered: false });

insertInBatches('audit_logs', 100000, 1000, (i) => ({
  _id: i,
  actor: {
    userId: i % 13 === 0 ? 'admin001' : `student${pad(((i - 1) % 2000) + 1, 5)}`,
    role: i % 13 === 0 ? 'admin' : 'student'
  },
  action: ['CREATE_CLASS', 'ENROLL_CLASS', 'REQUEST_PAYMENT', 'PAY_TUITION', 'DROP_CLASS'][i % 5],
  target: { type: ['class', 'enrollment', 'payment'][i % 3], id: `target_${i}` },
  metadata: { classId: ((i - 1) % 240) + 1, ip: `10.0.${i % 255}.${(i * 7) % 255}` },
  createdAt: new Date(2026, 1, (i % 28) + 1, i % 24, i % 60, i % 60)
}));

db.system_state.insertOne({ _id: 1, currentStage: 'register_class', semester: '2026.2', updatedAt: new Date('2026-02-10T08:00:00Z') });

db.users.createIndex({ role: 1, email: 1 });
db.courses.createIndex({ departmentId: 1, credits: 1 });
db.courses.createIndex({ courseName: 'text', description: 'text' });
db.classes.createIndex({ courseCode: 1, semester: 1 });
db.classes.createIndex({ status: 1, createdAt: -1 });
db.classes.createIndex({ _id: 1, capacity: 1, enrolledCount: 1 });
db.enrollments.createIndex({ studentId: 1, classId: 1 }, { unique: true });
db.enrollments.createIndex({ studentId: 1, status: 1 });
db.enrollments.createIndex({ classId: 1, status: 1 });
db.enrollments.createIndex({ paymentRequested: 1, status: 1 });
db.student_accounts.createIndex({ studentId: 1 }, { unique: true });
db.student_accounts.createIndex({ balance: 1 });
db.tuition_payments.createIndex({ studentId: 1, status: 1 });
db.tuition_payments.createIndex({ requestedAt: 1 });
db.audit_logs.createIndex({ 'actor.userId': 1, createdAt: -1 });
db.audit_logs.createIndex({ action: 1, createdAt: -1 });

print('MongoDB seed finished');
printjson({
  departments: db.departments.countDocuments(),
  users: db.users.countDocuments(),
  courses: db.courses.countDocuments(),
  classes: db.classes.countDocuments(),
  enrollments: db.enrollments.countDocuments(),
  student_accounts: db.student_accounts.countDocuments(),
  tuition_payments: db.tuition_payments.countDocuments(),
  audit_logs: db.audit_logs.countDocuments()
});
