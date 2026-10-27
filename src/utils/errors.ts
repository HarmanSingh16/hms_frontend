import axios from 'axios';
import { APIResponse } from '../types/api';

/**
 * Extracts a user-friendly error message from any backend API response or exception.
 * Prioritizes backend envelope errors: res.data.error.message.
 */
export const getErrorMessage = (error: unknown, fallback: string = 'An unexpected error occurred'): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as APIResponse<unknown> | Record<string, unknown> | string | undefined;

    // 1. Structured backend envelope: { success: false, error: { code: "...", message: "..." } }
    if (data && typeof data === 'object') {
      if ('error' in data && data.error && typeof data.error === 'object' && 'message' in data.error) {
        return String(data.error.message);
      }
      if ('message' in data && data.message) {
        return String(data.message);
      }
    }

    // 2. Plain text response (e.g., Gin 404 "404 page not found")
    if (typeof data === 'string' && data.trim()) {
      if (data.includes('404 page not found')) {
        return 'The requested endpoint or feature is not available on the server (404 Not Found).';
      }
      return data.trim();
    }

    // 3. Status-based human friendly fallbacks
    if (error.response?.status === 404) {
      return 'The requested resource or endpoint was not found on the server (404).';
    }
    if (error.response?.status === 403) {
      return 'Permission denied: your account is not authorized to perform this action (403).';
    }
    if (error.response?.status === 401) {
      return 'Invalid credentials or your session has expired. Please log in again (401).';
    }
    if (error.response?.status === 409) {
      return 'Conflict: this resource is already booked, claimed, or exists (409).';
    }
    if (error.response?.status === 422) {
      return 'Request failed business rule validation (422).';
    }
    if (error.response?.status === 500) {
      return 'Internal server error occurred on the backend (500). Please try again.';
    }

    // 4. Network error / no response
    if (error.request && !error.response) {
      return 'Unable to connect to the backend server. Please verify your internet or server status.';
    }
  }

  if (error instanceof Error) {
    if (error.message.includes('404 page not found')) {
      return 'The requested endpoint is not available on the server (404 Not Found).';
    }
    return error.message;
  }

  return fallback;
};
