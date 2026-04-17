// location: frontend/src/pages/LoginPage.js

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.login({ identifier, password });
      const { token, user, stage } = res.data;
      login(user, token, stage);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'teacher') navigate('/teacher');
      else navigate('/student');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại. Kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎓</div>
          <h1>Đăng nhập</h1>
          <p>Hệ thống Đăng ký Học phần & Thu học phí</p>
        </div>

        {error && (
          <div className="alert alert-error">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email hoặc Mã số SV/GV</label>
            <input
              type="text"
              placeholder="Nhập email hoặc mã số"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: '8px' }}
          >
            {loading ? '⏳ Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '22px', fontSize: '14px', color: '#64748b' }}>
          Chưa có tài khoản?{' '}
          <Link to="/register" className="link">Đăng ký ngay</Link>
        </p>

        <div className="hint-box">
          <strong>Tài khoản demo Admin:</strong><br />
          Email: <code>admin@school.edu.vn</code> | Pass: <code>admin123</code>
        </div>
      </div>
    </div>
  );
}