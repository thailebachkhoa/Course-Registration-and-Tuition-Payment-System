# DBMS Comparison Test Evaluation

| Topic | Test files | What is demonstrated | Remaining limitation |
|---|---|---|---|
| Data storage & management | `mysql/tests/01_storage_management.sql`, `mongo/tests/01_storage_management.js` | MySQL normalized schema and FK; MongoDB denormalized read fields and optional `$lookup` | Does not benchmark physical storage size |
| Indexing | `mysql/tests/02_indexing.sql`, `mongo/tests/02_indexing.js` | 100k rows/docs, scan vs index, compound, text, partial index, nested index, write cost | No geospatial case because the course-registration domain has no location data |
| Transaction | `mysql/tests/03_transaction.sql`, `mongo/tests/03_transaction.js` | Payment ACID workflow, MySQL FK rejection, MongoDB no FK by default plus transaction-side validation | Does not simulate crash during commit |
| Concurrency control | `mysql/tests/04_concurrency_control.sql`, `mongo/tests/04_concurrency_control.js`, `scripts/run-mvcc-demo.ps1` | Row lock, atomic predicates, optimistic versioning, stale writer rejection, two-session MVCC snapshot | Deadlock demo remains documented rather than automated |
| Backup & recovery | `mysql/tests/05_backup_recovery.sql`, `mongo/tests/05_backup_recovery.js`, `scripts/backup.ps1`, `scripts/restore.ps1`, `scripts/verify-backup-restore.ps1` | MySQL dump/binlog readiness/checksum; MongoDB archive dump/restore, replica set state, and `dbHash`; before/after restore verification | MySQL point-in-time binlog replay is not fully automated |

Latest verified behavior:

- `scripts/run-all.ps1` completed successfully.
- `scripts/backup.ps1` and `scripts/restore.ps1` completed successfully.
- `scripts/verify-backup-restore.ps1` completed successfully with matching MySQL before/after checksum evidence and matching MongoDB before/after `dbHash` evidence.
- Post-restore counts were `Enrollments=100000`, `AuditLogs=100000`, `StudentAccounts=2000`, `TuitionPayments=60001` for both databases.
- `scripts/run-mvcc-demo.ps1` completed successfully and showed snapshot behavior in both MySQL and MongoDB.
