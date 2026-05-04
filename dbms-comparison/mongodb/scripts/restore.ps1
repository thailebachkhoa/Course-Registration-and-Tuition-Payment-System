param(
  [string]$DbName = $(if ($env:MONGO_DB_NAME) { $env:MONGO_DB_NAME } else { 'course_registration_mongo' }),
  [string]$ContainerName = $(if ($env:MONGO_CONTAINER_NAME) { $env:MONGO_CONTAINER_NAME } else { 'dbms-mongodb' }),
  [string]$ArchivePath = '.\backups\latest.archive.gz'
)

if (-not (Test-Path $ArchivePath)) {
  throw "Archive not found: $ArchivePath"
}

$containerArchive = '/tmp/mongo_restore.archive.gz'
$resolvedArchivePath = (Resolve-Path $ArchivePath).Path

docker cp $resolvedArchivePath "${ContainerName}:${containerArchive}" | Out-Null
docker exec $ContainerName bash -lc "mongorestore --nsInclude '$DbName.*' --drop --archive=$containerArchive --gzip && rm -f $containerArchive" | Out-Null

Write-Host "Restore completed from $ArchivePath"
