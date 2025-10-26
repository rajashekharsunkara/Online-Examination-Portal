/**
 * Offline Functionality Hooks
 * Custom React hooks for offline detection and sync management
 */

import { useState, useEffect, useCallback } from 'react';
import { offlineService, type ConnectionStatus, type ConnectionQuality } from '../services/offline';
import { backgroundSyncService, type SyncProgress } from '../services/backgroundSync';
import { idbService } from '../services/idb';

/**
 * Hook to monitor online/offline status
 */
export function useOnlineStatus() {
  const [status, setStatus] = useState<ConnectionStatus>(offlineService.getStatus());
  const [quality, setQuality] = useState<ConnectionQuality | null>(
    offlineService.getQuality()
  );

  useEffect(() => {
    const unsubscribe = offlineService.subscribe((newStatus, newQuality) => {
      setStatus(newStatus);
      setQuality(newQuality || null);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    status,
    quality,
    isOnline: status === 'online',
    isOffline: status === 'offline',
    isSlow: status === 'slow',
  };
}

/**
 * Hook to manage background sync
 */
export function useBackgroundSync() {
  const [syncProgress, setSyncProgress] = useState<SyncProgress>(
    backgroundSyncService.getProgress()
  );
  const [queuedCount, setQueuedCount] = useState(0);

  useEffect(() => {
    const unsubscribe = backgroundSyncService.subscribe((progress) => {
      setSyncProgress(progress);
    });

    // Load initial queued count
    const loadQueuedCount = async () => {
      const count = await backgroundSyncService.getQueuedCount();
      setQueuedCount(count);
    };
    loadQueuedCount();

    // Update queued count periodically
    const interval = setInterval(loadQueuedCount, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const manualSync = useCallback(async () => {
    await backgroundSyncService.manualSync();
  }, []);

  const clearQueue = useCallback(async (attemptId?: number) => {
    await backgroundSyncService.clearQueue(attemptId!);
    const count = await backgroundSyncService.getQueuedCount();
    setQueuedCount(count);
  }, []);

  return {
    syncProgress,
    queuedCount,
    manualSync,
    clearQueue,
    isSyncing: syncProgress.inProgress,
  };
}

/**
 * Hook to manage offline storage
 */
export function useOfflineStorage() {
  const [storageInfo, setStorageInfo] = useState({
    examsCount: 0,
    attemptsCount: 0,
    answersCount: 0,
    queuedCount: 0,
  });

  const loadStorageInfo = useCallback(async () => {
    const info = await idbService.getStorageInfo();
    setStorageInfo(info);
  }, []);

  useEffect(() => {
    loadStorageInfo();

    // Refresh every 10 seconds
    const interval = setInterval(loadStorageInfo, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [loadStorageInfo]);

  const clearAllData = useCallback(async () => {
    await idbService.clearAll();
    await loadStorageInfo();
  }, [loadStorageInfo]);

  return {
    storageInfo,
    clearAllData,
    refreshStorageInfo: loadStorageInfo,
  };
}

/**
 * Hook to manage offline exam data
 */
export function useOfflineExam(attemptId: number) {
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize IndexedDB on mount
  useEffect(() => {
    const initDB = async () => {
      try {
        await idbService.init();
        console.log('IndexedDB initialized for offline support');
        setIsDataLoaded(true);
      } catch (err) {
        console.error('Failed to initialize IndexedDB:', err);
        setError(err instanceof Error ? err.message : 'IndexedDB initialization failed');
      }
    };

    initDB();
  }, []);

  // Save exam data to IndexedDB
  const saveExamData = useCallback(
    async (exam: any, attempt: any, answers: any[] | Record<number, any>) => {
      try {
        await idbService.saveExam(exam);
        await idbService.saveAttempt(attempt);

        // Handle both array and object (answersMap)
        const answersList = Array.isArray(answers) 
          ? answers 
          : Object.entries(answers).map(([questionId, data]) => ({
              question_id: parseInt(questionId),
              answer: data.answer,
              is_flagged: data.isFlagged,
              time_spent_seconds: data.timeSpent,
            }));

        for (const answer of answersList) {
          await idbService.saveAnswer(answer, false); // Already synced
        }

        console.log('Exam data saved to IndexedDB');
      } catch (err) {
        console.error('Failed to save exam data:', err);
      }
    },
    []
  );

  // Load exam data from IndexedDB
  const loadExamData = useCallback(async () => {
    try {
      const attempt = await idbService.getAttempt(attemptId);
      if (!attempt) return null;

      const exam = await idbService.getExam(attempt.exam_id);
      const answers = await idbService.getAnswersByAttempt(attemptId);

      return { exam, attempt, answers };
    } catch (err) {
      console.error('Failed to load exam data:', err);
      return null;
    }
  }, [attemptId]);

  // Queue checkpoint when offline
  const queueCheckpoint = useCallback(
    async (checkpoint: {
      questionId: number;
      answer: any;
      isFlagged: boolean;
      timeSpentSeconds: number;
      sequence: number;
    }) => {
      try {
        await idbService.enqueueCheckpoint({
          attemptId,
          ...checkpoint,
        });

        console.log('Checkpoint queued for offline sync');
      } catch (err) {
        console.error('Failed to queue checkpoint:', err);
      }
    },
    [attemptId]
  );

  return {
    isDataLoaded,
    error,
    saveExamData,
    loadExamData,
    queueCheckpoint,
  };
}
