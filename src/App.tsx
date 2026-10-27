import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { RoleGuard } from './components/layout/RoleGuard';
import { MainLayout } from './components/layout/MainLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { ClaimInvitePage } from './pages/auth/ClaimInvitePage';

// Receptionist Pages
import { ReceptionistQueuePage } from './pages/receptionist/ReceptionistQueuePage';
import { PatientIntakePage } from './pages/receptionist/PatientIntakePage';
import { PatientDirectoryPage } from './pages/receptionist/PatientDirectoryPage';

// Doctor Pages
import { DoctorQueuePage } from './pages/doctor/DoctorQueuePage';
import { DoctorSchedulePage } from './pages/doctor/DoctorSchedulePage';
import { DoctorAppointmentsPage } from './pages/doctor/DoctorAppointmentsPage';

// Patient Pages
import { PatientAppointmentsPage } from './pages/patient/PatientAppointmentsPage';
import { PatientProfilePage } from './pages/patient/PatientProfilePage';

// Admin Pages
import { DepartmentManagementPage } from './pages/admin/DepartmentManagementPage';
import { AdminAppointmentsPage } from './pages/admin/AdminAppointmentsPage';
import { AdminDoctorSchedulePage } from './pages/admin/AdminDoctorSchedulePage';

const RootRedirect: React.FC = () => {
  const { role, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated || !role) return <Navigate to="/login" replace />;

  switch (role) {
    case 'receptionist':
      return <Navigate to="/receptionist/queue" replace />;
    case 'doctor':
      return <Navigate to="/doctor/queue" replace />;
    case 'patient':
      return <Navigate to="/patient/appointments" replace />;
    case 'admin':
      return <Navigate to="/admin/departments" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/claim-invite" element={<ClaimInvitePage />} />

      {/* Protected routes wrapped in MainLayout */}
      <Route element={<RoleGuard />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<RootRedirect />} />

          {/* Receptionist Portal */}
          <Route element={<RoleGuard allowedRoles={['receptionist']} />}>
            <Route path="/receptionist/queue" element={<ReceptionistQueuePage />} />
            <Route path="/receptionist/patients/new" element={<PatientIntakePage />} />
            <Route path="/receptionist/patients" element={<PatientDirectoryPage />} />
          </Route>

          {/* Doctor Portal */}
          <Route element={<RoleGuard allowedRoles={['doctor']} />}>
            <Route path="/doctor/queue" element={<DoctorQueuePage />} />
            <Route path="/doctor/schedule" element={<DoctorSchedulePage />} />
            <Route path="/doctor/appointments" element={<DoctorAppointmentsPage />} />
          </Route>

          {/* Patient Portal */}
          <Route element={<RoleGuard allowedRoles={['patient']} />}>
            <Route path="/patient/appointments" element={<PatientAppointmentsPage />} />
            <Route path="/patient/profile" element={<PatientProfilePage />} />
          </Route>

          {/* Admin Console */}
          <Route element={<RoleGuard allowedRoles={['admin']} />}>
            <Route path="/admin/departments" element={<DepartmentManagementPage />} />
            <Route path="/admin/appointments" element={<AdminAppointmentsPage />} />
            <Route path="/admin/doctors" element={<AdminDoctorSchedulePage />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
