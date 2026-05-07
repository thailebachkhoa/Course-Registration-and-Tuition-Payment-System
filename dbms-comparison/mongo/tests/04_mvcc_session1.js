var database = db.getSiblingDB('course_comparison');

print('MONGODB MVCC SESSION 1 - T1 starts snapshot transaction');
var session = database.getMongo().startSession();
var txDb = session.getDatabase('course_comparison');

session.startTransaction({ readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });

print('T1 first read: snapshot is established here');
printjson(txDb.student_accounts.findOne({ studentId: 'student00004' }, { studentId: 1, balance: 1, version: 1 }));
print('T1 waits while Session 2 commits an update');
sleep(8000);
print('T1 second read: still sees the original snapshot');
printjson(txDb.student_accounts.findOne({ studentId: 'student00004' }, { studentId: 1, balance: 1, version: 1 }));

session.commitTransaction();
session.endSession();

print('T1 after COMMIT: a new read sees Session 2 committed value');
printjson(database.student_accounts.findOne({ studentId: 'student00004' }, { studentId: 1, balance: 1, version: 1 }));
