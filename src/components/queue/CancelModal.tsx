import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { AlertTriangle } from 'lucide-react';

interface CancelModalProps {
  isOpen: boolean;
  appointmentId: number | null;
  patientName?: string;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export const CancelModal: React.FC<CancelModalProps> = ({
  isOpen,
  appointmentId,
  patientName,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 3) {
      setError('Please provide a reason of at least 3 characters.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await onConfirm(reason.trim());
      setReason('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to cancel appointment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cancel Appointment"
      maxWidth="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Keep Appointment
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={reason.trim().length < 3}
          >
            Confirm Cancellation
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">Are you sure you want to cancel?</p>
            <p className="mt-0.5">
              Cancelling appointment #{appointmentId}
              {patientName ? ` for ${patientName}` : ''} will revoke scheduled reminder notifications
              and release the doctor&apos;s 15-minute slot.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Reason for Cancellation <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g., Patient called with personal emergency, rescheduled, etc."
            rows={3}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-500 resize-none"
            required
            minLength={3}
            maxLength={500}
          />
          <p className="text-xs text-slate-500 mt-1">Minimum 3 characters required.</p>
        </div>

        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
      </form>
    </Modal>
  );
};
