USE course_comparison;

SELECT '05 BACKUP & RECOVERY - MySQL logical backup and binary log readiness' AS topic;
SHOW VARIABLES LIKE 'log_bin';
SHOW VARIABLES LIKE 'binlog_format';
SELECT 'Critical financial table checksums before backup' AS evidence;
CHECKSUM TABLE Enrollments, StudentAccounts, TuitionPayments;
SELECT 'Real commands' AS demo;
SELECT 'Backup:  powershell -ExecutionPolicy Bypass -File .\\scripts\\backup.ps1' AS command_line
UNION ALL
SELECT 'Restore: powershell -ExecutionPolicy Bypass -File .\\scripts\\restore.ps1 -MySqlDump <sql> -MongoArchive <archive>';
