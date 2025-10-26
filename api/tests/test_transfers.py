"""
Transfer Tests
Tests for workstation transfer validation, state migration, RBAC, and WebSocket notifications
"""
import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException

from app.models.user import User, Role
from app.models.exam import Exam
from app.models.attempt import StudentAttempt, AttemptStatus, StudentAnswer
from app.models.transfer import Transfer, TransferStatus
from app.models.audit_log import AuditLog
from app.services.transfer import TransferService, TransferError


# ========================================
# Validation Tests
# ========================================

class TestTransferValidation:
    """Test transfer request validation logic"""
    
    def test_validate_attempt_not_found(self, db_session, test_user):
        """Reject if attempt doesn't exist"""
        with pytest.raises(TransferError, match="Attempt .* not found"):
            TransferService.validate_transfer_request(
                db=db_session,
                attempt_id=99999,
                to_workstation="WS-205",
                user=test_user
            )
    
    def test_validate_attempt_not_in_progress(self, db_session, test_user, test_exam, test_attempt):
        """Reject if attempt is not in_progress"""
        # Set attempt to completed
        test_attempt.status = AttemptStatus.COMPLETED
        test_attempt.completed_at = datetime.utcnow()
        db_session.commit()
        
        with pytest.raises(TransferError, match="must be in_progress"):
            TransferService.validate_transfer_request(
                db=db_session,
                attempt_id=test_attempt.id,
                to_workstation="WS-205",
                user=test_user
            )
    
    def test_validate_attempt_expired(self, db_session, test_user, test_exam, test_attempt):
        """Reject if attempt has expired"""
        # Set attempt to expired
        test_attempt.started_at = datetime.utcnow() - timedelta(hours=3)
        test_exam.duration_minutes = 120  # 2 hours
        db_session.commit()
        
        with pytest.raises(TransferError, match="has expired"):
            TransferService.validate_transfer_request(
                db=db_session,
                attempt_id=test_attempt.id,
                to_workstation="WS-205",
                user=test_user
            )
    
    def test_validate_insufficient_time_remaining(self, db_session, test_user, test_exam, test_attempt):
        """Reject if time remaining < 5 minutes"""
        # Set time to 3 minutes remaining
        test_attempt.started_at = datetime.utcnow() - timedelta(minutes=57)
        test_exam.duration_minutes = 60
        db_session.commit()
        
        with pytest.raises(TransferError, match="Insufficient time remaining"):
            TransferService.validate_transfer_request(
                db=db_session,
                attempt_id=test_attempt.id,
                to_workstation="WS-205",
                user=test_user
            )
    
    def test_validate_user_not_owner_not_staff(self, db_session, test_exam, test_attempt):
        """Reject if user doesn't own attempt and is not staff"""
        # Create another student user
        other_student = User(
            email="other@example.com",
            username="other_student",
            hashed_password="hashed",
            full_name="Other Student",
            is_active=True
        )
        student_role = db_session.query(Role).filter(Role.name == "student").first()
        other_student.roles.append(student_role)
        db_session.add(other_student)
        db_session.commit()
        
        with pytest.raises(TransferError, match="not authorized"):
            TransferService.validate_transfer_request(
                db=db_session,
                attempt_id=test_attempt.id,
                to_workstation="WS-205",
                user=other_student
            )
    
    def test_validate_pending_transfer_exists(self, db_session, test_user, test_exam, test_attempt):
        """Reject if pending transfer already exists"""
        # Create pending transfer
        existing_transfer = Transfer(
            attempt_id=test_attempt.id,
            from_workstation="WS-101",
            to_workstation="WS-202",
            requested_by_id=test_user.id,
            status=TransferStatus.PENDING,
            reason="Hardware issue"
        )
        db_session.add(existing_transfer)
        db_session.commit()
        
        with pytest.raises(TransferError, match="Transfer already pending"):
            TransferService.validate_transfer_request(
                db=db_session,
                attempt_id=test_attempt.id,
                to_workstation="WS-205",
                user=test_user
            )
    
    def test_validate_approved_transfer_in_progress(self, db_session, test_user, test_exam, test_attempt):
        """Reject if approved transfer is in progress"""
        # Create approved transfer
        existing_transfer = Transfer(
            attempt_id=test_attempt.id,
            from_workstation="WS-101",
            to_workstation="WS-202",
            requested_by_id=test_user.id,
            status=TransferStatus.APPROVED,
            reason="Hardware issue",
            approved_at=datetime.utcnow()
        )
        db_session.add(existing_transfer)
        db_session.commit()
        
        with pytest.raises(TransferError, match="Transfer already in progress"):
            TransferService.validate_transfer_request(
                db=db_session,
                attempt_id=test_attempt.id,
                to_workstation="WS-205",
                user=test_user
            )
    
    def test_validate_same_workstation(self, db_session, test_user, test_exam, test_attempt):
        """Reject if from_workstation == to_workstation"""
        test_attempt.workstation_id = "WS-101"
        db_session.commit()
        
        with pytest.raises(TransferError, match="must be different"):
            TransferService.validate_transfer_request(
                db=db_session,
                attempt_id=test_attempt.id,
                to_workstation="WS-101",
                user=test_user
            )
    
    def test_validate_success_student_owns_attempt(self, db_session, test_user, test_exam, test_attempt):
        """Accept valid request from attempt owner"""
        attempt, from_workstation = TransferService.validate_transfer_request(
            db=db_session,
            attempt_id=test_attempt.id,
            to_workstation="WS-205",
            user=test_user
        )
        
        assert attempt.id == test_attempt.id
        assert from_workstation == test_attempt.workstation_id
    
    def test_validate_success_technician_any_attempt(self, db_session, test_exam, test_attempt):
        """Accept valid request from technician for any attempt"""
        # Create technician user
        technician = User(
            email="tech@example.com",
            username="technician",
            hashed_password="hashed",
            full_name="Technician User",
            is_active=True
        )
        tech_role = db_session.query(Role).filter(Role.name == "technician").first()
        technician.roles.append(tech_role)
        db_session.add(technician)
        db_session.commit()
        
        attempt, from_workstation = TransferService.validate_transfer_request(
            db=db_session,
            attempt_id=test_attempt.id,
            to_workstation="WS-205",
            user=technician
        )
        
        assert attempt.id == test_attempt.id


# ========================================
# Transfer Request Tests
# ========================================

class TestTransferRequest:
    """Test transfer request creation"""
    
    @pytest.mark.asyncio
    async def test_create_transfer_request_success(self, db_session, test_user, test_exam, test_attempt):
        """Successfully create transfer request"""
        mock_connection_manager = AsyncMock()
        
        transfer = await TransferService.create_transfer_request(
            db=db_session,
            attempt_id=test_attempt.id,
            to_workstation="WS-205",
            reason="Computer screen flickering, unable to read questions",
            user=test_user,
            connection_manager=mock_connection_manager,
            ip_address="192.168.1.50",
            user_agent="Mozilla/5.0"
        )
        
        # Verify transfer created
        assert transfer.id is not None
        assert transfer.attempt_id == test_attempt.id
        assert transfer.from_workstation == test_attempt.workstation_id
        assert transfer.to_workstation == "WS-205"
        assert transfer.requested_by_id == test_user.id
        assert transfer.status == TransferStatus.PENDING
        assert "flickering" in transfer.reason
        
        # Verify audit log created
        audit_log = db_session.query(AuditLog).filter(
            AuditLog.transfer_id == transfer.id,
            AuditLog.event_type == "transfer_requested"
        ).first()
        assert audit_log is not None
        assert audit_log.user_id == test_user.id
        assert audit_log.ip_address == "192.168.1.50"
        assert audit_log.success == 1
        
        # Verify WebSocket broadcast called
        mock_connection_manager.broadcast_to_attempt.assert_called_once()
        call_args = mock_connection_manager.broadcast_to_attempt.call_args
        message = call_args[0][0]
        attempt_id = call_args[0][1]
        
        assert message["type"] == "transfer_requested"
        assert message["transfer_id"] == transfer.id
        assert attempt_id == test_attempt.id
    
    @pytest.mark.asyncio
    async def test_create_transfer_request_without_connection_manager(self, db_session, test_user, test_exam, test_attempt):
        """Create transfer request without WebSocket manager (no error)"""
        transfer = await TransferService.create_transfer_request(
            db=db_session,
            attempt_id=test_attempt.id,
            to_workstation="WS-205",
            reason="Hardware issue requiring immediate transfer",
            user=test_user,
            connection_manager=None
        )
        
        assert transfer.status == TransferStatus.PENDING


# ========================================
# Transfer Approval Tests
# ========================================

class TestTransferApproval:
    """Test transfer approval and rejection"""
    
    @pytest.mark.asyncio
    async def test_approve_transfer_success(self, db_session, test_user, test_exam, test_attempt, test_hall_in_charge):
        """Successfully approve transfer and migrate state"""
        # Create pending transfer
        transfer = Transfer(
            attempt_id=test_attempt.id,
            from_workstation="WS-101",
            to_workstation="WS-205",
            requested_by_id=test_user.id,
            status=TransferStatus.PENDING,
            reason="Hardware issue"
        )
        db_session.add(transfer)
        db_session.commit()
        
        # Create some answers
        for i in range(3):
            answer = StudentAnswer(
                attempt_id=test_attempt.id,
                question_id=i + 1,
                answer={"selected": f"Option {i+1}"},
                is_flagged=(i == 1),
                time_spent_seconds=45 + i * 10,
                sequence=1
            )
            db_session.add(answer)
        db_session.commit()
        
        mock_connection_manager = AsyncMock()
        
        # Approve transfer
        approved_transfer = await TransferService.approve_transfer(
            db=db_session,
            transfer_id=transfer.id,
            approver=test_hall_in_charge,
            connection_manager=mock_connection_manager,
            ip_address="192.168.1.100",
            user_agent="Admin Browser"
        )
        
        # Verify transfer approved and completed
        assert approved_transfer.status == TransferStatus.COMPLETED
        assert approved_transfer.approved_by_id == test_hall_in_charge.id
        assert approved_transfer.approved_at is not None
        assert approved_transfer.completed_at is not None
        assert approved_transfer.migration_checksum is not None
        assert len(approved_transfer.migration_checksum) == 64  # SHA-256 hex
        assert approved_transfer.answers_transferred == 3
        
        # Verify attempt updated
        db_session.refresh(test_attempt)
        assert test_attempt.workstation_id == "WS-205"
        assert test_attempt.transfer_count == 1
        
        # Verify audit logs
        approval_log = db_session.query(AuditLog).filter(
            AuditLog.transfer_id == transfer.id,
            AuditLog.event_type == "transfer_approved"
        ).first()
        assert approval_log is not None
        
        completion_log = db_session.query(AuditLog).filter(
            AuditLog.transfer_id == transfer.id,
            AuditLog.event_type == "transfer_completed"
        ).first()
        assert completion_log is not None
        assert completion_log.success == 1
        
        # Verify WebSocket broadcasts (approved + completed)
        assert mock_connection_manager.broadcast_to_attempt.call_count == 2
    
    @pytest.mark.asyncio
    async def test_reject_transfer_success(self, db_session, test_user, test_exam, test_attempt, test_hall_in_charge):
        """Successfully reject transfer"""
        # Create pending transfer
        transfer = Transfer(
            attempt_id=test_attempt.id,
            from_workstation="WS-101",
            to_workstation="WS-205",
            requested_by_id=test_user.id,
            status=TransferStatus.PENDING,
            reason="Minor issue"
        )
        db_session.add(transfer)
        db_session.commit()
        
        mock_connection_manager = AsyncMock()
        
        # Reject transfer
        rejected_transfer = await TransferService.reject_transfer(
            db=db_session,
            transfer_id=transfer.id,
            rejector=test_hall_in_charge,
            reason="Insufficient justification for transfer",
            connection_manager=mock_connection_manager
        )
        
        # Verify transfer rejected
        assert rejected_transfer.status == TransferStatus.REJECTED
        assert rejected_transfer.approved_by_id == test_hall_in_charge.id
        assert rejected_transfer.rejected_at is not None
        assert "Insufficient justification" in rejected_transfer.error_message
        
        # Verify audit log
        audit_log = db_session.query(AuditLog).filter(
            AuditLog.transfer_id == transfer.id,
            AuditLog.event_type == "transfer_rejected"
        ).first()
        assert audit_log is not None
        
        # Verify WebSocket broadcast
        mock_connection_manager.broadcast_to_attempt.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_approve_non_pending_transfer_fails(self, db_session, test_user, test_exam, test_attempt, test_hall_in_charge):
        """Reject approval of non-pending transfer"""
        # Create completed transfer
        transfer = Transfer(
            attempt_id=test_attempt.id,
            from_workstation="WS-101",
            to_workstation="WS-205",
            requested_by_id=test_user.id,
            status=TransferStatus.COMPLETED,
            reason="Already done"
        )
        db_session.add(transfer)
        db_session.commit()
        
        with pytest.raises(TransferError, match="must be pending"):
            await TransferService.approve_transfer(
                db=db_session,
                transfer_id=transfer.id,
                approver=test_hall_in_charge
            )
    
    @pytest.mark.asyncio
    async def test_approve_without_hall_in_charge_role_fails(self, db_session, test_user, test_exam, test_attempt):
        """Reject approval from non-hall_in_charge user"""
        # Create pending transfer
        transfer = Transfer(
            attempt_id=test_attempt.id,
            from_workstation="WS-101",
            to_workstation="WS-205",
            requested_by_id=test_user.id,
            status=TransferStatus.PENDING,
            reason="Issue"
        )
        db_session.add(transfer)
        db_session.commit()
        
        # Try to approve with student user (no hall_in_charge role)
        with pytest.raises(TransferError, match="Only hall in-charge"):
            await TransferService.approve_transfer(
                db=db_session,
                transfer_id=transfer.id,
                approver=test_user
            )


# ========================================
# State Migration Tests
# ========================================

class TestStateMigration:
    """Test attempt state migration integrity"""
    
    @pytest.mark.asyncio
    async def test_migrate_all_answers_copied(self, db_session, test_user, test_exam, test_attempt, test_hall_in_charge):
        """Verify all answers are copied correctly"""
        # Create pending transfer
        transfer = Transfer(
            attempt_id=test_attempt.id,
            from_workstation="WS-101",
            to_workstation="WS-205",
            requested_by_id=test_user.id,
            status=TransferStatus.APPROVED,
            reason="Issue"
        )
        db_session.add(transfer)
        db_session.commit()
        
        # Create answers with different properties
        answers_data = [
            {"question_id": 1, "answer": {"selected": "A"}, "is_flagged": False, "time_spent": 30, "seq": 1},
            {"question_id": 2, "answer": {"selected": "B"}, "is_flagged": True, "time_spent": 45, "seq": 2},
            {"question_id": 3, "answer": {"text": "My answer"}, "is_flagged": False, "time_spent": 120, "seq": 1},
            {"question_id": 4, "answer": {"selected": "D"}, "is_flagged": True, "time_spent": 60, "seq": 3},
        ]
        
        for data in answers_data:
            answer = StudentAnswer(
                attempt_id=test_attempt.id,
                question_id=data["question_id"],
                answer=data["answer"],
                is_flagged=data["is_flagged"],
                time_spent_seconds=data["time_spent"],
                sequence=data["seq"]
            )
            db_session.add(answer)
        db_session.commit()
        
        # Migrate state
        await TransferService.migrate_attempt_state(
            db=db_session,
            transfer=transfer,
            migrator=test_hall_in_charge
        )
        
        # Verify all answers still exist
        migrated_answers = db_session.query(StudentAnswer).filter(
            StudentAnswer.attempt_id == test_attempt.id
        ).all()
        
        assert len(migrated_answers) == 4
        
        # Verify properties preserved
        for original, migrated in zip(answers_data, migrated_answers):
            assert migrated.question_id == original["question_id"]
            assert migrated.answer == original["answer"]
            assert migrated.is_flagged == original["is_flagged"]
            assert migrated.time_spent_seconds == original["time_spent"]
            assert migrated.sequence == original["seq"]
    
    @pytest.mark.asyncio
    async def test_migrate_checksum_generation(self, db_session, test_user, test_exam, test_attempt, test_hall_in_charge):
        """Verify SHA-256 checksum is generated correctly"""
        transfer = Transfer(
            attempt_id=test_attempt.id,
            from_workstation="WS-101",
            to_workstation="WS-205",
            requested_by_id=test_user.id,
            status=TransferStatus.APPROVED,
            reason="Issue"
        )
        db_session.add(transfer)
        db_session.commit()
        
        await TransferService.migrate_attempt_state(
            db=db_session,
            transfer=transfer,
            migrator=test_hall_in_charge
        )
        
        db_session.refresh(transfer)
        
        # Verify checksum exists and is SHA-256 format (64 hex chars)
        assert transfer.migration_checksum is not None
        assert len(transfer.migration_checksum) == 64
        assert all(c in '0123456789abcdef' for c in transfer.migration_checksum)
    
    @pytest.mark.asyncio
    async def test_migrate_workstation_id_updated(self, db_session, test_user, test_exam, test_attempt, test_hall_in_charge):
        """Verify workstation_id is updated"""
        original_workstation = test_attempt.workstation_id
        
        transfer = Transfer(
            attempt_id=test_attempt.id,
            from_workstation=original_workstation,
            to_workstation="WS-999",
            requested_by_id=test_user.id,
            status=TransferStatus.APPROVED,
            reason="Issue"
        )
        db_session.add(transfer)
        db_session.commit()
        
        await TransferService.migrate_attempt_state(
            db=db_session,
            transfer=transfer,
            migrator=test_hall_in_charge
        )
        
        db_session.refresh(test_attempt)
        assert test_attempt.workstation_id == "WS-999"
    
    @pytest.mark.asyncio
    async def test_migrate_transfer_count_incremented(self, db_session, test_user, test_exam, test_attempt, test_hall_in_charge):
        """Verify transfer_count is incremented"""
        # Set initial transfer count
        test_attempt.transfer_count = 0
        db_session.commit()
        
        transfer = Transfer(
            attempt_id=test_attempt.id,
            from_workstation="WS-101",
            to_workstation="WS-205",
            requested_by_id=test_user.id,
            status=TransferStatus.APPROVED,
            reason="Issue"
        )
        db_session.add(transfer)
        db_session.commit()
        
        await TransferService.migrate_attempt_state(
            db=db_session,
            transfer=transfer,
            migrator=test_hall_in_charge
        )
        
        db_session.refresh(test_attempt)
        assert test_attempt.transfer_count == 1
        
        # Second transfer
        transfer2 = Transfer(
            attempt_id=test_attempt.id,
            from_workstation="WS-205",
            to_workstation="WS-301",
            requested_by_id=test_user.id,
            status=TransferStatus.APPROVED,
            reason="Another issue"
        )
        db_session.add(transfer2)
        db_session.commit()
        
        await TransferService.migrate_attempt_state(
            db=db_session,
            transfer=transfer2,
            migrator=test_hall_in_charge
        )
        
        db_session.refresh(test_attempt)
        assert test_attempt.transfer_count == 2


# ========================================
# API Endpoint Tests
# ========================================

class TestTransferAPI:
    """Test transfer REST API endpoints"""
    
    def test_request_transfer_success(self, client, auth_headers_student, test_attempt):
        """POST /transfers/request - Success"""
        response = client.post(
            "/api/v1/transfers/request",
            headers=auth_headers_student,
            json={
                "attempt_id": test_attempt.id,
                "to_workstation": "WS-205",
                "reason": "Computer screen flickering, unable to read questions clearly"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["attempt_id"] == test_attempt.id
        assert data["from_workstation"] == test_attempt.workstation_id
        assert data["to_workstation"] == "WS-205"
        assert data["status"] == "pending"
        assert "flickering" in data["reason"]
    
    def test_request_transfer_validation_failure(self, client, auth_headers_student, test_attempt):
        """POST /transfers/request - Validation error"""
        response = client.post(
            "/api/v1/transfers/request",
            headers=auth_headers_student,
            json={
                "attempt_id": test_attempt.id,
                "to_workstation": "WS-101",  # Same as current
                "reason": "Short"  # Too short (< 10 chars)
            }
        )
        
        assert response.status_code == 400
    
    def test_request_transfer_unauthorized(self, client, test_attempt):
        """POST /transfers/request - No auth"""
        response = client.post(
            "/api/v1/transfers/request",
            json={
                "attempt_id": test_attempt.id,
                "to_workstation": "WS-205",
                "reason": "Hardware issue"
            }
        )
        
        assert response.status_code == 401
    
    def test_approve_transfer_success(self, client, db_session, auth_headers_hall_in_charge, test_user, test_attempt):
        """POST /transfers/{id}/approve - Success"""
        # Create pending transfer
        transfer = Transfer(
            attempt_id=test_attempt.id,
            from_workstation="WS-101",
            to_workstation="WS-205",
            requested_by_id=test_user.id,
            status=TransferStatus.PENDING,
            reason="Issue"
        )
        db_session.add(transfer)
        db_session.commit()
        
        response = client.post(
            f"/api/v1/transfers/{transfer.id}/approve",
            headers=auth_headers_hall_in_charge,
            json={"approved": True}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert data["migration_checksum"] is not None
    
    def test_reject_transfer_success(self, client, db_session, auth_headers_hall_in_charge, test_user, test_attempt):
        """POST /transfers/{id}/approve - Rejection"""
        transfer = Transfer(
            attempt_id=test_attempt.id,
            from_workstation="WS-101",
            to_workstation="WS-205",
            requested_by_id=test_user.id,
            status=TransferStatus.PENDING,
            reason="Issue"
        )
        db_session.add(transfer)
        db_session.commit()
        
        response = client.post(
            f"/api/v1/transfers/{transfer.id}/approve",
            headers=auth_headers_hall_in_charge,
            json={
                "approved": False,
                "reason": "Insufficient justification"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "rejected"
        assert "Insufficient" in data["error_message"]
    
    def test_approve_transfer_forbidden_student(self, client, db_session, auth_headers_student, test_user, test_attempt):
        """POST /transfers/{id}/approve - Forbidden (not hall_in_charge)"""
        transfer = Transfer(
            attempt_id=test_attempt.id,
            from_workstation="WS-101",
            to_workstation="WS-205",
            requested_by_id=test_user.id,
            status=TransferStatus.PENDING,
            reason="Issue"
        )
        db_session.add(transfer)
        db_session.commit()
        
        response = client.post(
            f"/api/v1/transfers/{transfer.id}/approve",
            headers=auth_headers_student,
            json={"approved": True}
        )
        
        assert response.status_code == 403
    
    def test_list_transfers_student_sees_own(self, client, db_session, auth_headers_student, test_user, test_attempt):
        """GET /transfers - Student sees only own transfers"""
        # Create transfer for test user
        transfer1 = Transfer(
            attempt_id=test_attempt.id,
            from_workstation="WS-101",
            to_workstation="WS-205",
            requested_by_id=test_user.id,
            status=TransferStatus.PENDING,
            reason="My issue"
        )
        db_session.add(transfer1)
        
        # Create another user and transfer
        other_user = User(
            email="other@example.com",
            username="other",
            hashed_password="hashed",
            full_name="Other User"
        )
        db_session.add(other_user)
        db_session.flush()
        
        other_attempt = StudentAttempt(
            student_id=other_user.id,
            exam_id=test_attempt.exam_id,
            status=AttemptStatus.IN_PROGRESS,
            workstation_id="WS-999"
        )
        db_session.add(other_attempt)
        db_session.flush()
        
        transfer2 = Transfer(
            attempt_id=other_attempt.id,
            from_workstation="WS-999",
            to_workstation="WS-888",
            requested_by_id=other_user.id,
            status=TransferStatus.PENDING,
            reason="Other issue"
        )
        db_session.add(transfer2)
        db_session.commit()
        
        response = client.get(
            "/api/v1/transfers",
            headers=auth_headers_student
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Student should only see their own transfer
        assert data["total"] == 1
        assert len(data["transfers"]) == 1
        assert data["transfers"][0]["id"] == transfer1.id
    
    def test_list_transfers_pagination(self, client, db_session, auth_headers_student, test_user, test_attempt):
        """GET /transfers - Pagination works"""
        # Create multiple transfers
        for i in range(5):
            transfer = Transfer(
                attempt_id=test_attempt.id,
                from_workstation="WS-101",
                to_workstation=f"WS-{200+i}",
                requested_by_id=test_user.id,
                status=TransferStatus.COMPLETED,
                reason=f"Issue {i+1}"
            )
            db_session.add(transfer)
        db_session.commit()
        
        response = client.get(
            "/api/v1/transfers?page=1&page_size=2",
            headers=auth_headers_student
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 5
        assert len(data["transfers"]) == 2
        assert data["page"] == 1
        assert data["page_size"] == 2
    
    def test_get_transfer_details(self, client, db_session, auth_headers_student, test_user, test_attempt):
        """GET /transfers/{id} - Get details"""
        transfer = Transfer(
            attempt_id=test_attempt.id,
            from_workstation="WS-101",
            to_workstation="WS-205",
            requested_by_id=test_user.id,
            status=TransferStatus.COMPLETED,
            reason="Issue",
            migration_checksum="abc123"
        )
        db_session.add(transfer)
        db_session.commit()
        
        response = client.get(
            f"/api/v1/transfers/{transfer.id}",
            headers=auth_headers_student
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == transfer.id
        assert data["migration_checksum"] == "abc123"


# ========================================
# Audit Logging Tests
# ========================================

class TestAuditLogging:
    """Test audit trail for transfers"""
    
    @pytest.mark.asyncio
    async def test_audit_log_created_on_request(self, db_session, test_user, test_exam, test_attempt):
        """Verify audit log on transfer request"""
        await TransferService.create_transfer_request(
            db=db_session,
            attempt_id=test_attempt.id,
            to_workstation="WS-205",
            reason="Hardware issue",
            user=test_user,
            ip_address="192.168.1.50",
            user_agent="Mozilla/5.0"
        )
        
        audit_log = db_session.query(AuditLog).filter(
            AuditLog.event_type == "transfer_requested"
        ).first()
        
        assert audit_log is not None
        assert audit_log.user_id == test_user.id
        assert audit_log.username == test_user.username
        assert audit_log.attempt_id == test_attempt.id
        assert audit_log.event_category == "transfer"
        assert audit_log.ip_address == "192.168.1.50"
        assert audit_log.user_agent == "Mozilla/5.0"
        assert audit_log.success == 1
        assert "WS-205" in audit_log.details["to_workstation"]
    
    @pytest.mark.asyncio
    async def test_audit_log_on_approval(self, db_session, test_user, test_exam, test_attempt, test_hall_in_charge):
        """Verify audit logs on approval (approved + completed)"""
        transfer = Transfer(
            attempt_id=test_attempt.id,
            from_workstation="WS-101",
            to_workstation="WS-205",
            requested_by_id=test_user.id,
            status=TransferStatus.PENDING,
            reason="Issue"
        )
        db_session.add(transfer)
        db_session.commit()
        
        await TransferService.approve_transfer(
            db=db_session,
            transfer_id=transfer.id,
            approver=test_hall_in_charge,
            ip_address="192.168.1.100",
            user_agent="Admin Browser"
        )
        
        # Check approval log
        approval_log = db_session.query(AuditLog).filter(
            AuditLog.transfer_id == transfer.id,
            AuditLog.event_type == "transfer_approved"
        ).first()
        assert approval_log is not None
        assert approval_log.user_id == test_hall_in_charge.id
        
        # Check completion log
        completion_log = db_session.query(AuditLog).filter(
            AuditLog.transfer_id == transfer.id,
            AuditLog.event_type == "transfer_completed"
        ).first()
        assert completion_log is not None
        assert completion_log.success == 1
        assert "migration_checksum" in completion_log.details


# ========================================
# Fixtures
# ========================================

@pytest.fixture
def test_exam(db_session):
    """Create test exam"""
    exam = Exam(
        title="Test Exam",
        description="Test exam for transfers",
        duration_minutes=60,
        total_marks=100,
        passing_marks=40,
        is_published=True
    )
    db_session.add(exam)
    db_session.commit()
    db_session.refresh(exam)
    return exam


@pytest.fixture
def test_attempt(db_session, test_user, test_exam):
    """Create test attempt in progress"""
    attempt = StudentAttempt(
        student_id=test_user.id,
        exam_id=test_exam.id,
        status=AttemptStatus.IN_PROGRESS,
        started_at=datetime.utcnow(),
        workstation_id="WS-101",
        transfer_count=0
    )
    db_session.add(attempt)
    db_session.commit()
    db_session.refresh(attempt)
    return attempt


@pytest.fixture
def test_hall_in_charge(db_session, test_roles):
    """Create hall in-charge user"""
    hall_role = next(r for r in test_roles if r.name == "hall_in_charge")
    
    user = User(
        email="hall@example.com",
        username="hall_admin",
        hashed_password="hashed",
        full_name="Hall Administrator",
        is_active=True
    )
    user.roles.append(hall_role)
    
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers_hall_in_charge(client, test_hall_in_charge):
    """Get authentication headers for hall in-charge"""
    # Mock login for hall in-charge
    with patch('app.api.auth.verify_password', return_value=True):
        response = client.post(
            "/api/v1/auth/login",
            json={"username": "hall_admin", "password": "password"}
        )
    
    if response.status_code == 200:
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    # Fallback: create token directly
    from app.core.security import create_access_token
    token = create_access_token({"sub": test_hall_in_charge.username})
    return {"Authorization": f"Bearer {token}"}
