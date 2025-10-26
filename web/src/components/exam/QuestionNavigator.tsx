/**
 * Question Navigator Component
 * Sidebar showing all questions with status indicators
 */

import { useExamStore } from '../../store/examStore';
import './QuestionNavigator.css';

export function QuestionNavigator() {
  const exam = useExamStore((state) => state.exam);
  const currentQuestionIndex = useExamStore((state) => state.currentQuestionIndex);
  const goToQuestion = useExamStore((state) => state.goToQuestion);
  const isQuestionAnswered = useExamStore((state) => state.isQuestionAnswered);
  const isQuestionFlagged = useExamStore((state) => state.isQuestionFlagged);
  const getProgress = useExamStore((state) => state.getProgress);

  const progress = getProgress();

  if (!exam) return null;

  const getQuestionClass = (index: number, questionId: number) => {
    const classes = ['question-nav-item'];
    
    if (index === currentQuestionIndex) classes.push('current');
    if (isQuestionAnswered(questionId)) classes.push('answered');
    if (isQuestionFlagged(questionId)) classes.push('flagged');
    
    return classes.join(' ');
  };

  return (
    <div className="question-navigator">
      <div className="navigator-header">
        <h3>Questions</h3>
        <div className="progress-summary">
          <div className="progress-stat">
            <span className="stat-value">{progress.answered}</span>
            <span className="stat-label">Answered</span>
          </div>
          <div className="progress-stat">
            <span className="stat-value">{progress.unanswered}</span>
            <span className="stat-label">Remaining</span>
          </div>
          <div className="progress-stat">
            <span className="stat-value">{progress.flagged}</span>
            <span className="stat-label">Flagged</span>
          </div>
        </div>
      </div>

      <div className="question-grid">
        {exam.questions.map((question, index) => (
          <button
            key={question.id}
            className={getQuestionClass(index, question.id)}
            onClick={() => goToQuestion(index)}
            title={
              isQuestionFlagged(question.id)
                ? 'Flagged for review'
                : isQuestionAnswered(question.id)
                ? 'Answered'
                : 'Not answered'
            }
          >
            {index + 1}
            {isQuestionFlagged(question.id) && <span className="flag-icon">🚩</span>}
          </button>
        ))}
      </div>

      <div className="navigator-legend">
        <div className="legend-item">
          <span className="legend-box answered"></span>
          <span>Answered</span>
        </div>
        <div className="legend-item">
          <span className="legend-box not-answered"></span>
          <span>Not Answered</span>
        </div>
        <div className="legend-item">
          <span className="legend-box flagged"></span>
          <span>Flagged</span>
        </div>
        <div className="legend-item">
          <span className="legend-box current"></span>
          <span>Current</span>
        </div>
      </div>
    </div>
  );
}
