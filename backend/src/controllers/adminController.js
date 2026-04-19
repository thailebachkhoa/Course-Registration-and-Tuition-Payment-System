const { adminService } = require('../di/container');
const asyncHandler = require('../helpers/asyncHandler');
const { parseStudentIdParam } = require('../dto/commonDto');

const getStage = asyncHandler(async (req, res) => {
  const stage = await adminService.getStage();
  res.json({ stage });
});

const nextStage = asyncHandler(async (req, res) => {
  const stage = await adminService.nextStage();
  res.json({ stage, message: `Chuyển sang: ${stage}` });
});

const getPaymentRequests = asyncHandler(async (req, res) => {
  const rows = await adminService.getPaymentRequests();
  res.json(rows);
});

const approvePayment = asyncHandler(async (req, res) => {
  const { studentId } = parseStudentIdParam(req.params);
  await adminService.approvePayment(studentId);
  res.json({ message: 'Đã xác nhận học phí' });
});

module.exports = { getStage, nextStage, getPaymentRequests, approvePayment };