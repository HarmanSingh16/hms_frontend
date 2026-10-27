// Roles & Statuses
export type UserRole = 'admin' | 'doctor' | 'patient' | 'receptionist';
export type AccountStatus = 'invited' | 'active' | 'deactivated';
export type AppointmentStatus = 'booked' | 'checked_in' | 'completed' | 'cancelled' | 'no_show';

// Universal Response Envelopes
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
}

export interface APIError {
  code: string;
  message: string;
}

// Authentication
export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface MeResponse {
  id: number;
  email: string;
  role: UserRole;
}

export interface InviteVerificationResponse {
  email: string;
  role: UserRole;
}

// Department
export interface Department {
  id: number;
  name: string;
}

// Patient
export interface Patient {
  account_id: number;
  email: string;
  role: UserRole;
  status: AccountStatus;
  first_name: string;
  last_name: string;
  date_of_birth: string; // "YYYY-MM-DD"
  phone_number: string;
  gender?: string | null;
  address?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedPatientsResponse {
  patients: Patient[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface PatientIntakePayload {
  email: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  phone_number: string;
  gender?: string;
  address?: string;
}

export interface UpdatePatientPayload {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  phone_number: string;
  gender?: string;
  address?: string;
}

// Doctor & Schedule
export interface DoctorProfile {
  id: number;
  email: string;
  department_id?: number | null;
  department_name?: string | null;
  created_at: string;
}

export interface OfficeHourInterval {
  start_time: string; // "HH:MM"
  end_time: string;   // "HH:MM"
}

export interface WeekdaySchedule {
  weekday: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  intervals: OfficeHourInterval[];
}

export interface OfficeHourResponse {
  id: number;
  doctor_id: number;
  weekday: number;
  start_time: string;
  end_time: string;
}

export interface TimeOffResponse {
  id: number;
  doctor_id: number;
  starts_at: string;
  ends_at: string;
  reason: string;
}

export interface DoctorScheduleResponse {
  doctor_id: number;
  office_hours: OfficeHourResponse[];
  upcoming_time_off: TimeOffResponse[];
}

export interface Slot {
  starts_at: string;
  ends_at: string;
  is_walk_in_eligible: boolean;
}

export interface DoctorAvailableSlotsResponse {
  doctor_id: number;
  slots: Slot[];
}

export interface AffectedAppointment {
  id: number;
  patient_id: number;
  starts_at: string;
  ends_at: string;
}

export interface UpdateOfficeHoursPreviewResponse {
  conflicts_count: number;
  affected_appointments: AffectedAppointment[];
}

// Appointment
export interface AppointmentDetailResponse {
  id: number;
  doctor_id: number;
  doctor_email: string;
  department_id?: number | null;
  department_name?: string | null;
  patient_id: number;
  patient_email: string;
  patient_first_name?: string | null;
  patient_last_name?: string | null;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  cancellation_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedAppointmentsResponse {
  appointments: AppointmentDetailResponse[];
  total_count: number;
  page: number;
  limit: number;
}

export interface AppointmentStatusEventResponse {
  id: number;
  appointment_id: number;
  from_status?: AppointmentStatus | null;
  to_status: AppointmentStatus;
  changed_by?: number | null;
  changed_by_email?: string | null;
  reason?: string | null;
  created_at: string;
}

export interface BookAppointmentPayload {
  doctor_id: number;
  patient_id: number;
  starts_at: string;
}

export interface CancelAppointmentPayload {
  reason: string;
}

export interface InviteDoctorPayload {
  email: string;
  department_id: number;
  first_name?: string;
  last_name?: string;
}

export interface InviteDoctorResponse {
  message: string;
  invite_token?: string;
  expires_at?: string;
}
