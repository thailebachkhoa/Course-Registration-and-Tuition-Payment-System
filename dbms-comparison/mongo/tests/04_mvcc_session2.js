var database = db.getSiblingDB('course_comparison');

print('MONGODB MVCC SESSION 2 - T2 waits for T1 snapshot, then updates');
sleep(2000);
database.student_accounts.updateOne(
  { studentId: 'student00004' },
  { $inc: { balance: 100000, version: 1 }, $set: { updatedAt: new Date() } }
);
print('T2 committed update');
printjson(database.student_accounts.findOne({ studentId: 'student00004' }, { studentId: 1, balance: 1, version: 1 }));
