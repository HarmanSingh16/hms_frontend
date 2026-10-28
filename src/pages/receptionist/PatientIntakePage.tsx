import React, { useState } from 'react';
import { patientsApi } from '../../api/patients';
import { Patient } from '../../types/api';
import { generateSamplePatient } from '../../utils/demoData';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { BookingWizardModal } from '../../components/booking/BookingWizardModal';
import { getErrorMessage } from '../../utils/errors';
import {
  UserPlus,
  Sparkles,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Phone,
  Mail,
} from 'lucide-react';

export const PatientIntakePage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('Other');
  const [address, setAddress] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredPatient, setRegisteredPatient] = useState<Patient | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const handleFillSample = () => {
    const sample = generateSamplePatient();
    setFirstName(sample.first_name);
    setLastName(sample.last_name);
    setEmail(sample.email);
    setDob(sample.date_of_birth);
    setPhone(sample.phone_number);
    setGender(sample.gender);
    setAddress(sample.address);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !dob || !phone) {
      setError('Please fill in all required fields.');
      return;
    }

    // Validate DOB strictly in past
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime()) || birthDate >= new Date()) {
      setError('Date of birth must be a valid date strictly in the past.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const patient = await patientsApi.registerIntake({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        date_of_birth: dob,
        phone_number: phone.trim(),
        gender,
        address: address.trim() || undefined,
      });

      setRegisteredPatient(patient);
      // Clear form
      setFirstName('');
      setLastName('');
      setEmail('');
      setDob('');
      setPhone('');
      setAddress('');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to register patient intake.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="eyebrow mb-1 block">Front Desk Operations</span>
          <h1 className="font-serif text-3xl font-semibold text-[#17223a] tracking-tight">
            Patient Intake
          </h1>
          <p className="text-xs sm:text-sm text-[#6c747f] mt-1 font-normal">
            Register a new patient profile. Generates a 48h account activation invite automatically.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleFillSample}
          leftIcon={<Sparkles className="w-3.5 h-3.5 text-[var(--accent-gap)]" />}
        >
          Fill Sample Patient
        </Button>
      </div>

      {/* Success Card */}
      {registeredPatient && (
        <div className="bg-[#e8f5f0] border border-[#b8dfd0] rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-[#1f6b4e] font-semibold text-sm">
            <CheckCircle2 className="w-5 h-5 text-[#1f6b4e]" />
            <span className="font-serif text-base">Patient Intake Completed Successfully!</span>
          </div>

          <div className="bg-white/90 p-4 rounded-lg border border-[#b8dfd0] grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-[#6c747f] text-[11px] uppercase tracking-wider block">Full Name</span>
              <p className="font-semibold text-[#17223a] mt-0.5">
                {registeredPatient.first_name} {registeredPatient.last_name}
              </p>
            </div>
            <div>
              <span className="text-[#6c747f] text-[11px] uppercase tracking-wider block">Account ID</span>
              <p className="font-serif font-semibold text-[#204079] mt-0.5">#{registeredPatient.account_id}</p>
            </div>
            <div>
              <span className="text-[#6c747f] text-[11px] uppercase tracking-wider block">Status</span>
              <p className="font-semibold text-[#5e3592] capitalize mt-0.5">{registeredPatient.status}</p>
            </div>
            <div>
              <span className="text-[#6c747f] text-[11px] uppercase tracking-wider flex items-center gap-1">
                <Mail className="w-3 h-3 text-[#6c747f]" /> Email
              </span>
              <p className="font-medium text-[#17223a] mt-0.5">{registeredPatient.email}</p>
            </div>
            <div>
              <span className="text-[#6c747f] text-[11px] uppercase tracking-wider flex items-center gap-1">
                <Phone className="w-3 h-3 text-[#6c747f]" /> Phone
              </span>
              <p className="font-medium text-[#17223a] mt-0.5">{registeredPatient.phone_number}</p>
            </div>
            <div>
              <span className="text-[#6c747f] text-[11px] uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#6c747f]" /> Date of Birth
              </span>
              <p className="font-medium text-[#17223a] mt-0.5">{registeredPatient.date_of_birth}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-[#1f6b4e] font-medium">
              Account activation link dispatched to patient email.
            </p>
            <Button
              size="sm"
              onClick={() => setIsBookingOpen(true)}
              leftIcon={<Calendar className="w-3.5 h-3.5" />}
              className="bg-[#204079] text-[#faf6f0]"
            >
              Book Appointment Now
            </Button>
          </div>
        </div>
      )}

      {/* Intake Form */}
      <Card title="Demographic Information" subtitle="All fields marked with * are required">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-[#fcedea] border border-[#f7c2bb] rounded-xl text-[#ab2b1a] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name *"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Sarah"
              required
            />

            <Input
              label="Last Name *"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Parker"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address *"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah.parker@example.com"
              required
            />

            <Input
              label="Phone Number (10-12 digits) *"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="5551234567"
              required
              minLength={10}
              maxLength={12}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date of Birth (in the past) *"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-[#17223a] uppercase tracking-wider mb-1.5">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3.5 py-2 bg-white/95 border border-[#dfdcd7] rounded-lg text-[#17223a] text-sm shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#204079]/20 focus:border-[#204079]"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-Binary">Non-Binary</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#17223a] uppercase tracking-wider mb-1.5">
              Residential Address
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="456 Oak Avenue, Apt 2B, Springfield"
              rows={2}
              className="w-full px-3.5 py-2 bg-white/95 border border-[#dfdcd7] rounded-lg text-[#17223a] text-sm shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#204079]/20 focus:border-[#204079] resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              isLoading={isLoading}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Complete Patient Intake
            </Button>
          </div>
        </form>
      </Card>

      {/* Booking Wizard with Preselected Patient */}
      <BookingWizardModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        preselectedPatient={registeredPatient}
      />
    </div>
  );
};
