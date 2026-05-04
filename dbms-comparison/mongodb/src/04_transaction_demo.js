const { withDb, ensureSeedData, collections, printSection, printSubsection, pretty } = require('./db');

async function enrollClassWithTransaction(db, client, studentId, classId) {
  const cols = collections(db);
  const session = client.startSession();

  try {
    const result = await session.withTransaction(async () => {
      const student = await cols.users.findOne({ user_id: studentId, role: 'student' }, { session });
      if (!student) {
        throw new Error(`Student ${studentId} does not exist.`);
      }

      const classDoc = await cols.classes.findOne({ class_id: classId }, { session });
      if (!classDoc) {
        throw new Error(`Class ${classId} does not exist.`);
      }
      if (classDoc.enrolled_count >= classDoc.capacity) {
        throw new Error(`Class ${classId} is full.`);
      }

      const existing = await cols.enrollments.findOne({ student_id: studentId, class_id: classId }, { session });
      if (existing) {
        throw new Error(`Student ${studentId} already enrolled in ${classId}.`);
      }

      const enrollmentId = `tx_${studentId}_${classId}`;
      await cols.enrollments.insertOne(
        {
          _id: enrollmentId,
          enrollment_id: enrollmentId,
          student_id: studentId,
          student_name: student.full_name,
          class_id: classDoc.class_id,
          course_code: classDoc.course_code,
          course_name: classDoc.course_name,
          teacher_id: classDoc.teacher_id,
          status: 'enrolled',
          payment_requested: false,
          credits: classDoc.credits,
          tuition_amount: classDoc.credits * 600000,
          enrolled_at: new Date(),
        },
        { session }
      );

      await cols.classes.updateOne(
        { class_id: classId },
        { $inc: { enrolled_count: 1 } },
        { session }
      );

      await cols.activityLogs.insertOne(
        {
          _id: `log_tx_${studentId}_${classId}`,
          action: 'ENROLL_CLASS_TX',
          actor: { user_id: studentId, role: 'student', name: student.full_name },
          target: { collection: 'enrollments', id: enrollmentId },
          metadata: { class_id: classDoc.class_id, course_code: classDoc.course_code },
          created_at: new Date(),
        },
        { session }
      );

      return {
        enrollment_id: enrollmentId,
        class_id: classDoc.class_id,
        course_code: classDoc.course_code,
      };
    });

    return result;
  } finally {
    await session.endSession();
  }
}

async function main() {
  await withDb(async ({ db, client }) => {
    await ensureSeedData(db);
    const cols = collections(db);

    printSection('Demo 04 - Transaction');

    const hello = await db.admin().command({ hello: 1 });
    if (!hello.setName) {
      console.log(
        'This MongoDB instance is not running as a replica set. Multi-document transactions require a replica set.'
      );
      return;
    }

    await cols.enrollments.deleteMany({ _id: { $in: ['tx_student002_class_cs304_a', 'tx_student002_class_cs304_a_dup'] } });
    await cols.activityLogs.deleteMany({ action: 'ENROLL_CLASS_TX' });
    await cols.classes.updateOne({ class_id: 'class_cs304_a' }, { $set: { enrolled_count: 0, capacity: 2, status: 'open' } });

    printSubsection('Transaction attempt');
    const success = await enrollClassWithTransaction(db, client, 'student002', 'class_cs304_a');
    console.log(pretty(success));

    printSubsection('Duplicate enrollment should fail atomically');
    try {
      await enrollClassWithTransaction(db, client, 'student002', 'class_cs304_a');
    } catch (error) {
      console.log(pretty({ expected_failure: error.message }));
    }

    printSubsection('Verify final state');
    const finalClass = await cols.classes.findOne(
      { class_id: 'class_cs304_a' },
      { projection: { _id: 0, class_id: 1, enrolled_count: 1, capacity: 1, status: 1 } }
    );
    const finalEnrollments = await cols.enrollments
      .find(
        { class_id: 'class_cs304_a' },
        { projection: { _id: 0, enrollment_id: 1, student_id: 1, status: 1 } }
      )
      .toArray();
    const finalLogs = await cols.activityLogs
      .find(
        { action: 'ENROLL_CLASS_TX' },
        { projection: { _id: 0, action: 1, 'actor.user_id': 1, created_at: 1 } }
      )
      .toArray();

    console.log(pretty({ finalClass, finalEnrollments, finalLogs }));
  });
}

main().catch((error) => {
  console.error('Transaction demo failed:', error);
  process.exit(1);
});
