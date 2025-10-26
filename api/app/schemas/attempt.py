"""
Pydantic schemas for student attempts
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator
from app.models.attempt import AttemptStatus


# ==================== Answer Schemas ====================

class AnswerSubmit(BaseModel):
    """Submit or update an answer"""
    question_id: int
    answer: Any  # Can be string, list, or dict depending on question type
    is_flagged: Optional[bool] = False
    time_spent_seconds: Optional[int] = 0
    
    class Config:
        from_attributes = True


class AnswerResponse(BaseModel):
    """Answer response with metadata"""
    id: int
    question_id: int
    answer: Optional[Any] = None
    is_flagged: bool
    time_spent_seconds: int
    is_correct: Optional[bool] = None
    marks_awarded: Optional[float] = None
    first_answered_at: Optional[datetime] = None
    last_updated_at: datetime
    
    class Config:
        from_attributes = True


# ==================== Attempt Schemas ====================

class AttemptStart(BaseModel):
    """Start a new exam attempt"""
    exam_id: int
    workstation_id: Optional[str] = None
    browser_info: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True


class AttemptResume(BaseModel):
    """Resume an existing attempt"""
    workstation_id: Optional[str] = None
    
    class Config:
        from_attributes = True


class AttemptSubmit(BaseModel):
    """Submit an attempt for grading"""
    confirm: bool = Field(..., description="Must be true to confirm submission")
    encrypted_answers: Optional[str] = Field(None, description="Base64-encoded encrypted exam answers")
    encryption_timestamp: Optional[datetime] = Field(None, description="Timestamp used for encryption key derivation")
    encryption_checksum: Optional[str] = Field(None, description="SHA-256 checksum of encrypted data for integrity verification")
    
    @validator('confirm')
    def confirm_must_be_true(cls, v):
        if not v:
            raise ValueError("Must confirm submission by setting confirm=true")
        return v
    
    class Config:
        from_attributes = True


class AttemptProgress(BaseModel):
    """Attempt progress statistics"""
    total_questions: int
    answered: int
    unanswered: int
    flagged: int
    progress_percentage: float
    
    class Config:
        from_attributes = True


class AttemptTimeStatus(BaseModel):
    """Time status for an attempt"""
    time_remaining_seconds: int
    is_expired: bool
    duration_minutes: int
    start_time: Optional[datetime] = None
    server_time: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        from_attributes = True


class AttemptResponse(BaseModel):
    """Basic attempt response"""
    id: int
    student_id: int
    exam_id: int
    status: AttemptStatus
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    submit_time: Optional[datetime] = None
    duration_minutes: int
    time_remaining_seconds: Optional[int] = None
    workstation_id: Optional[str] = None
    initial_workstation_id: Optional[str] = None
    transfer_count: int = 0
    current_question_id: Optional[int] = None
    questions_answered: int = 0
    questions_flagged: Optional[List[int]] = None
    encryption_salt: Optional[str] = Field(None, description="Random salt for encryption key derivation")
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class AttemptWithProgress(AttemptResponse):
    """Attempt with progress statistics"""
    progress: AttemptProgress
    
    class Config:
        from_attributes = True


class AttemptWithAnswers(AttemptResponse):
    """Attempt with all answers included"""
    answers: List[AnswerResponse]
    
    class Config:
        from_attributes = True


class AttemptResult(BaseModel):
    """Graded attempt result"""
    id: int
    student_id: int
    exam_id: int
    status: AttemptStatus
    total_marks: float
    marks_obtained: Optional[float] = None
    percentage: Optional[float] = None
    is_passed: Optional[bool] = None
    questions_answered: int
    auto_graded: bool = False
    graded_at: Optional[datetime] = None
    submit_time: Optional[datetime] = None
    
    # Detailed breakdown
    correct_answers: Optional[int] = None
    incorrect_answers: Optional[int] = None
    unattempted: Optional[int] = None
    
    class Config:
        from_attributes = True


class AttemptResultDetailed(AttemptResult):
    """Detailed result with answer breakdown"""
    answers: List[AnswerResponse]
    exam_title: Optional[str] = None
    exam_total_marks: Optional[float] = None
    exam_passing_marks: Optional[float] = None
    
    class Config:
        from_attributes = True


# ==================== List/Filter Schemas ====================

class AttemptListItem(BaseModel):
    """Minimal attempt info for lists"""
    id: int
    exam_id: int
    status: AttemptStatus
    start_time: Optional[datetime] = None
    submit_time: Optional[datetime] = None
    marks_obtained: Optional[float] = None
    percentage: Optional[float] = None
    is_passed: Optional[bool] = None
    
    # Exam info
    exam_title: Optional[str] = None
    exam_duration_minutes: Optional[int] = None
    
    class Config:
        from_attributes = True


# ==================== Admin Schemas ====================

class AttemptUpdate(BaseModel):
    """Admin update for attempt (e.g., adding notes, manual grading)"""
    notes: Optional[str] = None
    marks_obtained: Optional[float] = None
    status: Optional[AttemptStatus] = None
    
    class Config:
        from_attributes = True


class AttemptAdminView(AttemptResponse):
    """Admin view with additional metadata"""
    ip_address: Optional[str] = None
    browser_info: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    graded_by: Optional[int] = None
    graded_at: Optional[datetime] = None
    
    # Student info
    student_username: Optional[str] = None
    student_name: Optional[str] = None
    
    class Config:
        from_attributes = True


# ==================== Statistics Schemas ====================

class AttemptStatistics(BaseModel):
    """Statistics for exam attempts"""
    total_attempts: int
    completed_attempts: int
    in_progress_attempts: int
    average_score: Optional[float] = None
    pass_rate: Optional[float] = None
    average_time_taken_minutes: Optional[float] = None
    
    class Config:
        from_attributes = True
