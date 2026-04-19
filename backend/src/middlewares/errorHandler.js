const AppError = require('../helpers/appError');

const DB_CONNECTION_ERRORS = new Set([
  'ECONNREFUSED',
  'PROTOCOL_CONNECTION_LOST',
  'ER_ACCESS_DENIED_ERROR',
  'ER_BAD_DB_ERROR',
]);

const errorHandler = (err, req, res, next) => {
  // express.json/body-parser malformed payload should be 400, not 500.
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'JSON body khong hop le' });
  }

  if (err && DB_CONNECTION_ERRORS.has(err.code)) {
    console.error('Database connection error:', err.code);
    return res.status(503).json({ message: 'Khong the ket noi co so du lieu' });
  }

  if (err instanceof AppError) {
    const payload = { message: err.message };
    if (err.details && typeof err.details === 'object') {
      Object.assign(payload, err.details);
    }
    return res.status(err.statusCode).json(payload);
  }

  console.error(err);
  return res.status(500).json({ message: 'Lỗi server' });
};

module.exports = errorHandler;
