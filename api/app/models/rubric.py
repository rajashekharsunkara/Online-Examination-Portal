"""
Grading Rubric Models
Supports analytical rubrics with multiple criteria for manual grading
"""
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin
import enum


class RubricType(str, enum.Enum):
    """Types of rubrics"""
    ANALYTICAL = "analytical"  # Multiple criteria with individual scores
    HOLISTIC = "holistic"      # Single overall score
    CHECKLIST = "checklist"    # Binary checkboxes


class ScoringMethod(str, enum.Enum):
    """How scores are calculated"""
    POINTS = "points"          # Sum of points (e.g., 0-10 points)
    PERCENTAGE = "percentage"  # Percentage (0-100%)
    LEVELS = "levels"          # Performance levels (e.g., 1-5)


class Rubric(Base, TimestampMixin):
    """
    Grading rubric for questions or exams
    Can be applied to individual questions or entire exams
    """
    __tablename__ = "rubrics"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # Rubric configuration
    rubric_type = Column(Enum(RubricType), default=RubricType.ANALYTICAL, nullable=False)
    scoring_method = Column(Enum(ScoringMethod), default=ScoringMethod.POINTS, nullable=False)
    max_score = Column(Float, nullable=False)  # Maximum possible score
    
    # Who created it
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Is this rubric active/published?
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    criteria = relationship("RubricCriterion", back_populates="rubric", cascade="all, delete-orphan")
    question_rubrics = relationship("QuestionRubric", back_populates="rubric")
    creator = relationship("User", foreign_keys=[created_by])
    
    def __repr__(self):
        return f"<Rubric {self.title} ({self.rubric_type})>"


class RubricCriterion(Base, TimestampMixin):
    """
    Individual criterion within a rubric
    For analytical rubrics, each criterion has multiple performance levels
    """
    __tablename__ = "rubric_criteria"
    
    id = Column(Integer, primary_key=True, index=True)
    rubric_id = Column(Integer, ForeignKey("rubrics.id"), nullable=False)
    
    # Criterion details
    name = Column(String(200), nullable=False)  # e.g., "Completeness", "Accuracy"
    description = Column(Text, nullable=True)
    order = Column(Integer, default=0)  # Display order
    
    # Scoring for this criterion
    max_points = Column(Float, nullable=False)  # Max points for this criterion
    weight = Column(Float, default=1.0)  # Weight multiplier (optional)
    
    # Relationships
    rubric = relationship("Rubric", back_populates="criteria")
    levels = relationship("RubricLevel", back_populates="criterion", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<RubricCriterion {self.name} (max: {self.max_points})>"


class RubricLevel(Base, TimestampMixin):
    """
    Performance level for a rubric criterion
    Defines what each score level means (e.g., Excellent=10, Good=7, Fair=4)
    """
    __tablename__ = "rubric_levels"
    
    id = Column(Integer, primary_key=True, index=True)
    criterion_id = Column(Integer, ForeignKey("rubric_criteria.id"), nullable=False)
    
    # Level details
    name = Column(String(100), nullable=False)  # e.g., "Excellent", "Good", "Fair"
    description = Column(Text, nullable=True)   # What this level means
    points = Column(Float, nullable=False)      # Points awarded for this level
    order = Column(Integer, default=0)          # Display order (highest to lowest)
    
    # Relationships
    criterion = relationship("RubricCriterion", back_populates="levels")
    
    def __repr__(self):
        return f"<RubricLevel {self.name} ({self.points} pts)>"


class QuestionRubric(Base, TimestampMixin):
    """
    Association between questions and rubrics
    Allows assigning rubrics to specific questions for manual grading
    """
    __tablename__ = "question_rubrics"
    
    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    rubric_id = Column(Integer, ForeignKey("rubrics.id"), nullable=False)
    
    # Is this rubric required for grading this question?
    is_required = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    question = relationship("Question", back_populates="rubrics")
    rubric = relationship("Rubric", back_populates="question_rubrics")
    
    def __repr__(self):
        return f"<QuestionRubric question={self.question_id} rubric={self.rubric_id}>"


class GradingFeedback(Base, TimestampMixin):
    """
    Feedback and scores given by graders using rubrics
    Stores which levels were selected for each criterion
    """
    __tablename__ = "grading_feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    answer_id = Column(Integer, ForeignKey("student_answers.id"), nullable=False)
    rubric_id = Column(Integer, ForeignKey("rubrics.id"), nullable=False)
    graded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Overall feedback
    comments = Column(Text, nullable=True)
    total_score = Column(Float, nullable=False)  # Calculated from criterion scores
    
    # Relationships
    answer = relationship("StudentAnswer", back_populates="grading_feedback")
    rubric = relationship("Rubric")
    grader = relationship("User", foreign_keys=[graded_by])
    criterion_scores = relationship("CriterionScore", back_populates="feedback", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<GradingFeedback answer={self.answer_id} score={self.total_score}>"


class CriterionScore(Base, TimestampMixin):
    """
    Score for a specific criterion in grading feedback
    Tracks which level was selected for each criterion
    """
    __tablename__ = "criterion_scores"
    
    id = Column(Integer, primary_key=True, index=True)
    feedback_id = Column(Integer, ForeignKey("grading_feedback.id"), nullable=False)
    criterion_id = Column(Integer, ForeignKey("rubric_criteria.id"), nullable=False)
    level_id = Column(Integer, ForeignKey("rubric_levels.id"), nullable=True)
    
    # Score details
    points_awarded = Column(Float, nullable=False)
    comments = Column(Text, nullable=True)  # Specific feedback for this criterion
    
    # Relationships
    feedback = relationship("GradingFeedback", back_populates="criterion_scores")
    criterion = relationship("RubricCriterion")
    level = relationship("RubricLevel")
    
    def __repr__(self):
        return f"<CriterionScore criterion={self.criterion_id} points={self.points_awarded}>"
