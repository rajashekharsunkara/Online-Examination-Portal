/**
 * Offline Indicator Component
 * Shows connection status and sync progress
 */

import { useOnlineStatus, useBackgroundSync } from '../../hooks/useOffline';
import './OfflineIndicator.css';

export function OfflineIndicator() {
  const { status, isOnline, isOffline, isSlow } = useOnlineStatus();
  const { syncProgress, queuedCount, manualSync, isSyncing } = useBackgroundSync();

  const getStatusColor = () => {
    if (isOffline) return 'red';
    if (isSlow) return 'orange';
    return 'green';
  };

  const getStatusIcon = () => {
    if (isOffline) return '⚠️';
    if (isSlow) return '⏳';
    if (isSyncing) return '🔄';
    return '✓';
  };

  const getStatusText = () => {
    if (isOffline) return 'Offline';
    if (isSlow) return 'Slow Connection';
    if (isSyncing) return 'Syncing...';
    return 'Online';
  };

  const handleSyncClick = async () => {
    if (isOnline && !isSyncing) {
      await manualSync();
    }
  };

  if (isOnline && queuedCount === 0 && !isSyncing) {
    // Don't show indicator when online with nothing to sync
    return null;
  }

  return (
    <div className={`offline-indicator status-${getStatusColor()}`}>
      <div className="indicator-status">
        <span className="status-icon">{getStatusIcon()}</span>
        <span className="status-text">{getStatusText()}</span>
      </div>

      {queuedCount > 0 && (
        <div className="indicator-queue">
          <span className="queue-count">{queuedCount}</span>
          <span className="queue-label">queued change{queuedCount !== 1 ? 's' : ''}</span>
        </div>
      )}

      {isSyncing && (
        <div className="indicator-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${
                  syncProgress.total > 0
                    ? (syncProgress.synced / syncProgress.total) * 100
                    : 0
                }%`,
              }}
            ></div>
          </div>
          <span className="progress-text">
            {syncProgress.synced} / {syncProgress.total}
          </span>
        </div>
      )}

      {isOnline && queuedCount > 0 && !isSyncing && (
        <button className="sync-button" onClick={handleSyncClick}>
          Sync Now
        </button>
      )}

      {isOffline && (
        <div className="indicator-message">
          Your answers are being saved locally and will sync when you're back online.
        </div>
      )}

      {syncProgress.failed > 0 && (
        <div className="indicator-warning">
          {syncProgress.failed} checkpoint{syncProgress.failed !== 1 ? 's' : ''} failed to sync
        </div>
      )}
    </div>
  );
}
