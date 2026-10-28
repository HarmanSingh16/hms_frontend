import React, { useState, useEffect, useCallback } from 'react';
import { appointmentsApi } from '../../api/appointments';
import { AppointmentDetailResponse } from '../../types/api';
import { formatTimeRange, getTodayDateString } from '../../utils/date';
import { getStatusBadgeClass, getStatusLabel, formatDoctorName } from '../../utils/formatters';
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
          <span className="eyebrow mb-1 block">Front Desk Administration</span>
          <h1 className="font-serif text-3xl font-semibold text-[#17223a] tracking-tight">
            Front Desk Queue
          </h1>
          <p className="text-xs sm:text-sm text-[#6c747f] mt-1 font-normal">
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white/95 p-4 rounded-xl border border-[#dfdcd7] shadow-2xs hover:border-[#204079]/30 transition-all">
          <span className="text-[11px] font-semibold text-[#204079] uppercase tracking-wider block">
            Arriving (Booked)
          </span>
          <div className="font-serif text-3xl font-semibold tabular-nums text-[#17223a] mt-1">
            {bookedCount}
          </div>
        </div>

        <div className="bg-white/95 p-4 rounded-xl border border-[#dfdcd7] shadow-2xs hover:border-[#c95908]/40 transition-all">
          <span className="text-[11px] font-semibold text-[#c95908] uppercase tracking-wider block">
            Waiting in Clinic
          </span>
          <div className="font-serif text-3xl font-semibold tabular-nums text-[#c95908] mt-1">
            {waitingCount}
          </div>
        </div>

        <div className="bg-white/95 p-4 rounded-xl border border-[#dfdcd7] shadow-2xs hover:border-[#ab2b1a]/40 transition-all">
          <span className="text-[11px] font-semibold text-[#ab2b1a] uppercase tracking-wider block">
            Missed / No-Show
          </span>
          <div className="font-serif text-3xl font-semibold tabular-nums text-[#17223a] mt-1">
            {noShowCount}
          </div>
        </div>

        <div className="bg-white/95 p-4 rounded-xl border border-[#dfdcd7] shadow-2xs hover:border-[#1f6b4e]/40 transition-all">
          <span className="text-[11px] font-semibold text-[#1f6b4e] uppercase tracking-wider block">
            Completed Today
          </span>
          <div className="font-serif text-3xl font-semibold tabular-nums text-[#17223a] mt-1">
            {completedCount}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-[#fcedea] border border-[#f7c2bb] rounded-xl text-[#ab2b1a] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <Card>
        <div className="flex items-center gap-1.5 bg-[#f0ebe1] p-1.5 rounded-xl border border-[#dfdcd7] mb-4 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#204079] text-[#faf6f0] font-semibold shadow-xs'
                : 'text-[#17223a] hover:bg-[#e6dfd1]'
            }`}
          >
            All Today ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab('booked')}
            className={`px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
              activeTab === 'booked'
                ? 'bg-[#204079] text-[#faf6f0] font-semibold shadow-xs'
                : 'text-[#17223a] hover:bg-[#e6dfd1]'
            }`}
          >
            Arriving ({bookedCount})
          </button>
          <button
            onClick={() => setActiveTab('checked_in')}
            className={`px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
              activeTab === 'checked_in'
                ? 'bg-[#204079] text-[#faf6f0] font-semibold shadow-xs'
                : 'text-[#17223a] hover:bg-[#e6dfd1]'
            }`}
          >
            Waiting Room ({waitingCount})
          </button>
          <button
            onClick={() => setActiveTab('no_show')}
            className={`px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
              activeTab === 'no_show'
                ? 'bg-[#204079] text-[#faf6f0] font-semibold shadow-xs'
                : 'text-[#17223a] hover:bg-[#e6dfd1]'
            }`}
          >
            No-Show ({noShowCount})
          </button>
          <button
            onClick={() => setActiveTab('resolved')}
            className={`px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
              activeTab === 'resolved'
                ? 'bg-[#204079] text-[#faf6f0] font-semibold shadow-xs'
                : 'text-[#17223a] hover:bg-[#e6dfd1]'
            }`}
          >
            Completed & Cancelled
          </button>
        </div>

        {/* Appointment Table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#6c747f]">
            <Loader2 className="w-8 h-8 animate-spin text-[#204079] mb-2" />
            <p className="text-xs">Loading queue...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-12 text-[#6c747f] text-xs bg-[#faf6f0] rounded-xl border border-dashed border-[#dfdcd7]">
            No appointments found in this view for today.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#17223a]">
              <thead className="bg-[#faf6f0] text-[#17223a] uppercase font-semibold text-[11px] tracking-wider border-y border-[#dfdcd7]">
                <tr>
                  <th className="py-3 px-4">Time Slot</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Doctor & Dept</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Desk Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dfdcd7]">
                {filteredAppointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-[#faf6f0]/80 transition-colors">
                    {/* Time */}
                    <td className="py-3.5 px-4 font-serif font-semibold tabular-nums text-[#17223a] whitespace-nowrap">
                      {formatTimeRange(appt.starts_at, appt.ends_at)}
                    </td>

                    {/* Patient */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-[#17223a]">
                        {appt.patient_first_name} {appt.patient_last_name}
                      </div>
                      <div className="text-[11px] text-[#6c747f]">{appt.patient_email}</div>
                    </td>

                    {/* Doctor */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium text-[#17223a]">
                        <Stethoscope className="w-3.5 h-3.5 text-[#204079]" />
                        <span>{formatDoctorName(appt.doctor_email)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-[#6c747f]">
                        <Building2 className="w-3 h-3 text-[#6c747f]" />
                        <span>{appt.department_name || 'General'}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(
                          appt.status
                        )}`}
                      >
                        {getStatusLabel(appt.status)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                      {appt.status === 'booked' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleCheckIn(appt.id)}
                          leftIcon={<UserCheck className="w-3.5 h-3.5 text-[#1f6b4e]" />}
                          className="hover:border-[#1f6b4e]/40"
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
                          leftIcon={<Ban className="w-3.5 h-3.5 text-[#ab2b1a]" />}
                          className="hover:text-[#ab2b1a] hover:border-[#f7c2bb]"
                        >
                          Cancel
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setHistoryApptId(appt.id)}
                        leftIcon={<History className="w-3.5 h-3.5 text-[#6c747f]" />}
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
