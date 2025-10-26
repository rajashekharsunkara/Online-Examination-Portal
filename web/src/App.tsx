import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { ExamPage } from './pages/ExamPage';
import { ResultPage } from './pages/ResultPage';
import { PreExamInstructionsPage } from './pages/PreExamInstructionsPage';
import './App.css';

function App() {
  const isAuthenticated = !!localStorage.getItem('access_token');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/exam" replace /> : <Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/exam/:attemptId/instructions" element={<PreExamInstructionsPage />} />
        <Route path="/exam/:attemptId" element={<ExamPage />} />
        <Route path="/results/:attemptId" element={<ResultPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
