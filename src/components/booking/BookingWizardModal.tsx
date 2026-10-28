import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { departmentsApi } from '../../api/departments';
import { doctorsApi } from '../../api/doctors';
import { appointmentsApi } from '../../api/appointments';
import { patientsApi } from '../../api/patients';
import {
  Department,
  DoctorProfile,
  Slot,
  Patient,
  AppointmentDetailResponse,
} from '../../types/api';
import { getNext7Days, formatTime } from '../../utils/date';
import { formatDoctorName } from '../../utils/formatters';
import {
  User,
  Stethoscope,
  Building2,
  Calendar,
  Clock,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
} from 'lucide-react';
import { getErrorMessage } from '../../utils/errors';

interface BookingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedPatient?: Patient | null;
  onSuccess?: (appointment: AppointmentDetailResponse) => void;
}

export const BookingWizardModal: React.FC<BookingWizardModalProps> = ({
  isOpen,
  onClose,
  preselectedPatient,
  onSuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Patient
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<Patient[]>([]);
  const [isSearchingPatients, setIsSearchingPatients] = useState(false);

  // Step 2: Department & Doctor
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);

  // Step 3: Date & Slot
  const next7Days = getNext7Days();
  const [selectedDate, setSelectedDate] = useState<string>(next7Days[0].dateString);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Initialize patient
  useEffect(() => {
    if (preselectedPatient) {
      setSelectedPatient(preselectedPatient);
      setStep(2);
    } else {
      setSelectedPatient(null);
      setStep(1);
    }
  }, [preselectedPatient, isOpen]);

  // Load departments on open
  useEffect(() => {
    if (isOpen) {
      departmentsApi
        .list()
        .then((depts) => {
          setDepartments(depts);
          if (depts.length > 0 && !selectedDeptId) {
            setSelectedDeptId(depts[0].id);
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  // Load doctors when department changes
  useEffect(() => {
    if (selectedDeptId && isOpen) {
      setIsLoadingDoctors(true);
      doctorsApi
        .list(selectedDeptId)
        .then((docs) => {
          setDoctors(docs);
          setSelectedDoctor(null);
        })
        .catch(console.error)
        .finally(() => setIsLoadingDoctors(false));
    }
  }, [selectedDeptId, isOpen]);

  // Search patients debounced
  useEffect(() => {
    if (patientSearchQuery.trim().length >= 2) {
      setIsSearchingPatients(true);
      const timer = setTimeout(() => {
        patientsApi
          .search(patientSearchQuery.trim(), 1, 10)
          .then((res) => setPatientSearchResults(res.patients))
          .catch(console.error)
          .finally(() => setIsSearchingPatients(false));
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setPatientSearchResults([]);
    }
  }, [patientSearchQuery]);

  // Fetch slots when doctor or date changes
  useEffect(() => {
    if (selectedDoctor && selectedDate && isOpen) {
      setIsLoadingSlots(true);
      setSelectedSlot(null);
      doctorsApi
        .getAvailableSlots(selectedDoctor.id, selectedDate)
        .then((res) => setSlots(res.slots))
        .catch(console.error)
        .finally(() => setIsLoadingSlots(false));
    }
  }, [selectedDoctor, selectedDate, isOpen]);

  const handleBook = async () => {
    if (!selectedDoctor || !selectedPatient || !selectedSlot) return;

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const created = await appointmentsApi.book({
        doctor_id: selectedDoctor.id,
        patient_id: selectedPatient.account_id,
        starts_at: selectedSlot.starts_at,
      });

      if (onSuccess) onSuccess(created);
      onClose();
    } catch (err: unknown) {
      setSubmissionError(
        getErrorMessage(err, 'Slot collision or booking failed. Please try another slot.')
      );
      // Re-fetch slots on collision
      if (selectedDoctor && selectedDate) {
        doctorsApi
          .getAvailableSlots(selectedDoctor.id, selectedDate)
          .then((res) => setSlots(res.slots))
          .catch(console.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule 15-Minute Consultation"
      maxWidth="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div>
            {step > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3 | 4)}
                disabled={isSubmitting}
              >
                Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            {step < 4 ? (
              <Button
                size="sm"
                disabled={
                  (step === 1 && !selectedPatient) ||
                  (step === 2 && !selectedDoctor) ||
                  (step === 3 && !selectedSlot)
                }
                onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3 | 4)}
              >
                Continue
              </Button>
            ) : (
              <Button size="sm" onClick={handleBook} isLoading={isSubmitting}>
                Confirm & Book
              </Button>
            )}
          </div>
        </div>
      }
    >
      {/* Steps Header */}
      <div className="flex items-center justify-between border-b border-[#dfdcd7] pb-3 mb-5 text-xs font-medium">
        <span className={step === 1 ? 'text-[#204079] font-bold' : 'text-[#6c747f]'}>
          1. Patient
        </span>
        <span className="text-[#cac4bb]">/</span>
        <span className={step === 2 ? 'text-[#204079] font-bold' : 'text-[#6c747f]'}>
          2. Doctor
        </span>
        <span className="text-[#cac4bb]">/</span>
        <span className={step === 3 ? 'text-[#204079] font-bold' : 'text-[#6c747f]'}>
          3. Slot
        </span>
        <span className="text-[#cac4bb]">/</span>
        <span className={step === 4 ? 'text-[#204079] font-bold' : 'text-[#6c747f]'}>
          4. Confirm
        </span>
      </div>

      {submissionError && (
        <div className="mb-4 p-3.5 bg-[#fcedea] border border-[#f7c2bb] rounded-xl text-[#ab2b1a] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{submissionError}</span>
        </div>
      )}

      {/* STEP 1: PATIENT SELECTION */}
      {step === 1 && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-[#17223a]">Select Patient for Booking</h4>
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-[#6c747f]" />
            <input
              type="text"
              placeholder="Search patient by name or phone..."
              value={patientSearchQuery}
              onChange={(e) => setPatientSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-[#dfdcd7] rounded-lg text-sm bg-white/95 text-[#17223a] focus:outline-none focus:ring-2 focus:ring-[#204079]/20 focus:border-[#204079]"
            />
          </div>

          {selectedPatient && (
            <div className="p-3.5 bg-[#e8edf5] border border-[#c8d7eb] rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#204079]" />
                <div>
                  <p className="text-sm font-semibold text-[#17223a]">
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </p>
                  <p className="text-xs text-[#6c747f]">{selectedPatient.phone_number} • {selectedPatient.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-[#204079]"
                onClick={() => setSelectedPatient(null)}
              >
                Change
              </Button>
            </div>
          )}

          {isSearchingPatients && (
            <div className="flex items-center justify-center py-4 text-xs text-[#6c747f] gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#204079]" />
              Searching directory...
            </div>
          )}

          {!selectedPatient && patientSearchResults.length > 0 && (
            <div className="border border-[#dfdcd7] rounded-xl divide-y divide-[#dfdcd7] max-h-48 overflow-y-auto bg-white">
              {patientSearchResults.map((p) => (
                <div
                  key={p.account_id}
                  onClick={() => setSelectedPatient(p)}
                  className="p-2.5 hover:bg-[#faf6f0] cursor-pointer flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-medium text-[#17223a]">
                      {p.first_name} {p.last_name}
                    </span>
                    <span className="text-[#6c747f] ml-2">({p.phone_number})</span>
                  </div>
                  <span className="text-[#204079] font-medium hover:underline">Select</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 2: DEPARTMENT & DOCTOR */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#17223a] uppercase tracking-wider mb-2">
              Department
            </label>
            <div className="flex gap-2 flex-wrap">
              {departments.map((dept) => (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => setSelectedDeptId(dept.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    selectedDeptId === dept.id
                      ? 'bg-[#204079] text-[#faf6f0] border-[#1b3769] shadow-xs'
                      : 'bg-white text-[#17223a] border-[#dfdcd7] hover:bg-[#faf6f0]'
                  }`}
                >
                  {dept.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#17223a] uppercase tracking-wider mb-2">
              Choose Doctor
            </label>
            {isLoadingDoctors ? (
              <div className="flex items-center gap-2 text-xs text-[#6c747f] py-4">
                <Loader2 className="w-4 h-4 animate-spin text-[#204079]" />
                Loading doctors...
              </div>
            ) : doctors.length === 0 ? (
              <p className="text-xs text-[#6c747f] py-3">No active doctors found in this department.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {doctors.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoctor(doc)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedDoctor?.id === doc.id
                        ? 'border-[#204079] bg-[#e8edf5]/80 ring-1 ring-[#204079]'
                        : 'border-[#dfdcd7] hover:border-[#cac4bb] bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#e8edf5] text-[#204079] flex items-center justify-center font-bold text-xs">
                        Dr
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#17223a]">{formatDoctorName(doc.email)}</p>
                        <p className="text-[11px] text-[#6c747f]">{doc.department_name}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: DATE & 15-MINUTE SLOT GRID */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#17223a] uppercase tracking-wider mb-2">
              Upcoming 7-Day Window
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {next7Days.map((d) => (
                <button
                  key={d.dateString}
                  type="button"
                  onClick={() => setSelectedDate(d.dateString)}
                  className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                    selectedDate === d.dateString
                      ? 'bg-[#204079] text-[#faf6f0] border-[#1b3769] shadow-xs'
                      : 'bg-white text-[#17223a] border-[#dfdcd7] hover:bg-[#faf6f0]'
                  }`}
                >
                  <div className="text-[10px] uppercase font-semibold">{d.dayName}</div>
                  <div className="text-xs font-bold mt-0.5">{d.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#17223a] uppercase tracking-wider">
                Available 15-Minute Slots
              </label>
              <div className="flex items-center gap-3 text-[11px] text-[#6c747f]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent-ok)]" /> Regular
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#5e3592]" /> Walk-In
                </span>
              </div>
            </div>

            {isLoadingSlots ? (
              <div className="flex items-center justify-center py-10 gap-2 text-xs text-[#6c747f]">
                <Loader2 className="w-4 h-4 animate-spin text-[#204079]" />
                Computing real-time slots...
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-8 bg-[#faf6f0] border border-dashed border-[#dfdcd7] rounded-xl text-[#6c747f] text-xs">
                No slots available on this date. Doctor may be off or fully booked.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-56 overflow-y-auto p-1">
                {slots.map((slot) => {
                  const isSelected = selectedSlot?.starts_at === slot.starts_at;
                  return (
                    <button
                      key={slot.starts_at}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`relative p-2 rounded-lg text-xs font-serif font-semibold tabular-nums border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#204079] text-[#faf6f0] border-[#1b3769] shadow-xs ring-2 ring-[#204079]/30'
                          : slot.is_walk_in_eligible
                          ? 'bg-[#f0eaf8] text-[#5e3592] border-[#dcceef] hover:bg-[#e6daf5]'
                          : 'bg-white text-[#17223a] border-[#dfdcd7] hover:border-[#1f6b4e] hover:bg-[#e8f5f0]'
                      }`}
                    >
                      {slot.is_walk_in_eligible && (
                        <span className="absolute -top-1.5 -right-1 px-1 py-0.2 bg-[#5e3592] text-white text-[9px] rounded-full font-bold flex items-center gap-0.5 shadow-2xs">
                          <Zap className="w-2.5 h-2.5" /> Walk-in
                        </span>
                      )}
                      <div>{formatTime(slot.starts_at)}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW & CONFIRM */}
      {step === 4 && selectedPatient && selectedDoctor && selectedSlot && (
        <div className="space-y-4">
          <div className="bg-[#f0ebe1]/70 border border-[#dfdcd7] rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-semibold text-[#17223a]">Consultation Summary</h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-[#6c747f] flex items-center gap-1 text-[11px] uppercase tracking-wider">
                  <User className="w-3.5 h-3.5 text-[#204079]" /> Patient:
                </span>
                <p className="font-semibold text-[#17223a]">
                  {selectedPatient.first_name} {selectedPatient.last_name}
                </p>
                <p className="text-[#6c747f]">{selectedPatient.phone_number}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[#6c747f] flex items-center gap-1 text-[11px] uppercase tracking-wider">
                  <Stethoscope className="w-3.5 h-3.5 text-[#204079]" /> Doctor:
                </span>
                <p className="font-semibold text-[#17223a]">
                  {formatDoctorName(selectedDoctor.email)}
                </p>
                <p className="text-[#6c747f] flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> {selectedDoctor.department_name}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[#6c747f] flex items-center gap-1 text-[11px] uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5 text-[#204079]" /> Date:
                </span>
                <p className="font-semibold text-[#17223a]">{selectedDate}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[#6c747f] flex items-center gap-1 text-[11px] uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-[#204079]" /> Time:
                </span>
                <p className="font-serif font-semibold tabular-nums text-[#17223a]">
                  {formatTime(selectedSlot.starts_at)} (15 mins)
                </p>
              </div>
            </div>

            {selectedSlot.is_walk_in_eligible && (
              <div className="p-3 bg-[#f0eaf8] border border-[#dcceef] rounded-xl text-[#5e3592] text-xs flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#5e3592] shrink-0" />
                <span>
                  <strong>Immediate Walk-In:</strong> Because this slot is currently ongoing, booking it
                  will automatically mark the patient as <strong>Checked-In</strong> and place them
                  immediately into the doctor&apos;s active queue!
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
