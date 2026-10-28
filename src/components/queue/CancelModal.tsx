import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { AlertTriangle } from 'lucide-react';
import { getErrorMessage } from '../../utils/errors';

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
      setError(getErrorMessage(err, 'Failed to cancel appointment'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cancel Consultation"
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
        <div className="flex items-start gap-3 p-3.5 bg-[#fef3eb] border border-[#fcd5b8] rounded-xl text-[#c95908] text-xs">
          <AlertTriangle className="w-5 h-5 shrink-0 text-[#c95908] mt-0.5" />
          <div>
            <p className="font-semibold text-[#17223a] text-sm">Are you sure you want to cancel?</p>
            <p className="mt-0.5 text-[#6c747f] leading-relaxed">
              Cancelling appointment <strong className="font-serif tabular-nums text-[#17223a]">#{appointmentId}</strong>
              {patientName ? ` for ${patientName}` : ''} will revoke scheduled reminder notifications
              and release the doctor&apos;s 15-minute slot.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#17223a] uppercase tracking-wider mb-1.5">
            Reason for Cancellation <span className="text-[#ab2b1a]">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g., Patient called with personal emergency, rescheduled, etc."
            rows={3}
            className="w-full px-3.5 py-2 text-sm bg-white/95 border border-[#dfdcd7] rounded-lg text-[#17223a] placeholder:text-[#9e9689] focus:outline-none focus:ring-2 focus:ring-[#204079]/20 focus:border-[#204079] resize-none shadow-2xs"
            required
            minLength={3}
            maxLength={500}
          />
          <p className="text-[11px] text-[#6c747f] mt-1">Minimum 3 characters required.</p>
        </div>

        {error && <p className="text-xs text-[#ab2b1a] font-medium">{error}</p>}
      </form>
    </Modal>
  );
};
