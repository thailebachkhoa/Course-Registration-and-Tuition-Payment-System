const {
  withDb,
  ensureSeedData,
  collections,
  printSection,
  printSubsection,
  summarizeExplain,
  pretty,
} = require('./db');

async function main() {
  await withDb(async ({ db }) => {
    await ensureSeedData(db);
    const cols = collections(db);

    printSection('Demo 02 - Indexing');

    printSubsection('Drop demo indexes to capture before/after explain output');
    await cols.classes.dropIndexes().catch(() => {});
    await cols.enrollments.dropIndexes().catch(() => {});
    await cols.activityLogs.dropIndexes().catch(() => {});
    console.log('Only default _id indexes remain.');

    const beforeCourseExplain = await cols.classes
      .find({ course_code: 'CS202' })
      .explain('executionStats');
    const beforeCompositeExplain = await cols.classes
      .find({ department: 'Computer Science', credits: 3, status: 'open' })
      .explain('executionStats');
    const beforeActivityExplain = await cols.activityLogs
      .find({ action: 'REQUEST_PAYMENT' })
      .sort({ created_at: -1 })
      .explain('executionStats');

    printSubsection('Before index - classes by course_code');
    console.log(pretty(summarizeExplain(beforeCourseExplain)));

    printSubsection('Before index - classes by department + credits + status');
    console.log(pretty(summarizeExplain(beforeCompositeExplain)));

    printSubsection('Before index - activity logs by action');
    console.log(pretty(summarizeExplain(beforeActivityExplain)));

    printSubsection('Create required indexes');
    await cols.classes.createIndex({ course_code: 1 });
    await cols.classes.createIndex({ department: 1, credits: 1, status: 1 });
    await cols.enrollments.createIndex({ student_id: 1, class_id: 1 }, { unique: true });
    await cols.activityLogs.createIndex({ 'actor.user_id': 1, created_at: -1 });
    await cols.activityLogs.createIndex({ action: 1, created_at: -1 });
    console.log('Indexes created successfully.');

    const afterCourseExplain = await cols.classes
      .find({ course_code: 'CS202' })
      .explain('executionStats');
    const afterCompositeExplain = await cols.classes
      .find({ department: 'Computer Science', credits: 3, status: 'open' })
      .explain('executionStats');
    const afterEnrollmentExplain = await cols.enrollments
      .find({ student_id: 'student001', class_id: 'class_cs202_a' })
      .explain('executionStats');
    const afterActivityActorExplain = await cols.activityLogs
      .find({ 'actor.user_id': 'student001' })
      .sort({ created_at: -1 })
      .explain('executionStats');
    const afterActivityActionExplain = await cols.activityLogs
      .find({ action: 'REQUEST_PAYMENT' })
      .sort({ created_at: -1 })
      .explain('executionStats');

    printSubsection('After index - classes by course_code');
    console.log(pretty(summarizeExplain(afterCourseExplain)));

    printSubsection('After index - classes by department + credits + status');
    console.log(pretty(summarizeExplain(afterCompositeExplain)));

    printSubsection('After index - enrollments by student_id + class_id');
    console.log(pretty(summarizeExplain(afterEnrollmentExplain)));

    printSubsection('After index - activity logs by actor.user_id');
    console.log(pretty(summarizeExplain(afterActivityActorExplain)));

    printSubsection('After index - activity logs by action');
    console.log(pretty(summarizeExplain(afterActivityActionExplain)));

    printSubsection('Takeaways');
    console.log('- MongoDB still needs deliberate indexing even with flexible documents.');
    console.log('- Compound indexes help composite filters and sort patterns used in dashboards.');
    console.log('- Unique compound index on enrollments mirrors the duplicate protection used in MySQL.');
  });
}

main().catch((error) => {
  console.error('Indexing demo failed:', error);
  process.exit(1);
});
