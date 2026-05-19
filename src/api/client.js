import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({ baseURL: '/api/v1', timeout: 30000 })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.message || err.message || 'Something went wrong'
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    } else if (err.response?.status !== 404) {
      toast.error(msg)
    }
    return Promise.reject(err)
  }
)

export const authApi = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  register: (data) => api.post('/auth/register', data),
}

export const productApi = {
  list: (params) => api.get('/products', { params }),
  get: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  adjustStock: (id, data) => api.patch(`/products/${id}/stock`, data),
  lowStock: () => api.get('/products/low-stock'),
  categories: () => api.get('/products/categories'),
}

export const saleApi = {
  record: (data) => api.post('/sales', data),
  kpis: () => api.get('/sales/kpis'),
  topSellers: (limit = 10) => api.get(`/sales/top-sellers?limit=${limit}`),
  byChannel: () => api.get('/sales/by-channel'),
  categoryStats: () => api.get('/sales/category-stats'),
  monthlySales: (productId) => api.get(`/sales/history/${productId}/monthly`),
  byProduct: (productId, params) => api.get(`/sales/product/${productId}`, { params }),
}

export const dashboardApi = {
  summary: () => api.get('/dashboard/summary'),
}

export const predictionApi = {
  predict: (data) => api.post('/predictions/product', data),
  history: (productId) => api.get(`/predictions/product/${productId}/history`),
  alerts: () => api.get('/predictions/low-stock-alerts'),
  chat: (question, includeContext) =>
    api.post('/predictions/chat', { question, includeInventoryContext: includeContext }),
}

export default api
