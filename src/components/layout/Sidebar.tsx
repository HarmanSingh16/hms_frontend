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
    <aside className="w-64 bg-[#faf7f2]/70 backdrop-blur-xs border-r border-[#dfdcd7] min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0">
      <div>
        <div className="px-3 mb-3 text-[11px] font-semibold text-[#204079] uppercase tracking-[0.18em]">
          Operations Portal
        </div>
        <nav className="space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-white text-[#204079] font-semibold border border-[#dfdcd7] shadow-xs'
                    : 'text-[#17223a]/80 hover:text-[#17223a] hover:bg-[#f0ebe1]/80'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={isActive ? 'text-[#204079]' : 'text-[#6c747f]'}>
                    {link.icon}
                  </span>
                  <span>{link.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-3.5 bg-[#f0ebe1]/70 rounded-xl border border-[#dfdcd7] text-xs text-[#6c747f]">
        <div className="flex items-center gap-1.5 font-semibold text-[#17223a] mb-1">
          <span className="w-2 h-2 rounded-full bg-[var(--accent-ok)] inline-block animate-pulse" />
          <Sliders className="w-3.5 h-3.5 text-[#204079]" /> System Live
        </div>
        <p className="text-[11px] text-[#6c747f] leading-relaxed">
          Slots locked to 15-minute intervals. Verified transactional guarantees.
        </p>
      </div>
    </aside>
  );
};
