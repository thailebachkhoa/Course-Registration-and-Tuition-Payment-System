param(
  [Parameter(Mandatory = $true)]
  [string]$MySqlDump,

  [Parameter(Mandatory = $true)]
  [string]$MongoArchive
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $MySqlDump)) { throw "MySQL dump not found: $MySqlDump" }
if (-not (Test-Path $MongoArchive)) { throw "Mongo archive not found: $MongoArchive" }

New-Item -ItemType Directory -Force -Path .\backups\mysql, .\backups\mongo | Out-Null

$mysqlName = Split-Path $MySqlDump -Leaf
$mongoName = Split-Path $MongoArchive -Leaf
$mysqlTarget = Resolve-Path -LiteralPath ".\backups\mysql" | ForEach-Object { Join-Path $_ $mysqlName }
$mongoTarget = Resolve-Path -LiteralPath ".\backups\mongo" | ForEach-Object { Join-Path $_ $mongoName }
$mysqlSource = Resolve-Path -LiteralPath $MySqlDump
$mongoSource = Resolve-Path -LiteralPath $MongoArchive

if ($mysqlSource.Path -ne $mysqlTarget) {
  Copy-Item -LiteralPath $mysqlSource.Path -Destination $mysqlTarget -Force
}
if ($mongoSource.Path -ne $mongoTarget) {
  Copy-Item -LiteralPath $mongoSource.Path -Destination $mongoTarget -Force
}

docker compose exec -T mysql sh -lc "mysql -h127.0.0.1 -uroot -proot -e 'DROP DATABASE IF EXISTS course_comparison; CREATE DATABASE course_comparison CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;'"
if ($LASTEXITCODE -ne 0) { throw "MySQL database reset failed with exit code $LASTEXITCODE" }

Get-Content -LiteralPath $mysqlTarget | docker compose exec -T mysql sh -lc "mysql -h127.0.0.1 -uroot -proot course_comparison"
if ($LASTEXITCODE -ne 0) { throw "MySQL restore failed with exit code $LASTEXITCODE" }

docker compose exec -T mongo sh -lc "mongorestore --drop --archive=/backups/$mongoName --gzip"
if ($LASTEXITCODE -ne 0) { throw "MongoDB restore failed with exit code $LASTEXITCODE" }

Write-Host "Restore completed."
