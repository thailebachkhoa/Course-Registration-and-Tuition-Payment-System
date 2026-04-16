// location: backend/src/middleware/stageCheck.js
// Middleware kiểm tra giai đoạn hệ thống trước khi cho phép thực hiện action
const pool = require('../config/db');

/**
 * requireStage(...stages) — chỉ cho qua nếu current_stage nằm trong danh sách cho phép
 * Dùng trên từng route nếu cần kiểm soát chặt hơn phía controller
 */
const requireStage = (...allowedStages) => async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT current_stage FROM SystemState WHERE id = 1');
    const currentStage = rows[0]?.current_stage;
    if (!allowedStages.includes(currentStage)) {
      return res.status(403).json({
        message: `Hành động này không khả dụng ở giai đoạn hiện tại (${currentStage})`,
        current_stage: currentStage,
        allowed_stages: allowedStages,
      });
    }
    req.currentStage = currentStage;
    next();
  } catch (err) {
    console.error('stageCheck error:', err);
    return res.status(500).json({ message: 'Lỗi kiểm tra giai đoạn hệ thống' });
  }
};

module.exports = { requireStage };