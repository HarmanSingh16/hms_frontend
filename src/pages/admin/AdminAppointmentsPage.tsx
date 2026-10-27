import React, { useState, useEffect, useCallback } from 'react';
import { appointmentsApi } from '../../api/appointments';
import { departmentsApi } from '../../api/departments';
import { doctorsApi } from '../../api/doctors';
import {
  AppointmentDetailResponse,
  AppointmentStatus,
  Department,
  DoctorProfile,
} from '../../types/api';
import { formatTimeRange, formatDate } from '../../utils/date';
import { getStatusBadgeClass, getStatusLabel } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { HistoryModal } from '../../components/queue/HistoryModal';
import { CancelModal } from '../../components/queue/CancelModal';
import { SyncIndicator } from '../../components/common/SyncIndicator';
import { getErrorMessage } from '../../utils/errors';
import {
  Stethoscope,
  Building2,
  Ban,
  History,
  Loader2,
  AlertCircle,
  Filter,
} from 'lucide-react';

export const AdminAppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentDetailResponse[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);

  // Filter state
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [historyApptId, setHistoryApptId] = useState<number | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AppointmentDetailResponse | null>(null);

  // Fetch filter options
  useEffect(() => {
    departmentsApi.list().then(setDepartments).catch(console.error);
    doctorsApi.list().then(setDoctors).catch(console.error);
  }, []);

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await appointmentsApi.list({
        doctor_id: selectedDocId ? parseInt(selectedDocId) : undefined,
        status: selectedStatus ? (selectedStatus as AppointmentStatus) : undefined,
        page,
        limit: 20,
      });
      setAppointments(res.appointments);
      setTotalCount(res.total_count);
      setLastUpdated(new Date());
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load hospital appointments'));
    } finally {
      setIsLoading(false);
    }
  }, [selectedDocId, selectedStatus, page]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Actions
  const handleCheckIn = async (id: number) => {
    try {
      const updated = await appointmentsApi.checkIn(id);
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Failed to check in'));
    }
  };

  const handleComplete = async (id: number) => {
    try {
      const updated = await appointmentsApi.complete(id);
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Failed to complete visit'));
    }
  };

  const handleRevertNoShow = async (id: number) => {
    try {
      const updated = await appointmentsApi.revertNoShow(id);
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Failed to revert no-show'));
    }
  };

  const handleConfirmCancel = async (reason: string) => {
    if (!cancelTarget) return;
    const updated = await appointmentsApi.cancel(cancelTarget.id, { reason });
    setAppointments((prev) => prev.map((a) => (a.id === cancelTarget.id ? updated : a)));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Hospital Master Monitor</h1>
          <p className="text-xs text-slate-500 mt-1">
            Global oversight across all departments, clinical practitioners, and consultation lifecycles.
          </p>
        </div>

        <SyncIndicator
          onRefresh={fetchAppointments}
          isLoading={isLoading}
          lastUpdated={lastUpdated}
        />
      </div>

      {/* Filters Card */}
      <Card>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <Filter className="w-3.5 h-3.5 text-sky-600" /> Filters:
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-sky-200"
          >
            <option value="">All Statuses</option>
            <option value="booked">Booked</option>
            <option value="checked_in">Checked-In</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No-Show</option>
          </select>

          <select
            value={selectedDeptId}
            onChange={(e) => {
              setSelectedDeptId(e.target.value);
              setSelectedDocId('');
              setPage(1);
            }}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-sky-200"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>

          <select
            value={selectedDocId}
            onChange={(e) => {
              setSelectedDocId(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-sky-200"
          >
            <option value="">All Doctors</option>
            {doctors
              .filter((d) => !selectedDeptId || d.department_id === parseInt(selectedDeptId))
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.email.split('@')[0]} ({d.department_name})
                </option>
              ))}
          </select>
        </div>
      </Card>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Master Table */}
      <Card>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-sky-600 mb-2" />
            <p className="text-xs">Querying hospital appointment ledger...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-200">
            No appointments found for the specified filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] tracking-wider border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Doctor & Dept</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{formatDate(appt.starts_at)}</div>
                      <div className="text-[11px] text-slate-500">
                        {formatTimeRange(appt.starts_at, appt.ends_at)}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">
                        {appt.patient_first_name} {appt.patient_last_name}
                      </div>
                      <div className="text-[11px] text-slate-400">{appt.patient_email}</div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                        <span>{appt.doctor_email.split('@')[0]}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{appt.department_name || 'General'}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadgeClass(
                          appt.status
                        )}`}
                      >
                        {getStatusLabel(appt.status)}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                      {appt.status === 'booked' && (
                        <Button size="sm" variant="outline" onClick={() => handleCheckIn(appt.id)}>
                          Check In
                        </Button>
                      )}

                      {appt.status === 'checked_in' && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleComplete(appt.id)}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          Complete
                        </Button>
                      )}

                      {appt.status === 'no_show' && (
                        <Button
                          size="sm"
                          variant="warning"
                          onClick={() => handleRevertNoShow(appt.id)}
                        >
                          Revert
                        </Button>
                      )}

                      {(appt.status === 'booked' || appt.status === 'checked_in') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCancelTarget(appt)}
                          leftIcon={<Ban className="w-3 h-3 text-rose-500" />}
                        >
                          Cancel
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setHistoryApptId(appt.id)}
                        leftIcon={<History className="w-3.5 h-3.5 text-slate-400" />}
                      >
                        History
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalCount > 20 && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Showing page {page} of {Math.ceil(totalCount / 20)} ({totalCount} total)</span>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= Math.ceil(totalCount / 20)}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* History Modal */}
      <HistoryModal
        isOpen={!!historyApptId}
        appointmentId={historyApptId}
        onClose={() => setHistoryApptId(null)}
      />

      {/* Cancel Modal */}
      <CancelModal
        isOpen={!!cancelTarget}
        appointmentId={cancelTarget?.id || null}
        patientName={
          cancelTarget
            ? `${cancelTarget.patient_first_name} ${cancelTarget.patient_last_name}`
            : undefined
        }
        onClose={() => setCancelTarget(null)}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
};
