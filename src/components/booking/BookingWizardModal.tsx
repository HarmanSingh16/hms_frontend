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
      title="Schedule 15-Minute Appointment"
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
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-5 text-xs font-medium">
        <span className={step === 1 ? 'text-sky-600 font-bold' : 'text-slate-400'}>
          1. Patient
        </span>
        <span className="text-slate-300">/</span>
        <span className={step === 2 ? 'text-sky-600 font-bold' : 'text-slate-400'}>
          2. Doctor
        </span>
        <span className="text-slate-300">/</span>
        <span className={step === 3 ? 'text-sky-600 font-bold' : 'text-slate-400'}>
          3. Slot
        </span>
        <span className="text-slate-300">/</span>
        <span className={step === 4 ? 'text-sky-600 font-bold' : 'text-slate-400'}>
          4. Confirm
        </span>
      </div>

      {submissionError && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{submissionError}</span>
        </div>
      )}

      {/* STEP 1: PATIENT SELECTION */}
      {step === 1 && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-slate-800">Select Patient for Booking</h4>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient by name or phone..."
              value={patientSearchQuery}
              onChange={(e) => setPatientSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-500"
            />
          </div>

          {selectedPatient && (
            <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-600" />
                <div>
                  <p className="text-sm font-semibold text-sky-900">
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </p>
                  <p className="text-xs text-sky-700">{selectedPatient.phone_number} • {selectedPatient.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-sky-700"
                onClick={() => setSelectedPatient(null)}
              >
                Change
              </Button>
            </div>
          )}

          {isSearchingPatients && (
            <div className="flex items-center justify-center py-4 text-xs text-slate-500 gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Searching directory...
            </div>
          )}

          {!selectedPatient && patientSearchResults.length > 0 && (
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-48 overflow-y-auto">
              {patientSearchResults.map((p) => (
                <div
                  key={p.account_id}
                  onClick={() => setSelectedPatient(p)}
                  className="p-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-medium text-slate-800">
                      {p.first_name} {p.last_name}
                    </span>
                    <span className="text-slate-500 ml-2">({p.phone_number})</span>
                  </div>
                  <span className="text-sky-600 hover:underline">Select</span>
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
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Department
            </label>
            <div className="flex gap-2 flex-wrap">
              {departments.map((dept) => (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => setSelectedDeptId(dept.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    selectedDeptId === dept.id
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {dept.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Choose Doctor
            </label>
            {isLoadingDoctors ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-4">
                <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                Loading doctors...
              </div>
            ) : doctors.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">No active doctors found in this department.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {doctors.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoctor(doc)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                      selectedDoctor?.id === doc.id
                        ? 'border-sky-500 bg-sky-50/60 ring-1 ring-sky-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                        Dr
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{doc.email.split('@')[0]}</p>
                        <p className="text-[11px] text-slate-500">{doc.department_name}</p>
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
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Upcoming 7-Day Window
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {next7Days.map((d) => (
                <button
                  key={d.dateString}
                  type="button"
                  onClick={() => setSelectedDate(d.dateString)}
                  className={`p-2 rounded-lg text-center border transition-all ${
                    selectedDate === d.dateString
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
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
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Available 15-Minute Slots
              </label>
              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Regular
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500" /> Walk-In Eligible
                </span>
              </div>
            </div>

            {isLoadingSlots ? (
              <div className="flex items-center justify-center py-10 gap-2 text-xs text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                Computing real-time slots...
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-slate-500 text-xs">
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
                      className={`relative p-2 rounded-lg text-xs font-medium border text-center transition-all ${
                        isSelected
                          ? 'bg-sky-600 text-white border-sky-600 shadow-md ring-2 ring-sky-300'
                          : slot.is_walk_in_eligible
                          ? 'bg-purple-50 text-purple-900 border-purple-300 hover:bg-purple-100'
                          : 'bg-white text-slate-800 border-emerald-300 hover:bg-emerald-50/50'
                      }`}
                    >
                      {slot.is_walk_in_eligible && (
                        <span className="absolute -top-1.5 -right-1 px-1 py-0.2 bg-purple-600 text-white text-[9px] rounded-full font-bold flex items-center gap-0.5 shadow-sm">
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
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-semibold text-slate-800">Booking Summary</h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> Patient:
                </span>
                <p className="font-semibold text-slate-800">
                  {selectedPatient.first_name} {selectedPatient.last_name}
                </p>
                <p className="text-slate-500">{selectedPatient.phone_number}</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5" /> Doctor:
                </span>
                <p className="font-semibold text-slate-800">
                  {selectedDoctor.email.split('@')[0]}
                </p>
                <p className="text-slate-500 flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> {selectedDoctor.department_name}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Date:
                </span>
                <p className="font-semibold text-slate-800">{selectedDate}</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Time:
                </span>
                <p className="font-semibold text-slate-800">
                  {formatTime(selectedSlot.starts_at)} (15 mins)
                </p>
              </div>
            </div>

            {selectedSlot.is_walk_in_eligible && (
              <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-lg text-purple-900 text-xs flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-600 shrink-0" />
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
