const { authService } = require('../di/container');
const asyncHandler = require('../helpers/asyncHandler');
const { parseRegisterInput, parseLoginInput } = require('../dto/authDto');

const register = asyncHandler(async (req, res) => {
  const payload = parseRegisterInput(req.body);
  await authService.register(payload);
  return res.status(201).json({ message: 'Đăng ký thành công' });
});

const login = asyncHandler(async (req, res) => {
  const payload = parseLoginInput(req.body);
  const result = await authService.login(payload);
  return res.json(result);
});

module.exports = { register, login };