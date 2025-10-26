import { useEffect, useCallback } from 'react';

interface UseKeyboardBlockingOptions {
  attemptId: number;
  enabled?: boolean;
  allowSubmit?: boolean; // Allow Ctrl+Enter for submit
}

/**
 * Hook to block keyboard shortcuts that could be used for cheating
 * Blocks copy/paste, developer tools, print, view source, etc.
 */
export function useKeyboardBlocking({
  attemptId,
  enabled = true,
  allowSubmit = true
}: UseKeyboardBlockingOptions) {
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
          event_data: eventData,
          event_timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to log proctoring event:', error);
    }
  }, [attemptId]);

  // Block keyboard shortcuts
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = async (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey; // metaKey for Mac
      const shift = e.shiftKey;
      const alt = e.altKey;

      let blocked = false;
      let reason = '';

      // Block copy/paste/cut
      if (ctrl && (key === 'c' || key === 'v' || key === 'x')) {
        blocked = true;
        reason = `Copy/Paste/Cut blocked (Ctrl+${key.toUpperCase()})`;
        await logEvent('copy_paste_attempt', 'violation', { key, combo: `Ctrl+${key.toUpperCase()}` });
      }

      // Block print
      else if (ctrl && key === 'p') {
        blocked = true;
        reason = 'Print blocked (Ctrl+P)';
        await logEvent('keyboard_blocked', 'violation', { key, combo: 'Ctrl+P' });
      }

      // Block view source
      else if (ctrl && key === 'u') {
        blocked = true;
        reason = 'View Source blocked (Ctrl+U)';
        await logEvent('keyboard_blocked', 'violation', { key, combo: 'Ctrl+U' });
      }

      // Block developer tools
      else if (
        key === 'f12' ||
        (ctrl && shift && (key === 'i' || key === 'j' || key === 'c')) ||
        (ctrl && shift && key === 'k') // Firefox console
      ) {
        blocked = true;
        reason = 'Developer Tools blocked';
        await logEvent('developer_tools_attempt', 'violation', { 
          key, 
          combo: key === 'f12' ? 'F12' : `Ctrl+Shift+${key.toUpperCase()}` 
        });
      }

      // Block refresh
      else if (ctrl && key === 'r' || key === 'f5') {
        blocked = true;
        reason = 'Page Refresh blocked';
        await logEvent('keyboard_blocked', 'warning', { 
          key, 
          combo: key === 'f5' ? 'F5' : 'Ctrl+R' 
        });
      }

      // Block new tab/window
      else if (ctrl && (key === 't' || key === 'n')) {
        blocked = true;
        reason = 'New Tab/Window blocked';
        await logEvent('keyboard_blocked', 'warning', { 
          key, 
          combo: `Ctrl+${key.toUpperCase()}` 
        });
      }

      // Block close tab
      else if (ctrl && key === 'w') {
        blocked = true;
        reason = 'Close Tab blocked';
        await logEvent('keyboard_blocked', 'warning', { key, combo: 'Ctrl+W' });
      }

      // Block Alt+Tab (window switching)
      else if (alt && key === 'tab') {
        blocked = true;
        reason = 'Window Switching blocked (Alt+Tab)';
        await logEvent('keyboard_blocked', 'warning', { key, combo: 'Alt+Tab' });
      }

      // Block Windows key (can't fully prevent, but log it)
      else if (e.key === 'Meta' || e.key === 'OS') {
        await logEvent('keyboard_blocked', 'warning', { key: 'Windows/Command Key' });
        // Note: Can't actually prevent this, but we log it
      }

      // Allow Ctrl+Enter for submit if enabled
      if (allowSubmit && ctrl && key === 'enter') {
        blocked = false;
      }

      // Block and notify
      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
        console.warn(`🚫 ${reason}`);
        return false;
      }
    };

    // Add event listener with capture phase to catch events before they bubble
    document.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [enabled, allowSubmit, logEvent]);

  // Block context menu (right-click)
  useEffect(() => {
    if (!enabled) return;

    const handleContextMenu = async (e: MouseEvent) => {
      e.preventDefault();
      await logEvent('context_menu_blocked', 'warning', {
        x: e.clientX,
        y: e.clientY
      });
      return false;
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, [enabled, logEvent]);

  // Block text selection (optional - can be annoying for legitimate use)
  // Uncomment if needed for stricter proctoring
  /*
  useEffect(() => {
    if (!enabled) return;

    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('selectstart', handleSelectStart);
    return () => document.removeEventListener('selectstart', handleSelectStart);
  }, [enabled]);
  */

  return {
    isBlocking: enabled
  };
}
