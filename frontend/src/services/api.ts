import axios from 'axios';
import type {
  User,
  Company,
  Contact,
  CompanyAssignment,
  ActivityLog,
  Pagination,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 認証API
export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get<{ user: User }>('/auth/me'),
};

// 顧客API
export const companyApi = {
  getCompanies: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get<{ companies: Company[]; pagination: Pagination }>('/companies', { params }),
  getCompany: (id: number) =>
    api.get<{
      company: Company;
      assignments: CompanyAssignment[];
      contacts: Contact[];
    }>(`/companies/${id}`),
  createCompany: (data: Partial<Company>) => api.post('/companies', data),
  updateCompany: (id: number, data: Partial<Company>) =>
    api.put(`/companies/${id}`, data),
  deleteCompany: (id: number) => api.delete(`/companies/${id}`),
};

// 取引先担当者API
export const contactApi = {
  getContacts: (companyId: number) =>
    api.get<{ contacts: Contact[] }>(`/contacts/company/${companyId}`),
  getContact: (id: number) => api.get<{ contact: Contact }>(`/contacts/${id}`),
  createContact: (companyId: number, data: Partial<Contact>) =>
    api.post(`/contacts/company/${companyId}`, data),
  updateContact: (id: number, data: Partial<Contact>) =>
    api.put(`/contacts/${id}`, data),
  deleteContact: (id: number) => api.delete(`/contacts/${id}`),
  assignUser: (companyId: number, data: { userId: number; isPrimary: boolean; notes?: string }) =>
    api.post(`/contacts/company/${companyId}/assign`, data),
  unassignUser: (assignmentId: number) =>
    api.delete(`/contacts/assignment/${assignmentId}`),
};

// 活動履歴API
export const activityApi = {
  getActivitiesByCompany: (companyId: number, params?: { page?: number; limit?: number }) =>
    api.get<{ activities: ActivityLog[]; pagination: Pagination }>(
      `/activities/company/${companyId}`,
      { params }
    ),
  getNextActions: (params?: { days?: number; overdue?: boolean }) =>
    api.get<{ activities: ActivityLog[] }>('/activities/next-actions', { params }),
  getActivity: (id: number) =>
    api.get<{ activity: ActivityLog }>(`/activities/${id}`),
  createActivity: (data: Partial<ActivityLog> & { companyId: number }) =>
    api.post('/activities', data),
  updateActivity: (id: number, data: Partial<ActivityLog>) =>
    api.put(`/activities/${id}`, data),
  deleteActivity: (id: number) => api.delete(`/activities/${id}`),
};

// ユーザーAPI
export const userApi = {
  getUsers: (params?: { active_only?: boolean }) =>
    api.get<{ users: User[] }>('/users', { params }),
  getUser: (id: number) => api.get<{ user: User }>(`/users/${id}`),
  createUser: (data: { username: string; password: string; name: string; email?: string; role?: 'admin' | 'user' }) =>
    api.post('/users', data),
  updateUser: (id: number, data: Partial<User>) =>
    api.put(`/users/${id}`, data),
  changePassword: (id: number, data: { currentPassword?: string; newPassword: string }) =>
    api.post(`/users/${id}/change-password`, data),
  deleteUser: (id: number) => api.delete(`/users/${id}`),
};

export default api;
