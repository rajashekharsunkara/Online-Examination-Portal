import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';

interface Attempt {
  id: number;
  exam_id: number;
  status: string;
  started_at: string;
  exam: {
    title: string;
    description: string;
    duration_minutes: number;
  };
}

export function DashboardPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadAttempts();
  }, []);

  const loadAttempts = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:8000/api/v1/attempts/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.clear();
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load attempts');
      }

      const data = await response.json();
      setAttempts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleStartExam = (attemptId: number) => {
    navigate(`/exam/${attemptId}`);
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>My Exam Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {attempts.length === 0 ? (
        <div className="no-attempts">
          <h2>No Exams Available</h2>
          <p>You don't have any exam attempts assigned yet.</p>
          <p>Please contact your administrator or hall in-charge.</p>
        </div>
      ) : (
        <div className="attempts-grid">
          {attempts.map((attempt) => (
            <div key={attempt.id} className="attempt-card">
              <h3>{attempt.exam.title}</h3>
              <p className="description">{attempt.exam.description}</p>
              <div className="attempt-details">
                <p><strong>Duration:</strong> {attempt.exam.duration_minutes} minutes</p>
                <p><strong>Status:</strong> <span className={`status-${attempt.status.toLowerCase()}`}>{attempt.status}</span></p>
                <p><strong>Started:</strong> {new Date(attempt.started_at).toLocaleString()}</p>
              </div>
              <button
                onClick={() => handleStartExam(attempt.id)}
                className="start-exam-button"
                disabled={attempt.status === 'COMPLETED' || attempt.status === 'GRADED'}
              >
                {attempt.status === 'IN_PROGRESS' ? 'Continue Exam' : 
                 attempt.status === 'COMPLETED' ? 'Exam Completed' :
                 attempt.status === 'GRADED' ? 'View Results' :
                 'Start Exam'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
