"""
Rubric and Manual Grading API Endpoints
Supports CRUD operations for rubrics and manual grading workflows
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc

from app.core.database import get_db
from app.api.dependencies import get_current_active_user, require_role, require_any_role
from app.models.user import User
from app.models.rubric import (
    Rubric, RubricCriterion, RubricLevel, QuestionRubric,
    GradingFeedback, CriterionScore, RubricType, ScoringMethod
)
from app.models.attempt import StudentAnswer, StudentAttempt, AttemptStatus
from app.models.exam import Question
from app.schemas.rubric import (
    RubricCreate, RubricUpdate, RubricResponse, RubricListItem,
    RubricCriterionCreate, RubricLevelCreate,
    QuestionRubricAssign, QuestionRubricResponse,
    GradingFeedbackCreate, GradingFeedbackUpdate, GradingFeedbackResponse,
    CriterionScoreResponse, ManualGradeSubmit, GradingProgress,
    AttemptGradingDetails
)
from app.services.analytics import AnalyticsService

router = APIRouter(prefix="/rubrics", tags=["Rubrics & Grading"])


# ==================== Rubric Management ====================

@router.post("", response_model=RubricResponse, status_code=status.HTTP_201_CREATED)
async def create_rubric(
    rubric_data: RubricCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role(["admin", "instructor"]))
):
    """
    Create a new grading rubric with criteria and levels
    
    Only admins and instructors can create rubrics
    """
    # Create rubric
    rubric = Rubric(
        title=rubric_data.title,
        description=rubric_data.description,
        rubric_type=rubric_data.rubric_type,
        scoring_method=rubric_data.scoring_method,
        max_score=rubric_data.max_score,
        is_active=rubric_data.is_active,
        created_by=current_user.id
    )
    
    db.add(rubric)
    db.flush()  # Get rubric ID
    
    # Create criteria
    for criterion_data in rubric_data.criteria:
        criterion = RubricCriterion(
            rubric_id=rubric.id,
            name=criterion_data.name,
            description=criterion_data.description,
            max_points=criterion_data.max_points,
            weight=criterion_data.weight,
            order=criterion_data.order
        )
        db.add(criterion)
        db.flush()
        
        # Create levels for this criterion
        for level_data in criterion_data.levels:
            level = RubricLevel(
                criterion_id=criterion.id,
                name=level_data.name,
                description=level_data.description,
                points=level_data.points,
                order=level_data.order
            )
            db.add(level)
    
    db.commit()
    db.refresh(rubric)
    
    return rubric


@router.get("", response_model=List[RubricListItem])
async def list_rubrics(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    rubric_type: Optional[RubricType] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role(["admin", "instructor", "hall_in_charge"]))
):
    """List all rubrics with optional filtering"""
    query = db.query(
        Rubric.id,
        Rubric.title,
        Rubric.rubric_type,
        Rubric.scoring_method,
        Rubric.max_score,
        Rubric.is_active,
        Rubric.created_by,
        Rubric.created_at,
        func.count(RubricCriterion.id).label('criteria_count')
    ).outerjoin(RubricCriterion).group_by(Rubric.id)
    
    # Apply filters
    if rubric_type:
        query = query.filter(Rubric.rubric_type == rubric_type)
    
    if is_active is not None:
        query = query.filter(Rubric.is_active == is_active)
    
    if search:
        query = query.filter(Rubric.title.ilike(f"%{search}%"))
    
    rubrics = query.order_by(desc(Rubric.created_at)).offset(skip).limit(limit).all()
    
    return [
        RubricListItem(
            id=r.id,
            title=r.title,
            rubric_type=r.rubric_type,
            scoring_method=r.scoring_method,
            max_score=r.max_score,
            is_active=r.is_active,
            criteria_count=r.criteria_count,
            created_by=r.created_by,
            created_at=r.created_at
        )
        for r in rubrics
    ]


@router.get("/{rubric_id}", response_model=RubricResponse)
async def get_rubric(
    rubric_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get rubric details with criteria and levels"""
    rubric = db.query(Rubric).filter(Rubric.id == rubric_id).first()
    
    if not rubric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rubric not found"
        )
    
    return rubric


@router.patch("/{rubric_id}", response_model=RubricResponse)
async def update_rubric(
    rubric_id: int,
    rubric_data: RubricUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role(["admin", "instructor"]))
):
    """Update rubric (title, description, active status only)"""
    rubric = db.query(Rubric).filter(Rubric.id == rubric_id).first()
    
    if not rubric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rubric not found"
        )
    
    # Only creator or admin can update
    if rubric.created_by != current_user.id and not current_user.has_role("admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update rubrics you created"
        )
    
    # Update fields
    if rubric_data.title:
        rubric.title = rubric_data.title
    if rubric_data.description is not None:
        rubric.description = rubric_data.description
    if rubric_data.is_active is not None:
        rubric.is_active = rubric_data.is_active
    
    db.commit()
    db.refresh(rubric)
    
    return rubric


@router.delete("/{rubric_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rubric(
    rubric_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role(["admin", "instructor"]))
):
    """Delete a rubric (only if not used in grading)"""
    rubric = db.query(Rubric).filter(Rubric.id == rubric_id).first()
    
    if not rubric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rubric not found"
        )
    
    # Only creator or admin can delete
    if rubric.created_by != current_user.id and not current_user.has_role("admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete rubrics you created"
        )
    
    # Check if rubric is used in any grading
    feedback_count = db.query(GradingFeedback).filter(
        GradingFeedback.rubric_id == rubric_id
    ).count()
    
    if feedback_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete rubric that has been used in {feedback_count} gradings"
        )
    
    db.delete(rubric)
    db.commit()


# ==================== Question-Rubric Assignment ====================

@router.post("/assign", response_model=QuestionRubricResponse)
async def assign_rubric_to_question(
    assignment: QuestionRubricAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role(["admin", "instructor"]))
):
    """Assign a rubric to a question"""
    # Verify question exists
    question = db.query(Question).filter(Question.id == assignment.question_id).first()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    # Verify rubric exists
    rubric = db.query(Rubric).filter(Rubric.id == assignment.rubric_id).first()
    if not rubric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rubric not found"
        )
    
    # Check if already assigned
    existing = db.query(QuestionRubric).filter(
        and_(
            QuestionRubric.question_id == assignment.question_id,
            QuestionRubric.rubric_id == assignment.rubric_id
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rubric already assigned to this question"
        )
    
    # Create assignment
    question_rubric = QuestionRubric(
        question_id=assignment.question_id,
        rubric_id=assignment.rubric_id,
        is_required=assignment.is_required
    )
    
    db.add(question_rubric)
    db.commit()
    db.refresh(question_rubric)
    
    return question_rubric


# ==================== Manual Grading ====================

@router.post("/grade", response_model=GradingFeedbackResponse)
async def submit_grading_feedback(
    grading: GradingFeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role(["admin", "instructor", "hall_in_charge"]))
):
    """
    Submit grading feedback using a rubric
    
    Graders can provide scores for each criterion and overall comments
    """
    # Verify answer exists
    answer = db.query(StudentAnswer).filter(StudentAnswer.id == grading.answer_id).first()
    if not answer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Answer not found"
        )
    
    # Verify rubric exists
    rubric = db.query(Rubric).filter(Rubric.id == grading.rubric_id).first()
    if not rubric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rubric not found"
        )
    
    # Calculate total score
    total_score = sum(cs.points_awarded for cs in grading.criterion_scores)
    
    # Validate total doesn't exceed max
    if total_score > rubric.max_score:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Total score ({total_score}) exceeds rubric max ({rubric.max_score})"
        )
    
    # Create feedback
    feedback = GradingFeedback(
        answer_id=grading.answer_id,
        rubric_id=grading.rubric_id,
        graded_by=current_user.id,
        total_score=total_score,
        comments=grading.comments
    )
    
    db.add(feedback)
    db.flush()
    
    # Create criterion scores
    for cs_input in grading.criterion_scores:
        criterion_score = CriterionScore(
            feedback_id=feedback.id,
            criterion_id=cs_input.criterion_id,
            level_id=cs_input.level_id,
            points_awarded=cs_input.points_awarded,
            comments=cs_input.comments
        )
        db.add(criterion_score)
    
    # Update answer with marks
    answer.marks_awarded = total_score
    answer.is_correct = (total_score / rubric.max_score) >= 0.5  # 50% threshold
    answer.auto_graded = False
    
    db.commit()
    db.refresh(feedback)
    
    # Build response
    return _build_feedback_response(feedback, db)


@router.get("/feedback/{feedback_id}", response_model=GradingFeedbackResponse)
async def get_grading_feedback(
    feedback_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get grading feedback details"""
    feedback = db.query(GradingFeedback).filter(GradingFeedback.id == feedback_id).first()
    
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grading feedback not found"
        )
    
    return _build_feedback_response(feedback, db)


@router.get("/answer/{answer_id}/feedback", response_model=Optional[GradingFeedbackResponse])
async def get_answer_feedback(
    answer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get grading feedback for a specific answer"""
    feedback = db.query(GradingFeedback).filter(
        GradingFeedback.answer_id == answer_id
    ).first()
    
    if not feedback:
        return None
    
    return _build_feedback_response(feedback, db)


@router.get("/attempt/{attempt_id}/progress", response_model=GradingProgress)
async def get_grading_progress(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role(["admin", "instructor", "hall_in_charge"]))
):
    """Get grading progress for an attempt"""
    attempt = db.query(StudentAttempt).filter(StudentAttempt.id == attempt_id).first()
    
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attempt not found"
        )
    
    # Count answers
    answers = db.query(StudentAnswer).filter(StudentAnswer.attempt_id == attempt_id).all()
    total = len(answers)
    
    graded = sum(1 for a in answers if a.marks_awarded is not None)
    auto_graded = sum(1 for a in answers if a.auto_graded)
    manual_graded = graded - auto_graded
    pending = total - graded
    
    percentage = (graded / total * 100) if total > 0 else 0
    
    return GradingProgress(
        total_answers=total,
        graded_count=graded,
        pending_count=pending,
        auto_graded_count=auto_graded,
        manual_graded_count=manual_graded,
        percentage_complete=round(percentage, 2)
    )


# ==================== Helper Functions ====================

def _build_feedback_response(feedback: GradingFeedback, db: Session) -> GradingFeedbackResponse:
    """Build detailed feedback response"""
    rubric = feedback.rubric
    grader = feedback.grader
    
    # Build criterion scores
    criterion_scores = []
    for cs in feedback.criterion_scores:
        criterion = cs.criterion
        level = cs.level
        
        criterion_scores.append(CriterionScoreResponse(
            id=cs.id,
            criterion_id=cs.criterion_id,
            criterion_name=criterion.name,
            level_id=cs.level_id,
            level_name=level.name if level else None,
            points_awarded=cs.points_awarded,
            max_points=criterion.max_points,
            comments=cs.comments
        ))
    
    percentage = (feedback.total_score / rubric.max_score * 100) if rubric.max_score > 0 else 0
    
    return GradingFeedbackResponse(
        id=feedback.id,
        answer_id=feedback.answer_id,
        rubric_id=feedback.rubric_id,
        rubric_title=rubric.title,
        graded_by=feedback.graded_by,
        grader_name=grader.username,
        total_score=feedback.total_score,
        max_score=rubric.max_score,
        percentage=round(percentage, 2),
        comments=feedback.comments,
        criterion_scores=criterion_scores,
        created_at=feedback.created_at,
        updated_at=feedback.updated_at
    )


# ==================== Analytics Endpoints ====================

@router.get("/analytics/question/{question_id}")
async def get_question_analytics(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role(["admin", "instructor", "hall_in_charge"]))
):
    """
    Get detailed analytics for a question
    
    Returns:
    - Difficulty index (percentage correct)
    - Discrimination index (correlation with overall performance)
    - Score distribution
    - Average score and standard deviation
    """
    analytics = AnalyticsService(db)
    stats = analytics.get_question_statistics(question_id)
    
    return stats


@router.get("/analytics/exam/{exam_id}")
async def get_exam_analytics(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role(["admin", "instructor", "hall_in_charge"]))
):
    """
    Get comprehensive analytics for an exam
    
    Returns:
    - Overall statistics (mean, median, std dev)
    - Pass rate
    - Percentiles (10th, 25th, 50th, 75th, 90th)
    - Score distribution by grade
    """
    analytics = AnalyticsService(db)
    stats = analytics.get_exam_statistics(exam_id)
    
    return stats


@router.get("/analytics/attempt/{attempt_id}")
async def get_attempt_analytics(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get analytics for a specific attempt
    
    Includes:
    - Percentile rank
    - Time per question
    - Comparison to exam average
    """
    # Check authorization - student can only view their own
    attempt = db.query(StudentAttempt).filter(StudentAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    if current_user.role not in ["admin", "instructor", "hall_in_charge"]:
        if attempt.student_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this attempt")
    
    analytics = AnalyticsService(db)
    stats = analytics.get_attempt_analytics(attempt_id)
    
    return stats
