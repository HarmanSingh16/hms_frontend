import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Clock,
  UserPlus,
  Users,
  CalendarDays,
  Stethoscope,
  Building2,
  CalendarCheck,
  User,
  Sliders,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { role } = useAuth();

  const getNavLinks = () => {
    switch (role) {
      case 'receptionist':
        return [
          {
            to: '/receptionist/queue',
            label: 'Front Desk Queue',
            icon: <Clock className="w-4 h-4" />,
          },
          {
            to: '/receptionist/patients/new',
            label: 'Register Patient',
            icon: <UserPlus className="w-4 h-4" />,
          },
          {
            to: '/receptionist/patients',
            label: 'Patient Directory',
            icon: <Users className="w-4 h-4" />,
          },
        ];

      case 'doctor':
        return [
          {
            to: '/doctor/queue',
            label: 'Waiting Room',
            icon: <Clock className="w-4 h-4" />,
          },
          {
            to: '/doctor/schedule',
            label: 'Office Hours & Leaves',
            icon: <CalendarDays className="w-4 h-4" />,
          },
          {
            to: '/doctor/appointments',
            label: 'All Consultations',
            icon: <CalendarCheck className="w-4 h-4" />,
          },
        ];

      case 'patient':
        return [
          {
            to: '/patient/appointments',
            label: 'My Appointments',
            icon: <CalendarCheck className="w-4 h-4" />,
          },
          {
            to: '/patient/profile',
            label: 'My Profile',
            icon: <User className="w-4 h-4" />,
          },
        ];

      case 'admin':
        return [
          {
            to: '/admin/departments',
            label: 'Departments',
            icon: <Building2 className="w-4 h-4" />,
          },
          {
            to: '/admin/appointments',
            label: 'Hospital Monitor',
            icon: <CalendarCheck className="w-4 h-4" />,
          },
          {
            to: '/admin/doctors',
            label: 'Doctor Schedules',
            icon: <Stethoscope className="w-4 h-4" />,
          },
        ];

      default:
        return [];
    }
  };

  const links = getNavLinks();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0">
      <div>
        <div className="px-3 mb-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Navigation
        </div>
        <nav className="space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sky-50 text-sky-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <span className="text-slate-500">{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700 mb-1">
          <Sliders className="w-3.5 h-3.5" /> System Status
        </div>
        <p className="text-[11px] text-slate-600">
          Connected to backend API. Slots synchronized to 15-minute granularity.
        </p>
      </div>
    </aside>
  );
};
