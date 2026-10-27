import React, { useState, useEffect, useCallback } from 'react';
import { doctorsApi } from '../../api/doctors';
import {
  DoctorProfile,
  DoctorScheduleResponse,
  WeekdaySchedule,
  AffectedAppointment,
} from '../../types/api';
import { WEEKDAYS, formatDateTime } from '../../utils/date';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import {
  Calendar,
  AlertTriangle,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { InviteDoctorModal } from '../../components/admin/InviteDoctorModal';

export const AdminDoctorSchedulePage: React.FC = () => {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);

  const [scheduleData, setScheduleData] = useState<DoctorScheduleResponse | null>(null);
  const [editableSchedules, setEditableSchedules] = useState<WeekdaySchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Invite modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Two phase preview modal
  const [previewConflicts, setPreviewConflicts] = useState<AffectedAppointment[] | null>(null);

  // Leave modal
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [isBookingLeave, setIsBookingLeave] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  useEffect(() => {
    doctorsApi
      .list()
      .then((docs) => {
        setDoctors(docs);
        if (docs.length > 0) setSelectedDoctorId(docs[0].id);
      })
      .catch(console.error);
  }, []);

  const loadDoctorSchedule = useCallback(async (docId: number) => {
    setIsLoading(true);
    setError(null);
    setSaveSuccess(false);
    try {
      const data = await doctorsApi.getSchedule(docId);
      setScheduleData(data);

      const grouped: { [key: number]: Array<{ start_time: string; end_time: string }> } = {};
      for (let i = 0; i <= 6; i++) grouped[i] = [];

      data.office_hours.forEach((h) => {
        grouped[h.weekday].push({ start_time: h.start_time, end_time: h.end_time });
      });

      const formatted: WeekdaySchedule[] = [];
      for (let i = 0; i <= 6; i++) {
        if (grouped[i].length > 0) {
          formatted.push({ weekday: i, intervals: grouped[i] });
        }
      }
      setEditableSchedules(formatted);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch doctor schedule');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDoctorId) {
      loadDoctorSchedule(selectedDoctorId);
    }
  }, [selectedDoctorId, loadDoctorSchedule]);

  const addInterval = (weekday: number) => {
    setEditableSchedules((prev) => {
      const existing = prev.find((s) => s.weekday === weekday);
      if (existing) {
        return prev.map((s) =>
          s.weekday === weekday
            ? { ...s, intervals: [...s.intervals, { start_time: '09:00', end_time: '17:00' }] }
            : s
        );
      } else {
        return [...prev, { weekday, intervals: [{ start_time: '09:00', end_time: '17:00' }] }];
      }
    });
  };

  const removeInterval = (weekday: number, index: number) => {
    setEditableSchedules((prev) => {
      return prev
        .map((s) => {
          if (s.weekday !== weekday) return s;
          const updated = s.intervals.filter((_, i) => i !== index);
          return { ...s, intervals: updated };
        })
        .filter((s) => s.intervals.length > 0);
    });
  };

  const updateInterval = (
    weekday: number,
    index: number,
    field: 'start_time' | 'end_time',
    value: string
  ) => {
    setEditableSchedules((prev) =>
      prev.map((s) => {
        if (s.weekday !== weekday) return s;
        const updated = [...s.intervals];
        updated[index] = { ...updated[index], [field]: value };
        return { ...s, intervals: updated };
      })
    );
  };

  const handleSave = async () => {
    if (!selectedDoctorId) return;
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const preview = await doctorsApi.updateOfficeHours(selectedDoctorId, editableSchedules, true);
      if (preview.conflicts_count > 0) {
        setPreviewConflicts(preview.affected_appointments);
      } else {
        await doctorsApi.updateOfficeHours(selectedDoctorId, editableSchedules, false);
        setSaveSuccess(true);
        loadDoctorSchedule(selectedDoctorId);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update schedule');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmCommit = async () => {
    if (!selectedDoctorId) return;
    setIsSaving(true);
    try {
      await doctorsApi.updateOfficeHours(selectedDoctorId, editableSchedules, false);
      setPreviewConflicts(null);
      setSaveSuccess(true);
      loadDoctorSchedule(selectedDoctorId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to commit changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBookLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId || !leaveStart || !leaveEnd) return;

    setIsBookingLeave(true);
    setLeaveError(null);
    try {
      await doctorsApi.bookTimeOff(selectedDoctorId, {
        starts_at: new Date(leaveStart).toISOString(),
        ends_at: new Date(leaveEnd).toISOString(),
        reason: leaveReason.trim() || undefined,
      });
      setIsLeaveModalOpen(false);
      setLeaveStart('');
      setLeaveEnd('');
      setLeaveReason('');
      loadDoctorSchedule(selectedDoctorId);
    } catch (err: unknown) {
      setLeaveError(err instanceof Error ? err.message : 'Failed to book leave');
    } finally {
      setIsBookingLeave(false);
    }
  };

  const activeDoc = doctors.find((d) => d.id === selectedDoctorId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Doctor Schedules & Availability</h1>
          <p className="text-xs text-slate-500 mt-1">
            Admin oversight: configure recurring shifts or book emergency leaves for clinical staff.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedDoctorId || ''}
            onChange={(e) => setSelectedDoctorId(parseInt(e.target.value))}
            className="px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-sky-200"
          >
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                Dr. {d.email.split('@')[0]} ({d.department_name})
              </option>
            ))}
          </select>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsInviteModalOpen(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Invite Doctor
          </Button>

          <Button
            size="sm"
            onClick={() => setIsLeaveModalOpen(true)}
            leftIcon={<Calendar className="w-4 h-4" />}
          >
            Book Leave
          </Button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Doctor shifts updated successfully.</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Shifts Card */}
      <Card
        title={`Weekly Working Hours: ${activeDoc?.email.split('@')[0] || ''}`}
        subtitle={`Clinical Specialty: ${activeDoc?.department_name || 'General'}`}
        headerAction={
          <Button size="sm" onClick={handleSave} isLoading={isSaving}>
            Save Changes
          </Button>
        }
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-sky-600 mb-2" />
            <p className="text-xs">Loading doctor availability...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {WEEKDAYS.map((dayName, weekdayIndex) => {
              const daySchedule = editableSchedules.find((s) => s.weekday === weekdayIndex);
              const intervals = daySchedule?.intervals || [];

              return (
                <div
                  key={dayName}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="w-32">
                    <span className="text-sm font-bold text-slate-800">{dayName}</span>
                    <p className="text-[11px] text-slate-400">
                      {intervals.length === 0 ? 'Off Duty' : `${intervals.length} shift(s)`}
                    </p>
                  </div>

                  <div className="flex-1 space-y-2">
                    {intervals.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">No operating hours</span>
                    ) : (
                      intervals.map((interval, idx) => (
                        <div key={idx} className="flex items-center gap-2 flex-wrap">
                          <input
                            type="time"
                            value={interval.start_time}
                            onChange={(e) =>
                              updateInterval(weekdayIndex, idx, 'start_time', e.target.value)
                            }
                            className="px-2.5 py-1 text-xs border border-slate-300 rounded bg-white"
                          />
                          <span className="text-xs text-slate-400">to</span>
                          <input
                            type="time"
                            value={interval.end_time}
                            onChange={(e) =>
                              updateInterval(weekdayIndex, idx, 'end_time', e.target.value)
                            }
                            className="px-2.5 py-1 text-xs border border-slate-300 rounded bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => removeInterval(weekdayIndex, idx)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addInterval(weekdayIndex)}
                      leftIcon={<Plus className="w-3 h-3" />}
                    >
                      Add Shift
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Upcoming Time Off */}
      <Card title="Doctor Leaves & Conferences">
        {!scheduleData || scheduleData.upcoming_time_off.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No scheduled leaves for this practitioner.</p>
        ) : (
          <div className="space-y-2">
            {scheduleData.upcoming_time_off.map((leave) => (
              <div
                key={leave.id}
                className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-800">
                    {formatDateTime(leave.starts_at)} &rarr; {formatDateTime(leave.ends_at)}
                  </span>
                  {leave.reason && (
                    <p className="text-slate-500 mt-0.5">Reason: {leave.reason}</p>
                  )}
                </div>
                <span className="px-2.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-semibold">
                  Scheduled Leave
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Phase 2 Conflict Modal */}
      <Modal
        isOpen={!!previewConflicts}
        onClose={() => setPreviewConflicts(null)}
        title="Administrative Conflict Override"
        maxWidth="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setPreviewConflicts(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmCommit}
              isLoading={isSaving}
            >
              Cancel Conflicting Visits & Update
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">
                Warning: {previewConflicts?.length} Bookings Will Be Cancelled
              </p>
              <p className="mt-0.5 text-amber-800">
                Updating this doctor&apos;s working hours will cancel overlapping patient appointments.
              </p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-48 overflow-y-auto text-xs">
            {previewConflicts?.map((c) => (
              <div key={c.id} className="p-2.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800">Appointment #{c.id}</span>
                  <span className="text-slate-500 ml-2">Patient ID #{c.patient_id}</span>
                </div>
                <span className="text-slate-600">{formatDateTime(c.starts_at)}</span>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Book Leave Modal */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title="Book Doctor Leave"
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsLeaveModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleBookLeave} isLoading={isBookingLeave}>
              Confirm Leave
            </Button>
          </>
        }
      >
        <form onSubmit={handleBookLeave} className="space-y-4">
          {leaveError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{leaveError}</span>
            </div>
          )}

          <Input
            label="Starts At"
            type="datetime-local"
            value={leaveStart}
            onChange={(e) => setLeaveStart(e.target.value)}
            required
          />

          <Input
            label="Ends At"
            type="datetime-local"
            value={leaveEnd}
            onChange={(e) => setLeaveEnd(e.target.value)}
            required
          />

          <Input
            label="Reason"
            placeholder="e.g. Leave approved by Chief of Medicine"
            value={leaveReason}
            onChange={(e) => setLeaveReason(e.target.value)}
          />
        </form>
      </Modal>

      {/* Invite Doctor Modal */}
      <InviteDoctorModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={() => {
          // reload doctors list if needed
          doctorsApi.list().then(setDoctors).catch(console.error);
        }}
      />
    </div>
  );
};
