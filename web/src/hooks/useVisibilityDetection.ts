import { useEffect, useCallback, useState } from 'react';

interface UseVisibilityDetectionOptions {
  attemptId: number;
  questionId?: number;
  onTabSwitch?: (switchCount: number, duration: number) => void;
  maxSwitches?: number;
  enabled?: boolean;
}

interface VisibilityState {
  isVisible: boolean;
  switchCount: number;
  totalHiddenTime: number;
  lastHiddenAt: Date | null;
}

/**
 * Hook to detect tab switches and window blur/focus events
 * Logs all visibility changes to backend for proctoring
 */
export function useVisibilityDetection({
  attemptId,
  questionId,
  onTabSwitch,
  maxSwitches = 5,
  enabled = true
}: UseVisibilityDetectionOptions) {
  const [state, setState] = useState<VisibilityState>({
    isVisible: !document.hidden,
    switchCount: 0,
    totalHiddenTime: 0,
    lastHiddenAt: null
  });

  // Log proctoring event to backend
  const logEvent = useCallback(async (eventType: string, severity: string, eventData?: any) => {
    try {
      const token = localStorage.getItem('access_token');
      await fetch('/api/v1/proctoring/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          attempt_id: attemptId,
          event_type: eventType,
          severity: severity,
          question_id: questionId && questionId > 0 ? questionId : null, // Only include valid question IDs
          event_data: eventData,
          event_timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to log proctoring event:', error);
    }
  }, [attemptId, questionId]);

  // Handle visibility change (tab switch)
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = async () => {
      const isCurrentlyVisible = !document.hidden;

      if (!isCurrentlyVisible) {
        // Tab became hidden
        setState(prev => ({
          ...prev,
          isVisible: false,
          lastHiddenAt: new Date()
        }));

        await logEvent('tab_switch', 'warning', {
          action: 'hidden',
          timestamp: new Date().toISOString()
        });

      } else if (state.lastHiddenAt) {
        // Tab became visible again
        const hiddenDuration = (new Date().getTime() - state.lastHiddenAt.getTime()) / 1000;
        const newSwitchCount = state.switchCount + 1;

        setState(prev => ({
          ...prev,
          isVisible: true,
          switchCount: newSwitchCount,
          totalHiddenTime: prev.totalHiddenTime + hiddenDuration,
          lastHiddenAt: null
        }));

        await logEvent('tab_switch', 'warning', {
          action: 'visible',
          duration_seconds: hiddenDuration,
          switch_count: newSwitchCount,
          timestamp: new Date().toISOString()
        });

        // Notify parent component
        if (onTabSwitch) {
          onTabSwitch(newSwitchCount, hiddenDuration);
        }

        // Show warning
        if (newSwitchCount >= maxSwitches) {
          alert(`⚠️ CRITICAL VIOLATION: You have switched tabs ${newSwitchCount} times. Your exam may be flagged for review.`);
        } else if (newSwitchCount % 2 === 0) {
          // Show warning every 2 switches to avoid spam
          alert(`⚠️ WARNING: Tab switching detected! This has been logged. (${newSwitchCount}/${maxSwitches})`);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, state.lastHiddenAt, state.switchCount, maxSwitches, onTabSwitch, logEvent]);

  // Handle window blur/focus (window switching)
  useEffect(() => {
    if (!enabled) return;

    const handleWindowBlur = async () => {
      await logEvent('window_blur', 'warning', {
        timestamp: new Date().toISOString()
      });
    };

    const handleWindowFocus = async () => {
      await logEvent('window_focus', 'info', {
        timestamp: new Date().toISOString()
      });
    };

    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [enabled, logEvent]);

  return {
    ...state,
    shouldBlockSubmit: state.switchCount >= maxSwitches,
    warningMessage: state.switchCount >= maxSwitches 
      ? 'Too many tab switches detected. Your exam is flagged for review.'
      : state.switchCount > 0 
        ? `${state.switchCount} tab switch(es) detected`
        : null
  };
}
