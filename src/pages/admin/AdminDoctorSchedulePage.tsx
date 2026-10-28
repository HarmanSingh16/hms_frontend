import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { doctorsApi } from '../../api/doctors';
import { departmentsApi } from '../../api/departments';
import {
  Department,
  DoctorProfile,
  DoctorScheduleResponse,
  WeekdaySchedule,
  AffectedAppointment,
} from '../../types/api';
import { WEEKDAYS, formatDateTime } from '../../utils/date';
import { formatDoctorName } from '../../utils/formatters';
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
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { InviteDoctorModal } from '../../components/admin/InviteDoctorModal';
import { getErrorMessage } from '../../utils/errors';

export const AdminDoctorSchedulePage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<number | 'all'>('all');
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);

  const [scheduleData, setScheduleData] = useState<DoctorScheduleResponse | null>(null);
  const [editableSchedules, setEditableSchedules] = useState<WeekdaySchedule[]>([]);
  const [isDoctorsLoading, setIsDoctorsLoading] = useState(true);
  const [doctorsError, setDoctorsError] = useState<string | null>(null);
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

  const loadDoctorsAndDepartments = useCallback(async () => {
    setIsDoctorsLoading(true);
    setDoctorsError(null);
    try {
      const [allDocs, allDepts] = await Promise.all([
        doctorsApi.list(),
        departmentsApi.list().catch((err) => {
          console.warn('Failed to load departments:', err);
          return [] as Department[];
        }),
      ]);

      setDoctors(allDocs);
      setDepartments(allDepts);

      if (allDocs.length > 0) {
        setSelectedDoctorId((prev) =>
          prev && allDocs.some((d) => d.id === prev) ? prev : allDocs[0].id
        );
      } else {
        setSelectedDoctorId(null);
      }
    } catch (err: unknown) {
      setDoctorsError(getErrorMessage(err, 'Failed to fetch doctors'));
    } finally {
      setIsDoctorsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDoctorsAndDepartments();
  }, [loadDoctorsAndDepartments]);

  // Doctors filtered by selected department
  const displayedDoctors = useMemo(() => {
    if (selectedDeptId === 'all') return doctors;
    return doctors.filter((d) => d.department_id === selectedDeptId);
  }, [doctors, selectedDeptId]);

  // Adjust selectedDoctorId if displayedDoctors changes
  useEffect(() => {
    if (displayedDoctors.length > 0) {
      if (!selectedDoctorId || !displayedDoctors.some((d) => d.id === selectedDoctorId)) {
        setSelectedDoctorId(displayedDoctors[0].id);
      }
    } else {
      setSelectedDoctorId(null);
    }
  }, [displayedDoctors, selectedDoctorId]);

  const loadDoctorSchedule = useCallback(async (docId: number) => {
    setIsLoading(true);
    setError(null);
    setSaveSuccess(false);
    try {
      const data = await doctorsApi.getSchedule(docId);
      setScheduleData(data);

      const grouped: { [key: number]: Array<{ start_time: string; end_time: string }> } = {};
      for (let i = 0; i <= 6; i++) grouped[i] = [];

      (data.office_hours || []).forEach((h) => {
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
      setEditableSchedules(formatted);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load doctor schedule'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDoctorId) {
      loadDoctorSchedule(selectedDoctorId);
    } else {
      setScheduleData(null);
      setEditableSchedules([]);
    }
  }, [selectedDoctorId, loadDoctorSchedule]);

  const applyStandardPreset = () => {
    const standard: WeekdaySchedule[] = [1, 2, 3, 4, 5].map((weekday) => ({
      weekday,
      intervals: [{ start_time: '09:00', end_time: '17:00' }],
    }));
    setEditableSchedules(standard);
  };

  const addInterval = (weekday: number) => {
    setEditableSchedules((prev) => {
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

  const removeInterval = (weekday: number, index: number) => {
    setEditableSchedules((prev) =>
      prev
        .map((s) => {
          if (s.weekday !== weekday) return s;
          const updated = s.intervals.filter((_, idx) => idx !== index);
          return { ...s, intervals: updated };
        })
        .filter((s) => s.intervals.length > 0)
    );
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
        const updated = s.intervals.map((intv, idx) => {
          if (idx !== index) return intv;
          return { ...intv, [field]: value };
        });
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
      const res = await doctorsApi.updateOfficeHours(selectedDoctorId, editableSchedules, true);
      if (res.affected_appointments && res.affected_appointments.length > 0) {
        setPreviewConflicts(res.affected_appointments);
      } else {
        await handleConfirmCommit();
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to save doctor schedule'));
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
      setError(getErrorMessage(err, 'Failed to commit schedule changes'));
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
      setLeaveError(getErrorMessage(err, 'Failed to book leave'));
    } finally {
      setIsBookingLeave(false);
    }
  };

  const activeDoc = doctors.find((d) => d.id === selectedDoctorId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <span className="eyebrow mb-1 block">Staff Administration</span>
          <h1 className="font-serif text-3xl font-semibold text-[#17223a] tracking-tight">
            Doctor Schedules & Availability
          </h1>
          <p className="text-xs sm:text-sm text-[#6c747f] mt-1 font-normal">
            Admin oversight: configure recurring shifts or book emergency leaves for clinical staff.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <select
            value={selectedDeptId}
            onChange={(e) => {
              const val = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
              setSelectedDeptId(val);
            }}
            aria-label="Filter by department"
            disabled={isDoctorsLoading}
            className="px-3 py-2 bg-white/95 border border-[#dfdcd7] rounded-lg text-xs font-medium text-[#17223a] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#204079]/20"
          >
            <option value="all">All Departments ({doctors.length} Doctors)</option>
            {departments.map((dept) => {
              const count = doctors.filter((d) => d.department_id === dept.id).length;
              return (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({count})
                </option>
              );
            })}
          </select>

          {/* Doctor Selector */}
          <select
            value={selectedDoctorId || ''}
            onChange={(e) => setSelectedDoctorId(parseInt(e.target.value))}
            disabled={isDoctorsLoading || displayedDoctors.length === 0}
            aria-label="Select doctor"
            className="px-3.5 py-2 bg-white/95 border border-[#dfdcd7] rounded-lg text-sm font-semibold text-[#17223a] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#204079]/20 min-w-[200px]"
          >
            {isDoctorsLoading ? (
              <option value="">Loading doctors...</option>
            ) : displayedDoctors.length === 0 ? (
              <option value="">No doctors found</option>
            ) : selectedDeptId === 'all' ? (
              departments
                .map((dept) => {
                  const deptDocs = displayedDoctors.filter((d) => d.department_id === dept.id);
                  if (deptDocs.length === 0) return null;
                  return (
                    <optgroup key={dept.id} label={dept.name}>
                      {deptDocs.map((d) => (
                        <option key={d.id} value={d.id}>
                          {formatDoctorName(d.email)}
                        </option>
                      ))}
                    </optgroup>
                  );
                })
                .concat(
                  displayedDoctors.filter((d) => !d.department_id).length > 0 ? (
                    <optgroup key="other" label="General / Unassigned">
                      {displayedDoctors
                        .filter((d) => !d.department_id)
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {formatDoctorName(d.email)}
                          </option>
                        ))}
                    </optgroup>
                  ) : []
                )
            ) : (
              displayedDoctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {formatDoctorName(d.email)}
                </option>
              ))
            )}
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
            disabled={!selectedDoctorId}
            leftIcon={<Calendar className="w-4 h-4" />}
          >
            Book Leave
          </Button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-[#e8f5f0] border border-[#b8dfd0] rounded-xl text-[#1f6b4e] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#1f6b4e] shrink-0" />
          <span>Doctor shifts updated successfully.</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-[#fcedea] border border-[#f7c2bb] rounded-xl text-[#ab2b1a] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {doctorsError && (
        <div className="p-4 bg-[#fcedea] border border-[#f7c2bb] rounded-xl text-[#ab2b1a] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{doctorsError}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={loadDoctorsAndDepartments}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Retry Loading Doctors
          </Button>
        </div>
      )}

      {/* Main Content Area */}
      {isDoctorsLoading ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-[#6c747f]">
            <Loader2 className="w-8 h-8 animate-spin text-[#204079] mb-3" />
            <p className="text-sm font-medium text-[#17223a]">Loading doctor directories...</p>
            <p className="text-xs text-[#6c747f] mt-1">Fetching clinical departments and active practitioners</p>
          </div>
        </Card>
      ) : doctors.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-[#f0ebe1] flex items-center justify-center text-[#6c747f] mb-3">
              <UserPlus className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-[#17223a]">No Doctors Registered</h3>
            <p className="text-xs text-[#6c747f] max-w-sm mt-1 mb-4">
              There are currently no active doctors registered in the system. Invite a doctor to begin configuring clinical schedules and availability.
            </p>
            <Button
              size="sm"
              onClick={() => setIsInviteModalOpen(true)}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Invite Doctor
            </Button>
          </div>
        </Card>
      ) : displayedDoctors.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm font-medium text-[#17223a]">No doctors assigned to this department</p>
            <p className="text-xs text-[#6c747f] mt-1 mb-3">Select another department or view all doctors.</p>
            <Button size="sm" variant="outline" onClick={() => setSelectedDeptId('all')}>
              Show All Doctors
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Shifts Card */}
          <Card
            title={`Weekly Operating Hours: ${activeDoc ? formatDoctorName(activeDoc.email) : ''}`}
            subtitle={`Clinical Specialty: ${activeDoc?.department_name || 'General Medicine'}`}
            headerAction={
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={applyStandardPreset}
                  leftIcon={<Sparkles className="w-3.5 h-3.5 text-[var(--accent-gap)]" />}
                >
                  Standard Preset (Mon-Fri 9-5)
                </Button>
                <Button size="sm" onClick={handleSave} isLoading={isSaving}>
                  Save Changes
                </Button>
              </div>
            }
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-[#6c747f]">
                <Loader2 className="w-6 h-6 animate-spin text-[#204079] mb-2" />
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
                          <span className="text-xs text-[#9e9689] italic">No operating hours</span>
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
                                title="Remove shift"
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
            {!scheduleData || (scheduleData.upcoming_time_off || []).length === 0 ? (
              <p className="text-xs text-[#6c747f] py-4 text-center">No scheduled leaves for this practitioner.</p>
            ) : (
              <div className="space-y-2">
                {(scheduleData.upcoming_time_off || []).map((leave) => (
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
                    <span className="px-2.5 py-0.5 rounded-full bg-[#f0eaf8] text-[#5e3592] border border-[#dcceef] text-[11px] font-semibold">
                      Scheduled Leave
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

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
          <div className="p-3.5 bg-[#fef3eb] border border-[#fcd5b8] rounded-xl text-[#c95908] text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-[#c95908] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#17223a] text-sm">
                Warning: {previewConflicts?.length} Bookings Will Be Cancelled
              </p>
              <p className="mt-0.5 text-[#6c747f] leading-relaxed">
                Updating this doctor&apos;s working hours will cancel overlapping patient appointments.
              </p>
            </div>
          </div>

          <div className="border border-[#dfdcd7] rounded-xl divide-y divide-[#dfdcd7] max-h-48 overflow-y-auto text-xs bg-white">
            {previewConflicts?.map((c) => (
              <div key={c.id} className="p-2.5 flex items-center justify-between">
                <div>
                  <span className="font-serif font-semibold text-[#17223a]">Appointment #{c.id}</span>
                  <span className="text-[#6c747f] ml-2">Patient ID #{c.patient_id}</span>
                </div>
                <span className="text-[#17223a] font-serif tabular-nums">{formatDateTime(c.starts_at)}</span>
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
            <div className="p-3 bg-[#fcedea] border border-[#f7c2bb] rounded-xl text-[#ab2b1a] text-xs flex items-center gap-2">
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
          loadDoctorsAndDepartments();
        }}
      />
    </div>
  );
};
