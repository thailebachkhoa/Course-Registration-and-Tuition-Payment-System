const AppError = require('../helpers/appError');

const parseCatalogFilter = (query = {}) => {
  const { department, credits, course_code } = query;

  const filters = {};
  if (department) filters.department = String(department).trim();
  if (course_code) filters.course_code = String(course_code).trim();

  if (credits !== undefined && credits !== '') {
    const normalizedCredits = Number(credits);
    if (Number.isNaN(normalizedCredits)) {
      throw new AppError('credits phải là số', 400);
    }
    filters.credits = normalizedCredits;
  }

  return filters;
};

const parseEnrollInput = (body = {}) => {
  const { class_id } = body;

  if (!class_id) {
    throw new AppError('Thiếu class_id', 400);
  }

  const normalizedClassId = Number(class_id);
  if (Number.isNaN(normalizedClassId)) {
    throw new AppError('class_id không hợp lệ', 400);
  }

  return { class_id: normalizedClassId };
};

module.exports = {
  parseCatalogFilter,
  parseEnrollInput,
};
