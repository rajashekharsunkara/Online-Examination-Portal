/**
 * API Service
 * Handles all HTTP requests to the backend
 */

import type {
  LoginRequest,
  AuthResponse,
  Exam,
  Attempt,
  Answer,
  AttemptResult,
} from '../types';

// Use empty string to use Vite proxy in development, or env variable for production
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const API_PREFIX = '/api/v1';

class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiService {
  private getHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${API_PREFIX}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...(options.headers || {}),
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new ApiError(
          response.status,
          error.detail || `HTTP ${response.status}`,
          error
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, 'Network error', error);
    }
  }

  // Authentication
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    // Store tokens
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    localStorage.setItem('user', JSON.stringify(response.user));

    return response;
  }

  async logout(): Promise<void> {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  getStoredUser(): any | null {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  // Exams
  async getExam(examId: number): Promise<Exam> {
    return this.request<Exam>(`/exams/${examId}`);
  }

  async listExams(): Promise<Exam[]> {
    return this.request<Exam[]>('/exams');
  }

  // Attempts
  async startAttempt(examId: number, workstationId?: string): Promise<Attempt> {
    return this.request<Attempt>('/attempts/start', {
      method: 'POST',
      body: JSON.stringify({
        exam_id: examId,
        workstation_id: workstationId,
      }),
    });
  }

  async getAttempt(attemptId: number): Promise<Attempt> {
    return this.request<Attempt>(`/attempts/${attemptId}`);
  }

  async getMyAttempts(examId?: number): Promise<Attempt[]> {
    const query = examId ? `?exam_id=${examId}` : '';
    return this.request<Attempt[]>(`/attempts/me${query}`);
  }

  async resumeAttempt(
    attemptId: number,
    workstationId?: string
  ): Promise<Attempt> {
    return this.request<Attempt>(`/attempts/${attemptId}/resume`, {
      method: 'POST',
      body: JSON.stringify({
        workstation_id: workstationId,
      }),
    });
  }

  async beginAttempt(attemptId: number): Promise<Attempt> {
    return this.request<Attempt>(`/attempts/${attemptId}/begin`, {
      method: 'POST',
    });
  }

  async getTimeStatus(attemptId: number): Promise<any> {
    return this.request(`/attempts/${attemptId}/time-status`);
  }

  async submitAttempt(
    attemptId: number,
    confirmed: boolean = true,
    encryptedAnswers?: string,
    encryptionTimestamp?: string,
    encryptionChecksum?: string
  ): Promise<Attempt> {
    const body: any = { confirm: confirmed };
    
    // Include encryption data if provided
    if (encryptedAnswers) {
      body.encrypted_answers = encryptedAnswers;
      body.encryption_timestamp = encryptionTimestamp;
      body.encryption_checksum = encryptionChecksum;
    }
    
    return this.request<Attempt>(`/attempts/${attemptId}/submit`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getAttemptResult(attemptId: number): Promise<AttemptResult> {
    return this.request<AttemptResult>(`/attempts/${attemptId}/result`);
  }

  // Answers (REST fallback for non-WebSocket environments)
  async saveAnswer(
    attemptId: number,
    questionId: number,
    answer: any,
    isFlagged: boolean = false,
    timeSpent: number = 0
  ): Promise<Answer> {
    return this.request<Answer>(`/attempts/${attemptId}/answers`, {
      method: 'POST',
      body: JSON.stringify({
        question_id: questionId,
        answer,
        is_flagged: isFlagged,
        time_spent_seconds: timeSpent,
      }),
    });
  }

  async getAnswers(attemptId: number): Promise<Answer[]> {
    return this.request<Answer[]>(`/attempts/${attemptId}/answers`);
  }
}

export const apiService = new ApiService();
export { ApiError };
