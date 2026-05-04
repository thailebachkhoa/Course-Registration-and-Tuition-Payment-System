param(
  [string]$DbName = $(if ($env:MONGO_DB_NAME) { $env:MONGO_DB_NAME } else { 'course_registration_mongo' }),
  [string]$ContainerName = $(if ($env:MONGO_CONTAINER_NAME) { $env:MONGO_CONTAINER_NAME } else { 'dbms-mongodb' }),
  [string]$BackupDir = '.\backups'
)

$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

$archivePath = Join-Path $BackupDir "$DbName`_$timestamp.archive.gz"
$latestPath = Join-Path $BackupDir 'latest.archive.gz'
$containerArchive = '/tmp/mongo_backup.archive.gz'

docker exec $ContainerName bash -lc "rm -f $containerArchive && mongodump --db $DbName --archive=$containerArchive --gzip" | Out-Null
docker cp "${ContainerName}:${containerArchive}" $archivePath | Out-Null
docker exec $ContainerName rm -f $containerArchive | Out-Null
Copy-Item $archivePath $latestPath -Force

Write-Host "Backup created at $archivePath"
