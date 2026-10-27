import React, { useState, useEffect, useCallback } from 'react';
import { patientsApi } from '../../api/patients';
import { Patient } from '../../types/api';
import { formatPhoneNumber, getAccountStatusBadgeClass } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { BookingWizardModal } from '../../components/booking/BookingWizardModal';
import { getErrorMessage } from '../../utils/errors';
import { Search, Calendar, Edit2, Loader2, AlertCircle } from 'lucide-react';

export const PatientDirectoryPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking modal target
  const [bookingTarget, setBookingTarget] = useState<Patient | null>(null);

  // Edit patient modal
  const [editTarget, setEditTarget] = useState<Patient | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const fetchPatients = useCallback(async (searchQuery: string, pageNum: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await patientsApi.search(searchQuery, pageNum, 20);
      setPatients(res.patients);
      setTotalCount(res.total_count);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to search patients directory'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients(query.trim(), page);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, page, fetchPatients]);

  const openEditModal = (p: Patient) => {
    setEditTarget(p);
    setEditFirstName(p.first_name);
    setEditLastName(p.last_name);
    setEditPhone(p.phone_number);
    setEditDob(p.date_of_birth);
    setEditAddress(p.address || '');
    setUpdateError(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;

    setIsUpdating(true);
    setUpdateError(null);

    try {
      const updated = await patientsApi.update(editTarget.account_id, {
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        phone_number: editPhone.trim(),
        date_of_birth: editDob,
        address: editAddress.trim() || undefined,
      });

      setPatients((prev) =>
        prev.map((item) => (item.account_id === updated.account_id ? updated : item))
      );
      setEditTarget(null);
    } catch (err: unknown) {
      setUpdateError(getErrorMessage(err, 'Failed to update patient'));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patient Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Search patient records, schedule consultations, and maintain contact information.
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-500 shadow-2xs"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Directory Table */}
      <Card>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-sky-600 mb-2" />
            <p className="text-xs">Searching patient database...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-200">
            No patients match your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] tracking-wider border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Date of Birth</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((p) => (
                  <tr key={p.account_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                      {p.first_name} {p.last_name}
                      <span className="text-[10px] text-slate-400 font-mono ml-2">
                        #{p.account_id}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-700">
                        {formatPhoneNumber(p.phone_number)}
                      </div>
                      <div className="text-[11px] text-slate-400">{p.email}</div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">{p.date_of_birth}</td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getAccountStatusBadgeClass(
                          p.status
                        )}`}
                      >
                        {p.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setBookingTarget(p)}
                        leftIcon={<Calendar className="w-3.5 h-3.5" />}
                      >
                        Book Visit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(p)}
                        leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalCount > 20 && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Showing page {page} of {Math.ceil(totalCount / 20)}</span>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= Math.ceil(totalCount / 20)}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Booking Wizard with Patient Preselected */}
      <BookingWizardModal
        isOpen={!!bookingTarget}
        preselectedPatient={bookingTarget}
        onClose={() => setBookingTarget(null)}
      />

      {/* Edit Patient Demographics Modal */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Patient Demographics"
        maxWidth="md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditTarget(null)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleUpdate} isLoading={isUpdating}>
              Save Demographics
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          {updateError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{updateError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              value={editFirstName}
              onChange={(e) => setEditFirstName(e.target.value)}
              required
            />
            <Input
              label="Last Name"
              value={editLastName}
              onChange={(e) => setEditLastName(e.target.value)}
              required
            />
          </div>

          <Input
            label="Phone Number"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
            required
          />

          <Input
            label="Date of Birth"
            type="date"
            value={editDob}
            onChange={(e) => setEditDob(e.target.value)}
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Residential Address
            </label>
            <textarea
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 resize-none"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
