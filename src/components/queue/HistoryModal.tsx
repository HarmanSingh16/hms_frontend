import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { appointmentsApi } from '../../api/appointments';
import { AppointmentStatusEventResponse } from '../../types/api';
import { formatDateTime } from '../../utils/date';
import { getStatusBadgeClass, getStatusLabel, formatDoctorName } from '../../utils/formatters';
import { Clock, User, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { getErrorMessage } from '../../utils/errors';

interface HistoryModalProps {
  appointmentId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  appointmentId,
  isOpen,
  onClose,
}) => {
  const [history, setHistory] = useState<AppointmentStatusEventResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && appointmentId) {
      setLoading(true);
      setError(null);
      appointmentsApi
        .getHistory(appointmentId)
        .then((data) => setHistory(data))
        .catch((err) => setError(getErrorMessage(err, 'Failed to load transition history')))
        .finally(() => setLoading(false));
    } else {
      setHistory([]);
    }
  }, [isOpen, appointmentId]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Appointment #${appointmentId} Lifecycle Timeline`}
      maxWidth="lg"
      footer={
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      }
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-[#6c747f]">
          <Loader2 className="w-8 h-8 animate-spin text-[#204079] mb-2" />
          <p className="text-sm">Fetching audit trail...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-[#fcedea] border border-[#f7c2bb] rounded-xl text-[#ab2b1a] text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : history.length === 0 ? (
        <p className="text-center text-[#6c747f] py-8 text-sm">No transition events recorded.</p>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#dfdcd7]">
          {history.map((item) => (
            <div key={item.id} className="relative group">
              {/* Dot */}
              <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-white bg-[#204079] shadow-2xs" />

              <div className="bg-[#faf6f0] p-4 rounded-xl border border-[#dfdcd7]">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                  <div className="flex items-center gap-2">
                    {item.from_status ? (
                      <>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${getStatusBadgeClass(
                            item.from_status
                          )}`}
                        >
                          {getStatusLabel(item.from_status)}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#6c747f]" />
                      </>
                    ) : (
                      <span className="text-xs text-[#6c747f] italic">Initial State:</span>
                    )}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getStatusBadgeClass(
                        item.to_status
                      )}`}
                    >
                      {getStatusLabel(item.to_status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-serif tabular-nums text-[#6c747f]">
                    <Clock className="w-3.5 h-3.5 text-[#6c747f]" />
                    <span>{formatDateTime(item.created_at)}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-[#17223a]">
                  {item.changed_by_email && (
                    <div className="flex items-center gap-1.5 font-medium text-[#17223a]">
                      <User className="w-3.5 h-3.5 text-[#6c747f]" />
                      <span>
                        {item.changed_by_email.toLowerCase().includes('dr')
                          ? formatDoctorName(item.changed_by_email)
                          : item.changed_by_email}
                      </span>
                    </div>
                  )}
                  {item.reason && (
                    <div className="bg-white p-2.5 rounded-lg border border-[#dfdcd7] mt-2 text-[#17223a]">
                      <span className="font-semibold text-[#6c747f]">Reason / Trigger:</span>{' '}
                      {item.reason}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};
