// ============================================================================
// DEMO 02: Row-Level Lock (Document-Level Lock) - MongoDB
// ============================================================================
//
// MongoDB không có explicit row-level lock như MySQL.
// Thay vào đó, MongoDB sử dụng:
// 1. Transactions: Atomicity + Isolation (trong session)
// 2. Optimistic Locking: Sử dụng version field để detect conflicts
// 3. Read-Concern + Write-Concern: Để kiểm soát durability
//
// Kịch bản mô phỏng row-level lock bằng cách sử dụng transaction
// và optimistic locking
// ============================================================================

db = db.getSiblingDB("course_registration");

// ============================================================================
// DEMO 1: Transaction-based "Row Lock" Simulation
// ============================================================================
//
// MongoDB transactions giúp simulate row-level lock:
// - Acquire lock: startTransaction() + read within transaction
// - Hold lock: Giữ transaction open
// - Release lock: commitTransaction() hoặc rollback
//
// Kịch bản: T1 holds a "lock" trên bank account, T2 phải chờ
// ============================================================================

console.log("=== DEMO 1: Transaction-based Row Lock ===");
console.log("Ban dau: Bank accounts");
db.bank_accounts.find().forEach(doc => console.log("  " + doc.student_id + ": " + doc.balance));

console.log("\nT1: START TRANSACTION (acquire logical lock)");
const session1 = db.getMongo().startSession();
session1.startTransaction();
const sdb1 = session1.getDatabase("course_registration");

console.log("T1: Read account (within transaction)");
const account1 = sdb1.bank_accounts.findOne({ student_id: "student001" });
console.log("T1 reads: " + account1.student_id + " balance = " + account1.balance);

console.log("T1: Hold lock, sleeping...");

// ============================================================================
// [T2 SAY TIME - cố gắng update]
// T2: db.bank_accounts.updateOne(
//   { student_id: "student001" },
//   { $set: { balance: 1050000 } }
// );
// 
// MongoDB WCC (Write Conflict Detection):
// - Nếu T1 commit trước: T1's write wins
// - Nếu T2 update được accept trước T1 commit: T1 sẽ abort với error
// ============================================================================

console.log("\nT1: Perform update (still in transaction)");
sdb1.bank_accounts.updateOne(
  { student_id: "student001", version: account1.version },
  { $set: { balance: account1.balance + 50000, version: account1.version + 1 } }
);
console.log("T1: Updated balance for student001");

console.log("\nT1: COMMIT");
session1.commitTransaction();
session1.endSession();

console.log("T1: Transaction committed");
console.log("Result after T1 commit:");
db.bank_accounts.findOne({ student_id: "student001" });

// ============================================================================
// DEMO 2: Optimistic Locking (Document Versioning)
// ============================================================================
//
// Kịch bản: Sử dụng version field để detect write conflicts
// - T1 & T2 cùng read version N
// - T1 update version N -> N+1 (success)
// - T2 cố update version N -> N+1 (fail, version đã change)
// ============================================================================

console.log("\n\n=== DEMO 2: Optimistic Locking with Version ===");

console.log("Reset student002 account");
db.bank_accounts.updateOne(
  { student_id: "student002" },
  { $set: { balance: 500000, version: 1 } }
);
console.log("Initial: " + JSON.stringify(db.bank_accounts.findOne({ student_id: "student002" })));

console.log("\n[Simulating concurrent access]");
console.log("T1 & T2 both read same document:");

const session2 = db.getMongo().startSession();
session2.startTransaction();
const sdb2 = session2.getDatabase("course_registration");

const docForT1 = sdb2.bank_accounts.findOne({ student_id: "student002" });
console.log("T1 reads: version = " + docForT1.version + ", balance = " + docForT1.balance);

// ============================================================================
// [T2 cũng read - simulated]
// console.log("T2 reads: version = 1, balance = 500000");
// ============================================================================

console.log("\nT1: Update with version check");
const updateResult1 = sdb2.bank_accounts.updateOne(
  {
    student_id: "student002",
    version: docForT1.version
  },
  {
    $set: {
      balance: docForT1.balance + 100000,
      version: docForT1.version + 1
    }
  },
);

if (updateResult1.modifiedCount === 1) {
  console.log("T1: Update successful (version match)");
} else {
  console.log("T1: Update failed (version mismatch)");
}

session2.commitTransaction();
session2.endSession();

console.log("After T1 commit:");
console.log(JSON.stringify(db.bank_accounts.findOne({ student_id: "student002" })));

console.log("\n[If T2 tried to update with same version]");
console.log("T2: Update with old version = 1");
const updateResult2 = db.bank_accounts.updateOne(
  {
    student_id: "student002",
    version: 1
  },
  {
    $set: {
      balance: 500000 + 50000,
      version: 2
    }
  }
);

if (updateResult2.modifiedCount === 1) {
  console.log("T2: Update successful");
} else {
  console.log("T2: Update FAILED (version no longer 1, conflict detected)");
}

console.log("Final state:");
console.log(JSON.stringify(db.bank_accounts.findOne({ student_id: "student002" })));

// ============================================================================
// DEMO 3: Read + Modify + Write Pattern with Transaction
// ============================================================================
//
// Simulate row-level lock pattern:
// 1. startTransaction()
// 2. Read document
// 3. Modify in application
// 4. Update document
// 5. commitTransaction()
//
// Kịch bác: Enrollment - Change status with version check
// ============================================================================

console.log("\n\n=== DEMO 3: Read-Modify-Write Pattern ===");

console.log("Ban dau: Enrollment");
db.enrollments.findOne({ _id: 1 });

console.log("\nT1: START TRANSACTION - Read-Modify-Write");
const session3 = db.getMongo().startSession();
session3.startTransaction();
const sdb3 = session3.getDatabase("course_registration");

console.log("T1: Read enrollment");
const enrollment = sdb3.enrollments.findOne({ _id: 1 });
console.log("T1 reads: " + JSON.stringify(enrollment));

console.log("\nT1: Check condition (application logic)");
if (enrollment.status === "enrolled") {
  console.log("Status is 'enrolled' - proceed to update");
  
  console.log("T1: Update status to 'payed'");
  const result = sdb3.enrollments.updateOne(
    { _id: 1, version: enrollment.enrollment_version || 1 },
    {
      $set: {
        status: "payed",
        enrollment_version: (enrollment.enrollment_version || 1) + 1
      }
    }
  );
  
  if (result.modifiedCount === 1) {
    console.log("T1: Update successful");
  } else {
    console.log("T1: Update failed - concurrent modification detected");
  }
} else {
  console.log("Status is not 'enrolled' - skip update");
}

console.log("\nT1: COMMIT");
session3.commitTransaction();
session3.endSession();

console.log("After T1 commit:");
console.log(JSON.stringify(db.enrollments.findOne({ _id: 1 })));

// ============================================================================
// DEMO 4: Replica Set Transaction Lock (Implicit Lock)
// ============================================================================
//
// Trong replica set environment:
// - MongoDB maintains transaction state trên primary
// - Readers thấy consistent data dựa trên readConcern
// - Writers acquire implicit locks trên affected documents
//
// Kịch bác: Thể hiện write ordering
// ============================================================================

console.log("\n\n=== DEMO 4: Write Ordering in Transactions ===");

console.log("Reset bank accounts");
db.bank_accounts.updateMany(
  {},
  { $set: { version: 1 } }
);
console.log("Initial state:");
db.bank_accounts.find({ student_id: { $in: ["student001", "student002"] } }).forEach(doc => {
  console.log("  " + doc.student_id + ": " + doc.balance);
});

console.log("\n[Transfer scenario: T1 transfers from student001 to student002]");
const session4 = db.getMongo().startSession();
session4.startTransaction();
const sdb4 = session4.getDatabase("course_registration");

console.log("T1: Read both accounts");
const src = sdb4.bank_accounts.findOne({ student_id: "student001" });
const dst = sdb4.bank_accounts.findOne({ student_id: "student002" });

const transfer_amount = 100000;
console.log("T1: Transfer " + transfer_amount + " from student001 to student002");

if (src.balance >= transfer_amount) {
  console.log("T1: Sufficient balance, proceed");
  
  console.log("T1: Debit from source");
  sdb4.bank_accounts.updateOne(
    { student_id: "student001" },
    { $inc: { balance: -transfer_amount }, $set: { version: src.version + 1 } }
  );
  
  console.log("T1: Credit to destination");
  sdb4.bank_accounts.updateOne(
    { student_id: "student002" },
    { $inc: { balance: transfer_amount }, $set: { version: dst.version + 1 } }
  );
  
  console.log("T1: Both operations complete");
} else {
  console.log("T1: Insufficient balance, rollback");
  session4.abortTransaction();
}

console.log("\nT1: COMMIT");
session4.commitTransaction();
session4.endSession();

console.log("After T1 commit:");
db.bank_accounts.find({ student_id: { $in: ["student001", "student002"] } }).forEach(doc => {
  console.log("  " + doc.student_id + ": " + doc.balance);
});

console.log("\n=== DEMO 2 Complete ===");
