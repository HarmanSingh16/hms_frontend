import { apiClient } from './client';
import {
  APIResponse,
  DoctorProfile,
  DoctorScheduleResponse,
  DoctorAvailableSlotsResponse,
  UpdateOfficeHoursPreviewResponse,
  WeekdaySchedule,
  TimeOffResponse,
  InviteDoctorPayload,
  InviteDoctorResponse,
} from '../types/api';

export const doctorsApi = {
  list: async (departmentId?: number): Promise<DoctorProfile[]> => {
    const params = new URLSearchParams();
    if (departmentId) params.append('department_id', departmentId.toString());

    const res = await apiClient.get<APIResponse<DoctorProfile[]>>(
      `/doctors?${params.toString()}`
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.error?.message || 'Failed to list doctors');
    }
    return res.data.data;
  },

  getSchedule: async (id: number): Promise<DoctorScheduleResponse> => {
    const res = await apiClient.get<APIResponse<DoctorScheduleResponse>>(
      `/doctors/${id}/schedule`
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.error?.message || 'Failed to fetch doctor schedule');
    }
    return res.data.data;
  },

  getAvailableSlots: async (
    id: number,
    date?: string
  ): Promise<DoctorAvailableSlotsResponse> => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);

    const res = await apiClient.get<APIResponse<DoctorAvailableSlotsResponse>>(
      `/doctors/${id}/available-slots?${params.toString()}`
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.error?.message || 'Failed to fetch available slots');
    }
    return res.data.data;
  },

  updateOfficeHours: async (
    id: number,
    schedules: WeekdaySchedule[],
    preview: boolean = false
  ): Promise<UpdateOfficeHoursPreviewResponse> => {
    const res = await apiClient.put<APIResponse<UpdateOfficeHoursPreviewResponse>>(
      `/doctors/${id}/office-hours?preview=${preview ? 'true' : 'false'}`,
      { schedules }
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.error?.message || 'Failed to update office hours');
    }
    return res.data.data;
  },

  bookTimeOff: async (
    id: number,
    payload: { starts_at: string; ends_at: string; reason?: string }
  ): Promise<TimeOffResponse> => {
    const res = await apiClient.post<APIResponse<TimeOffResponse>>(
      `/doctors/${id}/time-off`,
      payload
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.error?.message || 'Failed to book time off');
    }
    return res.data.data;
  },

  inviteDoctor: async (payload: InviteDoctorPayload): Promise<InviteDoctorResponse> => {
    const res = await apiClient.post<APIResponse<InviteDoctorResponse>>(
      '/admin/invites',
      {
        ...payload,
        role: 'doctor',
      }
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.error?.message || 'Failed to send doctor invite');
    }
    return res.data.data;
  },
};
