import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { patientsApi } from '../../api/patients';
import { Patient } from '../../types/api';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { getErrorMessage } from '../../utils/errors';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export const PatientProfilePage: React.FC = () => {
  const { user } = useAuth();
  const patientId = user?.id || 0;

  const [profile, setProfile] = useState<Patient | null>(null);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!patientId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await patientsApi.getById(patientId);
      setProfile(data);
      setPhone(data.phone_number);
      setAddress(data.address || '');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to fetch personal profile'));
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const updated = await patientsApi.update(profile.account_id, {
        first_name: profile.first_name,
        last_name: profile.last_name,
        date_of_birth: profile.date_of_birth,
        phone_number: phone.trim(),
        gender: profile.gender || undefined,
        address: address.trim() || undefined,
      });

      setProfile(updated);
      setSaveSuccess(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to update personal contact info'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Profile</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review your demographic record and maintain up-to-date contact information.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Contact information saved successfully.</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600 mb-2" />
          <p className="text-xs">Loading profile...</p>
        </div>
      ) : profile ? (
        <Card title="Demographic Information">
          <form onSubmit={handleSave} className="space-y-4">
            {/* Read Only Demographics */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400">Full Legal Name</span>
                <p className="font-semibold text-slate-800 text-sm mt-0.5">
                  {profile.first_name} {profile.last_name}
                </p>
              </div>

              <div>
                <span className="text-slate-400">Date of Birth</span>
                <p className="font-semibold text-slate-800 text-sm mt-0.5">
                  {profile.date_of_birth}
                </p>
              </div>

              <div>
                <span className="text-slate-400">Email Address</span>
                <p className="font-medium text-slate-700 mt-0.5">{profile.email}</p>
              </div>

              <div>
                <span className="text-slate-400">Account Status</span>
                <p className="font-semibold text-emerald-600 capitalize mt-0.5">
                  {profile.status}
                </p>
              </div>
            </div>

            {/* Editable Contact Info */}
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Contact Details (Editable)
              </h4>

              <Input
                label="Phone Number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="5551234567"
                required
                minLength={7}
                maxLength={30}
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Residential Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-200 resize-none"
                  placeholder="Street, City, Zip"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" isLoading={isSaving}>
                  Update Contact Info
                </Button>
              </div>
            </div>
          </form>
        </Card>
      ) : null}
    </div>
  );
};
