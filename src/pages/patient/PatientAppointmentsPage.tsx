import React, { useState, useEffect, useCallback } from 'react';
import { appointmentsApi } from '../../api/appointments';
import { AppointmentDetailResponse } from '../../types/api';
import {
  formatDate,
  formatTimeRange,
  isCancellationBlocked,
  getMinutesUntil,
} from '../../utils/date';
import { getStatusBadgeClass, getStatusLabel, formatDoctorName } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { HistoryModal } from '../../components/queue/HistoryModal';
import { CancelModal } from '../../components/queue/CancelModal';
import { getErrorMessage } from '../../utils/errors';
import {
  Calendar,
  Clock,
  Stethoscope,
  Building2,
  Ban,
  History,
  AlertCircle,
  PhoneCall,
  Loader2,
} from 'lucide-react';

export const PatientAppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentDetailResponse[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [historyApptId, setHistoryApptId] = useState<number | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AppointmentDetailResponse | null>(null);

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await appointmentsApi.list({ limit: 100 });
      setAppointments(res.appointments);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load your appointments'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleConfirmCancel = async (reason: string) => {
    if (!cancelTarget) return;
    const updated = await appointmentsApi.cancel(cancelTarget.id, { reason });
    setAppointments((prev) => prev.map((a) => (a.id === cancelTarget.id ? updated : a)));
  };

  const now = new Date();
  const upcomingList = appointments.filter((a) => {
    const isFuture = new Date(a.ends_at) >= now;
    return isFuture && (a.status === 'booked' || a.status === 'checked_in');
  });

  const pastList = appointments.filter((a) => {
    const isPast = new Date(a.ends_at) < now;
    return isPast || a.status === 'completed' || a.status === 'cancelled' || a.status === 'no_show';
  });

  const displayList = activeTab === 'upcoming' ? upcomingList : pastList;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="eyebrow mb-1 block">Patient Portal</span>
        <h1 className="font-serif text-3xl font-semibold text-[#17223a] tracking-tight">
          My Appointments
        </h1>
        <p className="text-xs sm:text-sm text-[#6c747f] mt-1 font-normal">
          Review your scheduled visits, track arrival status, and view consultation history.
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-[#fcedea] border border-[#f7c2bb] rounded-xl text-[#ab2b1a] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1.5 bg-[#f0ebe1] p-1.5 rounded-xl border border-[#dfdcd7] max-w-md text-xs font-medium">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-center transition-all duration-150 cursor-pointer ${
            activeTab === 'upcoming'
              ? 'bg-[#204079] text-[#faf6f0] font-semibold shadow-xs'
              : 'text-[#17223a] hover:bg-[#e6dfd1]'
          }`}
        >
          Upcoming Visits ({upcomingList.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-center transition-all duration-150 cursor-pointer ${
            activeTab === 'past'
              ? 'bg-[#204079] text-[#faf6f0] font-semibold shadow-xs'
              : 'text-[#17223a] hover:bg-[#e6dfd1]'
          }`}
        >
          Past / Completed ({pastList.length})
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#6c747f]">
          <Loader2 className="w-8 h-8 animate-spin text-[#204079] mb-2" />
          <p className="text-xs">Fetching your consultations...</p>
        </div>
      ) : displayList.length === 0 ? (
        <div className="text-center py-16 bg-white/90 border border-[#dfdcd7] rounded-2xl p-8 text-xs text-[#6c747f] space-y-2">
          <Calendar className="w-8 h-8 text-[#cac4bb] mx-auto" />
          <p className="font-serif text-base font-semibold text-[#17223a]">No {activeTab} visits found</p>
          <p className="text-[#6c747f]">
            {activeTab === 'upcoming'
              ? 'To schedule an appointment, please contact the front desk reception.'
              : 'Your previous consultation records will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayList.map((appt) => {
            const blocked = isCancellationBlocked(appt.starts_at);
            const minutesLeft = getMinutesUntil(appt.starts_at);

            return (
              <Card key={appt.id} className="hover:shadow-md transition-shadow">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(
                          appt.status
                        )}`}
                      >
                        {getStatusLabel(appt.status)}
                      </span>
                      <h3 className="font-serif text-lg font-semibold text-[#17223a] mt-2 tracking-tight">
                        {formatDate(appt.starts_at)}
                      </h3>
                      <p className="text-xs text-[#6c747f] font-serif tabular-nums flex items-center gap-1.5 mt-0.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-[#6c747f]" />
                        {formatTimeRange(appt.starts_at, appt.ends_at)}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs font-semibold text-[#17223a]">
                        <Stethoscope className="w-3.5 h-3.5 text-[#204079]" />
                        <span>{formatDoctorName(appt.doctor_email)}</span>
                      </div>
                      <div className="text-[11px] text-[#6c747f] flex items-center gap-1 justify-end mt-0.5">
                        <Building2 className="w-3 h-3 text-[#6c747f]" />
                        <span>{appt.department_name || 'General Medicine'}</span>
                      </div>
                    </div>
                  </div>

                  {/* 1-Hour Cancellation Notice / Action */}
                  {appt.status === 'booked' && (
                    <div className="pt-2.5 border-t border-[#dfdcd7]">
                      {blocked ? (
                        <div className="p-3 bg-[#fef3eb] border border-[#fcd5b8] rounded-xl text-[11px] text-[#c95908] flex items-start gap-2">
                          <PhoneCall className="w-4 h-4 text-[#c95908] shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-[#17223a]">Cancellation Window Restricted</span>
                            <p className="mt-0.5 text-[#6c747f] leading-relaxed">
                              This visit begins in {minutesLeft > 0 ? `${minutesLeft} mins` : 'a few moments'}.
                              Online self-cancellation is restricted within 1 hour. Please call reception at <strong>(555) 0100</strong> to cancel.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#6c747f]">
                            Can be cancelled online up to 1 hr prior
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCancelTarget(appt)}
                            leftIcon={<Ban className="w-3.5 h-3.5 text-[#ab2b1a]" />}
                            className="hover:text-[#ab2b1a] hover:border-[#f7c2bb]"
                          >
                            Cancel Visit
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {appt.cancellation_reason && (
                    <div className="p-2.5 bg-[#faf6f0] rounded-lg border border-[#dfdcd7] text-xs text-[#ab2b1a] italic">
                      Cancellation reason: {appt.cancellation_reason}
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#dfdcd7] flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setHistoryApptId(appt.id)}
                      leftIcon={<History className="w-3.5 h-3.5 text-[#6c747f]" />}
                    >
                      View Transition History
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

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
        onClose={() => setCancelTarget(null)}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
};
