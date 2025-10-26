/**
 * Offline Resilience Tests
 * Tests for IndexedDB storage, offline detection, background sync, and conflict resolution
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IDBService } from '../idb';
import { OfflineService } from '../offline';
import { BackgroundSyncService } from '../backgroundSync';

describe('IDBService - IndexedDB Operations', () => {
  let idbService: IDBService;

  beforeEach(async () => {
    idbService = IDBService.getInstance();
    await idbService.init();
  });

  afterEach(async () => {
    await idbService.clearAll();
    await idbService.close();
  });

  describe('Exam Storage', () => {
    it('should save and retrieve exam', async () => {
      const exam = {
        id: 1,
        exam_code: 'TEST001',
        title: 'Test Exam',
        description: 'Test description',
        questions: [],
        duration_minutes: 60,
        max_attempts: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await idbService.saveExam(exam);
      const retrieved = await idbService.getExam(1);

      expect(retrieved).toEqual(exam);
    });

    it('should delete exam', async () => {
      const exam = {
        id: 1,
        exam_code: 'TEST001',
        title: 'Test Exam',
        description: 'Test description',
        questions: [],
        duration_minutes: 60,
        max_attempts: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await idbService.saveExam(exam);
      await idbService.deleteExam(1);
      const retrieved = await idbService.getExam(1);

      expect(retrieved).toBeUndefined();
    });
  });

  describe('Attempt Storage', () => {
    it('should save and retrieve attempt', async () => {
      const attempt = {
        id: 1,
        exam_id: 1,
        user_id: 1,
        status: 'in_progress' as const,
        started_at: new Date().toISOString(),
        time_remaining_seconds: 3600,
      };

      await idbService.saveAttempt(attempt);
      const retrieved = await idbService.getAttempt(1);

      expect(retrieved).toEqual(attempt);
    });

    it('should get attempts by exam', async () => {
      const attempt1 = {
        id: 1,
        exam_id: 1,
        user_id: 1,
        status: 'in_progress' as const,
        started_at: new Date().toISOString(),
        time_remaining_seconds: 3600,
      };
      const attempt2 = {
        id: 2,
        exam_id: 1,
        user_id: 1,
        status: 'completed' as const,
        started_at: new Date().toISOString(),
        time_remaining_seconds: 0,
      };

      await idbService.saveAttempt(attempt1);
      await idbService.saveAttempt(attempt2);
      const attempts = await idbService.getAttemptsByExam(1);

      expect(attempts).toHaveLength(2);
      expect(attempts.map((a) => a.id)).toContain(1);
      expect(attempts.map((a) => a.id)).toContain(2);
    });
  });

  describe('Answer Storage', () => {
    it('should save and retrieve answer', async () => {
      const answer = {
        id: 1,
        attempt_id: 1,
        question_id: 1,
        answer: 'Test answer',
        is_flagged: false,
        time_spent_seconds: 60,
        needs_sync: true,
      };

      await idbService.saveAnswer(answer);
      const retrieved = await idbService.getAnswer(1);

      expect(retrieved).toEqual(answer);
    });

    it('should get answers by attempt', async () => {
      const answer1 = {
        id: 1,
        attempt_id: 1,
        question_id: 1,
        answer: 'Answer 1',
        is_flagged: false,
        time_spent_seconds: 60,
        needs_sync: true,
      };
      const answer2 = {
        id: 2,
        attempt_id: 1,
        question_id: 2,
        answer: 'Answer 2',
        is_flagged: true,
        time_spent_seconds: 120,
        needs_sync: false,
      };

      await idbService.saveAnswer(answer1);
      await idbService.saveAnswer(answer2);
      const answers = await idbService.getAnswersByAttempt(1);

      expect(answers).toHaveLength(2);
    });

    it('should mark answer as synced', async () => {
      const answer = {
        id: 1,
        attempt_id: 1,
        question_id: 1,
        answer: 'Test answer',
        is_flagged: false,
        time_spent_seconds: 60,
        needs_sync: true,
      };

      await idbService.saveAnswer(answer);
      await idbService.markAnswerSynced(1);
      const retrieved = await idbService.getAnswer(1);

      expect(retrieved?.needs_sync).toBe(false);
    });

    it('should get unsynced answers', async () => {
      const answer1 = {
        id: 1,
        attempt_id: 1,
        question_id: 1,
        answer: 'Answer 1',
        is_flagged: false,
        time_spent_seconds: 60,
        needs_sync: true,
      };
      const answer2 = {
        id: 2,
        attempt_id: 1,
        question_id: 2,
        answer: 'Answer 2',
        is_flagged: false,
        time_spent_seconds: 120,
        needs_sync: false,
      };

      await idbService.saveAnswer(answer1);
      await idbService.saveAnswer(answer2);
      const unsynced = await idbService.getUnsyncedAnswers();

      expect(unsynced).toHaveLength(1);
      expect(unsynced[0].id).toBe(1);
    });
  });

  describe('Checkpoint Queue', () => {
    it('should enqueue checkpoint', async () => {
      const checkpoint = {
        attemptId: 1,
        questionId: 1,
        answer: 'Test answer',
        isFlagged: false,
        timeSpentSeconds: 60,
        sequence: 1,
      };

      await idbService.enqueueCheckpoint(checkpoint);
      const queued = await idbService.getQueuedCheckpoints(1);

      expect(queued).toHaveLength(1);
      expect(queued[0].answer).toBe('Test answer');
    });

    it('should remove checkpoint from queue', async () => {
      const checkpoint = {
        attemptId: 1,
        questionId: 1,
        answer: 'Test answer',
        isFlagged: false,
        timeSpentSeconds: 60,
        sequence: 1,
      };

      await idbService.enqueueCheckpoint(checkpoint);
      const key = `${checkpoint.attemptId}_${checkpoint.questionId}_${checkpoint.sequence}`;
      await idbService.removeCheckpointFromQueue(key);
      const queued = await idbService.getQueuedCheckpoints(1);

      expect(queued).toHaveLength(0);
    });

    it('should increment retry count', async () => {
      const checkpoint = {
        attemptId: 1,
        questionId: 1,
        answer: 'Test answer',
        isFlagged: false,
        timeSpentSeconds: 60,
        sequence: 1,
      };

      await idbService.enqueueCheckpoint(checkpoint);
      const key = `${checkpoint.attemptId}_${checkpoint.questionId}_${checkpoint.sequence}`;
      await idbService.incrementCheckpointRetry(key);
      const queued = await idbService.getQueuedCheckpoints(1);

      expect(queued[0].retryCount).toBe(1);
    });

    it('should order checkpoints by sequence', async () => {
      const checkpoint1 = {
        attemptId: 1,
        questionId: 1,
        answer: 'Answer 1',
        isFlagged: false,
        timeSpentSeconds: 60,
        sequence: 2,
      };
      const checkpoint2 = {
        attemptId: 1,
        questionId: 1,
        answer: 'Answer 2',
        isFlagged: false,
        timeSpentSeconds: 60,
        sequence: 1,
      };

      await idbService.enqueueCheckpoint(checkpoint1);
      await idbService.enqueueCheckpoint(checkpoint2);
      const queued = await idbService.getQueuedCheckpoints(1);

      expect(queued).toHaveLength(2);
      // Should be ordered by sequence
      expect(queued[0].sequence).toBe(1);
      expect(queued[1].sequence).toBe(2);
    });
  });

  describe('Sync Metadata', () => {
    it('should save and retrieve last sync time', async () => {
      const now = new Date();
      await idbService.setLastSyncTime(now);
      const retrieved = await idbService.getLastSyncTime();

      expect(retrieved?.getTime()).toBe(now.getTime());
    });

    it('should save and retrieve sync status', async () => {
      await idbService.setSyncStatus('syncing');
      const status = await idbService.getSyncStatus();

      expect(status).toBe('syncing');
    });
  });

  describe('Storage Info', () => {
    it('should return storage counts', async () => {
      const exam = {
        id: 1,
        exam_code: 'TEST001',
        title: 'Test Exam',
        description: 'Test description',
        questions: [],
        duration_minutes: 60,
        max_attempts: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const attempt = {
        id: 1,
        exam_id: 1,
        user_id: 1,
        status: 'in_progress' as const,
        started_at: new Date().toISOString(),
        time_remaining_seconds: 3600,
      };

      await idbService.saveExam(exam);
      await idbService.saveAttempt(attempt);
      const info = await idbService.getStorageInfo();

      expect(info.exams).toBe(1);
      expect(info.attempts).toBe(1);
    });
  });
});

describe('OfflineService - Connection Monitoring', () => {
  let offlineService: OfflineService;

  beforeEach(() => {
    offlineService = OfflineService.getInstance();
    vi.stubGlobal('navigator', {
      onLine: true,
      connection: {
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        saveData: false,
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should detect online status', () => {
    const status = offlineService.getStatus();
    expect(status).toBe('online');
  });

  it('should detect offline status', () => {
    vi.stubGlobal('navigator', { onLine: false });
    offlineService['updateStatus'](); // Force update

    const status = offlineService.getStatus();
    expect(status).toBe('offline');
  });

  it('should detect slow connection', () => {
    vi.stubGlobal('navigator', {
      onLine: true,
      connection: {
        effectiveType: 'slow-2g',
        downlink: 0.1,
        rtt: 1500,
        saveData: true,
      },
    });
    offlineService['updateStatus'](); // Force update

    const status = offlineService.getStatus();
    expect(status).toBe('slow');
  });

  it('should notify listeners on status change', (done) => {
    const listener = (status: string) => {
      expect(status).toBe('offline');
      done();
    };

    offlineService.subscribe(listener);
    vi.stubGlobal('navigator', { onLine: false });
    offlineService['updateStatus'](); // Force update
  });

  it('should unsubscribe listener', () => {
    let callCount = 0;
    const listener = () => {
      callCount++;
    };

    const unsubscribe = offlineService.subscribe(listener);
    unsubscribe();

    vi.stubGlobal('navigator', { onLine: false });
    offlineService['updateStatus'](); // Force update

    expect(callCount).toBe(0);
  });
});

describe('BackgroundSyncService - Checkpoint Synchronization', () => {
  let syncService: BackgroundSyncService;
  let idbService: IDBService;
  let mockWebSocket: any;

  beforeEach(async () => {
    idbService = IDBService.getInstance();
    await idbService.init();

    mockWebSocket = {
      sendCheckpoint: vi.fn(() => Promise.resolve()),
    };

    syncService = BackgroundSyncService.getInstance();
    syncService['websocketService'] = mockWebSocket;
  });

  afterEach(async () => {
    await idbService.clearAll();
    await idbService.close();
  });

  it('should sync queued checkpoints', async () => {
    const checkpoint = {
      attemptId: 1,
      questionId: 1,
      answer: 'Test answer',
      isFlagged: false,
      timeSpentSeconds: 60,
      sequence: 1,
    };

    await idbService.enqueueCheckpoint(checkpoint);
    await syncService.syncAll();

    expect(mockWebSocket.sendCheckpoint).toHaveBeenCalledWith(
      1,
      'Test answer',
      false,
      60
    );
  });

  it('should track sync progress', async () => {
    const checkpoint1 = {
      attemptId: 1,
      questionId: 1,
      answer: 'Answer 1',
      isFlagged: false,
      timeSpentSeconds: 60,
      sequence: 1,
    };
    const checkpoint2 = {
      attemptId: 1,
      questionId: 2,
      answer: 'Answer 2',
      isFlagged: false,
      timeSpentSeconds: 60,
      sequence: 1,
    };

    await idbService.enqueueCheckpoint(checkpoint1);
    await idbService.enqueueCheckpoint(checkpoint2);

    let progressUpdates = 0;
    syncService.subscribe(() => {
      progressUpdates++;
    });

    await syncService.syncAll();

    expect(progressUpdates).toBeGreaterThan(0);
  });

  it('should retry failed syncs with exponential backoff', async () => {
    mockWebSocket.sendCheckpoint = vi.fn(() => Promise.reject(new Error('Network error')));

    const checkpoint = {
      attemptId: 1,
      questionId: 1,
      answer: 'Test answer',
      isFlagged: false,
      timeSpentSeconds: 60,
      sequence: 1,
    };

    await idbService.enqueueCheckpoint(checkpoint);
    await syncService.syncAll();

    // Should retry 3 times (total 4 attempts including initial)
    expect(mockWebSocket.sendCheckpoint).toHaveBeenCalledTimes(4);
  });

  it('should remove checkpoint after successful sync', async () => {
    const checkpoint = {
      attemptId: 1,
      questionId: 1,
      answer: 'Test answer',
      isFlagged: false,
      timeSpentSeconds: 60,
      sequence: 1,
    };

    await idbService.enqueueCheckpoint(checkpoint);
    await syncService.syncAll();

    const remaining = await idbService.getQueuedCheckpoints(1);
    expect(remaining).toHaveLength(0);
  });

  it('should increment retry count on failure', async () => {
    mockWebSocket.sendCheckpoint = vi.fn(() => Promise.reject(new Error('Network error')));

    const checkpoint = {
      attemptId: 1,
      questionId: 1,
      answer: 'Test answer',
      isFlagged: false,
      timeSpentSeconds: 60,
      sequence: 1,
    };

    await idbService.enqueueCheckpoint(checkpoint);
    await syncService.syncAll();

    const queued = await idbService.getQueuedCheckpoints(1);
    expect(queued[0].retryCount).toBeGreaterThan(0);
  });
});

describe('Conflict Resolution', () => {
  let idbService: IDBService;

  beforeEach(async () => {
    idbService = IDBService.getInstance();
    await idbService.init();
  });

  afterEach(async () => {
    await idbService.clearAll();
    await idbService.close();
  });

  it('should handle concurrent edits with sequence numbers', async () => {
    const checkpoint1 = {
      attemptId: 1,
      questionId: 1,
      answer: 'First edit',
      isFlagged: false,
      timeSpentSeconds: 60,
      sequence: 1,
    };
    const checkpoint2 = {
      attemptId: 1,
      questionId: 1,
      answer: 'Second edit',
      isFlagged: false,
      timeSpentSeconds: 120,
      sequence: 2,
    };

    await idbService.enqueueCheckpoint(checkpoint1);
    await idbService.enqueueCheckpoint(checkpoint2);
    const queued = await idbService.getQueuedCheckpoints(1);

    // Both should be queued (server will use sequence to resolve)
    expect(queued).toHaveLength(2);
    expect(queued[0].sequence).toBe(1);
    expect(queued[1].sequence).toBe(2);
  });

  it('should use last-write-wins for answer storage', async () => {
    const answer1 = {
      id: 1,
      attempt_id: 1,
      question_id: 1,
      answer: 'First answer',
      is_flagged: false,
      time_spent_seconds: 60,
      needs_sync: true,
    };
    const answer2 = {
      id: 1,
      attempt_id: 1,
      question_id: 1,
      answer: 'Second answer',
      is_flagged: true,
      time_spent_seconds: 120,
      needs_sync: true,
    };

    await idbService.saveAnswer(answer1);
    await idbService.saveAnswer(answer2);
    const retrieved = await idbService.getAnswer(1);

    // Last write should win
    expect(retrieved?.answer).toBe('Second answer');
    expect(retrieved?.is_flagged).toBe(true);
  });
});
