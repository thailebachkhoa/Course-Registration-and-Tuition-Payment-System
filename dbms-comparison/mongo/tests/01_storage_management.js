var database = db.getSiblingDB('course_comparison');

print('=== 01 DATA STORAGE & MANAGEMENT - MongoDB document model with embedded read fields ===');
printjson({
  departments: database.departments.countDocuments(),
  users: database.users.countDocuments(),
  courses: database.courses.countDocuments(),
  classes: database.classes.countDocuments(),
  enrollments: database.enrollments.countDocuments(),
  student_accounts: database.student_accounts.countDocuments(),
  tuition_payments: database.tuition_payments.countDocuments(),
  audit_logs: database.audit_logs.countDocuments()
});

print('Sample enrollment documents already contain class/course snapshot fields:');
database.enrollments.find(
  { studentId: 'student00001' },
  { studentId: 1, courseCode: 1, courseName: 1, classCode: 1, status: 1, tuitionAmount: 1 }
).sort({ enrolledAt: 1 }).limit(10).forEach(printjson);

print('Optional relational-style lookup remains available:');
database.enrollments.aggregate([
  { $match: { studentId: 'student00001' } },
  { $limit: 3 },
  { $lookup: { from: 'classes', localField: 'classId', foreignField: '_id', as: 'classDoc' } },
  { $project: { studentId: 1, courseCode: 1, classCode: 1, joinedClassCount: { $size: '$classDoc' } } }
]).forEach(printjson);
