import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8000/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const courses   = { list: () => api.get('/courses/'), create: d => api.post('/courses/', d), update: (id,d) => api.put(`/courses/${id}/`, d), remove: id => api.delete(`/courses/${id}/`) };
export const lecturers = { list: () => api.get('/lecturers/'), create: d => api.post('/lecturers/', d), update: (id,d) => api.put(`/lecturers/${id}/`, d), remove: id => api.delete(`/lecturers/${id}/`) };
export const venues    = { list: () => api.get('/venues/'), create: d => api.post('/venues/', d), update: (id,d) => api.put(`/venues/${id}/`, d), remove: id => api.delete(`/venues/${id}/`) };
export const groups    = { list: () => api.get('/groups/'), create: d => api.post('/groups/', d), update: (id,d) => api.put(`/groups/${id}/`, d), remove: id => api.delete(`/groups/${id}/`) };
export const timeslots = { list: () => api.get('/timeslots/'), create: d => api.post('/timeslots/', d), remove: id => api.delete(`/timeslots/${id}/`) };
export const slots = {
  list: (params) => api.get('/slots/', { params }),
  create: d => api.post('/slots/', d),
  update: (id,d) => api.put(`/slots/${id}/`, d),
  remove: id => api.delete(`/slots/${id}/`),
  exportPdf: (params) => api.get('/slots/export-pdf/', { params, responseType: 'blob' }),
};
