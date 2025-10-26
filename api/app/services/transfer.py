"""
Transfer Service
Handles workstation transfer validation and state migration
Broadcasts WebSocket notifications for transfer events
"""

import hashlib
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.attempt import StudentAttempt, AttemptStatus, StudentAnswer
from app.models.transfer import Transfer, TransferStatus
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.websocket import (
    create_transfer_requested,
    create_transfer_approved,
    create_transfer_rejected,
    create_transfer_completed
)


class TransferError(Exception):
    """Custom exception for transfer validation errors"""
    pass


class TransferService:
    """Service for managing workstation transfers"""
    
    MIN_TIME_REMAINING_MINUTES = 5  # Minimum time remaining to allow transfer
    
    @staticmethod
    def validate_transfer_request(
        db: Session,
        attempt_id: int,
        to_workstation: str,
        user: User
    ) -> tuple[StudentAttempt, str]:
        """
        Validate transfer request and return attempt and from_workstation
        
        Raises:
            TransferError: If validation fails
        """
        # Get attempt
        attempt = db.query(StudentAttempt).filter(StudentAttempt.id == attempt_id).first()
        if not attempt:
            raise TransferError(f"Attempt {attempt_id} not found")
        
        # Verify attempt is in progress
        if attempt.status != AttemptStatus.IN_PROGRESS:
            raise TransferError(f"Attempt must be in_progress, current status: {attempt.status}")
        
        # Verify attempt is not expired
        if attempt.is_expired():
            raise TransferError("Attempt has expired")
        
        # Check minimum time remaining
        time_remaining = attempt.get_time_remaining_seconds()
        if time_remaining < TransferService.MIN_TIME_REMAINING_MINUTES * 60:
            raise TransferError(
                f"Insufficient time remaining for transfer. "
                f"Minimum {TransferService.MIN_TIME_REMAINING_MINUTES} minutes required."
            )
        
        # Verify user has permission (student owns attempt or user is technician/hall staff)
        is_owner = attempt.student_id == user.id
        is_staff = any(role.name in ['technician', 'hall_in_charge', 'hall_auth'] for role in user.roles)
        
        if not (is_owner or is_staff):
            raise TransferError("User not authorized to request transfer for this attempt")
        
        # Check for pending transfers
        pending_transfer = db.query(Transfer).filter(
            and_(
                Transfer.attempt_id == attempt_id,
                Transfer.status == TransferStatus.PENDING
            )
        ).first()
        
        if pending_transfer:
            raise TransferError(f"Transfer already pending (Transfer ID: {pending_transfer.id})")
        
        # Check for in-progress transfers
        in_progress_transfer = db.query(Transfer).filter(
            and_(
                Transfer.attempt_id == attempt_id,
                Transfer.status == TransferStatus.APPROVED
            )
        ).first()
        
        if in_progress_transfer:
            raise TransferError(f"Transfer already in progress (Transfer ID: {in_progress_transfer.id})")
        
        # Get current workstation
        from_workstation = attempt.workstation_id or "UNKNOWN"
        
        # Verify target workstation is different
        if from_workstation == to_workstation:
            raise TransferError("Target workstation must be different from current workstation")
        
        return attempt, from_workstation
    
    @staticmethod
    async def create_transfer_request(
        db: Session,
        attempt_id: int,
        to_workstation: str,
        reason: str,
        user: User,
        connection_manager: Optional[Any] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Transfer:
        """
        Create a transfer request
        
        Raises:
            TransferError: If validation fails
        """
        # Validate
        attempt, from_workstation = TransferService.validate_transfer_request(
            db, attempt_id, to_workstation, user
        )
        
        # Create transfer record
        transfer = Transfer(
            attempt_id=attempt_id,
            from_workstation=from_workstation,
            to_workstation=to_workstation,
            requested_by_id=user.id,
            status=TransferStatus.PENDING,
            reason=reason
        )
        
        db.add(transfer)
        db.flush()  # Get transfer ID
        
        # Create audit log
        audit_log = AuditLog(
            event_type="transfer_requested",
            event_category="transfer",
            user_id=user.id,
            username=user.username,
            attempt_id=attempt_id,
            exam_id=attempt.exam_id,
            transfer_id=transfer.id,
            description=f"Transfer requested from {from_workstation} to {to_workstation}",
            details={
                "from_workstation": from_workstation,
                "to_workstation": to_workstation,
                "reason": reason,
                "time_remaining_seconds": attempt.get_time_remaining_seconds()
            },
            ip_address=ip_address,
            user_agent=user_agent,
            success=True
        )
        
        db.add(audit_log)
        db.commit()
        db.refresh(transfer)
        
        # Broadcast transfer requested event
        if connection_manager:
            message = create_transfer_requested(
                transfer_id=transfer.id,
                attempt_id=attempt_id,
                from_workstation=from_workstation,
                to_workstation=to_workstation,
                reason=reason,
                requested_by=user.username
            )
            # Notify student and hall dashboard
            await connection_manager.broadcast_to_attempt(message, attempt_id)
        
        return transfer
    
    @staticmethod
    async def approve_transfer(
        db: Session,
        transfer_id: int,
        approver: User,
        connection_manager: Optional[Any] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Transfer:
        """
        Approve a transfer request and initiate state migration
        
        Raises:
            TransferError: If validation fails or migration fails
        """
        # Get transfer
        transfer = db.query(Transfer).filter(Transfer.id == transfer_id).first()
        if not transfer:
            raise TransferError(f"Transfer {transfer_id} not found")
        
        # Verify transfer is pending
        if transfer.status != TransferStatus.PENDING:
            raise TransferError(f"Transfer must be pending, current status: {transfer.status}")
        
        # Verify approver has permission (hall_in_charge)
        is_hall_in_charge = any(role.name == 'hall_in_charge' for role in approver.roles)
        if not is_hall_in_charge:
            raise TransferError("Only hall in-charge can approve transfers")
        
        # Update transfer status
        transfer.status = TransferStatus.APPROVED
        transfer.approved_by_id = approver.id
        transfer.approved_at = datetime.utcnow()
        
        # Create audit log for approval
        audit_log = AuditLog(
            event_type="transfer_approved",
            event_category="transfer",
            user_id=approver.id,
            username=approver.username,
            attempt_id=transfer.attempt_id,
            transfer_id=transfer.id,
            description=f"Transfer approved by {approver.username}",
            details={
                "from_workstation": transfer.from_workstation,
                "to_workstation": transfer.to_workstation
            },
            ip_address=ip_address,
            user_agent=user_agent,
            success=True
        )
        
        db.add(audit_log)
        db.commit()
        
        # Broadcast approval notification
        if connection_manager:
            message = create_transfer_approved(
                transfer_id=transfer.id,
                attempt_id=transfer.attempt_id,
                from_workstation=transfer.from_workstation,
                to_workstation=transfer.to_workstation,
                approved_by=approver.username
            )
            # Notify source workstation to lock UI
            await connection_manager.broadcast_to_attempt(message, transfer.attempt_id)
        
        # Perform state migration
        try:
            await TransferService.migrate_attempt_state(
                db, transfer, migrator=approver, connection_manager=connection_manager,
                ip_address=ip_address, user_agent=user_agent
            )
        except Exception as e:
            # Mark transfer as failed
            transfer.status = TransferStatus.FAILED
            transfer.error_message = str(e)
            
            # Log failure
            failure_log = AuditLog(
                event_type="transfer_failed",
                event_category="transfer",
                user_id=approver.id,
                username=approver.username,
                attempt_id=transfer.attempt_id,
                transfer_id=transfer.id,
                description="Transfer state migration failed",
                details={"error": str(e)},
                ip_address=ip_address,
                user_agent=user_agent,
                success=False,
                error_message=str(e)
            )
            
            db.add(failure_log)
            db.commit()
            
            raise TransferError(f"State migration failed: {e}")
        
        db.refresh(transfer)
        return transfer
    
    @staticmethod
    async def reject_transfer(
        db: Session,
        transfer_id: int,
        rejector: User,
        reason: Optional[str] = None,
        connection_manager: Optional[Any] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Transfer:
        """
        Reject a transfer request
        
        Raises:
            TransferError: If validation fails
        """
        # Get transfer
        transfer = db.query(Transfer).filter(Transfer.id == transfer_id).first()
        if not transfer:
            raise TransferError(f"Transfer {transfer_id} not found")
        
        # Verify transfer is pending
        if transfer.status != TransferStatus.PENDING:
            raise TransferError(f"Transfer must be pending, current status: {transfer.status}")
        
        # Verify rejector has permission (hall_in_charge)
        is_hall_in_charge = any(role.name == 'hall_in_charge' for role in rejector.roles)
        if not is_hall_in_charge:
            raise TransferError("Only hall in-charge can reject transfers")
        
        # Update transfer status
        transfer.status = TransferStatus.REJECTED
        transfer.approved_by_id = rejector.id
        transfer.rejected_at = datetime.utcnow()
        if reason:
            transfer.error_message = reason
        
        # Create audit log
        audit_log = AuditLog(
            event_type="transfer_rejected",
            event_category="transfer",
            user_id=rejector.id,
            username=rejector.username,
            attempt_id=transfer.attempt_id,
            transfer_id=transfer.id,
            description=f"Transfer rejected by {rejector.username}",
            details={
                "from_workstation": transfer.from_workstation,
                "to_workstation": transfer.to_workstation,
                "reason": reason
            },
            ip_address=ip_address,
            user_agent=user_agent,
            success=True
        )
        
        db.add(audit_log)
        db.commit()
        db.refresh(transfer)
        
        # Broadcast transfer rejected event
        if connection_manager:
            message = create_transfer_rejected(
                transfer_id=transfer.id,
                attempt_id=transfer.attempt_id,
                reason=reason
            )
            # Notify student of rejection
            await connection_manager.broadcast_to_attempt(message, transfer.attempt_id)
        
        return transfer
    
    @staticmethod
    async def migrate_attempt_state(
        db: Session,
        transfer: Transfer,
        migrator: User,
        connection_manager: Optional[Any] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> None:
        """
        Migrate attempt state from source to target workstation
        
        This preserves:
        - All answers with sequences and flags
        - Current question index
        - Time spent
        - Question flags
        
        Raises:
            Exception: If migration fails
        """
        # Get attempt
        attempt = db.query(StudentAttempt).filter(StudentAttempt.id == transfer.attempt_id).first()
        if not attempt:
            raise Exception(f"Attempt {transfer.attempt_id} not found")
        
        # Gather state for migration
        state = {
            "attempt_id": attempt.id,
            "from_workstation": transfer.from_workstation,
            "to_workstation": transfer.to_workstation,
            "current_question_id": attempt.current_question_id,
            "questions_answered": attempt.questions_answered,
            "questions_flagged": attempt.questions_flagged,
            "time_remaining_seconds": attempt.get_time_remaining_seconds(),
            "answers": []
        }
        
        # Copy answers
        answers = db.query(StudentAnswer).filter(StudentAnswer.attempt_id == attempt.id).all()
        for answer in answers:
            state["answers"].append({
                "question_id": answer.question_id,
                "answer": answer.answer,
                "is_flagged": answer.is_flagged,
                "time_spent_seconds": answer.time_spent_seconds,
                "sequence": answer.sequence,
                "created_at": answer.created_at.isoformat() if answer.created_at else None,
                "updated_at": answer.updated_at.isoformat() if answer.updated_at else None
            })
        
        # Generate migration checksum (SHA-256 of state JSON)
        state_json = json.dumps(state, sort_keys=True)
        checksum = hashlib.sha256(state_json.encode()).hexdigest()
        
        # Update attempt workstation
        attempt.workstation_id = transfer.to_workstation
        attempt.transfer_count = (attempt.transfer_count or 0) + 1
        attempt.time_remaining_seconds = state["time_remaining_seconds"]  # Snapshot time
        attempt.last_activity_time = datetime.utcnow()
        
        # Update transfer record
        transfer.migration_checksum = checksum
        transfer.answers_transferred = len(answers)
        transfer.status = TransferStatus.COMPLETED
        transfer.completed_at = datetime.utcnow()
        
        # Create audit log
        audit_log = AuditLog(
            event_type="transfer_completed",
            event_category="transfer",
            user_id=migrator.id,
            username=migrator.username,
            attempt_id=attempt.id,
            exam_id=attempt.exam_id,
            transfer_id=transfer.id,
            description=f"Attempt state migrated from {transfer.from_workstation} to {transfer.to_workstation}",
            details={
                "from_workstation": transfer.from_workstation,
                "to_workstation": transfer.to_workstation,
                "migration_checksum": checksum,
                "answers_transferred": len(answers),
                "time_remaining_seconds": state["time_remaining_seconds"]
            },
            ip_address=ip_address,
            user_agent=user_agent,
            success=True
        )
        
        db.add(audit_log)
        db.commit()
        db.refresh(transfer)
        
        # Broadcast transfer completed event
        if connection_manager:
            message = create_transfer_completed(
                transfer_id=transfer.id,
                attempt_id=attempt.id,
                from_workstation=transfer.from_workstation,
                to_workstation=transfer.to_workstation,
                migration_checksum=checksum,
                answers_transferred=len(answers)
            )
            # Notify target workstation to unlock and resume
            await connection_manager.broadcast_to_attempt(message, attempt.id)
