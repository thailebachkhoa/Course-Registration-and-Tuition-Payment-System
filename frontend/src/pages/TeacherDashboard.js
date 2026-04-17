// location: frontend/src/pages/TeacherDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { teacherAPI, courseAPI } from '../api';

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

const emptyForm = { course_code: '', day_of_week: 'Thứ 2', start_time: '07:00', end_time: '09:00' };

export default function TeacherDashboard() {
  const { user, stage, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('classes');
  const [classes, setClasses] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ text: '', type: '' });

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = create, else = class object
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const isBlocked = stage === 'register_class' || stage === 'lock_class';
  const blockedMsg =
    stage === 'register_class'
      ? 'Hệ thống đang đăng ký lớp'
      : 'Hệ thống đang chuẩn bị thời khóa biểu';

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: '', type: '' }), 3200);
  };

  const loadClasses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await teacherAPI.getClasses();
      setClasses(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const res = await teacherAPI.getSchedule();
      setSchedule(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCourses = useCallback(async () => {
    const res = await courseAPI.getAll();
    setCourses(res.data);
  }, []);

  useEffect(() => {
    if (isBlocked) return;
    if (activeTab === 'classes' && stage === 'create_class') {
      loadClasses();
      loadCourses();
    }
    if (activeTab === 'schedule' && stage === 'scheduled_class') {
      loadSchedule();
    }
  }, [activeTab, stage, isBlocked, loadClasses, loadCourses, loadSchedule]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (cls) => {
    setEditTarget(cls);
    setForm({
      course_code: cls.course_code,
      day_of_week: cls.day_of_week,
      start_time: cls.start_time?.substring(0, 5) || '07:00',
      end_time: cls.end_time?.substring(0, 5) || '09:00',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editTarget && !form.course_code) {
      showToast('❌ Vui lòng chọn môn học', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editTarget) {
        await teacherAPI.updateClass(editTarget.class_id, {
          day_of_week: form.day_of_week,
          start_time: form.start_time,
          end_time: form.end_time,
        });
        showToast('✅ Cập nhật lớp thành công');
      } else {
        await teacherAPI.createClass(form);
        showToast('✅ Tạo lớp thành công');
      }
      setShowModal(false);
      loadClasses();
    } catch (err) {
      showToast('❌ ' + (err.response?.data?.message || 'Lỗi'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cls) => {
    if (!window.confirm(`Xóa lớp #${cls.class_id} – ${cls.course_name}?`)) return;
    try {
      await teacherAPI.deleteClass(cls.class_id);
      showToast('✅ Đã xóa lớp');
      loadClasses();
    } catch {
      showToast('❌ Không thể xóa lớp', 'error');
    }
  };

  const t = (s) => s?.substring(0, 5) || '';

  // ---- BLOCKED SCREEN ----
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

        <h2 className="page-title">Dashboard Giảng viên</h2>

        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'classes' ? 'active' : ''}`}
            onClick={() => setActiveTab('classes')}
          >
            📚 Quản lý lớp học
          </button>
          <button
            className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveTab('schedule')}
          >
            📅 Lịch dạy
          </button>
        </div>

        {/* ==== TAB: CLASS MANAGEMENT ==== */}
        {activeTab === 'classes' && (
          stage !== 'create_class' ? (
            <div className="blocked-screen" style={{ minHeight: '300px' }}>
              <div className="blocked-icon">📋</div>
              <h2>Quản lý lớp học</h2>
              <p>Chỉ khả dụng trong giai đoạn <strong>Tạo lớp</strong>. Hệ thống hiện đang ở giai đoạn <strong>{stage}</strong>.</p>
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Danh sách lớp của tôi ({classes.length} lớp)</h3>
                <button className="btn btn-primary btn-sm" onClick={openCreate}>
                  + Tạo lớp mới
                </button>
              </div>

              {loading ? (
                <div className="loading">⏳ Đang tải...</div>
              ) : classes.length === 0 ? (
                <div className="empty-state">
                  <span>📚</span>
                  Bạn chưa tạo lớp nào.
                  <br />
                  <button className="btn btn-primary btn-sm" onClick={openCreate} style={{ marginTop: '12px' }}>
                    Tạo lớp đầu tiên
                  </button>
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
                        <th>Ngày học</th>
                        <th>Giờ học</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classes.map((cls) => (
                        <tr key={cls.class_id}>
                          <td>
                            <code style={{ background: '#f1f5f9', padding: '2px 7px', borderRadius: '5px', fontSize: '12px' }}>
                              #{cls.class_id}
                            </code>
                          </td>
                          <td><code>{cls.course_code}</code></td>
                          <td>{cls.course_name}</td>
                          <td>{cls.credits}</td>
                          <td style={{ fontSize: '12px', color: '#64748b' }}>{cls.department}</td>
                          <td>{cls.day_of_week}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>{t(cls.start_time)} – {t(cls.end_time)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button className="icon-btn" onClick={() => openEdit(cls)} title="Chỉnh sửa">✏️</button>
                              <button className="icon-btn danger" onClick={() => handleDelete(cls)} title="Xóa">🗑️</button>
                            </div>
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

        {/* ==== TAB: SCHEDULE ==== */}
        {activeTab === 'schedule' && (
          stage !== 'scheduled_class' ? (
            <div className="blocked-screen" style={{ minHeight: '300px' }}>
              <div className="blocked-icon">📅</div>
              <h2>Lịch dạy chưa khả dụng</h2>
              <p>Lịch dạy sẽ hiển thị khi hệ thống ở giai đoạn <strong>Thời khóa biểu</strong>.</p>
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Lịch dạy học kỳ này</h3>
              </div>

              {loading ? (
                <div className="loading">⏳ Đang tải...</div>
              ) : schedule.length === 0 ? (
                <div className="empty-state">
                  <span>📅</span>
                  Không có lớp nào trong lịch dạy
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
                        <th>Ngày học</th>
                        <th>Giờ học</th>
                        <th>SV đã đóng tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.map((cls) => (
                        <tr key={cls.class_id}>
                          <td><code>#{cls.class_id}</code></td>
                          <td><code>{cls.course_code}</code></td>
                          <td>{cls.course_name}</td>
                          <td>{cls.credits}</td>
                          <td>{cls.day_of_week}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>{t(cls.start_time)} – {t(cls.end_time)}</td>
                          <td>
                            <span className="badge badge-payed">{cls.payed_count} SV</span>
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
      </div>

      {/* ==== MODAL: CREATE / EDIT ==== */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editTarget ? '✏️ Chỉnh sửa lớp học' : '➕ Tạo lớp học mới'}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {!editTarget ? (
              <div className="form-group">
                <label>Môn học *</label>
                <select
                  value={form.course_code}
                  onChange={(e) => setForm({ ...form, course_code: e.target.value })}
                >
                  <option value="">-- Chọn môn học --</option>
                  {courses.map((c) => (
                    <option key={c.course_code} value={c.course_code}>
                      {c.course_code} – {c.course_name} ({c.credits} TC, {c.department})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="alert alert-info" style={{ marginBottom: '16px' }}>
                📚 <strong>{editTarget.course_code}</strong> – {editTarget.course_name} ({editTarget.credits} TC)
                <br />
                <small style={{ opacity: 0.7 }}>Mã môn học không thể thay đổi</small>
              </div>
            )}

            <div className="form-group">
              <label>Ngày học *</label>
              <select value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}>
                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>Giờ bắt đầu *</label>
                <input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Giờ kết thúc *</label>
                <input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSave}
                disabled={saving}
                style={{ width: 'auto' }}
              >
                {saving ? '⏳ Đang lưu...' : editTarget ? '💾 Lưu thay đổi' : '➕ Tạo lớp'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Navbar({ user, logout }) {
  return (
    <nav className="navbar">
      <span className="navbar-brand">🎓 Hệ thống Đăng ký Học phần</span>
      <div className="navbar-user">
        <span className="user-badge">👤 {user?.full_name}</span>
        <span className="badge role-teacher">Giảng viên</span>
        <button className="btn btn-secondary btn-sm" onClick={logout}>Đăng xuất</button>
      </div>
    </nav>
  );
}