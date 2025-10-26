/**
 * Type definitions for the exam platform
 */

// User & Authentication
export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

// Exam & Questions
export type QuestionType = 'mcq_single' | 'mcq_multiple' | 'true_false' | 'short_answer' | 'long_answer';

export interface Question {
  id: number;
  question_text: string;
  question_type: QuestionType;
  marks: number;
  negative_marks: number;
  options?: string[];
  correct_answer?: any;
  explanation?: string;
  order_number: number;
}

export interface Exam {
  id: number;
  title: string;
  description: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  status: 'draft' | 'published' | 'archived';
  questions: Question[];
}

// Attempts
export type AttemptStatus = 'not_started' | 'in_progress' | 'submitted' | 'graded' | 'expired' | 'cancelled';

export interface Attempt {
  id: number;
  student_id: number;
  exam_id: number;
  status: AttemptStatus;
  start_time: string | null;
  end_time: string | null;
  submit_time: string | null;
  duration_minutes: number;
  time_remaining_seconds: number;
  workstation_id: string | null;
  current_question_id: number | null;
  questions_answered: number;
  questions_flagged: number[];
  marks_obtained: number | null;
  percentage: number | null;
  is_passed: boolean | null;
}

export interface Answer {
  id: number;
  attempt_id: number;
  question_id: number;
  answer: any;
  is_flagged: boolean;
  time_spent_seconds: number;
  answer_sequence: number;
  is_correct: boolean | null;
  marks_awarded: number | null;
}

export interface AttemptResult {
  attempt: Attempt;
  answers: Answer[];
  questions: Question[];
  total_marks: number;
  marks_obtained: number;
  percentage: number;
  is_passed: boolean;
  correct_count: number;
  incorrect_count: number;
  unattempted_count: number;
}

// WebSocket Messages
export type MessageType =
  | 'connected'
  | 'ping'
  | 'pong'
  | 'checkpoint'
  | 'checkpoint_ack'
  | 'checkpoint_error'
  | 'time_sync'
  | 'time_update'
  | 'notification'
  | 'warning'
  | 'error'
  | 'exam_event'
  | 'system_event';

export interface WebSocketMessage {
  type: MessageType;
  timestamp?: string;
  [key: string]: any;
}

export interface CheckpointRequest {
  type: 'checkpoint';
  question_id: number;
  answer: any;
  is_flagged: boolean;
  time_spent_seconds: number;
  sequence: number;
}

export interface CheckpointAck {
  type: 'checkpoint_ack';
  question_id: number;
  sequence: number;
  saved_at: string;
  time_remaining_seconds: number;
}

export interface TimeUpdate {
  type: 'time_update';
  server_time: string;
  time_remaining_seconds: number;
  elapsed_seconds: number;
  is_expired: boolean;
}

export interface Notification {
  type: 'notification';
  title: string;
  message: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  action?: string;
}

// UI State
export interface ExamState {
  exam: Exam | null;
  attempt: Attempt | null;
  answers: Record<number, any>; // questionId -> answer
  flaggedQuestions: Set<number>;
  currentQuestionIndex: number;
  timeRemaining: number;
  isConnected: boolean;
  isSyncing: boolean;
  lastSaveTime: number;
}

export interface QuestionNavItem {
  questionId: number;
  questionNumber: number;
  isAnswered: boolean;
  isFlagged: boolean;
  isCurrent: boolean;
}
