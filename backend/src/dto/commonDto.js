const AppError = require('../helpers/appError');

const toPositiveInt = (value, fieldName) => {
  const normalized = Number(value);
  if (!Number.isInteger(normalized) || normalized <= 0) {
    throw new AppError(`${fieldName} không hợp lệ`, 400);
  }
  return normalized;
};

const parseClassIdParam = (params = {}) => {
  if (params.classId === undefined || params.classId === null || String(params.classId).trim() === '') {
    throw new AppError('Thiếu classId', 400);
  }

  return {
    ...params,
    classId: toPositiveInt(params.classId, 'classId'),
  };
};

const parseStudentIdParam = (params = {}) => {
  const studentId = params.studentId === undefined || params.studentId === null
    ? ''
    : String(params.studentId).trim();

  if (!studentId) {
    throw new AppError('Thiếu studentId', 400);
  }

  return {
    ...params,
    studentId,
  };
};

const parseCourseCodeParam = (params = {}) => {
  const code = params.code === undefined || params.code === null
    ? ''
    : String(params.code).trim();

  if (!code) {
    throw new AppError('Thiếu mã môn học', 400);
  }

  return {
    ...params,
    code,
  };
};

module.exports = {
  parseClassIdParam,
  parseStudentIdParam,
  parseCourseCodeParam,
};
