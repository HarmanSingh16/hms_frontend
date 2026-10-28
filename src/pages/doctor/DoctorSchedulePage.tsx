import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doctorsApi } from '../../api/doctors';
import {
  OfficeHourResponse,
  TimeOffResponse,
  WeekdaySchedule,
  AffectedAppointment,
} from '../../types/api';
import { WEEKDAYS, formatDateTime } from '../../utils/date';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { getErrorMessage } from '../../utils/errors';
import {
  Plus,
  Trash2,
  Sparkles,
  AlertTriangle,
  Loader2,
  AlertCircle,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

export const DoctorSchedulePage: React.FC = () => {
  const { user } = useAuth();
  const doctorId = user?.id || 0;

  // Schedules state: map weekday 0..6 to intervals
  const [schedules, setSchedules] = useState<WeekdaySchedule[]>([]);
  const [upcomingTimeOff, setUpcomingTimeOff] = useState<TimeOffResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Two-phase preview modal
  const [previewConflicts, setPreviewConflicts] = useState<AffectedAppointment[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Time-Off modal
  const [isTimeOffModalOpen, setIsTimeOffModalOpen] = useState(false);
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [isBookingLeave, setIsBookingLeave] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const fetchSchedule = useCallback(async () => {
    if (!doctorId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await doctorsApi.getSchedule(doctorId);
      setUpcomingTimeOff(data.upcoming_time_off);

      // Group office_hours into WeekdaySchedule[]
      const grouped: { [key: number]: Array<{ start_time: string; end_time: string }> } = {};
      for (let i = 0; i <= 6; i++) grouped[i] = [];

      data.office_hours.forEach((h: OfficeHourResponse) => {
        grouped[h.weekday].push({
          start_time: h.start_time,
          end_time: h.end_time,
        });
      });

      const formatted: WeekdaySchedule[] = [];
      for (let i = 0; i <= 6; i++) {
        if (grouped[i].length > 0) {
          formatted.push({
            weekday: i,
            intervals: grouped[i],
          });
        }
      }
      setSchedules(formatted);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to fetch doctor schedule'));
    } finally {
      setIsLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // Preset helper: Monday to Friday 09:00 - 17:00
  const applyStandardPreset = () => {
    const standard: WeekdaySchedule[] = [1, 2, 3, 4, 5].map((weekday) => ({
      weekday,
      intervals: [{ start_time: '09:00', end_time: '17:00' }],
    }));
    setSchedules(standard);
  };

  // Add interval to a day
  const addInterval = (weekday: number) => {
    setSchedules((prev) => {
      const existing = prev.find((s) => s.weekday === weekday);
      if (!existing) {
        return [...prev, { weekday, intervals: [{ start_time: '09:00', end_time: '13:00' }] }];
      }
      return prev.map((s) =>
        s.weekday === weekday
          ? {
              ...s,
              intervals: [...s.intervals, { start_time: '14:00', end_time: '18:00' }],
            }
          : s
      );
    });
  };

  // Remove interval
  const removeInterval = (weekday: number, index: number) => {
    setSchedules((prev) =>
      prev
        .map((s) => {
          if (s.weekday !== weekday) return s;
          const updated = s.intervals.filter((_, idx) => idx !== index);
          return { ...s, intervals: updated };
        })
        .filter((s) => s.intervals.length > 0)
    );
  };

  // Update interval times
  const updateInterval = (
    weekday: number,
    index: number,
    field: 'start_time' | 'end_time',
    value: string
  ) => {
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.weekday !== weekday) return s;
        const updated = s.intervals.map((intv, idx) => {
          if (idx !== index) return intv;
          return { ...intv, [field]: value };
        });
        return { ...s, intervals: updated };
      })
    );
  };

  // Save schedule phase 1: dry-run
  const handleSaveSchedule = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const res = await doctorsApi.updateOfficeHours(doctorId, schedules, true);
      if (res.affected_appointments && res.affected_appointments.length > 0) {
        setPreviewConflicts(res.affected_appointments);
      } else {
        await handleConfirmScheduleCommit();
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to update working hours schedule.'));
    } finally {
      setIsSaving(false);
    }
  };

  // Save schedule phase 2: commit
  const handleConfirmScheduleCommit = async () => {
    setIsSaving(true);
    try {
      await doctorsApi.updateOfficeHours(doctorId, schedules, false);
      setPreviewConflicts(null);
      setSaveSuccess(true);
      fetchSchedule();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to commit schedule changes.'));
    } finally {
      setIsSaving(false);
    }
  };

  // Book leave
  const handleBookLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStart || !leaveEnd) {
      setLeaveError('Please specify start and end dates.');
      return;
    }

    const start = new Date(leaveStart);
    const end = new Date(leaveEnd);
    if (end <= start) {
      setLeaveError('Leave end time must be after start time.');
      return;
    }

    setIsBookingLeave(true);
    setLeaveError(null);

    try {
      await doctorsApi.bookTimeOff(doctorId, {
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        reason: leaveReason.trim() || undefined,
      });

      setIsTimeOffModalOpen(false);
      setLeaveStart('');
      setLeaveEnd('');
      setLeaveReason('');
      fetchSchedule();
    } catch (err: unknown) {
      setLeaveError(getErrorMessage(err, 'Failed to register leave.'));
    } finally {
      setIsBookingLeave(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="eyebrow mb-1 block">Clinical Practice</span>
          <h1 className="font-serif text-3xl font-semibold text-[#17223a] tracking-tight">
            Office Hours & Leaves
          </h1>
          <p className="text-xs sm:text-sm text-[#6c747f] mt-1 font-normal">
            Configure weekly recurring consultation intervals and book scheduled leaves.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={applyStandardPreset}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-[var(--accent-gap)]" />}
          >
            Apply Standard Preset (Mon-Fri 9-5)
          </Button>

          <Button
            size="sm"
            onClick={() => setIsTimeOffModalOpen(true)}
            leftIcon={<Calendar className="w-3.5 h-3.5" />}
          >
            Book Leave
          </Button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-[#e8f5f0] border border-[#b8dfd0] rounded-xl text-[#1f6b4e] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#1f6b4e] shrink-0" />
          <span>Weekly shift schedule updated successfully.</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-[#fcedea] border border-[#f7c2bb] rounded-xl text-[#ab2b1a] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Weekly Schedule Matrix */}
      <Card
        title="Weekly Recurring Shifts"
        subtitle="Slots are computed in 15-minute increments within these operating intervals."
        headerAction={
          <Button
            size="sm"
            onClick={handleSaveSchedule}
            isLoading={isSaving}
          >
            Save Shifts
          </Button>
        }
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-[#6c747f]">
            <Loader2 className="w-6 h-6 animate-spin text-[#204079] mb-2" />
            <p className="text-xs">Loading working schedule...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {WEEKDAYS.map((dayName, weekdayIndex) => {
              const daySchedule = schedules.find((s) => s.weekday === weekdayIndex);
              const intervals = daySchedule?.intervals || [];

              return (
                <div
                  key={dayName}
                  className="p-3.5 bg-[#faf6f0] border border-[#dfdcd7] rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="w-32">
                    <span className="text-sm font-semibold text-[#17223a]">{dayName}</span>
                    <p className="text-[11px] text-[#6c747f]">
                      {intervals.length === 0 ? 'Off Duty' : `${intervals.length} shift(s)`}
                    </p>
                  </div>

                  <div className="flex-1 space-y-2">
                    {intervals.length === 0 ? (
                      <span className="text-xs text-[#9e9689] italic">No working hours set</span>
                    ) : (
                      intervals.map((interval, idx) => (
                        <div key={idx} className="flex items-center gap-2 flex-wrap">
                          <input
                            type="time"
                            value={interval.start_time}
                            onChange={(e) =>
                              updateInterval(weekdayIndex, idx, 'start_time', e.target.value)
                            }
                            className="px-2.5 py-1 text-xs border border-[#dfdcd7] rounded-md bg-white text-[#17223a] font-serif tabular-nums shadow-2xs focus:border-[#204079] focus:outline-none"
                          />
                          <span className="text-xs text-[#6c747f]">to</span>
                          <input
                            type="time"
                            value={interval.end_time}
                            onChange={(e) =>
                              updateInterval(weekdayIndex, idx, 'end_time', e.target.value)
                            }
                            className="px-2.5 py-1 text-xs border border-[#dfdcd7] rounded-md bg-white text-[#17223a] font-serif tabular-nums shadow-2xs focus:border-[#204079] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => removeInterval(weekdayIndex, idx)}
                            className="text-[#6c747f] hover:text-[#ab2b1a] p-1 cursor-pointer"
                            title="Remove Shift"
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

      {/* Upcoming Leaves */}
      <Card
        title="Scheduled Time-Off & Leaves"
        subtitle="During time-off, doctor slots are unavailable. Existing visits are automatically cancelled."
      >
        {upcomingTimeOff.length === 0 ? (
          <p className="text-xs text-[#6c747f] py-4 text-center">No upcoming time-off scheduled.</p>
        ) : (
          <div className="space-y-2">
            {upcomingTimeOff.map((leave) => (
              <div
                key={leave.id}
                className="p-3 bg-[#faf6f0] border border-[#dfdcd7] rounded-lg flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-serif font-semibold tabular-nums text-[#17223a]">
                    {formatDateTime(leave.starts_at)} &rarr; {formatDateTime(leave.ends_at)}
                  </span>
                  {leave.reason && (
                    <p className="text-[#6c747f] mt-0.5">Reason: {leave.reason}</p>
                  )}
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#f0eaf8] text-[#5e3592] border border-[#dcceef] text-[11px] font-semibold">
                  Approved Leave
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Phase 2 Conflict Confirmation Modal */}
      <Modal
        isOpen={!!previewConflicts}
        onClose={() => setPreviewConflicts(null)}
        title="Confirm Schedule Conflict Cancellation"
        maxWidth="lg"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewConflicts(null)}
              disabled={isSaving}
            >
              Discard Changes
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmScheduleCommit}
              isLoading={isSaving}
            >
              Confirm & Cancel Conflicting Visits
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-[#fef3eb] border border-[#fcd5b8] rounded-xl text-[#c95908] text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-[#c95908] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#17223a] text-sm">
                Warning: {previewConflicts?.length} Existing Bookings Affected
              </p>
              <p className="mt-0.5 text-[#6c747f] leading-relaxed">
                Modifying these hours will invalidate the following booked appointments. If you
                proceed, these visits will be cancelled with reason &quot;doctor_schedule_change&quot; and
                affected patients will receive notification emails.
              </p>
            </div>
          </div>

          <div className="border border-[#dfdcd7] rounded-xl divide-y divide-[#dfdcd7] max-h-48 overflow-y-auto text-xs bg-white">
            {previewConflicts?.map((c) => (
              <div key={c.id} className="p-2.5 flex items-center justify-between">
                <div>
                  <span className="font-serif font-semibold text-[#17223a]">
                    Appointment #{c.id}
                  </span>
                  <span className="text-[#6c747f] ml-2">Patient #{c.patient_id}</span>
                </div>
                <span className="text-[#17223a] font-serif tabular-nums">{formatDateTime(c.starts_at)}</span>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Book Leave Modal */}
      <Modal
        isOpen={isTimeOffModalOpen}
        onClose={() => setIsTimeOffModalOpen(false)}
        title="Schedule Doctor Time-Off / Leave"
        maxWidth="md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTimeOffModalOpen(false)}
              disabled={isBookingLeave}
            >
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
            <div className="p-3 bg-[#fcedea] border border-[#f7c2bb] rounded-xl text-[#ab2b1a] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{leaveError}</span>
            </div>
          )}

          <Input
            label="Leave Starts At"
            type="datetime-local"
            value={leaveStart}
            onChange={(e) => setLeaveStart(e.target.value)}
            required
          />

          <Input
            label="Leave Ends At"
            type="datetime-local"
            value={leaveEnd}
            onChange={(e) => setLeaveEnd(e.target.value)}
            required
          />

          <Input
            label="Reason (Optional)"
            placeholder="e.g., Medical Conference, Annual Leave"
            value={leaveReason}
            onChange={(e) => setLeaveReason(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
};
