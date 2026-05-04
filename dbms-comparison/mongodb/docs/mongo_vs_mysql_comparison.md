# MongoDB vs MySQL Comparison

## Comparison Table

| Topic | MySQL approach | MongoDB approach | Demo script | Better fit in this system |
|---|---|---|---|---|
| Data storage & management | Normalized tables with FK relationships | Document collections with denormalized read fields and snapshots | `src/01_storage_demo.js` | MySQL for core transactions, MongoDB for snapshots/logs |
| Indexing | B-tree indexes on table columns and composite keys | Single-field and compound indexes on document fields, including nested fields | `src/02_indexing_demo.js` | Both strong; MongoDB shines on document + nested field indexes |
| Query processing | SQL with joins, subqueries, aggregates | Find, aggregation pipeline, `$lookup`, `$group`, subquery-like pipeline logic | `src/03_query_processing_demo.js` | MySQL for relational clarity, MongoDB for flexible pipelines |
| Transaction | Native ACID transactions across normalized tables | Multi-document transactions available on replica sets | `src/04_transaction_demo.js` | MySQL simpler for this app's core workflow |
| Concurrency control | Row locks, transaction isolation, atomic updates | Atomic document updates and transactions; easy to design wrongly if denormalized carelessly | `src/05_concurrency_demo.js` | MySQL safer by default for this workload |
| Backup & recovery | `mysqldump`, binary logs, restore from SQL dump | `mongodump`, `mongorestore`, archive restore | `src/06_backup_recovery_demo.md` | Both practical; operational preference depends on team/tooling |

## Detailed Notes

### 1. Data storage & management
**MySQL approach**
- Separate tables: `Users`, `Courses`, `Classes`, `Enrollments`, `SystemState`
- Strong normalization and referential integrity

**MongoDB approach**
- Keeps mirror collections, but duplicates selected fields in `classes` and `enrollments`
- Adds snapshot collections for dashboard/report reads

**Conclusion**
- MySQL is stronger for the authoritative transactional model
- MongoDB is stronger for flexible read models and event-like data

### 2. Indexing
**MySQL approach**
- Indexes typically live on lookup columns and FK-heavy joins

**MongoDB approach**
- Indexes target frequent document filters:
  - `classes.course_code`
  - `classes.department + credits + status`
  - `enrollments.student_id + class_id`
  - nested log fields such as `actor.user_id`

**Conclusion**
- MongoDB indexing is straightforward and especially good for nested document patterns

### 3. Query processing
**MySQL approach**
- Excellent for:
  - joins
  - correlated subqueries
  - grouped reports

**MongoDB approach**
- Excellent for:
  - aggregation pipelines
  - read-side denormalization
  - `$lookup` when needed

**Conclusion**
- MySQL gives more natural relational query semantics for the assignment's normalized workflow
- MongoDB shows how query shape can be optimized by changing the data model itself

### 4. Transaction
**MySQL approach**
- Mature ACID transaction support with fewer operational caveats

**MongoDB approach**
- Works well, but multi-document transactions require replica set deployment

**Conclusion**
- MySQL remains the safer default for the app's registration/payment core

### 5. Concurrency control
**MySQL approach**
- Row-level locking and transaction isolation make correctness easier to reason about

**MongoDB approach**
- Atomic document operations are powerful, but denormalized designs can still race if implemented unsafely
- The prototype intentionally includes unsafe and safe versions to illustrate this

**Conclusion**
- MongoDB is perfectly capable, but application design discipline matters more

### 6. Backup and recovery
**MySQL approach**
- `mysqldump`, logical backups, binary logs

**MongoDB approach**
- `mongodump`, `mongorestore`, archive-based workflows

**Conclusion**
- Both are workable; the demo focuses on operational clarity rather than database superiority

## Final Recommendation
- Keep the **main course registration and tuition workflow in MySQL**
- Use MongoDB as a **comparison prototype** for:
  - activity logs
  - dashboard snapshots
  - denormalized reporting views
  - concurrency/transaction discussion

This gives the strongest DBMS-assignment narrative because each system is used where it is most convincing.
