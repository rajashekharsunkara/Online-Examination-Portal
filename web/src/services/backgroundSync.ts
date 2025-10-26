/**
 * Background Sync Service
 * Handles synchronization of queued checkpoints when connection is restored
 */

import { idbService } from './idb';
import { websocketService } from './websocket';
import { offlineService } from './offline';
import type { ConnectionStatus } from './offline';

interface SyncProgress {
  total: number;
  synced: number;
  failed: number;
  inProgress: boolean;
}

type SyncListener = (progress: SyncProgress) => void;

class BackgroundSyncService {
  private syncInProgress = false;
  private listeners: Set<SyncListener> = new Set();
  private progress: SyncProgress = {
    total: 0,
    synced: 0,
    failed: 0,
    inProgress: false,
  };
  private maxRetries = 3;
  private retryDelay = 2000; // 2 seconds

  constructor() {
    this.init();
  }

  /**
   * Initialize service
   */
  private init(): void {
    // Subscribe to connection status changes
    offlineService.subscribe(this.handleConnectionChange);
  }

  /**
   * Handle connection status change
   */
  private handleConnectionChange = async (status: ConnectionStatus): Promise<void> => {
    if (status === 'online' && !this.syncInProgress) {
      console.log('Connection restored, starting background sync...');
      await this.syncAll();
    }
  };

  /**
   * Subscribe to sync progress updates
   */
  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current sync progress
   */
  getProgress(): SyncProgress {
    return { ...this.progress };
  }

  /**
   * Sync all queued checkpoints
   */
  async syncAll(): Promise<void> {
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    if (!offlineService.isOnline()) {
      console.log('Cannot sync while offline');
      return;
    }

    try {
      this.syncInProgress = true;
      await idbService.setSyncStatus('syncing');

      // Get all queued checkpoints
      const checkpoints = await idbService.getQueuedCheckpoints();

      if (checkpoints.length === 0) {
        console.log('No checkpoints to sync');
        this.updateProgress({ total: 0, synced: 0, failed: 0, inProgress: false });
        return;
      }

      console.log(`Syncing ${checkpoints.length} checkpoints...`);
      this.updateProgress({
        total: checkpoints.length,
        synced: 0,
        failed: 0,
        inProgress: true,
      });

      // Sync checkpoints one by one (to maintain order)
      for (const checkpoint of checkpoints) {
        if (!offlineService.isOnline()) {
          console.log('Connection lost during sync, pausing...');
          break;
        }

        await this.syncCheckpoint(checkpoint);
      }

      // Update last sync time
      await idbService.setLastSyncTime(new Date());
      await idbService.setSyncStatus('idle');

      console.log(
        `Sync complete: ${this.progress.synced} synced, ${this.progress.failed} failed`
      );
    } catch (error) {
      console.error('Sync failed:', error);
      await idbService.setSyncStatus('error');
    } finally {
      this.syncInProgress = false;
      this.updateProgress({ ...this.progress, inProgress: false });
    }
  }

  /**
   * Sync a single checkpoint
   */
  private async syncCheckpoint(checkpoint: any): Promise<void> {
    try {
      // Send checkpoint via WebSocket
      const success = await this.sendWithRetry(checkpoint);

      if (success) {
        // Remove from queue
        await idbService.removeCheckpointFromQueue(checkpoint.key);

        // Update progress
        this.updateProgress({
          ...this.progress,
          synced: this.progress.synced + 1,
        });

        console.log(`Synced checkpoint: ${checkpoint.key}`);
      } else {
        // Mark as failed if max retries exceeded
        if (checkpoint.retryCount >= this.maxRetries) {
          await idbService.removeCheckpointFromQueue(checkpoint.key);
          this.updateProgress({
            ...this.progress,
            failed: this.progress.failed + 1,
          });
          console.error(
            `Failed to sync checkpoint after ${this.maxRetries} retries: ${checkpoint.key}`
          );
        }
      }
    } catch (error) {
      console.error(`Error syncing checkpoint ${checkpoint.key}:`, error);
      await idbService.incrementCheckpointRetry(
        checkpoint.key,
        error instanceof Error ? error.message : 'Unknown error'
      );

      this.updateProgress({
        ...this.progress,
        failed: this.progress.failed + 1,
      });
    }
  }

  /**
   * Send checkpoint with retry logic
   */
  private async sendWithRetry(checkpoint: any, attempt: number = 0): Promise<boolean> {
    try {
      // Check if WebSocket is connected
      if (!websocketService.isConnected()) {
        console.log('WebSocket not connected, cannot sync checkpoint');
        return false;
      }

      // Send checkpoint
      websocketService.sendCheckpoint(
        checkpoint.questionId,
        checkpoint.answer,
        checkpoint.isFlagged,
        checkpoint.timeSpentSeconds,
        checkpoint.sequence
      );

      // Wait for acknowledgment (simplified - in real implementation, wait for actual ack)
      await this.waitForAck(checkpoint.key);

      return true;
    } catch (error) {
      console.error(`Sync attempt ${attempt + 1} failed:`, error);

      if (attempt < this.maxRetries) {
        // Wait before retry with exponential backoff
        await this.delay(this.retryDelay * Math.pow(2, attempt));
        return this.sendWithRetry(checkpoint, attempt + 1);
      }

      return false;
    }
  }

  /**
   * Wait for checkpoint acknowledgment
   */
  private async waitForAck(key: string, timeout: number = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Acknowledgment timeout'));
      }, timeout);

      // In real implementation, listen for checkpoint_ack message
      // For now, just resolve after short delay
      setTimeout(() => {
        clearTimeout(timeoutId);
        resolve();
      }, 500);
    });
  }

  /**
   * Update sync progress and notify listeners
   */
  private updateProgress(progress: Partial<SyncProgress>): void {
    this.progress = { ...this.progress, ...progress };
    this.notifyListeners();
  }

  /**
   * Notify all listeners of progress update
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      listener(this.progress);
    });
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Manually trigger sync
   */
  async manualSync(): Promise<void> {
    console.log('Manual sync triggered');
    await this.syncAll();
  }

  /**
   * Clear sync queue for a specific attempt
   */
  async clearQueue(attemptId: number): Promise<void> {
    await idbService.clearCheckpointQueue(attemptId);
    console.log(`Cleared checkpoint queue for attempt ${attemptId}`);
  }

  /**
   * Get queued checkpoint count
   */
  async getQueuedCount(attemptId?: number): Promise<number> {
    const checkpoints = await idbService.getQueuedCheckpoints(attemptId);
    return checkpoints.length;
  }
}

// Export singleton instance
export const backgroundSyncService = new BackgroundSyncService();
export type { SyncProgress, SyncListener };
