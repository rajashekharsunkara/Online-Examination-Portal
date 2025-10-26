import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PreExamInstructions } from './PreExamInstructions';
import { apiService } from '../services/api';

export function PreExamInstructionsPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [examDetails, setExamDetails] = useState<any>(null);
  const [studentDetails, setStudentDetails] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!attemptId) {
        setError('Invalid attempt ID');
        setLoading(false);
        return;
      }

      try {
        // Fetch attempt and exam details
        const attemptData = await apiService.getAttempt(parseInt(attemptId));
        const examData = await apiService.getExam(attemptData.exam_id);
        const user = apiService.getStoredUser();

        if (!user) {
          setError('User not authenticated');
          setLoading(false);
          return;
        }

        setExamDetails({
          exam_title: examData.title,
          duration_minutes: examData.duration_minutes || 30,
          total_questions: examData.questions?.length || 0,
          total_marks: examData.total_marks || 0,
          passing_marks: examData.passing_marks || 0,
          trade_name: examData.trade?.name || 'General'
        });

        setStudentDetails({
          hall_ticket_number: user.hall_ticket_number || user.username,
          full_name: user.full_name || user.username,
          center_name: user.center?.name || 'N/A',
          district: user.center?.district || 'N/A'
        });

        setLoading(false);
      } catch (err) {
        console.error('Failed to load exam details:', err);
        setError('Failed to load exam details. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, [attemptId]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading exam details...
      </div>
    );
  }

  if (error || !examDetails || !studentDetails) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        gap: '20px'
      }}>
        <h2>Error</h2>
        <p>{error || 'Failed to load exam details'}</p>
        <button onClick={() => window.location.href = '/login'}>
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <PreExamInstructions
      examDetails={examDetails}
      studentDetails={studentDetails}
      attemptId={parseInt(attemptId!)}
    />
  );
}
