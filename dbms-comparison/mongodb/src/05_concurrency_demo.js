const { withDb, ensureSeedData, collections, printSection, printSubsection, pretty } = require('./db');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function prepareRaceDemo(db) {
  const cols = collections(db);
  await cols.enrollments.deleteMany({
    class_id: { $in: ['class_race_unsafe', 'class_race_safe'] },
  });
  await cols.activityLogs.deleteMany({
    action: { $in: ['UNSAFE_ENROLL_ATTEMPT', 'SAFE_ENROLL_ATTEMPT'] },
  });
  await cols.classes.deleteMany({
    class_id: { $in: ['class_race_unsafe', 'class_race_safe'] },
  });

  const template = {
    course_code: 'CS304',
    course_name: 'Distributed Systems',
    credits: 4,
    department: 'Computer Science',
    teacher_id: 'teacher002',
    teacher_name: 'Tran Thi B',
    day_of_week: 'Friday',
    start_time: '14:00',
    end_time: '16:00',
    room: 'RACE01',
    status: 'open',
    capacity: 1,
    enrolled_count: 0,
    created_at: new Date(),
  };

  await cols.classes.insertMany([
    { _id: 'class_race_unsafe', class_id: 'class_race_unsafe', ...template },
    { _id: 'class_race_safe', class_id: 'class_race_safe', ...template },
  ]);
}

async function unsafeEnroll(db, studentId, classId) {
  const cols = collections(db);
  const classDoc = await cols.classes.findOne({ class_id: classId });
  if (!classDoc) {
    throw new Error('Class not found');
  }
  if (classDoc.enrolled_count >= classDoc.capacity) {
    throw new Error('No slot left');
  }

  await sleep(200);

  await cols.enrollments.insertOne({
    _id: `unsafe_${studentId}_${classId}`,
    enrollment_id: `unsafe_${studentId}_${classId}`,
    student_id: studentId,
    student_name: studentId,
    class_id: classId,
    course_code: classDoc.course_code,
    course_name: classDoc.course_name,
    teacher_id: classDoc.teacher_id,
    status: 'enrolled',
    payment_requested: false,
    credits: classDoc.credits,
    tuition_amount: classDoc.credits * 600000,
    enrolled_at: new Date(),
  });

  await cols.classes.updateOne({ class_id: classId }, { $inc: { enrolled_count: 1 } });
  await cols.activityLogs.insertOne({
    _id: `log_unsafe_${studentId}_${classId}`,
    action: 'UNSAFE_ENROLL_ATTEMPT',
    actor: { user_id: studentId, role: 'student', name: studentId },
    target: { collection: 'classes', id: classId },
    created_at: new Date(),
  });

  return { student_id: studentId, status: 'success' };
}

async function safeEnroll(db, client, studentId, classId) {
  const cols = collections(db);
  const session = client.startSession();

  try {
    return await session.withTransaction(async () => {
      const reserved = await cols.classes.findOneAndUpdate(
        {
          class_id: classId,
          enrolled_count: { $lt: 1 },
        },
        { $inc: { enrolled_count: 1 } },
        { session, returnDocument: 'after' }
      );

      if (!reserved) {
        throw new Error('No slot left');
      }

      await cols.enrollments.insertOne(
        {
          _id: `safe_${studentId}_${classId}`,
          enrollment_id: `safe_${studentId}_${classId}`,
          student_id: studentId,
          student_name: studentId,
          class_id: classId,
          course_code: reserved.course_code,
          course_name: reserved.course_name,
          teacher_id: reserved.teacher_id,
          status: 'enrolled',
          payment_requested: false,
          credits: reserved.credits,
          tuition_amount: reserved.credits * 600000,
          enrolled_at: new Date(),
        },
        { session }
      );

      await cols.activityLogs.insertOne(
        {
          _id: `log_safe_${studentId}_${classId}`,
          action: 'SAFE_ENROLL_ATTEMPT',
          actor: { user_id: studentId, role: 'student', name: studentId },
          target: { collection: 'classes', id: classId },
          created_at: new Date(),
        },
        { session }
      );

      return { student_id: studentId, status: 'success' };
    });
  } finally {
    await session.endSession();
  }
}

function summarizeRace(results, finalClass, createdEnrollments) {
  const successCount = results.filter((item) => item.status === 'success').length;
  const failedCount = results.filter((item) => item.status === 'failed').length;
  return {
    success_count: successCount,
    failed_count: failedCount,
    final_enrolled_count: finalClass?.enrolled_count || 0,
    enrollments_created: createdEnrollments.map((item) => ({
      student_id: item.student_id,
      class_id: item.class_id,
      enrollment_id: item.enrollment_id,
    })),
    request_results: results,
  };
}

async function main() {
  await withDb(async ({ db, client }) => {
    await ensureSeedData(db);
    await prepareRaceDemo(db);
    const cols = collections(db);

    printSection('Demo 05 - Concurrency Control');
    console.log('This demo intentionally uses a one-slot class (capacity = 1) to make the race condition easy to observe.');

    printSubsection('Unsafe version - race condition / over-enroll risk');
    const unsafeResults = await Promise.allSettled([
      unsafeEnroll(db, 'student001', 'class_race_unsafe'),
      unsafeEnroll(db, 'student002', 'class_race_unsafe'),
    ]);
    const unsafeFinalClass = await cols.classes.findOne({ class_id: 'class_race_unsafe' });
    const unsafeEnrollments = await cols.enrollments
      .find({ class_id: 'class_race_unsafe' }, { projection: { _id: 0, enrollment_id: 1, student_id: 1, class_id: 1 } })
      .toArray();
    console.log(
      pretty(
        summarizeRace(
          unsafeResults.map((item) =>
            item.status === 'fulfilled'
              ? item.value
              : { status: 'failed', reason: item.reason.message }
          ),
          unsafeFinalClass,
          unsafeEnrollments
        )
      )
    );

    printSubsection('Safe version - conditional update + transaction');
    const safeResults = await Promise.allSettled([
      safeEnroll(db, client, 'student003', 'class_race_safe'),
      safeEnroll(db, client, 'student004', 'class_race_safe'),
    ]);
    const safeFinalClass = await cols.classes.findOne({ class_id: 'class_race_safe' });
    const safeEnrollments = await cols.enrollments
      .find({ class_id: 'class_race_safe' }, { projection: { _id: 0, enrollment_id: 1, student_id: 1, class_id: 1 } })
      .toArray();
    console.log(
      pretty(
        summarizeRace(
          safeResults.map((item) =>
            item.status === 'fulfilled'
              ? item.value
              : { status: 'failed', reason: item.reason.message }
          ),
          safeFinalClass,
          safeEnrollments
        )
      )
    );
  });
}

main().catch((error) => {
  console.error('Concurrency demo failed:', error);
  process.exit(1);
});
