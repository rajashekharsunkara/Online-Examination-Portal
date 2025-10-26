import { useEffect, useCallback, useState } from 'react';

interface UseFullScreenOptions {
  attemptId: number;
  onViolation?: (exitCount: number) => void;
  maxViolations?: number;
  enabled?: boolean;
}

interface FullScreenState {
  isFullScreen: boolean;
  exitCount: number;
  isSupported: boolean;
}

/**
 * Hook to enforce full-screen mode during exam
 * Detects full-screen exits and logs violations to backend
 */
export function useFullScreen({
  attemptId,
  onViolation,
  maxViolations = 3,
  enabled = true
}: UseFullScreenOptions) {
  const [state, setState] = useState<FullScreenState>({
    isFullScreen: false,
    exitCount: 0,
    isSupported: document.fullscreenEnabled || false
  });

  // Track if we're intentionally exiting (e.g., on submit)
  const [isIntentionalExit, setIsIntentionalExit] = useState(false);

  // Log proctoring event to backend
  const logEvent = useCallback(async (eventType: string, severity: string, eventData?: any) => {
    // Don't log if attemptId is invalid
    if (!attemptId || attemptId === 0) {
      console.warn('[Proctoring] Cannot log event - invalid attemptId:', attemptId);
      return;
    }

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
          event_data: eventData,
          event_timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to log proctoring event:', error);
    }
  }, [attemptId]);

  // Enter full-screen mode
  const enterFullScreen = useCallback(async () => {
    if (!state.isSupported || !enabled) {
      console.warn('Full-screen mode not supported or not enabled');
      return false;
    }

    try {
      await document.documentElement.requestFullscreen();
      setState(prev => ({ ...prev, isFullScreen: true }));
      
      // Log full-screen entry
      await logEvent('fullscreen_enter', 'info', {
        screen_width: window.screen.width,
        screen_height: window.screen.height
      });
      
      return true;
    } catch (error) {
      console.error('Failed to enter full-screen mode:', error);
      return false;
    }
  }, [state.isSupported, enabled, logEvent]);

  // Exit full-screen mode (for exam completion)
  const exitFullScreen = useCallback(async () => {
    if (document.fullscreenElement) {
      try {
        // Set flag to indicate this is intentional
        setIsIntentionalExit(true);
        await document.exitFullscreen();
        setState(prev => ({ ...prev, isFullScreen: false }));
      } catch (error) {
        console.error('Failed to exit full-screen mode:', error);
      }
    }
  }, []);

  // Initialize fullscreen state on mount
  useEffect(() => {
    // Check if already in fullscreen when component mounts
    const isCurrentlyFullScreen = !!document.fullscreenElement;
    if (isCurrentlyFullScreen) {
      setState(prev => ({ ...prev, isFullScreen: true }));
    }
  }, []);

  // Handle full-screen change events
  useEffect(() => {
    if (!enabled) return;

    const handleFullScreenChange = async () => {
      const isCurrentlyFullScreen = !!document.fullscreenElement;
      
      setState(prev => {
        // Check if this is an exit (was fullscreen, now not)
        const isExiting = !isCurrentlyFullScreen && prev.isFullScreen;
        
        // Skip logging and alert if this is intentional (exam submit)
        if (isExiting && !isIntentionalExit) {
          const newExitCount = prev.exitCount + 1;

          // Log event asynchronously (don't await)
          logEvent('fullscreen_exit', 'violation', {
            exit_count: newExitCount,
            screen_width: window.screen.width,
            screen_height: window.screen.height,
            timestamp: new Date().toISOString()
          });

          // Notify parent component
          if (onViolation) {
            onViolation(newExitCount);
          }

          // Show warning to user
          if (newExitCount >= maxViolations) {
            alert(`⚠️ CRITICAL VIOLATION: You have exited full-screen mode ${newExitCount} times. Your exam may be flagged for review.`);
          } else {
            alert(`⚠️ WARNING: You have exited full-screen mode! Return to full-screen immediately. Violation logged (${newExitCount}/${maxViolations})`);
          }

          return {
            ...prev,
            isFullScreen: isCurrentlyFullScreen,
            exitCount: newExitCount
          };
        } else if (isExiting && isIntentionalExit) {
          // Intentional exit (submit) - reset flag but don't log/alert
          setIsIntentionalExit(false);
        }

        return {
          ...prev,
          isFullScreen: isCurrentlyFullScreen
        };
      });
    };

    // Listen for full-screen change events
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange); // Safari
    document.addEventListener('mozfullscreenchange', handleFullScreenChange); // Firefox
    document.addEventListener('msfullscreenchange', handleFullScreenChange); // IE/Edge

    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullScreenChange);
      document.removeEventListener('msfullscreenchange', handleFullScreenChange);
    };
  }, [enabled, state.isFullScreen, state.exitCount, maxViolations, onViolation, logEvent]);

  // Prevent F11 key (full-screen toggle)
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault();
        logEvent('keyboard_blocked', 'warning', {
          key: 'F11',
          reason: 'Full-screen toggle blocked'
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, logEvent]);

  return {
    ...state,
    enterFullScreen,
    exitFullScreen,
    shouldBlockSubmit: state.exitCount >= maxViolations
  };
}
