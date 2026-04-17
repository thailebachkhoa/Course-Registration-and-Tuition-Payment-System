// location: frontend/src/pages/StudentDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentAPI } from '../api';

export default function StudentDashboard() {
  const { user, stage, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('catalog');
  const [toast, setToast] = useState({ text: '', type: '' });

  // Data states
  const [catalog, setCatalog] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({ department: '', credits: '', course_code: '' });

  const [enrollments, setEnrollments] = useState([]);
  const [tuition, setTuition] = useState({ classes: [], total_amount: 0, total_credits: 0, payment_requested: false });
  const [scheduleData, setScheduleData] = useState({ classes: [], summary: {} });
  const [loading, setLoading] = useState(false);

  const isBlocked = stage === 'create_class' || stage === 'lock_class';
  const blockedMsg =
    stage === 'create_class'
      ? 'Hệ thống đang tạo lớp'
      : 'Hệ thống đang chuẩn bị thời khóa biểu';

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: '', type: '' }), 3200);
  };

  // Load departments once
  useEffect(() => {
    if (!isBlocked) {
      studentAPI.getDepartments().then((r) => setDepartments(r.data)).catch(() => {});
    }
  }, [isBlocked]);

  // Load data on tab switch
  useEffect(() => {
    if (isBlocked) return;
    if (activeTab === 'catalog' && stage === 'register_class') loadCatalog(filters);
    if (activeTab === 'saved'   && stage === 'register_class') loadEnrollments();
    if (activeTab === 'tuition' && stage === 'register_class') loadTuition();
    if (activeTab === 'schedule' && stage === 'scheduled_class') loadSchedule();
    // eslint-disable-next-line
  }, [activeTab, stage, isBlocked]);

  const loadCatalog = useCallback(async (f) => {
    setLoading(true);
    try {
      const params = {};
      if (f.department) params.department = f.department;
      if (f.credits)    params.credits    = f.credits;
      if (f.course_code) params.course_code = f.course_code;
      const res = await studentAPI.getCatalog(params);
      setCatalog(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEnrollments = async () => {
    setLoading(true);
    try {
      const res = await studentAPI.getEnrollments();
      setEnrollments(res.data);
    } finally {
      setLoading(false);
    }
  };

  const loadTuition = async () => {
    setLoading(true);
    try {
      const res = await studentAPI.getTuition();
      setTuition(res.data);
    } finally {
      setLoading(false);
    }
  };

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const res = await studentAPI.getSchedule();
      setScheduleData(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (classId) => {
    try {
      await studentAPI.enroll(classId);
      showToast('✅ Đăng ký thành công');
      loadCatalog(filters);
    } catch (err) {
      showToast('❌ ' + (err.response?.data?.message || 'Lỗi đăng ký'), 'error');
    }
  };

  const handleCancel = async (classId, courseName) => {
    if (!window.confirm(`Hủy đăng ký môn "${courseName}"?`)) return;
    try {
      await studentAPI.cancelEnroll(classId);
      showToast('✅ Hủy đăng ký thành công');
      loadEnrollments();
      loadCatalog(filters);
    } catch {
      showToast('❌ Lỗi hủy đăng ký', 'error');
    }
  };

  const handleRequestPayment = async () => {
    if (!window.confirm('Xác nhận bạn đã chuyển khoản học phí?')) return;
    try {
      await studentAPI.requestPayment();
      showToast('✅ Đã gửi xác nhận chuyển khoản cho Admin');
      loadTuition();
    } catch (err) {
      showToast('❌ ' + (err.response?.data?.message || 'Lỗi'), 'error');
    }
  };

  const handleFilterChange = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    loadCatalog(next);
  };

  const resetFilters = () => {
    const reset = { department: '', credits: '', course_code: '' };
    setFilters(reset);
    loadCatalog(reset);
  };

  const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n) + ' VND';
  const t   = (s) => s?.substring(0, 5) || '';

  // ---- BLOCKED ----
  if (isBlocked) {
    return (
      <div className="dashboard">
        <Navbar user={user} logout={logout} />
        <div className="main-content">
          <div className="blocked-screen">
            <div className="blocked-icon">🔒</div>
            <h2>{blockedMsg}</h2>
            <p>Vui lòng chờ quản trị viên chuyển sang giai đoạn tiếp theo.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Navbar user={user} logout={logout} />

      <div className="main-content">
        {toast.text && (
          <div className={`alert alert-${toast.type === 'error' ? 'error' : 'success'}`}>
            {toast.text}
          </div>
        )}

        <h2 className="page-title">Dashboard Sinh viên</h2>

        <div className="tabs">
          <button className={`tab-btn ${activeTab === 'catalog'  ? 'active' : ''}`} onClick={() => setActiveTab('catalog')}>
            📚 Danh sách lớp
          </button>
          <button className={`tab-btn ${activeTab === 'saved'    ? 'active' : ''}`} onClick={() => setActiveTab('saved')}>
            💾 Môn đã đăng ký
            {enrollments.length > 0 && (
              <span style={{ marginLeft: '6px', background: '#6366f1', color: 'white', borderRadius: '10px', padding: '1px 7px', fontSize: '11px' }}>
                {enrollments.length}
              </span>
            )}
          </button>
          <button className={`tab-btn ${activeTab === 'tuition'  ? 'active' : ''}`} onClick={() => setActiveTab('tuition')}>
            💰 Học phí
          </button>
          <button className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>
            📅 Thời khóa biểu
          </button>
        </div>

        {/* ==== COURSE CATALOG ==== */}
        {activeTab === 'catalog' && (
          stage !== 'register_class' ? (
            <NotAvailable icon="📚" title="Đăng ký môn học chưa mở" desc={`Tính năng này khả dụng ở giai đoạn Đăng ký. Hiện tại: ${stage}`} />
          ) : (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Danh sách lớp học ({catalog.length} lớp)</h3>
              </div>

              {/* Filter bar */}
              <div className="filter-bar">
                <div className="filter-group">
                  <label>Khoa / Ngành</label>
                  <select value={filters.department} onChange={(e) => handleFilterChange('department', e.target.value)}>
                    <option value="">Tất cả</option>
                    {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="filter-group">
                  <label>Số tín chỉ</label>
                  <select value={filters.credits} onChange={(e) => handleFilterChange('credits', e.target.value)}>
                    <option value="">Tất cả</option>
                    <option value="2">2 TC</option>
                    <option value="3">3 TC</option>
                    <option value="4">4 TC</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Tìm theo mã môn</label>
                  <input
                    type="text"
                    placeholder="VD: CS101, MATH..."
                    value={filters.course_code}
                    onChange={(e) => handleFilterChange('course_code', e.target.value)}
                  />
                </div>
                <button className="btn btn-secondary btn-sm" onClick={resetFilters}>
                  🔄 Xóa bộ lọc
                </button>
              </div>

              {loading ? (
                <div className="loading">⏳ Đang tải...</div>
              ) : catalog.length === 0 ? (
                <div className="empty-state">
                  <span>🔍</span>
                  Không tìm thấy lớp học phù hợp
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>ID Lớp</th>
                        <th>Mã MH</th>
                        <th>Tên môn học</th>
                        <th>TC</th>
                        <th>Khoa</th>
                        <th>Giảng viên</th>
                        <th>Ngày</th>
                        <th>Giờ học</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {catalog.map((cls) => (
                        <tr key={cls.class_id}>
                          <td><code style={{ fontSize: '12px' }}>#{cls.class_id}</code></td>
                          <td><code>{cls.course_code}</code></td>
                          <td>{cls.course_name}</td>
                          <td>{cls.credits}</td>
                          <td style={{ fontSize: '12px', color: '#64748b' }}>{cls.department}</td>
                          <td>{cls.teacher_name}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>{cls.day_of_week}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>{t(cls.start_time)} – {t(cls.end_time)}</td>
                          <td>
                            {cls.enrollment_status === 'enrolled' ? (
                              <span className="badge badge-enrolled">✓ Đã đăng ký</span>
                            ) : (
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => handleEnroll(cls.class_id)}
                              >
                                + Đăng ký
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        )}

        {/* ==== MY SAVED ==== */}
        {activeTab === 'saved' && (
          stage !== 'register_class' ? (
            <NotAvailable icon="💾" title="Môn đã đăng ký" desc="Chức năng này khả dụng ở giai đoạn Đăng ký lớp." />
          ) : (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Môn học đã đăng ký ({enrollments.length} môn)</h3>
                <button className="btn btn-secondary btn-sm" onClick={loadEnrollments}>🔄</button>
              </div>

              {loading ? (
                <div className="loading">⏳ Đang tải...</div>
              ) : enrollments.length === 0 ? (
                <div className="empty-state">
                  <span>💾</span>
                  Bạn chưa đăng ký môn nào. Vào tab <strong>Danh sách lớp</strong> để đăng ký.
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>ID Lớp</th>
                        <th>Mã MH</th>
                        <th>Tên môn học</th>
                        <th>TC</th>
                        <th>Giảng viên</th>
                        <th>Ngày</th>
                        <th>Giờ học</th>
                        <th>Trạng thái</th>
                        <th>Hủy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map((e) => (
                        <tr key={e.enrollment_id}>
                          <td><code style={{ fontSize: '12px' }}>#{e.class_id}</code></td>
                          <td><code>{e.course_code}</code></td>
                          <td>{e.course_name}</td>
                          <td>{e.credits}</td>
                          <td>{e.teacher_name}</td>
                          <td>{e.day_of_week}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>{t(e.start_time)} – {t(e.end_time)}</td>
                          <td>
                            <span className={`badge badge-${e.status}`}>
                              {e.status === 'enrolled' ? 'Đã đăng ký' : 'Đã nộp tiền'}
                            </span>
                          </td>
                          <td>
                            {e.status === 'enrolled' && (
                              <button
                                className="icon-btn danger"
                                onClick={() => handleCancel(e.class_id, e.course_name)}
                                title="Hủy đăng ký"
                              >
                                🗑️
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        )}

        {/* ==== TUITION ==== */}
        {activeTab === 'tuition' && (
          stage !== 'register_class' ? (
            <NotAvailable icon="💰" title="Học phí" desc="Chức năng học phí khả dụng ở giai đoạn Đăng ký lớp." />
          ) : (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Thông tin học phí</h3>
                <button className="btn btn-secondary btn-sm" onClick={loadTuition}>🔄</button>
              </div>

              {loading ? (
                <div className="loading">⏳ Đang tải...</div>
              ) : tuition.classes.length === 0 ? (
                <div className="empty-state">
                  <span>💰</span>
                  Không có môn nào cần thanh toán
                </div>
              ) : (
                <>
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>ID Lớp</th>
                          <th>Mã MH</th>
                          <th>Tên môn học</th>
                          <th>Số TC</th>
                          <th>Học phí môn</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tuition.classes.map((cls) => (
                          <tr key={cls.class_id}>
                            <td><code style={{ fontSize: '12px' }}>#{cls.class_id}</code></td>
                            <td><code>{cls.course_code}</code></td>
                            <td>{cls.course_name}</td>
                            <td>{cls.credits} TC</td>
                            <td style={{ color: '#475569' }}>{fmt(cls.credits * 600000)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="tuition-total-bar">
                    <div>
                      <div className="tuition-label">
                        {tuition.total_credits} tín chỉ × 600.000 VND
                      </div>
                      <div className="tuition-amount">{fmt(tuition.total_amount)}</div>
                    </div>
                    <div>
                      {tuition.payment_requested ? (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '28px' }}>⏳</div>
                          <div style={{ fontSize: '13px', marginTop: '4px', opacity: 0.9 }}>
                            Đang chờ Admin xác nhận
                          </div>
                        </div>
                      ) : (
                        <button
                          className="btn"
                          style={{
                            background: 'white',
                            color: '#6366f1',
                            fontWeight: '700',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          }}
                          onClick={handleRequestPayment}
                        >
                          ✅ Xác nhận đã chuyển khoản
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="hint-box" style={{ marginTop: '12px' }}>
                    💡 Sau khi xác nhận, Admin sẽ duyệt và chuyển trạng thái sang <strong>Đã nộp tiền</strong>.
                    Thời khóa biểu chỉ hiển thị các môn đã được xác nhận.
                  </div>
                </>
              )}
            </div>
          )
        )}

        {/* ==== SCHEDULE ==== */}
        {activeTab === 'schedule' && (
          stage !== 'scheduled_class' ? (
            <NotAvailable icon="📅" title="Thời khóa biểu chưa khả dụng" desc="Thời khóa biểu sẽ mở khi hệ thống ở giai đoạn Thời khóa biểu." />
          ) : (
            <>
              {scheduleData.summary && (
                <div className="summary-bar">
                  <div className="summary-card">
                    <div className="summary-label">Tổng môn học</div>
                    <div className="summary-value">
                      {scheduleData.summary.total_classes || 0}
                      <span className="summary-unit"> môn</span>
                    </div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-label">Tổng tín chỉ</div>
                    <div className="summary-value">
                      {scheduleData.summary.total_credits || 0}
                      <span className="summary-unit"> TC</span>
                    </div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-label">Tổng học phí</div>
                    <div className="summary-value" style={{ fontSize: '18px' }}>
                      {fmt((scheduleData.summary.total_credits || 0) * 600000)}
                    </div>
                  </div>
                </div>
              )}

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Thời khóa biểu (Môn đã xác nhận học phí)</h3>
                </div>

                {loading ? (
                  <div className="loading">⏳ Đang tải...</div>
                ) : !scheduleData.classes?.length ? (
                  <div className="empty-state">
                    <span>📅</span>
                    Không có môn học nào đã được xác nhận học phí
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>ID Lớp</th>
                          <th>Mã MH</th>
                          <th>Tên môn học</th>
                          <th>TC</th>
                          <th>Giảng viên</th>
                          <th>Ngày học</th>
                          <th>Giờ học</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scheduleData.classes.map((cls) => (
                          <tr key={cls.class_id}>
                            <td><code style={{ fontSize: '12px' }}>#{cls.class_id}</code></td>
                            <td><code>{cls.course_code}</code></td>
                            <td>{cls.course_name}</td>
                            <td>{cls.credits}</td>
                            <td>{cls.teacher_name}</td>
                            <td>{cls.day_of_week}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>{t(cls.start_time)} – {t(cls.end_time)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
}

function NotAvailable({ icon, title, desc }) {
  return (
    <div className="card">
      <div className="blocked-screen" style={{ minHeight: '280px' }}>
        <div className="blocked-icon">{icon}</div>
        <h2>{title}</h2>
        <p>{desc}</p>
      </div>
    </div>
  );
}

function Navbar({ user, logout }) {
  return (
    <nav className="navbar">
      <span className="navbar-brand">🎓 Hệ thống Đăng ký Học phần</span>
      <div className="navbar-user">
        <span className="user-badge">👤 {user?.full_name}</span>
        <span className="badge role-student">Sinh viên</span>
        <button className="btn btn-secondary btn-sm" onClick={logout}>Đăng xuất</button>
      </div>
    </nav>
  );
}