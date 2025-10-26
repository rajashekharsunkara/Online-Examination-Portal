/**
 * TransferStatusIndicator Component
 * Displays transfer status and progress for active transfers
 */

import React from 'react';
import './TransferStatusIndicator.css';

export type TransferStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'failed';

interface Transfer {
  id: number;
  status: TransferStatus;
  from_workstation: string;
  to_workstation: string;
  reason?: string;
  created_at: string;
  approved_at?: string;
  completed_at?: string;
  error_message?: string;
}

interface TransferStatusIndicatorProps {
  transfer: Transfer | null;
  isCurrentWorkstation: boolean;
}

export const TransferStatusIndicator: React.FC<TransferStatusIndicatorProps> = ({
  transfer,
  isCurrentWorkstation,
}) => {
  if (!transfer) return null;

  const getStatusIcon = (status: TransferStatus): string => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'approved':
        return '🔄';
      case 'completed':
        return '✅';
      case 'rejected':
        return '❌';
      case 'failed':
        return '⚠️';
      default:
        return '•';
    }
  };

  const getStatusText = (status: TransferStatus): string => {
    switch (status) {
      case 'pending':
        return 'Transfer Pending Approval';
      case 'approved':
        return 'Transfer In Progress';
      case 'completed':
        return 'Transfer Completed';
      case 'rejected':
        return 'Transfer Rejected';
      case 'failed':
        return 'Transfer Failed';
      default:
        return 'Unknown Status';
    }
  };

  const getStatusMessage = (): string => {
    if (transfer.status === 'approved' && !isCurrentWorkstation) {
      return 'Your exam is being transferred. Please wait...';
    }

    if (transfer.status === 'completed' && isCurrentWorkstation) {
      return 'Transfer complete. You can now resume your exam.';
    }

    if (transfer.status === 'pending') {
      return 'Awaiting approval from Hall In-Charge';
    }

    if (transfer.status === 'rejected' && transfer.error_message) {
      return `Reason: ${transfer.error_message}`;
    }

    if (transfer.status === 'failed' && transfer.error_message) {
      return `Error: ${transfer.error_message}`;
    }

    return '';
  };

  const getStatusClass = (status: TransferStatus): string => {
    switch (status) {
      case 'pending':
        return 'transfer-status-pending';
      case 'approved':
        return 'transfer-status-in-progress';
      case 'completed':
        return 'transfer-status-completed';
      case 'rejected':
      case 'failed':
        return 'transfer-status-error';
      default:
        return '';
    }
  };

  // Don't show completed transfers after 5 seconds
  if (transfer.status === 'completed') {
    const completedTime = new Date(transfer.completed_at!).getTime();
    const now = Date.now();
    if (now - completedTime > 5000) {
      return null;
    }
  }

  // Hide rejected/failed transfers after 10 seconds
  if (transfer.status === 'rejected' || transfer.status === 'failed') {
    const statusTime = new Date(transfer.created_at).getTime();
    const now = Date.now();
    if (now - statusTime > 10000) {
      return null;
    }
  }

  return (
    <div className={`transfer-status-indicator ${getStatusClass(transfer.status)}`}>
      <div className="transfer-status-header">
        <span className="transfer-status-icon">
          {getStatusIcon(transfer.status)}
        </span>
        <span className="transfer-status-text">
          {getStatusText(transfer.status)}
        </span>
      </div>

      <div className="transfer-status-details">
        <div className="transfer-workstations">
          <span className="transfer-workstation-label">From:</span>
          <span className="transfer-workstation-value">{transfer.from_workstation}</span>
          <span className="transfer-arrow">→</span>
          <span className="transfer-workstation-label">To:</span>
          <span className="transfer-workstation-value">{transfer.to_workstation}</span>
        </div>

        {getStatusMessage() && (
          <div className="transfer-status-message">
            {getStatusMessage()}
          </div>
        )}

        {transfer.status === 'approved' && (
          <div className="transfer-progress-bar">
            <div className="transfer-progress-bar-fill"></div>
          </div>
        )}
      </div>

      {transfer.status === 'approved' && !isCurrentWorkstation && (
        <div className="transfer-lock-overlay">
          <div className="transfer-lock-message">
            <div className="transfer-lock-icon">🔒</div>
            <h3>Workstation Locked</h3>
            <p>Your exam is being transferred to {transfer.to_workstation}</p>
            <p className="transfer-lock-instruction">
              Please proceed to the new workstation to continue your exam.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
