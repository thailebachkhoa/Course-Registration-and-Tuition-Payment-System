// ============================================================================
// DEMO 03: Race Condition - MongoDB
// ============================================================================
//
// Race Condition xảy ra khi:
// 1. Không dùng transaction
// 2. Kiểm tra điều kiện rồi update mà không atomic
// 3. Không dùng optimistic locking (version check)
//
// MongoDB không có row-level lock như MySQL, nên race condition
// có thể xảy ra dễ hơn nếu không cẩn thận
//
// ============================================================================

db = db.getSiblingDB("course_registration");

// ============================================================================
// DEMO 1: Race Condition - Double Payment (Without Transaction)
// ============================================================================
//
// Kịch bản: Hai payment requests cùng lúc cho cùng enrollment
// 1. Check: enrollment status
// 2. If status == 'enrolled': proceed
// 3. Update status = 'payed'
//
// Problem: Không dùng transaction -> cả T1 & T2 đều thấy 'enrolled'
//          -> Double charging
// ============================================================================

console.log("=== DEMO 1: Race Condition - Double Payment ===");
console.log("Situation: Two concurrent payment requests for same enrollment");

console.log("\nBan dau: Enrollment student001 - class 1");
db.enrollments.findOne({ student_id: "student001", class_id: 1 });

console.log("\n[UNSAFE - Without transaction]");
console.log("T1 & T2 start at same time\n");

// Simulate T1
console.log("T1: Read enrollment");
let enrollment_t1 = db.enrollments.findOne({
  student_id: "student001",
  class_id: 1
});
console.log("T1 sees: status = " + enrollment_t1.status);

// ============================================================================
// [T2 cũng read - simulate]
// console.log("T2: Read enrollment");
// let enrollment_t2 = db.enrollments.findOne({...});
// console.log("T2 sees: status = enrolled");
// ============================================================================

console.log("\nT1: Check if status == 'enrolled'");
if (enrollment_t1.status === "enrolled") {
  console.log("T1: TRUE - Process payment");
  
  // ============================================================================
  // [RACE: T2 cũng check và process]
  // console.log("T2: Check - TRUE - Process payment");
  // ============================================================================
  
  console.log("T1: Update status = 'payed'");
  db.enrollments.updateOne(
    { _id: enrollment_t1._id },
    { $set: { status: "payed", enrollment_version: (enrollment_t1.enrollment_version || 1) + 1 } }
  );
  console.log("T1: Payment recorded (charge 1M VND)");
}

// ============================================================================
// [T2 also proceeds - result: double charging]
// T2: Update status = 'payed' (overwrites T1)
// T2: Payment recorded (charge 1M VND again)
// ============================================================================

console.log("\n[If T2 also proceeded - RACE CONDITION]:"); 
console.log("Result: Double payment! Both T1 & T2 charged");
console.log("Status quo: Both transaction records exist, but only 1 status update persists\n");

// ============================================================================
// DEMO 2: Preventing Race Condition with Transaction
// ============================================================================

console.log("\n=== DEMO 2: Preventing Race Condition with Transaction ===");

console.log("Reset enrollment");
db.enrollments.updateOne(
  { student_id: "student001", class_id: 1 },
  { $set: { status: "enrolled" } }
);
console.log("Current state:");
db.enrollments.findOne({ student_id: "student001", class_id: 1 });

console.log("\n[SAFE - With transaction]");

const session = db.getMongo().startSession();
session.startTransaction();

console.log("T1: START TRANSACTION");
console.log("T1: Read enrollment (atomic within transaction)");
const enrollment = db.enrollments.findOne(
  { student_id: "student001", class_id: 1 },
  { session: session }
);
console.log("T1 sees: status = " + enrollment.status);

console.log("\nT1: Check condition");
if (enrollment.status === "enrolled") {
  console.log("T1: Proceed - Update status");
  db.enrollments.updateOne(
    { _id: enrollment._id },
    { $set: { status: "payed" } },
    { session: session }
  );
  console.log("T1: Payment recorded");
} else {
  console.log("T1: Status not 'enrolled' - Skip");
}

console.log("\nT1: COMMIT");
session.commitTransaction();
session.endSession();

// ============================================================================
// [T2 tries same operation - will see 'payed' status]
// T2: START TRANSACTION
// T2: Read - status = 'payed' (NOT 'enrolled')
// T2: Check fails -> payment skipped (prevented double charge!)
// ============================================================================

console.log("\n[T2 attempts same operation - prevented]");
const session2 = db.getMongo().startSession();
session2.startTransaction();

console.log("T2: Read enrollment");
const enrollment2 = db.enrollments.findOne(
  { student_id: "student001", class_id: 1 },
  { session: session2 }
);
console.log("T2 sees: status = " + enrollment2.status);

console.log("T2: Check - status != 'enrolled' - SKIP payment");
session2.abortTransaction();
session2.endSession();

console.log("Result: Single payment only - Race condition prevented!");

// ============================================================================
// DEMO 3: Race Condition - Over-enrollment (Capacity Check)
// ============================================================================
//
// Kịch bác: Class capacity = 2, but 3 students try enroll concurrently
//
// Tanpa transaction:
// - T1, T2, T3 cùng read enrolled_count = 1, capacity = 2
// - Cả 3 INSERT thành công
// - Result: enrolled_count = 4 (over capacity!)
// ============================================================================

console.log("\n\n=== DEMO 3: Race Condition - Over-enrollment ===");

console.log("Reset class 2");
db.classes.updateOne(
  { _id: 2 },
  { $set: { enrolled_count: 1 } }
);

console.log("Ban dau: Class 2");
db.classes.findOne({ _id: 2 });
console.log("Enrollments at class 2:");
db.enrollments.find({ class_id: 2 }).toArray();

console.log("\n[UNSAFE - Without transaction]");
console.log("3 students (T1, T2, T3) try enroll simultaneously\n");

console.log("T1: Read class info");
let class_t1 = db.classes.findOne({ _id: 2 });
console.log("T1: capacity = " + class_t1.capacity + ", enrolled_count = " + class_t1.enrolled_count);

console.log("T1: Check if enrolled_count < capacity");
if (class_t1.enrolled_count < class_t1.capacity) {
  console.log("T1: TRUE - Can enroll");
  
  // ============================================================================
  // [T2, T3 cũng check - all see same count]
  // T2: enrolled_count = 1, capacity = 2 -> CAN ENROLL
  // T3: enrolled_count = 1, capacity = 2 -> CAN ENROLL
  // ============================================================================
  
  console.log("T1: INSERT enrollment");
  db.enrollments.insertOne({
    student_id: "student_t1",
    class_id: 2,
    status: "enrolled",
    enrolled_at: new Date()
  });
  
  console.log("T1: UPDATE enrolled_count");
  db.classes.updateOne(
    { _id: 2 },
    { $inc: { enrolled_count: 1 } }
  );
  console.log("T1: Enrolled successfully");
} else {
  console.log("T1: FALSE - Class full");
}

console.log("\n[If T2 & T3 also proceed - RACE CONDITION]:");
console.log("T2: INSERT + UPDATE enrolled_count (now = 2)");
console.log("T3: INSERT + UPDATE enrolled_count (now = 3) <- OVER CAPACITY!");

console.log("\nFinal state (if all 3 proceed):");
console.log("enrolled_count = 3, but capacity = 2");
db.classes.findOne({ _id: 2 });

// ============================================================================
// DEMO 4: Preventing Over-enrollment with Transaction
// ============================================================================

console.log("\n\n=== DEMO 4: Preventing Over-enrollment with Transaction ===");

console.log("Reset class 3");
db.classes.updateOne(
  { _id: 3 },
  { $set: { enrolled_count: 1 } }
);

console.log("Ban dau: Class 3");
db.classes.findOne({ _id: 3 });

console.log("\n[SAFE - With transaction]");

const session3 = db.getMongo().startSession();
session3.startTransaction();

console.log("T1: START TRANSACTION");
console.log("T1: Read class");
const classDoc = db.classes.findOne(
  { _id: 3 },
  { session: session3 }
);
console.log("T1: capacity = " + classDoc.capacity + ", enrolled_count = " + classDoc.enrolled_count);

console.log("\nT1: Check capacity");
if (classDoc.enrolled_count < classDoc.capacity) {
  console.log("T1: Space available - Enroll");
  
  db.enrollments.insertOne(
    {
      student_id: "student_safe_t1",
      class_id: 3,
      status: "enrolled",
      enrolled_at: new Date()
    },
    { session: session3 }
  );
  
  db.classes.updateOne(
    { _id: 3 },
    { $inc: { enrolled_count: 1 } },
    { session: session3 }
  );
  
  console.log("T1: Successfully enrolled");
} else {
  console.log("T1: Class full - ROLLBACK");
  session3.abortTransaction();
}

session3.commitTransaction();
session3.endSession();

console.log("\nResult after T1 COMMIT:");
db.classes.findOne({ _id: 3 });
console.log("enrolled_count properly incremented");

// ============================================================================
// DEMO 5: Lost Update Race Condition
// ============================================================================
//
// Scenario: Two transactions read same value, both increment, both write back
// Result: One update is lost
//
// T1 & T2: Read balance = 1000000
// T1: balance = 1000000 + 100000 = 1100000, write
// T2: balance = 1000000 + 50000 = 1050000, write (overwrites T1!)
// Final: 1050000 (T1's increment lost)
//
// ============================================================================

console.log("\n\n=== DEMO 5: Lost Update Race Condition ===");

console.log("Ban dau: Student003 account");
db.bank_accounts.updateOne(
  { student_id: "student003" },
  { $set: { balance: 1000000, version: 1 } }
);
console.log(JSON.stringify(db.bank_accounts.findOne({ student_id: "student003" })));

console.log("\n[UNSAFE - Without version check]");
console.log("T1 & T2 read same balance\n");

console.log("T1: Read account");
const acct_t1 = db.bank_accounts.findOne({ student_id: "student003" });
console.log("T1: balance = " + acct_t1.balance);

// ============================================================================
// [T2 cũng read]
// console.log("T2: Read account -> balance = 1000000");
// ============================================================================

console.log("\nT1: Calculate new balance = " + acct_t1.balance + " + 100000 = " + (acct_t1.balance + 100000));
db.bank_accounts.updateOne(
  { student_id: "student003" },
  { $set: { balance: acct_t1.balance + 100000 } }
);
console.log("T1: Updated");

console.log("\n[T2 also proceeds]");
console.log("T2: Calculate new balance = 1000000 + 50000 = 1050000");
db.bank_accounts.updateOne(
  { student_id: "student003" },
  { $set: { balance: 1050000 } }
);
console.log("T2: Updated (overwrites T1!)");

console.log("\nResult: LOST UPDATE - balance = 1050000 (T1's +100000 lost)");
console.log(JSON.stringify(db.bank_accounts.findOne({ student_id: "student003" })));

// ============================================================================
// DEMO 6: Preventing Lost Update with Optimistic Locking
// ============================================================================

console.log("\n\n=== DEMO 6: Preventing Lost Update with Version Check ===");

console.log("Reset student003");
db.bank_accounts.updateOne(
  { student_id: "student003" },
  { $set: { balance: 1000000, version: 1 } }
);
console.log("Current state:");
console.log(JSON.stringify(db.bank_accounts.findOne({ student_id: "student003" })));

console.log("\n[SAFE - With version check]");

const session6 = db.getMongo().startSession();
session6.startTransaction();

console.log("T1: Read with version");
const acctSafe = db.bank_accounts.findOne(
  { student_id: "student003" },
  { session: session6 }
);
console.log("T1: balance = " + acctSafe.balance + ", version = " + acctSafe.version);

console.log("\nT1: Calculate new balance");
const newBalance = acctSafe.balance + 100000;

console.log("T1: Update with version check");
const result = db.bank_accounts.updateOne(
  {
    student_id: "student003",
    version: acctSafe.version
  },
  {
    $set: {
      balance: newBalance,
      version: acctSafe.version + 1
    }
  },
  { session: session6 }
);

if (result.modifiedCount === 1) {
  console.log("T1: Update successful (version still 1)");
  session6.commitTransaction();
} else {
  console.log("T1: Update FAILED (version changed, concurrent update detected!)");
  session6.abortTransaction();
}

session6.endSession();

console.log("\nResult: Conflict detected and handled safely");
console.log(JSON.stringify(db.bank_accounts.findOne({ student_id: "student003" })));

console.log("\n=== DEMO 3 Complete ===");
