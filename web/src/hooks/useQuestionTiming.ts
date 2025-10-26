import { useEffect, useCallback, useRef, useState } from 'react';

interface UseQuestionTimingOptions {
  attemptId: number;
  questionId: number;
  enabled?: boolean;
  syncInterval?: number; // How often to sync with backend (seconds)
}

interface QuestionTimingState {
  timeSpent: number;
  answerCount: number;
  firstAnsweredAt: Date | null;
}

/**
 * Hook to track time spent on each question
 * Syncs timing data to backend periodically
 */
export function useQuestionTiming({
  attemptId,
  questionId,
  enabled = true,
  syncInterval = 15 // Sync every 15 seconds
}: UseQuestionTimingOptions) {
  const [state, setState] = useState<QuestionTimingState>({
    timeSpent: 0,
    answerCount: 0,
    firstAnsweredAt: null
  });

  const startTimeRef = useRef<Date>(new Date());
  const lastAnswerRef = useRef<string | null>(null);
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync timing data to backend
  const syncToBackend = useCallback(async (finalSync = false) => {
    if (!enabled || !questionId || questionId <= 0) return; // Skip if no valid question ID

    const currentTime = new Date();
    const totalSeconds = Math.floor((currentTime.getTime() - startTimeRef.current.getTime()) / 1000);

    try {
      const token = localStorage.getItem('access_token');
      await fetch('/api/v1/proctoring/question-timing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          attempt_id: attemptId,
          question_id: questionId,
          total_time_seconds: totalSeconds,
          answer_changed: false // Will be set to true when answer changes
        })
      });

      if (finalSync) {
        console.log(`Final timing sync for question ${questionId}: ${totalSeconds}s`);
      }
    } catch (error) {
      console.error('Failed to sync question timing:', error);
    }
  }, [attemptId, questionId, enabled]);

  // Record answer change
  const recordAnswerChange = useCallback(async (newAnswer: string) => {
    if (!enabled || !questionId || questionId <= 0) return; // Skip if no valid question ID

    const isFirstAnswer = lastAnswerRef.current === null;
    const hasChanged = lastAnswerRef.current !== newAnswer;

    if (hasChanged) {
      lastAnswerRef.current = newAnswer;
      
      setState(prev => ({
        ...prev,
        answerCount: prev.answerCount + 1,
        firstAnsweredAt: prev.firstAnsweredAt || new Date()
      }));

      // Sync immediately when answer changes
      const currentTime = new Date();
      const totalSeconds = Math.floor((currentTime.getTime() - startTimeRef.current.getTime()) / 1000);

      try {
        const token = localStorage.getItem('access_token');
        await fetch('/api/v1/proctoring/question-timing', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            attempt_id: attemptId,
            question_id: questionId,
            total_time_seconds: totalSeconds,
            answer_changed: true
          })
        });

        // Also log the answer change as a proctoring event
        await fetch('/api/v1/proctoring/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            attempt_id: attemptId,
            event_type: 'answer_change',
            severity: 'info',
            question_id: questionId,
            event_data: {
              previous_answer: lastAnswerRef.current,
              new_answer: newAnswer,
              change_count: state.answerCount + 1,
              time_spent_seconds: totalSeconds,
              is_first_answer: isFirstAnswer
            },
            event_timestamp: new Date().toISOString()
          })
        });
      } catch (error) {
        console.error('Failed to record answer change:', error);
      }
    }
  }, [attemptId, questionId, enabled, state.answerCount]);

  // Start tracking when question appears
  useEffect(() => {
    if (!enabled) return;

    // Reset timer for new question
    startTimeRef.current = new Date();
    lastAnswerRef.current = null;
    setState({
      timeSpent: 0,
      answerCount: 0,
      firstAnsweredAt: null
    });

    // Start periodic sync
    syncTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((new Date().getTime() - startTimeRef.current.getTime()) / 1000);
      setState(prev => ({ ...prev, timeSpent: elapsed }));
      syncToBackend();
    }, syncInterval * 1000);

    // Cleanup on unmount or question change
    return () => {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
      }
      // Final sync when leaving question
      syncToBackend(true);
    };
  }, [questionId, enabled, syncInterval, syncToBackend]);

  // Update time spent every second for UI display
  useEffect(() => {
    if (!enabled) return;

    const displayTimer = setInterval(() => {
      const elapsed = Math.floor((new Date().getTime() - startTimeRef.current.getTime()) / 1000);
      setState(prev => ({ ...prev, timeSpent: elapsed }));
    }, 1000);

    return () => clearInterval(displayTimer);
  }, [questionId, enabled]);

  return {
    timeSpent: state.timeSpent,
    answerCount: state.answerCount,
    firstAnsweredAt: state.firstAnsweredAt,
    recordAnswerChange,
    formatTime: (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  };
}
