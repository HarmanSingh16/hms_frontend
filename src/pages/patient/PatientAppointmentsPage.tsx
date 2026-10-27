import React, { useState, useEffect, useCallback } from 'react';
import { appointmentsApi } from '../../api/appointments';
import { AppointmentDetailResponse } from '../../types/api';
import {
  formatDate,
  formatTimeRange,
  isCancellationBlocked,
  getMinutesUntil,
} from '../../utils/date';
import { getStatusBadgeClass, getStatusLabel } from '../../utils/formatters';
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
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Appointments</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review your scheduled visits, track arrival status, and view consultation history.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 text-xs font-medium">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'upcoming'
              ? 'bg-sky-600 text-white font-semibold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Upcoming Visits ({upcomingList.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'past'
              ? 'bg-sky-600 text-white font-semibold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Past / Completed Visits ({pastList.length})
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600 mb-2" />
          <p className="text-xs">Fetching your consultations...</p>
        </div>
      ) : displayList.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl p-8 text-xs text-slate-500 space-y-2">
          <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-700">No {activeTab} visits found</p>
          <p className="text-slate-400">
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
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeClass(
                          appt.status
                        )}`}
                      >
                        {getStatusLabel(appt.status)}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-2">
                        {formatDate(appt.starts_at)}
                      </h3>
                      <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatTimeRange(appt.starts_at, appt.ends_at)}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs font-semibold text-slate-800">
                        <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
                        <span>{appt.doctor_email.split('@')[0]}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 justify-end mt-0.5">
                        <Building2 className="w-3 h-3" />
                        <span>{appt.department_name || 'General Medicine'}</span>
                      </div>
                    </div>
                  </div>

                  {/* 1-Hour Cancellation Notice / Action */}
                  {appt.status === 'booked' && (
                    <div className="pt-2 border-t border-slate-100">
                      {blocked ? (
                        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-start gap-2">
                          <PhoneCall className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold">Cancellation Window Closed</span>
                            <p className="mt-0.5">
                              This visit begins in {minutesLeft > 0 ? `${minutesLeft} mins` : 'a few moments'}.
                              Online self-cancellation is restricted within 1 hour. Please call reception at <strong>(555) 0100</strong> to cancel.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">
                            Can be cancelled online up to 1 hr prior
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCancelTarget(appt)}
                            leftIcon={<Ban className="w-3.5 h-3.5 text-rose-500" />}
                            className="hover:text-rose-600 hover:border-rose-300"
                          >
                            Cancel Visit
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {appt.cancellation_reason && (
                    <div className="p-2 bg-slate-50 rounded border border-slate-200 text-xs text-rose-700 italic">
                      Cancellation reason: {appt.cancellation_reason}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setHistoryApptId(appt.id)}
                      leftIcon={<History className="w-3.5 h-3.5 text-slate-400" />}
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
