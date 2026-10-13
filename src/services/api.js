import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

/** Turns any Axios error into a friendly message for the UI. */
export function getErrorMessage(err) {
  if (err.response) {
    const data = err.response.data;
    if (data?.errors) return Object.values(data.errors).join('. ');
    if (data?.message) return data.message;
    return `Request failed (${err.response.status})`;
  }
  if (err.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
  return 'Cannot reach the server. Check that the backend is running and the API URL is correct.';
}

/** Builds list/get/create/update/remove functions for a REST resource. */
export function crud(path) {
  return {
    list: () => api.get(path).then((r) => r.data),
    get: (id) => api.get(`${path}/${id}`).then((r) => r.data),
    create: (data) => api.post(path, data).then((r) => r.data),
    update: (id, data) => api.put(`${path}/${id}`, data).then((r) => r.data),
    remove: (id) => api.delete(`${path}/${id}`).then((r) => r.data),
  };
}

export default api;
