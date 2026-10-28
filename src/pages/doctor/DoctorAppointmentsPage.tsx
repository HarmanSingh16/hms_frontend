import React, { useState, useEffect, useCallback } from 'react';
import { appointmentsApi } from '../../api/appointments';
import { AppointmentDetailResponse, AppointmentStatus } from '../../types/api';
import { formatTimeRange, formatDate } from '../../utils/date';
import { getStatusBadgeClass, getStatusLabel } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { HistoryModal } from '../../components/queue/HistoryModal';
import { CancelModal } from '../../components/queue/CancelModal';
import { getErrorMessage } from '../../utils/errors';
import { History, Ban, Loader2, AlertCircle } from 'lucide-react';

export const DoctorAppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentDetailResponse[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [historyApptId, setHistoryApptId] = useState<number | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AppointmentDetailResponse | null>(null);

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await appointmentsApi.list({
        status: statusFilter ? (statusFilter as AppointmentStatus) : undefined,
        limit: 100,
      });
      setAppointments(res.appointments);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to list consultations'));
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

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
          <span className="eyebrow mb-1 block">Clinical Records</span>
          <h1 className="font-serif text-3xl font-semibold text-[#17223a] tracking-tight">
            Consultation Ledger
          </h1>
          <p className="text-xs sm:text-sm text-[#6c747f] mt-1 font-normal">
            Historical and scheduled visits assigned to your clinical schedule.
          </p>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white/95 border border-[#dfdcd7] rounded-lg text-xs font-medium text-[#17223a] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#204079]/20 focus:border-[#204079] cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="booked">Booked</option>
            <option value="checked_in">Checked-In</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No-Show</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-[#fcedea] border border-[#f7c2bb] rounded-xl text-[#ab2b1a] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#6c747f]">
            <Loader2 className="w-8 h-8 animate-spin text-[#204079] mb-2" />
            <p className="text-xs">Loading appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12 text-[#6c747f] text-xs bg-[#faf6f0] rounded-xl border border-dashed border-[#dfdcd7]">
            No consultations found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#17223a]">
              <thead className="bg-[#faf6f0] text-[#17223a] uppercase font-semibold text-[11px] tracking-wider border-y border-[#dfdcd7]">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Notes / Cancellation</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dfdcd7]">
                {appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-[#faf6f0]/80 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-[#17223a]">{formatDate(appt.starts_at)}</div>
                      <div className="text-[11px] font-serif tabular-nums text-[#6c747f]">
                        {formatTimeRange(appt.starts_at, appt.ends_at)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-[#17223a]">
                        {appt.patient_first_name} {appt.patient_last_name}
                      </div>
                      <div className="text-[11px] text-[#6c747f]">{appt.patient_email}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${getStatusBadgeClass(
                          appt.status
                        )}`}
                      >
                        {getStatusLabel(appt.status)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-[#6c747f] max-w-xs truncate">
                      {appt.cancellation_reason ? (
                        <span className="text-[#ab2b1a] italic">
                          Cancelled: {appt.cancellation_reason}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                      {(appt.status === 'booked' || appt.status === 'checked_in') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCancelTarget(appt)}
                          leftIcon={<Ban className="w-3.5 h-3.5 text-[#ab2b1a]" />}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setHistoryApptId(appt.id)}
                        leftIcon={<History className="w-3.5 h-3.5 text-[#6c747f]" />}
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
    </div>
  );
};
