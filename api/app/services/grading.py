"""
Auto-grading service for exam attempts
Handles automated grading for MCQ, true/false, fill-in-blank, and numeric questions
Supports partial credit, fuzzy matching, and configurable grading strategies
"""
from typing import List, Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session
from app.models.attempt import StudentAttempt, StudentAnswer, AttemptStatus
from app.models.exam import Question, QuestionType
from app.services.decryption import decrypt_attempt_answers, DecryptionError
import logging
import re
from difflib import SequenceMatcher

logger = logging.getLogger(__name__)


class GradingService:
    """Service for auto-grading student attempts"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def grade_attempt(self, attempt: StudentAttempt) -> Dict[str, Any]:
        """
        Grade an entire attempt
        
        Returns:
            dict with grading results and statistics
        """
        if attempt.status != AttemptStatus.SUBMITTED:
            raise ValueError("Can only grade submitted attempts")
        
        # Decrypt encrypted answers if present
        if attempt.encrypted_final_answers:
            try:
                # Get student username from relationship
                student = attempt.student
                username = student.username if student else None
                
                if not username:
                    raise ValueError("Student username not found for decryption")
                
                # Decrypt answers
                decrypted_answers = decrypt_attempt_answers(attempt, username)
                logger.info(
                    f"Successfully decrypted answers for attempt {attempt.id}, "
                    f"got {len(decrypted_answers)} answers"
                )
                
            except DecryptionError as e:
                logger.error(f"Failed to decrypt answers for attempt {attempt.id}: {e}")
                raise ValueError(f"Failed to decrypt exam answers: {str(e)}")
        
        # Get all answers for this attempt
        answers = self.db.query(StudentAnswer).filter(
            StudentAnswer.attempt_id == attempt.id
        ).all()
        
        total_marks = 0.0
        marks_obtained = 0.0
        correct_count = 0
        incorrect_count = 0
        unattempted_count = 0
        auto_gradable_count = 0
        
        # Grade each answer
        for answer in answers:
            question = answer.question
            
            # Check if question is auto-gradable
            if self._is_auto_gradable(question):
                auto_gradable_count += 1
                is_correct, marks = self._grade_answer(answer, question)
                
                # Update answer record
                answer.is_correct = is_correct
                answer.marks_awarded = marks
                answer.auto_graded = True
                
                marks_obtained += marks
                
                if is_correct:
                    correct_count += 1
                else:
                    incorrect_count += 1
            
            # Accumulate total marks
            if answer.marks_override:
                total_marks += answer.marks_override
            else:
                total_marks += question.marks
        
        # Count unattempted questions
        total_questions = len(attempt.exam.exam_questions)
        answered_questions = len(answers)
        unattempted_count = total_questions - answered_questions
        
        # Calculate percentage
        percentage = (marks_obtained / total_marks * 100) if total_marks > 0 else 0.0
        
        # Determine pass/fail
        is_passed = marks_obtained >= attempt.exam.passing_marks
        
        # Update attempt record
        attempt.total_marks = total_marks
        attempt.marks_obtained = marks_obtained
        attempt.percentage = round(percentage, 2)
        attempt.is_passed = is_passed
        attempt.auto_graded = True
        attempt.status = AttemptStatus.GRADED
        
        self.db.commit()
        
        return {
            "attempt_id": attempt.id,
            "total_marks": total_marks,
            "marks_obtained": marks_obtained,
            "percentage": round(percentage, 2),
            "is_passed": is_passed,
            "correct_answers": correct_count,
            "incorrect_answers": incorrect_count,
            "unattempted": unattempted_count,
            "auto_graded_count": auto_gradable_count,
            "manual_grading_required": answered_questions - auto_gradable_count > 0
        }
    
    def _is_auto_gradable(self, question: Question) -> bool:
        """Check if a question type can be auto-graded"""
        return question.question_type in [
            QuestionType.MULTIPLE_CHOICE,
            QuestionType.TRUE_FALSE,
        ]
    
    def _grade_answer(self, answer: StudentAnswer, question: Question) -> Tuple[bool, float]:
        """
        Grade a single answer
        
        Returns:
            tuple of (is_correct: bool, marks_awarded: float)
        """
        if not answer.answer:
            # Empty answer is incorrect
            return False, 0.0
        
        student_answer = self._normalize_answer(answer.answer)
        correct_answer = self._normalize_answer(question.correct_answer)
        
        # Compare answers
        is_correct = self._compare_answers(student_answer, correct_answer, question.question_type)
        
        if is_correct:
            # Full marks for correct answer
            return True, question.marks
        else:
            # Apply negative marking if configured
            negative_marks = question.negative_marks if question.negative_marks else 0.0
            return False, -negative_marks
    
    def _normalize_answer(self, answer: Any) -> List[str]:
        """Normalize answer to list of strings for comparison"""
        if isinstance(answer, list):
            return [str(a).strip().upper() for a in answer]
        elif isinstance(answer, str):
            return [answer.strip().upper()]
        else:
            return [str(answer).strip().upper()]
    
    def _compare_answers(
        self,
        student_answer: List[str],
        correct_answer: List[str],
        question_type: QuestionType
    ) -> bool:
        """Compare student answer with correct answer"""
        
        if question_type == QuestionType.MULTIPLE_CHOICE:
            # For MCQ, check if sets are equal (order doesn't matter for multi-select)
            return set(student_answer) == set(correct_answer)
        
        elif question_type == QuestionType.TRUE_FALSE:
            # For true/false, simple equality check
            return student_answer[0] in correct_answer or correct_answer[0] in student_answer
        
        else:
            # For other types, exact match
            return student_answer == correct_answer
    
    def get_attempt_result(self, attempt: StudentAttempt) -> Dict[str, Any]:
        """Get detailed result for a graded attempt"""
        if attempt.status != AttemptStatus.GRADED:
            raise ValueError("Attempt must be graded to view results")
        
        answers = self.db.query(StudentAnswer).filter(
            StudentAnswer.attempt_id == attempt.id
        ).all()
        
        question_results = []
        for answer in answers:
            question = answer.question
            question_results.append({
                "question_id": question.id,
                "question_text": question.question_text,
                "question_type": question.question_type.value,
                "student_answer": answer.answer,
                "correct_answer": question.correct_answer if answer.is_correct is False else None,
                "is_correct": answer.is_correct,
                "marks": question.marks,
                "marks_awarded": answer.marks_awarded,
                "auto_graded": answer.auto_graded
            })
        
        return {
            "attempt_id": attempt.id,
            "exam_id": attempt.exam_id,
            "total_marks": attempt.total_marks,
            "marks_obtained": attempt.marks_obtained,
            "percentage": attempt.percentage,
            "is_passed": attempt.is_passed,
            "status": attempt.status.value,
            "questions": question_results
        }
