const success = (res, data, message = 'OK', status = 200) => {
  return res.status(status).json({ message, data });
};

const fail = (res, message = 'Bad request', status = 400, details) => {
  const payload = { message };
  if (details) payload.details = details;
  return res.status(status).json(payload);
};

module.exports = { success, fail };
