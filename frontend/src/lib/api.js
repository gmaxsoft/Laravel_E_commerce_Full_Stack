import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://laravel-e-commerce.test/api');
const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL || 'http://laravel-e-commerce.test';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  user: () => api.get('/user'),
  updateProfile: (data) => api.put('/user', data),
  googleRedirect: () => window.location.href = `${BACKEND_BASE}/api/auth/google/redirect`,
};

// Products
export const productsApi = {
  list: (params) => api.get('/products', { params }),
  get: (id) => api.get(`/products/${id}`),
};

// Cart
export const cartApi = {
  get: () => api.get('/cart'),
  addItem: (productId, quantity) => api.post('/cart/items', { product_id: productId, quantity }),
  updateItem: (itemId, quantity) => api.put(`/cart/items/${itemId}`, { quantity }),
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}`),
  clear: () => api.delete('/cart'),
};

// Orders
export const ordersApi = {
  list: (params) => api.get('/orders', { params }),
  get: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  initiatePayment: (orderId, paymentMethod) =>
    api.post(`/orders/${orderId}/pay`, { payment_method: paymentMethod }),
};

// Coupons
export const couponsApi = {
  list: () => api.get('/coupons'),
  get: (code) => api.get(`/coupons/${code}`),
  validate: (code, amount) => api.post('/coupons/validate', { code, amount }),
};

export default api;
