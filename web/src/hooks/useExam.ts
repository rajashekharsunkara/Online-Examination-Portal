/**
 * Custom React Hooks for Exam Functionality
 */

import { useEffect, useRef, useCallback } from 'react';
import { websocketService } from '../services/websocket';
import { useExamStore } from '../store/examStore';
import type { WebSocketMessage } from '../types';

/**
 * Hook to manage WebSocket connection for an exam attempt
 */
export function useWebSocket(attemptId: number | null, token: string | null) {
  const connectionRef = useRef(false);
  const setConnected = useExamStore((state) => state.setConnected);
  const syncServerTime = useExamStore((state) => state.syncServerTime);

  useEffect(() => {
    if (!attemptId || !token || connectionRef.current) {
      return;
    }

    // Connect to WebSocket
    connectionRef.current = true;
    let unsubscribers: Array<() => void> = [];

    websocketService
      .connect(attemptId, token)
      .then(() => {
        setConnected(true);

        // Register message handlers
        unsubscribers = [
          websocketService.on('connected', (msg: WebSocketMessage) => {
            console.log('[Hook] Connected:', msg);
            if (msg.time_remaining_seconds !== undefined) {
              useExamStore.getState().setTimeRemaining(msg.time_remaining_seconds);
            }
          }),

          websocketService.on('checkpoint_ack', (msg: WebSocketMessage) => {
            console.log('[Hook] Checkpoint ACK:', msg);
            useExamStore.getState().setSyncing(false);
            useExamStore.getState().updateLastSyncTime();
            
            if (msg.time_remaining_seconds !== undefined) {
              useExamStore.getState().setTimeRemaining(msg.time_remaining_seconds);
            }
          }),

          websocketService.on('checkpoint_error', (msg: WebSocketMessage) => {
            console.error('[Hook] Checkpoint error:', msg);
            useExamStore.getState().setSyncing(false);
            // TODO: Show error notification
          }),

          websocketService.on('time_update', (msg: WebSocketMessage) => {
            console.log('[Hook] Time update:', msg);
            if (msg.server_time && msg.time_remaining_seconds !== undefined) {
              syncServerTime(msg.server_time, msg.time_remaining_seconds);
            }
            
            if (msg.is_expired) {
              // Auto-submit on expiry
              useExamStore.getState().setShowSubmitModal(true);
            }
          }),

          websocketService.on('notification', (msg: WebSocketMessage) => {
            console.log('[Hook] Notification:', msg);
            // TODO: Show notification toast
          }),

          websocketService.on('exam_event', (msg: WebSocketMessage) => {
            console.log('[Hook] Exam event:', msg);
            if (msg.event === 'time_expired') {
              useExamStore.getState().setShowSubmitModal(true);
            }
          }),

          websocketService.on('error', (msg: WebSocketMessage) => {
            console.error('[Hook] WebSocket error:', msg);
            // TODO: Show error notification
          }),
        ];
      })
      .catch((error) => {
        console.error('[Hook] WebSocket connection failed:', error);
        setConnected(false);
        connectionRef.current = false;
      });

    // Cleanup
    return () => {
      unsubscribers.forEach((unsub) => unsub());
      websocketService.disconnect();
      setConnected(false);
      connectionRef.current = false;
    };
  }, [attemptId, token, setConnected, syncServerTime]);

  return {
    isConnected: websocketService.isConnected(),
  };
}

/**
 * Hook to handle answer checkpointing with auto-save
 */
export function useCheckpoint(intervalSeconds: number = 15) {
  const isSyncing = useExamStore((state) => state.isSyncing);
  const setSyncing = useExamStore((state) => state.setSyncing);
  const answers = useExamStore((state) => state.answers);
  const isConnected = useExamStore((state) => state.isConnected);
  const lastSyncTime = useExamStore((state) => state.lastSyncTime);
  
  const lastAnswersRef = useRef<typeof answers>({});
  const autoSaveIntervalRef = useRef<number | null>(null);

  // Manual checkpoint
  const checkpoint = useCallback(
    (questionId: number, answer: any, isFlagged: boolean, timeSpent: number) => {
      if (!isConnected || isSyncing) {
        console.warn('[Checkpoint] Cannot checkpoint: not connected or syncing');
        return;
      }

      setSyncing(true);
      websocketService.sendCheckpoint(questionId, answer, isFlagged, timeSpent);
    },
    [isConnected, isSyncing, setSyncing]
  );

  // Auto-save effect
  useEffect(() => {
    if (!isConnected) {
      return;
    }

    // Setup auto-save interval
    autoSaveIntervalRef.current = window.setInterval(() => {
      if (isSyncing) {
        return; // Skip if already syncing
      }

      // Find changed answers
      const changedQuestions: Array<{
        questionId: number;
        answer: any;
        isFlagged: boolean;
        timeSpent: number;
      }> = [];

      Object.entries(answers).forEach(([questionIdStr, answerData]) => {
        const questionId = parseInt(questionIdStr);
        const lastAnswer = lastAnswersRef.current[questionId];

        // Check if answer changed
        if (
          !lastAnswer ||
          JSON.stringify(lastAnswer.answer) !== JSON.stringify(answerData.answer) ||
          lastAnswer.isFlagged !== answerData.isFlagged
        ) {
          changedQuestions.push({
            questionId,
            answer: answerData.answer,
            isFlagged: answerData.isFlagged,
            timeSpent: answerData.timeSpent - (lastAnswer?.timeSpent || 0),
          });
        }
      });

      // Send checkpoints for changed answers
      if (changedQuestions.length > 0) {
        console.log('[Checkpoint] Auto-saving', changedQuestions.length, 'answers');
        setSyncing(true);

        changedQuestions.forEach(({ questionId, answer, isFlagged, timeSpent }) => {
          websocketService.sendCheckpoint(questionId, answer, isFlagged, timeSpent);
        });

        // Update reference
        lastAnswersRef.current = { ...answers };
      }
    }, intervalSeconds * 1000);

    // Cleanup
    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [isConnected, isSyncing, answers, intervalSeconds, setSyncing]);

  return {
    checkpoint,
    isSyncing,
    lastSyncTime,
  };
}

/**
 * Hook for exam timer with auto-decrement
 */
export function useExamTimer() {
  const timeRemaining = useExamStore((state) => state.timeRemaining);
  const decrementTime = useExamStore((state) => state.decrementTime);
  const isConnected = useExamStore((state) => state.isConnected);
  
  const timerRef = useRef<number | null>(null);

  // Start timer
  useEffect(() => {
    // Decrement every second
    timerRef.current = window.setInterval(() => {
      decrementTime();
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [decrementTime]);

  // Sync with server periodically
  useEffect(() => {
    if (!isConnected) {
      return;
    }

    // Sync every 60 seconds
    const syncInterval = window.setInterval(() => {
      websocketService.syncTime();
    }, 60000);

    return () => {
      clearInterval(syncInterval);
    };
  }, [isConnected]);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [hours, minutes, secs]
      .map((val) => val.toString().padStart(2, '0'))
      .join(':');
  };

  return {
    timeRemaining,
    formattedTime: formatTime(timeRemaining),
    isLowTime: timeRemaining <= 600, // 10 minutes
    isCriticalTime: timeRemaining <= 60, // 1 minute
  };
}

/**
 * Hook for question flagging
 */
export function useQuestionFlag(questionId: number) {
  const isFlagged = useExamStore((state) => state.isQuestionFlagged(questionId));
  const flagQuestion = useExamStore((state) => state.flagQuestion);
  const isConnected = useExamStore((state) => state.isConnected);

  const toggleFlag = useCallback(() => {
    const newFlagState = !isFlagged;
    flagQuestion(questionId, newFlagState);

    // Sync with server
    if (isConnected) {
      websocketService.flagQuestion(questionId, newFlagState);
    }
  }, [questionId, isFlagged, flagQuestion, isConnected]);

  return {
    isFlagged,
    toggleFlag,
  };
}
