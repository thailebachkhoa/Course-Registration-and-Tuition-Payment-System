# 3 Kịch bản demo Concurrency Control trên MySQL và MongoDB bằng Docker

## 1. Mục tiêu demo

Tài liệu này tập trung vào **3 kịch bản demo** để thể hiện ba khái niệm cốt lõi trong Concurrency Control:

### 1.1 MVCC (Multi-Version Concurrency Control)
**Mục đích**: Cho phép nhiều transactions đọc dữ liệu mà không cần lock, bằng cách duy trì multiple versions của mỗi row/document.

**MySQL/InnoDB**:
- Sử dụng undo logs để duy trì versions cũ
- Mỗi transaction thấy một "consistent snapshot" dựa trên transaction ID (trx_id)
- Snapshot được xác định tại thời điểm transaction bắt đầu
- Readers không block writers, writers không block readers (tùy isolation level)

**MongoDB**:
- Dùng read concern + write concern để kiểm soát consistency
- Transactions snapshot-isolated mặc định ở replica sets
- Mỗi transaction thấy dữ liệu từ một snapshot timestamp
- Multi-document transactions atomic và consistent

### 1.2 Row-Level Lock
**Mục đích**: Kiểm soát truy cập đồng thời bằng cách khóa các bản ghi cụ thể.

**MySQL/InnoDB**:
- **Shared Lock (S-lock)**: Nhiều transactions có thể hold cùng lúc, ngăn UPDATE/DELETE
- **Exclusive Lock (X-lock)**: Chỉ một transaction có thể hold, ngăn cả SELECT FOR SHARE
- Acquired tự động trên UPDATE, DELETE, SELECT FOR UPDATE, SELECT FOR SHARE
- Deadlock có thể xảy ra

**MongoDB**:
- Không có explicit row-level lock
- Thay vào đó dùng transactions + optimistic locking (version field)
- Write Conflict Detection (WCD) tự động
- Version checking để prevent concurrent modifications

### 1.3 Race Condition
**Mục đích**: Thể hiện vấn đề khi nhiều transactions truy cập dữ liệu mà không đúng synchronization.

**Các loại Race Condition**:
1. **Double Payment**: Hai requests payment cùng lúc -> charge 2 lần
2. **Over-enrollment**: Vượt quá capacity của class
3. **Lost Update**: Update của transaction này bị ghi đè bởi transaction khác
4. **Dirty Read**: Đọc dữ liệu chưa được commit (nếu isolation level không đủ)

---

## 2. Chuẩn bị Docker

### 2.1 Chạy MySQL

```bash
docker run --name dbms-mysql-concurrency \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=course_registration \
  -p 3308:3306 \
  -d mysql:8.0 \
  --default-authentication-plugin=mysql_native_password \
  --transaction-isolation=REPEATABLE-READ
```

Mở MySQL shell:

```bash
docker exec -it dbms-mysql-concurrency mysql -uroot -proot course_registration
```

### 2.2 Chạy MongoDB

MongoDB multi-document transaction cần replica set:

```bash
docker run --name dbms-mongo-concurrency \
  -p 27019:27017 \
  -d mongo:7 \
  mongod --replSet rs0 --bind_ip_all
```

Khởi tạo replica set:

```bash
docker exec -it dbms-mongo-concurrency mongosh --eval "rs.initiate()"
```

Hoặc dùng docker-compose (easier):

```bash
docker-compose up -d
```

---

## 3. Demo MVCC (Multi-Version Concurrency Control)

### 3.1 MySQL MVCC Demo

**File**: `docker/mysql/demo-01-mvcc.sql`

#### Khái niệm:
- Mỗi row trong MySQL có hidden columns: trx_id (transaction ID) và roll_ptr (pointer to undo log)
- Khi transaction bắt đầu, InnoDB ghi lại view của active transactions
- Khi read, InnoDB kiểm tra version và chỉ trả về rows mà transaction có thể thấy
- Transactions không block nhau

#### Chạy demo:

**Session 1 (T1 - Repeatable Read)**:
```bash
docker exec -it dbms-mysql-concurrency mysql -uroot -proot course_registration < docker/mysql/00_schema_seed.sql
docker exec -it dbms-mysql-concurrency mysql -uroot -proot course_registration < docker/mysql/demo-01-mvcc.sql
```

Hoặc từ MySQL shell:
```sql
source docker/mysql/demo-01-mvcc.sql
```

#### Quan sát:
1. **MVCC bảo vệ consistent snapshot**:
   - T1 đọc balance = 1000000 lần 1
   - T2 update balance = 900000 (ở transaction khác)
   - T1 đọc lại vẫn thấy 1000000 (từ snapshot)
   - Sau T1 COMMIT, mới thấy 900000

2. **Phantom Read Protection** (REPEATABLE READ):
   - INSERT/DELETE của T2 không ảnh hưởng T1 trong REPEATABLE READ level

### 3.2 MongoDB MVCC Demo

**File**: `docker/mongo/demo-01-mvcc.js`

#### Khái niệm:
- MongoDB transactions sử dụng read timestamp
- Mỗi transaction thấy consistent snapshot của toàn bộ database state
- Readers không block writers, writers không block readers (conflict detection)
- `readConcern: "snapshot"` đảm bảo snapshot consistency

#### Chạy demo:

**Session 1**:
```bash
docker exec -it dbms-mongo-concurrency mongosh
```

Trong mongosh:
```javascript
source("docker/mongo/00_seed.js")
source("docker/mongo/demo-01-mvcc.js")
```

#### Quan sát:
1. Transaction isolation tương tự MySQL
2. Aggregation pipeline snapshot-isolated
3. Phantom rows không xảy ra trong transactions

---

## 4. Demo Row-Level Lock

### 4.1 MySQL Row-Level Lock Demo

**File**: `docker/mysql/demo-02-row-level-lock.sql`

#### Khái niệm:
- **Shared Lock (S-lock)**: SELECT ... FOR SHARE
  - Nhiều transactions có thể acquire cùng lúc
  - Ngăn X-lock (UPDATE/DELETE)
  
- **Exclusive Lock (X-lock)**: SELECT ... FOR UPDATE hoặc UPDATE/DELETE
  - Chỉ một transaction có thể acquire
  - Ngăn cả S-lock và X-lock

- **Deadlock**: Khi T1 đợi lock của T2, T2 đợi lock của T1

#### Chạy demo:

```bash
docker exec -it dbms-mysql-concurrency mysql -uroot -proot course_registration < docker/mysql/demo-02-row-level-lock.sql
```

#### Quan sát:

**Demo 1 - Exclusive Lock Block**:
```
T1: UPDATE (acquire X-lock) - success
T2: UPDATE (try to acquire X-lock) - BLOCKED
T1: COMMIT - release X-lock
T2: Now proceed
```

**Demo 2 - Shared Lock**:
```
T1: SELECT ... FOR SHARE (acquire S-lock)
T2: SELECT ... FOR SHARE - ALLOWED (S-lock compatible)
T2: UPDATE - BLOCKED (X-lock conflicts with S-lock)
```

**Demo 3 - Lock Escalation**:
```
T1: SELECT ... FOR UPDATE (acquire intention lock -> X-lock)
T1: UPDATE (already have X-lock, no additional lock needed)
```

### 4.2 MongoDB Row-Level Lock Simulation

**File**: `docker/mongo/demo-02-row-level-lock.js`

#### Khái niệm:
- MongoDB không có explicit row-level lock
- Thay vào đó sử dụng:
  1. **Transactions**: Atomicity + Isolation
  2. **Optimistic Locking**: Version field để detect conflicts
  3. **Write Conflict Detection**: Tự động abort transaction nếu conflict

#### Chạy demo:

```bash
docker exec -it dbms-mongo-concurrency mongosh
```

Trong mongosh:
```javascript
source("docker/mongo/00_seed.js")
source("docker/mongo/demo-02-row-level-lock.js")
```

#### Quan sát:

**Demo 1 - Transaction Lock Simulation**:
```
T1: startTransaction() -> simulate acquiring lock
T1: Read & Update (protected by transaction)
T2: Try update -> cần chờ (nếu conflict)
T1: commitTransaction() -> release lock
```

**Demo 2 - Optimistic Locking**:
```
T1 & T2: Read version = 1
T1: Update version = 1 -> 2 (success)
T2: Update version = 1 -> 2 (FAIL, version changed)
   -> Conflict detected, transaction aborted
```

---

## 5. Demo Race Condition

### 5.1 MySQL Race Condition Demo

**File**: `docker/mysql/demo-03-race-condition.sql`

#### Khái niệm:
- Race condition xảy ra khi transaction không properly synchronized
- Nguyên nhân: Không dùng transaction, không dùng lock, hoặc isolation level không đủ

#### Các scenario:

**Race Condition 1: Double Payment**
```
Problem:
  T1: SELECT status WHERE id=1 -> 'enrolled'
  T2: SELECT status WHERE id=1 -> 'enrolled'
  T1: UPDATE status = 'payed'
  T2: UPDATE status = 'payed' (overwrite T1? or second charge?)
  Result: Double payment recorded

Prevention:
  SELECT ... FOR UPDATE -> only T1 gets lock
  T2 waits -> sees 'payed' when lock released
  T2 skips payment -> prevents double charge
```

**Race Condition 2: Over-enrollment**
```
Problem:
  Class capacity = 2, enrolled = 1
  T1, T2, T3 all see enrolled = 1, capacity = 2
  All 3 INSERT -> enrolled = 4 (over capacity!)

Prevention:
  SELECT ... FOR UPDATE class row
  T1 inserts & increments -> T2, T3 wait
  T2 sees enrolled = 2, capacity = 2 -> cannot insert
  T3 sees enrolled = 2, capacity = 2 -> cannot insert
```

**Race Condition 3: Lost Update**
```
Problem:
  balance = 1000000
  T1: balance + 100000 = 1100000
  T2: balance + 50000 = 1050000 (overwrites T1!)
  Result: 1050000 (T1's increment lost)

Prevention:
  Use version column
  T1: UPDATE balance=1100000, version=2 WHERE version=1
  T2: UPDATE balance=1050000, version=2 WHERE version=1
  T2 fails (version no longer 1)
  OR use optimistic locking retry logic
```

#### Chạy demo:

```bash
docker exec -it dbms-mysql-concurrency mysql -uroot -proot course_registration < docker/mysql/demo-03-race-condition.sql
```

### 5.2 MongoDB Race Condition Demo

**File**: `docker/mongo/demo-03-race-condition.js`

#### Khái niệm tương tự MySQL nhưng cách fix khác:
- MongoDB không có SELECT ... FOR UPDATE
- Thay vào dó: dùng `session.startTransaction()` để "acquire lock"
- Version field để optimistic locking

#### Chạy demo:

```bash
docker exec -it dbms-mongo-concurrency mongosh
```

Trong mongosh:
```javascript
source("docker/mongo/00_seed.js")
source("docker/mongo/demo-03-race-condition.js")
```

---

## 6. So sánh MySQL vs MongoDB Concurrency Control

### 6.1 Bảng so sánh

| Aspect | MySQL/InnoDB | MongoDB |
|--------|-------------|---------|
| **MVCC** | Undo logs + trx_id | Read timestamp + snapshot |
| **Row-level Lock** | Shared (S) + Exclusive (X) lock | Transaction + optimistic locking |
| **Lock Type** | Explicit (SELECT FOR UPDATE) | Implicit (in transaction) |
| **Deadlock** | Có thể xảy ra, auto detect | Rare (less locking overhead) |
| **Version Control** | Internal (hidden) | Explicit (version field) |
| **Conflict Detection** | Blocking | Write Conflict Detection (abort) |
| **Retry Logic** | Application (deadlock retry) | Application (transaction retry) |

### 6.2 Khi nào dùng MySQL vs MongoDB

**Dùng MySQL khi**:
- Cần explicit row-level lock
- Foreign key constraints quan trọng
- Transactions phức tạp với subqueries
- Data normalization là tiên phong

**Dùng MongoDB khi**:
- Flexible schema required
- Nested documents reduce multi-document txn
- Horizontal scaling priority
- Simpler transaction logic (lock-free reads)

---

## 7. Tips & Best Practices

### 7.1 MySQL
```sql
-- Always use transaction
START TRANSACTION;

-- For critical reads, use SELECT FOR UPDATE
SELECT * FROM table WHERE id=1 FOR UPDATE;

-- For read-only scenarios, might not need lock
SELECT * FROM table WHERE id=1; -- OK if consistent snapshot sufficient

-- Check isolation level
SELECT @@transaction_isolation;

-- Monitor locks
SHOW PROCESSLIST;
SHOW LOCKS; -- (if available)
```

### 7.2 MongoDB
```javascript
// Always use session.startTransaction() for multi-doc operations
const session = db.getMongo().startSession();
session.startTransaction();

// Check for write errors
result.modifiedCount === 1 ? "success" : "conflict";

// Implement retry logic
for (let i = 0; i < MAX_RETRIES; i++) {
  try {
    session.commitTransaction();
    break;
  } catch (e) {
    if (e.hasErrorLabel("TransientTransactionError")) {
      session.startTransaction(); // retry
    }
  }
}
```

### 7.3 Common Mistakes

1. **MySQL**: Không lock critical reads -> race condition
2. **MongoDB**: Không dùng transactions -> consistency issues
3. **Both**: Không implement retry logic -> transaction failure
4. **Both**: Ignoring error responses -> silent failures

---

## 8. Tài liệu tham khảo

- [MySQL InnoDB Locking](https://dev.mysql.com/doc/refman/8.0/en/innodb-locking.html)
- [MongoDB Transactions](https://docs.mongodb.com/manual/core/transactions/)
- [MVCC Concept](https://en.wikipedia.org/wiki/Multiversion_concurrency_control)
