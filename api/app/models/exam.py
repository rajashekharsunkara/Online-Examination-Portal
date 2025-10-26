"""
Exam, Question, and Trade models
"""
from datetime import datetime
from typing import List
from sqlalchemy import (
    Boolean, Column, Integer, String, Text, DateTime, 
    ForeignKey, Enum, Float, JSON
)
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base


class QuestionType(str, enum.Enum):
    """Question types enum"""
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"
    SHORT_ANSWER = "short_answer"
    ESSAY = "essay"


class DifficultyLevel(str, enum.Enum):
    """Difficulty levels enum"""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class ExamStatus(str, enum.Enum):
    """Exam status enum"""
    DRAFT = "draft"
    PUBLISHED = "published"
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class Trade(Base):
    """
    Trade/Course model (e.g., Electrician, Plumber, Mechanic)
    """
    __tablename__ = "trades"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    question_banks = relationship("QuestionBank", back_populates="trade", cascade="all, delete-orphan")
    exams = relationship("Exam", back_populates="trade")
    students = relationship("User", back_populates="trade")
    
    def __repr__(self):
        return f"<Trade {self.code}: {self.name}>"


class QuestionBank(Base):
    """
    Question bank containing questions for a specific trade
    """
    __tablename__ = "question_banks"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    trade_id = Column(Integer, ForeignKey('trades.id', ondelete='CASCADE'), nullable=False)
    
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    trade = relationship("Trade", back_populates="question_banks")
    questions = relationship("Question", back_populates="question_bank", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<QuestionBank {self.name}>"


class Question(Base):
    """
    Individual question in a question bank
    """
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    
    question_bank_id = Column(Integer, ForeignKey('question_banks.id', ondelete='CASCADE'), nullable=False)
    
    question_text = Column(Text, nullable=False)
    question_type = Column(Enum(QuestionType), nullable=False, default=QuestionType.MULTIPLE_CHOICE)
    
    # Options stored as JSON: {"A": "Option 1", "B": "Option 2", ...}
    options = Column(JSON, nullable=True)
    
    # Correct answer(s) stored as JSON: ["A"] or ["A", "C"] for multiple correct
    correct_answer = Column(JSON, nullable=False)
    
    # Explanation for the answer
    explanation = Column(Text, nullable=True)
    
    # Difficulty and marks
    difficulty = Column(Enum(DifficultyLevel), nullable=False, default=DifficultyLevel.MEDIUM)
    marks = Column(Float, default=1.0, nullable=False)
    
    # Negative marking
    negative_marks = Column(Float, default=0.0, nullable=False)
    
    # Metadata
    tags = Column(JSON, nullable=True)  # ["tag1", "tag2", ...]
    
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    question_bank = relationship("QuestionBank", back_populates="questions")
    exam_questions = relationship("ExamQuestion", back_populates="question")
    rubrics = relationship("QuestionRubric", back_populates="question")
    
    def __repr__(self):
        return f"<Question {self.id}: {self.question_text[:50]}...>"


class Exam(Base):
    """
    Exam configuration
    """
    __tablename__ = "exams"
    
    id = Column(Integer, primary_key=True, index=True)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    trade_id = Column(Integer, ForeignKey('trades.id', ondelete='RESTRICT'), nullable=False)
    
    # Exam timing
    duration_minutes = Column(Integer, nullable=False)  # Exam duration
    start_time = Column(DateTime, nullable=True)  # When exam becomes available
    end_time = Column(DateTime, nullable=True)  # When exam closes
    
    # Exam configuration
    total_marks = Column(Float, nullable=False)
    passing_marks = Column(Float, nullable=False)
    
    # Question selection
    total_questions = Column(Integer, nullable=False)
    
    # Settings
    shuffle_questions = Column(Boolean, default=False, nullable=False)
    shuffle_options = Column(Boolean, default=False, nullable=False)
    show_results_immediately = Column(Boolean, default=False, nullable=False)
    allow_review = Column(Boolean, default=True, nullable=False)
    
    # Status
    status = Column(Enum(ExamStatus), default=ExamStatus.DRAFT, nullable=False)
    
    # Instructions
    instructions = Column(Text, nullable=True)
    
    created_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    trade = relationship("Trade", back_populates="exams")
    exam_questions = relationship("ExamQuestion", back_populates="exam", cascade="all, delete-orphan")
    attempts = relationship("StudentAttempt", back_populates="exam")
    
    def __repr__(self):
        return f"<Exam {self.title}>"


class ExamQuestion(Base):
    """
    Association table linking exams to questions with ordering
    """
    __tablename__ = "exam_questions"
    
    id = Column(Integer, primary_key=True, index=True)
    
    exam_id = Column(Integer, ForeignKey('exams.id', ondelete='CASCADE'), nullable=False)
    question_id = Column(Integer, ForeignKey('questions.id', ondelete='CASCADE'), nullable=False)
    
    # Question order in exam
    order_number = Column(Integer, nullable=False)
    
    # Optional: override marks for this specific exam
    marks_override = Column(Float, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    exam = relationship("Exam", back_populates="exam_questions")
    question = relationship("Question", back_populates="exam_questions")
    
    def __repr__(self):
        return f"<ExamQuestion exam={self.exam_id} question={self.question_id} order={self.order_number}>"
