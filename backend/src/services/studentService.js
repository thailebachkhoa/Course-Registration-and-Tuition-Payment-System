const AppError = require('../helpers/appError');

const createStudentService = ({ studentModel }) => {
  const getStageBlockedMessage = (stage) => {
    if (stage === 'create_class') return 'Hệ thống đang tạo lớp';
    if (stage === 'register_class') return 'Hệ thống đang đăng ký lớp';
    if (stage === 'lock_class') return 'Hệ thống đang chuẩn bị thời khóa biểu';
    if (stage === 'scheduled_class') return 'Hệ thống đang mở thời khóa biểu';
    return 'Giai đoạn hệ thống không hợp lệ';
  };

  const ensureStage = async (expectedStage) => {
    const stage = await studentModel.getCurrentStage();
    if (stage !== expectedStage) {
      throw new AppError(getStageBlockedMessage(stage), 403, { stage, blocked: true });
    }
    return stage;
  };

  const getCatalog = async (studentId, filters) => {
    await ensureStage('register_class');
    return studentModel.getCatalog(studentId, filters);
  };

  const getEnrollments = async (studentId) => {
    await ensureStage('register_class');
    return studentModel.getEnrollments(studentId);
  };

  const getSchedule = async (studentId) => {
    await ensureStage('scheduled_class');
    const classes = await studentModel.getScheduleClasses(studentId);
    const summary = await studentModel.getScheduleSummary(studentId);
    return { classes, summary };
  };

  const enroll = async (studentId, classId) => {
    await ensureStage('register_class');

    const foundClass = await studentModel.findClassById(classId);
    if (!foundClass) {
      throw new AppError('Lớp học không tồn tại', 404);
    }

    const conflict = await studentModel.findScheduleConflict(studentId, foundClass);
    if (conflict) {
      throw new AppError('Bạn đã có lớp trùng lịch học', 409, {
        conflict_class_id: conflict.class_id,
      });
    }

    try {
      await studentModel.createEnrollment(studentId, classId);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new AppError('Bạn đã đăng ký lớp này rồi', 409);
      }
      throw error;
    }
  };

  const cancelEnroll = async (studentId, classId) => {
    await ensureStage('register_class');

    const affectedRows = await studentModel.deleteEnrollment(studentId, classId);
    if (affectedRows === 0) {
      throw new AppError('Không tìm thấy đăng ký', 404);
    }
  };

  const getTuition = async (studentId) => {
    await ensureStage('register_class');

    const classes = await studentModel.getTuitionClasses(studentId);
    const summary = await studentModel.getTuitionSummary(studentId);
    const hasPaymentRequested = classes.some((item) => item.payment_requested);

    return {
      classes,
      total_amount: summary.total_amount || 0,
      total_credits: summary.total_credits || 0,
      payment_requested: hasPaymentRequested,
    };
  };

  const requestPayment = async (studentId) => {
    await ensureStage('register_class');

    const enrollments = await studentModel.getEnrollmentsPendingPayment(studentId);
    if (enrollments.length === 0) {
      throw new AppError('Không có môn học nào để xác nhận', 400);
    }

    await studentModel.markPaymentRequested(studentId);
  };

  const getDepartments = async () => {
    await ensureStage('register_class');
    return studentModel.getDepartments();
  };

  return {
    getCatalog,
    getEnrollments,
    getSchedule,
    enroll,
    cancelEnroll,
    getTuition,
    requestPayment,
    getDepartments,
  };
};

module.exports = createStudentService;
