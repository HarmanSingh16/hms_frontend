import React, { useState, useEffect, useCallback } from 'react';
import { appointmentsApi } from '../../api/appointments';
import { patientsApi } from '../../api/patients';
import { AppointmentDetailResponse, Patient } from '../../types/api';
import { formatTime, formatDateTime } from '../../utils/date';
import { formatPhoneNumber } from '../../utils/formatters';
import { SyncIndicator } from '../../components/common/SyncIndicator';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { HistoryModal } from '../../components/queue/HistoryModal';
import { CancelModal } from '../../components/queue/CancelModal';
import { getErrorMessage } from '../../utils/errors';
import {
  CheckCircle2,
  Clock,
  User,
  AlertCircle,
  Loader2,
  History,
  Ban,
  HeartPulse,
} from 'lucide-react';

export const DoctorQueuePage: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentDetailResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  // Lazy-loaded patient demographics (to respect backend audit logging)
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [patientDetails, setPatientDetails] = useState<Patient | null>(null);
  const [isLoadingPatient, setIsLoadingPatient] = useState(false);

  // Modals
  const [historyApptId, setHistoryApptId] = useState<number | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AppointmentDetailResponse | null>(null);

  // Consultation completion state
  const [completingId, setCompletingId] = useState<number | null>(null);

  const fetchQueue = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await appointmentsApi.list({
        status: 'checked_in',
        limit: 50,
      });
      setAppointments(res.appointments);
      setLastUpdated(new Date());
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to fetch doctor waiting queue'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Complete consultation
  const handleComplete = async (id: number) => {
    setCompletingId(id);
    try {
      await appointmentsApi.complete(id);
      // Remove from checked-in queue
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      if (selectedPatientId) setSelectedPatientId(null);
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Failed to complete consultation'));
    } finally {
      setCompletingId(null);
    }
  };

  const handleConfirmCancel = async (reason: string) => {
    if (!cancelTarget) return;
    await appointmentsApi.cancel(cancelTarget.id, { reason });
    setAppointments((prev) => prev.filter((a) => a.id !== cancelTarget.id));
  };

  // Open on-demand patient demographics
  const openPatientDetails = async (patientId: number) => {
    setSelectedPatientId(patientId);
    setIsLoadingPatient(true);
    setPatientDetails(null);
    try {
      const data = await patientsApi.getById(patientId);
      setPatientDetails(data);
    } catch (err: unknown) {
      console.error('Failed to load patient demographics', err);
    } finally {
      setIsLoadingPatient(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clinical Waiting Room</h1>
          <p className="text-xs text-slate-500 mt-1">
            Checked-in patients waiting for consultation. Finish visits or review patient histories.
          </p>
        </div>

        <SyncIndicator
          onRefresh={fetchQueue}
          isLoading={isLoading}
          lastUpdated={lastUpdated}
        />
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Queue Cards */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600 mb-2" />
          <p className="text-xs">Fetching waiting room patients...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl p-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">Waiting Room Clear</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            There are currently no patients checked in waiting for consultation. Check back when front desk admits new arrivals.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appointments.map((appt) => (
            <Card key={appt.id} className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Checked-In & Waiting
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1.5">
                      {appt.patient_first_name} {appt.patient_last_name}
                    </h3>
                    <p className="text-xs text-slate-500">{appt.patient_email}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-700">
                      Slot: {formatTime(appt.starts_at)}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Booked {formatDateTime(appt.created_at)}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openPatientDetails(appt.patient_id)}
                    leftIcon={<User className="w-3.5 h-3.5" />}
                  >
                    Patient Profile
                  </Button>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setHistoryApptId(appt.id)}
                      leftIcon={<History className="w-3.5 h-3.5 text-slate-400" />}
                      title="View Timeline"
                    >
                      History
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCancelTarget(appt)}
                      leftIcon={<Ban className="w-3.5 h-3.5 text-rose-500" />}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleComplete(appt.id)}
                      isLoading={completingId === appt.id}
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      Complete Consultation
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Patient Demographic Inspection Modal (Audit-Compliant) */}
      <Modal
        isOpen={!!selectedPatientId}
        onClose={() => setSelectedPatientId(null)}
        title="Patient Clinical Profile"
        maxWidth="lg"
        footer={
          <Button variant="outline" size="sm" onClick={() => setSelectedPatientId(null)}>
            Close Profile
          </Button>
        }
      >
        {isLoadingPatient ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-sky-600 mb-2" />
            <p className="text-xs">Loading patient chart (audit log recorded)...</p>
          </div>
        ) : patientDetails ? (
          <div className="space-y-5">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400">Full Legal Name</span>
                <p className="font-semibold text-slate-800 text-sm">
                  {patientDetails.first_name} {patientDetails.last_name}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Date of Birth</span>
                <p className="font-semibold text-slate-800 text-sm">{patientDetails.date_of_birth}</p>
              </div>
              <div>
                <span className="text-slate-400">Contact Phone</span>
                <p className="font-medium text-slate-700">{formatPhoneNumber(patientDetails.phone_number)}</p>
              </div>
              <div>
                <span className="text-slate-400">Email Address</span>
                <p className="font-medium text-slate-700">{patientDetails.email}</p>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400">Residential Address</span>
                <p className="font-medium text-slate-700">{patientDetails.address || 'None provided'}</p>
              </div>
            </div>

            {/* Phase 2 Clinical Notes / Vitals Placeholder */}
            <div className="p-4 bg-sky-50/60 border border-sky-100 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900">
                <HeartPulse className="w-4 h-4 text-sky-600" />
                <span>Clinical Notes & Vitals (Phase 2 Preview)</span>
              </div>
              <p className="text-[11px] text-sky-800 leading-relaxed">
                Backend clinical notes and vital logging endpoints (BP, Heart Rate, SpO2, Temperature) are scheduled for the next release. Consultations currently record arrival check-in and completion transitions with full audit trails.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-rose-600 py-4">Failed to load patient records.</p>
        )}
      </Modal>

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
