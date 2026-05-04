const { studentService } = require('../di/container');
const asyncHandler = require('../helpers/asyncHandler');
const { parseCatalogFilter, parseEnrollInput } = require('../dto/studentDto');
const { parseClassIdParam } = require('../dto/commonDto');

const getCatalog = asyncHandler(async (req, res) => {
  const filters = parseCatalogFilter(req.query);
  const rows = await studentService.getCatalog(req.user.person_id, filters);
  res.json(rows);
});

const getEnrollments = asyncHandler(async (req, res) => {
  const rows = await studentService.getEnrollments(req.user.person_id);
  res.json(rows);
});

const getSchedule = asyncHandler(async (req, res) => {
  const payload = await studentService.getSchedule(req.user.person_id);
  res.json(payload);
});

const enroll = asyncHandler(async (req, res) => {
  const { class_id } = parseEnrollInput(req.body);
  await studentService.enroll(req.user.person_id, class_id);
  res.status(201).json({ message: 'Đăng ký thành công' });
});

const cancelEnroll = asyncHandler(async (req, res) => {
  const { classId } = parseClassIdParam(req.params);
  await studentService.cancelEnroll(req.user.person_id, classId);
  res.json({ message: 'Hủy đăng ký thành công' });
});

const getTuition = asyncHandler(async (req, res) => {
  const payload = await studentService.getTuition(req.user.person_id);
  res.json(payload);
});

const requestPayment = asyncHandler(async (req, res) => {
  await studentService.requestPayment(req.user.person_id);
  res.json({ message: 'Đã gửi xác nhận chuyển khoản cho Admin' });
});

const getDepartments = asyncHandler(async (req, res) => {
  const rows = await studentService.getDepartments();
  res.json(rows);
});

module.exports = {
  getCatalog,
  getEnrollments,
  getSchedule,
  enroll,
  cancelEnroll,
  getTuition,
  requestPayment,
  getDepartments,
};