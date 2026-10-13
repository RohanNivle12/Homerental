import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { inquiryApi } from '../../services/api';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';

interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyTitle: string;
  ownerName: string;
}

export const InquiryModal: React.FC<InquiryModalProps> = ({
  isOpen,
  onClose,
  propertyId,
  propertyTitle,
  ownerName,
}) => {
  const [message, setMessage] = useState(
    `Hello ${ownerName}, I am interested in your property "${propertyTitle}". Is it currently available for rent?`
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!message.trim()) {
      setError('Please write a message.');
      return;
    }

    setLoading(true);
    try {
      await inquiryApi.createInquiry(propertyId, message);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit inquiry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Contact Property Owner">
      {success ? (
        <div className="py-8 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h4 className="text-lg font-bold text-slate-800">Inquiry Sent Successfully!</h4>
          <p className="text-sm text-slate-500">
            {ownerName} has been notified and will reply shortly. Check your tenant dashboard for responses.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-900">
            Sending inquiry for: <strong className="font-semibold">{propertyTitle}</strong>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Your Message to Landlord
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 resize-none"
              placeholder="Ask questions about maintenance, availability date, lease period, etc."
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {loading ? <LoadingSpinner size="sm" /> : <Send className="w-4 h-4" />}
              Send Inquiry
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
