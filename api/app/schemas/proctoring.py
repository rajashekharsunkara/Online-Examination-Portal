"""
Pydantic schemas for proctoring API
"""
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


# Proctoring Event Schemas
class ProctoringEventCreate(BaseModel):
    """Schema for creating a new proctoring event"""
    attempt_id: int
    event_type: str = Field(..., description="Type of event (fullscreen_exit, tab_switch, etc.)")
    event_timestamp: Optional[datetime] = None
    question_id: Optional[int] = None
    event_data: Optional[Dict[str, Any]] = None
    severity: str = Field(default="info", description="Severity level: info, warning, violation")


class ProctoringEventResponse(BaseModel):
    """Schema for proctoring event response"""
    id: int
    attempt_id: int
    event_type: str
    event_timestamp: datetime
    question_id: Optional[int]
    event_data: Optional[Dict[str, Any]]
    user_agent: Optional[str]
    ip_address: Optional[str]
    severity: str
    created_at: datetime

    class Config:
        from_attributes = True


# Question Timing Schemas
class QuestionTimingCreate(BaseModel):
    """Schema for creating question timing record"""
    attempt_id: int
    question_id: int
    total_time_seconds: int = 0


class QuestionTimingUpdate(BaseModel):
    """Schema for updating question timing"""
    attempt_id: int
    question_id: int
    total_time_seconds: int
    answer_changed: bool = False


class QuestionTimingResponse(BaseModel):
    """Schema for question timing response"""
    id: int
    attempt_id: int
    question_id: int
    first_viewed_at: datetime
    last_viewed_at: Optional[datetime]
    total_time_seconds: int
    answer_count: int
    first_answered_at: Optional[datetime]
    last_answered_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Filter and Summary Schemas
class ProctoringEventFilter(BaseModel):
    """Schema for filtering proctoring events"""
    event_type: Optional[str] = None
    severity: Optional[str] = None
    skip: int = 0
    limit: int = 100


class ViolationSummary(BaseModel):
    """Schema for violation summary"""
    attempt_id: int
    total_events: int
    total_violations: int
    info_count: int
    warning_count: int
    violation_count: int
    event_type_counts: Dict[str, int]
    most_recent_violation_time: Optional[datetime]
    most_recent_violation_type: Optional[str]

    class Config:
        from_attributes = True
