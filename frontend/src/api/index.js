// location: frontend/src/api/index.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
};

// Admin
export const adminAPI = {
  getStage: () => api.get('/admin/stage'),
  nextStage: () => api.post('/admin/stage/next'),
  getPaymentRequests: () => api.get('/admin/payment-requests'),
  approvePayment: (studentId) => api.post(`/admin/approve-payment/${studentId}`),
};

// Teacher
export const teacherAPI = {
  getClasses: () => api.get('/teacher/classes'),
  getSchedule: () => api.get('/teacher/schedule'),
  createClass: (data) => api.post('/teacher/classes', data),
  updateClass: (id, data) => api.put(`/teacher/classes/${id}`, data),
  deleteClass: (id) => api.delete(`/teacher/classes/${id}`),
};

// Courses
export const courseAPI = {
  getAll: () => api.get('/courses'),
  getByCode: (code) => api.get(`/courses/${code}`),
};

// Student
export const studentAPI = {
  getCatalog: (params) => api.get('/student/catalog', { params }),
  getEnrollments: () => api.get('/student/enrollments'),
  getSchedule: () => api.get('/student/schedule'),
  enroll: (class_id) => api.post('/student/enroll', { class_id }),
  cancelEnroll: (classId) => api.delete(`/student/enroll/${classId}`),
  getTuition: () => api.get('/student/tuition'),
  requestPayment: () => api.post('/student/request-payment'),
  getDepartments: () => api.get('/student/departments'),
};

export default api;