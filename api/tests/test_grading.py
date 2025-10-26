"""
Tests for Grading Service, Rubrics, and Analytics

Test Coverage:
- Auto-grading algorithms (partial credit, fuzzy matching, numeric tolerance)
- Rubric CRUD operations
- Manual grading workflow
- Analytics calculations
- Edge cases and validation
"""

import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.exam import Exam, Question, QuestionType
from app.models.attempt import StudentAttempt, StudentAnswer, AttemptStatus
from app.models.rubric import (
    Rubric, RubricCriterion, RubricLevel, QuestionRubric,
    GradingFeedback, CriterionScore, RubricType, ScoringMethod
)
from app.models.user import User
from app.services.grading import GradingService
from app.services.analytics import AnalyticsService


# ==================== Fixtures ====================

@pytest.fixture
def sample_exam(db: Session):
    """Create a sample exam with various question types"""
    exam = Exam(
        exam_code="TEST001",
        title="Sample Exam",
        description="Test exam for grading",
        duration_minutes=60,
        total_points=100,
        passing_score=60,
        max_attempts=1,
        start_time=datetime.utcnow(),
        end_time=datetime.utcnow() + timedelta(hours=2)
    )
    db.add(exam)
    db.flush()
    
    # MCQ Single
    q1 = Question(
        exam_id=exam.id,
        question_text="What is 2+2?",
        question_type=QuestionType.MCQ_SINGLE,
        options=["2", "3", "4", "5"],
        correct_answer="4",
        points=10,
        order_num=1
    )
    
    # MCQ Multiple
    q2 = Question(
        exam_id=exam.id,
        question_text="Which are prime numbers?",
        question_type=QuestionType.MCQ_MULTIPLE,
        options=["2", "3", "4", "5"],
        correct_answer=["2", "3", "5"],
        points=15,
        order_num=2
    )
    
    # Fill in blank
    q3 = Question(
        exam_id=exam.id,
        question_text="The capital of France is ___",
        question_type=QuestionType.FILL_BLANK,
        correct_answer="Paris",
        points=10,
        order_num=3
    )
    
    # Numeric
    q4 = Question(
        exam_id=exam.id,
        question_text="What is pi to 2 decimal places?",
        question_type=QuestionType.NUMERIC,
        correct_answer="3.14",
        points=10,
        order_num=4
    )
    
    # Essay (manual grading)
    q5 = Question(
        exam_id=exam.id,
        question_text="Explain photosynthesis",
        question_type=QuestionType.ESSAY,
        points=25,
        order_num=5
    )
    
    db.add_all([q1, q2, q3, q4, q5])
    db.commit()
    
    return exam


@pytest.fixture
def sample_rubric(db: Session):
    """Create a sample analytical rubric"""
    rubric = Rubric(
        title="Essay Rubric",
        description="Rubric for grading essays",
        rubric_type=RubricType.ANALYTICAL,
        scoring_method=ScoringMethod.POINTS,
        max_score=25,
        is_active=True
    )
    db.add(rubric)
    db.flush()
    
    # Criterion 1: Content (15 points)
    criterion1 = RubricCriterion(
        rubric_id=rubric.id,
        name="Content Quality",
        description="Accuracy and depth of content",
        max_points=15,
        weight=1.0,
        order_num=1
    )
    db.add(criterion1)
    db.flush()
    
    # Levels for criterion 1
    levels1 = [
        RubricLevel(criterion_id=criterion1.id, name="Excellent", description="Complete and accurate", points=15, order_num=1),
        RubricLevel(criterion_id=criterion1.id, name="Good", description="Mostly accurate", points=12, order_num=2),
        RubricLevel(criterion_id=criterion1.id, name="Fair", description="Partial understanding", points=8, order_num=3),
        RubricLevel(criterion_id=criterion1.id, name="Poor", description="Minimal understanding", points=4, order_num=4),
    ]
    db.add_all(levels1)
    
    # Criterion 2: Organization (10 points)
    criterion2 = RubricCriterion(
        rubric_id=rubric.id,
        name="Organization",
        description="Structure and clarity",
        max_points=10,
        weight=1.0,
        order_num=2
    )
    db.add(criterion2)
    db.flush()
    
    levels2 = [
        RubricLevel(criterion_id=criterion2.id, name="Excellent", description="Well organized", points=10, order_num=1),
        RubricLevel(criterion_id=criterion2.id, name="Good", description="Generally clear", points=7, order_num=2),
        RubricLevel(criterion_id=criterion2.id, name="Fair", description="Some organization", points=5, order_num=3),
        RubricLevel(criterion_id=criterion2.id, name="Poor", description="Disorganized", points=2, order_num=4),
    ]
    db.add_all(levels2)
    
    db.commit()
    return rubric


# ==================== Auto-Grading Tests ====================

class TestAutoGrading:
    """Test automated grading algorithms"""
    
    def test_mcq_single_correct(self, db: Session, sample_exam: Exam):
        """Test MCQ single choice - correct answer"""
        grading = GradingService(db)
        question = db.query(Question).filter(
            Question.exam_id == sample_exam.id,
            Question.question_type == QuestionType.MCQ_SINGLE
        ).first()
        
        result = grading._grade_mcq_single(question, "4")
        
        assert result["is_correct"] is True
        assert result["points_awarded"] == 10
        assert result["feedback"] == "Correct answer"
    
    def test_mcq_single_incorrect(self, db: Session, sample_exam: Exam):
        """Test MCQ single choice - incorrect answer"""
        grading = GradingService(db)
        question = db.query(Question).filter(
            Question.exam_id == sample_exam.id,
            Question.question_type == QuestionType.MCQ_SINGLE
        ).first()
        
        result = grading._grade_mcq_single(question, "3")
        
        assert result["is_correct"] is False
        assert result["points_awarded"] == 0
        assert "Incorrect" in result["feedback"]
    
    def test_mcq_multiple_partial_credit(self, db: Session, sample_exam: Exam):
        """Test MCQ multiple choice - partial credit using Jaccard similarity"""
        grading = GradingService(db)
        question = db.query(Question).filter(
            Question.exam_id == sample_exam.id,
            Question.question_type == QuestionType.MCQ_MULTIPLE
        ).first()
        
        # Correct: ["2", "3", "5"], Student: ["2", "3"] -> Intersection=2, Union=3
        # Similarity = 2/3 = 0.667, Points = 15 * 0.667 = 10
        result = grading._grade_mcq_multiple(question, ["2", "3"])
        
        assert result["is_correct"] is False  # Not 100% correct
        assert result["points_awarded"] == pytest.approx(10, abs=0.5)
        assert "Partial credit" in result["feedback"]
    
    def test_mcq_multiple_all_correct(self, db: Session, sample_exam: Exam):
        """Test MCQ multiple choice - all correct"""
        grading = GradingService(db)
        question = db.query(Question).filter(
            Question.exam_id == sample_exam.id,
            Question.question_type == QuestionType.MCQ_MULTIPLE
        ).first()
        
        result = grading._grade_mcq_multiple(question, ["2", "3", "5"])
        
        assert result["is_correct"] is True
        assert result["points_awarded"] == 15
    
    def test_fill_blank_exact_match(self, db: Session, sample_exam: Exam):
        """Test fill-in-blank - exact match (case-insensitive)"""
        grading = GradingService(db)
        question = db.query(Question).filter(
            Question.exam_id == sample_exam.id,
            Question.question_type == QuestionType.FILL_BLANK
        ).first()
        
        result = grading._grade_fill_blank(question, "paris")
        
        assert result["is_correct"] is True
        assert result["points_awarded"] == 10
    
    def test_fill_blank_fuzzy_match(self, db: Session, sample_exam: Exam):
        """Test fill-in-blank - fuzzy matching with typo"""
        grading = GradingService(db)
        question = db.query(Question).filter(
            Question.exam_id == sample_exam.id,
            Question.question_type == QuestionType.FILL_BLANK
        ).first()
        
        # "Pari" should match "Paris" with >80% similarity
        result = grading._grade_fill_blank(question, "Pari")
        
        # Should get partial credit for close match
        assert result["points_awarded"] > 0
        assert result["points_awarded"] < 10
    
    def test_numeric_exact(self, db: Session, sample_exam: Exam):
        """Test numeric answer - exact match"""
        grading = GradingService(db)
        question = db.query(Question).filter(
            Question.exam_id == sample_exam.id,
            Question.question_type == QuestionType.NUMERIC
        ).first()
        
        result = grading._grade_numeric(question, "3.14")
        
        assert result["is_correct"] is True
        assert result["points_awarded"] == 10
    
    def test_numeric_within_tolerance(self, db: Session, sample_exam: Exam):
        """Test numeric answer - within tolerance"""
        grading = GradingService(db)
        question = db.query(Question).filter(
            Question.exam_id == sample_exam.id,
            Question.question_type == QuestionType.NUMERIC
        ).first()
        
        # 3.13 is close to 3.14, should get partial credit
        result = grading._grade_numeric(question, "3.13")
        
        assert result["points_awarded"] > 5  # Should get some credit
        assert result["points_awarded"] < 10  # But not full credit
    
    def test_numeric_outside_tolerance(self, db: Session, sample_exam: Exam):
        """Test numeric answer - outside tolerance"""
        grading = GradingService(db)
        question = db.query(Question).filter(
            Question.exam_id == sample_exam.id,
            Question.question_type == QuestionType.NUMERIC
        ).first()
        
        result = grading._grade_numeric(question, "5.0")
        
        assert result["is_correct"] is False
        assert result["points_awarded"] == 0


# ==================== Rubric Tests ====================

class TestRubrics:
    """Test rubric management and application"""
    
    def test_create_rubric(self, db: Session, sample_rubric: Rubric):
        """Test rubric creation"""
        assert sample_rubric.id is not None
        assert sample_rubric.max_score == 25
        assert len(sample_rubric.criteria) == 2
    
    def test_rubric_criteria_sum(self, db: Session, sample_rubric: Rubric):
        """Test that criteria points sum to max score"""
        total = sum(c.max_points for c in sample_rubric.criteria)
        assert total == sample_rubric.max_score
    
    def test_assign_rubric_to_question(self, db: Session, sample_exam: Exam, sample_rubric: Rubric):
        """Test assigning rubric to a question"""
        # Get essay question
        question = db.query(Question).filter(
            Question.exam_id == sample_exam.id,
            Question.question_type == QuestionType.ESSAY
        ).first()
        
        # Assign rubric
        assignment = QuestionRubric(
            question_id=question.id,
            rubric_id=sample_rubric.id,
            is_active=True
        )
        db.add(assignment)
        db.commit()
        
        # Verify
        qa = db.query(QuestionRubric).filter(
            QuestionRubric.question_id == question.id
        ).first()
        
        assert qa is not None
        assert qa.rubric_id == sample_rubric.id


# ==================== Manual Grading Tests ====================

class TestManualGrading:
    """Test manual grading workflow"""
    
    def test_submit_grading_feedback(self, db: Session, sample_exam: Exam, sample_rubric: Rubric):
        """Test submitting grading feedback"""
        # Create student and attempt
        student = User(username="student1", email="student1@test.com", role="student")
        db.add(student)
        db.flush()
        
        attempt = StudentAttempt(
            exam_id=sample_exam.id,
            student_id=student.id,
            status=AttemptStatus.SUBMITTED
        )
        db.add(attempt)
        db.flush()
        
        # Get essay question
        question = db.query(Question).filter(
            Question.exam_id == sample_exam.id,
            Question.question_type == QuestionType.ESSAY
        ).first()
        
        # Create answer
        answer = StudentAnswer(
            attempt_id=attempt.id,
            question_id=question.id,
            answer_text="Photosynthesis is the process...",
            is_submitted=True
        )
        db.add(answer)
        db.flush()
        
        # Create grader
        grader = User(username="instructor1", email="inst1@test.com", role="instructor")
        db.add(grader)
        db.flush()
        
        # Submit feedback
        feedback = GradingFeedback(
            answer_id=answer.id,
            rubric_id=sample_rubric.id,
            graded_by=grader.id,
            total_score=22,
            comments="Good understanding, minor organization issues"
        )
        db.add(feedback)
        db.flush()
        
        # Add criterion scores
        criteria = sample_rubric.criteria
        
        # Content: Excellent (15 pts)
        cs1 = CriterionScore(
            feedback_id=feedback.id,
            criterion_id=criteria[0].id,
            level_id=criteria[0].levels[0].id,  # Excellent
            points_awarded=15
        )
        
        # Organization: Good (7 pts)
        cs2 = CriterionScore(
            feedback_id=feedback.id,
            criterion_id=criteria[1].id,
            level_id=criteria[1].levels[1].id,  # Good
            points_awarded=7
        )
        
        db.add_all([cs1, cs2])
        db.commit()
        
        # Verify
        saved_feedback = db.query(GradingFeedback).filter(
            GradingFeedback.id == feedback.id
        ).first()
        
        assert saved_feedback is not None
        assert saved_feedback.total_score == 22
        assert len(saved_feedback.criterion_scores) == 2
    
    def test_grading_updates_attempt_score(self, db: Session, sample_exam: Exam, sample_rubric: Rubric):
        """Test that manual grading updates attempt total score"""
        # Setup (similar to above)
        student = User(username="student2", email="student2@test.com", role="student")
        db.add(student)
        db.flush()
        
        attempt = StudentAttempt(
            exam_id=sample_exam.id,
            student_id=student.id,
            status=AttemptStatus.SUBMITTED,
            total_score=0
        )
        db.add(attempt)
        db.flush()
        
        question = db.query(Question).filter(
            Question.exam_id == sample_exam.id,
            Question.question_type == QuestionType.ESSAY
        ).first()
        
        answer = StudentAnswer(
            attempt_id=attempt.id,
            question_id=question.id,
            answer_text="Test answer",
            is_submitted=True,
            points_awarded=0
        )
        db.add(answer)
        db.flush()
        
        grader = User(username="instructor2", email="inst2@test.com", role="instructor")
        db.add(grader)
        db.flush()
        
        # Grade the answer
        feedback = GradingFeedback(
            answer_id=answer.id,
            rubric_id=sample_rubric.id,
            graded_by=grader.id,
            total_score=20
        )
        db.add(feedback)
        db.flush()
        
        # Update answer score
        answer.points_awarded = 20
        answer.is_correct = True
        
        # Recalculate attempt score
        total = db.query(func.sum(StudentAnswer.points_awarded)).filter(
            StudentAnswer.attempt_id == attempt.id
        ).scalar() or 0
        
        attempt.total_score = total
        db.commit()
        
        # Verify
        updated_attempt = db.query(StudentAttempt).filter(
            StudentAttempt.id == attempt.id
        ).first()
        
        assert updated_attempt.total_score == 20


# ==================== Analytics Tests ====================

class TestAnalytics:
    """Test analytics calculations"""
    
    def test_difficulty_index_easy(self, db: Session, sample_exam: Exam):
        """Test difficulty index for easy question"""
        analytics = AnalyticsService(db)
        
        # Create 10 attempts, 9 correct
        question = db.query(Question).filter(
            Question.exam_id == sample_exam.id,
            Question.question_type == QuestionType.MCQ_SINGLE
        ).first()
        
        for i in range(10):
            student = User(username=f"student_di_{i}", email=f"s{i}@test.com", role="student")
            db.add(student)
            db.flush()
            
            attempt = StudentAttempt(
                exam_id=sample_exam.id,
                student_id=student.id,
                status=AttemptStatus.SUBMITTED
            )
            db.add(attempt)
            db.flush()
            
            # 9 correct, 1 incorrect
            is_correct = i < 9
            answer = StudentAnswer(
                attempt_id=attempt.id,
                question_id=question.id,
                selected_options=["4" if is_correct else "3"],
                is_correct=is_correct,
                points_awarded=question.points if is_correct else 0,
                is_submitted=True
            )
            db.add(answer)
        
        db.commit()
        
        # Calculate
        stats = analytics.get_question_statistics(question.id)
        
        assert stats["difficulty_index"] == pytest.approx(0.9, abs=0.01)
        assert stats["difficulty_category"] == "Easy"
    
    def test_exam_statistics(self, db: Session, sample_exam: Exam):
        """Test exam-level statistics"""
        analytics = AnalyticsService(db)
        
        # Create attempts with varying scores
        scores = [45, 55, 65, 75, 85, 95]
        
        for i, score in enumerate(scores):
            student = User(username=f"student_exam_{i}", email=f"se{i}@test.com", role="student")
            db.add(student)
            db.flush()
            
            attempt = StudentAttempt(
                exam_id=sample_exam.id,
                student_id=student.id,
                status=AttemptStatus.SUBMITTED,
                total_score=score
            )
            db.add(attempt)
        
        db.commit()
        
        # Calculate
        stats = analytics.get_exam_statistics(sample_exam.id)
        
        assert stats["total_attempts"] == 6
        assert stats["average_score"] == pytest.approx(70, abs=1)
        assert stats["median_score"] == pytest.approx(70, abs=1)
        assert stats["min_score"] == 45
        assert stats["max_score"] == 95
        # Pass rate: 4/6 = 66.67% (passing is 60)
        assert stats["pass_rate"] == pytest.approx(66.67, abs=1)
    
    def test_percentile_calculation(self, db: Session, sample_exam: Exam):
        """Test percentile rank calculation"""
        analytics = AnalyticsService(db)
        
        # Create 100 attempts with scores 1-100
        for score in range(1, 101):
            student = User(username=f"student_p_{score}", email=f"sp{score}@test.com", role="student")
            db.add(student)
            db.flush()
            
            attempt = StudentAttempt(
                exam_id=sample_exam.id,
                student_id=student.id,
                status=AttemptStatus.SUBMITTED,
                total_score=score
            )
            db.add(attempt)
        
        db.commit()
        
        # Test: score of 75 should be at ~75th percentile
        percentile = analytics._calculate_percentile_rank(75, sample_exam.id)
        
        assert percentile == pytest.approx(75, abs=2)


# ==================== Edge Cases ====================

class TestEdgeCases:
    """Test edge cases and validation"""
    
    def test_empty_answer_grading(self, db: Session, sample_exam: Exam):
        """Test grading empty/null answers"""
        grading = GradingService(db)
        question = db.query(Question).filter(
            Question.exam_id == sample_exam.id,
            Question.question_type == QuestionType.MCQ_SINGLE
        ).first()
        
        result = grading._grade_mcq_single(question, None)
        
        assert result["is_correct"] is False
        assert result["points_awarded"] == 0
    
    def test_invalid_numeric_answer(self, db: Session, sample_exam: Exam):
        """Test grading non-numeric answer for numeric question"""
        grading = GradingService(db)
        question = db.query(Question).filter(
            Question.exam_id == sample_exam.id,
            Question.question_type == QuestionType.NUMERIC
        ).first()
        
        result = grading._grade_numeric(question, "not a number")
        
        assert result["is_correct"] is False
        assert result["points_awarded"] == 0
    
    def test_zero_max_score(self, db: Session):
        """Test analytics with zero max score"""
        analytics = AnalyticsService(db)
        
        exam = Exam(
            exam_code="TEST_ZERO",
            title="Zero Score Exam",
            total_points=0,
            passing_score=0
        )
        db.add(exam)
        db.commit()
        
        stats = analytics.get_exam_statistics(exam.id)
        
        assert stats["total_attempts"] == 0
        assert stats["average_score"] is None
