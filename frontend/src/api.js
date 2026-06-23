import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8000/api' });

// ── Authentication ───────────────────────────────────────────────────────────
export const auth = {
  login: (username, password) => api.post('/auth/login/', { username, password }),
  signup: (data) => api.post('/auth/signup/', data),
  logout: () => api.post('/auth/logout/'),
  getProfile: () => api.get('/auth/me/'),
};

// ── Resources (CRUD) ─────────────────────────────────────────────────────────
export const courses   = { list: () => api.get('/courses/'), create: d => api.post('/courses/', d), update: (id,d) => api.put(`/courses/${id}/`, d), remove: id => api.delete(`/courses/${id}/`) };
export const lecturers = { list: () => api.get('/lecturers/'), create: d => api.post('/lecturers/', d), update: (id,d) => api.put(`/lecturers/${id}/`, d), remove: id => api.delete(`/lecturers/${id}/`) };
export const venues    = { list: () => api.get('/venues/'), create: d => api.post('/venues/', d), update: (id,d) => api.put(`/venues/${id}/`, d), remove: id => api.delete(`/venues/${id}/`) };
export const groups    = { list: () => api.get('/groups/'), create: d => api.post('/groups/', d), update: (id,d) => api.put(`/groups/${id}/`, d), remove: id => api.delete(`/groups/${id}/`) };
export const timeslots = { list: () => api.get('/timeslots/'), create: d => api.post('/timeslots/', d), update: (id,d) => api.put(`/timeslots/${id}/`, d), remove: id => api.delete(`/timeslots/${id}/`) };

// ── Schedule & Timetable ─────────────────────────────────────────────────────
export const slots = {
  list: (params) => api.get('/slots/', { params }),
  create: d => api.post('/slots/', d),
  update: (id,d) => api.put(`/slots/${id}/`, d),
  remove: id => api.delete(`/slots/${id}/`),
  mySchedule: () => api.get('/slots/my_schedule/'),
  exportPdf: (params) => api.get('/slots/export-pdf/', { params, responseType: 'blob' }),
};

// ── Dashboard ────────────────────────────────────────────────────────────────
export const dashboard = {
  stats: () => api.get('/dashboard/stats/'),
  resourceSummary: () => api.get('/dashboard/resource-summary/'),
  recentActivity: () => api.get('/dashboard/recent-activity/'),
};

// ── Enrollments ──────────────────────────────────────────────────────────────
export const enrollments = {
  list: () => api.get('/enrollments/'),
  create: d => api.post('/enrollments/', d),
  update: (id,d) => api.put(`/enrollments/${id}/`, d),
  remove: id => api.delete(`/enrollments/${id}/`),
};

// ── Interceptor: Auto-add auth token ─────────────────────────────────────────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// ── Interceptor: Handle 401 errors ──────────────────────────────────────────
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
