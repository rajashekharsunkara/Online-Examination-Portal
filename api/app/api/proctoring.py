"""
Proctoring API endpoints for logging and monitoring exam activities
"""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.attempt import StudentAttempt, AttemptStatus
from app.models.proctoring import ProctoringEvent, QuestionTiming
from app.schemas.proctoring import (
    ProctoringEventCreate,
    ProctoringEventResponse,
    QuestionTimingCreate,
    QuestionTimingUpdate,
    QuestionTimingResponse,
    ProctoringEventFilter,
    ViolationSummary
)

router = APIRouter(prefix="/proctoring", tags=["proctoring"])


@router.post("/events", response_model=ProctoringEventResponse, status_code=status.HTTP_201_CREATED)
async def log_proctoring_event(
    event_data: ProctoringEventCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Log a proctoring event during an exam.
    
    Event types:
    - fullscreen_exit: Student exited full-screen mode
    - fullscreen_enter: Student re-entered full-screen mode
    - tab_switch: Student switched to another tab/window
    - window_blur: Browser window lost focus
    - answer_change: Student changed an answer
    - keyboard_blocked: Keyboard shortcut was blocked
    - copy_paste_attempt: Student tried to copy/paste
    - context_menu_blocked: Right-click menu was blocked
    - developer_tools_attempt: F12 or dev tools access attempted
    """
    # Verify the attempt belongs to the current user
    attempt = db.query(StudentAttempt).filter(
        and_(
            StudentAttempt.id == event_data.attempt_id,
            StudentAttempt.student_id == current_user.id
        )
    ).first()
    
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam attempt not found or access denied"
        )
    
    # Check if attempt is still active (allow logging for all non-completed statuses)
    if attempt.status in [AttemptStatus.SUBMITTED, AttemptStatus.GRADED, AttemptStatus.CANCELLED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot log events for a completed exam"
        )
    
    # Create the proctoring event
    event = ProctoringEvent(
        attempt_id=event_data.attempt_id,
        event_type=event_data.event_type,
        event_timestamp=event_data.event_timestamp or datetime.utcnow(),
        question_id=event_data.question_id,
        event_data=event_data.event_data,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
        severity=event_data.severity
    )
    
    db.add(event)
    db.commit()
    db.refresh(event)
    
    return event


@router.post("/question-timing", response_model=QuestionTimingResponse)
async def update_question_timing(
    timing_data: QuestionTimingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update or create question timing data.
    Tracks how long a student spends on each question.
    """
    # Verify the attempt belongs to the current user
    attempt = db.query(StudentAttempt).filter(
        and_(
            StudentAttempt.id == timing_data.attempt_id,
            StudentAttempt.student_id == current_user.id
        )
    ).first()
    
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam attempt not found or access denied"
        )
    
    # Find existing timing record or create new one
    timing = db.query(QuestionTiming).filter(
        and_(
            QuestionTiming.attempt_id == timing_data.attempt_id,
            QuestionTiming.question_id == timing_data.question_id
        )
    ).first()
    
    if timing:
        # Update existing record
        timing.last_viewed_at = datetime.utcnow()
        timing.total_time_seconds = timing_data.total_time_seconds
        
        if timing_data.answer_changed:
            timing.answer_count += 1
            timing.last_answered_at = datetime.utcnow()
            if not timing.first_answered_at:
                timing.first_answered_at = datetime.utcnow()
        
        timing.updated_at = datetime.utcnow()
    else:
        # Create new record
        timing = QuestionTiming(
            attempt_id=timing_data.attempt_id,
            question_id=timing_data.question_id,
            first_viewed_at=datetime.utcnow(),
            last_viewed_at=datetime.utcnow(),
            total_time_seconds=timing_data.total_time_seconds,
            answer_count=1 if timing_data.answer_changed else 0,
            first_answered_at=datetime.utcnow() if timing_data.answer_changed else None,
            last_answered_at=datetime.utcnow() if timing_data.answer_changed else None
        )
        db.add(timing)
    
    db.commit()
    db.refresh(timing)
    
    return timing


@router.get("/attempt/{attempt_id}/events", response_model=List[ProctoringEventResponse])
async def get_attempt_events(
    attempt_id: int,
    event_type: Optional[str] = None,
    severity: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all proctoring events for an exam attempt.
    Admin/Grader can view any attempt, students can only view their own.
    """
    # Check access permissions
    attempt = db.query(StudentAttempt).filter(StudentAttempt.id == attempt_id).first()
    
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam attempt not found"
        )
    
    # Students can only view their own attempts, admins/graders can view all
    if current_user.role == "student" and attempt.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Build query with filters
    query = db.query(ProctoringEvent).filter(ProctoringEvent.attempt_id == attempt_id)
    
    if event_type:
        query = query.filter(ProctoringEvent.event_type == event_type)
    
    if severity:
        query = query.filter(ProctoringEvent.severity == severity)
    
    # Order by timestamp descending (most recent first)
    events = query.order_by(ProctoringEvent.event_timestamp.desc()).offset(skip).limit(limit).all()
    
    return events


@router.get("/attempt/{attempt_id}/violations", response_model=ViolationSummary)
async def get_attempt_violations(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a summary of violations for an exam attempt.
    Useful for admin dashboard to quickly identify suspicious activity.
    """
    # Check access permissions
    attempt = db.query(StudentAttempt).filter(StudentAttempt.id == attempt_id).first()
    
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam attempt not found"
        )
    
    # Only admins and graders can view violation summaries
    if current_user.role not in ["admin", "grader"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and graders can view violation summaries"
        )
    
    # Count violations by severity
    violation_counts = db.query(
        ProctoringEvent.severity,
        func.count(ProctoringEvent.id).label("count")
    ).filter(
        ProctoringEvent.attempt_id == attempt_id
    ).group_by(
        ProctoringEvent.severity
    ).all()
    
    # Count specific violation types
    event_type_counts = db.query(
        ProctoringEvent.event_type,
        func.count(ProctoringEvent.id).label("count")
    ).filter(
        and_(
            ProctoringEvent.attempt_id == attempt_id,
            ProctoringEvent.severity.in_(["warning", "violation"])
        )
    ).group_by(
        ProctoringEvent.event_type
    ).all()
    
    # Convert to dictionaries
    severity_summary = {row.severity: row.count for row in violation_counts}
    event_type_summary = {row.event_type: row.count for row in event_type_counts}
    
    # Calculate total violations
    total_violations = severity_summary.get("violation", 0) + severity_summary.get("warning", 0)
    
    # Get most recent violation
    recent_violation = db.query(ProctoringEvent).filter(
        and_(
            ProctoringEvent.attempt_id == attempt_id,
            ProctoringEvent.severity.in_(["warning", "violation"])
        )
    ).order_by(ProctoringEvent.event_timestamp.desc()).first()
    
    return ViolationSummary(
        attempt_id=attempt_id,
        total_events=sum(severity_summary.values()),
        total_violations=total_violations,
        info_count=severity_summary.get("info", 0),
        warning_count=severity_summary.get("warning", 0),
        violation_count=severity_summary.get("violation", 0),
        event_type_counts=event_type_summary,
        most_recent_violation_time=recent_violation.event_timestamp if recent_violation else None,
        most_recent_violation_type=recent_violation.event_type if recent_violation else None
    )


@router.get("/attempt/{attempt_id}/question-timings", response_model=List[QuestionTimingResponse])
async def get_attempt_question_timings(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get question timing data for an exam attempt.
    Shows how long the student spent on each question.
    """
    # Check access permissions
    attempt = db.query(StudentAttempt).filter(StudentAttempt.id == attempt_id).first()
    
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam attempt not found"
        )
    
    # Students can view their own timings, admins/graders can view all
    if current_user.role == "student" and attempt.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    timings = db.query(QuestionTiming).filter(
        QuestionTiming.attempt_id == attempt_id
    ).order_by(QuestionTiming.total_time_seconds.desc()).all()
    
    return timings
