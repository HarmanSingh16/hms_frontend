import { apiClient } from './client';
import {
  APIResponse,
  TokenPair,
  MeResponse,
  InviteVerificationResponse,
} from '../types/api';

export const authApi = {
  login: async (email: string, password: string): Promise<TokenPair> => {
    const res = await apiClient.post<APIResponse<TokenPair>>('/auth/login', {
      email,
      password,
    });
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.error?.message || 'Login failed');
    }
    return res.data.data;
  },

  getCurrentUser: async (): Promise<MeResponse> => {
    const res = await apiClient.get<APIResponse<MeResponse>>('/auth/me');
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.error?.message || 'Failed to fetch current user');
    }
    return res.data.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post<APIResponse<{ message: string }>>('/auth/logout');
  },

  verifyInvite: async (token: string): Promise<InviteVerificationResponse> => {
    const res = await apiClient.get<APIResponse<InviteVerificationResponse>>(
      `/auth/invite/verify?token=${encodeURIComponent(token)}`
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.error?.message || 'Failed to verify invite token');
    }
    return res.data.data;
  },

  claimInvite: async (token: string, password: string): Promise<string> => {
    const res = await apiClient.post<APIResponse<{ message: string }>>('/auth/invite/claim', {
      token,
      password,
    });
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.error?.message || 'Failed to claim invite');
    }
    return res.data.data.message;
  },
};
