/**
 * IndexedDB Service
 * Manages local storage for offline exam functionality
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Exam, Attempt, Answer } from '../types';

/**
 * Database schema definition
 */
interface ExamDBSchema extends DBSchema {
  exams: {
    key: number;
    value: Exam;
    indexes: { 'by-code': string };
  };
  attempts: {
    key: number;
    value: Attempt;
    indexes: { 'by-exam': number; 'by-status': string };
  };
  answers: {
    key: number;
    value: Answer & { needsSync: boolean; lastSyncAttempt?: Date };
    indexes: { 'by-attempt': number; 'by-sync-status': number };
  };
  checkpointQueue: {
    key: string; // `${attemptId}_${questionId}_${sequence}`
    value: {
      attemptId: number;
      questionId: number;
      answer: any;
      isFlagged: boolean;
      timeSpentSeconds: number;
      sequence: number;
      createdAt: Date;
      retryCount: number;
      lastError?: string;
    };
    indexes: { 'by-attempt': number; 'by-retry': number };
  };
  syncMeta: {
    key: string; // 'lastSyncTime' | 'syncStatus'
    value: any;
  };
}

const DB_NAME = 'exam-platform';
const DB_VERSION = 1;

class IDBService {
  private db: IDBPDatabase<ExamDBSchema> | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the database
   */
  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        this.db = await openDB<ExamDBSchema>(DB_NAME, DB_VERSION, {
          upgrade(db, oldVersion, newVersion, transaction) {
            console.log(`Upgrading database from ${oldVersion} to ${newVersion}`);

            // Create exams store
            if (!db.objectStoreNames.contains('exams')) {
              const examsStore = db.createObjectStore('exams', { keyPath: 'id' });
              examsStore.createIndex('by-code', 'exam_code', { unique: true });
            }

            // Create attempts store
            if (!db.objectStoreNames.contains('attempts')) {
              const attemptsStore = db.createObjectStore('attempts', { keyPath: 'id' });
              attemptsStore.createIndex('by-exam', 'exam_id');
              attemptsStore.createIndex('by-status', 'status');
            }

            // Create answers store
            if (!db.objectStoreNames.contains('answers')) {
              const answersStore = db.createObjectStore('answers', { keyPath: 'id' });
              answersStore.createIndex('by-attempt', 'attempt_id');
              answersStore.createIndex('by-sync-status', 'needsSync');
            }

            // Create checkpoint queue store
            if (!db.objectStoreNames.contains('checkpointQueue')) {
              const queueStore = db.createObjectStore('checkpointQueue', { keyPath: 'key' });
              queueStore.createIndex('by-attempt', 'attemptId');
              queueStore.createIndex('by-retry', 'retryCount');
            }

            // Create sync metadata store
            if (!db.objectStoreNames.contains('syncMeta')) {
              db.createObjectStore('syncMeta');
            }
          },
        });

        console.log('IndexedDB initialized successfully');
      } catch (error) {
        console.error('Failed to initialize IndexedDB:', error);
        throw error;
      }
    })();

    return this.initPromise;
  }

  /**
   * Ensure database is initialized
   */
  private async ensureDB(): Promise<IDBPDatabase<ExamDBSchema>> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  // ===== EXAM OPERATIONS =====

  async saveExam(exam: Exam): Promise<void> {
    const db = await this.ensureDB();
    await db.put('exams', exam);
  }

  async getExam(examId: number): Promise<Exam | undefined> {
    const db = await this.ensureDB();
    return db.get('exams', examId);
  }

  async getExamByCode(examCode: string): Promise<Exam | undefined> {
    const db = await this.ensureDB();
    return db.getFromIndex('exams', 'by-code', examCode);
  }

  async deleteExam(examId: number): Promise<void> {
    const db = await this.ensureDB();
    await db.delete('exams', examId);
  }

  // ===== ATTEMPT OPERATIONS =====

  async saveAttempt(attempt: Attempt): Promise<void> {
    const db = await this.ensureDB();
    await db.put('attempts', attempt);
  }

  async getAttempt(attemptId: number): Promise<Attempt | undefined> {
    const db = await this.ensureDB();
    return db.get('attempts', attemptId);
  }

  async getAttemptsByExam(examId: number): Promise<Attempt[]> {
    const db = await this.ensureDB();
    return db.getAllFromIndex('attempts', 'by-exam', examId);
  }

  async getAttemptsByStatus(status: string): Promise<Attempt[]> {
    const db = await this.ensureDB();
    return db.getAllFromIndex('attempts', 'by-status', status);
  }

  async deleteAttempt(attemptId: number): Promise<void> {
    const db = await this.ensureDB();
    await db.delete('attempts', attemptId);
  }

  // ===== ANSWER OPERATIONS =====

  async saveAnswer(
    answer: Answer,
    needsSync: boolean = true
  ): Promise<void> {
    const db = await this.ensureDB();
    await db.put('answers', {
      ...answer,
      needsSync,
      lastSyncAttempt: needsSync ? undefined : new Date(),
    });
  }

  async getAnswer(answerId: number): Promise<Answer | undefined> {
    const db = await this.ensureDB();
    const result = await db.get('answers', answerId);
    if (!result) return undefined;
    
    // Remove internal fields
    const { needsSync, lastSyncAttempt, ...answer } = result;
    return answer as Answer;
  }

  async getAnswersByAttempt(attemptId: number): Promise<Answer[]> {
    const db = await this.ensureDB();
    const results = await db.getAllFromIndex('answers', 'by-attempt', attemptId);
    
    // Remove internal fields
    return results.map(({ needsSync, lastSyncAttempt, ...answer }) => answer as Answer);
  }

  async getUnsyncedAnswers(): Promise<Answer[]> {
    const db = await this.ensureDB();
    const results = await db.getAllFromIndex('answers', 'by-sync-status', 1); // needsSync = true
    
    return results.map(({ needsSync, lastSyncAttempt, ...answer }) => answer as Answer);
  }

  async markAnswerSynced(answerId: number): Promise<void> {
    const db = await this.ensureDB();
    const answer = await db.get('answers', answerId);
    if (answer) {
      await db.put('answers', {
        ...answer,
        needsSync: false,
        lastSyncAttempt: new Date(),
      });
    }
  }

  async deleteAnswer(answerId: number): Promise<void> {
    const db = await this.ensureDB();
    await db.delete('answers', answerId);
  }

  // ===== CHECKPOINT QUEUE OPERATIONS =====

  async enqueueCheckpoint(checkpoint: {
    attemptId: number;
    questionId: number;
    answer: any;
    isFlagged: boolean;
    timeSpentSeconds: number;
    sequence: number;
  }): Promise<void> {
    const db = await this.ensureDB();
    const key = `${checkpoint.attemptId}_${checkpoint.questionId}_${checkpoint.sequence}`;
    
    await db.put('checkpointQueue', {
      key,
      ...checkpoint,
      createdAt: new Date(),
      retryCount: 0,
    });
  }

  async getQueuedCheckpoints(attemptId?: number): Promise<Array<any>> {
    const db = await this.ensureDB();
    
    if (attemptId !== undefined) {
      return db.getAllFromIndex('checkpointQueue', 'by-attempt', attemptId);
    }
    
    return db.getAll('checkpointQueue');
  }

  async removeCheckpointFromQueue(key: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete('checkpointQueue', key);
  }

  async incrementCheckpointRetry(key: string, error: string): Promise<void> {
    const db = await this.ensureDB();
    const checkpoint = await db.get('checkpointQueue', key);
    
    if (checkpoint) {
      await db.put('checkpointQueue', {
        ...checkpoint,
        retryCount: checkpoint.retryCount + 1,
        lastError: error,
      });
    }
  }

  async clearCheckpointQueue(attemptId?: number): Promise<void> {
    const db = await this.ensureDB();
    
    if (attemptId !== undefined) {
      const checkpoints = await this.getQueuedCheckpoints(attemptId);
      for (const checkpoint of checkpoints) {
        await db.delete('checkpointQueue', checkpoint.key);
      }
    } else {
      await db.clear('checkpointQueue');
    }
  }

  // ===== SYNC METADATA OPERATIONS =====

  async getLastSyncTime(): Promise<Date | null> {
    const db = await this.ensureDB();
    const value = await db.get('syncMeta', 'lastSyncTime');
    return value ? new Date(value) : null;
  }

  async setLastSyncTime(time: Date): Promise<void> {
    const db = await this.ensureDB();
    await db.put('syncMeta', time.toISOString(), 'lastSyncTime');
  }

  async getSyncStatus(): Promise<string> {
    const db = await this.ensureDB();
    return (await db.get('syncMeta', 'syncStatus')) || 'idle';
  }

  async setSyncStatus(status: string): Promise<void> {
    const db = await this.ensureDB();
    await db.put('syncMeta', status, 'syncStatus');
  }

  // ===== UTILITY OPERATIONS =====

  async clearAll(): Promise<void> {
    const db = await this.ensureDB();
    await db.clear('exams');
    await db.clear('attempts');
    await db.clear('answers');
    await db.clear('checkpointQueue');
    await db.clear('syncMeta');
  }

  async getStorageInfo(): Promise<{
    examsCount: number;
    attemptsCount: number;
    answersCount: number;
    queuedCount: number;
  }> {
    const db = await this.ensureDB();
    
    const [examsCount, attemptsCount, answersCount, queuedCount] = await Promise.all([
      db.count('exams'),
      db.count('attempts'),
      db.count('answers'),
      db.count('checkpointQueue'),
    ]);
    
    return { examsCount, attemptsCount, answersCount, queuedCount };
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
}

// Export singleton instance
export const idbService = new IDBService();
