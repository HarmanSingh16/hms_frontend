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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patient Intake</h1>
          <p className="text-xs text-slate-500 mt-1">
            Register a new patient profile. Generates a 48h account activation invite automatically.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleFillSample}
          leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}
        >
          Fill Sample Patient
        </Button>
      </div>

      {/* Success Card */}
      {registeredPatient && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Patient Intake Completed Successfully!</span>
          </div>

          <div className="bg-white p-4 rounded-lg border border-emerald-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-400">Full Name</span>
              <p className="font-semibold text-slate-800">
                {registeredPatient.first_name} {registeredPatient.last_name}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Account ID</span>
              <p className="font-semibold text-slate-800">#{registeredPatient.account_id}</p>
            </div>
            <div>
              <span className="text-slate-400">Status</span>
              <p className="font-semibold text-purple-600 capitalize">{registeredPatient.status}</p>
            </div>
            <div>
              <span className="text-slate-400 flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email
              </span>
              <p className="font-medium text-slate-700">{registeredPatient.email}</p>
            </div>
            <div>
              <span className="text-slate-400 flex items-center gap-1">
                <Phone className="w-3 h-3" /> Phone
              </span>
              <p className="font-medium text-slate-700">{registeredPatient.phone_number}</p>
            </div>
            <div>
              <span className="text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Date of Birth
              </span>
              <p className="font-medium text-slate-700">{registeredPatient.date_of_birth}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-emerald-700">
              Account activation link dispatched to patient email.
            </p>
            <Button
              size="sm"
              onClick={() => setIsBookingOpen(true)}
              leftIcon={<Calendar className="w-3.5 h-3.5" />}
              className="bg-emerald-600 hover:bg-emerald-700"
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
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-500"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-Binary">Non-Binary</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Residential Address
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="456 Oak Avenue, Apt 2B, Springfield"
              rows={2}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-500 resize-none"
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
