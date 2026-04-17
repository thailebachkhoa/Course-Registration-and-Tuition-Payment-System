// location: frontend/src/pages/RegisterPage.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api';

export default function RegisterPage() {
  const [form, setForm] = useState({
    person_id: '',
    email: '',
    password: '',
    full_name: '',
    role: 'student',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await authAPI.register(form);
      setSuccess('Đăng ký thành công! Đang chuyển đến trang đăng nhập...');
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại. Thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '44px', marginBottom: '10px' }}>📝</div>
          <h1>Tạo tài khoản</h1>
          <p>Đăng ký tài khoản sinh viên hoặc giảng viên</p>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}
        {success && <div className="alert alert-success">✅ {success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Vai trò</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="role"
                  value="student"
                  checked={form.role === 'student'}
                  onChange={handleChange}
                />
                🎓 Sinh viên
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="role"
                  value="teacher"
                  checked={form.role === 'teacher'}
                  onChange={handleChange}
                />
                👨‍🏫 Giảng viên
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Mã số {form.role === 'student' ? 'sinh viên' : 'giảng viên'}</label>
            <input
              type="text"
              name="person_id"
              placeholder={form.role === 'student' ? 'VD: SV001' : 'VD: GV001'}
              value={form.person_id}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Họ và tên đầy đủ</label>
            <input
              type="text"
              name="full_name"
              placeholder="Nguyễn Văn A"
              value={form.full_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="example@email.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              name="password"
              placeholder="Tối thiểu 6 ký tự"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: '8px' }}
          >
            {loading ? '⏳ Đang xử lý...' : 'Tạo tài khoản'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '22px', fontSize: '14px', color: '#64748b' }}>
          Đã có tài khoản?{' '}
          <Link to="/login" className="link">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}