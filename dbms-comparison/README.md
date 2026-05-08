# DBMS Comparison Lab: MySQL vs MongoDB

This folder is the single comparison lab for the DBMS topics:

1. Data storage & management
2. Indexing
3. Transaction
4. Concurrency control
5. Backup & recovery

The dataset uses the course-registration and tuition-payment domain: departments, users, courses, classes, enrollments, student accounts, tuition payments, and audit logs.

## Dataset

| Data group | Size | Purpose |
|---|---:|---|
| Departments | 4 | Reference data |
| Users | 2005 | Students, teachers, admin |
| Courses | 80 | Text search and course catalog |
| Classes | 240 | Capacity and registration comparison |
| Enrollments | 100000 | Indexing, transaction, concurrency |
| StudentAccounts | 2000 | Tuition account updates |
| TuitionPayments | 60000+ | Payment transaction and recovery |
| AuditLogs | 100000 | Time-based and nested-field indexes |

## Run all tests

```powershell
cd E:\File\hoc\BK\252-DBMS\Course-Registration-and-Tuition-Payment-System-mongodb-branch\dbms-comparison
powershell -ExecutionPolicy Bypass -File .\scripts\run-all.ps1
```

Outputs are written per topic:

```text
mysql_01_storage_management.txt
mongo_01_storage_management.txt
...
mysql_05_backup_recovery.txt
mongo_05_backup_recovery.txt
```

## MVCC two-session demo

Run this to match the original concurrency-control demos that require two concurrent sessions:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-mvcc-demo.ps1
```

Expected observation: Session 1 sees the old snapshot inside its transaction while Session 2 commits an update; after Session 1 commits, a new read sees the updated value.

## Backup and restore

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\restore.ps1 `
  -MySqlDump .\backups\mysql\course_comparison_YYYYMMDD-HHMMSS.sql `
  -MongoArchive .\backups\mongo\course_comparison_YYYYMMDD-HHMMSS.archive
```

## Comparison map

| Topic | MySQL | MongoDB |
|---|---|---|
| Data storage & management | Normalized tables, FK constraints | Documents with denormalized read fields |
| Indexing | B-tree, composite, fulltext, functional index emulation | Single, compound, text, nested, partial indexes |
| Transaction | InnoDB ACID, constraints at DB layer | Multi-document transactions on replica set |
| Concurrency control | `SELECT ... FOR UPDATE`, isolation, optimistic versioning, MVCC | Atomic predicates, explicit versioning, snapshot transactions |
| Backup & recovery | `mysqldump`, binary log readiness, restore | `mongodump`, `mongorestore`, archive restore |

See `TEST_EVALUATION.md` for coverage and latest validation notes.
