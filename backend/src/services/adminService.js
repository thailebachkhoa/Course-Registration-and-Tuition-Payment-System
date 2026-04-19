const AppError = require('../helpers/appError');

const createAdminService = ({ adminModel }) => {
  const STAGES = ['create_class', 'register_class', 'lock_class', 'scheduled_class'];

  const ensureLockClassStage = async () => {
    const stage = await adminModel.getCurrentStage();
    if (stage !== 'lock_class') {
      throw new AppError('Hệ thống đang không ở giai đoạn khóa lớp', 403, { stage, blocked: true });
    }
    return stage;
  };

  const getStage = async () => {
    return adminModel.getCurrentStage();
  };

  const nextStage = async () => {
    const currentStage = await adminModel.getCurrentStage();
    const currentIndex = STAGES.indexOf(currentStage);
    if (currentIndex === -1) {
      throw new AppError('Giai đoạn hệ thống không hợp lệ', 500, { stage: currentStage });
    }
    const next = STAGES[(currentIndex + 1) % STAGES.length];

    await adminModel.updateStage(next);

    if (currentStage === 'scheduled_class' && next === 'create_class') {
      await adminModel.clearRegistrationData();
    }

    return next;
  };

  const getPaymentRequests = async () => {
    await ensureLockClassStage();
    return adminModel.getPaymentRequests();
  };

  const approvePayment = async (studentId) => {
    await ensureLockClassStage();
    const affectedRows = await adminModel.approvePayment(studentId);
    if (affectedRows === 0) {
      throw new AppError('Không tìm thấy yêu cầu học phí cần duyệt cho sinh viên này', 404);
    }
  };

  return {
    getStage,
    nextStage,
    getPaymentRequests,
    approvePayment,
  };
};

module.exports = createAdminService;
