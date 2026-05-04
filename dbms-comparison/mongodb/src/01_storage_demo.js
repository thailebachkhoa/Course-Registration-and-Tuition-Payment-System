const { withDb, ensureSeedData, collections, printSection, printSubsection, pretty } = require('./db');

async function main() {
  await withDb(async ({ db }) => {
    const seededNow = await ensureSeedData(db);
    printSection('Demo 01 - Data Storage & Management');
    if (seededNow) {
      console.log('Seed data was missing, so it has been created automatically.');
    }

    const cols = collections(db);

    const sampleCourse = await cols.courses.findOne({ course_code: 'CS202' });
    const sampleClass = await cols.classes.findOne({ class_id: 'class_cs202_a' });
    const sampleEnrollment = await cols.enrollments.findOne({ enrollment_id: 'enr001' });
    const sampleStudentSnapshot = await cols.studentDashboardSnapshots.findOne({
      student_id: 'student001',
    });
    const samplePaymentSnapshot = await cols.paymentRequestSnapshots.findOne({});

    printSubsection('Sample course document');
    console.log(pretty(sampleCourse));

    printSubsection('Sample class document with denormalized course + teacher fields');
    console.log(pretty(sampleClass));

    printSubsection('Sample enrollment document');
    console.log(pretty(sampleEnrollment));

    printSubsection('Student dashboard snapshot document');
    console.log(pretty(sampleStudentSnapshot));

    printSubsection('Payment request snapshot document');
    console.log(pretty(samplePaymentSnapshot));

    printSubsection('Takeaways');
    console.log('- MongoDB stores related data as JSON-like documents instead of normalized rows.');
    console.log('- `classes` embeds course and teacher snapshots to reduce join pressure for read-heavy screens.');
    console.log('- Snapshot collections model precomputed read views that would typically need joins and aggregation in MySQL.');
    console.log('- This is intentionally useful for comparison, not a replacement for the transactional MySQL core app.');
  });
}

main().catch((error) => {
  console.error('Storage demo failed:', error);
  process.exit(1);
});
