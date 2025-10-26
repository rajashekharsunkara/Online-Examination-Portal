/**
 * Exam Timer Component
 * Displays countdown timer with visual warnings
 */

import { useExamTimer } from '../../hooks/useExam';
import './ExamTimer.css';

export function ExamTimer() {
  const { formattedTime, timeRemaining, isLowTime, isCriticalTime } = useExamTimer();

  const getTimerClass = () => {
    if (isCriticalTime) return 'timer-critical';
    if (isLowTime) return 'timer-warning';
    return 'timer-normal';
  };

  const getWarningMessage = () => {
    if (isCriticalTime) return '⚠️ Less than 1 minute remaining!';
    if (isLowTime) return '⏰ Less than 10 minutes remaining';
    return null;
  };

  return (
    <div className={`exam-timer ${getTimerClass()}`}>
      <div className="timer-label">Time Remaining</div>
      <div className="timer-value">{formattedTime}</div>
      {getWarningMessage() && (
        <div className="timer-warning-message">{getWarningMessage()}</div>
      )}
    </div>
  );
}
