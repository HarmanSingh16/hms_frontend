import { AppointmentStatus, UserRole, AccountStatus } from '../types/api';

export const getStatusBadgeClass = (status: AppointmentStatus): string => {
  switch (status) {
    case 'booked':
      return 'bg-[#e8edf5] text-[#204079] border-[#c8d7eb]';
    case 'checked_in':
      return 'bg-[#fef3eb] text-[#c95908] border-[#fcd5b8] font-medium';
    case 'completed':
      return 'bg-[#e8f5f0] text-[#1f6b4e] border-[#b8dfd0] font-medium';
    case 'cancelled':
      return 'bg-[#ede7dc] text-[#6c747f] border-[#dfdcd7]';
    case 'no_show':
      return 'bg-[#fcedea] text-[#ab2b1a] border-[#f7c2bb] font-medium';
    default:
      return 'bg-[#ede7dc] text-[#6c747f] border-[#dfdcd7]';
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
      return 'bg-[#e8f5f0] text-[#1f6b4e] border-[#b8dfd0]';
    case 'invited':
      return 'bg-[#f0eaf8] text-[#5e3592] border-[#dcceef]';
    case 'deactivated':
      return 'bg-[#fcedea] text-[#ab2b1a] border-[#f7c2bb]';
    default:
      return 'bg-[#ede7dc] text-[#6c747f] border-[#dfdcd7]';
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

export const formatDoctorName = (email?: string | null): string => {
  if (!email) return 'Doctor';
  const handle = email.includes('@') ? email.split('@')[0] : email;
  const cleanName = handle.replace(/^dr[._\s-]*/i, '').trim();
  if (!cleanName) return 'Doctor';

  const parts = cleanName.split(/[._\s-]+/).filter(Boolean);
  if (parts.length === 0) return 'Doctor';

  const formatted = parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
  return `Dr. ${formatted}`;
};

