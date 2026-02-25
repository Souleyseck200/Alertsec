import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your local machine IP (e.g., http://192.168.1.XX:3000/api)
export const BASE_URL = 'http://172.20.10.4:3000/api'; 
export const MEDIA_ROOT = 'http://172.20.10.4:3000/uploads/signalements';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('user_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.error('Error getting token from AsyncStorage', e);
  }
  return config;
});

export const authService = {
  login: async (credentials: any) => {
    const res = await api.post('/auth/login', credentials);
    const { token, user } = res.data;
    await AsyncStorage.setItem('user_token', token);
    await AsyncStorage.setItem('user_data', JSON.stringify(user));
    return res.data;
  },
  register: async (credentials: any) => {
    const res = await api.post('/auth/register', credentials);
    const { token, user } = res.data;
    await AsyncStorage.setItem('user_token', token);
    await AsyncStorage.setItem('user_data', JSON.stringify(user));
    return res.data;
  },
  logout: async () => {
    await AsyncStorage.removeItem('user_token');
    await AsyncStorage.removeItem('user_data');
  }
};

export const signalementService = {
  getHeatmap: (days?: number) => api.get(`/signalements/heatmap${days ? `?days=${days}` : ''}`),
  create: (formData: FormData) => api.post('/signalements', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const agentService = {
  getZones: () => api.get('/admin/zones'), // Mirroring admin-desktop access if needed locally
};

export const interventionService = {
  takeCharge: (signalementId: number) => api.post('/interventions/take-charge', { signalementId }),
  close: (interventionId: number, rapport: string) => api.patch(`/interventions/${interventionId}/close`, { rapport }),
  getRoute: (interventionId: number) => api.get(`/interventions/${interventionId}/route`),
};

export default api;
