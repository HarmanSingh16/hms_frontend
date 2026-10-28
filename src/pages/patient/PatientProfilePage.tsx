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
        <span className="eyebrow mb-1 block">Patient Portal</span>
        <h1 className="font-serif text-3xl font-semibold text-[#17223a] tracking-tight">
          My Profile
        </h1>
        <p className="text-xs sm:text-sm text-[#6c747f] mt-1 font-normal">
          Review your demographic record and maintain up-to-date contact information.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-[#e8f5f0] border border-[#b8dfd0] rounded-xl text-[#1f6b4e] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#1f6b4e] shrink-0" />
          <span>Contact information saved successfully.</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-[#fcedea] border border-[#f7c2bb] rounded-xl text-[#ab2b1a] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#6c747f]">
          <Loader2 className="w-8 h-8 animate-spin text-[#204079] mb-2" />
          <p className="text-xs">Loading profile...</p>
        </div>
      ) : profile ? (
        <Card title="Demographic Record">
          <form onSubmit={handleSave} className="space-y-4">
            {/* Read Only Demographics */}
            <div className="bg-[#f0ebe1]/70 p-4 rounded-xl border border-[#dfdcd7] grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#6c747f] text-[11px] uppercase tracking-wider block">Full Legal Name</span>
                <p className="font-semibold text-[#17223a] text-sm mt-0.5">
                  {profile.first_name} {profile.last_name}
                </p>
              </div>

              <div>
                <span className="text-[#6c747f] text-[11px] uppercase tracking-wider block">Date of Birth</span>
                <p className="font-serif font-semibold tabular-nums text-[#17223a] text-sm mt-0.5">
                  {profile.date_of_birth}
                </p>
              </div>

              <div>
                <span className="text-[#6c747f] text-[11px] uppercase tracking-wider block">Email Address</span>
                <p className="font-medium text-[#17223a] mt-0.5">{profile.email}</p>
              </div>

              <div>
                <span className="text-[#6c747f] text-[11px] uppercase tracking-wider block">Account Status</span>
                <p className="font-semibold text-[#1f6b4e] capitalize mt-0.5">
                  {profile.status}
                </p>
              </div>
            </div>

            {/* Editable Contact Info */}
            <div className="space-y-4 pt-2">
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#204079]">
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
                <label className="block text-xs font-semibold text-[#17223a] uppercase tracking-wider mb-1.5">
                  Residential Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 bg-white/95 border border-[#dfdcd7] rounded-lg text-[#17223a] text-sm shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#204079]/20 focus:border-[#204079] resize-none"
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
