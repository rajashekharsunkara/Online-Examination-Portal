"""
Student Attempt Models
Tracks student exam attempts and their answers
"""
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey,
    Boolean, Text, Enum as SQLEnum, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime, timedelta
import enum
from app.core.database import Base


class AttemptStatus(str, enum.Enum):
    """Exam attempt status"""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    GRADED = "graded"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class StudentAttempt(Base):
    """
    Student exam attempt tracking
    Manages the lifecycle of a student taking an exam
    """
    __tablename__ = "student_attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    exam_id = Column(Integer, ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    
    # Status and timing
    status = Column(SQLEnum(AttemptStatus), nullable=False, default=AttemptStatus.NOT_STARTED)
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    submit_time = Column(DateTime(timezone=True), nullable=True)
    
    # Time management
    duration_minutes = Column(Integer, nullable=False)  # Snapshot from exam
    time_remaining_seconds = Column(Integer, nullable=True)  # For pause/resume
    last_activity_time = Column(DateTime(timezone=True), nullable=True)
    
    # Workstation tracking
    workstation_id = Column(String(100), nullable=True)  # Current workstation
    initial_workstation_id = Column(String(100), nullable=True)  # Where they started
    transfer_count = Column(Integer, default=0)  # Number of workstation transfers
    
    # Progress tracking
    current_question_id = Column(Integer, ForeignKey("questions.id"), nullable=True)
    questions_answered = Column(Integer, default=0)
    questions_flagged = Column(JSON, default=list)  # List of question IDs flagged for review
    
    # Scoring
    total_marks = Column(Float, default=0.0)
    marks_obtained = Column(Float, nullable=True)
    percentage = Column(Float, nullable=True)
    is_passed = Column(Boolean, nullable=True)
    
    # Grading
    auto_graded = Column(Boolean, default=False)
    graded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    graded_at = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    browser_info = Column(JSON, nullable=True)  # SEB fingerprint, version
    ip_address = Column(String(45), nullable=True)  # IPv4/IPv6
    notes = Column(Text, nullable=True)  # Admin/staff notes
    
    # End-to-end encryption
    encryption_salt = Column(String(64), nullable=True)  # Base64-encoded salt for PBKDF2
    encrypted_final_answers = Column(Text, nullable=True)  # AES-256-GCM encrypted answers
    encryption_timestamp = Column(DateTime(timezone=True), nullable=True)  # For key derivation
    encryption_checksum = Column(String(64), nullable=True)  # SHA-256 of encrypted data
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
    
    # Relationships
    student = relationship("User", foreign_keys=[student_id], back_populates="attempts")
    exam = relationship("Exam", back_populates="attempts")
    answers = relationship("StudentAnswer", back_populates="attempt", cascade="all, delete-orphan")
    grader = relationship("User", foreign_keys=[graded_by])
    current_question = relationship("Question", foreign_keys=[current_question_id])
    transfers = relationship("Transfer", back_populates="attempt", cascade="all, delete-orphan")
    proctoring_events = relationship("ProctoringEvent", back_populates="attempt", cascade="all, delete-orphan")
    question_timings = relationship("QuestionTiming", back_populates="attempt", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<StudentAttempt(id={self.id}, student_id={self.student_id}, exam_id={self.exam_id}, status={self.status})>"
    
    def is_active(self) -> bool:
        """Check if attempt is currently active"""
        return self.status == AttemptStatus.IN_PROGRESS
    
    def is_expired(self) -> bool:
        """Check if attempt has exceeded time limit"""
        if not self.start_time or self.status not in [AttemptStatus.IN_PROGRESS, AttemptStatus.NOT_STARTED]:
            return False
        
        elapsed = datetime.utcnow() - self.start_time.replace(tzinfo=None)
        return elapsed.total_seconds() > (self.duration_minutes * 60)
    
    def get_time_remaining_seconds(self) -> int:
        """Calculate remaining time in seconds"""
        if not self.start_time:
            return self.duration_minutes * 60
        
        if self.status == AttemptStatus.SUBMITTED:
            return 0
        
        # If we have stored time_remaining (from pause), use it
        if self.time_remaining_seconds is not None:
            return max(0, self.time_remaining_seconds)
        
        # Calculate from start time
        elapsed = datetime.utcnow() - self.start_time.replace(tzinfo=None)
        total_seconds = self.duration_minutes * 60
        remaining = total_seconds - int(elapsed.total_seconds())
        
        return max(0, remaining)
    
    def calculate_progress(self) -> dict:
        """Calculate attempt progress statistics"""
        total_questions = len(self.exam.exam_questions) if self.exam else 0
        
        return {
            "total_questions": total_questions,
            "answered": self.questions_answered,
            "unanswered": total_questions - self.questions_answered,
            "flagged": len(self.questions_flagged) if self.questions_flagged else 0,
            "progress_percentage": (self.questions_answered / total_questions * 100) if total_questions > 0 else 0
        }


class StudentAnswer(Base):
    """
    Student answers for individual questions
    Supports multiple answer types and tracks answer history
    """
    __tablename__ = "student_answers"
    
    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("student_attempts.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    
    # Answer content (stored as JSON for flexibility)
    answer = Column(JSON, nullable=True)  # Can be string, list, or dict
    
    # Metadata
    is_flagged = Column(Boolean, default=False)
    time_spent_seconds = Column(Integer, default=0)
    answer_sequence = Column(Integer, default=1)  # For tracking answer changes
    
    # Scoring
    is_correct = Column(Boolean, nullable=True)
    marks_awarded = Column(Float, nullable=True)
    auto_graded = Column(Boolean, default=False)
    
    # Timestamps
    first_answered_at = Column(DateTime(timezone=True), nullable=True)
    last_updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    attempt = relationship("StudentAttempt", back_populates="answers")
    question = relationship("Question")
    grading_feedback = relationship("GradingFeedback", back_populates="answer", uselist=False)
    
    def __repr__(self):
        return f"<StudentAnswer(id={self.id}, attempt_id={self.attempt_id}, question_id={self.question_id})>"
