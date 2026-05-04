# MongoDB Comparison Demo Runbook

## 1. Setup

```bash
cd dbms-comparison/mongodb
npm install
npm run preflight
npm run docker:up
```

On Windows, Docker Desktop must be installed and running before `npm run docker:up`.
Wait a few seconds for the replica set to initialize.

## 2. Seed baseline data

```bash
npm run seed
```

Expected output:
- database recreated
- document counts printed for all 8 collections

## 3. Run each demo

### Demo 01 - Storage
```bash
npm run demo:01
```

Expected:
- sample `course`, `class`, `enrollment`
- sample `student_dashboard_snapshot`
- explanation of denormalization vs normalized MySQL

### Demo 02 - Indexing
```bash
npm run demo:02
```

Expected:
- explain output before index
- explain output after index
- lower `totalDocsExamined` or visible index usage

### Demo 03 - Query Processing
```bash
npm run demo:03
```

Expected:
- insert
- update
- delete
- single-condition query
- composite query
- `$lookup`
- subquery-like aggregation
- `$group` aggregate

### Demo 04 - Transaction
```bash
npm run demo:04
```

Expected:
- one successful transactional enrollment
- one duplicate attempt rejected
- class count and logs remain consistent

### Demo 05 - Concurrency Control
```bash
npm run demo:05
```

Expected:
- unsafe version shows possible inconsistency or over-enroll
- safe version allows only one success

### Demo 06 - Backup and Recovery
```bash
npm run demo:06
```

Expected:
- backup and restore workflow summary
- commands for Windows PowerShell and Linux/macOS
- verification steps for document counts after restore

Real commands remain separate:
- `src/06_backup_recovery_demo.md`

Run on Windows:
```powershell
npm run backup:ps
.\scripts\restore.ps1 -ArchivePath .\backups\latest.archive.gz
```

Run on Linux/macOS:
```bash
./scripts/backup.sh
./scripts/restore.sh ./backups/latest.archive.gz
```

## 4. Optional full demo flow

```bash
npm run preflight
npm run seed
npm run demo:all
```

## 5. Cleanup

```bash
npm run docker:down
```

## 6. Presentation tips
- Show `classes` document to explain denormalization
- Show `student_dashboard_snapshots` to explain MongoDB read models
- Show `explain("executionStats")` before and after indexes
- Show unsafe vs safe concurrency result side by side
- Keep reminding that MySQL remains the main transactional app
