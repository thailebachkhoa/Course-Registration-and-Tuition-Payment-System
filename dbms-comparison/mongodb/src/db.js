const { MongoClient } = require('mongodb');

const databaseName = process.env.MONGO_DB_NAME || 'course_registration_mongo';
const mongoUri =
  process.env.MONGO_URI ||
  `mongodb://127.0.0.1:27017/${databaseName}?replicaSet=rs0&directConnection=true`;

const collectionNames = {
  users: 'users',
  courses: 'courses',
  classes: 'classes',
  enrollments: 'enrollments',
  systemState: 'system_state',
  activityLogs: 'activity_logs',
  studentDashboardSnapshots: 'student_dashboard_snapshots',
  paymentRequestSnapshots: 'payment_request_snapshots',
};

const tuitionPerCredit = 600000;

function printSection(title) {
  console.log(`\n=== ${title} ===`);
}

function printSubsection(title) {
  console.log(`\n--- ${title} ---`);
}

function pretty(value) {
  return JSON.stringify(value, null, 2);
}

function iso(dateString) {
  return new Date(dateString);
}

function buildSeedData() {
  const users = [
    {
      _id: 'admin001',
      user_id: 'admin001',
      role: 'admin',
      full_name: 'System Administrator',
      email: 'admin@school.edu.vn',
      created_at: iso('2026-01-01T08:00:00Z'),
    },
    {
      _id: 'teacher001',
      user_id: 'teacher001',
      role: 'teacher',
      full_name: 'Nguyen Van A',
      email: 'teacher001@school.edu.vn',
      department: 'Computer Science',
      created_at: iso('2026-01-02T08:00:00Z'),
    },
    {
      _id: 'teacher002',
      user_id: 'teacher002',
      role: 'teacher',
      full_name: 'Tran Thi B',
      email: 'teacher002@school.edu.vn',
      department: 'Computer Science',
      created_at: iso('2026-01-02T08:05:00Z'),
    },
    {
      _id: 'teacher003',
      user_id: 'teacher003',
      role: 'teacher',
      full_name: 'Le Hoang C',
      email: 'teacher003@school.edu.vn',
      department: 'Mathematics',
      created_at: iso('2026-01-02T08:10:00Z'),
    },
    {
      _id: 'student001',
      user_id: 'student001',
      role: 'student',
      full_name: 'Pham Minh D',
      email: 'student001@student.edu.vn',
      major: 'Computer Science',
      created_at: iso('2026-01-03T09:00:00Z'),
    },
    {
      _id: 'student002',
      user_id: 'student002',
      role: 'student',
      full_name: 'Vo Linh E',
      email: 'student002@student.edu.vn',
      major: 'Computer Science',
      created_at: iso('2026-01-03T09:05:00Z'),
    },
    {
      _id: 'student003',
      user_id: 'student003',
      role: 'student',
      full_name: 'Dang Tuan F',
      email: 'student003@student.edu.vn',
      major: 'Mathematics',
      created_at: iso('2026-01-03T09:10:00Z'),
    },
    {
      _id: 'student004',
      user_id: 'student004',
      role: 'student',
      full_name: 'Bui Nhat G',
      email: 'student004@student.edu.vn',
      major: 'English',
      created_at: iso('2026-01-03T09:15:00Z'),
    },
  ];

  const courses = [
    {
      _id: 'CS202',
      course_code: 'CS202',
      course_name: 'Database Systems',
      credits: 3,
      department: 'Computer Science',
      tags: ['sql', 'data-modeling'],
    },
    {
      _id: 'CS303',
      course_code: 'CS303',
      course_name: 'Web Programming',
      credits: 3,
      department: 'Computer Science',
      tags: ['web', 'javascript'],
    },
    {
      _id: 'CS304',
      course_code: 'CS304',
      course_name: 'Distributed Systems',
      credits: 4,
      department: 'Computer Science',
      tags: ['distributed', 'backend'],
    },
    {
      _id: 'MATH201',
      course_code: 'MATH201',
      course_name: 'Linear Algebra',
      credits: 3,
      department: 'Mathematics',
      tags: ['math'],
    },
    {
      _id: 'ENG201',
      course_code: 'ENG201',
      course_name: 'Technical English',
      credits: 2,
      department: 'English',
      tags: ['language'],
    },
    {
      _id: 'BUS101',
      course_code: 'BUS101',
      course_name: 'Principles of Management',
      credits: 3,
      department: 'Business',
      tags: ['management'],
    },
  ];

  const classes = [
    {
      _id: 'class_cs202_a',
      class_id: 'class_cs202_a',
      course_code: 'CS202',
      course_name: 'Database Systems',
      credits: 3,
      department: 'Computer Science',
      teacher_id: 'teacher001',
      teacher_name: 'Nguyen Van A',
      day_of_week: 'Monday',
      start_time: '08:00',
      end_time: '10:00',
      room: 'A101',
      status: 'open',
      capacity: 3,
      enrolled_count: 2,
      created_at: iso('2026-02-01T08:00:00Z'),
    },
    {
      _id: 'class_cs303_a',
      class_id: 'class_cs303_a',
      course_code: 'CS303',
      course_name: 'Web Programming',
      credits: 3,
      department: 'Computer Science',
      teacher_id: 'teacher001',
      teacher_name: 'Nguyen Van A',
      day_of_week: 'Wednesday',
      start_time: '13:00',
      end_time: '15:00',
      room: 'A102',
      status: 'open',
      capacity: 2,
      enrolled_count: 1,
      created_at: iso('2026-02-01T08:10:00Z'),
    },
    {
      _id: 'class_cs304_a',
      class_id: 'class_cs304_a',
      course_code: 'CS304',
      course_name: 'Distributed Systems',
      credits: 4,
      department: 'Computer Science',
      teacher_id: 'teacher002',
      teacher_name: 'Tran Thi B',
      day_of_week: 'Friday',
      start_time: '09:00',
      end_time: '12:00',
      room: 'A103',
      status: 'open',
      capacity: 2,
      enrolled_count: 0,
      created_at: iso('2026-02-01T08:20:00Z'),
    },
    {
      _id: 'class_math201_a',
      class_id: 'class_math201_a',
      course_code: 'MATH201',
      course_name: 'Linear Algebra',
      credits: 3,
      department: 'Mathematics',
      teacher_id: 'teacher003',
      teacher_name: 'Le Hoang C',
      day_of_week: 'Tuesday',
      start_time: '07:00',
      end_time: '09:00',
      room: 'B201',
      status: 'open',
      capacity: 2,
      enrolled_count: 1,
      created_at: iso('2026-02-01T08:30:00Z'),
    },
    {
      _id: 'class_eng201_a',
      class_id: 'class_eng201_a',
      course_code: 'ENG201',
      course_name: 'Technical English',
      credits: 2,
      department: 'English',
      teacher_id: 'teacher002',
      teacher_name: 'Tran Thi B',
      day_of_week: 'Thursday',
      start_time: '15:00',
      end_time: '17:00',
      room: 'C101',
      status: 'closed',
      capacity: 2,
      enrolled_count: 2,
      created_at: iso('2026-02-01T08:40:00Z'),
    },
  ];

  const enrollments = [
    {
      _id: 'enr001',
      enrollment_id: 'enr001',
      student_id: 'student001',
      student_name: 'Pham Minh D',
      class_id: 'class_cs202_a',
      course_code: 'CS202',
      course_name: 'Database Systems',
      teacher_id: 'teacher001',
      status: 'enrolled',
      payment_requested: true,
      payment_request_at: iso('2026-02-10T04:00:00Z'),
      credits: 3,
      tuition_amount: 1800000,
      enrolled_at: iso('2026-02-05T09:00:00Z'),
    },
    {
      _id: 'enr002',
      enrollment_id: 'enr002',
      student_id: 'student001',
      student_name: 'Pham Minh D',
      class_id: 'class_cs303_a',
      course_code: 'CS303',
      course_name: 'Web Programming',
      teacher_id: 'teacher001',
      status: 'payed',
      payment_requested: false,
      credits: 3,
      tuition_amount: 1800000,
      enrolled_at: iso('2026-02-05T09:10:00Z'),
    },
    {
      _id: 'enr003',
      enrollment_id: 'enr003',
      student_id: 'student002',
      student_name: 'Vo Linh E',
      class_id: 'class_cs202_a',
      course_code: 'CS202',
      course_name: 'Database Systems',
      teacher_id: 'teacher001',
      status: 'enrolled',
      payment_requested: false,
      credits: 3,
      tuition_amount: 1800000,
      enrolled_at: iso('2026-02-05T09:20:00Z'),
    },
    {
      _id: 'enr004',
      enrollment_id: 'enr004',
      student_id: 'student003',
      student_name: 'Dang Tuan F',
      class_id: 'class_math201_a',
      course_code: 'MATH201',
      course_name: 'Linear Algebra',
      teacher_id: 'teacher003',
      status: 'payed',
      payment_requested: false,
      credits: 3,
      tuition_amount: 1800000,
      enrolled_at: iso('2026-02-05T09:30:00Z'),
    },
    {
      _id: 'enr005',
      enrollment_id: 'enr005',
      student_id: 'student004',
      student_name: 'Bui Nhat G',
      class_id: 'class_eng201_a',
      course_code: 'ENG201',
      course_name: 'Technical English',
      teacher_id: 'teacher002',
      status: 'payed',
      payment_requested: false,
      credits: 2,
      tuition_amount: 1200000,
      enrolled_at: iso('2026-02-05T09:40:00Z'),
    },
  ];

  const systemState = [
    {
      _id: 1,
      current_stage: 'lock_class',
      semester: '2026.2',
      updated_at: iso('2026-02-10T05:00:00Z'),
    },
  ];

  const activityLogs = [
    {
      _id: 'log001',
      action: 'CREATE_CLASS',
      actor: { user_id: 'teacher001', role: 'teacher', name: 'Nguyen Van A' },
      target: { collection: 'classes', id: 'class_cs202_a' },
      metadata: { course_code: 'CS202', room: 'A101' },
      created_at: iso('2026-02-01T08:00:00Z'),
    },
    {
      _id: 'log002',
      action: 'ENROLL_CLASS',
      actor: { user_id: 'student001', role: 'student', name: 'Pham Minh D' },
      target: { collection: 'enrollments', id: 'enr001' },
      metadata: { class_id: 'class_cs202_a', course_code: 'CS202' },
      created_at: iso('2026-02-05T09:00:00Z'),
    },
    {
      _id: 'log003',
      action: 'REQUEST_PAYMENT',
      actor: { user_id: 'student001', role: 'student', name: 'Pham Minh D' },
      target: { collection: 'enrollments', id: 'enr001' },
      metadata: { amount: 1800000, class_count: 1 },
      created_at: iso('2026-02-10T04:00:00Z'),
    },
    {
      _id: 'log004',
      action: 'APPROVE_PAYMENT',
      actor: { user_id: 'admin001', role: 'admin', name: 'System Administrator' },
      target: { collection: 'student_dashboard_snapshots', id: 'snapshot_student001' },
      metadata: { student_id: 'student001', approved_amount: 1800000 },
      created_at: iso('2026-02-10T05:00:00Z'),
    },
  ];

  const studentDashboardSnapshots = [
    {
      _id: 'snapshot_student001',
      student_id: 'student001',
      student_name: 'Pham Minh D',
      generated_at: iso('2026-02-10T05:05:00Z'),
      current_stage: 'lock_class',
      enrolled_classes: [
        {
          class_id: 'class_cs202_a',
          course_code: 'CS202',
          course_name: 'Database Systems',
          teacher_name: 'Nguyen Van A',
          status: 'enrolled',
          payment_requested: true,
        },
        {
          class_id: 'class_cs303_a',
          course_code: 'CS303',
          course_name: 'Web Programming',
          teacher_name: 'Nguyen Van A',
          status: 'payed',
          payment_requested: false,
        },
      ],
      summary: {
        total_classes: 2,
        total_credits: 6,
        pending_payment_amount: 1800000,
        payed_amount: 1800000,
      },
    },
    {
      _id: 'snapshot_student002',
      student_id: 'student002',
      student_name: 'Vo Linh E',
      generated_at: iso('2026-02-10T05:05:00Z'),
      current_stage: 'lock_class',
      enrolled_classes: [
        {
          class_id: 'class_cs202_a',
          course_code: 'CS202',
          course_name: 'Database Systems',
          teacher_name: 'Nguyen Van A',
          status: 'enrolled',
          payment_requested: false,
        },
      ],
      summary: {
        total_classes: 1,
        total_credits: 3,
        pending_payment_amount: 1800000,
        payed_amount: 0,
      },
    },
  ];

  const paymentRequestSnapshots = [
    {
      _id: 'payment_snapshot_2026_02_10',
      snapshot_key: 'payment_snapshot_2026_02_10',
      generated_at: iso('2026-02-10T05:10:00Z'),
      requests: [
        {
          student_id: 'student001',
          student_name: 'Pham Minh D',
          total_amount: 1800000,
          class_count: 1,
          class_ids: ['class_cs202_a'],
        },
      ],
      summary: {
        total_students_waiting: 1,
        total_amount_waiting: 1800000,
      },
    },
  ];

  return {
    users,
    courses,
    classes,
    enrollments,
    systemState,
    activityLogs,
    studentDashboardSnapshots,
    paymentRequestSnapshots,
  };
}

async function connect() {
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(databaseName);
  return { client, db };
}

async function withDb(work) {
  const { client, db } = await connect();
  try {
    return await work({ client, db });
  } finally {
    await client.close();
  }
}

function collections(db) {
  return {
    users: db.collection(collectionNames.users),
    courses: db.collection(collectionNames.courses),
    classes: db.collection(collectionNames.classes),
    enrollments: db.collection(collectionNames.enrollments),
    systemState: db.collection(collectionNames.systemState),
    activityLogs: db.collection(collectionNames.activityLogs),
    studentDashboardSnapshots: db.collection(collectionNames.studentDashboardSnapshots),
    paymentRequestSnapshots: db.collection(collectionNames.paymentRequestSnapshots),
  };
}

async function resetDatabase(db) {
  await db.dropDatabase();
}

async function createRecommendedIndexes(db) {
  const cols = collections(db);
  await cols.classes.createIndex({ course_code: 1 });
  await cols.classes.createIndex({ department: 1, credits: 1, status: 1 });
  await cols.enrollments.createIndex({ student_id: 1, class_id: 1 }, { unique: true });
  await cols.activityLogs.createIndex({ 'actor.user_id': 1, created_at: -1 });
  await cols.activityLogs.createIndex({ action: 1, created_at: -1 });
}

async function seedDatabase(db) {
  const data = buildSeedData();
  const cols = collections(db);

  await cols.users.insertMany(data.users);
  await cols.courses.insertMany(data.courses);
  await cols.classes.insertMany(data.classes);
  await cols.enrollments.insertMany(data.enrollments);
  await cols.systemState.insertMany(data.systemState);
  await cols.activityLogs.insertMany(data.activityLogs);
  await cols.studentDashboardSnapshots.insertMany(data.studentDashboardSnapshots);
  await cols.paymentRequestSnapshots.insertMany(data.paymentRequestSnapshots);

  await createRecommendedIndexes(db);
}

async function ensureSeedData(db) {
  const cols = collections(db);
  const userCount = await cols.users.countDocuments();
  if (userCount > 0) {
    return false;
  }
  await seedDatabase(db);
  return true;
}

async function getCounts(db) {
  const cols = collections(db);
  const [users, courses, classes, enrollments, systemState, activityLogs, snapshots, paymentSnapshots] =
    await Promise.all([
      cols.users.countDocuments(),
      cols.courses.countDocuments(),
      cols.classes.countDocuments(),
      cols.enrollments.countDocuments(),
      cols.systemState.countDocuments(),
      cols.activityLogs.countDocuments(),
      cols.studentDashboardSnapshots.countDocuments(),
      cols.paymentRequestSnapshots.countDocuments(),
    ]);

  return {
    users,
    courses,
    classes,
    enrollments,
    system_state: systemState,
    activity_logs: activityLogs,
    student_dashboard_snapshots: snapshots,
    payment_request_snapshots: paymentSnapshots,
  };
}

function summarizeExplain(explain) {
  return {
    winningPlan: explain.queryPlanner?.winningPlan?.stage || explain.queryPlanner?.winningPlan?.inputStage?.stage,
    namespace: explain.queryPlanner?.namespace,
    totalDocsExamined: explain.executionStats?.totalDocsExamined,
    totalKeysExamined: explain.executionStats?.totalKeysExamined,
    nReturned: explain.executionStats?.nReturned,
    executionTimeMillis: explain.executionStats?.executionTimeMillis,
  };
}

module.exports = {
  MongoClient,
  collectionNames,
  databaseName,
  mongoUri,
  tuitionPerCredit,
  connect,
  withDb,
  collections,
  resetDatabase,
  seedDatabase,
  ensureSeedData,
  createRecommendedIndexes,
  getCounts,
  summarizeExplain,
  buildSeedData,
  printSection,
  printSubsection,
  pretty,
};
