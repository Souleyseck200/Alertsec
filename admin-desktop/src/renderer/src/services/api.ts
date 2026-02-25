import axios from 'axios';

export const BASE_URL = 'http://localhost:3000/api';
export const MEDIA_ROOT = 'http://localhost:3000';

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (credentials: any) => {
    const res = await api.post('/auth/login', credentials);
    if (res.data.user.role !== 'ADMIN') {
      throw new Error('Accès réservé aux administrateurs');
    }
    localStorage.setItem('admin_token', res.data.token);
    localStorage.setItem('admin_user', JSON.stringify(res.data.user));
    return res.data;
  },
  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  }
};

export const adminService = {
  forceAssign: async (signalementId: number, agentId: number) => {
    return api.patch('/admin/interventions/force-assign', { signalementId, agentId });
  },
  getPredictions: () => api.get('/admin/analytics/prediction'),
  getLogs: () => api.get('/admin/logs'),
  getStats: () => api.get('/admin/stats/dashboard'),
  
  // Gestion des Agents
  createAgent: (data: any) => api.post('/admin/agents/create', data),
  getAgents: () => api.get('/admin/agents'),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
  deleteAgent: (id: number) => api.delete(`/admin/agents/${id}`),
  updateAgent: (id: number, data: any) => api.patch(`/admin/agents/${id}`, data),
  setUserBlockStatus: (id: number, isBlocked: boolean) => api.patch(`/admin/users/${id}/block`, { isBlocked }),
  validateClearance: (id: number) => api.patch(`/admin/users/${id}/validate-clearance`),
  resetAgentPassword: (id: number) => api.patch(`/admin/agents/${id}/reset-password`),

  // Gestion des Zones
  getZones: () => api.get('/admin/zones'),
  createZone: (data: any) => api.post('/admin/zones', data),
  updateZone: (id: number, data: any) => api.patch(`/admin/zones/${id}`, data),
  deleteZone: (id: number) => api.delete(`/admin/zones-delete/${id}`),

  // Gestion des Signalements
  deleteSignalement: (id: number) => api.delete(`/signalements/admin-delete/${id}`),

  // Heatmap filtrée
  getHeatmap: (days?: number) => api.get(`/signalements/heatmap${days ? `?days=${days}` : ''}`),
};

export default api;
