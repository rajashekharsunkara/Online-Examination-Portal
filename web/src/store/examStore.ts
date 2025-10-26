/**
 * Exam Store (Zustand)
 * Global state management for exam taking
 */

import { create } from 'zustand';
import type { Exam, Attempt, Question } from '../types';

interface AnswerData {
  answer: any;
  isFlagged: boolean;
  timeSpent: number;
  sequence: number;
  lastUpdated: number;
}

interface ExamStore {
  // Core data
  exam: Exam | null;
  attempt: Attempt | null;
  
  // Answers state
  answers: Record<number, AnswerData>; // questionId -> AnswerData
  
  // Navigation
  currentQuestionIndex: number;
  
  // Timer
  timeRemaining: number; // seconds
  serverTimeOffset: number; // client time - server time (ms)
  
  // Connection
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncTime: number;
  
  // Offline
  isOnline: boolean;
  queuedCheckpoints: number;
  offlineDataLoaded: boolean;
  
  // UI state
  showSubmitModal: boolean;
  isSubmitting: boolean;
  
  // Actions
  setExam: (exam: Exam) => void;
  setAttempt: (attempt: Attempt) => void;
  
  // Answer management
  setAnswer: (questionId: number, answer: any, timeSpent?: number) => void;
  flagQuestion: (questionId: number, isFlagged: boolean) => void;
  getAnswer: (questionId: number) => any;
  isQuestionAnswered: (questionId: number) => boolean;
  isQuestionFlagged: (questionId: number) => boolean;
  
  // Navigation
  goToQuestion: (index: number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  getCurrentQuestion: () => Question | null;
  
  // Timer
  setTimeRemaining: (seconds: number) => void;
  decrementTime: () => void;
  syncServerTime: (serverTime: string, timeRemaining: number) => void;
  
  // Connection
  setConnected: (connected: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  updateLastSyncTime: () => void;
  
  // Offline
  setOnlineStatus: (isOnline: boolean) => void;
  setQueuedCheckpoints: (count: number) => void;
  setOfflineDataLoaded: (loaded: boolean) => void;
  
  // Submit
  setShowSubmitModal: (show: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  
  // Stats
  getProgress: () => {
    total: number;
    answered: number;
    flagged: number;
    unanswered: number;
    percentage: number;
  };
  
  // Reset
  reset: () => void;
}

export const useExamStore = create<ExamStore>((set, get) => ({
  // Initial state
  exam: null,
  attempt: null,
  answers: {},
  currentQuestionIndex: 0,
  timeRemaining: 0,
  serverTimeOffset: 0,
  isConnected: false,
  isSyncing: false,
  lastSyncTime: 0,
  isOnline: true,
  queuedCheckpoints: 0,
  offlineDataLoaded: false,
  showSubmitModal: false,
  isSubmitting: false,

  // Setters
  setExam: (exam) => set({ exam }),
  setAttempt: (attempt) => set({ attempt }),

  // Answer management
  setAnswer: (questionId, answer, timeSpent = 0) => {
    const state = get();
    const existingAnswer = state.answers[questionId];
    const sequence = existingAnswer ? existingAnswer.sequence + 1 : 1;

    set({
      answers: {
        ...state.answers,
        [questionId]: {
          answer,
          isFlagged: existingAnswer?.isFlagged || false,
          timeSpent: (existingAnswer?.timeSpent || 0) + timeSpent,
          sequence,
          lastUpdated: Date.now(),
        },
      },
    });
  },

  flagQuestion: (questionId, isFlagged) => {
    const state = get();
    const existingAnswer = state.answers[questionId];

    set({
      answers: {
        ...state.answers,
        [questionId]: {
          answer: existingAnswer?.answer || null,
          isFlagged,
          timeSpent: existingAnswer?.timeSpent || 0,
          sequence: existingAnswer?.sequence || 1,
          lastUpdated: Date.now(),
        },
      },
    });
  },

  getAnswer: (questionId) => {
    const state = get();
    return state.answers[questionId]?.answer || null;
  },

  isQuestionAnswered: (questionId) => {
    const state = get();
    const answerData = state.answers[questionId];
    return answerData && answerData.answer !== null && answerData.answer !== undefined;
  },

  isQuestionFlagged: (questionId) => {
    const state = get();
    return state.answers[questionId]?.isFlagged || false;
  },

  // Navigation
  goToQuestion: (index) => {
    const state = get();
    const maxIndex = (state.exam?.questions.length || 1) - 1;
    const validIndex = Math.max(0, Math.min(index, maxIndex));
    set({ currentQuestionIndex: validIndex });
  },

  nextQuestion: () => {
    const state = get();
    const maxIndex = (state.exam?.questions.length || 1) - 1;
    if (state.currentQuestionIndex < maxIndex) {
      set({ currentQuestionIndex: state.currentQuestionIndex + 1 });
    }
  },

  previousQuestion: () => {
    const state = get();
    if (state.currentQuestionIndex > 0) {
      set({ currentQuestionIndex: state.currentQuestionIndex - 1 });
    }
  },

  getCurrentQuestion: () => {
    const state = get();
    if (!state.exam || !state.exam.questions || !Array.isArray(state.exam.questions)) return null;
    return state.exam.questions[state.currentQuestionIndex] || null;
  },

  // Timer
  setTimeRemaining: (seconds) => set({ timeRemaining: seconds }),

  decrementTime: () => {
    const state = get();
    if (state.timeRemaining > 0) {
      set({ timeRemaining: state.timeRemaining - 1 });
    }
  },

  syncServerTime: (serverTime, timeRemaining) => {
    const serverDate = new Date(serverTime);
    const clientDate = new Date();
    const offset = clientDate.getTime() - serverDate.getTime();

    set({
      serverTimeOffset: offset,
      timeRemaining,
    });
  },

  // Connection
  setConnected: (connected) => set({ isConnected: connected }),
  setSyncing: (syncing) => set({ isSyncing: syncing }),
  updateLastSyncTime: () => set({ lastSyncTime: Date.now() }),

  // Offline
  setOnlineStatus: (isOnline) => set({ isOnline }),
  setQueuedCheckpoints: (count) => set({ queuedCheckpoints: count }),
  setOfflineDataLoaded: (loaded) => set({ offlineDataLoaded: loaded }),

  // Submit
  setShowSubmitModal: (show) => set({ showSubmitModal: show }),
  setSubmitting: (submitting) => set({ isSubmitting: submitting }),

  // Stats
  getProgress: () => {
    const state = get();
    const total = state.exam?.questions.length || 0;
    let answered = 0;
    let flagged = 0;

    state.exam?.questions.forEach((q) => {
      if (state.isQuestionAnswered(q.id)) {
        answered++;
      }
      if (state.isQuestionFlagged(q.id)) {
        flagged++;
      }
    });

    const unanswered = total - answered;
    const percentage = total > 0 ? (answered / total) * 100 : 0;

    return {
      total,
      answered,
      flagged,
      unanswered,
      percentage,
    };
  },

  // Reset
  reset: () => set({
    exam: null,
    attempt: null,
    answers: {},
    currentQuestionIndex: 0,
    timeRemaining: 0,
    serverTimeOffset: 0,
    isConnected: false,
    isSyncing: false,
    lastSyncTime: 0,
    isOnline: true,
    queuedCheckpoints: 0,
    offlineDataLoaded: false,
    showSubmitModal: false,
    isSubmitting: false,
  }),
}));
