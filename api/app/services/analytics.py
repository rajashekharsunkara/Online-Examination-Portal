"""
Grading Analytics Service

Provides statistical analysis of exam performance:
- Question-level: difficulty index, discrimination index
- Attempt-level: time distribution, score distribution
- Exam-level: average, median, percentiles, pass rate
"""

from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from statistics import mean, median, stdev
import math

from app.models.exam import Exam, Question
from app.models.attempt import StudentAttempt, StudentAnswer
from app.models.rubric import GradingFeedback


class AnalyticsService:
    """Service for calculating grading analytics and statistics"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_question_statistics(self, question_id: int) -> Dict:
        """
        Calculate question-level statistics
        
        Difficulty Index: Percentage of students who answered correctly
        - 0.0 to 0.3: Difficult question
        - 0.3 to 0.7: Moderate difficulty
        - 0.7 to 1.0: Easy question
        
        Discrimination Index: How well the question differentiates high/low performers
        - Uses point-biserial correlation between question score and total score
        - Range: -1.0 to 1.0
        - > 0.3: Good discrimination
        - 0.1 to 0.3: Fair discrimination
        - < 0.1: Poor discrimination (or negative: problematic)
        """
        # Get all answers for this question
        answers = self.db.query(StudentAnswer).filter(
            StudentAnswer.question_id == question_id,
            StudentAnswer.is_submitted == True
        ).all()
        
        if not answers:
            return {
                "question_id": question_id,
                "total_responses": 0,
                "difficulty_index": None,
                "discrimination_index": None,
                "average_score": None,
                "std_dev": None
            }
        
        # Get question max points
        question = self.db.query(Question).filter(Question.id == question_id).first()
        max_points = question.points if question else 0
        
        # Calculate difficulty index (percentage correct)
        correct_count = sum(1 for a in answers if a.is_correct)
        difficulty_index = correct_count / len(answers) if len(answers) > 0 else 0.0
        
        # Calculate average score and std dev
        scores = [a.points_awarded or 0 for a in answers]
        avg_score = mean(scores) if scores else 0.0
        std_dev_score = stdev(scores) if len(scores) > 1 else 0.0
        
        # Calculate discrimination index (point-biserial correlation)
        discrimination_index = self._calculate_discrimination_index(answers)
        
        return {
            "question_id": question_id,
            "total_responses": len(answers),
            "correct_responses": correct_count,
            "difficulty_index": round(difficulty_index, 3),
            "difficulty_category": self._categorize_difficulty(difficulty_index),
            "discrimination_index": round(discrimination_index, 3) if discrimination_index is not None else None,
            "discrimination_category": self._categorize_discrimination(discrimination_index),
            "average_score": round(avg_score, 2),
            "max_points": max_points,
            "std_dev": round(std_dev_score, 2),
            "score_distribution": self._get_score_distribution(scores, max_points)
        }
    
    def _calculate_discrimination_index(self, answers: List[StudentAnswer]) -> Optional[float]:
        """
        Calculate discrimination index using point-biserial correlation
        
        Compares performance on this question between:
        - Upper group (top 27% of overall exam scores)
        - Lower group (bottom 27% of overall exam scores)
        
        Formula: DI = (P_upper - P_lower) / max_points
        where P is the average score in each group
        """
        if len(answers) < 10:  # Need minimum sample size
            return None
        
        # Get total scores for each attempt
        attempt_scores = {}
        for answer in answers:
            attempt_id = answer.attempt_id
            if attempt_id not in attempt_scores:
                attempt = self.db.query(StudentAttempt).filter(
                    StudentAttempt.id == attempt_id
                ).first()
                attempt_scores[attempt_id] = attempt.total_score if attempt else 0
        
        # Sort by total score and get upper/lower 27%
        sorted_answers = sorted(answers, key=lambda a: attempt_scores.get(a.attempt_id, 0), reverse=True)
        cutoff = max(1, int(len(sorted_answers) * 0.27))
        
        upper_group = sorted_answers[:cutoff]
        lower_group = sorted_answers[-cutoff:]
        
        # Calculate average scores for each group
        upper_avg = mean([a.points_awarded or 0 for a in upper_group]) if upper_group else 0
        lower_avg = mean([a.points_awarded or 0 for a in lower_group]) if lower_group else 0
        
        # Get max points for normalization
        question = self.db.query(Question).filter(
            Question.id == answers[0].question_id
        ).first()
        max_points = question.points if question else 1
        
        # Normalized discrimination index
        discrimination = (upper_avg - lower_avg) / max_points if max_points > 0 else 0
        
        return discrimination
    
    def _categorize_difficulty(self, difficulty_index: float) -> str:
        """Categorize difficulty based on index value"""
        if difficulty_index < 0.3:
            return "Difficult"
        elif difficulty_index < 0.7:
            return "Moderate"
        else:
            return "Easy"
    
    def _categorize_discrimination(self, discrimination_index: Optional[float]) -> Optional[str]:
        """Categorize discrimination quality"""
        if discrimination_index is None:
            return None
        if discrimination_index < 0.1:
            return "Poor"
        elif discrimination_index < 0.3:
            return "Fair"
        else:
            return "Good"
    
    def _get_score_distribution(self, scores: List[float], max_points: float) -> Dict:
        """Get distribution of scores in bins"""
        if not scores or max_points == 0:
            return {}
        
        # Create bins (0-25%, 25-50%, 50-75%, 75-100%)
        bins = {"0-25%": 0, "25-50%": 0, "50-75%": 0, "75-100%": 0}
        
        for score in scores:
            percentage = (score / max_points) * 100
            if percentage < 25:
                bins["0-25%"] += 1
            elif percentage < 50:
                bins["25-50%"] += 1
            elif percentage < 75:
                bins["50-75%"] += 1
            else:
                bins["75-100%"] += 1
        
        return bins
    
    def get_exam_statistics(self, exam_id: int) -> Dict:
        """
        Calculate exam-level statistics across all submitted attempts
        """
        # Get all submitted attempts
        attempts = self.db.query(StudentAttempt).filter(
            StudentAttempt.exam_id == exam_id,
            StudentAttempt.status == "submitted"
        ).all()
        
        if not attempts:
            return {
                "exam_id": exam_id,
                "total_attempts": 0,
                "average_score": None,
                "median_score": None,
                "std_dev": None,
                "min_score": None,
                "max_score": None,
                "pass_rate": None,
                "percentiles": {}
            }
        
        scores = [a.total_score or 0 for a in attempts]
        
        # Get exam details
        exam = self.db.query(Exam).filter(Exam.id == exam_id).first()
        total_points = exam.total_points if exam else 100
        passing_score = exam.passing_score if exam else (total_points * 0.6)
        
        # Calculate pass rate
        passed_count = sum(1 for s in scores if s >= passing_score)
        pass_rate = (passed_count / len(scores)) * 100 if scores else 0
        
        # Calculate percentiles
        sorted_scores = sorted(scores)
        percentiles = {}
        for p in [10, 25, 50, 75, 90]:
            index = int((p / 100) * len(sorted_scores))
            index = min(index, len(sorted_scores) - 1)
            percentiles[f"p{p}"] = round(sorted_scores[index], 2)
        
        return {
            "exam_id": exam_id,
            "total_attempts": len(attempts),
            "average_score": round(mean(scores), 2),
            "median_score": round(median(scores), 2),
            "std_dev": round(stdev(scores), 2) if len(scores) > 1 else 0.0,
            "min_score": round(min(scores), 2),
            "max_score": round(max(scores), 2),
            "total_points": total_points,
            "passing_score": passing_score,
            "passed_count": passed_count,
            "failed_count": len(scores) - passed_count,
            "pass_rate": round(pass_rate, 2),
            "percentiles": percentiles,
            "score_distribution": self._get_exam_score_distribution(scores, total_points)
        }
    
    def _get_exam_score_distribution(self, scores: List[float], total_points: float) -> Dict:
        """Get distribution of exam scores by grade"""
        if not scores or total_points == 0:
            return {}
        
        distribution = {
            "A (90-100%)": 0,
            "B (80-89%)": 0,
            "C (70-79%)": 0,
            "D (60-69%)": 0,
            "F (<60%)": 0
        }
        
        for score in scores:
            percentage = (score / total_points) * 100
            if percentage >= 90:
                distribution["A (90-100%)"] += 1
            elif percentage >= 80:
                distribution["B (80-89%)"] += 1
            elif percentage >= 70:
                distribution["C (70-79%)"] += 1
            elif percentage >= 60:
                distribution["D (60-69%)"] += 1
            else:
                distribution["F (<60%)"] += 1
        
        return distribution
    
    def get_attempt_analytics(self, attempt_id: int) -> Dict:
        """
        Calculate analytics for a specific attempt
        """
        attempt = self.db.query(StudentAttempt).filter(
            StudentAttempt.id == attempt_id
        ).first()
        
        if not attempt:
            return {"error": "Attempt not found"}
        
        # Get all answers with timing
        answers = self.db.query(StudentAnswer).filter(
            StudentAnswer.attempt_id == attempt_id
        ).all()
        
        # Calculate time distribution
        time_spent = {}
        for answer in answers:
            if answer.time_spent:
                question_id = answer.question_id
                time_spent[question_id] = answer.time_spent
        
        # Get exam statistics for comparison
        exam_stats = self.get_exam_statistics(attempt.exam_id)
        
        # Calculate percentile rank
        percentile_rank = self._calculate_percentile_rank(
            attempt.total_score or 0,
            attempt.exam_id
        )
        
        return {
            "attempt_id": attempt_id,
            "total_score": attempt.total_score,
            "percentile_rank": percentile_rank,
            "total_time_seconds": attempt.total_time_seconds,
            "questions_answered": len([a for a in answers if a.answer_text or a.selected_options]),
            "questions_correct": len([a for a in answers if a.is_correct]),
            "time_per_question": time_spent,
            "average_time_per_question": round(mean(time_spent.values()), 2) if time_spent else 0,
            "comparison_to_average": {
                "score_diff": round((attempt.total_score or 0) - exam_stats.get("average_score", 0), 2),
                "above_average": (attempt.total_score or 0) > exam_stats.get("average_score", 0)
            }
        }
    
    def _calculate_percentile_rank(self, score: float, exam_id: int) -> float:
        """Calculate what percentile this score falls into"""
        # Get all scores for this exam
        all_scores = self.db.query(StudentAttempt.total_score).filter(
            StudentAttempt.exam_id == exam_id,
            StudentAttempt.status == "submitted",
            StudentAttempt.total_score.isnot(None)
        ).all()
        
        scores = [s[0] for s in all_scores]
        
        if not scores:
            return 0.0
        
        # Count how many scores are below this score
        below_count = sum(1 for s in scores if s < score)
        
        # Percentile = (count below / total count) * 100
        percentile = (below_count / len(scores)) * 100
        
        return round(percentile, 1)
