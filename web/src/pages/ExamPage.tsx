/**
 * Main Exam Page
 * Container for exam interface with timer, navigator, and questions
 * Includes offline resilience and connection status indicators
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/examStore';
import { useWebSocket, useCheckpoint, useExamTimer } from '../hooks/useExam';
import { useQuestionFlag } from '../hooks/useExam';
import { useOnlineStatus, useOfflineExam } from '../hooks/useOffline';
import { apiService } from '../services/api';
import { ExamTimer } from '../components/exam/ExamTimer';
import { QuestionNavigator } from '../components/exam/QuestionNavigator';
import { SubmitModal } from '../components/exam/SubmitModal';
import { OfflineIndicator } from '../components/exam/OfflineIndicator';
import { MCQQuestion } from '../components/questions/MCQQuestion';
import { TrueFalseQuestion } from '../components/questions/TrueFalseQuestion';
import { TextQuestion } from '../components/questions/TextQuestion';
// Proctoring imports
import { useFullScreen } from '../hooks/useFullScreen';
import { useVisibilityDetection } from '../hooks/useVisibilityDetection';
import { useKeyboardBlocking } from '../hooks/useKeyboardBlocking';
import { useQuestionTiming } from '../hooks/useQuestionTiming';
import type { Question } from '../types';
import './ExamPage.css';

export function ExamPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  
  const exam = useExamStore((state) => state.exam);
  const attempt = useExamStore((state) => state.attempt);
  const currentQuestionIndex = useExamStore((state) => state.currentQuestionIndex);
  const nextQuestion = useExamStore((state) => state.nextQuestion);
  const previousQuestion = useExamStore((state) => state.previousQuestion);
  const getCurrentQuestion = useExamStore((state) => state.getCurrentQuestion);
  const setAnswer = useExamStore((state) => state.setAnswer);
  const getAnswer = useExamStore((state) => state.getAnswer);
  const reset = useExamStore((state) => state.reset);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [encryptionStatus, setEncryptionStatus] = useState<string>('');
  const [encryptionChecksum, setEncryptionChecksum] = useState<string>('');

  const user = apiService.getStoredUser();
  const token = user ? localStorage.getItem('access_token') : null;

  // Offline resilience hooks
  const { isOnline, isOffline } = useOnlineStatus();
  const { saveExamData, loadExamData, isDataLoaded } = useOfflineExam(
    attemptId ? parseInt(attemptId) : 0
  );

  // Initialize WebSocket connection
  useWebSocket(attemptId || '', token || '');
  
  // Start auto-checkpoint
  const { checkpoint } = useCheckpoint();
  
  // Start timer
  useExamTimer();

  // Proctoring hooks (initialized early, safe with null question)
  const fullScreen = useFullScreen({
    attemptId: attemptId ? parseInt(attemptId) : 0,
    maxViolations: 3,
    enabled: true,
    onViolation: (count) => {
      if (count >= 3) {
        alert('⚠️ CRITICAL: Too many full-screen exits. Your exam is flagged for review.');
      }
    }
  });

  // Get current question (after hooks, safe to call anytime)
  const currentQuestion = getCurrentQuestion();
  
  // Get actual question ID (database ID) from current question, or undefined if no question
  const currentQuestionId = currentQuestion?.id;

  const visibility = useVisibilityDetection({
    attemptId: attemptId ? parseInt(attemptId) : 0,
    questionId: currentQuestionId, // Use actual question ID from database
    maxSwitches: 5,
    enabled: true,
    onTabSwitch: (count, duration) => {
      console.log(`[Proctoring] Tab switch #${count}, duration: ${duration}s`);
    }
  });

  useKeyboardBlocking({
    attemptId: attemptId ? parseInt(attemptId) : 0,
    enabled: true,
    allowSubmit: true
  });

  const questionTiming = useQuestionTiming({
    attemptId: attemptId ? parseInt(attemptId) : 0,
    questionId: currentQuestionId || 0, // Use actual question ID, fallback to 0 (will be filtered)
    enabled: !!exam && !!currentQuestionId, // Only enable when we have a valid question
    syncInterval: 15
  });

  // Request notification permission on mount (but don't force full-screen yet)
  useEffect(() => {
    if (attemptId) {
      // Only request notification permission, not full-screen
      // Full-screen will be triggered when user clicks "Start Exam" from instructions
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [attemptId]);

  // Load exam and attempt data
  useEffect(() => {
    const loadExamDataFromServer = async () => {
      if (!attemptId) {
        setError('Invalid attempt ID');
        setIsLoading(false);
        return;
      }

      try {
        let attemptData = await apiService.getAttempt(parseInt(attemptId));
        const examData = await apiService.getExam(attemptData.exam_id);

        // Begin the attempt if it's NOT_STARTED
        const status = String(attemptData.status).toLowerCase();
        if (status === 'not_started') {
          console.log('[ExamPage] Starting NOT_STARTED attempt...');
          try {
            attemptData = await apiService.beginAttempt(parseInt(attemptId));
            console.log('[ExamPage] Attempt started successfully:', attemptData.status);
          } catch (err) {
            console.error('[ExamPage] Failed to begin attempt:', err);
            // Continue anyway - user might be able to start later
          }
        }

        // Transform question options from object to array
        // Backend sends: {"A": "text", "B": "text", ...}
        // Frontend expects: ["text", "text", ...]
        if (examData.questions) {
          examData.questions = examData.questions.map((q: any) => {
            if (q.options && typeof q.options === 'object' && !Array.isArray(q.options)) {
              // Convert object to array, sorted by key (A, B, C, D)
              const optionsArray = Object.keys(q.options)
                .sort()
                .map(key => q.options[key]);
              return { ...q, options: optionsArray };
            }
            return q;
          });
        }

        useExamStore.setState({
          exam: examData,
          attempt: attemptData,
          timeRemaining: attemptData.time_remaining_seconds || 0,
        });

        // Load existing answers
        const answers = await apiService.getAnswers(parseInt(attemptId));
        const answersMap: Record<number, any> = {};
        answers.forEach((ans) => {
          answersMap[ans.question_id] = {
            answer: ans.answer,
            isFlagged: ans.is_flagged || false,
            timeSpent: ans.time_spent_seconds || 0,
            sequence: 0,
            lastUpdated: new Date(),
          };
        });
        useExamStore.setState({ answers: answersMap });

        // Save to IndexedDB for offline access
        if (saveExamData) {
          await saveExamData(examData, attemptData, answersMap);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load exam from server:', err);
        
        // Try loading from IndexedDB if offline
        if (loadExamData) {
          try {
            const offlineData = await loadExamData();
            if (offlineData) {
              console.log('[ExamPage] Loaded exam data from IndexedDB (offline mode)');
              setIsLoading(false);
              return;
            }
          } catch (offlineErr) {
            console.error('Failed to load from IndexedDB:', offlineErr);
          }
        }
        
        setError('Failed to load exam. Please check your connection and try again.');
        setIsLoading(false);
      }
    };

    loadExamDataFromServer();

    // Cleanup on unmount
    return () => {
      reset();
    };
  }, [attemptId, reset, saveExamData, loadExamData]);

  // Prevent accidental navigation away
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const { toggleFlag, isFlagged } = useQuestionFlag(currentQuestion?.id || 0);

  const handleAnswerChange = (value: any) => {
    if (!currentQuestion) return;
    setAnswer(currentQuestion.id, value);
    
    // Track answer change for proctoring
    if (questionTiming && typeof value === 'string') {
      questionTiming.recordAnswerChange(value);
    }
  };

  const handleSubmit = async () => {
    // Prevent submission when offline
    if (isOffline) {
      alert('Cannot submit exam while offline. Please wait for connection to be restored.');
      return;
    }
    
    setShowSubmitModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (!attemptId || !exam || !attempt || !user) return;

    setIsSubmitting(true);
    
    try {
      // Save final checkpoint first
      await checkpoint();

      // Exit full-screen mode before submission
      await fullScreen.exitFullScreen();

      // Encrypt answers before submission
      setEncryptionStatus('Encrypting your answers...');
      
      const { encryptAnswers, generateChecksum } = await import('../services/crypto');
      
      // Get all answers from store
      const answers = useExamStore.getState().answers;
      
      // Convert answers to array format expected by crypto service
      const answersArray = Object.entries(answers).map(([questionId, data]) => ({
        questionId: parseInt(questionId),
        answer: data.answer,
        isFlagged: data.isFlagged,
        timeSpent: data.timeSpent,
        sequence: data.sequence
      }));
      
      // Encrypt with username, exam_id, and encryption_salt from attempt
      const encryptedData = await encryptAnswers(
        answersArray,
        user.username,
        exam.id,
        attempt.encryption_salt || ''
      );
      
      // Generate checksum
      const checksum = await generateChecksum(encryptedData);
      setEncryptionChecksum(checksum);
      setEncryptionStatus('Encryption complete. Submitting...');
      
      // Get timestamp from encrypted data (it's embedded in the encryption)
      const timestamp = new Date().toISOString();

      // Submit the exam with encrypted data
      await apiService.submitAttempt(
        parseInt(attemptId), 
        true,
        encryptedData,
        timestamp,
        checksum
      );

      // Navigate to results page
      navigate(`/results/${attemptId}`);
    } catch (err) {
      console.error('Failed to submit exam:', err);
      alert('Failed to submit exam. Please try again.');
      setIsSubmitting(false);
      setShowSubmitModal(false);
      setEncryptionStatus('');
      setEncryptionChecksum('');
    }
  };

  const renderQuestion = (question: Question) => {
    const currentAnswer = getAnswer(question.id);
    
    // Normalize question type to handle both frontend and backend formats
    const questionType = question.question_type?.toLowerCase();

    switch (questionType) {
      case 'mcq_single':
      case 'mcq_multiple':
      case 'multiple_choice': // Backend format
        return (
          <MCQQuestion
            question={question}
            value={currentAnswer?.answer || null}
            onChange={handleAnswerChange}
          />
        );

      case 'true_false':
        return (
          <TrueFalseQuestion
            question={question}
            value={currentAnswer?.answer || null}
            onChange={handleAnswerChange}
          />
        );

      case 'short_answer':
      case 'long_answer':
      case 'essay': // Backend format
        return (
          <TextQuestion
            question={question}
            value={currentAnswer?.answer || null}
            onChange={handleAnswerChange}
          />
        );

      default:
        return (
          <div className="unsupported-question">
            <p>⚠️ Unsupported question type: {question.question_type}</p>
            <p>Question ID: {question.id}</p>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="exam-page-loading">
        <div className="spinner-large"></div>
        <p>Loading exam...</p>
      </div>
    );
  }

  if (error || !exam || !attempt) {
    return (
      <div className="exam-page-error">
        <h2>Error</h2>
        <p>{error || 'Failed to load exam'}</p>
        <button onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  // If exam is loaded but no current question, show a message (shouldn't happen in normal flow)
  if (!currentQuestion) {
    return (
      <div className="exam-page-error">
        <h2>No Questions Available</h2>
        <p>This exam doesn't have any questions yet.</p>
        <button onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  return (
    <div className="exam-page">
      {/* Proctoring Violation Warnings */}
      {!fullScreen.isFullScreen && (
        <div className="proctoring-warning proctoring-critical">
          ⚠️ WARNING: You have exited full-screen mode! Return to full-screen immediately. 
          Violation logged ({fullScreen.exitCount}/{3})
        </div>
      )}
      
      {visibility.warningMessage && (
        <div className="proctoring-warning proctoring-warning-level">
          ⚠️ {visibility.warningMessage}
        </div>
      )}

      {/* Header */}
      <header className="exam-header">
        <div className="exam-info">
          <h1>{exam.title}</h1>
          <span className="exam-code">{exam.exam_code}</span>
        </div>
        <div className="exam-timer-container">
          <ExamTimer />
        </div>
      </header>

      {/* Main Content */}
      <div className="exam-content">
        {/* Sidebar Navigator */}
        <aside className="exam-sidebar">
          <QuestionNavigator />
        </aside>

        {/* Question Panel */}
        <main className="exam-main">
          <div className="question-header">
            <h2>
              Question {currentQuestionIndex + 1} of {exam.questions.length}
            </h2>
            <button
              className={`flag-button ${isFlagged ? 'flagged' : ''}`}
              onClick={toggleFlag}
              title={isFlagged ? 'Remove flag' : 'Flag for review'}
            >
              {isFlagged ? '🚩 Flagged' : '🏳️ Flag'}
            </button>
          </div>

          <div className="question-container">
            {renderQuestion(currentQuestion)}
          </div>

          {/* Navigation Footer */}
          <div className="question-footer">
            <button
              className="btn btn-nav"
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              ← Previous
            </button>

            <button className="btn btn-submit" onClick={handleSubmit}>
              Submit Exam
            </button>

            <button
              className="btn btn-nav"
              onClick={nextQuestion}
              disabled={currentQuestionIndex === exam.questions.length - 1}
            >
              Next →
            </button>
          </div>
        </main>
      </div>

      {/* Submit Modal */}
      <SubmitModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={handleConfirmSubmit}
        isSubmitting={isSubmitting}
        encryptionStatus={encryptionStatus}
        encryptionChecksum={encryptionChecksum}
      />
      
      {/* Offline Status Indicator */}
      <OfflineIndicator />
    </div>
  );
}
