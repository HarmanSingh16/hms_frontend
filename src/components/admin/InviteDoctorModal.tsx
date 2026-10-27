import React, { useState, useEffect } from 'react';
import { departmentsApi } from '../../api/departments';
import { doctorsApi } from '../../api/doctors';
import { Department, InviteDoctorResponse } from '../../types/api';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Stethoscope, CheckCircle2, AlertCircle } from 'lucide-react';
import { getErrorMessage } from '../../utils/errors';

interface InviteDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const InviteDoctorModal: React.FC<InviteDoctorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [email, setEmail] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InviteDoctorResponse | null>(null);

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
      setResult(null);
      setError(null);
    }
  }, [isOpen, selectedDeptId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !selectedDeptId) {
      setError('Please provide doctor email and select a clinical department.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await doctorsApi.inviteDoctor({
        email: email.trim().toLowerCase(),
        department_id: selectedDeptId,
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
      });

      setResult(res);
      setEmail('');
      setFirstName('');
      setLastName('');
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to send doctor invite'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Clinical Practitioner"
      maxWidth="md"
      footer={
        result ? (
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        ) : (
          <>
            <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit} isLoading={isLoading}>
              Send Doctor Invite
            </Button>
          </>
        )
      }
    >
      {result ? (
        <div className="text-center py-6 space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Doctor Invite Dispatched!</h3>
          <p className="text-xs text-slate-600 max-w-sm mx-auto">
            {result.message || 'Invitation sent successfully. The doctor can activate their account using the link in their email.'}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-xs text-sky-800 flex items-start gap-2">
            <Stethoscope className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-sky-900">Doctor Onboarding</span>
              <p className="mt-0.5">
                Invited doctors receive an email activation link valid for 48 hours to choose their password and set up their clinical schedule.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Doctor Professional Email *"
            type="email"
            placeholder="e.g. dr.watson@hospital.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Clinical Department *
            </label>
            <div className="relative">
              <select
                value={selectedDeptId || ''}
                onChange={(e) => setSelectedDeptId(parseInt(e.target.value))}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-500"
                required
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name (Optional)"
              placeholder="e.g. John"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <Input
              label="Last Name (Optional)"
              placeholder="e.g. Watson"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </form>
      )}
    </Modal>
  );
};
