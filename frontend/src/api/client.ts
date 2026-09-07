import axios from 'axios';

const BASE_URL = 'http://localhost:8000';

const api = axios.create({ baseURL: BASE_URL });

// Auth token injection
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const login = (username: string, password: string) =>
  api.post('/auth/login', { username, password });
export const getMe = () => api.get('/auth/me');

// Orders
export const getOrders = (params?: any) => api.get('/orders', { params });
export const createOrder = (data: any) => api.post('/orders', data);
export const updateOrder = (id: string, data: any) => api.put(`/orders/${id}`, data);
export const deleteOrder = (id: string) => api.delete(`/orders/${id}`);

// Products & Routings
export const getProducts = () => api.get('/products');
export const getRoutings = (productId?: string) => api.get('/routings', { params: productId ? { product_id: productId } : {} });
export const getProductRoutings = (id: string) => api.get(`/products/${id}/routings`);

// Resources
export const getMachines = () => api.get('/machines');
export const getOperators = () => api.get('/operators');
export const getSkills = () => api.get('/skills');
export const getTools = () => api.get('/tools');
export const getMaterials = () => api.get('/materials');
export const getMaintenance = () => api.get('/maintenance');
export const getChangeovers = () => api.get('/changeovers');

// Scheduler
export const generateSchedule = (data: any) => api.post('/schedule/generate', data);
export const getCurrentSchedule = (objective: string) => api.get('/schedule/current', { params: { objective } });
export const getAllSchedules = () => api.get('/schedule/all');
export const getScheduleAssignments = (id: string) => api.get(`/schedule/${id}/assignments`);
export const getGanttData = (id: string) => api.get(`/schedule/${id}/gantt`);
export const compareScenarios = (data: any) => api.post('/scenario/compare', data);
export const requestOverride = (data: any) => api.post('/schedule/override', data);
export const approveOverride = (id: number, action: string) => api.post(`/schedule/override/${id}/approve`, { action });
export const getOverrides = () => api.get('/overrides');

// Analytics
export const getMetrics = (objective?: string) => api.get('/metrics', { params: { objective } });
export const getErrors = (scheduleId?: string) => api.get('/errors', { params: scheduleId ? { schedule_id: scheduleId } : {} });
export const getBottlenecks = (scheduleId?: string) => api.get('/bottlenecks', { params: scheduleId ? { schedule_id: scheduleId } : {} });
export const getRecommendations = () => api.get('/recommendations');
export const getEnvironment = () => api.get('/environment');
export const getEthics = () => api.get('/ethics');
export const getMaintenanceImpact = () => api.get('/maintenance-impact');
export const getRequirementCoverage = () => api.get('/requirement-coverage');

// Audit
export const getAuditLog = (params?: any) => api.get('/audit', { params });

// Demo
export const runFullDemo = () => api.post('/demo/run-full');

// Health
export const getHealth = () => api.get('/health');

// Export
export const exportSchedule = (id: string) => `${BASE_URL}/export/schedule/${id}/csv`;
export const exportKPIs = () => `${BASE_URL}/export/kpis/csv`;

export default api;
