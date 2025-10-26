/**
 * TransferRequestModal Component
 * Modal for students/technicians to request workstation transfer
 */

import React, { useState } from 'react';
import './TransferRequestModal.css';

interface TransferRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  attemptId: number;
  currentWorkstation: string;
  onTransferRequest: (toWorkstation: string, reason: string) => Promise<void>;
}

export const TransferRequestModal: React.FC<TransferRequestModalProps> = ({
  isOpen,
  onClose,
  attemptId,
  currentWorkstation,
  onTransferRequest,
}) => {
  const [toWorkstation, setToWorkstation] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!toWorkstation.trim()) {
      setError('Target workstation is required');
      return;
    }

    if (toWorkstation.trim().length > 50) {
      setError('Workstation ID must be 50 characters or less');
      return;
    }

    if (!reason.trim()) {
      setError('Reason is required');
      return;
    }

    if (reason.trim().length < 10) {
      setError('Reason must be at least 10 characters');
      return;
    }

    if (reason.trim().length > 1000) {
      setError('Reason must be 1000 characters or less');
      return;
    }

    if (toWorkstation.trim().toUpperCase() === currentWorkstation.toUpperCase()) {
      setError('Target workstation must be different from current workstation');
      return;
    }

    try {
      setIsSubmitting(true);
      await onTransferRequest(toWorkstation.trim(), reason.trim());
      
      // Reset form on success
      setToWorkstation('');
      setReason('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to request transfer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setToWorkstation('');
      setReason('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="transfer-modal-overlay" onClick={handleClose}>
      <div className="transfer-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="transfer-modal-header">
          <h2>Request Workstation Transfer</h2>
          <button
            className="transfer-modal-close"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="transfer-modal-form">
          <div className="transfer-modal-info">
            <p>
              <strong>Current Workstation:</strong> {currentWorkstation}
            </p>
            <p>
              <strong>Attempt ID:</strong> {attemptId}
            </p>
          </div>

          <div className="transfer-form-group">
            <label htmlFor="to-workstation">
              Target Workstation <span className="required">*</span>
            </label>
            <input
              id="to-workstation"
              type="text"
              value={toWorkstation}
              onChange={(e) => setToWorkstation(e.target.value)}
              placeholder="e.g., WS-205"
              disabled={isSubmitting}
              maxLength={50}
              required
            />
            <small className="form-hint">
              Enter the workstation ID you want to transfer to
            </small>
          </div>

          <div className="transfer-form-group">
            <label htmlFor="transfer-reason">
              Reason for Transfer <span className="required">*</span>
            </label>
            <textarea
              id="transfer-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please describe the reason for requesting this transfer (minimum 10 characters)"
              disabled={isSubmitting}
              minLength={10}
              maxLength={1000}
              rows={4}
              required
            />
            <small className="form-hint">
              {reason.length}/1000 characters (minimum 10)
            </small>
          </div>

          {error && (
            <div className="transfer-error-message" role="alert">
              {error}
            </div>
          )}

          <div className="transfer-modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Requesting...' : 'Request Transfer'}
            </button>
          </div>
        </form>

        <div className="transfer-modal-footer">
          <p className="transfer-notice">
            <strong>Note:</strong> Transfer requests require approval from the Hall In-Charge.
            You will be notified when your request is approved or rejected.
          </p>
        </div>
      </div>
    </div>
  );
};
