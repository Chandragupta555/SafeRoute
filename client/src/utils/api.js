import axios from 'axios';

const api = axios.create({
  // Use absolute URL to avoid proxy issues during the demo
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // Only redirect if we aren't already on login to avoid loops
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
};

export const incidentsAPI = {
  // Fixed the param structure to match common backend expectations
  getByArea: (lat, lng, radius) =>
    api.get('/incidents/area', { params: { lat, lng, radius } }),
  create: (data) => api.post('/incidents', data),
};

export const sosAPI = {
  // CHANGED '/sos/trigger' to '/sos/send' to match your backend logs
  trigger: (data) => api.post('/sos/send', data),
  test: (data) => api.post('/sos/send', { ...data, isTest: true })
};

export const userAPI = {
  // MUST have /users/ prefix because of app.use('/api/users', userRoutes) in index.js
  updateContacts: (contactsArray) => api.put('/users/trusted-contacts', { contacts: contactsArray }),
  getProfile: () => api.get('/users/profile')
};

export default api;