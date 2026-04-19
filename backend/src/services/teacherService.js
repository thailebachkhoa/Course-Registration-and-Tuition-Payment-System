const AppError = require('../helpers/appError');

const createTeacherService = ({ teacherModel }) => {
  const getStageBlockedMessage = (stage) => {
    if (stage === 'create_class') return 'Hệ thống đang tạo lớp';
    if (stage === 'register_class') return 'Hệ thống đang đăng ký lớp';
    if (stage === 'lock_class') return 'Hệ thống đang chuẩn bị thời khóa biểu';
    if (stage === 'scheduled_class') return 'Hệ thống đang mở thời khóa biểu';
    return 'Giai đoạn hệ thống không hợp lệ';
  };

  const ensureStage = async (expectedStage) => {
    const stage = await teacherModel.getCurrentStage();
    if (stage !== expectedStage) {
      throw new AppError(getStageBlockedMessage(stage), 403, { stage, blocked: true });
    }
    return stage;
  };

  const ensureNoTimeConflict = async (teacherId, payload, excludeClassId) => {
    const conflict = await teacherModel.findTimeConflict({
      teacherId,
      day_of_week: payload.day_of_week,
      start_time: payload.start_time,
      end_time: payload.end_time,
      excludeClassId,
    });

    if (conflict) {
      throw new AppError('Giảng viên đã có lớp trùng thời điểm này', 409, {
        conflict_class_id: conflict.class_id,
      });
    }
  };

  const getMyClasses = async (teacherId) => {
    await ensureStage('create_class');
    return teacherModel.getMyClasses(teacherId);
  };

  const getSchedule = async (teacherId) => {
    await ensureStage('scheduled_class');
    return teacherModel.getSchedule(teacherId);
  };

  const createClass = async (teacherId, payload) => {
    await ensureStage('create_class');

    const course = await teacherModel.findCourseByCode(payload.course_code);
    if (!course) {
      throw new AppError('Mã môn học không tồn tại', 404);
    }

    await ensureNoTimeConflict(teacherId, payload);

    return teacherModel.createClass({ ...payload, teacher_id: teacherId });
  };

  const updateClass = async (teacherId, classId, payload) => {
    await ensureStage('create_class');

    const ownedClass = await teacherModel.findOwnedClass(classId, teacherId);
    if (!ownedClass) {
      throw new AppError('Không có quyền chỉnh sửa lớp này', 403);
    }

    await ensureNoTimeConflict(teacherId, payload, classId);

    await teacherModel.updateClass(classId, payload);
  };

  const deleteClass = async (teacherId, classId) => {
    await ensureStage('create_class');

    const ownedClass = await teacherModel.findOwnedClass(classId, teacherId);
    if (!ownedClass) {
      throw new AppError('Không có quyền xóa lớp này', 403);
    }

    await teacherModel.deleteClass(classId);
  };

  const getCourses = async () => {
    await ensureStage('create_class');
    return teacherModel.getCourses();
  };

  const getCourseByCode = async (courseCode) => {
    await ensureStage('create_class');

    const course = await teacherModel.getCourseByCode(courseCode);
    if (!course) {
      throw new AppError('Không tìm thấy môn học', 404);
    }
    return course;
  };

  return {
    getMyClasses,
    getSchedule,
    createClass,
    updateClass,
    deleteClass,
    getCourses,
    getCourseByCode,
  };
};

module.exports = createTeacherService;
