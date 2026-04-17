import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../api';

const STAGES = [
  { key: 'create_class',    label: 'Tạo lớp',        icon: '📚', desc: 'GV tạo lớp học' },
  { key: 'register_class',  label: 'Đăng ký',         icon: '✍️',  desc: 'SV đăng ký môn' },
  { key: 'lock_class',      label: 'Khóa hệ thống',   icon: '🔒', desc: 'Xác nhận học phí' },
  { key: 'scheduled_class', label: 'Thời khóa biểu',  icon: '📅', desc: 'Mở xem TKB' },
];

export default function AdminDashboard() {
  const { user, stage, updateStage, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('stage');
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ text: '', type: '' });

  const stageIdx = STAGES.findIndex((s) => s.key === stage);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: '', type: '' }), 3500);
  };

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getPaymentRequests();
      setPaymentRequests(res.data);
    } catch {
      showToast('❌ Không thể tải danh sách', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'payment') loadPayments();
  }, [activeTab, loadPayments]);

  const handleNextStage = async () => {
    const next = STAGES[(stageIdx + 1) % STAGES.length];
    const isReset = stage === 'scheduled_class';
    const confirmMsg = isReset
      ? `⚠️ Chuyển sang học kỳ mới sẽ XÓA SẠCH tất cả lớp học và đăng ký hiện tại!\n\nBạn có chắc chắn?`
      : `Chuyển sang giai đoạn "${next.label}"?`;
    if (!window.confirm(confirmMsg)) return;
    try {
      const res = await adminAPI.nextStage();
      updateStage(res.data.stage);
      showToast(`✅ Đã chuyển sang: ${next.label}`);
    } catch {
      showToast('❌ Lỗi khi chuyển giai đoạn', 'error');
    }
  };

  const handleApprove = async (studentId, studentName) => {
    if (!window.confirm(`Xác nhận học phí cho sinh viên "${studentName}"?`)) return;
    try {
      await adminAPI.approvePayment(studentId);
      showToast(`✅ Đã xác nhận học phí cho ${studentName}`);
      loadPayments();
    } catch {
      showToast('❌ Lỗi khi xác nhận', 'error');
    }
  };

  const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n) + ' VND';
  const nextStage = STAGES[(stageIdx + 1) % STAGES.length];

  return (
    <div className="dashboard">
      <nav className="navbar">
        <span className="navbar-brand">🎓 Hệ thống Đăng ký Học phần</span>
        <div className="navbar-user">
          <span className="user-badge">👤 {user?.full_name}</span>
          <span className="badge role-admin">Admin</span>
          <button className="btn btn-secondary btn-sm" onClick={logout}>Đăng xuất</button>
        </div>
      </nav>

      <div className="main-content">
        {toast.text && (
          <div className={`alert alert-${toast.type === 'error' ? 'error' : 'success'}`}>
            {toast.text}
          </div>
        )}

        <h2 className="page-title">Bảng điều khiển Admin</h2>

        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'stage' ? 'active' : ''}`}
            onClick={() => setActiveTab('stage')}
          >
            ⚙️ Trạng thái hệ thống
          </button>
          <button
            className={`tab-btn ${activeTab === 'payment' ? 'active' : ''}`}
            onClick={() => setActiveTab('payment')}
          >
            💰 Xác nhận học phí
          </button>
        </div>

        {/* ===== TAB: STAGE ===== */}
        {activeTab === 'stage' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Giai đoạn hệ thống</h3>
            </div>

            {/* Stage track */}
            <div className="stage-track">
              {STAGES.map((s, idx) => (
                <React.Fragment key={s.key}>
                  <div className="stage-step">
                    <div className={`stage-circle ${idx === stageIdx ? 'active' : idx < stageIdx ? 'done' : ''}`}>
                      {s.icon}
                    </div>
                    <div className={`stage-name ${idx === stageIdx ? 'active' : idx < stageIdx ? 'done' : ''}`}>
                      {s.label}
                    </div>
                    <div className="stage-desc">{s.desc}</div>
                  </div>
                  {idx < STAGES.length - 1 && (
                    <div className={`stage-line ${idx < stageIdx ? 'done' : ''}`} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Current + next action */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
                padding: '18px 20px',
                background: '#f8fafc',
                borderRadius: '10px',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '5px', fontWeight: '600', textTransform: 'uppercase' }}>
                  Giai đoạn hiện tại
                </div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#6366f1' }}>
                  {STAGES[stageIdx]?.icon} {STAGES[stageIdx]?.label}
                </div>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleNextStage}
                style={{ width: 'auto', padding: '10px 22px' }}
              >
                Chuyển sang: {nextStage?.icon} {nextStage?.label} →
              </button>
            </div>

            {stage === 'scheduled_class' && (
              <div className="alert alert-warning" style={{ marginTop: '14px', marginBottom: 0 }}>
                ⚠️ Lần chuyển tiếp theo sẽ bắt đầu <strong>học kỳ mới</strong> và xóa toàn bộ lớp học & đăng ký cũ.
              </div>
            )}
          </div>
        )}

        {/* ===== TAB: PAYMENT ===== */}
        {activeTab === 'payment' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Danh sách yêu cầu xác nhận học phí</h3>
              <button className="btn btn-secondary btn-sm" onClick={loadPayments}>
                🔄 Tải lại
              </button>
            </div>

            {stage !== 'lock_class' && (
              <div className="alert alert-warning">
                ℹ️ Chức năng này thường dùng ở giai đoạn <strong>Khóa hệ thống</strong>. Hiện tại: <strong>{STAGES[stageIdx]?.label}</strong>.
              </div>
            )}

            {loading ? (
              <div className="loading">⏳ Đang tải...</div>
            ) : paymentRequests.length === 0 ? (
              <div className="empty-state">
                <span>💼</span>
                Chưa có yêu cầu xác nhận học phí nào
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Mã SV</th>
                      <th>Họ và tên</th>
                      <th>Số môn</th>
                      <th>Tổng học phí</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentRequests.map((req) => (
                      <tr key={req.person_id}>
                        <td>
                          <code style={{ background: '#f1f5f9', padding: '2px 7px', borderRadius: '5px', fontSize: '13px' }}>
                            {req.person_id}
                          </code>
                        </td>
                        <td>
                          <strong>{req.full_name}</strong>
                        </td>
                        <td>{req.class_count} môn</td>
                        <td style={{ color: '#6366f1', fontWeight: '700' }}>{fmt(req.total_amount)}</td>
                        <td>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleApprove(req.person_id, req.full_name)}
                          >
                            ✅ Xác nhận
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}