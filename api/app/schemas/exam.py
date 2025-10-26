"""
Pydantic schemas for exams, questions, and trades
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator
from app.models.exam import QuestionType, DifficultyLevel, ExamStatus


# Trade schemas
class TradeBase(BaseModel):
    """Base trade schema"""
    name: str
    code: str
    description: Optional[str] = None


class TradeCreate(TradeBase):
    """Schema for creating a trade"""
    pass


class TradeUpdate(BaseModel):
    """Schema for updating a trade"""
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class Trade(TradeBase):
    """Trade response schema"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Question Bank schemas
class QuestionBankBase(BaseModel):
    """Base question bank schema"""
    name: str
    description: Optional[str] = None
    trade_id: int


class QuestionBankCreate(QuestionBankBase):
    """Schema for creating a question bank"""
    pass


class QuestionBankUpdate(BaseModel):
    """Schema for updating a question bank"""
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class QuestionBank(QuestionBankBase):
    """Question bank response schema"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    trade: Optional[Trade] = None
    
    class Config:
        from_attributes = True


# Question schemas
class QuestionBase(BaseModel):
    """Base question schema"""
    question_text: str
    question_type: QuestionType = QuestionType.MULTIPLE_CHOICE
    options: Optional[Dict[str, str]] = None
    correct_answer: List[str]
    explanation: Optional[str] = None
    difficulty: DifficultyLevel = DifficultyLevel.MEDIUM
    marks: float = 1.0
    negative_marks: float = 0.0
    tags: Optional[List[str]] = None


class QuestionCreate(QuestionBase):
    """Schema for creating a question"""
    question_bank_id: int
    
    @validator('correct_answer')
    def validate_correct_answer(cls, v, values):
        """Ensure correct_answer is not empty"""
        if not v or len(v) == 0:
            raise ValueError('correct_answer must contain at least one answer')
        return v
    
    @validator('options')
    def validate_options(cls, v, values):
        """Validate options for MCQ type questions"""
        question_type = values.get('question_type')
        if question_type == QuestionType.MULTIPLE_CHOICE and not v:
            raise ValueError('options are required for multiple choice questions')
        return v


class QuestionUpdate(BaseModel):
    """Schema for updating a question"""
    question_text: Optional[str] = None
    question_type: Optional[QuestionType] = None
    options: Optional[Dict[str, str]] = None
    correct_answer: Optional[List[str]] = None
    explanation: Optional[str] = None
    difficulty: Optional[DifficultyLevel] = None
    marks: Optional[float] = None
    negative_marks: Optional[float] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None


class Question(QuestionBase):
    """Question response schema"""
    id: int
    question_bank_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Question for CSV import
class QuestionCSVImport(BaseModel):
    """Schema for importing questions from CSV"""
    question_text: str
    question_type: str = "multiple_choice"
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_answer: str  # e.g., "A" or "A,C" for multiple
    explanation: Optional[str] = None
    difficulty: str = "medium"
    marks: float = 1.0
    negative_marks: float = 0.0
    tags: Optional[str] = None  # comma-separated


# Exam schemas
class ExamBase(BaseModel):
    """Base exam schema"""
    title: str
    description: Optional[str] = None
    trade_id: int
    duration_minutes: int
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    total_marks: float
    passing_marks: float
    total_questions: int
    shuffle_questions: bool = False
    shuffle_options: bool = False
    show_results_immediately: bool = False
    allow_review: bool = True
    instructions: Optional[str] = None


class ExamCreate(ExamBase):
    """Schema for creating an exam"""
    question_ids: Optional[List[int]] = []  # Questions to attach
    
    @validator('passing_marks')
    def validate_passing_marks(cls, v, values):
        """Ensure passing marks <= total marks"""
        total_marks = values.get('total_marks')
        if total_marks and v > total_marks:
            raise ValueError('passing_marks cannot exceed total_marks')
        return v


class ExamUpdate(BaseModel):
    """Schema for updating an exam"""
    title: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    total_marks: Optional[float] = None
    passing_marks: Optional[float] = None
    total_questions: Optional[int] = None
    shuffle_questions: Optional[bool] = None
    shuffle_options: Optional[bool] = None
    show_results_immediately: Optional[bool] = None
    allow_review: Optional[bool] = None
    instructions: Optional[str] = None
    status: Optional[ExamStatus] = None


class ExamQuestion(BaseModel):
    """Exam question association"""
    question_id: int
    order_number: int
    marks_override: Optional[float] = None


class Exam(ExamBase):
    """Exam response schema"""
    id: int
    status: ExamStatus
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    trade: Optional[Trade] = None
    
    class Config:
        from_attributes = True


class ExamWithQuestions(Exam):
    """Exam with questions included"""
    questions: List[Question] = []


class ExamQTI(BaseModel):
    """QTI-like export format for exam"""
    exam_id: int
    title: str
    description: Optional[str]
    duration_minutes: int
    total_marks: float
    questions: List[Dict[str, Any]]
