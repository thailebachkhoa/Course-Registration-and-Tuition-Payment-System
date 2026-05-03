const { teacherService } = require('../di/container');
const asyncHandler = require('../helpers/asyncHandler');
const { parseCreateClassInput, parseUpdateClassInput } = require('../dto/teacherDto');
const { parseClassIdParam, parseCourseCodeParam } = require('../dto/commonDto');

const getMyClasses = asyncHandler(async (req, res) => {
  const rows = await teacherService.getMyClasses(req.user.person_id);
  res.json(rows);
});

const getSchedule = asyncHandler(async (req, res) => {
  const rows = await teacherService.getSchedule(req.user.person_id);
  res.json(rows);
});

const createClass = asyncHandler(async (req, res) => {
  const payload = parseCreateClassInput(req.body);
  const classId = await teacherService.createClass(req.user.person_id, payload);
  res.status(201).json({ message: 'Tạo lớp thành công', class_id: classId });
});

const updateClass = asyncHandler(async (req, res) => {
  const { classId } = parseClassIdParam(req.params);
  const payload = parseUpdateClassInput(req.body);
  await teacherService.updateClass(req.user.person_id, classId, payload);
  res.json({ message: 'Cập nhật thành công' });
});

const deleteClass = asyncHandler(async (req, res) => {
  const { classId } = parseClassIdParam(req.params);
  await teacherService.deleteClass(req.user.person_id, classId);
  res.json({ message: 'Xóa lớp thành công' });
});

const getCourses = asyncHandler(async (req, res) => {
  const rows = await teacherService.getCourses();
  res.json(rows);
});

const getCourseByCode = asyncHandler(async (req, res) => {
  const { code } = parseCourseCodeParam(req.params);
  const course = await teacherService.getCourseByCode(code);
  res.json(course);
});

module.exports = { getMyClasses, getSchedule, createClass, updateClass, deleteClass, getCourses, getCourseByCode };