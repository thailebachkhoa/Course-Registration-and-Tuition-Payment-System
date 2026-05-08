$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path .\backups\mysql, .\backups\mongo | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"

docker compose exec -T mysql sh -lc "mysqldump -h127.0.0.1 -uroot -proot --single-transaction --routines --triggers course_comparison > /backups/course_comparison_$stamp.sql"
if ($LASTEXITCODE -ne 0) { throw "MySQL backup failed with exit code $LASTEXITCODE" }

docker compose exec -T mongo sh -lc "mongodump --db course_comparison --archive=/backups/course_comparison_$stamp.archive --gzip"
if ($LASTEXITCODE -ne 0) { throw "MongoDB backup failed with exit code $LASTEXITCODE" }

Write-Host "Created:"
Write-Host "  backups/mysql/course_comparison_$stamp.sql"
Write-Host "  backups/mongo/course_comparison_$stamp.archive"
