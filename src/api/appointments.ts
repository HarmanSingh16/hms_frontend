import { apiClient } from './client';
import {
  APIResponse,
  AppointmentDetailResponse,
  PaginatedAppointmentsResponse,
  AppointmentStatusEventResponse,
  BookAppointmentPayload,
  CancelAppointmentPayload,
  AppointmentStatus,
} from '../types/api';

export interface AppointmentListParams {
  doctor_id?: number;
  patient_id?: number;
  status?: AppointmentStatus;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export const appointmentsApi = {
  book: async (payload: BookAppointmentPayload): Promise<AppointmentDetailResponse> => {
    const res = await apiClient.post<APIResponse<AppointmentDetailResponse>>(
      '/appointments',
      payload
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.error?.message || 'Failed to book appointment');
    }
    return res.data.data;
  },

  list: async (params?: AppointmentListParams): Promise<PaginatedAppointmentsResponse> => {
    const query = new URLSearchParams();
    if (params?.doctor_id) query.append('doctor_id', params.doctor_id.toString());
    if (params?.patient_id) query.append('patient_id', params.patient_id.toString());
    if (params?.status) query.append('status', params.status);
    if (params?.from) query.append('from', params.from);
    if (params?.to) query.append('to', params.to);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    const res = await apiClient.get<APIResponse<PaginatedAppointmentsResponse>>(
      `/appointments?${query.toString()}`
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.error?.message || 'Failed to list appointments');
    }
    return res.data.data;
  },

  getById: async (id: number): Promise<AppointmentDetailResponse> => {
    const res = await apiClient.get<APIResponse<AppointmentDetailResponse>>(
      `/appointments/${id}`
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.error?.message || 'Failed to fetch appointment details');
    }
    return res.data.data;
  },

  checkIn: async (id: number): Promise<AppointmentDetailResponse> => {
    const res = await apiClient.post<APIResponse<AppointmentDetailResponse>>(
      `/appointments/${id}/check-in`
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.error?.message || 'Failed to check in patient');
    }
    return res.data.data;
  },

  complete: async (id: number): Promise<AppointmentDetailResponse> => {
    const res = await apiClient.post<APIResponse<AppointmentDetailResponse>>(
      `/appointments/${id}/complete`
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.error?.message || 'Failed to complete appointment');
    }
    return res.data.data;
  },

  cancel: async (
    id: number,
    payload: CancelAppointmentPayload
  ): Promise<AppointmentDetailResponse> => {
    const res = await apiClient.post<APIResponse<AppointmentDetailResponse>>(
      `/appointments/${id}/cancel`,
      payload
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.error?.message || 'Failed to cancel appointment');
    }
    return res.data.data;
  },

  revertNoShow: async (id: number): Promise<AppointmentDetailResponse> => {
    const res = await apiClient.post<APIResponse<AppointmentDetailResponse>>(
      `/appointments/${id}/revert-no-show`
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.error?.message || 'Failed to revert no-show');
    }
    return res.data.data;
  },

  getHistory: async (id: number): Promise<AppointmentStatusEventResponse[]> => {
    const res = await apiClient.get<APIResponse<AppointmentStatusEventResponse[]>>(
      `/appointments/${id}/history`
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.error?.message || 'Failed to fetch appointment history');
    }
    return res.data.data;
  },
};
