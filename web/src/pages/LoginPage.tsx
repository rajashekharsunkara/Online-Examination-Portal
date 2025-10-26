import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

export function LoginPage() {
  const [hallTicket, setHallTicket] = useState('');
  const [dob, setDob] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/hall-ticket-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hall_ticket_number: hallTicket,
          date_of_birth: dob,
          security_answer: securityAnswer,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data = await response.json();
      
      // Store the access token
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Get student's assigned exam attempt
      const attemptsResponse = await fetch('http://localhost:8000/api/v1/attempts/me', {
        headers: {
          'Authorization': `Bearer ${data.access_token}`,
        },
      });

      if (attemptsResponse.ok) {
        const attempts = await attemptsResponse.json();
        if (attempts && attempts.length > 0) {
          // Navigate to the pre-exam instructions page first
          const assignedAttempt = attempts[0];
          navigate(`/exam/${assignedAttempt.id}/instructions`);
        } else {
          setError('No exam assigned. Please contact the examination center staff.');
        }
      } else {
        setError('Failed to load exam. Please try again or contact staff.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Examination Portal</h1>
        <p className="subtitle">Center-Based Exam Authentication</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="hallTicket">Hall Ticket Number</label>
            <input
              id="hallTicket"
              type="text"
              value={hallTicket}
              onChange={(e) => setHallTicket(e.target.value)}
              placeholder="Enter your hall ticket number"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="dob">Date of Birth (DD/MM/YYYY)</label>
            <input
              id="dob"
              type="text"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              placeholder="DD/MM/YYYY"
              pattern="\d{2}/\d{2}/\d{4}"
              required
            />
            <small>Format: DD/MM/YYYY (e.g., 15/08/2000)</small>
          </div>

          <div className="form-group">
            <label htmlFor="securityAnswer">Mother's Maiden Name</label>
            <input
              id="securityAnswer"
              type="text"
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              placeholder="Enter security answer"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Verifying...' : 'Start Exam'}
          </button>
        </form>

        <div className="demo-credentials">
          <p><strong>Demo Credentials:</strong></p>
          <p>Hall Ticket: HT2024001, HT2024002, ..., HT2024010</p>
          <p>DOB: 01/01/2000</p>
          <p>Security Answer: kumar</p>
        </div>
      </div>
    </div>
  );
}
