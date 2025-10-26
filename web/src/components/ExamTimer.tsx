import { useEffect, useState } from 'react';
import './ExamTimer.css';

interface ExamTimerProps {
  durationMinutes: number;
  onTimeExpired: () => void;
  onWarning?: (minutesRemaining: number) => void;
  autoStart?: boolean;
}

export function ExamTimer({ 
  durationMinutes, 
  onTimeExpired, 
  onWarning,
  autoStart = true 
}: ExamTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(durationMinutes * 60); // in seconds
  const [isRunning, setIsRunning] = useState(autoStart);
  const [hasWarned5Min, setHasWarned5Min] = useState(false);
  const [hasWarned1Min, setHasWarned1Min] = useState(false);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer countdown
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRunning(false);
          onTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, onTimeExpired]);

  // Warning alerts
  useEffect(() => {
    const minutes = Math.floor(timeRemaining / 60);

    // 5-minute warning
    if (minutes === 5 && !hasWarned5Min && timeRemaining <= 300) {
      setHasWarned5Min(true);
      if (onWarning) onWarning(5);
      
      // Show browser notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('⏰ Exam Timer Warning', {
          body: '5 minutes remaining in your exam!',
          icon: '/exam-icon.png'
        });
      }
    }

    // 1-minute warning
    if (minutes === 1 && !hasWarned1Min && timeRemaining <= 60) {
      setHasWarned1Min(true);
      if (onWarning) onWarning(1);
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('⚠️ URGENT: Exam Timer', {
          body: '1 minute remaining! Please complete your exam.',
          icon: '/exam-icon.png',
          requireInteraction: true
        });
      }
    }
  }, [timeRemaining, hasWarned5Min, hasWarned1Min, onWarning]);

  const minutes = Math.floor(timeRemaining / 60);
  const getTimerClass = () => {
    if (timeRemaining <= 60) return 'timer-critical'; // Last minute - red
    if (timeRemaining <= 300) return 'timer-warning'; // Last 5 minutes - orange
    return 'timer-normal'; // Normal - green
  };

  return (
    <div className={`exam-timer ${getTimerClass()}`}>
      <div className="timer-icon">
        {timeRemaining <= 60 ? '🚨' : timeRemaining <= 300 ? '⚠️' : '⏱️'}
      </div>
      <div className="timer-content">
        <div className="timer-label">Time Remaining</div>
        <div className="timer-display">{formatTime(timeRemaining)}</div>
        {timeRemaining <= 300 && (
          <div className="timer-message">
            {timeRemaining <= 60 
              ? 'LESS THAN 1 MINUTE!' 
              : `${minutes} minute${minutes !== 1 ? 's' : ''} left`}
          </div>
        )}
      </div>
    </div>
  );
}
