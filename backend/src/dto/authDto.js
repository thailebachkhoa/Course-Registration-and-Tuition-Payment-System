const AppError = require('../helpers/appError');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toTrimmedString = (value) => {
  if (value === undefined || value === null) return '';
  return String(value).trim();
};

const toRawString = (value) => {
  if (value === undefined || value === null) return '';
  return String(value);
};

const parseRegisterInput = (body = {}) => {
  const { person_id, email, password, full_name, role } = body;

  const normalized = {
    person_id: toTrimmedString(person_id),
    email: toTrimmedString(email).toLowerCase(),
    password: toRawString(password),
    full_name: toTrimmedString(full_name),
    role: toTrimmedString(role).toLowerCase(),
  };

  if (!normalized.person_id || !normalized.email || !normalized.password || !normalized.full_name || !normalized.role) {
    throw new AppError('Thiếu thông tin bắt buộc', 400);
  }

  if (!EMAIL_REGEX.test(normalized.email)) {
    throw new AppError('Email không hợp lệ', 400);
  }

  if (normalized.password.length < 6) {
    throw new AppError('Mật khẩu phải có ít nhất 6 ký tự', 400);
  }

  if (!['teacher', 'student'].includes(normalized.role)) {
    throw new AppError('Role phải là teacher hoặc student', 400);
  }

  return normalized;
};

const parseLoginInput = (body = {}) => {
  const { identifier, password } = body;

  const normalizedIdentifier = toTrimmedString(identifier);
  const normalizedPassword = toRawString(password);

  if (!normalizedIdentifier || !normalizedPassword) {
    throw new AppError('Thiếu thông tin đăng nhập', 400);
  }

  const identifierValue = normalizedIdentifier.includes('@')
    ? normalizedIdentifier.toLowerCase()
    : normalizedIdentifier;

  return {
    identifier: identifierValue,
    password: normalizedPassword,
  };
};

module.exports = {
  parseRegisterInput,
  parseLoginInput,
};
