import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8000/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const courses   = { 
  list: () => api.get('/courses/'), 
  create: d => api.post('/courses/', d), 
  update: (id,d) => api.put(`/courses/${id}/`, d), 
  remove: id => api.delete(`/courses/${id}/`),
  import: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/courses/import/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  export: () => api.get('/courses/export/', { responseType: 'blob' }),
  validate: () => api.get('/courses/validation/'),
};
export const lecturers = { list: () => api.get('/lecturers/'), create: d => api.post('/lecturers/', d), update: (id,d) => api.put(`/lecturers/${id}/`, d), remove: id => api.delete(`/lecturers/${id}/`) };
export const students = {
  list: () => api.get('/students/'),
  create: (d) => api.post('/students/', d),
  import: (file, sendEmails = true) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('send_emails', sendEmails ? 'true' : 'false');
    return api.post('/students/import/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  update: (id, d) => {
    const payload = { ...d };
    if (!payload.password) {
      delete payload.password;
    }
    return api.patch(`/students/${id}/`, payload);
  },
  remove: (id) => api.delete(`/students/${id}/`),
};
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

export const publicationApi = {
  list: () => api.get('/publications/'),
  publish: (data) => api.post('/publications/publish/', data),
  archive: (id) => api.post(`/publications/${id}/archive/`),
};

export const academicStreamsApi = {
  list: () => api.get('/streams/'),
  get: (id) => api.get(`/streams/${id}/`),
  create: (data) => api.post('/streams/', data),
  update: (id, data) => api.put(`/streams/${id}/`, data),
  remove: (id) => api.delete(`/streams/${id}/`),
  import: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/streams/bulk_import/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  summary: () => api.get('/streams/summary/'),
};

export const academicLevelsApi = {
  list: (params) => api.get('/levels/', { params }),
  get: (id) => api.get(`/levels/${id}/`),
  create: (data) => api.post('/levels/', data),
  update: (id, data) => api.put(`/levels/${id}/`, data),
  remove: (id) => api.delete(`/levels/${id}/`),
};

export const academicPathwaysApi = {
  list: (params) => api.get('/pathways/', { params }),
  get: (id) => api.get(`/pathways/${id}/`),
  create: (data) => api.post('/pathways/', data),
  update: (id, data) => api.put(`/pathways/${id}/`, data),
  remove: (id) => api.delete(`/pathways/${id}/`),
};

export const practicalGroupsApi = {
  list: (params) => api.get('/practical-groups/', { params }),
  get: (id) => api.get(`/practical-groups/${id}/`),
  create: (data) => api.post('/practical-groups/', data),
  update: (id, data) => api.put(`/practical-groups/${id}/`, data),
  remove: (id) => api.delete(`/practical-groups/${id}/`),
};

export const analyticsApi = {
  dashboard: (params) => api.get('/analytics/', { params }),
};

export const lecturerApi = {
  me: () => api.get('/lecturer/me/'),
  updateMe: (data) => api.patch('/lecturer/me/', data),
  schedule: (params) => api.get('/lecturer/schedule/', { params }),
  requests: {
    list: () => api.get('/lecturer/requests/'),
    create: (data) => api.post('/lecturer/requests/', data),
  },
  notifications: () => api.get('/lecturer/notifications/'),
};

export const studentApi = {
  dashboard: (params) => api.get('/student/dashboard/', { params }),
  profile: {
    me: () => api.get('/student/profile/'),
    updateMe: (data) => api.patch('/student/profile/', data),
  },
};

export const systemSettingsApi = {
  get: () => api.get('/system-settings/'),
  update: (data) => api.put('/system-settings/', data),
  patch: (data) => api.patch('/system-settings/', data),
};

export const venueDefaultsApi = {
  list: (params) => api.get('/venue-defaults/', { params }),
  get: (id) => api.get(`/venue-defaults/${id}/`),
  create: (data) => api.post('/venue-defaults/', data),
  update: (id, data) => api.put(`/venue-defaults/${id}/`, data),
  patch: (id, data) => api.patch(`/venue-defaults/${id}/`, data),
  remove: (id) => api.delete(`/venue-defaults/${id}/`),
};
