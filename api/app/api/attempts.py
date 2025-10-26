"""
Student Attempt endpoints
Manages exam attempt lifecycle: start, answer recording, submit, grading
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from datetime import datetime, timedelta
import secrets

from app.core.database import get_db
from app.api.dependencies import get_current_active_user, require_role, require_any_role
from app.models.user import User
from app.models.exam import Exam, ExamQuestion, Question
from app.models.attempt import StudentAttempt, StudentAnswer, AttemptStatus
from app.schemas.attempt import (
    AttemptStart,
    AttemptResume,
    AttemptSubmit,
    AttemptResponse,
    AttemptWithProgress,
    AttemptWithAnswers,
    AttemptResult,
    AttemptResultDetailed,
    AttemptListItem,
    AttemptTimeStatus,
    AnswerSubmit,
    AnswerResponse,
    AttemptAdminView,
    AttemptStatistics,
)
from app.services.grading import GradingService

router = APIRouter(prefix="/attempts", tags=["Attempts"])


# ==================== Student Attempt Endpoints ====================

@router.post("/start", response_model=AttemptResponse, status_code=status.HTTP_201_CREATED)
async def start_attempt(
    attempt_data: AttemptStart,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student"))
):
    """
    Start a new exam attempt
    
    Students can only start exams that are published/active
    Prevents duplicate active attempts for the same exam
    """
    # Verify exam exists and is available
    exam = db.query(Exam).filter(Exam.id == attempt_data.exam_id).first()
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found"
        )
    
    if exam.status not in ["published", "active"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Exam is not available for attempts"
        )
    
    # Check for existing active attempt
    existing_attempt = db.query(StudentAttempt).filter(
        and_(
            StudentAttempt.student_id == current_user.id,
            StudentAttempt.exam_id == attempt_data.exam_id,
            StudentAttempt.status == AttemptStatus.IN_PROGRESS
        )
    ).first()
    
    if existing_attempt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You already have an active attempt for this exam. Use resume endpoint instead. Attempt ID: {existing_attempt.id}"
        )
    
    # Get client IP
    client_ip = request.client.host if request.client else None
    
    # Generate encryption salt for this attempt
    encryption_salt = secrets.token_urlsafe(16)  # 16 bytes = 128 bits
    
    # Create new attempt
    new_attempt = StudentAttempt(
        student_id=current_user.id,
        exam_id=exam.id,
        status=AttemptStatus.IN_PROGRESS,
        start_time=datetime.utcnow(),
        duration_minutes=exam.duration_minutes,
        total_marks=exam.total_marks,
        workstation_id=attempt_data.workstation_id,
        initial_workstation_id=attempt_data.workstation_id,
        browser_info=attempt_data.browser_info,
        ip_address=client_ip,
        last_activity_time=datetime.utcnow(),
        encryption_salt=encryption_salt
    )
    
    db.add(new_attempt)
    db.commit()
    db.refresh(new_attempt)
    
    return AttemptResponse.from_orm(new_attempt)


@router.post("/{attempt_id}/begin", response_model=AttemptResponse)
async def begin_attempt(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student"))
):
    """
    Begin an attempt that's in NOT_STARTED status
    
    Transitions from NOT_STARTED to IN_PROGRESS
    Sets start_time and initializes timing
    """
    attempt = db.query(StudentAttempt).filter(
        and_(
            StudentAttempt.id == attempt_id,
            StudentAttempt.student_id == current_user.id
        )
    ).first()
    
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attempt not found"
        )
    
    # Only allow starting NOT_STARTED attempts
    if attempt.status == AttemptStatus.IN_PROGRESS:
        # Already started - just return it
        return AttemptResponse.from_orm(attempt)
    
    if attempt.status != AttemptStatus.NOT_STARTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot begin attempt with status: {attempt.status}"
        )
    
    # Verify exam is still available
    exam = db.query(Exam).filter(Exam.id == attempt.exam_id).first()
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found"
        )
    
    if exam.status not in ["published", "active"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Exam is no longer available"
        )
    
    # Start the attempt
    attempt.status = AttemptStatus.IN_PROGRESS
    attempt.start_time = datetime.utcnow()
    attempt.last_activity_time = datetime.utcnow()
    
    db.commit()
    db.refresh(attempt)
    
    # Build response with calculated time_remaining
    response = AttemptResponse.from_orm(attempt)
    response.time_remaining_seconds = attempt.get_time_remaining_seconds()
    
    return response


@router.get("/me", response_model=List[AttemptListItem])
async def list_my_attempts(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    exam_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student"))
):
    """List all attempts by current student"""
    query = db.query(StudentAttempt).filter(
        StudentAttempt.student_id == current_user.id
    )
    
    if status_filter:
        query = query.filter(StudentAttempt.status == status_filter)
    
    if exam_id:
        query = query.filter(StudentAttempt.exam_id == exam_id)
    
    attempts = query.order_by(StudentAttempt.created_at.desc()).offset(skip).limit(limit).all()
    
    # Build response with exam info
    result = []
    for attempt in attempts:
        item = AttemptListItem(
            id=attempt.id,
            exam_id=attempt.exam_id,
            status=attempt.status,
            start_time=attempt.start_time,
            submit_time=attempt.submit_time,
            marks_obtained=attempt.marks_obtained,
            percentage=attempt.percentage,
            is_passed=attempt.is_passed,
            exam_title=attempt.exam.title if attempt.exam else None,
            exam_duration_minutes=attempt.exam.duration_minutes if attempt.exam else None
        )
        result.append(item)
    
    return result


@router.get("/{attempt_id}", response_model=AttemptWithProgress)
async def get_attempt(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific attempt with progress"""
    attempt = db.query(StudentAttempt).filter(StudentAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attempt not found"
        )
    
    # Students can only view their own attempts
    if current_user.has_role("student") and attempt.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own attempts"
        )
    
    # Calculate progress
    progress = attempt.calculate_progress()
    
    response = AttemptResponse.from_orm(attempt)
    return AttemptWithProgress(
        **response.dict(),
        progress=progress
    )


@router.post("/{attempt_id}/resume", response_model=AttemptResponse)
async def resume_attempt(
    attempt_id: int,
    resume_data: AttemptResume,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student"))
):
    """
    Resume an in-progress attempt
    
    Allows workstation transfers
    """
    attempt = db.query(StudentAttempt).filter(
        and_(
            StudentAttempt.id == attempt_id,
            StudentAttempt.student_id == current_user.id
        )
    ).first()
    
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attempt not found"
        )
    
    if attempt.status != AttemptStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot resume attempt with status: {attempt.status}"
        )
    
    # Check if time expired
    if attempt.is_expired():
        # Auto-submit expired attempt
        attempt.status = AttemptStatus.EXPIRED
        attempt.end_time = datetime.utcnow()
        db.commit()
        
        # Trigger auto-grading
        grading_service = GradingService(db)
        grading_service.grade_attempt(attempt)
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attempt time has expired. It has been auto-submitted."
        )
    
    # Handle workstation transfer
    if resume_data.workstation_id and resume_data.workstation_id != attempt.workstation_id:
        attempt.transfer_count += 1
        attempt.workstation_id = resume_data.workstation_id
    
    attempt.last_activity_time = datetime.utcnow()
    db.commit()
    db.refresh(attempt)
    
    return AttemptResponse.from_orm(attempt)


@router.get("/{attempt_id}/time-status", response_model=AttemptTimeStatus)
async def get_time_status(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student"))
):
    """
    Get time remaining for an attempt
    
    Used for client-side timer synchronization
    """
    attempt = db.query(StudentAttempt).filter(
        and_(
            StudentAttempt.id == attempt_id,
            StudentAttempt.student_id == current_user.id
        )
    ).first()
    
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attempt not found"
        )
    
    time_remaining = attempt.get_time_remaining_seconds()
    is_expired = attempt.is_expired()
    
    return AttemptTimeStatus(
        time_remaining_seconds=time_remaining,
        is_expired=is_expired,
        duration_minutes=attempt.duration_minutes,
        start_time=attempt.start_time,
        server_time=datetime.utcnow()
    )


# ==================== Answer Recording Endpoints ====================

@router.post("/{attempt_id}/answers", response_model=AnswerResponse)
async def save_answer(
    attempt_id: int,
    answer_data: AnswerSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student"))
):
    """
    Save or update an answer for a question
    
    Supports auto-save (called every 15 seconds from frontend)
    Idempotent - updates existing answer if present
    """
    # Verify attempt belongs to current user and is in progress
    attempt = db.query(StudentAttempt).filter(
        and_(
            StudentAttempt.id == attempt_id,
            StudentAttempt.student_id == current_user.id,
            StudentAttempt.status == AttemptStatus.IN_PROGRESS
        )
    ).first()
    
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active attempt not found"
        )
    
    # Check if time expired
    if attempt.is_expired():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attempt time has expired"
        )
    
    # Verify question belongs to this exam
    exam_question = db.query(ExamQuestion).filter(
        and_(
            ExamQuestion.exam_id == attempt.exam_id,
            ExamQuestion.question_id == answer_data.question_id
        )
    ).first()
    
    if not exam_question:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question does not belong to this exam"
        )
    
    # Check if answer already exists
    existing_answer = db.query(StudentAnswer).filter(
        and_(
            StudentAnswer.attempt_id == attempt_id,
            StudentAnswer.question_id == answer_data.question_id
        )
    ).first()
    
    if existing_answer:
        # Update existing answer
        existing_answer.answer = answer_data.answer
        existing_answer.is_flagged = answer_data.is_flagged
        existing_answer.time_spent_seconds += answer_data.time_spent_seconds
        existing_answer.answer_sequence += 1
        existing_answer.last_updated_at = datetime.utcnow()
        
        db_answer = existing_answer
    else:
        # Create new answer
        new_answer = StudentAnswer(
            attempt_id=attempt_id,
            question_id=answer_data.question_id,
            answer=answer_data.answer,
            is_flagged=answer_data.is_flagged,
            time_spent_seconds=answer_data.time_spent_seconds,
            first_answered_at=datetime.utcnow()
        )
        db.add(new_answer)
        db_answer = new_answer
        
        # Update questions_answered count
        attempt.questions_answered = db.query(StudentAnswer).filter(
            StudentAnswer.attempt_id == attempt_id
        ).count() + 1
    
    # Update flagged questions list
    if answer_data.is_flagged:
        if not attempt.questions_flagged:
            attempt.questions_flagged = []
        if answer_data.question_id not in attempt.questions_flagged:
            attempt.questions_flagged.append(answer_data.question_id)
    else:
        if attempt.questions_flagged and answer_data.question_id in attempt.questions_flagged:
            attempt.questions_flagged.remove(answer_data.question_id)
    
    # Update last activity
    attempt.last_activity_time = datetime.utcnow()
    
    db.commit()
    db.refresh(db_answer)
    
    return AnswerResponse.from_orm(db_answer)


@router.get("/{attempt_id}/answers", response_model=List[AnswerResponse])
async def get_attempt_answers(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student"))
):
    """Get all answers for an attempt"""
    attempt = db.query(StudentAttempt).filter(
        and_(
            StudentAttempt.id == attempt_id,
            StudentAttempt.student_id == current_user.id
        )
    ).first()
    
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attempt not found"
        )
    
    answers = db.query(StudentAnswer).filter(
        StudentAnswer.attempt_id == attempt_id
    ).all()
    
    return [AnswerResponse.from_orm(a) for a in answers]


# ==================== Submission and Grading Endpoints ====================

@router.post("/{attempt_id}/submit", response_model=AttemptResult)
async def submit_attempt(
    attempt_id: int,
    submit_data: AttemptSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student"))
):
    """
    Submit attempt for grading
    
    Once submitted, cannot be modified
    Triggers auto-grading for objective questions
    """
    attempt = db.query(StudentAttempt).filter(
        and_(
            StudentAttempt.id == attempt_id,
            StudentAttempt.student_id == current_user.id
        )
    ).first()
    
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attempt not found"
        )
    
    if attempt.status != AttemptStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot submit attempt with status: {attempt.status}"
        )
    
    # Store encrypted answers if provided
    if submit_data.encrypted_answers:
        attempt.encrypted_final_answers = submit_data.encrypted_answers
        attempt.encryption_timestamp = submit_data.encryption_timestamp
        attempt.encryption_checksum = submit_data.encryption_checksum
    
    # Update attempt status
    attempt.status = AttemptStatus.SUBMITTED
    attempt.submit_time = datetime.utcnow()
    attempt.end_time = datetime.utcnow()
    
    # Calculate actual time remaining for reference
    attempt.time_remaining_seconds = attempt.get_time_remaining_seconds()
    
    db.commit()
    
    # Trigger auto-grading
    grading_service = GradingService(db)
    result = grading_service.grade_attempt(attempt)
    
    # Refresh to get updated values
    db.refresh(attempt)
    
    return AttemptResult(
        id=attempt.id,
        student_id=attempt.student_id,
        exam_id=attempt.exam_id,
        status=attempt.status,
        total_marks=attempt.total_marks,
        marks_obtained=attempt.marks_obtained,
        percentage=attempt.percentage,
        is_passed=attempt.is_passed,
        questions_answered=attempt.questions_answered,
        auto_graded=attempt.auto_graded,
        graded_at=attempt.graded_at,
        submit_time=attempt.submit_time,
        correct_answers=result.get("correct_answers"),
        incorrect_answers=result.get("incorrect_answers"),
        unattempted=result.get("unattempted")
    )


@router.get("/{attempt_id}/result", response_model=AttemptResultDetailed)
async def get_attempt_result(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get detailed result for a graded attempt"""
    attempt = db.query(StudentAttempt).filter(StudentAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attempt not found"
        )
    
    # Students can only view their own results
    if current_user.has_role("student") and attempt.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own results"
        )
    
    if attempt.status not in [AttemptStatus.GRADED, AttemptStatus.SUBMITTED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Results not available yet"
        )
    
    # Get answers
    answers = db.query(StudentAnswer).filter(
        StudentAnswer.attempt_id == attempt_id
    ).all()
    
    # Calculate statistics
    correct_count = sum(1 for a in answers if a.is_correct)
    incorrect_count = sum(1 for a in answers if a.is_correct is False)
    total_questions = len(attempt.exam.exam_questions)
    unattempted = total_questions - len(answers)
    
    return AttemptResultDetailed(
        id=attempt.id,
        student_id=attempt.student_id,
        exam_id=attempt.exam_id,
        status=attempt.status,
        total_marks=attempt.total_marks,
        marks_obtained=attempt.marks_obtained,
        percentage=attempt.percentage,
        is_passed=attempt.is_passed,
        questions_answered=attempt.questions_answered,
        auto_graded=attempt.auto_graded,
        graded_at=attempt.graded_at,
        submit_time=attempt.submit_time,
        correct_answers=correct_count,
        incorrect_answers=incorrect_count,
        unattempted=unattempted,
        answers=[AnswerResponse.from_orm(a) for a in answers],
        exam_title=attempt.exam.title,
        exam_total_marks=attempt.exam.total_marks,
        exam_passing_marks=attempt.exam.passing_marks
    )


# ==================== Admin Endpoints ====================

@router.get("/", response_model=List[AttemptListItem])
async def list_all_attempts(
    skip: int = 0,
    limit: int = 100,
    exam_id: Optional[int] = None,
    student_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hall_in_charge"))
):
    """List all attempts (admin/hall_in_charge only)"""
    query = db.query(StudentAttempt)
    
    if exam_id:
        query = query.filter(StudentAttempt.exam_id == exam_id)
    if student_id:
        query = query.filter(StudentAttempt.student_id == student_id)
    if status_filter:
        query = query.filter(StudentAttempt.status == status_filter)
    
    attempts = query.order_by(StudentAttempt.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for attempt in attempts:
        item = AttemptListItem(
            id=attempt.id,
            exam_id=attempt.exam_id,
            status=attempt.status,
            start_time=attempt.start_time,
            submit_time=attempt.submit_time,
            marks_obtained=attempt.marks_obtained,
            percentage=attempt.percentage,
            is_passed=attempt.is_passed,
            exam_title=attempt.exam.title if attempt.exam else None,
            exam_duration_minutes=attempt.exam.duration_minutes if attempt.exam else None
        )
        result.append(item)
    
    return result


@router.get("/statistics/{exam_id}", response_model=AttemptStatistics)
async def get_exam_statistics(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hall_in_charge"))
):
    """Get statistics for an exam"""
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found"
        )
    
    attempts = db.query(StudentAttempt).filter(StudentAttempt.exam_id == exam_id).all()
    
    total_attempts = len(attempts)
    completed_attempts = sum(1 for a in attempts if a.status in [AttemptStatus.SUBMITTED, AttemptStatus.GRADED])
    in_progress_attempts = sum(1 for a in attempts if a.status == AttemptStatus.IN_PROGRESS)
    
    graded_attempts = [a for a in attempts if a.status == AttemptStatus.GRADED]
    
    average_score = None
    pass_rate = None
    average_time = None
    
    if graded_attempts:
        average_score = sum(a.marks_obtained for a in graded_attempts if a.marks_obtained) / len(graded_attempts)
        passed_count = sum(1 for a in graded_attempts if a.is_passed)
        pass_rate = (passed_count / len(graded_attempts)) * 100
        
        # Calculate average time taken
        time_taken = []
        for a in graded_attempts:
            if a.start_time and a.submit_time:
                duration = (a.submit_time - a.start_time).total_seconds() / 60
                time_taken.append(duration)
        
        if time_taken:
            average_time = sum(time_taken) / len(time_taken)
    
    return AttemptStatistics(
        total_attempts=total_attempts,
        completed_attempts=completed_attempts,
        in_progress_attempts=in_progress_attempts,
        average_score=round(average_score, 2) if average_score else None,
        pass_rate=round(pass_rate, 2) if pass_rate else None,
        average_time_taken_minutes=round(average_time, 2) if average_time else None
    )
