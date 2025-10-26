"""
Checkpoint Processing Service
Handles real-time answer checkpointing with debouncing and validation
"""
import asyncio
from typing import Dict, Optional, Any
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging

from app.models.attempt import StudentAttempt, StudentAnswer, AttemptStatus
from app.models.exam import Question
from app.schemas.websocket import CheckpointRequest

logger = logging.getLogger(__name__)


class CheckpointService:
    """
    Service for processing answer checkpoints
    Supports debouncing, validation, and atomic updates
    """
    
    def __init__(self, debounce_seconds: int = 2):
        """
        Initialize checkpoint service
        
        Args:
            debounce_seconds: Minimum time between saves for same question
        """
        self.debounce_seconds = debounce_seconds
        
        # Debounce tracking: {(attempt_id, question_id): last_save_time}
        self._last_save_times: Dict[tuple, datetime] = {}
        
        # Pending saves: {(attempt_id, question_id): (task, checkpoint_data)}
        self._pending_saves: Dict[tuple, tuple] = {}
    
    async def process_checkpoint(
        self,
        db: AsyncSession,
        attempt_id: int,
        checkpoint: CheckpointRequest
    ) -> Dict[str, Any]:
        """
        Process an answer checkpoint with debouncing
        
        Args:
            db: Database session
            attempt_id: Student attempt ID
            checkpoint: Checkpoint request data
            
        Returns:
            Result dictionary with success status and metadata
        """
        key = (attempt_id, checkpoint.question_id)
        
        # Check debounce
        now = datetime.utcnow()
        last_save = self._last_save_times.get(key)
        
        if last_save:
            time_since_last = (now - last_save).total_seconds()
            if time_since_last < self.debounce_seconds:
                # Cancel pending save and replace with new one
                if key in self._pending_saves:
                    task, _ = self._pending_saves[key]
                    task.cancel()
                
                # Schedule debounced save
                delay = self.debounce_seconds - time_since_last
                task = asyncio.create_task(
                    self._debounced_save(db, attempt_id, checkpoint, delay)
                )
                self._pending_saves[key] = (task, checkpoint)
                
                return {
                    "success": True,
                    "debounced": True,
                    "delay_seconds": delay
                }
        
        # Immediate save
        result = await self._save_checkpoint(db, attempt_id, checkpoint)
        self._last_save_times[key] = now
        
        return result
    
    async def _debounced_save(
        self,
        db: AsyncSession,
        attempt_id: int,
        checkpoint: CheckpointRequest,
        delay: float
    ) -> Dict[str, Any]:
        """
        Execute a debounced save after delay
        
        Args:
            db: Database session
            attempt_id: Student attempt ID
            checkpoint: Checkpoint data
            delay: Delay in seconds
            
        Returns:
            Save result
        """
        try:
            await asyncio.sleep(delay)
            
            key = (attempt_id, checkpoint.question_id)
            result = await self._save_checkpoint(db, attempt_id, checkpoint)
            
            # Clean up
            self._last_save_times[key] = datetime.utcnow()
            if key in self._pending_saves:
                del self._pending_saves[key]
            
            return result
            
        except asyncio.CancelledError:
            logger.debug(f"Debounced save cancelled for attempt {attempt_id}, question {checkpoint.question_id}")
            raise
    
    async def _save_checkpoint(
        self,
        db: AsyncSession,
        attempt_id: int,
        checkpoint: CheckpointRequest
    ) -> Dict[str, Any]:
        """
        Save checkpoint to database
        
        Args:
            db: Database session
            attempt_id: Student attempt ID
            checkpoint: Checkpoint data
            
        Returns:
            Result dictionary
        """
        try:
            # Validate attempt
            attempt_result = await db.execute(
                select(StudentAttempt).where(StudentAttempt.id == attempt_id)
            )
            attempt = attempt_result.scalar_one_or_none()
            
            if not attempt:
                return {
                    "success": False,
                    "error": "Attempt not found",
                    "error_code": "ATTEMPT_NOT_FOUND"
                }
            
            # Check if attempt is active
            if attempt.status != AttemptStatus.IN_PROGRESS:
                return {
                    "success": False,
                    "error": f"Attempt is {attempt.status}, cannot save checkpoint",
                    "error_code": "ATTEMPT_NOT_ACTIVE"
                }
            
            # Check time expiry
            if attempt.is_expired():
                return {
                    "success": False,
                    "error": "Attempt time expired",
                    "error_code": "TIME_EXPIRED"
                }
            
            # Validate question belongs to exam
            question_result = await db.execute(
                select(Question)
                .join(Question.exam_questions)
                .where(
                    Question.id == checkpoint.question_id,
                    Question.exam_questions.any(exam_id=attempt.exam_id)
                )
            )
            question = question_result.scalar_one_or_none()
            
            if not question:
                return {
                    "success": False,
                    "error": "Question not found in this exam",
                    "error_code": "INVALID_QUESTION"
                }
            
            # Check for existing answer
            existing_answer_result = await db.execute(
                select(StudentAnswer).where(
                    StudentAnswer.attempt_id == attempt_id,
                    StudentAnswer.question_id == checkpoint.question_id
                )
            )
            existing_answer = existing_answer_result.scalar_one_or_none()
            
            if existing_answer:
                # Update existing answer
                existing_answer.answer = checkpoint.answer
                existing_answer.is_flagged = checkpoint.is_flagged
                existing_answer.time_spent_seconds += checkpoint.time_spent_seconds
                existing_answer.answer_sequence = checkpoint.sequence
                existing_answer.last_updated_at = datetime.utcnow()
                
                if not existing_answer.first_answered_at:
                    existing_answer.first_answered_at = datetime.utcnow()
                
                answer = existing_answer
            else:
                # Create new answer
                answer = StudentAnswer(
                    attempt_id=attempt_id,
                    question_id=checkpoint.question_id,
                    answer=checkpoint.answer,
                    is_flagged=checkpoint.is_flagged,
                    time_spent_seconds=checkpoint.time_spent_seconds,
                    answer_sequence=checkpoint.sequence,
                    first_answered_at=datetime.utcnow()
                )
                db.add(answer)
                
                # Increment questions_answered if this is a new answer
                attempt.questions_answered += 1
            
            # Update attempt metadata
            attempt.last_activity_time = datetime.utcnow()
            attempt.current_question_id = checkpoint.question_id
            
            # Update flagged questions list
            if checkpoint.is_flagged:
                if checkpoint.question_id not in (attempt.questions_flagged or []):
                    flagged = attempt.questions_flagged or []
                    flagged.append(checkpoint.question_id)
                    attempt.questions_flagged = flagged
            else:
                # Remove from flagged if unflagged
                if attempt.questions_flagged and checkpoint.question_id in attempt.questions_flagged:
                    flagged = attempt.questions_flagged.copy()
                    flagged.remove(checkpoint.question_id)
                    attempt.questions_flagged = flagged
            
            await db.commit()
            await db.refresh(answer)
            await db.refresh(attempt)
            
            return {
                "success": True,
                "answer_id": answer.id,
                "sequence": answer.answer_sequence,
                "saved_at": answer.last_updated_at,
                "time_remaining_seconds": attempt.get_time_remaining_seconds(),
                "questions_answered": attempt.questions_answered
            }
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Error saving checkpoint for attempt {attempt_id}: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_code": "CHECKPOINT_SAVE_ERROR"
            }
    
    async def flush_pending(self) -> int:
        """
        Flush all pending checkpoint saves immediately
        
        Returns:
            Number of pending saves flushed
        """
        pending_count = len(self._pending_saves)
        
        for (attempt_id, question_id), (task, checkpoint) in list(self._pending_saves.items()):
            if not task.done():
                task.cancel()
        
        self._pending_saves.clear()
        
        logger.info(f"Flushed {pending_count} pending checkpoint saves")
        return pending_count
    
    def get_pending_count(self) -> int:
        """Get count of pending saves"""
        return len(self._pending_saves)


# Singleton instance
checkpoint_service = CheckpointService()
