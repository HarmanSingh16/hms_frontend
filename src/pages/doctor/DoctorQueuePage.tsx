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
          <span className="eyebrow mb-1 block">Clinical Practice</span>
          <h1 className="font-serif text-3xl font-semibold text-[#17223a] tracking-tight">
            Clinical Waiting Room
          </h1>
          <p className="text-xs sm:text-sm text-[#6c747f] mt-1 font-normal">
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
        <div className="p-3.5 bg-[#fcedea] border border-[#f7c2bb] rounded-xl text-[#ab2b1a] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Queue Cards */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#6c747f]">
          <Loader2 className="w-8 h-8 animate-spin text-[#204079] mb-2" />
          <p className="text-xs">Fetching waiting room patients...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-16 bg-white/90 border border-[#dfdcd7] rounded-2xl p-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#e8f5f0] text-[#1f6b4e] mx-auto flex items-center justify-center border border-[#b8dfd0]">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-[#17223a]">Waiting Room Clear</h3>
          <p className="text-xs text-[#6c747f] max-w-sm mx-auto">
            There are currently no patients checked in waiting for consultation. Check back when front desk admits new arrivals.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appointments.map((appt) => (
            <Card key={appt.id} className="border-l-4 border-l-[var(--accent-gap)] hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-semibold text-[#c95908] bg-[#fef3eb] px-2.5 py-0.5 rounded-full border border-[#fcd5b8] inline-flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#c95908]" /> Checked-In & Waiting
                    </span>
                    <h3 className="font-serif text-lg font-semibold text-[#17223a] mt-1.5">
                      {appt.patient_first_name} {appt.patient_last_name}
                    </h3>
                    <p className="text-xs text-[#6c747f]">{appt.patient_email}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-serif font-semibold tabular-nums text-[#17223a]">
                      Slot: {formatTime(appt.starts_at)}
                    </span>
                    <p className="text-[11px] text-[#6c747f] mt-0.5">
                      Booked {formatDateTime(appt.created_at)}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#dfdcd7] flex items-center justify-between flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
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
                      leftIcon={<History className="w-3.5 h-3.5 text-[#6c747f]" />}
                      title="View Timeline"
                    >
                      History
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCancelTarget(appt)}
                      leftIcon={<Ban className="w-3.5 h-3.5 text-[#ab2b1a]" />}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleComplete(appt.id)}
                      isLoading={completingId === appt.id}
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-[#faf6f0]" />}
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
          <div className="flex flex-col items-center justify-center py-12 text-[#6c747f]">
            <Loader2 className="w-8 h-8 animate-spin text-[#204079] mb-2" />
            <p className="text-xs">Loading patient chart (audit log recorded)...</p>
          </div>
        ) : patientDetails ? (
          <div className="space-y-5">
            <div className="bg-[#f0ebe1]/70 p-4 rounded-xl border border-[#dfdcd7] grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#6c747f] text-[11px] uppercase tracking-wider block">Full Legal Name</span>
                <p className="font-semibold text-[#17223a] text-sm mt-0.5">
                  {patientDetails.first_name} {patientDetails.last_name}
                </p>
              </div>
              <div>
                <span className="text-[#6c747f] text-[11px] uppercase tracking-wider block">Date of Birth</span>
                <p className="font-serif font-semibold tabular-nums text-[#17223a] text-sm mt-0.5">
                  {patientDetails.date_of_birth}
                </p>
              </div>
              <div>
                <span className="text-[#6c747f] text-[11px] uppercase tracking-wider block">Contact Phone</span>
                <p className="font-medium text-[#17223a] mt-0.5">{formatPhoneNumber(patientDetails.phone_number)}</p>
              </div>
              <div>
                <span className="text-[#6c747f] text-[11px] uppercase tracking-wider block">Email Address</span>
                <p className="font-medium text-[#17223a] mt-0.5">{patientDetails.email}</p>
              </div>
              <div className="col-span-2">
                <span className="text-[#6c747f] text-[11px] uppercase tracking-wider block">Residential Address</span>
                <p className="font-medium text-[#17223a] mt-0.5">{patientDetails.address || 'None provided'}</p>
              </div>
            </div>

            {/* Clinical Notes / Vitals Placeholder */}
            <div className="p-4 bg-[#e8edf5]/80 border border-[#c8d7eb] rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#204079] uppercase tracking-wider">
                <HeartPulse className="w-4 h-4 text-[#204079]" />
                <span>Clinical Notes & Vitals Record</span>
              </div>
              <p className="text-[12px] text-[#17223a]/80 leading-relaxed">
                Consultations record arrival check-in and completion transitions with immutable audit trails. Clinical notes and vital logging endpoints are securely tracked under patient identifier.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#ab2b1a] py-4">Failed to load patient records.</p>
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
