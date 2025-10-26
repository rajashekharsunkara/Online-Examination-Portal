/**
 * Results Page
 * Displays exam results with score breakdown, analytics, and feedback
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import type { AttemptResult, Question } from '../types';
import './ResultPage.css';

interface Analytics {
  percentile_rank: number;
  total_score: number;
  questions_correct: number;
  questions_answered: number;
  average_time_per_question: number;
  comparison_to_average: {
    score_diff: number;
    above_average: boolean;
  };
}

interface ExamAnalytics {
  average_score: number;
  median_score: number;
  pass_rate: number;
  percentiles: {
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
}

interface Feedback {
  id: number;
  rubric_title: string;
  total_score: number;
  max_score: number;
  percentage: number;
  comments: string;
  grader_name: string;
  criterion_scores: Array<{
    criterion_name: string;
    level_name: string;
    points_awarded: number;
    max_points: number;
    comments: string;
  }>;
}

export function ResultPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [result, setResult] = useState<AttemptResult | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [examAnalytics, setExamAnalytics] = useState<ExamAnalytics | null>(null);
  const [feedbacks, setFeedbacks] = useState<Record<number, Feedback>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);

  useEffect(() => {
    const loadResult = async () => {
      if (!attemptId) {
        setError('Invalid attempt ID');
        setIsLoading(false);
        return;
      }

      try {
        // Load result
        const resultData = await apiService.getAttemptResult(parseInt(attemptId));
        setResult(resultData);

        // Load analytics
        try {
          const analyticsData = await fetch(`/api/rubrics/analytics/attempt/${attemptId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          if (analyticsData.ok) {
            setAnalytics(await analyticsData.json());
          }
        } catch (err) {
          console.warn('Failed to load analytics:', err);
        }

        // Load exam analytics
        if (resultData.exam?.id) {
          try {
            const examAnalyticsData = await fetch(`/api/rubrics/analytics/exam/${resultData.exam.id}`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (examAnalyticsData.ok) {
              setExamAnalytics(await examAnalyticsData.json());
            }
          } catch (err) {
            console.warn('Failed to load exam analytics:', err);
          }
        }

        // Load feedback for each answered question
        if (resultData.answers) {
          const feedbackMap: Record<number, Feedback> = {};
          for (const answer of resultData.answers) {
            if (answer.id) {
              try {
                const feedbackData = await fetch(`/api/rubrics/answer/${answer.id}/feedback`, {
                  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                if (feedbackData.ok) {
                  const feedback = await feedbackData.json();
                  if (feedback && feedback.length > 0) {
                    feedbackMap[answer.question_id] = feedback[0];
                  }
                }
              } catch (err) {
                console.warn(`Failed to load feedback for answer ${answer.id}:`, err);
              }
            }
          }
          setFeedbacks(feedbackMap);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load results:', err);
        setError('Failed to load results. Please try again.');
        setIsLoading(false);
      }
    };

    loadResult();
  }, [attemptId]);

  const getQuestionStatus = (question: Question, userAnswer: any): 'correct' | 'incorrect' | 'unattempted' => {
    if (!userAnswer) return 'unattempted';
    
    // For auto-graded questions
    if (question.question_type === 'mcq_single') {
      return userAnswer === question.correct_answer ? 'correct' : 'incorrect';
    }
    if (question.question_type === 'true_false') {
      return userAnswer === question.correct_answer ? 'correct' : 'incorrect';
    }
    if (question.question_type === 'mcq_multiple') {
      const correctSet = new Set(question.correct_answer || []);
      const userSet = new Set(userAnswer || []);
      if (correctSet.size !== userSet.size) return 'incorrect';
      for (const ans of correctSet) {
        if (!userSet.has(ans)) return 'incorrect';
      }
      return 'correct';
    }

    // For manual grading
    return 'unattempted'; // Will be graded manually
  };

  const calculateScorePercentage = (): number => {
    if (!result) return 0;
    const totalMarks = result.total_marks || 1;
    return Math.round((result.score / totalMarks) * 100);
  };

  const isPassed = (): boolean => {
    if (!result || !result.exam) return false;
    const percentage = calculateScorePercentage();
    return percentage >= (result.exam.passing_percentage || 0);
  };

  if (isLoading) {
    return (
      <div className="result-page-loading">
        <div className="spinner-large"></div>
        <p>Loading results...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="result-page-error">
        <h2>Error</h2>
        <p>{error || 'Failed to load results'}</p>
        <button onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  const scorePercentage = calculateScorePercentage();
  const passed = isPassed();

  return (
    <div className="result-page">
      <div className="result-container">
        {/* Header */}
        <header className="result-header">
          <h1>Exam Results</h1>
          <div className="exam-title">{result.exam.title}</div>
          <div className="exam-code">Code: {result.exam.exam_code}</div>
        </header>

        {/* Score Card */}
        <div className="score-card">
          <div className={`pass-fail-badge ${passed ? 'passed' : 'failed'}`}>
            {passed ? '✓ PASSED' : '✗ FAILED'}
          </div>

          <div className="score-display">
            <div className="score-value">{scorePercentage}%</div>
            <div className="score-label">Your Score</div>
          </div>

          <div className="score-details">
            <div className="detail-item">
              <span className="detail-label">Marks Obtained:</span>
              <span className="detail-value">{result.score} / {result.total_marks}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Questions Answered:</span>
              <span className="detail-value">{result.questions_answered} / {result.total_questions}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Passing Percentage:</span>
              <span className="detail-value">{result.exam.passing_percentage}%</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Time Taken:</span>
              <span className="detail-value">
                {Math.floor(result.time_taken_seconds / 60)} min {result.time_taken_seconds % 60} sec
              </span>
            </div>
          </div>
        </div>

        {/* Performance Analytics */}
        {analytics && (
          <div className="analytics-section">
            <h2>Performance Analytics</h2>
            <div className="analytics-grid">
              <div className="analytics-card">
                <div className="analytics-label">Percentile Rank</div>
                <div className="analytics-value">{analytics.percentile_rank}th</div>
                <div className="analytics-description">
                  You scored better than {analytics.percentile_rank}% of students
                </div>
              </div>
              <div className="analytics-card">
                <div className="analytics-label">Score vs Average</div>
                <div className={`analytics-value ${analytics.comparison_to_average.above_average ? 'positive' : 'negative'}`}>
                  {analytics.comparison_to_average.above_average ? '+' : ''}{analytics.comparison_to_average.score_diff.toFixed(1)}
                </div>
                <div className="analytics-description">
                  {analytics.comparison_to_average.above_average ? 'Above' : 'Below'} exam average
                </div>
              </div>
              <div className="analytics-card">
                <div className="analytics-label">Avg. Time per Question</div>
                <div className="analytics-value">{Math.round(analytics.average_time_per_question)}s</div>
                <div className="analytics-description">
                  {analytics.questions_answered} questions answered
                </div>
              </div>
              <div className="analytics-card">
                <div className="analytics-label">Accuracy Rate</div>
                <div className="analytics-value">
                  {analytics.questions_answered > 0 
                    ? Math.round((analytics.questions_correct / analytics.questions_answered) * 100) 
                    : 0}%
                </div>
                <div className="analytics-description">
                  {analytics.questions_correct} correct answers
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Exam Statistics */}
        {examAnalytics && (
          <div className="exam-stats-section">
            <h2>Exam Statistics</h2>
            <div className="stats-row">
              <div className="stat-box">
                <div className="stat-label">Class Average</div>
                <div className="stat-value">{examAnalytics.average_score.toFixed(1)}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Median Score</div>
                <div className="stat-value">{examAnalytics.median_score.toFixed(1)}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Pass Rate</div>
                <div className="stat-value">{examAnalytics.pass_rate.toFixed(1)}%</div>
              </div>
            </div>
            
            {/* Percentile Chart */}
            <div className="percentile-chart">
              <h3>Score Distribution</h3>
              <div className="percentile-bars">
                <div className="percentile-bar">
                  <div className="bar-label">90th</div>
                  <div className="bar-value">{examAnalytics.percentiles.p90}</div>
                </div>
                <div className="percentile-bar">
                  <div className="bar-label">75th</div>
                  <div className="bar-value">{examAnalytics.percentiles.p75}</div>
                </div>
                <div className="percentile-bar highlight">
                  <div className="bar-label">50th (Median)</div>
                  <div className="bar-value">{examAnalytics.percentiles.p50}</div>
                </div>
                <div className="percentile-bar">
                  <div className="bar-label">25th</div>
                  <div className="bar-value">{examAnalytics.percentiles.p25}</div>
                </div>
                <div className="percentile-bar">
                  <div className="bar-label">10th</div>
                  <div className="bar-value">{examAnalytics.percentiles.p10}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Question-wise Breakdown */}
        <div className="breakdown-section">
          <h2>Question-wise Breakdown</h2>
          
          <div className="breakdown-controls">
            <button 
              className="btn btn-sm" 
              onClick={() => setShowCorrectAnswers(!showCorrectAnswers)}
            >
              {showCorrectAnswers ? 'Hide' : 'Show'} Correct Answers
            </button>
          </div>
          
          <div className="breakdown-table">
            <div className="table-header">
              <div className="col-num">#</div>
              <div className="col-question">Question</div>
              <div className="col-marks">Marks</div>
              <div className="col-status">Status</div>
            </div>

            {result.exam.questions.map((question, index) => {
              const answer = result.answers.find((a) => a.question_id === question.id);
              const status = getQuestionStatus(question, answer?.answer);
              const feedback = feedbacks[question.id];

              return (
                <div key={question.id} className="table-row-expanded">
                  <div className="table-row">
                    <div className="col-num">{index + 1}</div>
                    <div className="col-question">
                      <div className="question-text">{question.question_text}</div>
                      <div className="question-type">{question.question_type}</div>
                    </div>
                    <div className="col-marks">
                      {answer?.marks_awarded !== undefined
                        ? `${answer.marks_awarded} / ${question.marks}`
                        : `0 / ${question.marks}`}
                    </div>
                    <div className="col-status">
                      <span className={`status-badge ${status}`}>
                        {status === 'correct' && '✓ Correct'}
                        {status === 'incorrect' && '✗ Incorrect'}
                        {status === 'unattempted' && '— Unattempted'}
                      </span>
                    </div>
                  </div>

                  {/* Show correct answer if enabled */}
                  {showCorrectAnswers && question.correct_answer && (
                    <div className="correct-answer-section">
                      <strong>Correct Answer:</strong>{' '}
                      {Array.isArray(question.correct_answer) 
                        ? question.correct_answer.join(', ') 
                        : question.correct_answer}
                    </div>
                  )}

                  {/* Show feedback if available */}
                  {feedback && (
                    <div className="feedback-section">
                      <div className="feedback-header">
                        <strong>Manual Grading Feedback</strong>
                        <span className="grader-name">by {feedback.grader_name}</span>
                      </div>
                      <div className="feedback-rubric">
                        <strong>{feedback.rubric_title}</strong> - {feedback.percentage.toFixed(1)}%
                      </div>
                      
                      {/* Criterion breakdown */}
                      {feedback.criterion_scores && feedback.criterion_scores.length > 0 && (
                        <div className="criterion-scores">
                          {feedback.criterion_scores.map((cs, idx) => (
                            <div key={idx} className="criterion-row">
                              <span className="criterion-name">{cs.criterion_name}:</span>
                              <span className="criterion-level">{cs.level_name}</span>
                              <span className="criterion-points">
                                {cs.points_awarded}/{cs.max_points} pts
                              </span>
                              {cs.comments && (
                                <div className="criterion-comments">{cs.comments}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Overall comments */}
                      {feedback.comments && (
                        <div className="feedback-comments">
                          <strong>Comments:</strong> {feedback.comments}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="result-footer">
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Go to Dashboard
          </button>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            Print Results
          </button>
        </div>
      </div>
    </div>
  );
}
