var database = db.getSiblingDB('course_comparison');

print('=== 03 TRANSACTION - MongoDB multi-document payment workflow ===');

var studentId = 'student00005';
var beforeEnrollment = database.enrollments.findOne({ studentId, status: 'enrolled' }, { sort: { enrollmentId: 1 } });

print('Before payment:');
printjson(database.student_accounts.findOne({ studentId }, { studentId: 1, balance: 1, version: 1 }));
printjson(beforeEnrollment);

var session = database.getMongo().startSession();
var txDb = session.getDatabase('course_comparison');
session.startTransaction({ readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
try {
  var enrollment = txDb.enrollments.findOne({ _id: beforeEnrollment._id });
  var accountUpdate = txDb.student_accounts.updateOne(
    { studentId, balance: { $gte: enrollment.tuitionAmount } },
    { $inc: { balance: -enrollment.tuitionAmount, version: 1 }, $set: { updatedAt: new Date() } }
  );
  if (accountUpdate.modifiedCount !== 1) { throw new Error('Insufficient balance or concurrent account update'); }
  txDb.enrollments.updateOne(
    { _id: enrollment._id },
    { $set: { status: 'payed', paymentRequested: false, paidAt: new Date() }, $inc: { version: 1 } }
  );
  txDb.tuition_payments.insertOne({
    studentId,
    enrollmentId: enrollment.enrollmentId,
    amount: enrollment.tuitionAmount,
    status: 'completed',
    requestedAt: new Date(),
    completedAt: new Date()
  });
  session.commitTransaction();
} catch (error) {
  session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}

print('After payment: all related documents changed together');
printjson(database.student_accounts.findOne({ studentId }, { studentId: 1, balance: 1, version: 1 }));
printjson(database.enrollments.findOne({ _id: beforeEnrollment._id }, { enrollmentId: 1, studentId: 1, status: 1, paidAt: 1, version: 1 }));
database.tuition_payments.find({ enrollmentId: beforeEnrollment.enrollmentId }).sort({ requestedAt: -1 }).limit(3).forEach(printjson);

print('Default multi-document updateMany works, but transaction is used when the business unit must be all-or-nothing:');
var requestResult = database.enrollments.updateMany({ studentId: 'student00006', status: 'enrolled' }, { $set: { paymentRequested: true } });
printjson({ matchedByOneUpdateMany: requestResult.matchedCount, modifiedByOneUpdateMany: requestResult.modifiedCount });

print('MongoDB does not enforce foreign keys between collections by default:');
database.enrollments.insertOne({
  _id: 'invalid_fk_demo',
  enrollmentId: 'invalid_fk_demo',
  studentId: 'student00006',
  classId: 999999,
  status: 'enrolled',
  paymentRequested: false,
  tuitionAmount: 1800000,
  version: 1,
  enrolledAt: new Date()
});
printjson(database.enrollments.findOne({ _id: 'invalid_fk_demo' }, { studentId: 1, classId: 1, status: 1 }));
database.enrollments.deleteOne({ _id: 'invalid_fk_demo' });

print('Application-side transaction check rejects the same invalid class:');
var validationSession = database.getMongo().startSession();
var validationDb = validationSession.getDatabase('course_comparison');
validationSession.startTransaction();
try {
  var selectedClass = validationDb.classes.findOne({ _id: 999999 });
  if (!selectedClass) { throw new Error('Class does not exist'); }
  validationDb.enrollments.insertOne({ studentId: 'student00006', classId: 999999, status: 'enrolled', enrolledAt: new Date() });
  validationSession.commitTransaction();
} catch (error) {
  print(error.message);
  validationSession.abortTransaction();
} finally {
  validationSession.endSession();
}
printjson({ invalidClassDocumentsAfterAbort: database.enrollments.countDocuments({ classId: 999999 }) });
