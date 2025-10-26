import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PreExamInstructions.css';

interface ExamDetails {
  exam_title: string;
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  passing_marks: number;
  trade_name: string;
}

interface StudentDetails {
  hall_ticket_number: string;
  full_name: string;
  center_name: string;
  district: string;
}

interface PreExamInstructionsProps {
  examDetails: ExamDetails;
  studentDetails: StudentDetails;
  attemptId: number;
}

export function PreExamInstructions({ examDetails, studentDetails, attemptId }: PreExamInstructionsProps) {
  const [timeRemaining, setTimeRemaining] = useState(900); // 15 minutes = 900 seconds
  const [detailsConfirmed, setDetailsConfirmed] = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const navigate = useNavigate();

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const canStartExam = timeRemaining === 0 && detailsConfirmed && rulesAccepted;

  const handleStartExam = () => {
    if (canStartExam) {
      // Request fullscreen
      document.documentElement.requestFullscreen().then(() => {
        navigate(`/exam/${attemptId}`);
      }).catch(err => {
        alert('Please allow full-screen mode to start the exam');
        console.error('Fullscreen error:', err);
      });
    }
  };

  return (
    <div className="pre-exam-container">
      <div className="pre-exam-header">
        <h1>🎓 Examination Portal</h1>
        <div className="timer-badge">
          <span className="timer-label">Wait Time:</span>
          <span className={`timer-value ${timeRemaining === 0 ? 'ready' : ''}`}>
            {formatTime(timeRemaining)}
          </span>
        </div>
      </div>

      <div className="pre-exam-content">
        {/* Student Details Confirmation */}
        <section className="details-section">
          <h2>📋 Confirm Your Details</h2>
          <div className="details-grid">
            <div className="detail-item">
              <label>Hall Ticket Number:</label>
              <strong>{studentDetails.hall_ticket_number}</strong>
            </div>
            <div className="detail-item">
              <label>Student Name:</label>
              <strong>{studentDetails.full_name}</strong>
            </div>
            <div className="detail-item">
              <label>Exam Center:</label>
              <strong>{studentDetails.center_name}</strong>
            </div>
            <div className="detail-item">
              <label>District:</label>
              <strong>{studentDetails.district}</strong>
            </div>
            <div className="detail-item">
              <label>Trade:</label>
              <strong>{examDetails.trade_name}</strong>
            </div>
            <div className="detail-item">
              <label>Exam:</label>
              <strong>{examDetails.exam_title}</strong>
            </div>
          </div>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={detailsConfirmed}
              onChange={(e) => setDetailsConfirmed(e.target.checked)}
            />
            <span>I confirm that the above details are correct</span>
          </label>
        </section>

        {/* Exam Information */}
        <section className="info-section">
          <h2>📝 Exam Information</h2>
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon">⏱️</div>
              <div className="info-content">
                <div className="info-label">Duration</div>
                <div className="info-value">{examDetails.duration_minutes} minutes</div>
              </div>
            </div>
            <div className="info-card">
              <div className="info-icon">❓</div>
              <div className="info-content">
                <div className="info-label">Questions</div>
                <div className="info-value">{examDetails.total_questions}</div>
              </div>
            </div>
            <div className="info-card">
              <div className="info-icon">💯</div>
              <div className="info-content">
                <div className="info-label">Total Marks</div>
                <div className="info-value">{examDetails.total_marks}</div>
              </div>
            </div>
            <div className="info-card">
              <div className="info-icon">✅</div>
              <div className="info-content">
                <div className="info-label">Passing Marks</div>
                <div className="info-value">{examDetails.passing_marks}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Rules and Regulations */}
        <section className="rules-section">
          <h2>⚠️ Important Instructions & Rules</h2>
          <div className="rules-content">
            <h3>General Guidelines:</h3>
            <ul>
              <li>The exam will be conducted in <strong>FULL-SCREEN MODE ONLY</strong></li>
              <li>You <strong>CANNOT</strong> exit full-screen during the exam</li>
              <li>You <strong>CANNOT</strong> switch tabs or windows during the exam</li>
              <li>You <strong>CANNOT</strong> use keyboard shortcuts (Ctrl+C, Ctrl+V, etc.)</li>
              <li>All your activities will be <strong>MONITORED AND RECORDED</strong></li>
              <li>The exam will <strong>AUTO-SUBMIT</strong> when time expires</li>
            </ul>

            <h3>Exam Rules:</h3>
            <ul>
              <li><strong>Duration:</strong> {examDetails.duration_minutes} minutes (strict timer)</li>
              <li><strong>Questions:</strong> All {examDetails.total_questions} questions are mandatory</li>
              <li><strong>Marking Scheme:</strong> +4 marks for correct answer, -1 for wrong answer</li>
              <li><strong>No negative marking</strong> for unattempted questions</li>
              <li>You can review and change answers before final submission</li>
              <li><strong>Auto-save:</strong> Your answers are saved every 15 seconds</li>
            </ul>

            <h3>Prohibited Activities:</h3>
            <ul className="prohibited-list">
              <li>❌ Exiting full-screen mode</li>
              <li>❌ Switching to other tabs or applications</li>
              <li>❌ Using keyboard shortcuts (Alt+Tab, Ctrl+C, etc.)</li>
              <li>❌ Opening new windows or browsers</li>
              <li>❌ Refreshing the page (auto-save protects your work)</li>
              <li>❌ Using external devices or calculators</li>
              <li>❌ Communicating with others during exam</li>
            </ul>

            <h3>Proctoring & Monitoring:</h3>
            <ul>
              <li>🎥 All exam activities are recorded</li>
              <li>⏱️ Time spent on each question is tracked</li>
              <li>🔍 Tab switches and full-screen exits are logged</li>
              <li>📊 Answer changes and patterns are monitored</li>
              <li>⚠️ Suspicious activity may lead to exam cancellation</li>
            </ul>

            <h3>Technical Requirements:</h3>
            <ul>
              <li>✓ Stable internet connection required</li>
              <li>✓ Use latest Chrome, Firefox, or Edge browser</li>
              <li>✓ Screen resolution: Minimum 1024x768</li>
              <li>✓ Disable pop-up blockers</li>
              <li>✓ Close all other applications before starting</li>
            </ul>

            <h3>Auto-Submit Policy:</h3>
            <ul>
              <li>⏰ Exam will automatically submit when timer reaches 00:00</li>
              <li>📤 You cannot make any changes after auto-submit</li>
              <li>💾 All answers saved till that point will be submitted</li>
              <li>🔒 Submission is final and cannot be undone</li>
            </ul>

            <div className="warning-box">
              <strong>⚠️ WARNING:</strong> Violation of any rule may result in immediate exam cancellation
              and your attempt will be marked as invalid. Ensure you understand and agree to all rules
              before proceeding.
            </div>
          </div>

          <label className="checkbox-label rules-acceptance">
            <input
              type="checkbox"
              checked={rulesAccepted}
              onChange={(e) => setRulesAccepted(e.target.checked)}
            />
            <span>
              I have read and understood all the instructions, rules, and regulations mentioned above.
              I agree to follow all the guidelines during the examination.
            </span>
          </label>
        </section>

        {/* Start Exam Button */}
        <div className="start-exam-section">
          {timeRemaining > 0 && (
            <p className="wait-message">
              ⏳ Please wait {formatTime(timeRemaining)} before you can start the exam.
              Use this time to carefully read all instructions.
            </p>
          )}
          
          {timeRemaining === 0 && (!detailsConfirmed || !rulesAccepted) && (
            <p className="requirement-message">
              ⚠️ Please confirm your details and accept the rules to proceed
            </p>
          )}

          <button
            className={`start-exam-btn ${canStartExam ? 'active' : 'disabled'}`}
            onClick={handleStartExam}
            disabled={!canStartExam}
          >
            {canStartExam ? '🚀 Start Exam (Full-Screen Mode)' : '⏳ Waiting...'}
          </button>

          {canStartExam && (
            <p className="fullscreen-note">
              <strong>Note:</strong> Clicking "Start Exam" will open the exam in full-screen mode.
              Make sure you are ready to begin.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
