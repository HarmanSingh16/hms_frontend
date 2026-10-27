import React, { useState, useEffect, useCallback } from 'react';
import { appointmentsApi } from '../../api/appointments';
import { AppointmentDetailResponse } from '../../types/api';
import { formatTimeRange, getTodayDateString } from '../../utils/date';
import { getStatusBadgeClass, getStatusLabel } from '../../utils/formatters';
import { SyncIndicator } from '../../components/common/SyncIndicator';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { HistoryModal } from '../../components/queue/HistoryModal';
import { CancelModal } from '../../components/queue/CancelModal';
import { BookingWizardModal } from '../../components/booking/BookingWizardModal';
import { getErrorMessage } from '../../utils/errors';
import {
  UserCheck,
  Ban,
  RotateCcw,
  History,
  Plus,
  Loader2,
  Stethoscope,
  Building2,
  AlertCircle,
} from 'lucide-react';

type QueueTab = 'all' | 'booked' | 'checked_in' | 'no_show' | 'resolved';

export const ReceptionistQueuePage: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentDetailResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<QueueTab>('all');
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [historyApptId, setHistoryApptId] = useState<number | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AppointmentDetailResponse | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const fetchQueue = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const today = getTodayDateString();
      const from = `${today}T00:00:00Z`;
      const to = `${today}T23:59:59Z`;

      const res = await appointmentsApi.list({
        from,
        to,
        limit: 100,
      });
      setAppointments(res.appointments);
      setLastUpdated(new Date());
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to fetch appointments queue.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Actions
  const handleCheckIn = async (id: number) => {
    try {
      const updated = await appointmentsApi.checkIn(id);
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Failed to check in patient'));
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

  // Filter appointments
  const filteredAppointments = appointments.filter((appt) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'booked') return appt.status === 'booked';
    if (activeTab === 'checked_in') return appt.status === 'checked_in';
    if (activeTab === 'no_show') return appt.status === 'no_show';
    if (activeTab === 'resolved')
      return appt.status === 'completed' || appt.status === 'cancelled';
    return true;
  });

  // Today stats
  const bookedCount = appointments.filter((a) => a.status === 'booked').length;
  const waitingCount = appointments.filter((a) => a.status === 'checked_in').length;
  const noShowCount = appointments.filter((a) => a.status === 'no_show').length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Front Desk Queue</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time reception operations: arrival check-ins, no-show overrides, and walk-in scheduling.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <SyncIndicator
            onRefresh={fetchQueue}
            isLoading={isLoading}
            lastUpdated={lastUpdated}
          />
          <Button
            size="sm"
            onClick={() => setIsBookingOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Booking
          </Button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            Arriving (Booked)
          </span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{bookedCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
            Waiting in Clinic
          </span>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{waitingCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
            Missed / No-Show
          </span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{noShowCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
            Completed Today
          </span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{completedCount}</div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <Card>
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'all'
                ? 'bg-sky-600 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Today ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab('booked')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'booked'
                ? 'bg-sky-600 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Arriving ({bookedCount})
          </button>
          <button
            onClick={() => setActiveTab('checked_in')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'checked_in'
                ? 'bg-sky-600 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Waiting Room ({waitingCount})
          </button>
          <button
            onClick={() => setActiveTab('no_show')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'no_show'
                ? 'bg-sky-600 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            No-Show ({noShowCount})
          </button>
          <button
            onClick={() => setActiveTab('resolved')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'resolved'
                ? 'bg-sky-600 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Completed & Cancelled
          </button>
        </div>

        {/* Appointment Table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-sky-600 mb-2" />
            <p className="text-xs">Loading queue...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-200">
            No appointments found in this view for today.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] tracking-wider border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">Time Slot</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Doctor & Dept</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Desk Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Time */}
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {formatTimeRange(appt.starts_at, appt.ends_at)}
                    </td>

                    {/* Patient */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">
                        {appt.patient_first_name} {appt.patient_last_name}
                      </div>
                      <div className="text-[11px] text-slate-500">{appt.patient_email}</div>
                    </td>

                    {/* Doctor */}
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

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(
                          appt.status
                        )}`}
                      >
                        {getStatusLabel(appt.status)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                      {appt.status === 'booked' && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleCheckIn(appt.id)}
                          leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          Check In
                        </Button>
                      )}

                      {appt.status === 'no_show' && (
                        <Button
                          size="sm"
                          variant="warning"
                          onClick={() => handleRevertNoShow(appt.id)}
                          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                        >
                          Revert No-Show
                        </Button>
                      )}

                      {(appt.status === 'booked' || appt.status === 'checked_in') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCancelTarget(appt)}
                          leftIcon={<Ban className="w-3.5 h-3.5 text-rose-500" />}
                          className="hover:text-rose-600 hover:border-rose-200"
                        >
                          Cancel
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setHistoryApptId(appt.id)}
                        leftIcon={<History className="w-3.5 h-3.5 text-slate-400" />}
                        title="View Audit Trail"
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

      {/* Booking Wizard */}
      <BookingWizardModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onSuccess={() => {
          fetchQueue();
        }}
      />
    </div>
  );
};
