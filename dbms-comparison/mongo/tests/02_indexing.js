var database = db.getSiblingDB('course_comparison');

function compactExplain(label, cursor) {
  print(label);
  var explain = cursor.explain('executionStats');
  printjson({
    winningPlan: explain.queryPlanner.winningPlan,
    totalKeysExamined: explain.executionStats.totalKeysExamined,
    totalDocsExamined: explain.executionStats.totalDocsExamined,
    nReturned: explain.executionStats.nReturned,
    executionTimeMillis: explain.executionStats.executionTimeMillis
  });
}

print('=== 02 INDEXING - MongoDB before/after indexes on 100k enrollments and 100k audit logs ===');
printjson({ enrollments: database.enrollments.countDocuments(), audit_logs: database.audit_logs.countDocuments() });

database.enrollments_no_index.drop();
database.audit_logs_no_index.drop();
database.enrollments.aggregate([{ $out: 'enrollments_no_index' }]);
database.audit_logs.aggregate([{ $out: 'audit_logs_no_index' }]);

compactExplain('WITHOUT secondary index: scan copied enrollment collection', database.enrollments_no_index.find({ studentId: 'student00005', status: 'enrolled' }));
compactExplain('WITH compound index { studentId: 1, status: 1 }', database.enrollments.find({ studentId: 'student00005', status: 'enrolled' }));
compactExplain('WITHOUT nested actor/time index: scan copied audit log collection', database.audit_logs_no_index.find({ 'actor.userId': 'student00001' }).sort({ createdAt: -1 }).limit(20));
compactExplain('WITH nested compound index { actor.userId: 1, createdAt: -1 }', database.audit_logs.find({ 'actor.userId': 'student00001' }).sort({ createdAt: -1 }).limit(20));
compactExplain('TEXT index on courseName + description', database.courses.find({ $text: { $search: 'database transaction recovery' } }, { score: { $meta: 'textScore' }, courseCode: 1, courseName: 1 }));

try {
  database.tuition_payments.dropIndex('idx_pending_payment_student_date');
} catch (error) {
  if (error.codeName !== 'IndexNotFound') { throw error; }
}
database.tuition_payments.createIndex(
  { studentId: 1, requestedAt: -1 },
  { name: 'idx_pending_payment_student_date', partialFilterExpression: { status: 'pending' } }
);
compactExplain('PARTIAL INDEX - pending payments are inside partial index', database.tuition_payments.find({ studentId: 'student00005', status: 'pending' }).sort({ requestedAt: -1 }));
compactExplain('PARTIAL INDEX - completed payments are outside pending-only partial index', database.tuition_payments.find({ studentId: 'student00001', status: 'completed' }).sort({ requestedAt: -1 }));

database.write_light.drop();
database.write_heavy.drop();
database.createCollection('write_light');
database.createCollection('write_heavy');
database.write_heavy.createIndex({ studentId: 1, status: 1 });
database.write_heavy.createIndex({ classId: 1, status: 1 });
database.write_heavy.createIndex({ note: 1 });
database.write_heavy.createIndex({ note: 'text' });

function insertBenchmark(collectionName, total) {
  var collection = database.getCollection(collectionName);
  var start = Date.now();
  for (var offset = 1; offset <= total; offset += 1000) {
    var batch = [];
    for (var i = offset; i < offset + 1000 && i <= total; i += 1) {
      batch.push({
        studentId: `student${String((i % 2000) + 1).padStart(5, '0')}`,
        classId: (i % 240) + 1,
        status: i % 2 === 0 ? 'enrolled' : 'payed',
        note: `${collectionName} write benchmark ${i}`
      });
    }
    collection.insertMany(batch, { ordered: false });
  }
  return Date.now() - start;
}

print('WRITE COST - compare insert into collection with few indexes vs many indexes');
printjson({
  insertedDocumentsPerCollection: 20000,
  write_light_ms: insertBenchmark('write_light', 20000),
  write_heavy_ms: insertBenchmark('write_heavy', 20000),
  write_heavy_index_count: database.write_heavy.getIndexes().length,
  write_light_index_count: database.write_light.getIndexes().length
});
