# Demo 06 - Backup and Recovery

## Goal
Show how MongoDB backup and restore works for the comparison database using `mongodump` and `mongorestore`.

## Preconditions
- Docker Compose stack is up: `npm run docker:up`
- Database is seeded: `npm run seed`
- Container name is `dbms-mongodb`

## Linux / macOS
```bash
cd dbms-comparison/mongodb
chmod +x scripts/backup.sh scripts/restore.sh
./scripts/backup.sh
docker exec dbms-mongodb mongosh --quiet --eval "db.getSiblingDB('course_registration_mongo').dropDatabase()"
./scripts/restore.sh backups/latest.archive.gz
docker exec dbms-mongodb mongosh --quiet --eval "db.getSiblingDB('course_registration_mongo').users.countDocuments()"
```

## Windows PowerShell
```powershell
cd dbms-comparison/mongodb
.\scripts\backup.ps1
docker exec dbms-mongodb mongosh --quiet --eval "db.getSiblingDB('course_registration_mongo').dropDatabase()"
.\scripts\restore.ps1 -ArchivePath .\backups\latest.archive.gz
docker exec dbms-mongodb mongosh --quiet --eval "db.getSiblingDB('course_registration_mongo').users.countDocuments()"
```

## What to capture for the report
1. Backup archive file created successfully.
2. Database dropped.
3. Restore command completed.
4. Document counts after restore match the seeded counts.

## Expected verification counts after restore
- `users`: 8
- `courses`: 6
- `classes`: 5
- `enrollments`: 5
- `system_state`: 1
- `activity_logs`: 4
- `student_dashboard_snapshots`: 2
- `payment_request_snapshots`: 1

## Note
This demo intentionally focuses on operational commands, because backup/recovery is more about DBMS tooling than application logic.
