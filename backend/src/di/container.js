const bcrypt = require('bcryptjs');
const jwtLib = require('../libs/jwt');

const authModel = require('../models/authModel');
const adminModel = require('../models/adminModel');
const teacherModel = require('../models/teacherModel');
const studentModel = require('../models/studentModel');

const createAuthService = require('../services/authService');
const createAdminService = require('../services/adminService');
const createTeacherService = require('../services/teacherService');
const createStudentService = require('../services/studentService');

const authService = createAuthService({ authModel, bcrypt, jwtLib });
const adminService = createAdminService({ adminModel });
const teacherService = createTeacherService({ teacherModel });
const studentService = createStudentService({ studentModel });

module.exports = {
  authService,
  adminService,
  teacherService,
  studentService,
};
