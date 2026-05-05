// ============================================================================
// DEMO 01: MVCC (Multi-Version Concurrency Control) - MongoDB
// ============================================================================
//
// MongoDB sử dụng MVCC để cho phép concurrent readers không block nhau.
// Mỗi transaction thấy một consistent snapshot dựa trên snapshot timestamp.
// Session cần được sử dụng để bắt đầu transaction.
//
// Kịch bản:
// - T1 bắt đầu session transaction, đọc balance
// - T2 update balance (ở transaction khác)
// - T1 đọc lại balance - vẫn thấy giá trị cũ (snapshot isolation)
// ============================================================================

db = db.getSiblingDB("course_registration");

// STEP 1: Kiểm tra trạng thái ban đầu
console.log("=== STEP 1: Ban dau - Xem balance cua student001 ===");
db.bank_accounts.findOne({ student_id: "student001" });

// STEP 2: Tạo session T1 và bắt đầu transaction
console.log("\n=== STEP 2: T1 START TRANSACTION ===");
const session = db.getMongo().startSession();
session.startTransaction();
const sdb = session.getDatabase("course_registration");

// T1 đọc balance lần 1
console.log("T1: Doc balance lan 1");
const initialDoc = sdb.bank_accounts.findOne(
  { student_id: "student001" }
);
console.log("T1 nhin thay: balance = " + initialDoc.balance + ", version = " + initialDoc.version);

// ============================================================================
// [TRONG T2 LAN 1 - Chay trong session khac]
// db.bank_accounts.updateOne(
//   { student_id: "student001" },
//   { $set: { balance: initialDoc.balance - 100000, version: initialDoc.version + 1 } }
// );
// ============================================================================

// STEP 3: T1 đọc lại cùng dữ liệu
console.log("\nT1: Doc balance lan 2 (sau khi T2 update)");
const secondRead = sdb.bank_accounts.findOne(
  { student_id: "student001" }
);
console.log("T1 van nhin thay: balance = " + secondRead.balance + " (snapshot isolation)");

// STEP 4: Commit T1
console.log("\nT1: COMMIT");
session.commitTransaction();

// STEP 5: Sau COMMIT - Thấy giá trị cập nhật từ T2
console.log("Sau T1 COMMIT: Doc lai balance");
const afterCommit = db.bank_accounts.findOne({ student_id: "student001" });
console.log("Ket qua: balance = " + afterCommit.balance + ", version = " + afterCommit.version);

session.endSession();

// ============================================================================
// DEMO 2: MVCC với filter (aggregation pipeline)
// ============================================================================
//
// Kịch bản:
// - T1 bắt đầu, đếm tổng số Enrollments có status='enrolled'
// - T2 xóa một enrollment
// - T1 đếm lại - vẫn thấy số cũ (MVCC bảo vệ)
// ============================================================================

console.log("\n\n=== DEMO 2: MVCC voi aggregation ===");

console.log("Buoc 1: So luong enrollments co status='enrolled' ban dau");
const initialCount = db.enrollments.countDocuments({ status: "enrolled" });
console.log("Initial count: " + initialCount);

// T1 bắt đầu transaction
console.log("\nT1: START TRANSACTION");
const session2 = db.getMongo().startSession();
session2.startTransaction();
const sdb2 = session2.getDatabase("course_registration");

console.log("T1: Dem enrollments co status='enrolled' lan 1");
const count1 = sdb2.enrollments.countDocuments({ status: "enrolled" });
console.log("T1 dem duoc: " + count1);

// ============================================================================
// [TRONG T2 LAN 2 - Chay trong session khac]
// db.enrollments.deleteOne({ _id: 1 });
// ============================================================================

console.log("\nT1: Dem enrollments co status='enrolled' lan 2 (sau T2 delete)");
const count2 = sdb2.enrollments.countDocuments({ status: "enrolled" });
console.log("T1 van dem duoc: " + count2 + " (MVCC consistent snapshot)");

console.log("\nT1: COMMIT");
session2.commitTransaction();

console.log("Sau T1 COMMIT: Dem lai");
const finalCount = db.enrollments.countDocuments({ status: "enrolled" });
console.log("Final count: " + finalCount);

session2.endSession();

// ============================================================================
// DEMO 3: MVCC - Aggregation Pipeline Snapshot
// ============================================================================
//
// Kịch bản: Tính tổng balance của tất cả students
// - T1 bắt đầu aggregation
// - T2 thêm một tài khoản mới
// - T1 vẫn thấy aggregation result cũ (snapshot)
// ============================================================================

console.log("\n\n=== DEMO 3: MVCC voi aggregation pipeline ===");

console.log("Ban dau: Tong balance cua tat ca students");
const initialAggregate = db.bank_accounts.aggregate([
  { $group: { _id: null, total_balance: { $sum: "$balance" }, count: { $sum: 1 } } }
]).toArray();
console.log("Initial aggregate: " + JSON.stringify(initialAggregate[0]));

console.log("\nT1: START TRANSACTION");
const session3 = db.getMongo().startSession();
session3.startTransaction();
const sdb3 = session3.getDatabase("course_registration");

console.log("T1: Run aggregation pipeline");
const agg1 = sdb3.bank_accounts.aggregate(
  [
    { $group: { _id: null, total_balance: { $sum: "$balance" }, count: { $sum: 1 } } }
  ],
).toArray();
console.log("T1 thay: " + JSON.stringify(agg1[0]));

// ============================================================================
// [TRONG T2]
// db.bank_accounts.insertOne({
//   student_id: "student_new",
//   balance: 9999999,
//   version: 1
// });
// ============================================================================

console.log("\nT1: Run aggregation pipeline lan 2 (sau T2 insert)");
const agg2 = sdb3.bank_accounts.aggregate(
  [
    { $group: { _id: null, total_balance: { $sum: "$balance" }, count: { $sum: 1 } } }
  ],
).toArray();
console.log("T1 van thay: " + JSON.stringify(agg2[0]) + " (snapshot isolation)");

console.log("\nT1: COMMIT");
session3.commitTransaction();

console.log("Sau T1 COMMIT: Run aggregation again");
const aggFinal = db.bank_accounts.aggregate([
  { $group: { _id: null, total_balance: { $sum: "$balance" }, count: { $sum: 1 } } }
]).toArray();
console.log("Final aggregate: " + JSON.stringify(aggFinal[0]));

session3.endSession();

// ============================================================================
// DEMO 4: Transaction Isolation Level - Read Concern
// ============================================================================
//
// MongoDB có 3 read concern levels:
// - "local": Đọc dữ liệu bất kể có commit hay không (có thể dirty read)
// - "available": Tương tự "local" (cho replica set)
// - "majority": Đọc dữ liệu đã được commit bởi majority (default ở replica set)
// - "snapshot": Consistent snapshot (cần explicit)
//
// Kịch bản: Thể hiện difference giữa read concerns
// ============================================================================

console.log("\n\n=== DEMO 4: Read Concern Levels ===");

// Setup: Tạo data có version tracking
console.log("Ban dau: Bank account student002");
db.bank_accounts.updateOne(
  { student_id: "student002" },
  { $set: { balance: 500000, version: 1 } }
);
console.log(db.bank_accounts.findOne({ student_id: "student002" }));

console.log("\nT1: Use snapshot read concern");
const session4 = db.getMongo().startSession({
  readPreference: "primary",
  readConcern: { level: "snapshot" }
});
session4.startTransaction();
const sdb4 = session4.getDatabase("course_registration");

console.log("T1: Read with snapshot read concern");
const doc1 = sdb4.bank_accounts.findOne({ student_id: "student002" });
console.log("T1: Read " + JSON.stringify(doc1));

// ============================================================================
// [T2 cập nhật]
// db.bank_accounts.updateOne(
//   { student_id: "student002" },
//   { $set: { balance: 600000, version: 2 } }
// );
// ============================================================================

console.log("\nT1: Read again within same transaction");
const doc2 = sdb4.bank_accounts.findOne({ student_id: "student002" });
console.log("T1: Read (same snapshot) " + JSON.stringify(doc2));

console.log("\nT1: COMMIT");
session4.commitTransaction();
session4.endSession();

console.log("Sau T1 COMMIT: Read without transaction");
const docFinal = db.bank_accounts.findOne({ student_id: "student002" });
console.log("Final state: " + JSON.stringify(docFinal));

// ============================================================================
// DEMO 5: MVCC - Phantom Rows Protection
// ============================================================================
//
// MongoDB transactions không có phantom reads khi dùng snapshot
// Tất cả documents seen trong transaction đều consistent
//
// Kịch bản: T1 lặp lại query -> thấy cùng set documents
// ============================================================================

console.log("\n\n=== DEMO 5: MVCC - Phantom Rows Protection ===");

console.log("Ban dau: Cac enrollments o class_id: 1");
let classEnrollments = db.enrollments.find({ class_id: 1 }).toArray();
console.log("Initial count: " + classEnrollments.length);
console.log("Students: " + classEnrollments.map(e => e.student_id).join(", "));

console.log("\nT1: START TRANSACTION");
const session5 = db.getMongo().startSession();
session5.startTransaction();
const sdb5 = session5.getDatabase("course_registration");

console.log("T1: Query enrollments o class_id=1 lan 1");
let result1 = sdb5.enrollments.find({ class_id: 1 }).toArray();
console.log("T1 tim thay: " + result1.length + " enrollments");

// ============================================================================
// [T2 insert]
// db.enrollments.insertOne({
//   student_id: "student_new_phantom",
//   class_id: 1,
//   status: "enrolled"
// });
// ============================================================================

console.log("\nT1: Query enrollments o class_id=1 lan 2 (sau T2 insert)");
let result2 = sdb5.enrollments.find({ class_id: 1 }).toArray();
console.log("T1 van tim thay: " + result2.length + " enrollments (no phantom read)");

console.log("\nT1: COMMIT");
session5.commitTransaction();
session5.endSession();

console.log("Sau T1 COMMIT:");
let resultFinal = db.enrollments.find({ class_id: 1 }).toArray();
console.log("Final count: " + resultFinal.length);

console.log("\n=== DEMO 1-5 Complete ===");
