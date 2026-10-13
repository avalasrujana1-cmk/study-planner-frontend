import api from './api.js';

const dashboardService = {
  summary: () => api.get('/dashboard/summary').then((r) => r.data),
  progress: () => api.get('/progress').then((r) => r.data),
  subjectProgress: () => api.get('/progress/subjects').then((r) => r.data),
  health: () => api.get('/health').then((r) => r.data),
};
export default dashboardService;
