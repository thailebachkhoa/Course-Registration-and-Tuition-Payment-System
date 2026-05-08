var database = db.getSiblingDB('course_comparison');

print('=== 04 CONCURRENCY CONTROL - MongoDB atomic conditional update and optimistic versioning ===');
print('MongoDB comparison point: no SELECT FOR UPDATE syntax; use atomic predicates, transactions, and explicit version fields.');
print('For the two-session MVCC snapshot demo, run scripts/run-mvcc-demo.ps1.');

print('Atomic capacity guard using one findOneAndUpdate predicate:');
printjson(database.classes.findOne({ _id: 29 }, { classCode: 1, capacity: 1, enrolledCount: 1 }));
printjson(database.classes.findOneAndUpdate(
  { _id: 29, $expr: { $lt: ['$enrolledCount', '$capacity'] } },
  { $inc: { enrolledCount: 1 } },
  { returnDocument: 'after', projection: { classCode: 1, capacity: 1, enrolledCount: 1 } }
));

print('Optimistic concurrency by version field:');
var original = database.enrollments.findOne({ _id: 2 }, { version: 1, paymentRequested: 1 });
var optimistic = database.enrollments.updateOne({ _id: 2, version: original.version }, { $set: { paymentRequested: true }, $inc: { version: 1 } });
printjson({ optimisticUpdateRows: optimistic.modifiedCount });
var stale = database.enrollments.updateOne({ _id: 2, version: original.version }, { $set: { paymentRequested: false }, $inc: { version: 1 } });
printjson({ staleVersionUpdateRows: stale.modifiedCount });

print('Lost update prevention: stale version update fails instead of overwriting newer data');
var account = database.student_accounts.findOne({ studentId: 'student00003' });
var firstWriter = database.student_accounts.updateOne(
  { studentId: 'student00003', version: account.version },
  { $set: { balance: account.balance + 100000 }, $inc: { version: 1 } }
);
var staleSecondWriter = database.student_accounts.updateOne(
  { studentId: 'student00003', version: account.version },
  { $set: { balance: account.balance + 50000 }, $inc: { version: 1 } }
);
printjson({
  firstWriterRows: firstWriter.modifiedCount,
  staleSecondWriterRows: staleSecondWriter.modifiedCount,
  finalAccount: database.student_accounts.findOne({ studentId: 'student00003' }, { studentId: 1, balance: 1, version: 1 })
});
