import { AppointmentStatus, UserRole, AccountStatus } from '../types/api';

export const getStatusBadgeClass = (status: AppointmentStatus): string => {
  switch (status) {
    case 'booked':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'checked_in':
      return 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse';
    case 'completed':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'cancelled':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    case 'no_show':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getStatusLabel = (status: AppointmentStatus): string => {
  switch (status) {
    case 'booked':
      return 'Booked (Arriving)';
    case 'checked_in':
      return 'Checked-In (Waiting)';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    case 'no_show':
      return 'No-Show';
    default:
      return status;
  }
};

export const getAccountStatusBadgeClass = (status: AccountStatus): string => {
  switch (status) {
    case 'active':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'invited':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'deactivated':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

export const getRoleLabel = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'doctor':
      return 'Doctor';
    case 'receptionist':
      return 'Receptionist';
    case 'patient':
      return 'Patient';
    default:
      return role;
  }
};

export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '-';
  const cleaned = ('' + phone).replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};
