const AppError = require('../helpers/appError');

const createAuthService = ({ authModel, bcrypt, jwtLib }) => {
  const register = async (payload) => {
    const existing = await authModel.findUserByPersonIdOrEmail(payload.person_id, payload.email);

    if (existing.length > 0) {
      const duplicate = existing[0];
      if (duplicate.person_id === payload.person_id) {
        throw new AppError('Mã số sinh viên/giảng viên đã tồn tại', 409);
      }
      throw new AppError('Email đã được sử dụng', 409);
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);
    try {
      await authModel.createUser({ ...payload, password: hashedPassword });
    } catch (error) {
      if (error && error.code === 'ER_DUP_ENTRY') {
        throw new AppError('Mã số sinh viên/giảng viên hoặc email đã tồn tại', 409);
      }
      throw error;
    }
  };

  const login = async (payload) => {
    const user = await authModel.findUserByIdentifier(payload.identifier);
    if (!user) {
      throw new AppError('Tài khoản không tồn tại', 401);
    }

    if (!user.password) {
      throw new AppError('Tài khoản chưa được thiết lập mật khẩu', 401);
    }

    const isValidPassword = await bcrypt.compare(payload.password, user.password);
    if (!isValidPassword) {
      throw new AppError('Mật khẩu không đúng', 401);
    }

    const stage = await authModel.getCurrentStage();

    if (user.role !== 'admin') {
      if (stage === 'create_class' && user.role === 'student') {
        throw new AppError('Hệ thống đang tạo lớp', 403, { stage, blocked: true });
      }
      if (stage === 'register_class' && user.role === 'teacher') {
        throw new AppError('Hệ thống đang đăng ký lớp', 403, { stage, blocked: true });
      }
      if (stage === 'lock_class') {
        throw new AppError('Hệ thống đang chuẩn bị thời khóa biểu', 403, { stage, blocked: true });
      }
    }

    const token = jwtLib.signAccessToken({
      person_id: user.person_id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    });

    return {
      token,
      user: {
        person_id: user.person_id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
      stage,
    };
  };

  return {
    register,
    login,
  };
};

module.exports = createAuthService;
