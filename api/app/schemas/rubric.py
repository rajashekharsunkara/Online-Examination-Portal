"""
Rubric and Grading Schemas
Pydantic models for grading rubrics and manual grading
"""
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime
from enum import Enum


class RubricType(str, Enum):
    """Types of rubrics"""
    ANALYTICAL = "analytical"
    HOLISTIC = "holistic"
    CHECKLIST = "checklist"


class ScoringMethod(str, Enum):
    """How scores are calculated"""
    POINTS = "points"
    PERCENTAGE = "percentage"
    LEVELS = "levels"


# ============================================================================
# Rubric Level Schemas
# ============================================================================

class RubricLevelBase(BaseModel):
    """Base schema for rubric level"""
    name: str = Field(..., min_length=1, max_length=100, description="Level name (e.g., Excellent)")
    description: Optional[str] = Field(None, description="What this level means")
    points: float = Field(..., ge=0, description="Points awarded for this level")
    order: int = Field(0, description="Display order (0=highest)")


class RubricLevelCreate(RubricLevelBase):
    """Schema for creating rubric level"""
    pass


class RubricLevelUpdate(BaseModel):
    """Schema for updating rubric level"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    points: Optional[float] = Field(None, ge=0)
    order: Optional[int] = None


class RubricLevelResponse(RubricLevelBase):
    """Schema for rubric level response"""
    id: int
    criterion_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# Rubric Criterion Schemas
# ============================================================================

class RubricCriterionBase(BaseModel):
    """Base schema for rubric criterion"""
    name: str = Field(..., min_length=1, max_length=200, description="Criterion name")
    description: Optional[str] = Field(None, description="Criterion description")
    max_points: float = Field(..., gt=0, description="Maximum points for this criterion")
    weight: float = Field(1.0, gt=0, description="Weight multiplier")
    order: int = Field(0, ge=0, description="Display order")


class RubricCriterionCreate(RubricCriterionBase):
    """Schema for creating rubric criterion with levels"""
    levels: List[RubricLevelCreate] = Field([], description="Performance levels")
    
    @validator('levels')
    def validate_levels(cls, v, values):
        if not v:
            return v
        
        # Check that points are within max_points
        max_points = values.get('max_points', 0)
        for level in v:
            if level.points > max_points:
                raise ValueError(f"Level points ({level.points}) cannot exceed max_points ({max_points})")
        
        return v


class RubricCriterionUpdate(BaseModel):
    """Schema for updating rubric criterion"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    max_points: Optional[float] = Field(None, gt=0)
    weight: Optional[float] = Field(None, gt=0)
    order: Optional[int] = Field(None, ge=0)


class RubricCriterionResponse(RubricCriterionBase):
    """Schema for rubric criterion response"""
    id: int
    rubric_id: int
    levels: List[RubricLevelResponse] = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# Rubric Schemas
# ============================================================================

class RubricBase(BaseModel):
    """Base schema for rubric"""
    title: str = Field(..., min_length=1, max_length=200, description="Rubric title")
    description: Optional[str] = Field(None, description="Rubric description")
    rubric_type: RubricType = Field(RubricType.ANALYTICAL, description="Type of rubric")
    scoring_method: ScoringMethod = Field(ScoringMethod.POINTS, description="Scoring method")
    max_score: float = Field(..., gt=0, description="Maximum possible score")
    is_active: bool = Field(True, description="Is rubric active?")


class RubricCreate(RubricBase):
    """Schema for creating rubric"""
    criteria: List[RubricCriterionCreate] = Field([], description="Rubric criteria")
    
    @validator('criteria')
    def validate_criteria_total(cls, v, values):
        if not v:
            return v
        
        # For analytical rubrics, sum of criterion max_points should equal max_score
        max_score = values.get('max_score', 0)
        rubric_type = values.get('rubric_type')
        
        if rubric_type == RubricType.ANALYTICAL:
            total = sum(c.max_points * c.weight for c in v)
            if abs(total - max_score) > 0.01:  # Allow small floating point error
                raise ValueError(
                    f"Sum of weighted criterion max_points ({total}) should equal max_score ({max_score})"
                )
        
        return v


class RubricUpdate(BaseModel):
    """Schema for updating rubric"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class RubricResponse(RubricBase):
    """Schema for rubric response"""
    id: int
    created_by: int
    criteria: List[RubricCriterionResponse] = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class RubricListItem(BaseModel):
    """Schema for rubric list item (summary)"""
    id: int
    title: str
    rubric_type: RubricType
    scoring_method: ScoringMethod
    max_score: float
    is_active: bool
    criteria_count: int
    created_by: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# Question Rubric Assignment
# ============================================================================

class QuestionRubricAssign(BaseModel):
    """Schema for assigning rubric to question"""
    question_id: int = Field(..., gt=0)
    rubric_id: int = Field(..., gt=0)
    is_required: bool = Field(True, description="Is this rubric required?")


class QuestionRubricResponse(BaseModel):
    """Schema for question-rubric association"""
    id: int
    question_id: int
    rubric_id: int
    is_required: bool
    rubric: RubricResponse
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# Grading Feedback Schemas
# ============================================================================

class CriterionScoreInput(BaseModel):
    """Schema for scoring a criterion"""
    criterion_id: int = Field(..., gt=0)
    level_id: Optional[int] = Field(None, gt=0, description="Selected level (if using levels)")
    points_awarded: float = Field(..., ge=0, description="Points awarded")
    comments: Optional[str] = Field(None, max_length=1000, description="Feedback for this criterion")
    
    @validator('points_awarded')
    def validate_points(cls, v):
        if v < 0:
            raise ValueError("Points cannot be negative")
        return v


class GradingFeedbackCreate(BaseModel):
    """Schema for creating grading feedback"""
    answer_id: int = Field(..., gt=0)
    rubric_id: int = Field(..., gt=0)
    criterion_scores: List[CriterionScoreInput] = Field(..., min_items=1)
    comments: Optional[str] = Field(None, max_length=5000, description="Overall feedback")
    
    @validator('criterion_scores')
    def validate_criterion_scores(cls, v):
        # Check for duplicate criteria
        criterion_ids = [cs.criterion_id for cs in v]
        if len(criterion_ids) != len(set(criterion_ids)):
            raise ValueError("Duplicate criterion IDs not allowed")
        return v


class GradingFeedbackUpdate(BaseModel):
    """Schema for updating grading feedback"""
    criterion_scores: Optional[List[CriterionScoreInput]] = None
    comments: Optional[str] = Field(None, max_length=5000)


class CriterionScoreResponse(BaseModel):
    """Schema for criterion score response"""
    id: int
    criterion_id: int
    criterion_name: str
    level_id: Optional[int]
    level_name: Optional[str]
    points_awarded: float
    max_points: float
    comments: Optional[str]
    
    class Config:
        from_attributes = True


class GradingFeedbackResponse(BaseModel):
    """Schema for grading feedback response"""
    id: int
    answer_id: int
    rubric_id: int
    rubric_title: str
    graded_by: int
    grader_name: str
    total_score: float
    max_score: float
    percentage: float
    comments: Optional[str]
    criterion_scores: List[CriterionScoreResponse] = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# Manual Grading Workflow
# ============================================================================

class ManualGradeSubmit(BaseModel):
    """Schema for manual grading submission"""
    marks_awarded: float = Field(..., ge=0, description="Total marks awarded")
    feedback: Optional[str] = Field(None, max_length=5000, description="Grading feedback")
    rubric_feedback_id: Optional[int] = Field(None, description="Associated rubric feedback")


class BulkGradingRequest(BaseModel):
    """Schema for bulk grading multiple answers"""
    answer_grades: List[ManualGradeSubmit] = Field(..., min_items=1, max_items=100)
    
    @validator('answer_grades')
    def validate_bulk_limit(cls, v):
        if len(v) > 100:
            raise ValueError("Cannot grade more than 100 answers at once")
        return v


class GradingProgress(BaseModel):
    """Schema for grading progress tracking"""
    total_answers: int
    graded_count: int
    pending_count: int
    auto_graded_count: int
    manual_graded_count: int
    percentage_complete: float
    
    class Config:
        from_attributes = True


# ============================================================================
# Grading Statistics
# ============================================================================

class QuestionStatistics(BaseModel):
    """Schema for question-level statistics"""
    question_id: int
    total_attempts: int
    correct_count: int
    incorrect_count: int
    average_score: float
    difficulty_index: float  # % who got it correct
    discrimination_index: float  # Correlation with total score
    average_time_seconds: float
    
    class Config:
        from_attributes = True


class AttemptGradingDetails(BaseModel):
    """Schema for detailed attempt grading info"""
    attempt_id: int
    student_id: int
    student_name: str
    exam_id: int
    exam_title: str
    status: str
    total_marks: float
    marks_obtained: float
    percentage: float
    auto_graded: bool
    graded_at: Optional[datetime]
    grader_name: Optional[str]
    questions_count: int
    auto_graded_count: int
    manual_graded_count: int
    pending_grading_count: int
    
    class Config:
        from_attributes = True
