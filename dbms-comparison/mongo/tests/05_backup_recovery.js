var database = db.getSiblingDB('course_comparison');

print('=== 05 BACKUP & RECOVERY - MongoDB archive backup and restore readiness ===');
print('Replica set state for transaction/recovery operational model:');
printjson(database.adminCommand({ replSetGetStatus: 1 }).myState);
print('Critical financial collection counts before backup:');
printjson({
  enrollments: database.enrollments.countDocuments(),
  student_accounts: database.student_accounts.countDocuments(),
  tuition_payments: database.tuition_payments.countDocuments()
});
print('Real commands:');
print('Backup:  powershell -ExecutionPolicy Bypass -File .\\scripts\\backup.ps1');
print('Restore: powershell -ExecutionPolicy Bypass -File .\\scripts\\restore.ps1 -MySqlDump <sql> -MongoArchive <archive>');
