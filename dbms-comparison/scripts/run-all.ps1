$ErrorActionPreference = "Stop"

function Invoke-Checked {
  param([Parameter(Mandatory = $true)][scriptblock]$Command)
  & $Command
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed with exit code $LASTEXITCODE"
  }
}

Invoke-Checked { docker compose up -d }

Write-Host "Waiting for MySQL..."
Invoke-Checked { docker compose exec -T mysql mysqladmin ping -uroot -proot --silent }

Write-Host "Waiting for MongoDB replica set primary..."
for ($i = 1; $i -le 60; $i++) {
  docker compose exec -T mongo mongosh --quiet --eval "try { rs.status().myState === 1 ? quit(0) : quit(1) } catch (e) { quit(1) }" | Out-Null
  if ($LASTEXITCODE -eq 0) { break }
  if ($i -eq 60) { throw "MongoDB replica set did not become primary in time" }
  Start-Sleep -Seconds 2
}

Write-Host "Resetting and seeding MySQL..."
Get-Content ".\mysql\init\01_schema_seed.sql" | docker compose exec -T mysql sh -lc "mysql --protocol=TCP -h 127.0.0.1 -uroot -proot course_comparison" | Out-Null
if ($LASTEXITCODE -ne 0) { throw "MySQL seed failed with exit code $LASTEXITCODE" }

Write-Host "Resetting and seeding MongoDB..."
Invoke-Checked { docker compose exec -T mongo mongosh --quiet /docker-entrypoint-initdb.d/01_seed.js }

Write-Host "Verifying seed counts..."
$mysqlEnrollmentCount = docker compose exec -T mysql sh -lc "mysql --protocol=TCP -h 127.0.0.1 -uroot -proot -N -B -e 'SELECT COUNT(*) FROM course_comparison.Enrollments'"
if (($mysqlEnrollmentCount | Select-Object -Last 1).Trim() -ne "100000") {
  throw "Unexpected MySQL enrollment count: $mysqlEnrollmentCount"
}

$mongoEnrollmentCount = docker compose exec -T mongo mongosh --quiet --eval "db.getSiblingDB('course_comparison').enrollments.countDocuments()"
if (($mongoEnrollmentCount | Select-Object -Last 1).Trim() -ne "100000") {
  throw "Unexpected MongoDB enrollment count: $mongoEnrollmentCount"
}

$topics = @(
  "01_storage_management",
  "02_indexing",
  "03_transaction",
  "04_concurrency_control",
  "05_backup_recovery"
)

foreach ($topic in $topics) {
  Write-Host "`nRunning MySQL topic: $topic"
  Get-Content ".\mysql\tests\$topic.sql" | docker compose exec -T mysql sh -lc "mysql --protocol=TCP -h 127.0.0.1 -uroot -proot course_comparison" | Tee-Object -FilePath ".\mysql_$topic.txt"
  if ($LASTEXITCODE -ne 0) { throw "MySQL topic $topic failed with exit code $LASTEXITCODE" }

  Write-Host "`nRunning MongoDB topic: $topic"
  docker compose exec -T mongo mongosh --quiet "/tests/$topic.js" | Tee-Object -FilePath ".\mongo_$topic.txt"
  if ($LASTEXITCODE -ne 0) { throw "MongoDB topic $topic failed with exit code $LASTEXITCODE" }
}

Write-Host "`nPer-topic results written to mysql_*.txt and mongo_*.txt"
