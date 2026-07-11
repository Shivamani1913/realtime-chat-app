import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 8000,
});

export async function fetchHistory(room = 'general', { limit = 100, offset = 0 } = {}) {
  const { data } = await api.get('/api/messages', { params: { room, limit, offset } });
  return data;
}

export async function postMessage({ username, text, room = 'general' }) {
  const { data } = await api.post('/api/messages', { username, text, room });
  return data;
}

export default api;
