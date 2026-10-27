import { apiClient } from './client';
import {
  APIResponse,
  Patient,
  PaginatedPatientsResponse,
  PatientIntakePayload,
  UpdatePatientPayload,
} from '../types/api';

export const patientsApi = {
  registerIntake: async (payload: PatientIntakePayload): Promise<Patient> => {
    const res = await apiClient.post<APIResponse<{ patient: Patient }>>(
      '/receptionist/patients',
      payload
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.error?.message || 'Failed to register patient');
    }
    return res.data.data.patient;
  },

  search: async (
    query?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedPatientsResponse> => {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const res = await apiClient.get<APIResponse<PaginatedPatientsResponse>>(
      `/patients?${params.toString()}`
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.error?.message || 'Failed to search patients');
    }
    return res.data.data;
  },

  getById: async (id: number): Promise<Patient> => {
    const res = await apiClient.get<APIResponse<Patient>>(`/patients/${id}`);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.error?.message || 'Failed to get patient details');
    }
    return res.data.data;
  },

  update: async (id: number, payload: UpdatePatientPayload): Promise<Patient> => {
    const res = await apiClient.put<APIResponse<Patient>>(`/patients/${id}`, payload);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.error?.message || 'Failed to update patient');
    }
    return res.data.data;
  },
};
