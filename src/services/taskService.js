import api, { crud } from './api.js';

const taskService = {
  ...crud('/tasks'),
  complete: (id) => api.patch(`/tasks/${id}/complete`).then((r) => r.data),
  pending: (id) => api.patch(`/tasks/${id}/pending`).then((r) => r.data),
};
export default taskService;
