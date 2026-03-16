import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: (email, password) => api.post('/auth/login/', { email, password }),
  logout: (refresh) => api.post('/auth/logout/', { refresh }),
  getMe: () => api.get('/auth/me/'),
};

export const userService = {
  getUsers: () => api.get('/users/users/'),
  createUser: (data) => api.post('/users/users/', data),
  updateUser: (id, data) => api.put(`/users/users/${id}/`, data),
  deleteUser: (id) => api.delete(`/users/users/${id}/`),
  toggleUserStatus: (id) => api.post(`/users/users/${id}/toggle_status/`),
  resetPassword: (id, password) => api.post(`/users/users/${id}/reset_password/`, { password }),
};

export const roleService = {
  getRoles: () => api.get('/users/roles/'),
  createRole: (data) => api.post('/users/roles/', data),
  updateRole: (id, data) => api.patch(`/users/roles/${id}/`, data),
  getPermissions: () => api.get('/users/permissions/'),
};

export const logService = {
  getAccessLogs: () => api.get('/user-sessions/access-logs/'),
  getAuditLogs: () => api.get('/audit/'),
};

export const sessionService = {
  getSessions: () => api.get('/user-sessions/sessions/'),
  terminateSession: (id) => api.post(`/user-sessions/sessions/${id}/terminate/`),
};

export const hubService = {
  getHubs: () => api.get('/hubs/hubs/'),
  getHub: (id) => api.get(`/hubs/hubs/${id}/`),
  createHub: (data) => api.post('/hubs/hubs/', data),
  updateHub: (id, data) => api.patch(`/hubs/hubs/${id}/`, data),
  deleteHub: (id) => api.delete(`/hubs/hubs/${id}/`),

  getSKUs: () => api.get('/hubs/skus/'),
  createSKU: (data) => api.post('/hubs/skus/', data),

  getMappings: (hubId) => api.get(`/hubs/mappings/${hubId ? `?hub_id=${hubId}` : ''}`),
  createMapping: (data) => api.post('/hubs/mappings/', data),
  updateMapping: (id, data) => api.patch(`/hubs/mappings/${id}/`, data),
  uploadExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/hubs/hubs/upload-excel/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      transformRequest: [(data, headers) => {
        delete headers.common['Content-Type'];
        delete headers.post['Content-Type'];
        delete headers['Content-Type'];
        return data;
      }],
    });
  },
};

export const productService = {
  getProducts: () => api.get('/products/'),
  getProduct: (id) => api.get(`/products/${id}/`),
  createProduct: (data) => api.post('/products/', data),
  updateProduct: (id, data) => api.patch(`/products/${id}/`, data),
  deleteProduct: (id) => api.delete(`/products/${id}/`),
  uploadExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/products/upload-excel/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      transformRequest: [(data, headers) => {
        delete headers.common['Content-Type'];
        delete headers.post['Content-Type'];
        delete headers['Content-Type'];
        return data;
      }],
    });
  },
};

export const orderService = {
  getOrders: (params) => api.get('/orders/', { params }),
  getOrder: (id) => api.get(`/orders/${id}/`),
  createOrder: (data) => api.post('/orders/', data),
  updateOrder: (id, data) => api.patch(`/orders/${id}/`, data),
  deleteOrder: (id) => api.delete(`/orders/${id}/`),
  uploadExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/orders/upload-excel/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      transformRequest: [(data, headers) => {
        delete headers.common['Content-Type'];
        delete headers.post['Content-Type'];
        delete headers['Content-Type'];
        return data;
      }],
    });
  },
  updateStatus: (id, status, notes, extra = {}) => api.post(`/orders/${id}/update-status/`, { status, notes, ...extra }),
  sendEmailToCustomer: (id, data) => api.post(`/orders/${id}/send-email/`, data),
  getActivityLog: () => api.get('/orders/activity-log/'),
  getStats: () => api.get('/orders/stats/'),
};

export const commonService = {
  getDashboardStats: () => api.get('/common/stats/'),
};

export default api;
