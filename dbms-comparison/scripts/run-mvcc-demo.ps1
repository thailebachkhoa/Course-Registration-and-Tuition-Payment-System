$ErrorActionPreference = "Stop"

function Invoke-Checked {
  param([Parameter(Mandatory = $true)][scriptblock]$Command)
  & $Command
  if ($LASTEXITCODE -ne 0) { throw "Command failed with exit code $LASTEXITCODE" }
}

Invoke-Checked { docker compose up -d }

Write-Host "Resetting MVCC demo account in MySQL..."
@'
UPDATE StudentAccounts
SET balance = 2548000, version = 1, updated_at = NOW()
WHERE student_id = 'student00004';
'@ | docker compose exec -T mysql sh -lc "mysql --protocol=TCP -h 127.0.0.1 -uroot -proot course_comparison 2>/dev/null"
if ($LASTEXITCODE -ne 0) { throw "MySQL MVCC reset failed with exit code $LASTEXITCODE" }

Write-Host "Running MySQL two-session MVCC demo..."
$mysqlSession1 = Start-Job -ScriptBlock {
  param($workdir)
  $ErrorActionPreference = "Continue"
  Set-Location $workdir
  Get-Content ".\mysql\tests\04_mvcc_session1.sql" | docker compose exec -T mysql sh -lc "mysql --protocol=TCP -h 127.0.0.1 -uroot -proot course_comparison 2>/dev/null"
} -ArgumentList (Get-Location).Path

Start-Sleep -Seconds 1

$mysqlSession2 = Start-Job -ScriptBlock {
  param($workdir)
  $ErrorActionPreference = "Continue"
  Set-Location $workdir
  Get-Content ".\mysql\tests\04_mvcc_session2.sql" | docker compose exec -T mysql sh -lc "mysql --protocol=TCP -h 127.0.0.1 -uroot -proot course_comparison 2>/dev/null"
} -ArgumentList (Get-Location).Path

Wait-Job $mysqlSession1, $mysqlSession2 | Out-Null
Receive-Job $mysqlSession1 -ErrorAction SilentlyContinue | Tee-Object -FilePath ".\mysql_04_mvcc_session1.txt"
Receive-Job $mysqlSession2 -ErrorAction SilentlyContinue | Tee-Object -FilePath ".\mysql_04_mvcc_session2.txt"
Remove-Job $mysqlSession1, $mysqlSession2

Write-Host "Resetting MVCC demo account in MongoDB..."
Invoke-Checked {
  docker compose exec -T mongo mongosh --quiet --eval "db.getSiblingDB('course_comparison').student_accounts.updateOne({ studentId: 'student00004' }, { `$set: { balance: 2548000, version: 1, updatedAt: new Date() } })"
}

Write-Host "Running MongoDB two-session MVCC demo..."
$mongoSession1 = Start-Job -ScriptBlock {
  param($workdir)
  $ErrorActionPreference = "Continue"
  Set-Location $workdir
  docker compose exec -T mongo mongosh --quiet /tests/04_mvcc_session1.js 2>&1
} -ArgumentList (Get-Location).Path

Start-Sleep -Seconds 1

$mongoSession2 = Start-Job -ScriptBlock {
  param($workdir)
  $ErrorActionPreference = "Continue"
  Set-Location $workdir
  docker compose exec -T mongo mongosh --quiet /tests/04_mvcc_session2.js 2>&1
} -ArgumentList (Get-Location).Path

Wait-Job $mongoSession1, $mongoSession2 | Out-Null
Receive-Job $mongoSession1 -ErrorAction SilentlyContinue | Tee-Object -FilePath ".\mongo_04_mvcc_session1.txt"
Receive-Job $mongoSession2 -ErrorAction SilentlyContinue | Tee-Object -FilePath ".\mongo_04_mvcc_session2.txt"
Remove-Job $mongoSession1, $mongoSession2

Write-Host "MVCC demo outputs written to mysql_04_mvcc_session*.txt and mongo_04_mvcc_session*.txt"
