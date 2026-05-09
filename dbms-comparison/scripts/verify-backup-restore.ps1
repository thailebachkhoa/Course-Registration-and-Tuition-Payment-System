$ErrorActionPreference = "Stop"

function Invoke-Checked {
  param([Parameter(Mandatory = $true)][scriptblock]$Command)
  & $Command
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed with exit code $LASTEXITCODE"
  }
}

function Get-MySqlEvidence {
  docker compose exec -T mysql mysql --protocol=TCP -h 127.0.0.1 -uroot -proot -N -B -e @"
SELECT 'COUNT', 'Enrollments', COUNT(*) FROM course_comparison.Enrollments
UNION ALL SELECT 'COUNT', 'AuditLogs', COUNT(*) FROM course_comparison.AuditLogs
UNION ALL SELECT 'COUNT', 'StudentAccounts', COUNT(*) FROM course_comparison.StudentAccounts
UNION ALL SELECT 'COUNT', 'TuitionPayments', COUNT(*) FROM course_comparison.TuitionPayments;
USE course_comparison;
CHECKSUM TABLE Enrollments, StudentAccounts, TuitionPayments;
"@
}

function Get-MongoEvidence {
  docker compose exec -T mongo mongosh --quiet --eval @"
const dbx = db.getSiblingDB('course_comparison');
const hashes = dbx.runCommand({ dbHash: 1 }).collections;
print(JSON.stringify({
  counts: {
    enrollments: dbx.enrollments.countDocuments(),
    audit_logs: dbx.audit_logs.countDocuments(),
    student_accounts: dbx.student_accounts.countDocuments(),
    tuition_payments: dbx.tuition_payments.countDocuments()
  },
  hashes: {
    enrollments: hashes.enrollments,
    audit_logs: hashes.audit_logs,
    student_accounts: hashes.student_accounts,
    tuition_payments: hashes.tuition_payments
  }
}));
"@
}

Write-Host "Capturing evidence before backup..."
$mysqlBefore = Get-MySqlEvidence
if ($LASTEXITCODE -ne 0) { throw "Failed to capture MySQL evidence before backup" }
$mongoBefore = Get-MongoEvidence
if ($LASTEXITCODE -ne 0) { throw "Failed to capture MongoDB evidence before backup" }

$mysqlBefore | Set-Content -Path ".\mysql_05_before_restore_verify.txt"
$mongoBefore | Set-Content -Path ".\mongo_05_before_restore_verify.txt"

Write-Host "Running backup..."
Invoke-Checked { powershell -ExecutionPolicy Bypass -File .\scripts\backup.ps1 }

$mysqlDump = Get-ChildItem ".\backups\mysql\course_comparison_*.sql" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$mongoArchive = Get-ChildItem ".\backups\mongo\course_comparison_*.archive" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $mysqlDump) { throw "No MySQL backup file found" }
if (-not $mongoArchive) { throw "No MongoDB backup file found" }

Write-Host "Running restore from latest backup..."
Invoke-Checked {
  powershell -ExecutionPolicy Bypass -File .\scripts\restore.ps1 `
    -MySqlDump $mysqlDump.FullName `
    -MongoArchive $mongoArchive.FullName
}

Write-Host "Capturing evidence after restore..."
$mysqlAfter = Get-MySqlEvidence
if ($LASTEXITCODE -ne 0) { throw "Failed to capture MySQL evidence after restore" }
$mongoAfter = Get-MongoEvidence
if ($LASTEXITCODE -ne 0) { throw "Failed to capture MongoDB evidence after restore" }

$mysqlAfter | Set-Content -Path ".\mysql_05_after_restore_verify.txt"
$mongoAfter | Set-Content -Path ".\mongo_05_after_restore_verify.txt"

$mysqlMatches = (($mysqlBefore -join "`n") -eq ($mysqlAfter -join "`n"))
$mongoMatches = (($mongoBefore -join "`n") -eq ($mongoAfter -join "`n"))

Write-Host "MySQL before/after evidence match: $mysqlMatches"
Write-Host "MongoDB before/after evidence match: $mongoMatches"

if (-not $mysqlMatches) { throw "MySQL evidence changed after restore" }
if (-not $mongoMatches) { throw "MongoDB evidence changed after restore" }

Write-Host "Backup/restore verification completed successfully."
