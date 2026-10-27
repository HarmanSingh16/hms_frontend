import { apiClient } from './client';
import { APIResponse, Department } from '../types/api';

export const departmentsApi = {
  list: async (): Promise<Department[]> => {
    const res = await apiClient.get<APIResponse<Department[]>>('/departments');
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.error?.message || 'Failed to list departments');
    }
    return res.data.data;
  },

  create: async (name: string): Promise<Department> => {
    const res = await apiClient.post<APIResponse<Department>>('/departments', { name });
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.error?.message || 'Failed to create department');
    }
    return res.data.data;
  },

  update: async (id: number, name: string): Promise<Department> => {
    const res = await apiClient.put<APIResponse<Department>>(`/departments/${id}`, { name });
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.error?.message || 'Failed to update department');
    }
    return res.data.data;
  },
};
