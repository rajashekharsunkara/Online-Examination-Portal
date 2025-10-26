"""
Proctoring and Anti-Cheating Models
Tracks exam session events for integrity monitoring
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class ProctoringEvent(Base):
    """
    Records all proctoring events during exam session
    Used for detecting violations and suspicious activity
    """
    __tablename__ = "proctoring_events"
    
    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("student_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Event details
    event_type = Column(String(50), nullable=False, index=True)  # fullscreen_exit, tab_switch, answer_change, etc.
    event_timestamp = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    
    # Context
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=True)
    
    # Event data (JSON for flexibility)
    event_data = Column(JSON, nullable=True)
    # Examples:
    # - {"previous_answer": "A", "new_answer": "B"} for answer changes
    # - {"visibility_state": "hidden", "duration_seconds": 5} for tab switches
    # - {"screen_width": 1920, "screen_height": 1080} for fullscreen exits
    
    # Browser/system info
    user_agent = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    
    # Severity (for admin dashboard filtering)
    severity = Column(String(20), default="info")  # info, warning, violation
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    attempt = relationship("StudentAttempt", back_populates="proctoring_events")
    
    def __repr__(self):
        return f"<ProctoringEvent {self.event_type} at {self.event_timestamp}>"


class QuestionTiming(Base):
    """
    Tracks time spent on each question
    Helps identify rushing through answers or spending too much time
    """
    __tablename__ = "question_timings"
    
    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("student_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    
    # Timing data
    first_viewed_at = Column(DateTime, nullable=True)  # When question first appeared
    last_viewed_at = Column(DateTime, nullable=True)   # Last time question was viewed
    total_time_seconds = Column(Integer, default=0)     # Total time spent on this question
    
    # Answer tracking
    answer_count = Column(Integer, default=0)           # Number of times answer was changed
    first_answered_at = Column(DateTime, nullable=True) # When first answer was given
    last_answered_at = Column(DateTime, nullable=True)  # When final answer was given
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    attempt = relationship("StudentAttempt", back_populates="question_timings")
    
    def __repr__(self):
        return f"<QuestionTiming attempt={self.attempt_id} question={self.question_id} time={self.total_time_seconds}s>"
