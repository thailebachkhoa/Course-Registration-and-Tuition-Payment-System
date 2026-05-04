const AppError = require('../helpers/appError');

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

const normalizeTime = (value, fieldName) => {
  const normalized = String(value).trim();
  if (!TIME_REGEX.test(normalized)) {
    throw new AppError(`${fieldName} không đúng định dạng HH:mm hoặc HH:mm:ss`, 400);
  }

  if (normalized.length === 5) {
    return `${normalized}:00`;
  }

  return normalized;
};

const parseCreateClassInput = (body = {}) => {
  const { course_code, day_of_week, start_time, end_time } = body;

  if (!course_code || !day_of_week || !start_time || !end_time) {
    throw new AppError('Thiếu thông tin lớp học', 400);
  }

  const normalizedStartTime = normalizeTime(start_time, 'start_time');
  const normalizedEndTime = normalizeTime(end_time, 'end_time');
  if (normalizedStartTime >= normalizedEndTime) {
    throw new AppError('start_time phải nhỏ hơn end_time', 400);
  }

  return {
    course_code: String(course_code).trim(),
    day_of_week: String(day_of_week).trim(),
    start_time: normalizedStartTime,
    end_time: normalizedEndTime,
  };
};

const parseUpdateClassInput = (body = {}) => {
  const { day_of_week, start_time, end_time } = body;

  if (!day_of_week || !start_time || !end_time) {
    throw new AppError('Thiếu thông tin cập nhật lớp học', 400);
  }

  const normalizedStartTime = normalizeTime(start_time, 'start_time');
  const normalizedEndTime = normalizeTime(end_time, 'end_time');
  if (normalizedStartTime >= normalizedEndTime) {
    throw new AppError('start_time phải nhỏ hơn end_time', 400);
  }

  return {
    day_of_week: String(day_of_week).trim(),
    start_time: normalizedStartTime,
    end_time: normalizedEndTime,
  };
};

module.exports = {
  parseCreateClassInput,
  parseUpdateClassInput,
};
