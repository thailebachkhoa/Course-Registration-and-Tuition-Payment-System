const {
  withDb,
  ensureSeedData,
  collections,
  tuitionPerCredit,
  printSection,
  printSubsection,
  pretty,
} = require('./db');

async function main() {
  await withDb(async ({ db }) => {
    await ensureSeedData(db);
    const cols = collections(db);

    printSection('Demo 03 - Query Processing');

    const tempCourse = {
      _id: 'CS999',
      course_code: 'CS999',
      course_name: 'NoSQL Comparison Lab',
      credits: 2,
      department: 'Computer Science',
      tags: ['mongodb', 'comparison'],
    };

    printSubsection('Insert');
    await cols.courses.deleteOne({ _id: tempCourse._id });
    await cols.courses.insertOne(tempCourse);
    console.log('Goal: insert one new course document.');
    console.log(pretty(await cols.courses.findOne({ _id: tempCourse._id })));

    printSubsection('Update');
    await cols.courses.updateOne({ _id: tempCourse._id }, { $set: { credits: 3, lab_required: true } });
    console.log('Goal: update course credits and add a new field.');
    console.log(pretty(await cols.courses.findOne({ _id: tempCourse._id })));

    printSubsection('Delete');
    await cols.courses.deleteOne({ _id: tempCourse._id });
    console.log('Goal: delete the temporary course.');
    console.log(pretty({ exists_after_delete: !!(await cols.courses.findOne({ _id: tempCourse._id })) }));

    printSubsection('Query with single condition');
    const singleCondition = await cols.classes
      .find({ course_code: 'CS202' }, { projection: { _id: 0, class_id: 1, teacher_name: 1, status: 1 } })
      .toArray();
    console.log('Goal: find classes by one field.');
    console.log(pretty(singleCondition));

    printSubsection('Query with composite condition');
    const compositeCondition = await cols.classes
      .find(
        { department: 'Computer Science', credits: 3, status: 'open' },
        { projection: { _id: 0, class_id: 1, course_code: 1, room: 1 } }
      )
      .toArray();
    console.log('Goal: find classes using multiple filters.');
    console.log(pretty(compositeCondition));

    printSubsection('Join using $lookup');
    const lookupResult = await cols.enrollments
      .aggregate([
        { $match: { student_id: 'student001' } },
        {
          $lookup: {
            from: 'classes',
            localField: 'class_id',
            foreignField: 'class_id',
            as: 'class_doc',
          },
        },
        { $unwind: '$class_doc' },
        {
          $project: {
            _id: 0,
            student_id: 1,
            course_code: 1,
            status: 1,
            room: '$class_doc.room',
            day_of_week: '$class_doc.day_of_week',
          },
        },
      ])
      .toArray();
    console.log('Goal: emulate SQL join between enrollments and classes.');
    console.log(pretty(lookupResult));

    printSubsection('Subquery-like aggregation');
    const subqueryLike = await cols.classes
      .aggregate([
        {
          $lookup: {
            from: 'enrollments',
            let: { classId: '$class_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$class_id', '$$classId'] },
                      { $eq: ['$payment_requested', true] },
                    ],
                  },
                },
              },
            ],
            as: 'pending_requests',
          },
        },
        { $match: { pending_requests: { $ne: [] } } },
        {
          $project: {
            _id: 0,
            class_id: 1,
            course_code: 1,
            pending_request_count: { $size: '$pending_requests' },
          },
        },
      ])
      .toArray();
    console.log('Goal: emulate a correlated subquery that checks pending payment requests per class.');
    console.log(pretty(subqueryLike));

    printSubsection('Aggregate functions using $group');
    const aggregateResult = await cols.enrollments
      .aggregate([
        { $match: { status: { $in: ['enrolled', 'payed'] } } },
        {
          $group: {
            _id: '$student_id',
            enrolled_classes: { $sum: 1 },
            total_credits: { $sum: '$credits' },
            total_tuition: { $sum: '$tuition_amount' },
          },
        },
        {
          $project: {
            _id: 0,
            student_id: '$_id',
            enrolled_classes: 1,
            total_credits: 1,
            total_tuition: 1,
          },
        },
        { $sort: { total_tuition: -1, student_id: 1 } },
      ])
      .toArray();
    console.log('Goal: compute tuition totals like SQL GROUP BY.');
    console.log(pretty(aggregateResult));

    printSubsection('Extra note');
    console.log(
      pretty({
        tuition_per_credit: tuitionPerCredit,
        note: 'In MongoDB, some query workloads can avoid joins because course and teacher fields are copied into class documents.',
      })
    );
  });
}

main().catch((error) => {
  console.error('Query processing demo failed:', error);
  process.exit(1);
});
