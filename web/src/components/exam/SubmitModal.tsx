/**
 * Submit Confirmation Modal
 * Shows final review before exam submission
 */

import { useExamStore } from '../../store/examStore';
import './SubmitModal.css';

interface SubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  encryptionStatus?: string;
  encryptionChecksum?: string;
}

export function SubmitModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isSubmitting,
  encryptionStatus,
  encryptionChecksum
}: SubmitModalProps) {
  const getProgress = useExamStore((state) => state.getProgress);

  if (!isOpen) return null;

  const progress = getProgress();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚠️ Submit Exam</h2>
        </div>

        <div className="modal-body">
          <p className="warning-text">
            Are you sure you want to submit your exam? This action cannot be undone.
          </p>

          <div className="progress-summary-modal">
            <div className="summary-row">
              <span className="summary-label">Total Questions:</span>
              <span className="summary-value">{progress.total}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Answered:</span>
              <span className="summary-value answered">{progress.answered}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Unanswered:</span>
              <span className="summary-value unanswered">{progress.unanswered}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Flagged for Review:</span>
              <span className="summary-value flagged">{progress.flagged}</span>
            </div>
            <div className="summary-row completion">
              <span className="summary-label">Completion:</span>
              <span className="summary-value">{progress.percentage}%</span>
            </div>
          </div>

          {progress.unanswered > 0 && (
            <div className="unanswered-warning">
              ⚠️ You have {progress.unanswered} unanswered question(s). Once submitted, you cannot
              make changes.
            </div>
          )}

          {/* Encryption status */}
          {encryptionStatus && (
            <div className="encryption-status">
              <div className="encryption-status-text">
                🔒 {encryptionStatus}
              </div>
              {encryptionChecksum && (
                <div className="encryption-checksum">
                  <span className="checksum-label">Checksum:</span>
                  <code className="checksum-value">
                    {encryptionChecksum.substring(0, 16)}...
                  </code>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Go Back
          </button>
          <button
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                {encryptionStatus || 'Submitting...'}
              </>
            ) : (
              'Yes, Submit Exam'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
